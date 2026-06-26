export function formatBytes(b: number): string {
  if (b === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const k = 1024;
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + units[i];
}

export function formatBytesPerSec(b: number): string {
  return formatBytes(b) + '/s';
}

export function formatUptime(sec: number, units?: { d?: string; h?: string; m?: string; s?: string }): string {
  const u = { d: 'd', h: 'h', m: 'm', s: 's', ...units };
  if (sec < 60) return sec + u.s;
  if (sec < 3600) return Math.floor(sec / 60) + u.m;
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  if (days > 0) return days + u.d + ' ' + hours + u.h;
  return Math.floor(sec / 3600) + u.h + ' ' + Math.floor((sec % 3600) / 60) + u.m;
}
