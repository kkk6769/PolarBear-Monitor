export interface Host {
  platform: string;
  platform_version: string;
  cpu: string[];
  mem_total: number;
  disk_total: number;
  swap_total: number;
  arch: string;
  boot_time: number;
  version: string;
}

export interface HostState {
  cpu: number;
  mem_used: number;
  swap_used: number;
  disk_used: number;
  net_in_transfer: number;
  net_out_transfer: number;
  net_in_speed: number;
  net_out_speed: number;
  disk_read_speed: number;
  disk_write_speed: number;
  uptime: number;
  load1: number;
  load5: number;
  load15: number;
}

export interface ServerDisplay {
  id: number;
  uuid: string;
  name: string;
  display_index: number;
  note: string;
  online: boolean;
  last_active: string;
  ip: string;
  ip_country: string;
  ip_code: string;
  host?: Host;
  state?: HostState;
  cpu_percent: string;
  mem_used_fmt: string;
  mem_total_fmt: string;
  mem_percent: number;
  disk_used_fmt: string;
  disk_total_fmt: string;
  disk_percent: number;
  net_in_speed_fmt: string;
  net_out_speed_fmt: string;
  disk_read_speed_fmt: string;
  disk_write_speed_fmt: string;
  uptime_fmt: string;
  load1: string;
  load5: string;
  load15: string;
}

export interface WSMessage {
  data: ServerDisplay[];
  now: number;
}
