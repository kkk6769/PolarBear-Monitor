package monitor

import (
	"context"
	"log"
	"math"
	"runtime"
	"sync/atomic"
	"time"

	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/disk"
	"github.com/shirou/gopsutil/v4/host"
	"github.com/shirou/gopsutil/v4/load"
	"github.com/shirou/gopsutil/v4/mem"
	"github.com/shirou/gopsutil/v4/net"

	"github.com/polarbear/monitor/model"
)

var (
	Version string

	netInSpeed, netOutSpeed, netInTransfer, netOutTransfer uint64
	lastUpdateNetStats                                     uint64
)

// GetHost 获取主机静态信息
func GetHost() *model.Host {
	var ret model.Host

	hi, err := host.Info()
	if err == nil {
		ret.Platform = hi.Platform
		ret.PlatformVersion = hi.PlatformVersion
		ret.Arch = hi.KernelArch
		ret.BootTime = hi.BootTime
	}

	// CPU 型号
	ci, err := cpu.InfoWithContext(context.Background())
	if err == nil {
		cpuModelCount := make(map[string]int)
		for _, c := range ci {
			cpuModelCount[c.ModelName] += int(c.Cores)
		}
		for model, count := range cpuModelCount {
			ret.CPU = append(ret.CPU, model)
			_ = count
		}
	}

	// 内存总量
	if vm, err := mem.VirtualMemory(); err == nil {
		ret.MemTotal = vm.Total
	}
	// Swap 总量
	if sm, err := mem.SwapMemory(); err == nil {
		ret.SwapTotal = sm.Total
	}
	// 磁盘总量
	if partitions, err := disk.Partitions(false); err == nil {
		for _, p := range partitions {
			if usage, err := disk.Usage(p.Mountpoint); err == nil {
				ret.DiskTotal += usage.Total
			}
		}
	}

	ret.Version = Version
	return &ret
}

// GetState 获取实时系统状态
func GetState() *model.HostState {
	ret := &model.HostState{}

	// CPU 占用率
	if cpuPercent, err := cpu.PercentWithContext(context.Background(), 0, false); err == nil && len(cpuPercent) > 0 {
		// 取所有核心平均值
		sum := 0.0
		for _, p := range cpuPercent {
			sum += p
		}
		ret.CPU = math.Round(sum/float64(len(cpuPercent))*100) / 100
	}

	// 内存
	if vm, err := mem.VirtualMemory(); err == nil {
		ret.MemUsed = vm.Used
	}
	// Swap
	if sm, err := mem.SwapMemory(); err == nil {
		ret.SwapUsed = sm.Used
	}

	// 磁盘用量
	if partitions, err := disk.Partitions(false); err == nil {
		for _, p := range partitions {
			if usage, err := disk.Usage(p.Mountpoint); err == nil {
				ret.DiskUsed += usage.Used
			}
		}
	}

	// 网络速率与流量
	if netIO, err := net.IOCounters(false); err == nil && len(netIO) > 0 {
		nowNetInTransfer := netIO[0].BytesRecv
		nowNetOutTransfer := netIO[0].BytesSent
		now := uint64(time.Now().Unix())

		ret.NetInTransfer = nowNetInTransfer
		ret.NetOutTransfer = nowNetOutTransfer

		if lastUpdateNetStats > 0 {
			interval := now - lastUpdateNetStats
			if interval > 0 {
				netInSpeed = (nowNetInTransfer - netInTransfer) / interval
				netOutSpeed = (nowNetOutTransfer - netOutTransfer) / interval
			}
		}

		lastUpdateNetStats = now
		netInTransfer = nowNetInTransfer
		netOutTransfer = nowNetOutTransfer
	}
	ret.NetInSpeed = atomic.LoadUint64(&netInSpeed)
	ret.NetOutSpeed = atomic.LoadUint64(&netOutSpeed)

	// 系统负载
	if ld, err := load.Avg(); err == nil {
		ret.Load1 = ld.Load1
		ret.Load5 = ld.Load5
		ret.Load15 = ld.Load15
	}

	// 运行时长
	if hi, err := host.Info(); err == nil {
		ret.Uptime = hi.Uptime
	}

	return ret
}

// Init 初始化监控模块
func Init() {
	_ = runtime.NumCPU()
	log.Printf("monitor: initialized, CPU cores: %d", runtime.NumCPU())
}
