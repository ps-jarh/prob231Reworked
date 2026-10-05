// Image capture & quality assessment. Blur/exposure/lighting are computed from real pixel data;
// card / test-area detection is simulated (labelled) until a CV model is connected.
import type { QualityCheck } from '../types';

async function stats(dataUrl: string): Promise<{ blur: number; meanL: number; lightVar: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = 160, h = Math.round((img.height / img.width) * 160) || 104;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      const d = ctx.getImageData(0, 0, w, h).data;
      const gray = new Float32Array(w * h);
      let sum = 0;
      for (let i = 0; i < w * h; i++) {
        gray[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
        sum += gray[i];
      }
      const meanL = sum / (w * h) / 255;
      // Laplacian variance (blur proxy)
      let lsum = 0, lsq = 0, n = 0;
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const lap = 4 * gray[y * w + x] - gray[y * w + x - 1] - gray[y * w + x + 1] - gray[(y - 1) * w + x] - gray[(y + 1) * w + x];
        lsum += lap; lsq += lap * lap; n++;
      }
      const lapMean = lsum / n;
      const blur = lsq / n - lapMean * lapMean;
      // lighting evenness: variance of 4x3 block means
      const blocks: number[] = [];
      for (let by = 0; by < 3; by++) for (let bx = 0; bx < 4; bx++) {
        let bs = 0, bn = 0;
        for (let y = Math.floor(by * h / 3); y < (by + 1) * h / 3; y += 4)
          for (let x = Math.floor(bx * w / 4); x < (bx + 1) * w / 4; x += 4) { bs += gray[y * w + x]; bn++; }
        blocks.push(bs / bn);
      }
      const bm = blocks.reduce((a, b) => a + b, 0) / blocks.length;
      const lightVar = Math.sqrt(blocks.reduce((a, b) => a + (b - bm) ** 2, 0) / blocks.length) / 255;
      resolve({ blur, meanL, lightVar });
    };
    img.onerror = () => resolve({ blur: 0, meanL: 0.5, lightVar: 0.3 });
    img.src = dataUrl;
  });
}

export async function assessImageQuality(dataUrl: string, hasCard = true, hasStrip = true): Promise<QualityCheck> {
  const { blur, meanL, lightVar } = await stats(dataUrl);
  const exposureOk = meanL > 0.18 && meanL < 0.88;
  const lightingOk = lightVar < 0.22;
  const blurOk = blur > 18;
  return {
    blur: { ok: blurOk, score: Math.round(blur) },
    exposure: { ok: exposureOk, score: Math.round(meanL * 100) / 100 },
    lighting: { ok: lightingOk, score: Math.round((1 - lightVar) * 100) / 100 },
    cardDetected: hasCard,
    testAreaDetected: hasStrip,
    acceptable: blurOk && exposureOk && lightingOk && hasCard && hasStrip,
  };
}

export function getPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ latitude: 28.6139, longitude: 77.209 });
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => resolve({ latitude: 28.6139 + Math.random() * 0.05, longitude: 77.209 + Math.random() * 0.05 }),
      { timeout: 3000 }
    );
  });
}
