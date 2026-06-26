import type { ServerDisplay } from '../types/polarbear';

interface Props {
  servers: ServerDisplay[];
}

export default function ServerOverview({ servers }: Props) {
  const online = servers.filter(s => s.online).length;
  const offline = servers.length - online;

  let totalUpSpeed = 0, totalDownSpeed = 0;
  let totalUpTransfer = 0, totalDownTransfer = 0;
  servers.forEach(s => {
    if (s.state) {
      totalUpSpeed += s.state.net_out_speed || 0;
      totalDownSpeed += s.state.net_in_speed || 0;
      totalUpTransfer += s.state.net_out_transfer || 0;
      totalDownTransfer += s.state.net_in_transfer || 0;
    }
  });

  return (
    <section className="mx-auto w-full max-w-5xl px-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="总计" value={servers.length} dotColor="bg-blue-500" />
        <StatCard label="在线" value={online} dotColor="bg-green-500" ping />
        <StatCard label="离线" value={offline} dotColor="bg-red-500" />
        <div className="rounded-lg bg-card shadow-md ring-1 ring-border hover:ring-[#00D4FF]/50 hover:shadow-lg hover:shadow-[#00D4FF]/10 transition-all cursor-default p-3">
          <div className="text-xs text-muted-foreground mb-1">网络</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">↑ 上行</span>
              <span className="font-semibold">{formatSpeed(totalUpSpeed)}</span>
              <span className="text-[10px] text-muted-foreground opacity-60">{formatBytes(totalUpTransfer)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">↓ 下行</span>
              <span className="font-semibold">{formatSpeed(totalDownSpeed)}</span>
              <span className="text-[10px] text-muted-foreground opacity-60">{formatBytes(totalDownTransfer)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, dotColor, ping }: {
  label: string; value: number | string; dotColor: string; ping?: boolean;
}) {
  return (
    <div className="rounded-lg bg-card shadow-md ring-1 ring-border hover:ring-[#00D4FF]/50 hover:shadow-lg hover:shadow-[#00D4FF]/10 transition-all cursor-default">
      <div className="flex h-full items-center px-6 py-3 gap-3">
        <span className={`relative inline-flex h-2 w-2 shrink-0 rounded-full ${dotColor}`}>
          {ping && <span className={`absolute inline-flex h-2 w-2 animate-ping rounded-full ${dotColor} opacity-75`} />}
        </span>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-lg font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function formatSpeed(bps: number): string {
  if (bps < 1024) return bps + ' B/s';
  if (bps < 1048576) return (bps / 1024).toFixed(1) + ' KB/s';
  if (bps < 1073741824) return (bps / 1048576).toFixed(1) + ' MB/s';
  return (bps / 1073741824).toFixed(1) + ' GB/s';
}

function formatBytes(b: number): string {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB';
  if (b < 1099511627776) return (b / 1073741824).toFixed(1) + ' GB';
  return (b / 1099511627776).toFixed(1) + ' TB';
}
