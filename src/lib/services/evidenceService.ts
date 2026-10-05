// Evidence integrity service — real SHA-256 via Web Crypto.
export async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function computeEvidenceHash(payload: {
  testId: string; imageData: string; officerId: string; timestamp: string; result: string;
}): Promise<string> {
  return sha256([payload.testId, payload.imageData, payload.officerId, payload.timestamp, payload.result].join('|'));
}

export async function verifyEvidenceHash(expected: string, payload: {
  testId: string; imageData: string; officerId: string; timestamp: string; result: string;
}): Promise<boolean> {
  const actual = await computeEvidenceHash(payload);
  return actual === expected;
}

export function shortHash(h: string): string {
  return h ? `${h.slice(0, 8)}…${h.slice(-6)}` : '';
}

let counter = 1200 + Math.floor(Math.random() * 80);
export function nextTestId(): string {
  return `FX-2026-${String(counter++).padStart(6, '0')}`;
}
export function nextImageId(): string {
  return `IMG-${Date.now().toString(36).toUpperCase()}`;
}
export function deviceId(): string {
  let d = localStorage.getItem('biorion_device');
  if (!d) { d = `DEV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`; localStorage.setItem('biorion_device', d); }
  return d;
}
