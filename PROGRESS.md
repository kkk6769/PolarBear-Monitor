# PolarBear Monitor — 开发进度

> 最后更新: 2026-06-26

---

## v1.7 (2026-06-26)

### 前端

| 功能 | 说明 |
|------|------|
| React SPA | Vite 8 + React 18 + TypeScript，替代纯 HTML |
| Tailwind CSS v3 | PostCSS + `.mjs` 配置，Nezha 暖石深色主题 |
| Framer Motion | 卡片入场动画、熊图标摇摆、脉冲在线指示灯 |
| Recharts 图表 | AreaChart 实时折线图，1s 刷新，精准 Tooltip |
| React Router | `/` 主页 + `/server/:id` 详情页 |
| WSContext | WebSocket Context Provider，跨页面共享数据 |
| ServerOverview | 顶部四卡片统计：Total / Online / Offline / Network |
| ServerCard | Nezha 风格紧凑卡片：5 列指标 + 在线脉冲灯 + 国旗 |
| ServerDetail | 详情页：Header + 信息行 + 折线图面板 |
| Footer | 页脚：服务器计数 |
| 响应式布局 | 移动端单列 → 桌面端双列卡片 |

### 后端

| 功能 | 说明 |
|------|------|
| 磁盘 IO 监控 | Agent `disk.IOCounters()` 汇总读写速率，差分计算 |
| 负载格式化 | `fmt.Sprintf("%.1f")` 一位小数 |
| 磁盘 IO API 字段 | `DiskReadSpeedFmt` / `DiskWriteSpeedFmt` |

### Bug 修复

| Bug | 修复 |
|-----|------|
| Agent 离线误判 | 双流竞态：UUID 匹配不再要求 Online=true，接收数据时恢复 Online |
| 管理后台保存缓慢 | 串行 PATCH → `Promise.all()` 并发 + `_dirty` 脏标记 |
| 图表 Tooltip 失效 | 移除 `syncId`、稳定 X 轴索引、节流 1s 渲染 |
| 负载过多小数位 | `%.2f` → `%.1f`，详情页使用格式化字符串 |
| 中文编码损坏 | PowerShell `Set-Content` → Python UTF-8 写入 |
| Lint 警告 | 移除 `unused serverID` 和 `unused stateLock` |

### 部署

| 项目 | 说明 |
|------|------|
| GitHub 仓库 | https://github.com/kkk6769/PolarBear-Monitor |
| 下载链接 | 全部迁移至 GitHub Raw |
| 编译规范 | 强制清理 assets + Vite 缓存 + Go 缓存后重建 |
| Favicon | 自托管 `frontend-dist/favicon.png` |

---

## v1.6 及之前

### Dashboard（面板）

| 功能 | 说明 |
|------|------|
| gRPC 服务端 | 接收 Agent 上报，监听 `:8090`（可配） |
| ReportSystemInfo | 接收主机静态信息，自动注册/更新服务器记录 |
| ReportSystemState | 接收实时状态流，更新到内存 + SQLite |
| HTTP API | 标准库 net/http，无框架依赖 |
| GET /api/v1/servers | 列出所有服务器（含实时状态 + 格式化字段） |
| GET /api/v1/server/:id | 查看单台服务器详情 |
| PATCH /api/v1/server/:id | 更新服务器名称、备注、排序 |
| DELETE /api/v1/server/:id | 删除离线服务器 |
| PUT /api/v1/reorder | 批量调整显示排序 |
| POST /api/v1/admin/login | 管理后台登录（bcrypt 验证 → HMAC Cookie） |
| POST /api/v1/admin/logout | 管理后台登出（服务端清除 HttpOnly Cookie）✅ 已修复 |
| GET /api/v1/admin/check | 检查登录状态 |
| WebSocket /ws | 实时推送全量服务器数据给所有浏览器 |
| 内嵌前端 | `//go:embed frontend-dist` 单文件部署 |
| 仪表盘页面 | 暗色主题，CSS Grid 卡片，CPU/内存/磁盘/网络/负载实时展示 |
| 管理后台 | 登录、排序、改名、备注、删除离线服务器 |
| 国旗图标 | 通过 ip-api.com 查询 IP 归属地，flagcdn.com 国旗 |
| IP 缓存 | 7 天缓存，私有/本地 IP 自动跳过 |
| 管理员认证 | 首次启动生成随机 15 位密码，bcrypt 存储 |
| 环境变量配置 | `POLARBEAR_HTTP_PORT` / `POLARBEAR_GRPC_PORT` / `POLARBEAR_DB_PATH` |
| 登出功能 | 服务端清除 HttpOnly Cookie ✅ 已修复 |

