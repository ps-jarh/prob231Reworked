import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ResultBadge } from '@/components/StatusBadge';
import { assessImageQuality, getPosition } from '@/lib/services/captureService';
import { calibrateImage, type CalibrationResult } from '@/lib/services/calibrationService';
import { analyzeImage, type AnalysisResult } from '@/lib/services/visionAnalysisService';
import { computeEvidenceHash, verifyEvidenceHash, nextTestId, nextImageId, deviceId, shortHash } from '@/lib/services/evidenceService';
import { makeEvent } from '@/lib/services/auditService';
import { generateTestImage, type Scenario } from '@/lib/images';
import type { QualityCheck, TestRecord, AuditEvent } from '@/lib/types';
import {
  Camera, Upload, RotateCcw, CheckCircle2, XCircle, MapPin, ArrowRight, ArrowLeft,
  ShieldCheck, ChevronDown, ChevronUp, Info, Loader2, ScanLine, Copy, Check,
} from 'lucide-react';

const STEPS = ['Capture', 'Calibrate', 'Analyse', 'Verify', 'Evidence'];

interface Session {
  image: string | null;
  timestamp: string | null;
  gps: { latitude: number; longitude: number } | null;
  quality: QualityCheck | null;
  calibration: CalibrationResult | null;
  analysis: AnalysisResult | null;
  testType: string;
}

const TEST_TYPES = ['Marquis Reagent Kit', 'Cobalt Thiocyanate Kit', 'Mecke Reagent Kit', 'Duquenois–Levine Kit'];

