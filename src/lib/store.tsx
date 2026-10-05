import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { TestRecord, AuditEvent, Officer } from './types';
import { getDB, addTest as dbAddTest, addEvents as dbAddEvents, updateTest as dbUpdateTest } from './db';
import { OFFICERS } from './seed';

interface Store {
  ready: boolean;
  officer: Officer | null;
  login: (officerId: string, demo?: boolean) => void;
  logout: () => void;
  tests: TestRecord[];
  events: AuditEvent[];
  addTest: (t: TestRecord, evts: AuditEvent[]) => Promise<void>;
  updateTest: (testId: string, patch: Partial<TestRecord>) => Promise<void>;
  addEvents: (evts: AuditEvent[]) => Promise<void>;
  online: boolean;
  syncQueue: number;
  setOnline: (v: boolean) => void;
  queueSync: (n?: number) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<Store>(null!);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [officer, setOfficer] = useState<Officer | null>(() => {
    try { const s = sessionStorage.getItem('biorion_session'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [online, setOnlineState] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState(0);

  const refresh = useCallback(async () => {
    const db = await getDB();
    setTests([...db.tests]);
    setEvents([...db.events]);
  }, []);

  useEffect(() => { (async () => { await refresh(); setReady(true); })(); }, [refresh]);

  // simulated sync queue: when going offline during tests, queue 3 records; flush on reconnect
  const setOnline = useCallback((v: boolean) => {
    setOnlineState(v);
    if (!v) setSyncQueue((q) => Math.max(q, 0));
    else setTimeout(() => setSyncQueue(0), 2200);
  }, []);

  const queueSync = useCallback((n = 1) => {
    setSyncQueue((q) => q + n);
  }, []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => { setOnlineState(false); };
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, [setOnline]);

  const login = useCallback((officerId: string, demo = false) => {
    const o = demo
      ? OFFICERS[0]
      : OFFICERS.find((x) => x.officerId.toLowerCase() === officerId.toLowerCase()) || {
          id: 'uX', officerId: officerId.toUpperCase(), name: 'Field Officer', role: 'Field Officer',
          department: 'Narcotics Cell — North District',
        };
    setOfficer(o);
    sessionStorage.setItem('biorion_session', JSON.stringify(o));
  }, []);

  const logout = useCallback(() => { setOfficer(null); sessionStorage.removeItem('biorion_session'); }, []);

  const addTest = useCallback(async (t: TestRecord, evts: AuditEvent[]) => { await dbAddTest(t, evts); await refresh(); }, [refresh]);
  const updateTest = useCallback(async (id: string, p: Partial<TestRecord>) => { await dbUpdateTest(id, p); await refresh(); }, [refresh]);
  const addEvents = useCallback(async (e: AuditEvent[]) => { await dbAddEvents(e); await refresh(); }, [refresh]);

  const value = useMemo(() => ({
    ready, officer, login, logout, tests, events, addTest, updateTest, addEvents,
    online, syncQueue, setOnline, queueSync, refresh,
  }), [ready, officer, login, logout, tests, events, addTest, updateTest, addEvents, online, syncQueue, setOnline, queueSync, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
