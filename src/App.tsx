import { Routes, Route, Navigate, useLocation } from 'react-router';
import { StoreProvider, useStore } from '@/lib/store';
import AppLayout from '@/components/AppLayout';
import { Logo } from '@/components/Logo';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import NewTest from '@/pages/NewTest';
import Evidence from '@/pages/Evidence';
import EvidenceDetail from '@/pages/EvidenceDetail';
import AuditLog from '@/pages/AuditLog';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';

function Guard({ children }: { children: React.ReactNode }) {
  const { officer, ready } = useStore();
  const loc = useLocation();
  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <Logo size={48} />
        <p className="text-sm text-muted-foreground">Initializing secure session…</p>
      </div>
    );
  }
  if (!officer) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}

export default function App() {
  return (
    <StoreProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Guard><AppLayout /></Guard>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/test/new" element={<NewTest />} />
          <Route path="/evidence" element={<Evidence />} />
          <Route path="/evidence/:testId" element={<EvidenceDetail />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </StoreProvider>
  );
}
