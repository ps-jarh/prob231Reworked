import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResultBadge, StatusBadge } from '@/components/StatusBadge';
import { verifyEvidenceHash, shortHash } from '@/lib/services/evidenceService';
import { exportPdfReport } from '@/lib/report';
import { ArrowLeft, ShieldCheck, Loader2, CheckCircle2, MapPin, FileDown, Copy, Check } from 'lucide-react';

export default function EvidenceDetail() {
  const { testId } = useParams();
  const { tests, events } = useStore();
  const navigate = useNavigate();
  const t = tests.find((x) => x.testId === testId);
  const [verifyState, setVerifyState] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');
  const [copied, setCopied] = useState(false);

  if (!t) {
    return <div className="py-20 text-center text-muted-foreground">Record not found. <Button variant="link" onClick={() => navigate('/evidence')}>Back to repository</Button></div>;
  }
  const rows = events.filter((e) => e.testId === t.testId).sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const verify = async () => {
    setVerifyState('checking');
    await new Promise((r) => setTimeout(r, 900));
    const ok = await verifyEvidenceHash(t.evidenceHash, {
      testId: t.testId, imageData: t.calibratedImageUrl.slice(0, 4096),
      officerId: t.officerId, timestamp: t.timestamp, result: t.result,
    });
    setVerifyState(ok ? 'ok' : 'fail');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/evidence')}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="font-mono-data text-xl font-bold">{t.testId}</h1>
            <p className="text-xs text-muted-foreground">{t.testType} · {new Date(t.timestamp).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ResultBadge result={t.result} />
          <StatusBadge status={t.status} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="bg-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Original Capture</CardTitle></CardHeader>
          <CardContent><img src={t.imageUrl} className="w-full rounded-lg border border-border" alt="original" /></CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Calibrated Image</CardTitle></CardHeader>
          <CardContent><img src={t.calibratedImageUrl} className="w-full rounded-lg border border-cyan-500/30" alt="calibrated" /></CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="bg-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Test Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {([
              ['Officer', `${t.officerName} (${t.officerId})`],
              ['AI Confidence', `${t.confidence.toFixed(1)}%`],
              ['Calibration Confidence', `${t.calibrationConfidence.toFixed(1)}%`],
              ['Officer Verification', t.status === 'verified' ? 'Confirmed' : 'Pending'],
              ['Device ID', t.deviceId],
              ['Image ID', t.imageId],
            ] as [string, string][]).map(([l, v]) => (
              <div key={l}><div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{l}</div><div className="mt-0.5 font-mono-data text-xs">{v}</div></div>
            ))}
            <div className="col-span-2 flex items-start gap-1.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
              <div>
                <div className="text-xs">{t.location}</div>
                <div className="font-mono-data text-[11px] text-muted-foreground">{t.latitude.toFixed(5)}, {t.longitude.toFixed(5)} · {new Date(t.timestamp).toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Integrity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">SHA-256 Evidence Hash</span>
              <div className="mt-1 flex items-center gap-2">
                <code className="font-mono-data break-all rounded bg-secondary/50 px-2 py-1.5 text-[11px] text-cyan-300">{t.evidenceHash}</code>
                <button onClick={() => { navigator.clipboard.writeText(t.evidenceHash); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={verify} disabled={verifyState === 'checking'}>
                {verifyState === 'checking' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-1.5 h-4 w-4" />}
                VERIFY EVIDENCE INTEGRITY
              </Button>
              <Button size="sm" className="bg-cyan-500 font-semibold text-[hsl(222,47%,7%)] hover:bg-cyan-400" onClick={() => exportPdfReport(t, events)}>
                <FileDown className="mr-1.5 h-4 w-4" /> EXPORT PDF REPORT
              </Button>
            </div>
            {verifyState === 'ok' && <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Evidence integrity verified — hash matches recorded value ({shortHash(t.evidenceHash)})</p>}
            {verifyState === 'fail' && <p className="text-sm font-semibold text-red-400">Integrity check failed — record may have been tampered with.</p>}
            <p className="text-xs text-muted-foreground">Cryptographic timestamp recorded · Audit record created · Simulated verification recomputes the hash from stored evidence fields.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Audit History</CardTitle></CardHeader>
        <CardContent>
          <div className="relative ml-2 space-y-4 border-l border-border pl-6">
            {rows.map((e) => (
              <div key={e.id} className="relative">
                <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full border-2 border-cyan-400 bg-background" />
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-mono-data text-xs text-muted-foreground">{new Date(e.timestamp).toLocaleTimeString()}</span>
                  <span className="text-sm font-medium">{e.action}</span>
                  <span className="font-mono-data text-[10px] text-muted-foreground">{e.eventId} · {e.actor}</span>
                  {e.metadata && <span className="font-mono-data text-[10px] text-cyan-300/80">{e.metadata}</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
