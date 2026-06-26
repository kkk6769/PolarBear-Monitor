import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ServerDisplay, WSMessage } from '../types/polarbear';

interface Props { server: ServerDisplay; history: WSMessage[]; }
interface DataPoint { time: string; cpu: number; mem: number; swap: number; disk: number; netIn: number; netOut: number; }

export default function ServerDetailChart({ server, history }: Props) {
  const data: DataPoint[] = useMemo(() => {
    return history.slice(-60).map(msg => {
      const s = msg.data?.find(d => d.id === server.id);
      if (!s || !s.state) return null;
      return {
        time: new Date(msg.now * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        cpu: parseFloat(s.cpu_percent) || 0,
        mem: s.mem_percent || 0,
        swap: s.state.swap_used ? (s.state.swap_used / (server.host?.swap_total || 1)) * 100 : 0,
        disk: s.disk_percent || 0,
        netIn: s.state.net_in_speed / 1024,
        netOut: s.state.net_out_speed / 1024,
      };
    }).filter(Boolean) as DataPoint[];
  }, [history, server.id]);

  if (data.length < 2) return <div className="text-center text-muted-foreground text-sm py-12">收集数据中...</div>;

  return (
    <div className="space-y-3">
      <ChartCard title="CPU 使用率 (%)" dataKey="cpu" color="#22C55E" domain={[0, 100]} data={data} />
      <div className="grid grid-cols-2 gap-3">
        <MultiChart title="内存 / Swap (%)" keys={['mem', 'swap']} colors={['#EAB308', '#EF4444']} domain={[0, 100]} data={data} />
        <ChartCard title="磁盘使用率 (%)" dataKey="disk" color="#3B82F6" domain={[0, 100]} data={data} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ChartCard title="网络上行 (KB/s)" dataKey="netOut" color="#A855F7" data={data} />
        <ChartCard title="网络下行 (KB/s)" dataKey="netIn" color="#60A5FA" data={data} />
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
        <AreaChart data={data} syncId="detailCharts">
          <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#A8A29E' }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: '#A8A29E' }} width={40} domain={domain || ['auto', 'auto']} />
          <Tooltip contentStyle={{ background: '#0A0A09', border: '1px solid #292524', borderRadius: 8, fontSize: 12 }} />
          <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.1} strokeWidth={2} dot={false} isAnimationActive={false} />
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
        <AreaChart data={data} syncId="detailCharts">
          <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#A8A29E' }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: '#A8A29E' }} width={40} domain={domain} />
          <Tooltip contentStyle={{ background: '#0A0A09', border: '1px solid #292524', borderRadius: 8, fontSize: 12 }} />
          {keys.map((k, i) => (
            <Area key={k} type="monotone" dataKey={k} stroke={colors[i]} fill={colors[i]} fillOpacity={0.1} strokeWidth={2} dot={false} isAnimationActive={false} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
