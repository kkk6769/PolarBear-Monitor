import { motion } from 'framer-motion';
import { Wifi, WifiOff, Settings } from 'lucide-react';

interface Props {
  onlineCount: number;
  totalCount: number;
  connected: boolean;
}

export default function Header({ onlineCount, totalCount, connected }: Props) {
  return (
    <header className="sticky top-0 z-50 bg-[var(--surface)]/80 backdrop-blur border-b border-[var(--border-clr)]">
      <div className="max-w-[1440px] mx-auto px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.span
            className="text-2xl"
            animate={{ rotate: connected ? [0, -10, 10, 0] : 0 }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🐻‍❄️
          </motion.span>
          <h1 className="text-lg font-bold text-[var(--text-clr)] tracking-tight">PolarBear Monitor</h1>
        </div>

        <nav className="flex items-center gap-5 text-sm">
          <span className="flex items-center gap-1.5 text-[var(--text-dim)]">
            {connected ? (
              <Wifi size={14} className="text-[var(--green)]" />
            ) : (
              <WifiOff size={14} className="text-[var(--red)]" />
            )}
            {connected ? '已连接' : '重连中'}
          </span>

          <span className="flex items-center gap-1.5">
            <span className={`inline-block w-2 h-2 rounded-full ${onlineCount > 0 ? 'bg-[var(--green)] shadow-[0_0_6px_var(--green)]' : 'bg-[var(--red)]'}`} />
            <span className="text-[var(--text-dim)]">{onlineCount}</span>
            <span className="text-[var(--text-dim)]/50">/ {totalCount} 在线</span>
          </span>

          <a
            href="/admin"
            className="flex items-center gap-1 text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors no-underline"
          >
            <Settings size={14} />
            管理后台
          </a>

          <span className="text-[var(--text-dim)] tabular-nums">
            {new Date().toLocaleTimeString('zh-CN', { hour12: false })}
          </span>
        </nav>
      </div>
    </header>
  );
}
