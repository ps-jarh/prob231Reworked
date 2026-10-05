// Browser-local persistence (prototype). Production: PostgreSQL/Supabase tables
// Users / Tests / AuditEvents as specified in the data model.
import type { TestRecord, AuditEvent } from './types';
import { buildSeed } from './seed';

const KEY = 'biorion_db_v1';

interface DB { tests: TestRecord[]; events: AuditEvent[]; seeded: boolean; }

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupted -> reseed */ }
  return { tests: [], events: [], seeded: false };
}

let cache: DB | null = null;

export async function getDB(): Promise<DB> {
  if (cache) return cache;
  cache = load();
  if (!cache.seeded) {
    const { tests, events } = await buildSeed();
    cache = { tests, events, seeded: true };
    save();
  }
  return cache;
}

export function save() {
  try { if (cache) localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* quota */ }
}

export async function addTest(t: TestRecord, evts: AuditEvent[]) {
  const db = await getDB();
  db.tests.unshift(t);
  db.events.unshift(...evts);
  save();
}

export async function updateTest(testId: string, patch: Partial<TestRecord>) {
  const db = await getDB();
  const t = db.tests.find((x) => x.testId === testId);
  if (t) Object.assign(t, patch);
  save();
}

export async function addEvents(evts: AuditEvent[]) {
  const db = await getDB();
  db.events.unshift(...evts);
  save();
}
