package main

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"embed"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"log"
	"math/big"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/gorilla/websocket"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/peer"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/polarbear/monitor/model"
	pb "github.com/polarbear/monitor/proto"
)

// DashboardConfig 配置
type DashboardConfig struct {
	ListenHost string
	HTTPPort   int
	GRPCPort   int
	DBPath     string
}

var (
	conf DashboardConfig
	db   *gorm.DB

	serversMu sync.RWMutex
	servers   = make(map[uint64]*model.Server)

	wsClients   = make(map[*websocket.Conn]bool)
	wsClientsMu sync.Mutex
	wsUpgrader  = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}

	//go:embed frontend-dist
	frontendDist embed.FS

	//go:embed admin.html
	adminHTML string

	// auth
	authSecret []byte // HMAC secret for signing admin cookies
)

var geoClient = &http.Client{Timeout: 3 * time.Second}

func main() {
	configPath := flag.String("c", "dashboard.yaml", "config file path")
	showVersion := flag.Bool("v", false, "show version")
	flag.Parse()

	if *showVersion {
		fmt.Println("PolarBear Dashboard dev")
		return
	}

	_ = configPath
	conf = DashboardConfig{
		ListenHost: "0.0.0.0",
		HTTPPort:   envInt("POLARBEAR_HTTP_PORT", 8000),
		GRPCPort:   envInt("POLARBEAR_GRPC_PORT", 8090),
		DBPath:     envStr("POLARBEAR_DB_PATH", "data/polarbear.db"),
	}

	var err error
	if err := os.MkdirAll(filepath.Dir(conf.DBPath), 0755); err != nil {
		log.Fatalf("create data dir: %v", err)
	}
	db, err = gorm.Open(sqlite.Open(conf.DBPath), &gorm.Config{
		Logger: gormLogger(),
	})
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	db.AutoMigrate(&model.Server{}, &model.AdminSetting{}, &model.IPCache{})
	initAdminPassword()
	loadServersFromDB()

	grpcServer := createGRPCServer()
	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/v1/servers", handleListServers)
	mux.HandleFunc("/api/v1/server/", handleGetServer)
	mux.HandleFunc("/api/v1/reorder", handleReorder)
	mux.HandleFunc("/api/v1/admin/login", handleAdminLogin)
	mux.HandleFunc("/api/v1/admin/logout", handleAdminLogout)
	mux.HandleFunc("/api/v1/admin/check", handleAdminCheck)
	mux.HandleFunc("/admin", handleAdmin)
	mux.HandleFunc("/ws", handleWebSocket)

	// Frontend
	distFS, err := fs.Sub(frontendDist, "frontend-dist")
	if err == nil {
		mux.Handle("/", http.FileServer(http.FS(distFS)))
		log.Println("[frontend] embedded static files loaded")
	} else {
		mux.HandleFunc("/", handleIndexFallback)
	}

	// gRPC on separate port
	grpcAddr := fmt.Sprintf("%s:%d", conf.ListenHost, conf.GRPCPort)
	grpcLis, err := net.Listen("tcp", grpcAddr)
	if err != nil {
		log.Fatalf("grpc listen: %v", err)
	}
	go func() {
		log.Printf("[gRPC] listening on %s", grpcAddr)
		if err := grpcServer.Serve(grpcLis); err != nil {
			log.Fatalf("grpc serve: %v", err)
		}
	}()

	// HTTP on its own port
	httpAddr := fmt.Sprintf("%s:%d", conf.ListenHost, conf.HTTPPort)
	log.Printf("PolarBear Dashboard")
	log.Printf("  HTTP: %s | gRPC: %s | WS: /ws", httpAddr, grpcAddr)
	log.Fatal(http.ListenAndServe(httpAddr, mux))
}

func loadServersFromDB() {
	var svrs []model.Server
	db.Find(&svrs)
	serversMu.Lock()
	for i := range svrs {
		svrs[i].Online = false
		servers[svrs[i].ID] = &svrs[i]
	}
	serversMu.Unlock()
}

// ==================== gRPC ====================

type monitorServer struct {
	pb.UnimplementedMonitorServiceServer
}

