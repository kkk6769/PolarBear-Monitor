import { useParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useWS } from '../hooks/use-ws';
import { useT } from '../i18n';
import { getLocalizedCountry } from '../lib/country';
import { formatUptime } from '../lib/format';
import Header from '../components/Header';
import ServerDetailChart from '../components/ServerDetailChart';

export default function ServerDetail() {
  const { t, lang } = useT();
  const { id } = useParams<{ id: string }>();
  const { servers, history, connected, onlineCount } = useWS();

  const server = useMemo(() => servers.find(s => s.id === Number(id)), [servers, id]);

  if (!server) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg mb-4">{t['detail.notFound']}</p>
          <Link to="/" className="text-blue-400 hover:underline">{t['detail.back']}</Link>
        </div>
      </div>
    );
  }

  const h = server.host;
  const s = server.state;

  return (
    <div className="min-h-screen">
      <Header onlineCount={onlineCount} totalCount={servers.length} connected={connected} />
      <div className="mx-auto w-full max-w-5xl px-4 pt-4">
        {/* Back + Name + Status */}
        <div className="flex items-center gap-2 mb-3">
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
            {server.online ? t['card.online'] : t['card.offline']}
          </span>
        </div>

        {/* Inline info items */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs mb-2">
          {server.online && s && <InfoItem label={t['detail.uptime']} value={formatUptime(s.uptime, { d: t['time.day'], h: t['time.hour'], m: t['time.min'], s: t['time.sec'] })} />}
          {h?.arch && <InfoItem label={t['detail.arch']} value={h.arch} />}
          {h?.mem_total ? <InfoItem label={t['detail.memTotal']} value={formatBytes(h.mem_total)} /> : null}
          {h?.disk_total ? <InfoItem label={t['detail.diskTotal']} value={formatBytes(h.disk_total)} /> : null}
          {server.ip_code && (
            <InfoItem label={t['detail.region']} value={<span className="flex items-center gap-1">{server.ip_code ? <img src={`https://flagcdn.com/24x18/${server.ip_code.toLowerCase()}.png`} className="w-[16px] h-[11px] rounded-sm" alt="" /> : null}{getLocalizedCountry(server.ip_code, lang)}</span>} />
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs mb-2">
          {h?.platform && <InfoItem label={t['detail.os']} value={`${h.platform} ${h.platform_version || ''}`} />}
          {h?.cpu && h.cpu.length > 0 && <InfoItem label={t['detail.cpu']} value={h.cpu[0]} />}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs mb-4">
          {s && <InfoItem label={t['detail.load']} value={`${server.load1} / ${server.load5} / ${server.load15}`} />}
          {s && <InfoItem label={t['detail.upload']} value={s.net_out_transfer ? formatBytes(s.net_out_transfer) : t['card.na']} />}
          {s && <InfoItem label={t['detail.download']} value={s.net_in_transfer ? formatBytes(s.net_in_transfer) : t['card.na']} />}
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
