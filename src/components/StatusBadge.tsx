import { Badge } from '@/components/ui/badge';
import type { TestResult, EvidenceStatus } from '@/lib/types';

export function ResultBadge({ result }: { result: TestResult }) {
  const map = {
    positive: 'bg-red-500/15 text-red-400 border-red-500/30',
    negative: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    inconclusive: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  } as const;
  return <Badge variant="outline" className={`uppercase tracking-wide font-semibold ${map[result]}`}>{result}</Badge>;
}

export function StatusBadge({ status }: { status: EvidenceStatus }) {
  return status === 'verified'
    ? <Badge variant="outline" className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30">Verified</Badge>
    : <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30">Pending Review</Badge>;
}
