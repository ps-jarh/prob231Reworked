import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ShieldCheck } from 'lucide-react';

export default function AuditLog() {
  const { events } = useStore();
  const [q, setQ] = useState('');
  const rows = useMemo(() => events.filter((e) =>
    !q || [e.testId, e.actor, e.action, e.eventId].join(' ').toLowerCase().includes(q.toLowerCase())
  ).slice(0, 80), [events, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-cyan-400" /> Tamper-evident chronological trail — every action is recorded and timestamped.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search test, actor, action…" className="bg-secondary/40 pl-9" />
        </div>
      </div>

      <Card className="bg-card">
        <CardHeader className="pb-2"><CardTitle className="text-base">Events ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="relative ml-2 space-y-5 border-l border-border pl-6">
            {rows.map((e) => (
              <div key={e.id} className="relative">
                <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full border-2 border-cyan-400 bg-background" />
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <span className="font-mono-data text-xs text-muted-foreground">{new Date(e.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                  <span className="text-sm font-medium">{e.action}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                  <span className="font-mono-data">{e.eventId}</span>
                  <span>Actor: {e.actor}</span>
                  <span className="font-mono-data">{e.testId}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-400"><ShieldCheck className="h-3 w-3" /> {e.status}</span>
                  {e.metadata && <span className="font-mono-data text-cyan-300/80">{e.metadata}</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
