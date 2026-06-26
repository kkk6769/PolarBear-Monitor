import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import type { ServerDisplay, WSMessage } from '../types/polarbear';

interface WSState {
  servers: ServerDisplay[];
  connected: boolean;
  onlineCount: number;
  history: WSMessage[];
}

const WSContext = createContext<WSState>({ servers: [], connected: false, onlineCount: 0, history: [] });

export function useWS() {
  return useContext(WSContext);
}

export function WSProvider({ children }: { children: React.ReactNode }) {
  const [servers, setServers] = useState<ServerDisplay[]>([]);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState<WSMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(proto + '://' + location.host + '/ws');
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onmessage = (ev) => {
      try {
        const msg: WSMessage = JSON.parse(ev.data);
        setServers(msg.data || []);
        setHistory(prev => {
          const next = [...prev, msg];
          return next.length > 300 ? next.slice(-300) : next;
        });
      } catch { /* ignore */ }
    };
    ws.onclose = () => {
      setConnected(false);
      setTimeout(connect, 2000);
    };
    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  const onlineCount = servers.filter(s => s.online).length;

  return (
    <WSContext.Provider value={{ servers, connected, onlineCount, history }}>
      {children}
    </WSContext.Provider>
  );
}
