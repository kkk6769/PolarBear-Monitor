package model

// ServerDisplay 发送给前端的服务器展示信息（含实时状态）
type ServerDisplay struct {
	ID           uint64     `json:"id"`
	UUID         string     `json:"uuid"`
	Name         string     `json:"name"`
	DisplayIndex int        `json:"display_index"`
	Note         string     `json:"note"`
	Online       bool       `json:"online"`
	LastActive   string     `json:"last_active"`
	IP           string     `json:"ip"`
	IPCountry    string     `json:"ip_country"`
	IPCode       string     `json:"ip_code"`
	Host         *Host      `json:"host,omitempty"`
	State        *HostState `json:"state,omitempty"`
	// Human-readable formatted values for the frontend
	CPUPercent        string `json:"cpu_percent"`
	MemUsedFmt        string `json:"mem_used_fmt"`
	MemTotalFmt       string `json:"mem_total_fmt"`
	MemPercent        int    `json:"mem_percent"`
	DiskUsedFmt       string `json:"disk_used_fmt"`
	DiskTotalFmt      string `json:"disk_total_fmt"`
	DiskPercent       int    `json:"disk_percent"`
	NetInSpeedFmt     string `json:"net_in_speed_fmt"`
	NetOutSpeedFmt    string `json:"net_out_speed_fmt"`
	NetInTransferFmt  string `json:"net_in_transfer_fmt"`
	NetOutTransferFmt string `json:"net_out_transfer_fmt"`
	DiskReadSpeedFmt  string `json:"disk_read_speed_fmt"`
	DiskWriteSpeedFmt string `json:"disk_write_speed_fmt"`
	UptimeFmt         string `json:"uptime_fmt"`
	Load1             string `json:"load1"`
	Load5             string `json:"load5"`
	Load15            string `json:"load15"`
}

// ServerUpdateForm 前端更新服务器名/排序的请求
type ServerUpdateForm struct {
	Name         *string `json:"name,omitempty"`
	DisplayIndex *int    `json:"display_index,omitempty"`
	Note         *string `json:"note,omitempty"`
}
