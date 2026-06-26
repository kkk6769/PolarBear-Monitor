import { Link } from 'react-router-dom';
import Header from '../components/Header';
import ServerOverview from '../components/ServerOverview';
import ServerCard from '../components/ServerCard';
import Footer from '../components/Footer';
import { useWS } from '../hooks/use-ws.tsx';

export default function ServerList() {
  const { servers, connected, onlineCount } = useWS();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header onlineCount={onlineCount} totalCount={servers.length} connected={connected} />

      {servers.length > 0 && (
        <>
          <div className="mt-10 md:mt-16" />
          <ServerOverview servers={servers} />
        </>
      )}

      <main className="mx-auto w-full max-w-5xl px-4 mt-8">
        {servers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
            <span className="text-6xl mb-4 opacity-40">ðŸ“¡</span>
            <p className="text-base mb-1">ç­‰å¾… Agent è¿žæŽ¥...</p>
            <code className="bg-card px-4 py-2 rounded-lg text-xs mt-3 ring-1 ring-border">
              ./polarbear-agent
            </code>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {servers.map((s) => (
              <Link key={s.id} to={`/server/${s.id}`} className="no-underline">
                <ServerCard server={s} />
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer serversCount={servers.length} />
    </div>
  );
}
