package proto

// Host agent reports static host info to dashboard on first connect.
type Host struct {
	Platform        string   `json:"platform,omitempty"`
	PlatformVersion string   `json:"platform_version,omitempty"`
	Cpu             []string `json:"cpu,omitempty"`
	MemTotal        uint64   `json:"mem_total,omitempty"`
	DiskTotal       uint64   `json:"disk_total,omitempty"`
	SwapTotal       uint64   `json:"swap_total,omitempty"`
	Arch            string   `json:"arch,omitempty"`
	BootTime        uint64   `json:"boot_time,omitempty"`
	Version         string   `json:"version,omitempty"`
}

func (x *Host) Reset()      { *x = Host{} }
func (*Host) ProtoMessage() {}
func (x *Host) GetPlatform() string {
	if x != nil {
		return x.Platform
	}
	return ""
}
func (x *Host) GetPlatformVersion() string {
	if x != nil {
		return x.PlatformVersion
	}
	return ""
}
func (x *Host) GetCpu() []string {
	if x != nil {
		return x.Cpu
	}
	return nil
}
func (x *Host) GetMemTotal() uint64 {
	if x != nil {
		return x.MemTotal
	}
	return 0
}
func (x *Host) GetDiskTotal() uint64 {
	if x != nil {
		return x.DiskTotal
	}
	return 0
}
func (x *Host) GetSwapTotal() uint64 {
	if x != nil {
		return x.SwapTotal
	}
	return 0
}
func (x *Host) GetArch() string {
	if x != nil {
		return x.Arch
	}
	return ""
}
func (x *Host) GetBootTime() uint64 {
	if x != nil {
		return x.BootTime
	}
	return 0
}
func (x *Host) GetVersion() string {
	if x != nil {
		return x.Version
	}
	return ""
}

// State agent streams real-time system metrics to dashboard.
type State struct {
	Cpu            float64 `json:"cpu,omitempty"`
	MemUsed        uint64  `json:"mem_used,omitempty"`
	SwapUsed       uint64  `json:"swap_used,omitempty"`
	DiskUsed       uint64  `json:"disk_used,omitempty"`
	NetInTransfer  uint64  `json:"net_in_transfer,omitempty"`
	NetOutTransfer uint64  `json:"net_out_transfer,omitempty"`
	NetInSpeed     uint64  `json:"net_in_speed,omitempty"`
	NetOutSpeed    uint64  `json:"net_out_speed,omitempty"`
	Uptime         uint64  `json:"uptime,omitempty"`
	Load1          float64 `json:"load1,omitempty"`
	Load5          float64 `json:"load5,omitempty"`
	Load15         float64 `json:"load15,omitempty"`
	DiskReadSpeed  uint64  `json:"disk_read_speed,omitempty"`
	DiskWriteSpeed uint64  `json:"disk_write_speed,omitempty"`
}

func (x *State) Reset()      { *x = State{} }
func (*State) ProtoMessage() {}
func (x *State) GetCpu() float64 {
	if x != nil {
		return x.Cpu
	}
	return 0
}
func (x *State) GetMemUsed() uint64 {
	if x != nil {
		return x.MemUsed
	}
	return 0
}
func (x *State) GetSwapUsed() uint64 {
	if x != nil {
		return x.SwapUsed
	}
	return 0
}
func (x *State) GetDiskUsed() uint64 {
	if x != nil {
		return x.DiskUsed
	}
	return 0
}
func (x *State) GetNetInTransfer() uint64 {
	if x != nil {
		return x.NetInTransfer
	}
	return 0
}
func (x *State) GetNetOutTransfer() uint64 {
	if x != nil {
		return x.NetOutTransfer
	}
	return 0
}
func (x *State) GetNetInSpeed() uint64 {
	if x != nil {
		return x.NetInSpeed
	}
	return 0
}
func (x *State) GetNetOutSpeed() uint64 {
	if x != nil {
		return x.NetOutSpeed
	}
	return 0
}
func (x *State) GetUptime() uint64 {
	if x != nil {
		return x.Uptime
	}
	return 0
}
func (x *State) GetLoad1() float64 {
	if x != nil {
		return x.Load1
	}
	return 0
}
func (x *State) GetLoad5() float64 {
	if x != nil {
		return x.Load5
	}
	return 0
}
func (x *State) GetLoad15() float64 {
	if x != nil {
		return x.Load15
	}
	return 0
}
func (x *State) GetDiskReadSpeed() uint64 {
	if x != nil {
		return x.DiskReadSpeed
	}
	return 0
}
func (x *State) GetDiskWriteSpeed() uint64 {
	if x != nil {
		return x.DiskWriteSpeed
	}
	return 0
}

// Receipt is returned by dashboard to acknowledge received data.
type Receipt struct {
	Ok bool `json:"ok,omitempty"`
}

func (x *Receipt) Reset()      { *x = Receipt{} }
func (*Receipt) ProtoMessage() {}
func (x *Receipt) GetOk() bool {
	if x != nil {
		return x.Ok
	}
	return false
}
