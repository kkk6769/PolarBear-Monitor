import { motion } from 'framer-motion';
import type { ServerDisplay } from '../types/polarbear';
import { useT } from '../i18n';
import { getLocalizedCountry } from '../lib/country';

interface Props { server: ServerDisplay; }

export default function ServerCard({ server }: Props) {
  const { t, lang } = useT();
  const { online, name, state, host, ip_code } = server;
  const cpu = parseFloat(server.cpu_percent) || 0;
  const mp = server.mem_percent || 0;
  const dp = server.disk_percent || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-lg bg-card shadow-md ring-1 ring-border transition-all hover:shadow-lg hover:shadow-[#00D4FF]/10 hover:ring-[#00D4FF]/40 ${!online ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3 p-3 md:px-5">
        <span className={`relative inline-flex h-2 w-2 shrink-0 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`}>
          {online && <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-green-500 opacity-75" />}
        </span>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {ip_code ? <img src={`https://flagcdn.com/24x18/${ip_code.toLowerCase()}.png`} className="w-[17px] h-[12px] rounded-sm shrink-0" alt="" /> : null}
          <span className="break-normal font-bold tracking-tight truncate text-xs">{name}</span>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${online ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{online ? t['card.online'] : t['card.offline']}</span>
      </div>
      {state ? (
        <div className="grid grid-cols-5 items-center gap-4 px-4 pb-4 md:px-6 md:pb-5">
          <div className="flex-1 text-center"><div className="text-xs text-muted-foreground">{t['card.cpu']}</div><div className="text-sm font-semibold">{server.cpu_percent||t['card.na']}</div><div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{width: Math.min(cpu,100)+'%'}} /></div></div>
          <div className="flex-1 text-center"><div className="text-xs text-muted-foreground">{t['card.mem']}</div><div className="text-sm font-semibold">{server.mem_used_fmt||t['card.na']}</div><div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-yellow-500 transition-all duration-500" style={{width: mp+'%'}} /></div></div>
          <div className="flex-1 text-center"><div className="text-xs text-muted-foreground">{t['card.disk']}</div><div className="text-sm font-semibold">{server.disk_used_fmt||t['card.na']}</div><div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{width: dp+'%'}} /></div></div>
          <div className="flex-1 text-center"><div className="text-xs text-muted-foreground">{t['card.up']}</div><div className="text-xs font-semibold">{server.net_out_speed_fmt||t['card.na']}</div><div className="text-[10px] text-muted-foreground opacity-60 mt-0.5">{server.net_out_transfer_fmt||''}</div></div>
          <div className="flex-1 text-center"><div className="text-xs text-muted-foreground">{t['card.down']}</div><div className="text-xs font-semibold">{server.net_in_speed_fmt||t['card.na']}</div><div className="text-[10px] text-muted-foreground opacity-60 mt-0.5">{server.net_in_transfer_fmt||''}</div></div>
        </div>
      ) : (
        <div className="px-3 pb-3 md:px-5 md:pb-5 text-center text-muted-foreground text-xs">{t['card.waiting']}</div>
      )}
      <div className="px-3 pb-2 md:px-5 md:pb-3 flex justify-between text-[10px] text-muted-foreground opacity-60">
        <span>{t['card.uptime']} {server.uptime_fmt||t['card.na']}</span>
        <span className="truncate mx-2">{host ? host.platform + ' ' + host.platform_version : ''}</span>
        <span>{ip_code ? `📍 ${getLocalizedCountry(ip_code, lang)}` : ''}</span>
      </div>
    </motion.div>
  );
}
