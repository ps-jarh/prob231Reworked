// Procedurally generated, clearly fictional field-test photographs (canvas → data URL).
export type Scenario = 'positive' | 'negative' | 'poor';

function drawCard(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Reference colour card: white / neutral greys / primaries swatch strip
  const swatches = ['#ffffff', '#c8c8c8', '#808080', '#404040', '#d33f49', '#2f7fd4', '#e6c229'];
  const w = 26;
  ctx.fillStyle = '#1c1f26';
  ctx.fillRect(x - 6, y - 6, w + 12, swatches.length * 22 + 12);
  swatches.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y + i * 22, w, 20);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(x, y + i * 22, w, 20);
  });
  return { x, y, w, h: swatches.length * 22 };
}

export function generateTestImage(scenario: Scenario, seed = 0): string {
  const W = 800, H = 520;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;

  // surface / background
  const g = ctx.createLinearGradient(0, 0, W, H);
  if (scenario === 'poor') {
    g.addColorStop(0, '#3a352b'); g.addColorStop(1, '#241f18');
  } else {
    g.addColorStop(0, '#8d9298'); g.addColorStop(1, '#6d7278');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  drawCard(ctx, 60, 90);

  // test strip cassette
  const sx = 220, sy = 170, sw = 380, sh = 180;
  ctx.save();
  ctx.translate(sx + sw / 2, sy + sh / 2);
  ctx.rotate((seed % 7 - 3) * 0.01);
  ctx.translate(-(sx + sw / 2), -(sy + sh / 2));
  ctx.fillStyle = scenario === 'poor' ? '#6e6a5e' : '#e9eaec';
  ctx.beginPath();
  ctx.roundRect(sx, sy, sw, sh, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.stroke();
  // result window
  ctx.fillStyle = scenario === 'poor' ? '#7d7668' : '#f6f5f0';
  ctx.beginPath();
  ctx.roundRect(sx + 40, sy + 40, sw - 80, sh - 80, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.stroke();

  // control line (always present)
  ctx.fillStyle = 'rgba(120,40,90,0.55)';
  ctx.fillRect(sx + 70, sy + 52, 8, sh - 104);
  ctx.fillStyle = '#333a44';
  ctx.font = '600 13px Inter, sans-serif';
  ctx.fillText('C', sx + 68, sy + 36);

  // reaction zone (T line)
  ctx.fillStyle = '#333a44';
  ctx.fillText('T', sx + sw / 2 - 4, sy + 36);
  if (scenario === 'positive') {
    const lg = ctx.createLinearGradient(sx + sw / 2 - 6, 0, sx + sw / 2 + 6, 0);
    lg.addColorStop(0, 'rgba(196,30,80,0)');
    lg.addColorStop(0.5, 'rgba(196,30,80,0.95)');
    lg.addColorStop(1, 'rgba(196,30,80,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(sx + sw / 2 - 7, sy + 52, 14, sh - 104);
  } else if (scenario === 'negative') {
    // no T line — faint background only
  }
  ctx.restore();

  if (scenario === 'poor') {
    // harsh shadows + noise + blur simulation via low alpha overlay and vignette
    const v = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 480);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 1600; i++) {
      ctx.fillStyle = `rgba(${Math.random() > .5 ? 255 : 0},${Math.random() > .5 ? 255 : 0},0,${Math.random() * 0.06})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }
  }
  return c.toDataURL('image/jpeg', 0.9);
}

/** Reaction-zone pixel statistics used by the simulated classifier. */
export function sampleReactionZone(dataUrl: string): Promise<{ hue: number; sat: number; deltaE: number; meanL: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 800 / img.width);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      // reaction zone: centre of cassette window (proportional coords)
      const zx = 0.5125 * c.width - 6, zy = 0.44 * c.height, zw = 12, zh = 0.12 * c.height;
      let r = 0, g = 0, b = 0, n = 0;
      try {
        const d = ctx.getImageData(Math.max(0, zx), zy, zw, Math.max(10, zh)).data;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
      } catch { /* fallthrough */ }
      r /= n; g /= n; b /= n;
      const mx = Math.max(r, g, b) / 255, mn = Math.min(r, g, b) / 255;
      const l = (mx + mn) / 2;
      const sat = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
      let hue = 0;
      if (mx !== mn) {
        const d = mx - mn;
        if (mx === r / 255) hue = ((g / 255 - b / 255) / d) % 6;
        else if (mx === g / 255) hue = (b / 255 - r / 255) / d + 2;
        else hue = (r / 255 - g / 255) / d + 4;
        hue *= 60; if (hue < 0) hue += 360;
      }
      // distance of zone chroma from a neutral reference
      const avg = (r + g + b) / 3;
      const deltaE = Math.sqrt((r - avg) ** 2 + (g - avg) ** 2 + (b - avg) ** 2);
      resolve({ hue, sat, deltaE, meanL: l });
    };
    img.onerror = () => resolve({ hue: 0, sat: 0, deltaE: 0, meanL: 0.5 });
    img.src = dataUrl;
  });
}
