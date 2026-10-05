import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area,
} from 'recharts';

const COLORS = { positive: '#f87171', negative: '#34d399', inconclusive: '#fbbf24' };
const TT = { contentStyle: { background: 'hsl(221 42% 10%)', border: '1px solid hsl(217 28% 16%)', borderRadius: 8, fontSize: 12 }, labelStyle: { color: '#94a3b8' } };

function dayKey(iso: string) { return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' }); }

export default function Analytics() {
  const { tests } = useStore();

  const data = useMemo(() => {
    const byDay = new Map<string, { day: string; tests: number; confidence: number[] }>();
    [...tests].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).forEach((t) => {
      const k = dayKey(t.timestamp);
      const e = byDay.get(k) || { day: k, tests: 0, confidence: [] };
      e.tests++; e.confidence.push(t.confidence);
      byDay.set(k, e);
    });
    const timeline = [...byDay.values()].map((d) => ({
      day: d.day, tests: d.tests,
      confidence: Math.round(d.confidence.reduce((a, b) => a + b, 0) / d.confidence.length * 10) / 10,
    }));
    const results = (['positive', 'negative', 'inconclusive'] as const).map((r) => ({
      name: r[0].toUpperCase() + r.slice(1), value: tests.filter((t) => t.result === r).length,
    }));
    const byOfficer = new Map<string, number>();
    tests.forEach((t) => byOfficer.set(t.officerName, (byOfficer.get(t.officerName) || 0) + 1));
    const officers = [...byOfficer.entries()].map(([name, count]) => ({ name: name.replace(/^(Insp\.|SI|ASI)\s/, ''), count }));
    const byRegion = new Map<string, number>();
    tests.forEach((t) => {
      const r = t.location.split(',').pop()?.trim() || t.location;
      byRegion.set(r, (byRegion.get(r) || 0) + 1);
    });
    const regions = [...byRegion.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
    return { timeline, results, officers, regions };
  }, [tests]);

  const total = tests.length;
  const pct = (n: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);
  const avgConf = total ? tests.reduce((a, t) => a + t.confidence, 0) / total : 0;
  const review = tests.filter((t) => t.status === 'pending_review').length;

  const kpis = [
    ['Total Tests', String(total)],
    ['Positive Rate', `${pct(data.results[0].value)}%`],
    ['Negative Rate', `${pct(data.results[1].value)}%`],
    ['Inconclusive Rate', `${pct(data.results[2].value)}%`],
    ['Avg. Analysis Confidence', `${avgConf.toFixed(1)}%`],
    ['Tests Requiring Review', String(review)],
  ];

  // anonymized scatter map (relative lat/lon plot, no basemap tiles)
  const lats = tests.map((t) => t.latitude), lons = tests.map((t) => t.longitude);
  const minLa = Math.min(...lats), maxLa = Math.max(...lats), minLo = Math.min(...lons), maxLo = Math.max(...lons);
  const px = (lo: number) => 8 + ((lo - minLo) / ((maxLo - minLo) || 1)) * 84;
  const py = (la: number) => 92 - ((la - minLa) / ((maxLa - minLa) || 1)) * 84;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Supervisor view · anonymized aggregates only — no personal subject data is stored.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map(([l, v]) => (
          <Card key={l} className="bg-card"><CardContent className="p-4">
            <div className="text-[11px] font-medium text-muted-foreground">{l}</div>
            <div className="mt-1.5 font-mono-data text-2xl font-extrabold tabular-nums">{v}</div>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="bg-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Tests Over Time</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <LineChart data={data.timeline}>
                <CartesianGrid stroke="hsl(217 28% 16%)" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip {...TT} />
                <Line type="monotone" dataKey="tests" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3, fill: '#22d3ee' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Positive vs Negative vs Inconclusive</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.results} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                  <Cell fill={COLORS.positive} /><Cell fill={COLORS.negative} /><Cell fill={COLORS.inconclusive} />
                </Pie>
                <Tooltip {...TT} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Tests by Region</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.regions} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="hsl(217 28% 16%)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip {...TT} />
                <Bar dataKey="count" fill="#22d3ee" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Tests by Officer</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.officers}>
                <CartesianGrid stroke="hsl(217 28% 16%)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip {...TT} />
                <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Average Confidence Over Time</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <AreaChart data={data.timeline}>
                <CartesianGrid stroke="hsl(217 28% 16%)" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip {...TT} />
                <Area type="monotone" dataKey="confidence" stroke="#34d399" fill="rgba(52,211,153,.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Anonymized Test Locations</CardTitle></CardHeader>
          <CardContent>
            <svg viewBox="0 0 100 100" className="h-64 w-full rounded-lg border border-border bg-[hsl(222,50%,5%)]">
              {Array.from({ length: 9 }, (_, i) => (
                <g key={i} stroke="hsl(217 28% 14%)" strokeWidth="0.2">
                  <line x1={(i + 1) * 10} y1="0" x2={(i + 1) * 10} y2="100" />
                  <line x1="0" y1={(i + 1) * 10} x2="100" y2={(i + 1) * 10} />
                </g>
              ))}
              {tests.map((t) => (
                <circle key={t.id} cx={px(t.longitude)} cy={py(t.latitude)} r="1.4"
                  fill={COLORS[t.result]} opacity="0.85" />
              ))}
            </svg>
            <div className="mt-2 flex gap-4 text-[11px] text-muted-foreground">
              {(['positive', 'negative', 'inconclusive'] as const).map((r) => (
                <span key={r} className="inline-flex items-center gap-1.5 capitalize">
                  <span className="h-2 w-2 rounded-full" style={{ background: COLORS[r] }} /> {r}
                </span>
              ))}
              <span className="ml-auto">Approximate coordinates · jittered for privacy</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
