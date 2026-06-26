import { useParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useWS } from '../hooks/use-ws';
import ServerDetailChart from '../components/ServerDetailChart';

export default function ServerDetail() {
  const { id } = useParams<{ id: string }>();
  const { servers, history } = useWS();

  const server = useMemo(() => servers.find(s => s.id === Number(id)), [servers, id]);

  if (!server) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg mb-4">服务器未找到</p>
          <Link to="/" className="text-blue-400 hover:underline">← 返回首页</Link>
        </div>
      </div>
    );
  }

  const h = server.host;
  const s = server.state;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        {/* Back + Name + Status */}
        <div className="flex items-center gap-3 mb-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            {server.ip_code ? (
              <img src={`https://flagcdn.com/24x18/${server.ip_code.toLowerCase()}.png`} className="w-[17px] h-[12px] rounded-sm" alt="" />
            ) : null}
            <h1 className="text-lg font-bold">{server.name}</h1>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${server.online ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {server.online ? '在线' : '离线'}
          </span>
        </div>

        {/* Inline info items */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
          {server.online && server.uptime_fmt && (
            <InfoItem label="运行时间" value={server.uptime_fmt} />
          )}
          {h?.version && <InfoItem label="Agent" value={h.version} />}
          {h?.arch && <InfoItem label="架构" value={h.arch} />}
          {h?.mem_total ? <InfoItem label="内存总量" value={formatBytes(h.mem_total)} /> : null}
          {h?.disk_total ? <InfoItem label="磁盘总量" value={formatBytes(h.disk_total)} /> : null}
          {h?.swap_total ? <InfoItem label="Swap" value={formatBytes(h.swap_total)} /> : null}
          {h?.platform && (
            <InfoItem label="系统" value={`${h.platform} ${h.platform_version || ''}`} />
          )}
          {h?.cpu && h.cpu.length > 0 && <InfoItem label="CPU" value={h.cpu[0]} />}
          {server.ip_country && (
            <InfoItem label="地区" value={
              <span className="flex items-center gap-1">
                {server.ip_code ? <img src={`https://flagcdn.com/24x18/${server.ip_code.toLowerCase()}.png`} className="w-[16px] h-[11px] rounded-sm" alt="" /> : null}
                {server.ip_country}
              </span>
            } />
          )}
          {s && server.load1 !== '0.0' && (
            <InfoItem label="负载" value={`${server.load1} / ${server.load5} / ${server.load15}`} />
          )}
          {s && <InfoItem label="网络 ↑" value={server.net_out_speed_fmt || '--'} />}
          {s && <InfoItem label="网络 ↓" value={server.net_in_speed_fmt || '--'} />}
          {s && server.disk_read_speed_fmt && (
            <InfoItem label="磁盘读" value={server.disk_read_speed_fmt} />
          )}
          {s && server.disk_write_speed_fmt && (
            <InfoItem label="磁盘写" value={server.disk_write_speed_fmt} />
          )}
        </div>

        {/* Charts */}
        <ServerDetailChart server={server} history={history} />
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-xs">{value}</div>
    </div>
  );
}

function formatBytes(b: number): string {
  if (b === 0) return '0 B';
  const k = 1024;
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + u[i];
}
