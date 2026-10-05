import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/lib/store';
import { Lock, ShieldCheck, Fingerprint, FileClock, ScanLine, ChevronRight } from 'lucide-react';

export default function Login() {
  const { login } = useStore();
  const navigate = useNavigate();
  const [officerId, setOfficerId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerId.trim() || !password.trim()) { setError('Officer ID and password are required.'); return; }
    setBusy(true);
    setTimeout(() => { login(officerId.trim()); navigate('/'); }, 700);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[hsl(222,50%,5%)] p-12 lg:flex">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.6) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="relative flex items-center gap-3">
          <Logo size={40} />
          <div>
            <div className="text-xl font-extrabold tracking-wide">BiOrion</div>
            <div className="text-xs text-muted-foreground">AI-Powered Field Drug Testing &amp; Evidence Management</div>
          </div>
        </div>
        <div className="relative max-w-md">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            <ScanLine className="h-3.5 w-3.5" /> SIH 2026 · Problem Statement SIH26231
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Tamper-evident field testing.<br />
            <span className="text-cyan-400">From capture to court-ready record.</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Standardized image capture, reference-card colour calibration, AI-assisted colourimetric analysis,
            and SHA-256 evidence integrity — built for officers operating in real field conditions.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            {[['Accuracy', 'Calibrated colour analysis'], ['Integrity', 'SHA-256 evidence hash'], ['Speed', '<60s field workflow']].map(([t, d]) => (
              <div key={t} className="rounded-lg border border-border bg-card/60 p-3">
                <div className="text-sm font-bold text-cyan-300">{t}</div>
                <div className="mt-1 text-[11px] leading-snug text-muted-foreground">{d}</div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground/80">
            Decision-support system. Results are field screening assessments and do not replace laboratory forensic confirmation.
          </p>
        </div>
        <div className="relative text-[11px] text-muted-foreground">Authorized personnel only · All access is audited</div>
      </div>

      {/* Right login form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo size={34} />
            <div>
              <div className="text-lg font-extrabold">BiOrion</div>
              <div className="text-[11px] text-muted-foreground">Field Drug Testing &amp; Evidence Management</div>
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">BiOrion Secure Access</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in with your issued officer credentials.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="oid">Officer ID</Label>
              <Input id="oid" placeholder="e.g. OF-4471" value={officerId} onChange={(e) => setOfficerId(e.target.value)}
                className="h-11 bg-secondary/40 font-mono-data" autoComplete="username" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-secondary/40" autoComplete="current-password" />
            </div>
            {error && <p className="text-xs font-medium text-red-400">{error}</p>}
            <button type="button" className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-secondary/30 py-2.5 text-sm text-muted-foreground hover:bg-secondary/60">
              <Fingerprint className="h-4 w-4 text-cyan-400" /> Biometric verification (device dependent)
            </button>
            <Button type="submit" disabled={busy} className="h-11 w-full bg-cyan-500 font-semibold text-[hsl(222,47%,7%)] hover:bg-cyan-400">
              {busy ? 'Establishing secure session…' : <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4" /> Sign In <ChevronRight className="h-4 w-4" /></span>}
            </Button>
            <Button type="button" variant="outline" className="h-11 w-full border-cyan-500/40 font-semibold text-cyan-300 hover:bg-cyan-500/10"
              onClick={() => { login('OF-4471', true); navigate('/'); }}>
              ENTER DEMO MODE
            </Button>
          </form>

          <div className="mt-8 grid grid-cols-1 gap-2 text-xs text-muted-foreground">
            {[['Encrypted Session', ShieldCheck], ['Evidence Integrity Enabled', Lock], ['Audit Logging Enabled', FileClock]].map(([t, I]) => {
              const Icon = I as typeof ShieldCheck;
              return (
                <div key={t as string} className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-emerald-400" /> {t as string}
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