func createGRPCServer() *grpc.Server {
	s := grpc.NewServer(grpc.Creds(insecure.NewCredentials()))
	pb.RegisterMonitorServiceServer(s, &monitorServer{})
	return s
}

// extractUUID 从 gRPC metadata 中提取 agent 的 client-uuid
func extractUUID(ctx context.Context) string {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return ""
	}
	vals := md.Get("client-uuid")
	if len(vals) == 0 {
		return ""
	}
	return vals[0]
}

// findOrCreateServer 根据 UUID 查找或创建服务器记录
func findOrCreateServer(uuid string) *model.Server {
	for _, s := range servers {
		if s.UUID == uuid {
			return s
		}
	}
	return &model.Server{UUID: uuid}
}

func (s *monitorServer) ReportSystemInfo(ctx context.Context, host *pb.Host) (*pb.Receipt, error) {
	h := model.PB2Host(host)
	uuid := extractUUID(ctx)
	ip := extractPeerIP(ctx)
	log.Printf("[agent] host info: %s %s (%s) uuid=%s ip=%s", h.Platform, h.PlatformVersion, h.Arch, uuid, ip)

	serversMu.Lock()
	svr := findOrCreateServer(uuid)
	if svr.Name == "" {
		svr.Name = friendlyName(h)
	}
	hostJSON, _ := json.Marshal(h)
	svr.Host = string(hostJSON)
	svr.IP = ip
	svr.LastActive = time.Now()
	svr.Online = true
	db.Save(svr)
	servers[svr.ID] = svr
	serversMu.Unlock()

	// async geo lookup (don't block the gRPC response)
	go updateGeoIP(svr.ID, ip)

	log.Printf("[agent] registered: id=%d uuid=%s name=%s", svr.ID, svr.UUID, svr.Name)
	broadcastServers()
	return &pb.Receipt{Ok: true}, nil
}

// extractPeerIP gets the agent's public IP from gRPC peer info
func extractPeerIP(ctx context.Context) string {
	p, ok := peer.FromContext(ctx)
	if !ok {
		return ""
	}
	addr := p.Addr.String()
	if host, _, err := net.SplitHostPort(addr); err == nil {
		return host
	}
	return addr
}

// updateGeoIP resolves IP country with 7-day cache
func updateGeoIP(serverID uint64, ip string) {
	if ip == "" || isPrivateIP(ip) {
		log.Printf("[geo] skip private/local IP: %s", ip)
		return
	}
	// check cache
	var cache model.IPCache
	if err := db.Where("ip = ?", ip).First(&cache).Error; err == nil {
		if time.Since(cache.UpdatedAt) < 7*24*time.Hour {
			return // still fresh
		}
	}
	// call ip-api.com (45 req/min free, no key)
	country, code := fetchIPCountry(ip)
	if country != "" {
		db.Save(&model.IPCache{IP: ip, Country: country, CountryCode: code, UpdatedAt: time.Now()})
		log.Printf("[geo] cached: %s → %s (%s)", ip, country, code)
	} else {
		// cache failures for 1h to avoid hammering the API
		db.Save(&model.IPCache{IP: ip, Country: "", CountryCode: "", UpdatedAt: time.Now().Add(-6*24*time.Hour - 23*time.Hour)})
		log.Printf("[geo] lookup failed, 1h cooldown: %s", ip)
	}
	broadcastServers()
}

