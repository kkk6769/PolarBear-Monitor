package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
	"sigs.k8s.io/yaml"

	"github.com/polarbear/monitor/agent/monitor"
	pb "github.com/polarbear/monitor/proto"
)

var version = "dev"

// AgentConfig Agent 配置
type AgentConfig struct {
	Server      string `yaml:"server"`
	UUID        string `yaml:"uuid"`
	ReportDelay uint32 `yaml:"report_delay"`
	Debug       bool   `yaml:"debug"`
}

func main() {
	configPath := flag.String("c", "agent.yaml", "配置文件路径")
	showVersion := flag.Bool("v", false, "显示版本号")
	flag.Parse()

	if *showVersion {
		fmt.Printf("PolarBear Agent %s\n", version)
		os.Exit(0)
	}

	// 加载配置
	cfg, err := loadConfig(*configPath)
	if err != nil {
		log.Fatalf("加载配置失败: %v", err)
	}

	if cfg.Debug {
		log.Printf("[DEBUG] 配置: server=%s uuid=%s delay=%ds",
			cfg.Server, cfg.UUID, cfg.ReportDelay)
	}

	monitor.Version = version
	monitor.Init()

	// 信号处理
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, os.Kill)
	go func() {
		<-sigCh
		log.Println("收到停止信号，正在退出...")
		cancel()
	}()

	// 连接循环（自动重连）
	for ctx.Err() == nil {
		if err := run(ctx, cfg); err != nil {
			log.Printf("运行错误: %v，10秒后重试...", err)
			select {
			case <-ctx.Done():
				return
			case <-time.After(10 * time.Second):
			}
		}
	}
}

func loadConfig(path string) (*AgentConfig, error) {
	cfg := &AgentConfig{
		Server:      "127.0.0.1:8090",
		ReportDelay: 1,
		UUID:        fmt.Sprintf("agent-%d", time.Now().UnixNano()),
	}

	data, err := os.ReadFile(path)
	if err != nil {
		if !os.IsNotExist(err) {
			return nil, fmt.Errorf("读取配置文件失败: %w", err)
		}
		// 文件不存在，使用默认值并写入默认配置
		defaultData, _ := yaml.Marshal(cfg)
		os.WriteFile(path, defaultData, 0644)
		log.Printf("已生成默认配置文件: %s", path)
		return cfg, nil
	}

	if err := yaml.Unmarshal(data, cfg); err != nil {
		return nil, fmt.Errorf("解析配置失败: %w", err)
	}

	// 环境变量覆盖
	if v := os.Getenv("NZ_SERVER"); v != "" {
		cfg.Server = v
	}
	if v := os.Getenv("NZ_UUID"); v != "" {
		cfg.UUID = v
	}

	return cfg, nil
}

func run(ctx context.Context, cfg *AgentConfig) error {
	opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}

	// auth interceptor: attach client-uuid to every gRPC call
	opts = append(opts, grpc.WithUnaryInterceptor(func(ctx context.Context, method string, req, reply interface{}, cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption) error {
		md := metadata.Pairs("client-uuid", cfg.UUID)
		ctx = metadata.NewOutgoingContext(ctx, md)
		return invoker(ctx, method, req, reply, cc, opts...)
	}))

	// stream auth interceptor
	opts = append(opts, grpc.WithStreamInterceptor(func(ctx context.Context, desc *grpc.StreamDesc, cc *grpc.ClientConn, method string, streamer grpc.Streamer, opts ...grpc.CallOption) (grpc.ClientStream, error) {
		md := metadata.Pairs("client-uuid", cfg.UUID)
		ctx = metadata.NewOutgoingContext(ctx, md)
		return streamer(ctx, desc, cc, method, opts...)
	}))

	if cfg.Debug {
		log.Printf("[DEBUG] 正在连接 Dashboard: %s", cfg.Server)
	}

	conn, err := grpc.NewClient(cfg.Server, opts...)
	if err != nil {
		return fmt.Errorf("连接 Dashboard 失败: %w", err)
	}
	defer conn.Close()

	client := pb.NewMonitorServiceClient(conn)

	// 第一步：上报主机静态信息
	hostInfo := monitor.GetHost()
	if cfg.Debug {
		log.Printf("[DEBUG] 上报主机信息: %+v", hostInfo)
	}
	receipt, err := client.ReportSystemInfo(ctx, hostInfo.ToPB())
	if err != nil {
		return fmt.Errorf("上报主机信息失败: %w", err)
	}
	if cfg.Debug {
		log.Printf("[DEBUG] 主机信息上报结果: ok=%v", receipt.GetOk())
	}

	// 第二步：启动流式上报实时状态
	stream, err := client.ReportSystemState(ctx)
	if err != nil {
		return fmt.Errorf("启动状态上报流失败: %w", err)
	}

	ticker := time.NewTicker(time.Duration(cfg.ReportDelay) * time.Second)
	defer ticker.Stop()

	log.Printf("✅ 已连接 Dashboard，开始上报状态（间隔：%ds）", cfg.ReportDelay)

	for {
		select {
		case <-ctx.Done():
			log.Println("Agent 退出")
			stream.CloseAndRecv()
			return nil
		case <-ticker.C:
			state := monitor.GetState()
			if cfg.Debug {
				log.Printf("[DEBUG] 上报状态: CPU=%.1f%% Mem=%dMB NetIn=%dKB/s NetOut=%dKB/s",
					state.CPU, state.MemUsed/1024/1024, state.NetInSpeed/1024, state.NetOutSpeed/1024)
			}
			if err := stream.Send(state.ToPB()); err != nil {
				return fmt.Errorf("发送状态失败: %w", err)
			}
		}
	}
}
