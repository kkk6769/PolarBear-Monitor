# 🐻‍❄️ PolarBear Monitor

[![GitHub](https://img.shields.io/badge/GitHub-kkk6769%2FPolarBear--Monitor-blue?logo=github)](https://github.com/kkk6769/PolarBear-Monitor)

精简单向服务器监控系统。**Agent 只上报，Dashboard 只接收**——不对探针下发任何命令、不执行远程任务。

## 架构

```
Agent (探针) ──gRPC 单向流──► Dashboard (面板) ──WebSocket──► 浏览器
   │                              │
   │  采集指标                    │  存储 + 展示
   │  · CPU 占用率                │  · REST API
   │  · 内存 / Swap               │  · WebSocket 实时推送
   │  · 磁盘用量                  │  · SQLite 持久化
   │  · 网络速率 / 累计流量        │  · 内嵌 Web 前端（单文件部署）
   │  · 系统负载 (1/5/15m)        │  · IP 归属地查询 + 国旗
   │  · 运行时长                  │  · 管理后台（排序/改名/备注/删除）
```

## 平台支持

| 组件 | Linux amd64 | Linux arm64 | Windows amd64 |
|------|:-----------:|:-----------:|:-------------:|
| Dashboard | ✅ | ✅ | — |
| Agent | ✅ | ✅ | ✅ |

## 快速开始（开发）

### 1. 启动 Dashboard

```bash
go run ./dashboard/cmd/dashboard/
# HTTP :8000 | gRPC :8090 | 数据库 data/polarbear.db
# 首次启动会输出随机管理密码（仅显示一次）
```

### 2. 启动 Agent

```bash
go run ./agent/cmd/agent/ -c agent.yaml
# 默认连接 127.0.0.1:8090，每 1 秒上报
```

### 3. 打开浏览器

- 仪表盘：`http://localhost:8000`
- 管理后台：`http://localhost:8000/admin`

---

## 一键部署（生产）

### Dashboard

```bash
curl -sS -O https://raw.githubusercontent.com/kkk6769/PolarBear-Monitor/main/Run%20Folder%20(Build%20in%20there)/Linux%20Part/install.sh && chmod +x install.sh && sudo ./install.sh
```

交互式菜单：安装 Dashboard / Agent、更新 Dashboard（保留数据）、改端口、开关自启、卸载。

### Agent

```bash
# Linux
curl -fsSL https://raw.githubusercontent.com/kkk6769/PolarBear-Monitor/main/Run%20Folder%20(Build%20in%20there)/Linux%20Part/install-agent.sh | bash -s -- IP:PORT

# Windows PowerShell（以管理员身份运行）
irm https://raw.githubusercontent.com/kkk6769/PolarBear-Monitor/main/Run%20Folder%20(Build%20in%20there)/Windows%20Part/install-agent.ps1 | iex
Install-Agent -Server IP:PORT
```

---

## 配置

### Dashboard（环境变量）

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `POLARBEAR_HTTP_PORT` | `8000` | HTTP / WebSocket 端口 |
| `POLARBEAR_GRPC_PORT` | `8090` | gRPC 端口（Agent 连接此端口） |
| `POLARBEAR_DB_PATH` | `data/polarbear.db` | SQLite 数据库路径 |

### Agent（agent.yaml）

```yaml
server: 127.0.0.1:8090       # Dashboard gRPC 地址
uuid: ""                      # Agent UUID（留空自动生成）
report_delay: 1               # 上报间隔（秒）
debug: false                  # 调试模式
```

环境变量覆盖：`NZ_SERVER` → `server`，`NZ_UUID` → `uuid`。

---

## 源码

```bash
git clone https://github.com/kkk6769/PolarBear-Monitor.git
cd PolarBear-Monitor
```

## 编译

```bash
# 全部平台
make build-all

# 或单独编译
make agent-linux-amd64    # Linux Agent
make agent-windows-amd64  # Windows Agent
make dashboard-linux-amd64 # Linux Dashboard
```

# 单个目标
make agent-linux-amd64
make agent-linux-arm64
make agent-windows-amd64
make dashboard-linux-amd64
make dashboard-linux-arm64
```

产物输出至 `Run Folder (Build in there)/`，按平台分目录。

---

## API 参考

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/servers` | 列出所有服务器（含实时状态） |
| `GET` | `/api/v1/server/:id` | 单台服务器详情 |
| `PATCH` | `/api/v1/server/:id` | 更新名称、备注、排序 |
| `DELETE` | `/api/v1/server/:id` | 删除离线服务器 |
| `PUT` | `/api/v1/reorder` | 批量调整排序 |
| `POST` | `/api/v1/admin/login` | 管理后台登录 |
| `POST` | `/api/v1/admin/logout` | 管理后台登出 |
| `GET` | `/api/v1/admin/check` | 检查登录状态 |
| `WS` | `/ws` | WebSocket 实时数据推送 |

---

## 项目结构

---

polarbear-monitor/
├── proto/
│   ├── monitor.proto          # Protobuf 定义（仅上报 RPC，无命令下发）
│   ├── monitor.pb.go          # 消息结构体（JSON 编码，手写）
│   ├── monitor_grpc.pb.go     # gRPC Client/Server 接口（手写）
│   └── json_codec.go          # 替换 gRPC 编码为 JSON
├── model/
│   ├── host.go                # Host 静态信息 + PB 互转
│   ├── state.go               # HostState 实时指标 + PB 互转
│   ├── server.go              # Server GORM 数据库模型
│   ├── api.go                 # ServerDisplay 前端展示 + ServerUpdateForm
│   ├── admin_setting.go       # AdminSetting 键值设置
│   ├── ip_cache.go            # IPCache IP 归属地缓存
│   └── format.go              # FormatBytes / FormatUptime 工具函数
├── agent/
│   ├── cmd/agent/main.go      # 入口：连接 gRPC → ReportSystemInfo → 流式 ReportSystemState
│   └── monitor/monitor.go     # 指标采集：gopsutil/v4（CPU/内存/磁盘/网络/负载）
├── dashboard/
│   ├── cmd/dashboard/
│   │   ├── main.go            # 入口：gRPC Server + HTTP API + WebSocket + 前端
│   │   ├── admin.html         # 管理后台页面（内嵌）
│   │   └── frontend-dist/
│   │       └── index.html     # 仪表盘页面（内嵌）
│   ├── api/                   # （预留）
│   ├── rpc/                   # （预留）
│   └── store/                 # （预留）
├── deploy/
│   ├── install.sh             # Linux 交互式总控脚本
│   ├── install-agent.sh       # Linux Agent 一键安装
│   └── install-agent.ps1      # Windows Agent 一键安装
├── Run Folder (Build in there)/
│   ├── Linux Part/            # Linux 编译产物 + 安装脚本
│   └── Windows Part/          # Windows 编译产物 + 安装脚本
├── Makefile
├── go.mod
├── go.sum
├── README.md
└── PROGRESS.md

---

---

## 设计决策

| 决策 | 说明 |
|------|------|
| **纯单向通信** | Agent 只上报，Dashboard 不下发任何命令——安全、简单 |
| **net/http 标准库** | 零额外 HTTP 框架依赖 |
| **JSON 编码 gRPC** | 替换默认 Protobuf 编码，方便调试、兼容非 Go 客户端 |
| **SQLite + GORM** | 单文件数据库，零运维 |
| **内嵌前端** | `embed.FS` 打包进二进制，单文件部署 |
| **原生 HTML/JS 前端** | 无 React/Vue 依赖，极简加载 |
| **静态编译** | `CGO_ENABLED=0`，无 glibc 依赖，任意 Linux 可运行 |
| **~7 个直接依赖** | 对比哪吒监控的 50+，极致精简 |

## 已知限制

- 无 TLS 加密（建议配合 Nginx/Caddy 反向代理）
- 无告警/通知
- 无历史趋势图表（仅实时数据）
- 无多用户/权限系统
- OpenWrt 需手动配置 procd（参考 [PROGRESS.md](PROGRESS.md) 中的命令）
- 仅支持 systemd Linux（无 SysV/Upstart 自动配置）