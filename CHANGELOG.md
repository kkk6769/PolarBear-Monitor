# Changelog

本文件记录 PolarBear Monitor 所有值得关注的变更，格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

---

## [Version---1.7] — 2026-06-26

### 新增
- **React 前端重写**：Vite + React 18 + Tailwind CSS v3 替代纯 HTML
  - 机甲灰 + 电光蓝配色（`#16161c` 深色背景 / `#f5f5f7` 浅色背景）
  - Framer Motion 动画（卡片入场滑入、熊图标摇摆、脉冲在线灯、时钟逐字翻页）
  - Recharts 实时折线图（CPU / 内存+Swap / 磁盘 / 网络上下行）
  - Lucide React 图标库
- **深浅主题切换**：CSS 变量方案，一键切换，偏好存 localStorage
  - 深色：背景 `#16161c` · 卡片 `#2C2C34` · 文字 `#e8e8ed`
  - 浅色：背景 `#f5f5f7` · 卡片 `#ffffff` · 文字 `#1a1a21`
  - 图表 Tooltip、网格线、Y轴标签全部跟随主题
- **服务器详情页** (`/server/:id`)：点击卡片进入
  - 顶部信息区：运行时间、架构、内存/磁盘总量、国旗、系统、CPU、负载、累计流量
  - 折线图面板：CPU 全宽 + 内存/Swap 磁盘双列 + 网络双列
  - Tooltip 显示精确到秒的上报时间
- **统计概览卡片**：主页顶部总计/在线/离线/网络四卡片，网络卡片分上行下行、速率+累计
- **WebSocket Context**：WSProvider 跨页面共享连接，详情页不重连
- **磁盘 IO 监控**：Agent 采集 `disk.IOCounters()` 读写速率（差分计算）
- **实时时钟**："当前时间 hh:mm:ss" 每秒刷新，仅变化数字播放翻页动画
- **模块化 i18n 多语言**：右上角语言切换（中/EN），翻译文件独立可扩展
  - `frontend/src/i18n/` 结构：`types.ts` → `zh.ts` / `en.ts` → `index.tsx` (Context)
  - 添加新语言仅需新建一个翻译文件
- **安装脚本**：`install.sh` 新增选项 9 — 更新 Agent（保留配置、失败回滚）

### 修复
- 修复折线图在生产环境跳动异常：节流从错误的 `n%1===0` 改为时间差 ≥1s
- 修复折线图数据窗口过窄：从固定条数 `slice(-60)` 改为 60 秒时间窗口过滤
- 修复 `install.sh` 与 `Run Folder` 脚本不同步

### 变更
- 全部 UI 英文翻译为中文（CPU/MEM/Swap/品牌名保留）
- "你好" → "欢迎使用" · 服务器地区前加 📍 · ON/OFF → 在线/离线 · Disk → 磁盘
- 运行时间单位改为通用缩写 `d/h/m/s`，前端按语言格式化
- GeoIP 国家查询改为英文名，前端按 UI 语言实时翻译

### 移除
- 旧的纯 HTML/CSS 前端（`index.html` 保留，`admin.html` 保留为管理后台）

---

## [Version---1.6]

### 新增
- 添加 `.gitignore`，排除编译产物、运行时数据和 IDE 配置文件
- 项目托管至 GitHub: https://github.com/kkk6769/PolarBear-Monitor
- `Run Folder (Build in there)/` 纳入版本控制，方便直接下载预编译二进制

### 修复
- 修复 Agent 上报正常但 Dashboard 显示离线的 Bug（双流竞态 + 丢弃模式导致永久离线）
  - `ReportSystemState` UUID 查找不再要求 `Online=true`
  - 每次成功接收数据时恢复 `Online=true`，防御旧流关闭覆盖
  - 未知 UUID 的流立即`SendAndClose` 拒绝，迫使 Agent 重新注册而非静默丢弃
- 修复管理后台保存等待过久（~3s → ~0.1s）：PATCH 请求从串行改为 `Promise.all()` 并发 + 仅发送变更项

### 变更
- 所有部署脚本下载地址从源地址 迁移至 GitHub Raw
- README 中的一键部署命令同步更新为新地址

### 移除
- 

---