import { NavLink, Outlet, useNavigate } from 'react-router';
import { Logo } from './Logo';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, Camera, FolderOpen, BarChart3, ScrollText, Settings as SettingsIcon,
  LogOut, MoreHorizontal, Plus, Wifi, WifiOff,
} from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/test/new', label: 'New Test', icon: Camera },
  { to: '/evidence', label: 'Evidence', icon: FolderOpen },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/audit', label: 'Audit Log', icon: ScrollText },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

function ConnectionBadge() {
  const { online, syncQueue } = useStore();
  if (online) {
    return syncQueue > 0 ? (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 pulse-dot" /> SYNCING {syncQueue} RECORD{syncQueue > 1 ? 'S' : ''}…
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
        <Wifi className="h-3 w-3" /> ONLINE
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
      <WifiOff className="h-3 w-3" /> OFFLINE — DATA WILL SYNC WHEN CONNECTED
    </span>
  );
}

export { ConnectionBadge };

export default function AppLayout() {
  const { officer, logout } = useStore();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-[hsl(222,47%,7%)]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <NavLink to="/" className="flex items-center gap-2.5">
            <Logo size={28} />
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-wide text-foreground">BiOrion</div>
              <div className="hidden text-[10px] text-muted-foreground md:block">Field Drug Testing &amp; Evidence Management</div>
            </div>
          </NavLink>
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${isActive ? 'bg-secondary text-cyan-300' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <ConnectionBadge />
            <Button size="sm" className="hidden sm:inline-flex bg-cyan-500 text-[hsl(222,47%,7%)] hover:bg-cyan-400 font-semibold" onClick={() => navigate('/test/new')}>
              <Plus className="mr-1 h-4 w-4" /> START NEW TEST
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-2.5 py-1.5 hover:bg-secondary">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-[11px] font-bold text-cyan-300">
                    {officer?.name.split(' ').map((s) => s[0]).slice(0, 2).join('')}
                  </span>
                  <span className="hidden text-left sm:block leading-tight">
                    <span className="block text-xs font-semibold">{officer?.name}</span>
                    <span className="block text-[10px] text-muted-foreground font-mono-data">{officer?.officerId}</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm font-semibold">{officer?.name}</div>
                  <div className="text-xs text-muted-foreground">{officer?.role} · {officer?.department}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}><SettingsIcon className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { logout(); navigate('/login'); }} className="text-red-400"><LogOut className="mr-2 h-4 w-4" /> Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Offline banner */}
      <OfflineBanner />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 md:pb-10">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 border-t border-border bg-[hsl(222,47%,7%)]/97 backdrop-blur md:hidden">
        {[
          { to: '/', label: 'Home', icon: LayoutDashboard },
          { to: '/test/new', label: 'New Test', icon: Camera, cta: true },
          { to: '/evidence', label: 'Evidence', icon: FolderOpen },
        ].map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'}
            className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${n.cta ? 'text-cyan-300' : isActive ? 'text-cyan-300' : 'text-muted-foreground'}`}>
            {n.cta
              ? <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-[hsl(222,47%,7%)] shadow-lg shadow-cyan-500/30"><n.icon className="h-6 w-6" /></span>
              : <n.icon className="h-5 w-5" />}
            {n.label}
          </NavLink>
        ))}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground">
              <MoreHorizontal className="h-5 w-5" /> More
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-card">
            <SheetHeader><SheetTitle>Menu</SheetTitle></SheetHeader>
            <div className="mt-4 grid gap-2">
              {NAV.slice(3).map((n) => (
                <button key={n.to} onClick={() => { setMoreOpen(false); navigate(n.to); }}
                  className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-left text-sm font-medium hover:bg-secondary">
                  <n.icon className="h-5 w-5 text-cyan-400" /> {n.label}
                </button>
              ))}
              <button onClick={() => { logout(); navigate('/login'); }}
                className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-left text-sm font-medium text-red-400">
                <LogOut className="h-5 w-5" /> Sign out
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}

function OfflineBanner() {
  const { online, setOnline, syncQueue } = useStore();
  return (
    <div className={`border-b px-4 py-1.5 text-center text-[11px] font-medium ${online ? 'border-border bg-secondary/30 text-muted-foreground' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>
      {online
        ? (syncQueue > 0 ? `Connection restored — synchronizing ${syncQueue} locally stored record(s)…` : 'Secure session active · All evidence records encrypted at rest')
        : 'You are offline. Tests can still be completed — records will be stored locally and synced automatically.'}
      <span className="ml-3 inline-flex items-center gap-1.5 align-middle">
        <span className="text-[10px] uppercase tracking-wide">Simulate connectivity</span>
        <Switch checked={online} onCheckedChange={setOnline} className="scale-75" />
      </span>
    </div>
  );
}
