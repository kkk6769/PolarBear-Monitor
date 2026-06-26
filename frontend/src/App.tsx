import Header from './components/Header';
import ServerCard from './components/ServerCard';
import { useWebSocket } from './hooks/use-ws';

export default function App() {
  const { servers, connected, onlineCount } = useWebSocket();

  return (
    <div className="min-h-screen bg-bg">
      <Header onlineCount={onlineCount} totalCount={servers.length} connected={connected} />

      <main className="max-w-[1440px] mx-auto px-6 py-6">
        {servers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-text-dim">
            <span className="text-6xl mb-4 opacity-40">📡</span>
            <p className="text-base mb-1">等待 Agent 连接...</p>
            <code className="bg-surface px-4 py-2 rounded-lg text-xs mt-3 border border-border">
              ./polarbear-agent
            </code>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {servers.map((s) => (
              <ServerCard key={s.id} server={s} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

