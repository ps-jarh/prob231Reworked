import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useStore } from '@/lib/store';
import { ShieldCheck, Lock, FileClock, KeyRound, Database, ScanLine } from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
  const { officer, online, setOnline, syncQueue } = useStore();
  const [flags, setFlags] = useState({ qualityGate: true, autoSync: true, audit: true, hash: true });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <Card className="bg-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Session</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Officer</div><div className="font-medium">{officer?.name}</div></div>
          <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Officer ID</div><div className="font-mono-data">{officer?.officerId}</div></div>
          <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Role</div><div>{officer?.role}</div></div>
          <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Department</div><div>{officer?.department}</div></div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Security &amp; Integrity</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {([
            ['qualityGate', ScanLine, 'Image quality gate', 'Require acceptable capture quality before analysis'],
            ['hash', Lock, 'SHA-256 evidence hashing', 'Hash computed at record finalization'],
            ['audit', FileClock, 'Audit logging', 'Chronological, tamper-evident event trail'],
            ['autoSync', Database, 'Automatic sync', 'Sync locally stored records when connectivity returns'],
          ] as const).map(([key, Icon, title, desc]) => (
            <div key={key} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3">
              <Icon className="h-5 w-5 text-cyan-400" />
              <div className="flex-1">
                <div className="text-sm font-medium">{title}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
              <Switch checked={flags[key]} onCheckedChange={(v) => setFlags((f) => ({ ...f, [key]: v }))} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Connectivity (simulation)</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-cyan-400" />
          <div className="flex-1">
            <div className="text-sm font-medium">{online ? 'Online' : 'Offline'} {syncQueue > 0 && `— ${syncQueue} record(s) queued`}</div>
            <div className="text-xs text-muted-foreground">Toggle to demonstrate offline field operation and sync queue.</div>
          </div>
          <Switch checked={online} onCheckedChange={setOnline} />
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><KeyRound className="h-4 w-4 text-cyan-400" /> Deployment Notes</CardTitle></CardHeader>
        <CardContent className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
          <p>Prototype: records persist in this browser's local storage. Production architecture targets PostgreSQL/Supabase with the Users / Tests / AuditEvents schema, secure object storage for images, server-side key management via environment variables, and role-based access control.</p>
          <p>AI analysis currently runs a simulated colourimetric classifier. The capture → quality → calibration → region detection → classification pipeline is modular (captureService, calibrationService, visionAnalysisService, evidenceService, auditService) so a validated computer-vision model endpoint can replace it without UI changes.</p>
        </CardContent>
      </Card>
    </div>
  );
}