### Agent（探针）

| 功能 | 说明 |
|------|------|
| gRPC 客户端 | 连接 Dashboard，JSON 编码通信 |
| 自动重连 | 断线后 10 秒自动重连 |
| UUID 标识 | 通过 gRPC metadata `client-uuid` 标识自己 |
| CPU 采集 | 所有核心平均占用率 (%) |
| 内存采集 | 已用内存 (字节) |
| Swap 采集 | 已用交换分区 (字节) |
| 磁盘采集 | 所有分区已用总量 (字节) |
| 网络采集 | 累计流量 + 实时速率（差分计算） |
| 负载采集 | 1/5/15 分钟负载 |
| Uptime 采集 | 系统运行时长 |
| 静态信息上报 | OS、版本、架构、CPU 型号、内存/磁盘/Swap 总量 |
| YAML 配置 | `agent.yaml`，支持环境变量覆盖 `NZ_SERVER`/`NZ_UUID` |
| 默认配置生成 | 配置文件不存在时自动创建 |

### 编译与部署

| 功能 | 说明 |
|------|------|
| 交叉编译 | Linux amd64/arm64 + Windows amd64 |
| 静态编译 | `CGO_ENABLED=0`，无系统依赖 |
| 版本注入 | `-ldflags -X` 注入版本号 |
| 产物归位 | `Run Folder (Build in there)/` 按平台分类 |
| install.sh | Linux 交互式总控脚本 ✅ 已修复全部语法错误 |
| install-agent.sh | Linux Agent 一键安装 ✅ |
| install-agent.ps1 | Windows Agent 一键安装（VBS 后台 + 开机自启） |
| systemd 服务 | Dashboard + Agent systemd 配置 |
| 架构检测 | Dashboard/Agent 安装均自动识别 amd64/arm64 ✅ |
| Dashboard 更新 | 菜单 8：停服→备份→下载→启服，失败自动回滚 ✅ 已新增 |
| pause/require_root | bash 原生实现，消除 command not found ✅ 已修复 |

### 数据模型

| 模型 | 说明 |
|------|------|
| Server | GORM 数据库模型（UUID、名称、排序、Host/State JSON、IP、在线状态） |
| AdminSetting | 键值设置（admin_password bcrypt 哈希） |
| IPCache | IP 归属地缓存（7 天有效期） |
| Host / HostState | 共享模型，含 PB 互转方法 |
| ServerDisplay | 前端展示模型（含格式化可读字段） |
| FormatBytes / FormatUptime | 人类可读格式化工具 |

---

## 二、待修复 (Bug)

（暂无）

---

## 三、待新增 (Feature)

- 面板多UI支持,开放面板数据接口
- 默认UI新增历史数据。
- 默认UI新增折线图。
- 默认UI新增服务器全球分布。
- 默认UI新增点击服务器查看以上详细信息。

---

## 四、已知限制

- 仅支持 systemd Linux + Windows（无 OpenWrt procd 安装脚本）
- 无 TLS/证书支持
- 无告警/通知功能
- 无历史数据图表（仅实时展示）
- 无 Dashboard 到 Agent 的命令下发（设计如此）
- 前端无框架，纯原生 HTML/JS（设计如此）
- HTTP 框架为 net/http 标准库（设计如此）
- gRPC 编码为 JSON 而非 Protobuf（设计如此）
