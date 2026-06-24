# PolarBear Server Monitor
# 
# Agent（探针）只上报 → Dashboard（面板）只接收
# Agent 与 Dashboard 之间：纯单向 gRPC 流
# Dashboard 与浏览器之间：REST API + WebSocket 实时推送

.PHONY: all agent dashboard proto clean build-all

VERSION    ?= dev
LDFLAGS    := -s -w -X github.com/polarbear/monitor/agent/monitor.Version=$(VERSION)
DIST_DIR   := "Run Folder (Build in there)"

# ---------- all ----------
all: proto build-all

# ---------- proto ----------
proto:
	protoc --go_out=. --go-grpc_out=. proto/monitor.proto

# ---------- build-all (all platforms) ----------
build-all: clean-dist
	@echo "=== Building Dashboard (Linux only) ==="
	$(MAKE) dashboard-linux-amd64
	$(MAKE) dashboard-linux-arm64
	@echo "=== Building Agent (Linux + Windows) ==="
	$(MAKE) agent-linux-amd64
	$(MAKE) agent-linux-arm64
	$(MAKE) agent-windows-amd64
	@echo "=== Done! ==="
	@echo "Output: $(DIST_DIR)/"

# ---------- dashboard (Linux only) ----------
dashboard-linux-amd64:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o $(DIST_DIR)/Linux\ Part/dashboard/polarbear-dashboard ./dashboard/cmd/dashboard/

dashboard-linux-arm64:
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -ldflags "$(LDFLAGS)" -o $(DIST_DIR)/Linux\ Part/dashboard/polarbear-dashboard-arm64 ./dashboard/cmd/dashboard/

# ---------- agent (Linux + Windows) ----------
agent-linux-amd64:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o $(DIST_DIR)/Linux\ Part/agent/polarbear-agent ./agent/cmd/agent/

agent-linux-arm64:
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -ldflags "$(LDFLAGS)" -o $(DIST_DIR)/Linux\ Part/agent/polarbear-agent-arm64 ./agent/cmd/agent/

agent-windows-amd64:
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o $(DIST_DIR)/Windows\ Part/agent/polarbear-agent.exe ./agent/cmd/agent/

# ---------- test ----------
test:
	go test ./...

# ---------- clean ----------
clean-dist:
	@mkdir -p "$(DIST_DIR)/Linux Part/dashboard" "$(DIST_DIR)/Linux Part/agent" "$(DIST_DIR)/Windows Part/agent"
	@rm -f $(DIST_DIR)/Linux\ Part/dashboard/* $(DIST_DIR)/Linux\ Part/agent/* $(DIST_DIR)/Windows\ Part/agent/*

clean:
	rm -rf "$(DIST_DIR)/"
	rm -f *.exe
