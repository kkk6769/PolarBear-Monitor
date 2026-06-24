package model

import (
	pb "github.com/polarbear/monitor/proto"
)

// HostState 实时系统状态
type HostState struct {
	CPU            float64 `json:"cpu"`
	MemUsed        uint64  `json:"mem_used"`
	SwapUsed       uint64  `json:"swap_used"`
	DiskUsed       uint64  `json:"disk_used"`
	NetInTransfer  uint64  `json:"net_in_transfer"`
	NetOutTransfer uint64  `json:"net_out_transfer"`
	NetInSpeed     uint64  `json:"net_in_speed"`
	NetOutSpeed    uint64  `json:"net_out_speed"`
	Uptime         uint64  `json:"uptime"`
	Load1          float64 `json:"load1"`
	Load5          float64 `json:"load5"`
	Load15         float64 `json:"load15"`
}

// ToPB 转换为 Protobuf State
func (s *HostState) ToPB() *pb.State {
	return &pb.State{
		Cpu:            s.CPU,
		MemUsed:        s.MemUsed,
		SwapUsed:       s.SwapUsed,
		DiskUsed:       s.DiskUsed,
		NetInTransfer:  s.NetInTransfer,
		NetOutTransfer: s.NetOutTransfer,
		NetInSpeed:     s.NetInSpeed,
		NetOutSpeed:    s.NetOutSpeed,
		Uptime:         s.Uptime,
		Load1:          s.Load1,
		Load5:          s.Load5,
		Load15:         s.Load15,
	}
}

// PB2State 从 Protobuf State 转换
func PB2State(pb *pb.State) *HostState {
	return &HostState{
		CPU:            pb.GetCpu(),
		MemUsed:        pb.GetMemUsed(),
		SwapUsed:       pb.GetSwapUsed(),
		DiskUsed:       pb.GetDiskUsed(),
		NetInTransfer:  pb.GetNetInTransfer(),
		NetOutTransfer: pb.GetNetOutTransfer(),
		NetInSpeed:     pb.GetNetInSpeed(),
		NetOutSpeed:    pb.GetNetOutSpeed(),
		Uptime:         pb.GetUptime(),
		Load1:          pb.GetLoad1(),
		Load5:          pb.GetLoad5(),
		Load15:         pb.GetLoad15(),
	}
}
