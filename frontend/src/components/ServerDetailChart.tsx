import { useRef, useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ServerDisplay, WSMessage } from '../types/polarbear';
import { useT } from '../i18n';

interface Props { server: ServerDisplay; history: WSMessage[]; }
interface DataPoint { idx: number; time: string; cpu: number; mem: number; swap: number; disk: number; netIn: number; netOut: number; }

function buildData(history: WSMessage[], serverId: number, host: ServerDisplay['host']): DataPoint[] {
  const cutoff = Date.now() / 1000 - 60; // last 60 seconds
  return history
    .filter(msg => msg.now >= cutoff)
    .map((msg, idx) => {
      const s = msg.data?.find(d => d.id === serverId);
      if (!s || !s.state) return null;
      return {
        idx,
        time: new Date(msg.now * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        cpu: parseFloat(s.cpu_percent) || 0,
        mem: s.mem_percent || 0,
        swap: s.state.swap_used ? (s.state.swap_used / (host?.swap_total || 1)) * 100 : 0,
        disk: s.disk_percent || 0,
        netIn: s.state.net_in_speed / 1024,
        netOut: s.state.net_out_speed / 1024,
      };
    }).filter(Boolean) as DataPoint[];
}

export default function ServerDetailChart({ server, history }: Props) {
  const { t } = useT();
  const [data, setData] = useState<DataPoint[]>([]);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 1000) return;
    lastUpdateRef.current = now;
    setData(buildData(history, server.id, server.host));
  }, [history, server.id, server.host]);

  if (data.length < 2) return <div className="text-center text-muted-foreground text-sm py-12">{t['detail.collecting']}</div>;

  return (
    <div className="space-y-3">
      <ChartCard title={t['chart.cpu']} dataKey="cpu" color="#22C55E" domain={[0, 100]} data={data} />
      <div className="grid grid-cols-2 gap-3">
        <MultiChart title={t['chart.memSwap']} keys={['mem', 'swap']} colors={['#EAB308', '#EF4444']} domain={[0, 100]} data={data} />
        <ChartCard title={t['chart.disk']} dataKey="disk" color="#3B82F6" domain={[0, 100]} data={data} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ChartCard title={t['chart.netOut']} dataKey="netOut" color="#A855F7" data={data} />
        <ChartCard title={t['chart.netIn']} dataKey="netIn" color="#60A5FA" data={data} />
      </div>
    </div>
  );
}

function ChartCard({ title, data, dataKey, color, domain }: {
  title: string; data: DataPoint[]; dataKey: keyof DataPoint; color: string; domain?: [number, number];
}) {
  return (
    <div className="rounded-lg bg-card ring-1 ring-border p-3">
      <div className="text-[11px] text-muted-foreground mb-2">{title}</div>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="idx" hide />
          <YAxis tick={{ fontSize: 10, fill: 'var(--muted-fg)' }} width={40} domain={domain || ['auto', 'auto']} />
          <Tooltip
            cursor={{ stroke: '#00D4FF', strokeDasharray: '3 3' }}
            contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--card-fg)' }}
            labelStyle={{ color: 'var(--muted-fg)' }}
            labelFormatter={(_: any, p: any) => p?.[0]?.payload?.time || ''}
          />
          <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MultiChart({ title, keys, colors, domain, data }: {
  title: string; keys: string[]; colors: string[]; domain: [number, number]; data: DataPoint[];
}) {
  return (
    <div className="rounded-lg bg-card ring-1 ring-border p-3">
      <div className="text-[11px] text-muted-foreground mb-2">{title}</div>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="idx" hide />
          <YAxis tick={{ fontSize: 10, fill: 'var(--muted-fg)' }} width={40} domain={domain} />
          <Tooltip
            cursor={{ stroke: '#00D4FF', strokeDasharray: '3 3' }}
            contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--card-fg)' }}
            labelStyle={{ color: 'var(--muted-fg)' }}
            labelFormatter={(_: any, p: any) => p?.[0]?.payload?.time || ''}
          />
          {keys.map((k, i) => (
            <Area key={k} type="monotone" dataKey={k} stroke={colors[i]} fill={colors[i]} fillOpacity={0.15} strokeWidth={2} dot={false} isAnimationActive={false} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
