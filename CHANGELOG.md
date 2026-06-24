# Changelog

本文件记录 PolarBear Monitor 所有值得关注的变更，格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

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