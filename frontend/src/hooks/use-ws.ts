import { useState, useEffect, useCallback, useRef } from 'react';
import type { ServerDisplay, WSMessage } from '../types/polarbear';

export function useWebSocket() {
  const [servers, setServers] = useState<ServerDisplay[]>([]);
  const [connected, setConnected] = useState(false);
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
      } catch { /* ignore malformed */ }
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

  return { servers, connected, onlineCount };
}
