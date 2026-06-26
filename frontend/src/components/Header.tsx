import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface Props {
  onlineCount: number;
  totalCount: number;
  connected: boolean;
}

export default function Header({ onlineCount, totalCount, connected }: Props) {
  const { theme, toggle } = useTheme();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const tick = () => {
      setTimeStr(new Date().toLocaleTimeString('zh-CN', { hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const chars = [...timeStr];

  return (
    <header className="mx-auto w-full max-w-5xl px-4 pt-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.span
            className="text-2xl"
            animate={{ rotate: connected ? [0, -10, 10, 0] : 0 }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🐻‍❄️
          </motion.span>
          <span className="sm:text-base text-sm font-medium text-foreground">PolarBear Monitor</span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <a href="/admin" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors no-underline">
            <Settings size={14} />
            <span className="hidden sm:inline">管理</span>
          </a>

          <span className="hidden h-4 w-px bg-border md:block" />

          <span className="rounded-full px-[9px] bg-card text-xs font-medium flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${onlineCount > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            {onlineCount} / {totalCount}
          </span>

          <span className="hidden h-4 w-px bg-border md:block" />

          <button onClick={toggle} className="rounded-full px-[9px] bg-card text-muted-foreground hover:text-foreground transition-colors">{theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}</button>
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            {connected ? <Wifi size={12} className="text-green-500" /> : <WifiOff size={12} className="text-red-500" />}
          </span>
        </div>
      </div>

      {/* Greeting line */}
      <div className="mt-10 md:mt-16">
        <p className="text-base font-semibold text-foreground">👋 欢迎使用</p>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-sm font-medium text-muted-foreground">当前时间</span>
          <span className="text-sm font-semibold text-foreground tabular-nums">
            <AnimatePresence mode="popLayout">
              {chars.map((ch, i) => (
                <motion.span
                  key={`${i}-${ch}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="inline-block"
                >
                  {ch}
                </motion.span>
              ))}
            </AnimatePresence>
          </span>
        </div>
      </div>
    </header>
  );
}
