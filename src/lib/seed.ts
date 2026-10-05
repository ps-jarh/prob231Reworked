import type { TestRecord, AuditEvent, Officer, TestResult } from './types';
import { generateTestImage } from './images';
import { sha256 } from './services/evidenceService';

export const OFFICERS: Officer[] = [
  { id: 'u1', officerId: 'OF-4471', name: 'Insp. A. Rathore', role: 'Field Officer', department: 'Narcotics Cell — North District' },
  { id: 'u2', officerId: 'OF-4489', name: 'SI M. Deshmukh', role: 'Field Officer', department: 'Narcotics Cell — North District' },
  { id: 'u3', officerId: 'OF-4502', name: 'ASI K. Iyer', role: 'Field Officer', department: 'Narcotics Cell — South District' },
  { id: 'u4', officerId: 'OF-4618', name: 'SI R. Banerjee', role: 'Supervisor', department: 'Forensic Support Unit' },
];

const LOCATIONS: [string, number, number][] = [
  ['Sector 14 Checkpoint, North District', 28.6692, 77.1217],
  ['Highway NH-48 Toll Plaza', 28.4595, 77.0266],
  ['Old Market Patrol Zone 3', 28.6517, 77.2219],
  ['Railway Station — Platform 4', 28.6418, 77.2199],
  ['Border Check Post 7', 28.5245, 77.1855],
  ['Industrial Area Phase II', 28.6129, 77.2295],
  ['University Gate Patrol', 28.6863, 77.2098],
  ['Bus Terminal Bay 12', 28.6470, 77.2151],
];

const TEST_TYPES = ['Marquis Reagent Kit', 'Cobalt Thiocyanate Kit', 'Mecke Reagent Kit', 'Duquenois–Levine Kit'];
const ACTIONS = [
  'Test created', 'Image captured', 'GPS recorded', 'Colour calibration completed',
  'AI analysis completed', 'Result confirmed', 'SHA-256 hash generated', 'Evidence record finalized',
];

function rand<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }

export async function buildSeed(): Promise<{ tests: TestRecord[]; events: AuditEvent[] }> {
  const tests: TestRecord[] = [];
  const events: AuditEvent[] = [];
  let evtSeq = 10000;
  const now = Date.now();
  for (let i = 0; i < 24; i++) {
    const officer = rand(OFFICERS);
    const scenario: 'positive' | 'negative' = Math.random() < 0.45 ? 'positive' : 'negative';
    const inconclusive = Math.random() < 0.14;
    const result: TestResult = inconclusive ? 'inconclusive' : scenario;
    const image = generateTestImage(scenario === 'positive' ? 'positive' : 'negative', i);
    const ts = new Date(now - i * (3600e3 * (2 + Math.random() * 18))).toISOString();
    const testId = `FX-2026-${String(1080 + i).padStart(6, '0')}`;
    const loc = rand(LOCATIONS);
    const confidence = result === 'inconclusive' ? 52 + Math.random() * 9 : 86 + Math.random() * 12;
    const hash = await sha256([testId, image.slice(0, 4096), officer.officerId, ts, result].join('|'));
    const verified = Math.random() < 0.7;
    tests.push({
      id: crypto.randomUUID(), testId, officerId: officer.officerId, officerName: officer.name,
      testType: rand(TEST_TYPES), result, confidence: Math.round(confidence * 10) / 10,
      calibrationConfidence: Math.round((90 + Math.random() * 8) * 10) / 10,
      timestamp: ts, latitude: loc[1], longitude: loc[2], location: loc[0],
      deviceId: `DEV-FLD${String(3100 + (i % 6)).padStart(4, '0')}`,
      imageId: `IMG-${(9000 + i * 37).toString(36).toUpperCase()}`,
      imageUrl: image, calibratedImageUrl: image, evidenceHash: hash,
      status: verified ? 'verified' : 'pending_review',
      quality: {
        blur: { ok: true, score: 120 + Math.round(Math.random() * 200) },
        exposure: { ok: true, score: Math.round((0.35 + Math.random() * 0.3) * 100) / 100 },
        lighting: { ok: true, score: Math.round((0.8 + Math.random() * 0.15) * 100) / 100 },
        cardDetected: true, testAreaDetected: true, acceptable: true,
      },
      synced: true,
    });
    // per-test audit events
    let t = new Date(ts).getTime();
    for (const action of ACTIONS) {
      t += 4000 + Math.random() * 9000;
      events.push({
        id: crypto.randomUUID(), eventId: `EVT-${String(evtSeq++).padStart(6, '0')}`,
        testId, actor: action === 'Test created' || action.includes('Result') || action.includes('Evidence') ? officer.officerId : 'SYSTEM',
        action, timestamp: new Date(t).toISOString(), status: 'recorded',
      });
    }
  }
  tests.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return { tests, events };
}
