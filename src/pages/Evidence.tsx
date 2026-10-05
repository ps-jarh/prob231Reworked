import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResultBadge, StatusBadge } from '@/components/StatusBadge';
import { Search } from 'lucide-react';

const FILTERS = ['all', 'positive', 'negative', 'inconclusive', 'pending_review', 'verified'] as const;

export default function Evidence() {
  const { tests } = useStore();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const navigate = useNavigate();

  const rows = useMemo(() => tests.filter((t) => {
    if (filter === 'positive' || filter === 'negative' || filter === 'inconclusive') { if (t.result !== filter) return false; }
    if (filter === 'pending_review' && t.status !== 'pending_review') return false;
    if (filter === 'verified' && t.status !== 'verified') return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return [t.testId, t.officerId, t.officerName, t.location, t.result, t.testType, new Date(t.timestamp).toLocaleDateString()]
      .join(' ').toLowerCase().includes(s);
  }), [tests, q, filter]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Evidence Repository</h1>
        <p className="mt-1 text-sm text-muted-foreground">{rows.length} record{rows.length !== 1 ? 's' : ''} · tamper-evident chain of custody</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Test ID, officer, location, date, result…"
            className="h-11 bg-secondary/40 pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${filter === f ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300' : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'}`}>
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
      <Card className="bg-card">
        <CardHeader className="pb-3"><CardTitle className="text-base">Records</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Test ID</TableHead><TableHead>Date &amp; Time</TableHead>
                  <TableHead className="hidden md:table-cell">Officer</TableHead>
                  <TableHead className="hidden lg:table-cell">Location</TableHead>
                  <TableHead>Result</TableHead><TableHead className="text-right">Confidence</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => navigate(`/evidence/${t.testId}`)}>
                    <TableCell className="font-mono-data text-xs text-cyan-300">{t.testId}</TableCell>
                    <TableCell className="text-xs">{new Date(t.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                    <TableCell className="hidden text-xs md:table-cell">{t.officerName}<span className="block font-mono-data text-[10px] text-muted-foreground">{t.officerId}</span></TableCell>
                    <TableCell className="hidden max-w-48 truncate text-xs text-muted-foreground lg:table-cell">{t.location}</TableCell>
                    <TableCell><ResultBadge result={t.result} /></TableCell>
                    <TableCell className="text-right font-mono-data text-xs">{t.confidence.toFixed(1)}%</TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">No records match the current search.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
