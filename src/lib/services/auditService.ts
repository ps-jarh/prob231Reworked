import type { AuditEvent } from '../types';

let seq = 40000;
export function makeEvent(testId: string, actor: string, action: string, metadata?: string): AuditEvent {
  return {
    id: crypto.randomUUID(),
    eventId: `EVT-${String(seq++).padStart(6, '0')}`,
    testId,
    actor,
    action,
    timestamp: new Date().toISOString(),
    status: 'recorded',
    metadata,
  };
}
