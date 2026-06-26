import { useParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useWS } from '../hooks/use-ws';
import type { ServerDisplay } from '../types/polarbear';
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
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

        <ServerInfoGrid server={server} />

        <div className="mt-6">
          <ServerDetailChart server={server} history={history} />
        </div>
      </div>
    </div>
  );
}

function ServerInfoGrid({ server }: { server: ServerDisplay }) {
  const h = server.host;
  const s = server.state;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <InfoCard label="运行时间" value={server.uptime_fmt || '--'} />
      <InfoCard label="系统" value={h ? `${h.platform} ${h.platform_version}` : '--'} />
      <InfoCard label="CPU" value={h?.cpu?.[0] || '--'} />
      <InfoCard label="架构" value={h?.arch || '--'} />
      <InfoCard label="内存" value={s ? `${server.mem_used_fmt} / ${server.mem_total_fmt}` : '--'} />
      <InfoCard label="磁盘" value={s ? `${server.disk_used_fmt} / ${server.disk_total_fmt}` : '--'} />
      <InfoCard label="网络 ↑" value={s ? server.net_out_speed_fmt : '--'} />
      <InfoCard label="网络 ↓" value={s ? server.net_in_speed_fmt : '--'} />
      <InfoCard label="负载" value={s ? `${s.load1} / ${s.load5} / ${s.load15}` : '--'} />
      <InfoCard label="磁盘读" value={s ? server.disk_read_speed_fmt : '--'} />
      <InfoCard label="磁盘写" value={s ? server.disk_write_speed_fmt : '--'} />    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card ring-1 ring-border p-3">
      <div className="text-[10px] text-muted-foreground mb-0.5">{label}</div>
      <div className="text-xs font-medium truncate">{value}</div>
    </div>
  );
}
