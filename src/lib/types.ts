export type TestResult = 'positive' | 'negative' | 'inconclusive';
export type EvidenceStatus = 'verified' | 'pending_review';

export interface QualityCheck {
  blur: { ok: boolean; score: number };
  exposure: { ok: boolean; score: number };
  lighting: { ok: boolean; score: number };
  cardDetected: boolean;
  testAreaDetected: boolean;
  acceptable: boolean;
}

export interface TestRecord {
  id: string;
  testId: string;
  officerId: string;
  officerName: string;
  testType: string;
  result: TestResult;
  confidence: number;
  calibrationConfidence: number;
  timestamp: string; // ISO
  latitude: number;
  longitude: number;
  location: string;
  deviceId: string;
  imageId: string;
  imageUrl: string;
  calibratedImageUrl: string;
  evidenceHash: string;
  status: EvidenceStatus;
  quality: QualityCheck;
  synced: boolean;
}

export interface AuditEvent {
  id: string;
  eventId: string;
  testId: string;
  actor: string;
  action: string;
  timestamp: string;
  status: 'recorded' | 'verified';
  metadata?: string;
}

export interface Officer {
  id: string;
  officerId: string;
  name: string;
  role: string;
  department: string;
}
