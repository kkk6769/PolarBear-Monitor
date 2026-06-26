import { motion } from 'framer-motion';
import type { ServerDisplay } from '../types/polarbear';

interface Props {
  server: ServerDisplay;
}

export default function ServerCard({ server }: Props) {
  const { online, name, state, host, ip_code, ip_country } = server;
  const cpu = parseFloat(server.cpu_percent) || 0;
  const mp = server.mem_percent || 0;
  const dp = server.disk_percent || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl border bg-[var(--surface)]/70 backdrop-blur overflow-hidden transition-all duration-300 hover:border-[var(--accent)]/30 hover:shadow-lg hover:shadow-[var(--accent)]/5 ${!online ? 'opacity-60' : ''}`}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--border-clr)]">
        <div className="flex items-center gap-2.5 font-semibold text-sm">
          {ip_code ? (
            <img
              src={`https://flagcdn.com/24x18/${ip_code.toLowerCase()}.png`}
              className="w-[18px] h-[14px] rounded-sm align-middle"
              alt=""
            />
          ) : (
            <span className="text-base">🖥️</span>
          )}
          <span className="text-[var(--text-clr)] truncate max-w-[200px]">{name}</span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            online ? 'bg-[var(--green)]/10 text-[var(--green)]' : 'bg-[var(--red)]/10 text-[var(--red)]'
          }`}
        >
          {online && (
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
          )}
          {online ? '在线' : '离线'}
        </span>
      </div>

      {/* Body */}
      {state ? (
        <div className="px-5 py-4 space-y-3">
          {/* Row 1: CPU + Memory */}
          <div className="grid grid-cols-2 gap-3">
            <MetricBlock
              label="CPU"
              value={server.cpu_percent || '--'}
              color="var(--color-red)"
              pct={Math.min(cpu, 100)}
              sub={
                <span className="text-[11px] text-text-dim">
                  1m {server.load1} · 5m {server.load5} · 15m {server.load15}
                </span>
              }
            />
            <MetricBlock
              label="内存"
              value={server.mem_used_fmt || '--'}
              sub={`/ ${server.mem_total_fmt || '--'}`}
              color="var(--color-yellow)"
              pct={mp}
            />
          </div>

          {/* Row 2: Disk + Network */}
          <div className="grid grid-cols-2 gap-3">
            <MetricBlock
              label="磁盘"
              value={server.disk_used_fmt || '--'}
              sub={
                <span className="text-[11px] text-text-dim">
                  读 {server.disk_read_speed_fmt || '--'} · 写 {server.disk_write_speed_fmt || '--'}
                </span>
              }
              color="var(--color-accent)"
              pct={dp}
            />
            <MetricBlock
              label="网络"
              value={
                <span>
                  <span className="text-[var(--color-green)]">↑ {server.net_out_speed_fmt || '--'}</span>
                  {' · '}
                  <span className="text-[var(--color-yellow)]">↓ {server.net_in_speed_fmt || '--'}</span>
                </span>
              }
              sub={null}
              color=""
              pct={0}
            />
          </div>
        </div>
      ) : (
        <div className="px-5 py-8 text-center text-[var(--text-dim)] text-sm">等待数据...</div>
      )}

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-[var(--border-clr)] flex justify-between text-[11px] text-text-dim">
        <span>🕐 {server.uptime_fmt || '--'}</span>
        <span>{host ? `${host.platform} ${host.platform_version} · ${host.arch}` : ''}</span>
        <span>{ip_country ? `📍 ${ip_country}` : ''}</span>
      </div>
    </motion.div>
  );
}

function MetricBlock({
  label,
  value,
  sub,
  color,
  pct,
}: {
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  color: string;
  pct: number;
}) {
  return (
    <div className="bg-[var(--bg)] rounded-lg px-3.5 py-3 text-center">
      <div className="text-[10px] text-text-dim uppercase tracking-wider mb-1.5">{label}</div>
      <div className="text-xl font-bold tabular-nums" style={{ color: color || undefined }}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-[var(--text-dim)] mt-1">{sub}</div>}
      {pct > 0 && (
        <div className="mt-2 h-1 bg-[var(--border-clr)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      )}
    </div>
  );
}
