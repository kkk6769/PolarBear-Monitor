import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WSProvider } from './hooks/use-ws';
import { ThemeProvider } from './components/ThemeProvider';
import ServerList from './pages/ServerList';
import ServerDetail from './pages/ServerDetail';

export default function App() {
  return (
    <ThemeProvider>
    <WSProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ServerList />} />
          <Route path="/server/:id" element={<ServerDetail />} />
        </Routes>
      </BrowserRouter>
    </WSProvider>
    </ThemeProvider>
  );
}
