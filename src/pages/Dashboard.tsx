import { useNavigate } from 'react-router';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResultBadge, StatusBadge } from '@/components/StatusBadge';
import { Plus, FlaskConical, ShieldCheck, AlertTriangle, FileCheck, TrendingUp } from 'lucide-react';

function isToday(iso: string) {
  const d = new Date(iso), n = new Date();
  return d.toDateString() === n.toDateString();
}

export default function Dashboard() {
  const { tests, officer } = useStore();
  const navigate = useNavigate();
  const today = tests.filter((t) => isToday(t.timestamp));
  const pos = tests.filter((t) => t.result === 'positive').length;
  const neg = tests.filter((t) => t.result === 'negative').length;
  const inc = tests.filter((t) => t.result === 'inconclusive').length;
  const verified = tests.filter((t) => t.status === 'verified').length;

  const kpis = [
    { label: 'Tests Today', value: today.length, icon: FlaskConical },
    { label: 'Positive', value: pos, icon: AlertTriangle, tint: 'text-red-400' },
    { label: 'Negative', value: neg, icon: TrendingUp, tint: 'text-emerald-400' },
    { label: 'Inconclusive', value: inc, icon: AlertTriangle, tint: 'text-amber-400' },
    { label: 'Evidence Records', value: verified, icon: FileCheck, tint: 'text-cyan-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Field Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {officer?.name} · {officer?.department}
          </p>
        </div>
        <Button size="lg" className="bg-cyan-500 font-semibold text-[hsl(222,47%,7%)] hover:bg-cyan-400" onClick={() => navigate('/test/new')}>
          <Plus className="mr-1.5 h-5 w-5" /> START NEW TEST
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label} className="bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{k.label}</span>
                <k.icon className={`h-4 w-4 ${k.tint || 'text-muted-foreground'}`} />
              </div>
              <div className="mt-2 text-3xl font-extrabold tabular-nums">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card">
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recent Tests</CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-cyan-400" /> All records tamper-evident
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Test ID</TableHead>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead className="hidden lg:table-cell">Location</TableHead>
                  <TableHead className="hidden md:table-cell">Test Type</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                  <TableHead className="hidden sm:table-cell">Evidence Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.slice(0, 10).map((t) => (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => navigate(`/evidence/${t.testId}`)}>
                    <TableCell className="font-mono-data text-xs text-cyan-300">{t.testId}</TableCell>
                    <TableCell className="text-xs">{new Date(t.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                    <TableCell className="hidden max-w-52 truncate text-xs text-muted-foreground lg:table-cell">{t.location}</TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{t.testType}</TableCell>
                    <TableCell><ResultBadge result={t.result} /></TableCell>
                    <TableCell className="text-right font-mono-data text-xs">{t.confidence.toFixed(1)}%</TableCell>
                    <TableCell className="hidden sm:table-cell"><StatusBadge status={t.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