func fetchIPCountry(ip string) (country, countryCode string) {
	resp, err := geoClient.Get("http://ip-api.com/json/" + ip + "?lang=zh-CN&fields=country,countryCode")
	if err != nil {
		log.Printf("[geo] request failed for %s: %v", ip, err)
		return "", ""
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 200))
		log.Printf("[geo] bad status %d for %s: %s", resp.StatusCode, ip, string(body))
		return "", ""
	}
	var result struct {
		Country     string `json:"country"`
		CountryCode string `json:"countryCode"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", ""
	}
	if result.CountryCode == "" {
		return "", ""
	}
	log.Printf("[geo] %s → %s (%s)", ip, result.Country, result.CountryCode)
	return result.Country, strings.ToUpper(result.CountryCode)
}

func isPrivateIP(ip string) bool {
	parsed := net.ParseIP(ip)
	if parsed == nil {
		return true
	}
	return parsed.IsLoopback() || parsed.IsPrivate() || parsed.IsLinkLocalUnicast()
}

// friendlyName generates a default server name from host info
func friendlyName(h *model.Host) string {
	parts := strings.Split(h.Platform, " ")
	p := "Server"
	if len(parts) > 0 && parts[0] != "" {
		p = parts[0]
		// capitalize first letter
		if len(p) > 0 {
			p = strings.ToUpper(p[:1]) + p[1:]
		}
	}
	return fmt.Sprintf("%s-%s", p, h.Arch)
}

func (s *monitorServer) ReportSystemState(stream pb.MonitorService_ReportSystemStateServer) error {
	uuid := extractUUID(stream.Context())

	// 先确定该 stream 对应的 serverID
	serversMu.RLock()
	var serverID uint64
	for _, svr := range servers {
		if svr.UUID == uuid && svr.Online {
			serverID = svr.ID
			break
		}
	}
	serversMu.RUnlock()

	if serverID == 0 {
		log.Printf("[agent] stream for unknown uuid=%s, discarding", uuid)
		for {
			if _, err := stream.Recv(); err != nil {
				return err
			}
		}
	}

	for {
		state, err := stream.Recv()
		if err != nil {
			log.Printf("[agent] stream closed: uuid=%s id=%d err=%v", uuid, serverID, err)
			if serverID > 0 {
				serversMu.Lock()
				if svr, ok := servers[serverID]; ok {
					svr.Online = false
					db.Save(svr)
				}
				serversMu.Unlock()
				broadcastServers()
			}
			return err
		}
		inner := model.PB2State(state)
		serversMu.Lock()
		if svr, ok := servers[serverID]; ok {
			stateJSON, _ := json.Marshal(inner)
			svr.State = string(stateJSON)
			svr.LastActive = time.Now()
		}
		serversMu.Unlock()
		broadcastServers()
	}
}

// ==================== HTTP API ====================

func handleListServers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", 405)
		return
	}
	serversMu.RLock()
	displays := buildDisplayList()
	serversMu.RUnlock()
	writeJSON(w, displays)
}

func handleGetServer(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/v1/server/")
	if strings.Contains(idStr, "/") {
		idStr = strings.SplitN(idStr, "/", 2)[0]
	}

	switch r.Method {
	case http.MethodGet:
		serversMu.RLock()
		defer serversMu.RUnlock()
		for _, svr := range servers {
			if fmt.Sprintf("%d", svr.ID) == idStr {
				writeJSON(w, svrToDisplay(svr))
				return
			}
		}
		http.Error(w, `{"error":"not found"}`, 404)

	case http.MethodPatch:
		id, err := strconv.ParseUint(idStr, 10, 64)
		if err != nil {
			http.Error(w, `{"error":"invalid id"}`, 400)
			return
		}
		body, _ := io.ReadAll(r.Body)
		var form model.ServerUpdateForm
		if err := json.Unmarshal(body, &form); err != nil {
			http.Error(w, `{"error":"invalid json"}`, 400)
			return
		}
		serversMu.Lock()
		svr, ok := servers[id]
		if !ok {
			serversMu.Unlock()
			http.Error(w, `{"error":"not found"}`, 404)
			return
		}
		if form.Name != nil {
			svr.Name = *form.Name
		}
		if form.DisplayIndex != nil {
			svr.DisplayIndex = *form.DisplayIndex
		}
		if form.Note != nil {
			svr.Note = *form.Note
		}
		db.Save(svr)
		serversMu.Unlock()
		broadcastServers()
		writeJSON(w, map[string]string{"status": "ok"})

	case http.MethodDelete:
		id, err := strconv.ParseUint(idStr, 10, 64)
		if err != nil {
			http.Error(w, `{"error":"invalid id"}`, 400)
			return
		}
		serversMu.Lock()
		svr, ok := servers[id]
		if !ok {
			serversMu.Unlock()
			http.Error(w, `{"error":"not found"}`, 404)
			return
		}
		delete(servers, id)
		db.Delete(svr)
		serversMu.Unlock()
		broadcastServers()
		log.Printf("[admin] deleted server id=%d name=%s", id, svr.Name)
		writeJSON(w, map[string]string{"status": "deleted"})

	default:
		http.Error(w, "method not allowed", 405)
	}
}

// handleReorder 批量调整排序
func handleReorder(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "method not allowed", 405)
		return
	}
	body, _ := io.ReadAll(r.Body)
	var order []struct {
		ID           uint64 `json:"id"`
		DisplayIndex int    `json:"display_index"`
	}
	if err := json.Unmarshal(body, &order); err != nil {
		http.Error(w, `{"error":"invalid json"}`, 400)
		return
	}
	serversMu.Lock()
	for _, o := range order {
		if svr, ok := servers[o.ID]; ok {
			svr.DisplayIndex = o.DisplayIndex
			db.Save(svr)
		}
	}
	serversMu.Unlock()
	broadcastServers()
	writeJSON(w, map[string]string{"status": "ok"})
}

func handleIndexFallback(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprint(w, `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>PolarBear</title></head><body><h2>PolarBear Monitor</h2><p>Build frontend: <code>cd frontend && npm run build</code></p></body></html>`)
}

func handleAdmin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write([]byte(adminHTML))
}

// ==================== Admin Auth ====================

func initAdminPassword() {
	// generate HMAC secret for signing cookies
	authSecret = make([]byte, 32)
	rand.Read(authSecret)

	var setting model.AdminSetting
	if err := db.Where("key = ?", "admin_password").First(&setting).Error; err == nil {
		return // already initialized
	}
	// first deploy: generate random 15-char password
	pw := generatePassword(15)
	hash, _ := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	db.Create(&model.AdminSetting{Key: "admin_password", Value: string(hash)})
	log.Println("╔══════════════════════════════════════════╗")
	log.Println("║     🔐 管理后台初始密码 (仅显示一次)     ║")
	log.Printf("║         %s                  ║", pw)
	log.Println("╚══════════════════════════════════════════╝")
}

func generatePassword(length int) string {
	const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := make([]byte, length)
	for i := range result {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		result[i] = chars[n.Int64()]
	}
	return string(result)
}

func signToken() string {
	t := fmt.Sprintf("%d", time.Now().UnixMilli())
	mac := hmac.New(sha256.New, authSecret)
	mac.Write([]byte(t))
	return t + "." + hex.EncodeToString(mac.Sum(nil))
}

func verifyToken(token string) bool {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return false
	}
	mac := hmac.New(sha256.New, authSecret)
	mac.Write([]byte(parts[0]))
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(parts[1]), []byte(expected))
}

func handleAdminLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", 405)
		return
	}
	var body struct{ Password string }
	json.NewDecoder(r.Body).Decode(&body)

	var setting model.AdminSetting
	if err := db.Where("key = ?", "admin_password").First(&setting).Error; err != nil {
		writeJSON(w, map[string]interface{}{"ok": false, "error": "not initialized"})
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(setting.Value), []byte(body.Password)) != nil {
		writeJSON(w, map[string]interface{}{"ok": false, "error": "密码错误"})
		return
	}
	token := signToken()
	http.SetCookie(w, &http.Cookie{
		Name:     "admin_token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   86400,
	})
	writeJSON(w, map[string]interface{}{"ok": true})
}

func handleAdminLogout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "admin_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   -1,
	})
	writeJSON(w, map[string]string{"status": "ok"})
}

func handleAdminCheck(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("admin_token")
	if err != nil || !verifyToken(cookie.Value) {
		writeJSON(w, map[string]bool{"ok": false})
		return
	}
	writeJSON(w, map[string]bool{"ok": true})
}

// ==================== WebSocket ====================

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	wsClientsMu.Lock()
	wsClients[conn] = true
	wsClientsMu.Unlock()
	go broadcastServers()

	defer func() {
		wsClientsMu.Lock()
		delete(wsClients, conn)
		wsClientsMu.Unlock()
		conn.Close()
	}()
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}

func broadcastServers() {
	serversMu.RLock()
	displays := buildDisplayList()
	serversMu.RUnlock()
	msg, _ := json.Marshal(map[string]interface{}{"data": displays, "now": time.Now().Unix()})
	wsClientsMu.Lock()
	for c := range wsClients {
		c.WriteMessage(websocket.TextMessage, msg)
	}
	wsClientsMu.Unlock()
}

// ==================== Helpers ====================

func buildDisplayList() []model.ServerDisplay {
	list := make([]model.ServerDisplay, 0, len(servers))
	for _, svr := range servers {
		list = append(list, svrToDisplay(svr))
	}
	sort.SliceStable(list, func(i, j int) bool {
		if list[i].DisplayIndex != list[j].DisplayIndex {
			return list[i].DisplayIndex < list[j].DisplayIndex
		}
		return list[i].ID < list[j].ID
	})
	return list
}

func svrToDisplay(svr *model.Server) model.ServerDisplay {
	d := model.ServerDisplay{
		ID: svr.ID, UUID: svr.UUID, Name: svr.Name, Note: svr.Note,
		DisplayIndex: svr.DisplayIndex,
		Online:       svr.Online, LastActive: svr.LastActive.Format(time.RFC3339), IP: svr.IP,
	}
	// load cached country
	if svr.IP != "" {
		var cache model.IPCache
		if db.Where("ip = ?", svr.IP).First(&cache).Error == nil && cache.CountryCode != "" {
			d.IPCountry = cache.Country
			d.IPCode = cache.CountryCode
		}
	}
	if svr.Host != "" {
		var h model.Host
		json.Unmarshal([]byte(svr.Host), &h)
		d.Host = &h
	}
	if svr.State != "" {
		var s model.HostState
		json.Unmarshal([]byte(svr.State), &s)
		d.State = &s
		// human-readable formatted values
		d.CPUPercent = fmt.Sprintf("%.1f", s.CPU) + "%"
		d.MemUsedFmt = model.FormatBytes(s.MemUsed)
		d.MemTotalFmt = model.FormatBytes(hostField(svr, "mem_total"))
		d.DiskUsedFmt = model.FormatBytes(s.DiskUsed)
		d.DiskTotalFmt = model.FormatBytes(hostField(svr, "disk_total"))
		d.NetInSpeedFmt = model.FormatBytesPerSec(s.NetInSpeed)
		d.NetOutSpeedFmt = model.FormatBytesPerSec(s.NetOutSpeed)
		d.UptimeFmt = model.FormatUptime(s.Uptime)
		d.Load1 = fmt.Sprintf("%.2f", s.Load1)
		d.Load5 = fmt.Sprintf("%.2f", s.Load5)
		d.Load15 = fmt.Sprintf("%.2f", s.Load15)
		// percentages
		if memTotal := hostField(svr, "mem_total"); memTotal > 0 {
			d.MemPercent = int(float64(s.MemUsed) / float64(memTotal) * 100)
		}
		if diskTotal := hostField(svr, "disk_total"); diskTotal > 0 {
			d.DiskPercent = int(float64(s.DiskUsed) / float64(diskTotal) * 100)
		}
	}
	return d
}

func hostField(svr *model.Server, key string) uint64 {
	if svr.Host == "" {
		return 0
	}
	var h model.Host
	json.Unmarshal([]byte(svr.Host), &h)
	switch key {
	case "mem_total":
		return h.MemTotal
	case "disk_total":
		return h.DiskTotal
	}
	return 0
}

// gormLogger returns a logger that only logs real errors (not "record not found")
func gormLogger() logger.Interface {
	return logger.New(log.New(os.Stdout, "[db] ", log.LstdFlags), logger.Config{
		SlowThreshold:             200 * time.Millisecond,
		LogLevel:                  logger.Warn,
		IgnoreRecordNotFoundError: true,
		Colorful:                  false,
	})
}

// envStr reads an env var with a default fallback
func envStr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// envInt reads an env var as int with a default fallback
func envInt(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}