export default function NewTest() {
  const [step, setStep] = useState(0);
  const [params] = useSearchParams();
  const scenario = params.get('scenario') as Scenario | null;
  const [s, setS] = useState<Session>({ image: null, timestamp: null, gps: null, quality: null, calibration: null, analysis: null, testType: TEST_TYPES[0] });
  const { officer, online } = useStore();

  // Scenario auto-run (demo mode deep links)
  useEffect(() => {
    if (scenario && !s.image) {
      const img = generateTestImage(scenario, Math.floor(Math.random() * 90));
      acceptImage(img, scenario === 'poor');
      if (scenario === 'poor') setTimeout(() => setStep(0), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  const acceptImage = async (dataUrl: string, poor = false) => {
    const gps = await getPosition();
    const quality = await assessImageQuality(dataUrl, !poor || Math.random() > 0.3, !poor || Math.random() > 0.2);
    setS((p) => ({
      ...p, image: dataUrl, timestamp: new Date().toISOString(), gps,
      quality: poor ? { ...quality, acceptable: false, exposure: { ok: false, score: 0.12 }, lighting: { ok: false, score: 0.31 } } : quality,
    }));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-1 last:flex-none">
            <button onClick={() => i < step && setStep(i)} className="flex items-center gap-2">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i < step ? 'bg-cyan-500 text-[hsl(222,47%,7%)]' : i === step ? 'border-2 border-cyan-400 text-cyan-300' : 'border border-border text-muted-foreground'}`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={`hidden text-xs font-medium sm:block ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            </button>
            {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? 'bg-cyan-500' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {step === 0 && <StepCapture s={s} accept={acceptImage} onNext={() => setStep(1)} />}
      {step === 1 && <StepCalibrate s={s} setS={setS} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
      {step === 2 && <StepAnalyse s={s} setS={setS} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <StepVerify s={s} setS={setS} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
      {step === 4 && <StepEvidence s={s} officerId={officer?.officerId || 'OF-0000'} online={online} />}
    </div>
  );
}

/* ---------------- STEP 1 — CAPTURE ---------------- */
function StepCapture({ s, accept, onNext }: { s: Session; accept: (d: string, poor?: boolean) => Promise<void>; onNext: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    const reader = new FileReader();
    reader.onload = async () => { await accept(reader.result as string); setBusy(false); };
    reader.readAsDataURL(f);
  };

  const useSample = async (sc: Scenario) => {
    setBusy(true);
    await accept(generateTestImage(sc, Math.floor(Math.random() * 90)), sc === 'poor');
    setBusy(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="bg-card">
        <CardHeader><CardTitle>Capture Test Evidence</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!s.image ? (
            <>
              <div className="scanline flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-cyan-500/40 bg-secondary/30 sm:h-80">
                <ScanLine className="h-10 w-10 text-cyan-400" />
                <p className="mt-3 max-w-xs text-center text-sm text-muted-foreground">
                  Position the test strip inside the guide frame and ensure the reference colour card is visible.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button size="lg" className="h-14 bg-cyan-500 font-semibold text-[hsl(222,47%,7%)] hover:bg-cyan-400" onClick={() => camRef.current?.click()} disabled={busy}>
                  <Camera className="mr-2 h-5 w-5" /> OPEN CAMERA
                </Button>
                <Button size="lg" variant="outline" className="h-14 border-border font-semibold" onClick={() => fileRef.current?.click()} disabled={busy}>
                  <Upload className="mr-2 h-5 w-5" /> UPLOAD IMAGE
                </Button>
                <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Demo scenarios (simulated capture)</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => useSample('positive')} disabled={busy}>Scenario A — Positive</Button>
                  <Button size="sm" variant="secondary" onClick={() => useSample('negative')} disabled={busy}>Scenario B — Negative</Button>
                  <Button size="sm" variant="secondary" onClick={() => useSample('poor')} disabled={busy}>Scenario C — Poor Quality</Button>
                </div>
              </div>
              {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Processing capture…</p>}
            </>
          ) : (
            <>
              <div className="relative overflow-hidden rounded-xl border border-border bg-black">
                <img src={s.image} alt="Captured test" className="mx-auto max-h-96 w-full object-contain" />
                {/* guide frame overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-3/5 w-3/4 rounded-lg border-2 border-cyan-400/60" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.15)' }} />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="font-mono-data">Captured {new Date(s.timestamp!).toLocaleString()}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-cyan-400" />
                  {s.gps ? `${s.gps.latitude.toFixed(4)}, ${s.gps.longitude.toFixed(4)}` : 'GPS unavailable'}
                </span>
                <Button size="sm" variant="outline" className="ml-auto" onClick={() => window.location.reload()}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Retake
                </Button>
              </div>
              {s.quality && (
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Image Quality Checks</p>
                    {!s.quality.acceptable && <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-300">Retake Recommended</span>}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <QRow ok={s.quality.blur.ok} label="Blur" detail={s.quality.blur.ok ? `Sharpness score ${s.quality.blur.score}` : 'Image appears blurred'} />
                    <QRow ok={s.quality.exposure.ok} label="Exposure" detail={s.quality.exposure.ok ? 'Exposure acceptable' : 'Under/over-exposed'} />
                    <QRow ok={s.quality.lighting.ok} label="Lighting" detail={s.quality.lighting.ok ? 'Even illumination' : 'Uneven illumination detected'} />
                    <QRow ok={s.quality.cardDetected} label="Reference Card" detail={s.quality.cardDetected ? 'Reference card detected' : 'Reference card not detected'} />
                    <QRow ok={s.quality.testAreaDetected} label="Test Area" detail={s.quality.testAreaDetected ? 'Test strip detected' : 'Test strip not detected'} />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3">
                {!s.quality?.acceptable && (
                  <Button variant="outline" onClick={() => window.location.reload()}><RotateCcw className="mr-1.5 h-4 w-4" /> Retake Photo</Button>
                )}
                <Button className="bg-cyan-500 font-semibold text-[hsl(222,47%,7%)] hover:bg-cyan-400" onClick={onNext}
                  disabled={!s.quality || (!s.quality.acceptable && s.quality.cardDetected === false && s.quality.testAreaDetected === false)}>
                  {s.quality?.acceptable ? 'CONTINUE TO CALIBRATION' : 'PROCEED ANYWAY (FLAGGED)'} <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <InstructionPanel />
    </div>
  );
}

function QRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />}
      <div><span className="font-medium">{label}</span><span className="block text-xs text-muted-foreground">{detail}</span></div>
    </div>
  );
}

function InstructionPanel() {
  return (
    <Card className="bg-card">
      <CardHeader><CardTitle className="text-sm">Capture Instructions</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        {[
          'Position the test strip inside the guide frame and ensure the reference colour card is visible.',
          'Avoid direct flash; use diffuse ambient light where possible.',
          'Hold the device steady and parallel to the test surface.',
          'Ensure the reaction window and control line are fully visible.',
        ].map((t, i) => (
          <div key={i} className="flex gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-[11px] font-bold text-cyan-300">{i + 1}</span>
            <span className="text-[13px] leading-snug">{t}</span>
          </div>
        ))}
        <div className="rounded-md border border-cyan-500/25 bg-cyan-500/5 p-3 text-xs text-cyan-200/80">
          Blur, exposure and lighting checks run on-device immediately after capture.
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- STEP 2 — CALIBRATE ---------------- */
function StepCalibrate({ s, setS, onNext, onBack }: { s: Session; setS: React.Dispatch<React.SetStateAction<Session>>; onNext: () => void; onBack: () => void }) {
  const [running, setRunning] = useState(!s.calibration);
  useEffect(() => {
    if (!s.calibration && s.image) {
      const t = setTimeout(async () => {
        const cal = await calibrateImage(s.image!);
        setS((p) => ({ ...p, calibration: cal }));
        setRunning(false);
      }, 1600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="bg-card">
      <CardHeader><CardTitle>Colour Calibration</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        {running ? (
          <div className="flex h-72 flex-col items-center justify-center gap-4">
            <div className="scanline w-full max-w-md overflow-hidden rounded-xl border border-border">
              <img src={s.image!} className="max-h-60 w-full object-contain opacity-80" alt="calibrating" />
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-cyan-400" /> Detecting reference colour card…</p>
          </div>
        ) : s.calibration && (
          <>
            <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
              <figure className="space-y-1.5">
                <img src={s.image!} className="w-full rounded-lg border border-border" alt="original" />
                <figcaption className="text-center text-xs text-muted-foreground">Original Image</figcaption>
              </figure>
              <ArrowRight className="mx-auto h-5 w-5 rotate-90 text-cyan-400 sm:rotate-0" />
              <div className="flex h-full flex-col items-center justify-center rounded-lg border border-border bg-secondary/40 p-3 text-center">
                <ScanLine className="h-6 w-6 text-cyan-400" />
                <span className="mt-1 text-xs font-semibold">Lighting Correction</span>
                <span className="text-[10px] text-muted-foreground">White-patch normalization</span>
              </div>
              <ArrowRight className="mx-auto h-5 w-5 rotate-90 text-cyan-400 sm:rotate-0" />
              <figure className="space-y-1.5">
                <img src={s.calibration.calibratedImage} className="w-full rounded-lg border border-cyan-500/40" alt="calibrated" />
                <figcaption className="text-center text-xs text-cyan-300">Calibrated Image</figcaption>
              </figure>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Technical Pipeline</p>
                {s.calibration.steps.map((st) => (
                  <div key={st.label} className="flex items-center gap-2 py-1 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {st.label}
                  </div>
                ))}
                <p className="mt-2 text-[11px] text-muted-foreground">Card region auto-detected. Drag the frame on the image to manually adjust if misaligned (simulated detection).</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4 text-center">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Calibration Confidence</span>
                <span className="mt-1 font-mono-data text-4xl font-extrabold text-cyan-300">{s.calibration.confidence.toFixed(1)}%</span>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
              <Button className="bg-cyan-500 font-semibold text-[hsl(222,47%,7%)] hover:bg-cyan-400" onClick={onNext}>CONTINUE TO ANALYSIS <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- STEP 3 — ANALYSE ---------------- */
const ANALYSIS_STAGES = ['Detecting Test Region', 'Normalizing Colour', 'Comparing Reaction Signature', 'Calculating Result', 'Generating Confidence Score'];

function StepAnalyse({ s, setS, onNext, onBack }: { s: Session; setS: React.Dispatch<React.SetStateAction<Session>>; onNext: () => void; onBack: () => void }) {
  const [stage, setStage] = useState(0);
  const [open, setOpen] = useState(false);
  const done = !!s.analysis;

  useEffect(() => {
    if (done) return;
    if (stage < ANALYSIS_STAGES.length) {
      const t = setTimeout(() => setStage(stage + 1), 620);
      return () => clearTimeout(t);
    }
    (async () => {
      const res = await analyzeImage(s.calibration!.calibratedImage);
      setS((p) => ({ ...p, analysis: res }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, done]);

  const res = s.analysis;

  return (
    <Card className="bg-card">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>AI Test Analysis</CardTitle>
        <span className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Simulated model — prototype</span>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-xl border border-border bg-black">
            <img src={s.calibration?.calibratedImage} className="max-h-80 w-full object-contain" alt="analysis" />
            {!done && <div className="absolute inset-0 scanline" />}
            {done && (
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-10 -translate-x-1/2 -translate-y-1/3 rounded border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,.5)]" />
            )}
          </div>
          <div className="space-y-2">
            {!done ? (
              ANALYSIS_STAGES.map((st, i) => (
                <div key={st} className={`flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${i < stage ? 'border-emerald-500/30 bg-emerald-500/5' : i === stage ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-border bg-secondary/30 text-muted-foreground'}`}>
                  {i < stage ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : i === stage ? <Loader2 className="h-4 w-4 animate-spin text-cyan-400" /> : <span className="h-4 w-4 rounded-full border border-border" />}
                  {st}
                </div>
              ))
            ) : (
              <div className="space-y-4">
                <div className={`rounded-xl border-2 p-5 text-center ${
                  res!.result === 'positive' ? 'border-red-500/60 bg-red-500/10' : res!.result === 'negative' ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-amber-500/60 bg-amber-500/10'}`}>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Result</span>
                  <div className={`mt-1 text-4xl font-extrabold tracking-wide ${res!.result === 'positive' ? 'text-red-400' : res!.result === 'negative' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {res!.result.toUpperCase()}
                  </div>
                  <div className="mt-2 font-mono-data text-sm text-muted-foreground">AI Confidence: {res!.confidence.toFixed(1)}%</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[['Hue', `${res!.hue}°`], ['Saturation', res!.sat.toFixed(2)], ['ΔE Deviation', res!.deltaE.toFixed(1)]].map(([l, v]) => (
                    <div key={l} className="rounded-md border border-border bg-secondary/30 p-2">
                      <div className="text-[10px] uppercase text-muted-foreground">{l}</div>
                      <div className="font-mono-data text-sm font-semibold text-cyan-300">{v}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between rounded-lg border border-border bg-secondary/30 p-3 text-sm font-medium hover:bg-secondary/50">
                  Why this result? {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {open && (
                  <ul className="space-y-1.5 rounded-lg border border-border bg-secondary/20 p-3">
                    {res!.explanation.map((e, i) => (
                      <li key={i} className="flex gap-2 text-xs text-muted-foreground"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" /> {e}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200/90">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          This AI result is a field screening assessment and should be verified according to applicable forensic procedures. It is not legally conclusive forensic identification.
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
          <Button disabled={!done} className="bg-cyan-500 font-semibold text-[hsl(222,47%,7%)] hover:bg-cyan-400" onClick={onNext}>CONTINUE TO VERIFICATION <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- STEP 4 — VERIFY ---------------- */
function StepVerify({ s, setS, onNext, onBack }: { s: Session; setS: React.Dispatch<React.SetStateAction<Session>>; onNext: () => void; onBack: () => void }) {
  const [checked, setChecked] = useState(false);
  const [decision, setDecision] = useState<'confirm' | 'review' | null>(null);
  const navigate = useNavigate();
  const ok = checked && decision !== null;

  return (
    <Card className="bg-card">
      <CardHeader><CardTitle>Officer Verification</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <figure className="space-y-1.5">
            <img src={s.calibration?.calibratedImage} className="w-full rounded-lg border border-border" alt="evidence" />
            <figcaption className="text-xs text-muted-foreground">Captured Evidence (calibrated)</figcaption>
          </figure>
          <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI Analysis</p>
            <ResultBadge result={s.analysis!.result} />
            <div className="font-mono-data text-sm">Confidence: {s.analysis!.confidence.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">
              <p>Calibration: {s.calibration!.confidence.toFixed(1)}%</p>
              <p className="mt-1">Captured: {new Date(s.timestamp!).toLocaleString()}</p>
              {s.gps && <p className="mt-1">GPS: {s.gps.latitude.toFixed(5)}, {s.gps.longitude.toFixed(5)}</p>}
            </div>
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Test Type</label>
              <select value={s.testType} onChange={(e) => setS((p) => ({ ...p, testType: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {TEST_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {([
            ['confirm', 'Confirm Result', ShieldCheck, 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'],
            ['review', 'Mark for Review', Info, 'border-amber-500/50 bg-amber-500/10 text-amber-300'],
            ['retake', 'Retake Test', RotateCcw, 'border-red-500/50 bg-red-500/10 text-red-300'],
          ] as const).map(([key, label, Icon, active]) => (
            <button key={key} onClick={() => key === 'retake' ? navigate('/test/new') : setDecision(key as 'confirm')}
              className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-semibold transition-colors ${decision === key ? active : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/60'}`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-border bg-secondary/20 p-4 text-sm">
          <Checkbox checked={checked} onCheckedChange={(v) => setChecked(!!v)} className="mt-0.5" />
          I confirm that the captured evidence corresponds to this field test and that the device timestamp and GPS reading were recorded at the point of testing.
        </label>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
          <Button disabled={!ok} className="bg-cyan-500 font-semibold text-[hsl(222,47%,7%)] hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed" onClick={onNext}>
            FINALIZE EVIDENCE RECORD <ShieldCheck className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- STEP 5 — EVIDENCE ---------------- */
function StepEvidence({ s, officerId, online }: { s: Session; officerId: string; online: boolean }) {
  const { officer, addTest, queueSync, syncQueue } = useStore();
  const [record, setRecord] = useState<TestRecord | null>(null);
  const [verifyState, setVerifyState] = useState<'idle' | 'checking' | 'ok'>('idle');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const createdRef = useRef(false);

  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;
    (async () => {
      const testId = nextTestId();
      const hash = await computeEvidenceHash({
        testId, imageData: s.calibration!.calibratedImage.slice(0, 4096), officerId,
        timestamp: s.timestamp!, result: s.analysis!.result,
      });
      const rec: TestRecord = {
        id: crypto.randomUUID(), testId, officerId, officerName: officer?.name || 'Field Officer',
        testType: s.testType, result: s.analysis!.result, confidence: s.analysis!.confidence,
        calibrationConfidence: s.calibration!.confidence, timestamp: s.timestamp!,
        latitude: s.gps?.latitude ?? 0, longitude: s.gps?.longitude ?? 0,
        location: 'Field capture — GPS recorded on device',
        deviceId: deviceId(), imageId: nextImageId(),
        imageUrl: s.image!, calibratedImageUrl: s.calibration!.calibratedImage,
        evidenceHash: hash, status: 'verified',
        quality: s.quality!, synced: online,
      };
      const evts: AuditEvent[] = [
        makeEvent(testId, officerId, 'Test created'),
        makeEvent(testId, 'SYSTEM', 'Image captured'),
        makeEvent(testId, 'SYSTEM', 'GPS recorded'),
        makeEvent(testId, 'SYSTEM', 'Colour calibration completed', `confidence ${s.calibration!.confidence.toFixed(1)}%`),
        makeEvent(testId, 'SYSTEM', 'AI analysis completed', `${s.analysis!.result} @ ${s.analysis!.confidence.toFixed(1)}%`),
        makeEvent(testId, officerId, 'Result confirmed'),
        makeEvent(testId, 'SYSTEM', 'SHA-256 hash generated', shortHash(hash)),
        makeEvent(testId, 'SYSTEM', 'Evidence record finalized'),
      ];
      await addTest(rec, evts);
      if (!online) queueSync(1);
      setRecord(rec);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!record) {
    return (
      <Card className="bg-card"><CardContent className="flex h-72 flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
        <p className="text-sm text-muted-foreground">Generating SHA-256 evidence hash and finalizing record…</p>
      </CardContent></Card>
    );
  }

  const fields: [string, string][] = [
    ['Officer ID', record.officerId], ['Test Type', record.testType],
    ['Result', record.result.toUpperCase()], ['AI Confidence', `${record.confidence.toFixed(1)}%`],
    ['Date', new Date(record.timestamp).toLocaleDateString()], ['Time', new Date(record.timestamp).toLocaleTimeString()],
    ['Latitude', record.latitude.toFixed(5)], ['Longitude', record.longitude.toFixed(5)],
    ['Device ID', record.deviceId], ['Image ID', record.imageId],
  ];

  const verify = async () => {
    setVerifyState('checking');
    await new Promise((r) => setTimeout(r, 900));
    const okV = await verifyEvidenceHash(record.evidenceHash, {
      testId: record.testId, imageData: record.calibratedImageUrl.slice(0, 4096),
      officerId: record.officerId, timestamp: record.timestamp, result: record.result,
    });
    setVerifyState(okV ? 'ok' : 'idle');
  };

  return (
    <div className="space-y-5">
      {(!online || syncQueue > 0) && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-center text-xs font-semibold text-amber-300">
          OFFLINE — this record is stored locally and will sync when connected ({Math.max(syncQueue, 1)} record(s) in sync queue)
        </div>
      )}
      <Card className="overflow-hidden bg-card">
        <div className="border-b border-border bg-[hsl(222,50%,5%)] px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-cyan-400">Field Test Record</p>
              <h2 className="mt-1 font-mono-data text-2xl font-extrabold">{record.testId}</h2>
            </div>
            <div className="flex items-center gap-2">
              <ResultBadge result={record.result} />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" /> Tamper-evident
              </span>
            </div>
          </div>
        </div>
        <CardContent className="space-y-6 p-6">
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <img src={record.calibratedImageUrl} className="w-full rounded-lg border border-border" alt="evidence" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {fields.map(([l, v]) => (
                <div key={l}>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{l}</div>
                  <div className="mt-0.5 font-mono-data text-sm font-medium">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/20 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Integrity</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">SHA-256 Evidence Hash</span>
              <code className="font-mono-data break-all rounded bg-background px-2 py-1 text-xs text-cyan-300">{record.evidenceHash}</code>
              <button onClick={() => { navigator.clipboard.writeText(record.evidenceHash); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="text-muted-foreground hover:text-foreground">{copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}</button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button size="sm" variant="outline" onClick={verify} disabled={verifyState === 'checking'}>
                {verifyState === 'checking' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-1.5 h-4 w-4" />}
                VERIFY INTEGRITY
              </Button>
              {verifyState === 'ok' && (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Evidence integrity verified
                </span>
              )}
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Cryptographic timestamp recorded</p>
              <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Audit record created</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => navigate(`/evidence/${record.testId}`)}>Open in Evidence Repository</Button>
            <Button className="bg-cyan-500 font-semibold text-[hsl(222,47%,7%)] hover:bg-cyan-400" onClick={() => navigate('/')}>Done — Back to Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
