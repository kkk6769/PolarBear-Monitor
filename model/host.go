package model

import (
	pb "github.com/polarbear/monitor/proto"
)

// Host 主机静态信息
type Host struct {
	Platform        string   `json:"platform"`
	PlatformVersion string   `json:"platform_version"`
	CPU             []string `json:"cpu"`
	MemTotal        uint64   `json:"mem_total"`
	DiskTotal       uint64   `json:"disk_total"`
	SwapTotal       uint64   `json:"swap_total"`
	Arch            string   `json:"arch"`
	BootTime        uint64   `json:"boot_time"`
	Version         string   `json:"version"`
}

// ToPB 转换为 Protobuf Host
func (h *Host) ToPB() *pb.Host {
	return &pb.Host{
		Platform:        h.Platform,
		PlatformVersion: h.PlatformVersion,
		Cpu:             h.CPU,
		MemTotal:        h.MemTotal,
		DiskTotal:       h.DiskTotal,
		SwapTotal:       h.SwapTotal,
		Arch:            h.Arch,
		BootTime:        h.BootTime,
		Version:         h.Version,
	}
}

// PB2Host 从 Protobuf Host 转换
func PB2Host(pb *pb.Host) *Host {
	return &Host{
		Platform:        pb.GetPlatform(),
		PlatformVersion: pb.GetPlatformVersion(),
		CPU:             pb.GetCpu(),
		MemTotal:        pb.GetMemTotal(),
		DiskTotal:       pb.GetDiskTotal(),
		SwapTotal:       pb.GetSwapTotal(),
		Arch:            pb.GetArch(),
		BootTime:        pb.GetBootTime(),
		Version:         pb.GetVersion(),
	}
}
