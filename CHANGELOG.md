# Changelog

本文件记录 PolarBear Monitor 所有值得关注的变更，格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

---

## [Version---1.7]

### 新增
- **React 前端重写**：Vite + React 18 + Tailwind CSS v3 替代纯 HTML
  - 借鉴 nezha-dash 美术风格暖石深色主题（`#171412` 背景）
  - Framer Motion 动画（卡片入场滑入、熊图标摇摆、脉冲在线灯）
  - Recharts 实时折线图（CPU / 内存+Swap / 磁盘 / 网络上下行）
  - Lucide React 图标库
- **服务器详情页** (`/server/:id`)：点击卡片进入
  - 顶部信息区：运行时间、架构、内存/磁盘总量、国旗、系统、CPU、负载、累计流量
  - 折线图面板：CPU 全宽 + 内存/Swap 磁盘双列 + 网络双列
  - Tooltip 显示精确到秒的上报时间
- **统计概览卡片**：主页顶部 Total / Online / Offline / Network 四卡片
- **WebSocket Context**：WSProvider 跨页面共享连接，详情页不重连
- **磁盘 IO 监控**：Agent 采集 `disk.IOCounters()` 读写速率（差分计算）
- **Favicon 自托管**：`frontend-dist/favicon.png`，不再依赖外部 URL
- **编译规范**：强制清理 `frontend-dist/assets` + Vite 缓存 + Go 缓存后重建
- **多语言支持**：新增中文/英文切换选项

### 修复
- 版本更新，无修复项目

### 变更
- 新的前端UI

### 移除
- 旧的纯 HTML/CSS 前端（`index.html` , `admin.html` 保留为管理后台）

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