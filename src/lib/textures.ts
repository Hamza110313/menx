import * as THREE from 'three';

function finalizeTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1,
  isColor = true
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

// Converts a grayscale height canvas into a tangent-space Normal Map
function heightCanvasToNormalTexture(
  heightCanvas: HTMLCanvasElement,
  anisotropy: number,
  strength: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const srcCtx = heightCanvas.getContext('2d')!;
  const src = srcCtx.getImageData(0, 0, w, h).data;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext('2d')!;
  const out = outCtx.createImageData(w, h);
  const dst = out.data;

  const sample = (x: number, y: number) => {
    const wx = ((x % w) + w) % w;
    const wy = ((y % h) + h) % h;
    return src[(wy * w + wx) * 4] / 255;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const hL = sample(x - 1, y);
      const hR = sample(x + 1, y);
      const hU = sample(x, y - 1);
      const hD = sample(x, y + 1);
      const dx = (hL - hR) * strength;
      const dy = (hU - hD) * strength;
      const dz = 1.0;
      const invLen = 1.0 / Math.sqrt(dx * dx + dy * dy + dz * dz);
      const idx = (y * w + x) * 4;
      dst[idx] = Math.round((dx * invLen * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.round((dy * invLen * 0.5 + 0.5) * 255);
      dst[idx + 2] = Math.round((dz * invLen * 0.5 + 0.5) * 255);
      dst[idx + 3] = 255;
    }
  }
  outCtx.putImageData(out, 0, 0);
  return finalizeTexture(outCanvas, anisotropy, repeatX, repeatY, false);
}

export function createAsphaltTextures(anisotropy: number) {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  const heightCanvas = document.createElement('canvas');
  heightCanvas.width = size;
  heightCanvas.height = size;
  const hCtx = heightCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;

  ctx.fillStyle = '#222429';
  ctx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#d4d4d4';
  rCtx.fillRect(0, 0, size, size);

  // Subtle tire-worn tracks along the two lanes (smoother roughness in tracks/puddle zones)
  const trackGrad = ctx.createLinearGradient(0, 0, size, 0);
  trackGrad.addColorStop(0.0, 'rgba(0,0,0,0.14)');
  trackGrad.addColorStop(0.18, 'rgba(14,15,18,0.26)');
  trackGrad.addColorStop(0.35, 'rgba(0,0,0,0.03)');
  trackGrad.addColorStop(0.65, 'rgba(0,0,0,0.03)');
  trackGrad.addColorStop(0.82, 'rgba(14,15,18,0.26)');
  trackGrad.addColorStop(1.0, 'rgba(0,0,0,0.14)');
  ctx.fillStyle = trackGrad;
  ctx.fillRect(0, 0, size, size);

  const roughGrad = rCtx.createLinearGradient(0, 0, size, 0);
  roughGrad.addColorStop(0.0, '#e5e5e5');
  roughGrad.addColorStop(0.18, '#8c8c8c');
  roughGrad.addColorStop(0.36, '#d8d8d8');
  roughGrad.addColorStop(0.64, '#d8d8d8');
  roughGrad.addColorStop(0.82, '#8c8c8c');
  roughGrad.addColorStop(1.0, '#e5e5e5');
  rCtx.fillStyle = roughGrad;
  rCtx.fillRect(0, 0, size, size);

  // Organic puddle depression patches for ultra-realistic wet specular contrast
  for (let p = 0; p < 14; p++) {
    const px = Math.random() * size;
    const py = Math.random() * size;
    const pr = 22 + Math.random() * 44;
    const pGrad = rCtx.createRadialGradient(px, py, 2, px, py, pr);
    pGrad.addColorStop(0, 'rgba(38, 38, 38, 0.72)');
    pGrad.addColorStop(0.6, 'rgba(72, 72, 72, 0.36)');
    pGrad.addColorStop(1, 'rgba(180, 180, 180, 0)');
    rCtx.fillStyle = pGrad;
    rCtx.beginPath();
    rCtx.arc(px, py, pr, 0, Math.PI * 2);
    rCtx.fill();
  }

  // Aggregate mineral speckle for realistic tarmac micro-texture
  for (let i = 0; i < 20000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const v = 24 + Math.floor(Math.random() * 38);
    ctx.fillStyle = `rgb(${v},${v + 1},${v + 4})`;
    ctx.fillRect(x, y, 2, 2);

    const hv = 88 + Math.floor(Math.random() * 82);
    hCtx.fillStyle = `rgb(${hv},${hv},${hv})`;
    hCtx.fillRect(x, y, 2, 2);
  }

  // Subtle tar-sealed hairline cracks
  ctx.strokeStyle = 'rgba(12, 13, 16, 0.55)';
  ctx.lineWidth = 1.5;
  hCtx.strokeStyle = '#505050';
  hCtx.lineWidth = 2;
  for (let c = 0; c < 6; c++) {
    let cx = 50 + Math.random() * (size - 100);
    let cy = Math.random() * size;
    ctx.beginPath();
    hCtx.beginPath();
    ctx.moveTo(cx, cy);
    hCtx.moveTo(cx, cy);
    for (let s = 0; s < 5; s++) {
      cx += (Math.random() - 0.5) * 38;
      cy += 18 + Math.random() * 24;
      ctx.lineTo(cx, cy);
      hCtx.lineTo(cx, cy);
    }
    ctx.stroke();
    hCtx.stroke();
  }

  // Crisp shoulder lines
  ctx.fillStyle = 'rgba(248, 250, 252, 0.88)';
  ctx.fillRect(16, 0, 7, size);
  ctx.fillRect(size - 23, 0, 7, size);

  // Double dashed / solid amber centerline
  ctx.fillStyle = '#facc15';
  for (let y = 0; y < size; y += 64) {
    ctx.fillRect(248, y + 6, 6, 42);
    ctx.fillRect(258, y + 6, 6, 42);
  }

  return {
    map: finalizeTexture(colorCanvas, anisotropy, 1, 1, true),
    normalMap: heightCanvasToNormalTexture(heightCanvas, anisotropy, 2.4, 1, 1),
    roughnessMap: finalizeTexture(roughCanvas, anisotropy, 1, 1, false),
  };
}

export function createIntersectionTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#23252a';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 6500; i++) {
    const v = 28 + Math.floor(Math.random() * 28);
    ctx.fillStyle = `rgb(${v},${v + 1},${v + 3})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }

  // Zebra crosswalk stripes on all 4 approaches
  ctx.fillStyle = 'rgba(244, 244, 245, 0.82)';
  for (let i = 36; i < size - 48; i += 44) {
    ctx.fillRect(i, 12, 22, 52);
    ctx.fillRect(i, size - 64, 22, 52);
    ctx.fillRect(12, i, 52, 22);
    ctx.fillRect(size - 64, i, 52, 22);
  }

  return finalizeTexture(canvas, anisotropy, 1, 1, true);
}

export function createSidewalkTextures(anisotropy: number) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  ctx.fillStyle = '#8b8f96';
  ctx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#a0a0a0';
  hCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 3200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const v = 122 + Math.floor(Math.random() * 34);
    ctx.fillStyle = `rgb(${v},${v + 1},${v + 3})`;
    ctx.fillRect(x, y, 2, 2);
    hCtx.fillStyle = `rgb(${v},${v},${v})`;
    hCtx.fillRect(x, y, 2, 2);
  }

  // Concrete expansion joints
  ctx.strokeStyle = 'rgba(35, 38, 44, 0.5)';
  ctx.lineWidth = 2;
  hCtx.strokeStyle = '#383838';
  hCtx.lineWidth = 3;
  for (let p = 0; p <= size; p += 64) {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();

    hCtx.beginPath();
    hCtx.moveTo(p, 0);
    hCtx.lineTo(p, size);
    hCtx.stroke();
    hCtx.beginPath();
    hCtx.moveTo(0, p);
    hCtx.lineTo(size, p);
    hCtx.stroke();
  }

  return {
    map: finalizeTexture(canvas, anisotropy, 12, 12, true),
    normalMap: heightCanvasToNormalTexture(hCanvas, anisotropy, 2.0, 12, 12),
  };
}

export type SkyscraperStyle = 'dark_glass' | 'terracotta' | 'modern_stripe' | 'limestone_classic';

export function createSkyscraperFacadeTextures(
  anisotropy: number,
  baseHex: string,
  style: SkyscraperStyle = 'dark_glass'
) {
  const w = 256;
  const h = 512;

  const dayCanvas = document.createElement('canvas');
  dayCanvas.width = w;
  dayCanvas.height = h;
  const dCtx = dayCanvas.getContext('2d')!;

  const nightCanvas = document.createElement('canvas');
  nightCanvas.width = w;
  nightCanvas.height = h;
  const nCtx = nightCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = w;
  hCanvas.height = h;
  const hCtx = hCanvas.getContext('2d')!;

  const baseColor =
    style === 'terracotta'
      ? '#7c3f34'
      : style === 'modern_stripe'
        ? '#f3efe4'
        : style === 'limestone_classic'
          ? '#cbc6bc'
          : baseHex;

  dCtx.fillStyle = baseColor;
  dCtx.fillRect(0, 0, w, h);
  nCtx.fillStyle = '#050811';
  nCtx.fillRect(0, 0, w, h);
  hCtx.fillStyle = '#dcdcdc';
  hCtx.fillRect(0, 0, w, h);

  const cols = style === 'modern_stripe' ? 8 : 8;
  const rows = style === 'limestone_classic' ? 20 : style === 'modern_stripe' ? 14 : 18;
  const padX = style === 'modern_stripe' ? 4 : 4;
  const padY = style === 'modern_stripe' ? 6 : 5;
  const cellW = w / cols;
  const cellH = h / rows;

  for (let r = 0; r < rows; r++) {
    // Spandrel floor band
    dCtx.fillStyle =
      style === 'modern_stripe'
        ? '#fbf9f2'
        : style === 'limestone_classic'
          ? 'rgba(0,0,0,0.08)'
          : 'rgba(15, 23, 42, 0.55)';
    dCtx.fillRect(0, r * cellH, w, style === 'modern_stripe' ? 8 : 4);

    for (let c = 0; c < cols; c++) {
      const wx = c * cellW + padX;
      const wy = r * cellH + padY;
      const ww = cellW - padX * 2;
      const wh = cellH - padY * 2;

      const seed = Math.sin(r * 17.3 + c * 31.7) * 0.5 + 0.5;
      const grad = dCtx.createLinearGradient(wx, wy, wx, wy + wh);
      if (style === 'terracotta') {
        grad.addColorStop(0, seed > 0.5 ? '#334155' : '#1e293b');
        grad.addColorStop(1, '#090d16');
      } else if (style === 'modern_stripe') {
        grad.addColorStop(0, seed > 0.4 ? '#0f766e' : '#0d9488');
        grad.addColorStop(1, '#083344');
      } else if (style === 'limestone_classic') {
        grad.addColorStop(0, seed > 0.45 ? '#475569' : '#334155');
        grad.addColorStop(1, '#1e293b');
      } else {
        grad.addColorStop(0, seed > 0.45 ? '#38bdf8' : '#1e3a5f');
        grad.addColorStop(1, '#0f172a');
      }
      dCtx.fillStyle = grad;
      dCtx.fillRect(wx, wy, ww, wh);

      if (style === 'modern_stripe') {
        // Window mullion divider + recessed sill
        dCtx.fillStyle = '#e7e2d5';
        dCtx.fillRect(wx + ww * 0.5 - 1, wy, 2, wh);
        dCtx.fillStyle = '#d6d0c0';
        dCtx.fillRect(wx - 1, wy + wh, ww + 2, 2);
      } else if (style === 'terracotta') {
        dCtx.fillStyle = '#c2b9ae';
        dCtx.fillRect(wx - 1, wy + wh, ww + 2, 2);
      }

      // Recessed window height for normal map
      hCtx.fillStyle = '#707070';
      hCtx.fillRect(wx, wy, ww, wh);

      // Night lit office windows
      if (seed > 0.36) {
        nCtx.fillStyle = seed > 0.8 ? '#fde047' : seed > 0.58 ? '#fef08a' : '#7dd3fc';
      } else {
        nCtx.fillStyle = '#090f1d';
      }
      nCtx.fillRect(wx, wy, ww, wh);
    }
  }

  return {
    dayMap: finalizeTexture(dayCanvas, anisotropy, 2, 3, true),
    nightMap: finalizeTexture(nightCanvas, anisotropy, 2, 3, true),
    normalMap: heightCanvasToNormalTexture(hCanvas, anisotropy, 2.5, 2, 3),
  };
}

export function createResidentialTexture(anisotropy: number, baseHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  // Architectural plaster/brick variation
  for (let i = 0; i < 2400; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 2);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let y = 0; y < 256; y += 32) {
    ctx.fillRect(0, y, 256, 3);
  }

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const x = c * 64 + 14;
      const y = r * 64 + 14;
      ctx.fillStyle = '#18181b';
      ctx.fillRect(x - 2, y - 2, 38, 38);
      ctx.fillStyle = (r + c) % 3 === 0 ? '#fde68a' : '#1e293b';
      ctx.fillRect(x, y, 34, 34);
      // Window sill
      ctx.fillStyle = '#a1a1aa';
      ctx.fillRect(x - 3, y + 34, 40, 4);
    }
  }

  return finalizeTexture(canvas, anisotropy, 2, 2, true);
}

export function createBrickApartmentTextures(anisotropy: number) {
  const size = 256;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const ctx = cCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  // Mortar backing
  ctx.fillStyle = '#6f655c';
  ctx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#484848';
  hCtx.fillRect(0, 0, size, size);

  const brickH = 8;
  const brickW = 16;
  const rows = size / brickH;
  const cols = size / brickW;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (brickW * 0.5);
    for (let c = -1; c <= cols; c++) {
      const bx = c * brickW + offset + 1;
      const by = r * brickH + 1;
      const n = Math.sin(r * 19.7 + c * 43.1) * 0.5 + 0.5;
      const rCol = Math.round(138 + n * 42);
      const gCol = Math.round(68 + n * 24);
      const bCol = Math.round(46 + n * 18);
      ctx.fillStyle = `rgb(${rCol},${gCol},${bCol})`;
      ctx.fillRect(bx, by, brickW - 2, brickH - 2);

      const hVal = Math.round(150 + n * 45);
      hCtx.fillStyle = `rgb(${hVal},${hVal},${hVal})`;
      hCtx.fillRect(bx, by, brickW - 2, brickH - 2);
    }
  }

  // Aged soot / weather gradient near top & bottom
  const ageGrad = ctx.createLinearGradient(0, 0, 0, size);
  ageGrad.addColorStop(0, 'rgba(35, 25, 20, 0.22)');
  ageGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.0)');
  ageGrad.addColorStop(1, 'rgba(35, 25, 20, 0.26)');
  ctx.fillStyle = ageGrad;
  ctx.fillRect(0, 0, size, size);

  // Clean 3-row framed multi-pane windows with stone lintels & sills
  const wCols = 3;
  const wRows = 3;
  for (let wr = 0; wr < wRows; wr++) {
    for (let wc = 0; wc < wCols; wc++) {
      const wx = wc * 85 + 26;
      const wy = wr * 82 + 20;
      // Stone lintel & sill
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(wx - 4, wy - 6, 40, 5);
      ctx.fillRect(wx - 4, wy + 44, 40, 5);
      hCtx.fillStyle = '#e5e5e5';
      hCtx.fillRect(wx - 4, wy - 6, 40, 5);
      hCtx.fillRect(wx - 4, wy + 44, 40, 5);

      // Dark wood sash frame
      ctx.fillStyle = '#27272a';
      ctx.fillRect(wx, wy, 32, 44);
      // Glazing + mullions
      ctx.fillStyle = (wr + wc) % 4 === 0 ? '#475569' : '#1e293b';
      ctx.fillRect(wx + 3, wy + 3, 12, 18);
      ctx.fillRect(wx + 17, wy + 3, 12, 18);
      ctx.fillRect(wx + 3, wy + 23, 12, 18);
      ctx.fillRect(wx + 17, wy + 23, 12, 18);
      hCtx.fillStyle = '#242424';
      hCtx.fillRect(wx + 2, wy + 2, 28, 40);
    }
  }

  return {
    map: finalizeTexture(cCanvas, anisotropy, 2, 2, true),
    normalMap: heightCanvasToNormalTexture(hCanvas, anisotropy, 2.2, 2, 2),
  };
}

export function createWaterNormalMap(anisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const ctx = hCanvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const d = img.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2;
      const v = (y / size) * Math.PI * 2;
      const wave =
        Math.sin(u * 3 + v * 2) * 0.30 +
        Math.cos(u * 5 - v * 4) * 0.24 +
        Math.sin(u * 9 + v * 7) * 0.16 +
        Math.cos(u * 14 - v * 11) * 0.10 +
        Math.sin(u * 21 + v * 17) * 0.06;
      const val = Math.max(0, Math.min(255, Math.round((wave * 0.52 + 0.5) * 255)));
      const idx = (y * size + x) * 4;
      d[idx] = val;
      d[idx + 1] = val;
      d[idx + 2] = val;
      d[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return heightCanvasToNormalTexture(hCanvas, anisotropy, 2.8, 16, 12);
}

export function createGrassTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#385826';
  ctx.fillRect(0, 0, size, size);

  // Subtle organic soil & clover patches
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = i % 3 === 0 ? 'rgba(42, 68, 28, 0.28)' : 'rgba(64, 52, 34, 0.2)';
    ctx.fillRect(Math.random() * size, Math.random() * size, 8, 6);
  }

  // Dense multi-tone grass blade micro-texture
  for (let i = 0; i < 18000; i++) {
    const r = 42 + Math.floor(Math.random() * 48);
    const g = 84 + Math.floor(Math.random() * 68);
    const b = 24 + Math.floor(Math.random() * 28);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 4);
  }

  // Sunlit highlights & dry leaf flecks
  for (let i = 0; i < 520; i++) {
    ctx.fillStyle =
      i % 3 === 0
        ? 'rgba(132, 168, 68, 0.45)'
        : i % 2 === 0
          ? 'rgba(138, 92, 46, 0.65)'
          : 'rgba(161, 114, 52, 0.55)';
    ctx.fillRect(Math.random() * size, Math.random() * size, 3, 2);
  }

  return finalizeTexture(canvas, anisotropy, 10, 10, true);
}

export function createSandTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d6be8a';
  ctx.fillRect(0, 0, size, size);

  // Wind-carved beach ripple bands
  for (let y = 0; y < size; y += 3) {
    const ripple = Math.sin((y / size) * Math.PI * 16) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(182, 152, 98, ${0.06 + ripple * 0.08})`;
    ctx.fillRect(0, y, size, 2);
  }

  for (let i = 0; i < 14000; i++) {
    const r = 194 + Math.floor(Math.random() * 38);
    const g = 168 + Math.floor(Math.random() * 36);
    const b = 114 + Math.floor(Math.random() * 32);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }

  return finalizeTexture(canvas, anisotropy, 22, 5, true);
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.38)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createGlowSpriteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.45)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createCamoTextures(anisotropy: number) {
  const size = 256;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const ctx = cCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  // Digital pixel-camo palette matching reference tactical uniform
  const palette = ['#8f8a75', '#6b6d55', '#4c523e', '#a9a28c', '#3b3e32'];
  ctx.fillStyle = palette[0];
  ctx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, size, size);

  const cell = 4;
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const n =
        Math.sin(x * 0.07 + y * 0.03) * 0.5 +
        Math.cos(x * 0.03 - y * 0.08) * 0.5 +
        Math.sin((x + y) * 0.14) * 0.35;
      const idx =
        n > 0.55 ? 2 : n > 0.15 ? 1 : n < -0.45 ? 3 : n < -0.75 ? 4 : 0;
      ctx.fillStyle = palette[idx];
      ctx.fillRect(x, y, cell, cell);

      // Ripstop fabric crosshatch height
      const weave = ((x / cell + y / cell) % 2 === 0 ? 145 : 115) + Math.floor(Math.random() * 18);
      hCtx.fillStyle = `rgb(${weave},${weave},${weave})`;
      hCtx.fillRect(x, y, cell, cell);
    }
  }

  return {
    map: finalizeTexture(cCanvas, anisotropy, 2, 2, true),
    normalMap: heightCanvasToNormalTexture(hCanvas, anisotropy, 1.5, 2, 2),
  };
}

export function createHoodieTextures(anisotropy: number) {
  const size = 256;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const ctx = cCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  ctx.fillStyle = '#9c9668';
  ctx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, size, size);

  // Subtle fleece fabric grain
  for (let i = 0; i < 4200; i++) {
    const shade = 132 + Math.floor(Math.random() * 34);
    ctx.fillStyle = `rgba(${shade},${shade - 4},${shade - 46},0.35)`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);

    const h = 115 + Math.floor(Math.random() * 30);
    hCtx.fillStyle = `rgb(${h},${h},${h})`;
    hCtx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }

  // Central metal zipper & dark athletic print accents ("CHARGED 89")
  ctx.fillStyle = '#474534';
  ctx.fillRect(size * 0.485, 0, size * 0.03, size);
  ctx.fillStyle = '#d4d4d8';
  ctx.fillRect(size * 0.495, 0, 3, size);

  ctx.fillStyle = '#2f2e22';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('89', size * 0.56, 78);
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('TEAM', size * 0.55, 102);

  // Vertical stencil motif on left chest
  ctx.save();
  ctx.translate(size * 0.34, 52);
  ctx.font = 'bold 19px sans-serif';
  const letters = 'CHARGED';
  for (let i = 0; i < letters.length; i++) {
    ctx.fillText(letters[i], 0, i * 21);
  }
  ctx.restore();

  return {
    map: finalizeTexture(cCanvas, anisotropy, 1, 1, true),
    normalMap: heightCanvasToNormalTexture(hCanvas, anisotropy, 1.3, 1, 1),
  };
}

export function createDenimTextures(anisotropy: number) {
  const size = 256;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const ctx = cCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#182f4e');
  grad.addColorStop(0.45, '#2b5280');
  grad.addColorStop(0.75, '#1e3a5f');
  grad.addColorStop(1, '#13243b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, size, size);

  // Diagonal denim twill weave
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const twill = ((x + y) % 6 === 0) ? 160 : 112;
      hCtx.fillStyle = `rgb(${twill},${twill},${twill})`;
      hCtx.fillRect(x, y, 2, 2);
      if ((x + y) % 8 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(x, y, 2, 1);
      }
    }
  }

  // Contrast side seam stitching
  ctx.fillStyle = '#b45309';
  ctx.fillRect(8, 0, 2, size);
  ctx.fillRect(size - 10, 0, 2, size);

  return {
    map: finalizeTexture(cCanvas, anisotropy, 1, 1, true),
    normalMap: heightCanvasToNormalTexture(hCanvas, anisotropy, 1.4, 1, 1),
  };
}

export function createColonialSidingTextures(anisotropy: number, baseHex = '#b8b0a2') {
  const size = 256;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const ctx = cCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#888888';
  hCtx.fillRect(0, 0, size, size);

  const plankH = 16;
  for (let y = 0; y < size; y += plankH) {
    // Lap bevel gradient per clapboard
    const pGrad = ctx.createLinearGradient(0, y, 0, y + plankH);
    pGrad.addColorStop(0, 'rgba(0,0,0,0.22)');
    pGrad.addColorStop(0.18, 'rgba(255,255,255,0.07)');
    pGrad.addColorStop(1, 'rgba(0,0,0,0.08)');
    ctx.fillStyle = pGrad;
    ctx.fillRect(0, y, size, plankH);

    const hGrad = hCtx.createLinearGradient(0, y, 0, y + plankH);
    hGrad.addColorStop(0, '#444444');
    hGrad.addColorStop(0.15, '#c8c8c8');
    hGrad.addColorStop(1, '#787878');
    hCtx.fillStyle = hGrad;
    hCtx.fillRect(0, y, size, plankH);
  }

  return {
    map: finalizeTexture(cCanvas, anisotropy, 3, 2, true),
    normalMap: heightCanvasToNormalTexture(hCanvas, anisotropy, 1.8, 3, 2),
  };
}

export function createRoofShingleTextures(anisotropy: number) {
  const size = 256;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const ctx = cCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  ctx.fillStyle = '#363b42';
  ctx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, size, size);

  const rowH = 16;
  const tabW = 32;
  for (let y = 0; y < size; y += rowH) {
    const offset = ((y / rowH) % 2) * (tabW * 0.5);
    for (let x = -tabW; x < size + tabW; x += tabW) {
      const v = 46 + Math.floor(Math.random() * 24);
      ctx.fillStyle = `rgb(${v},${v + 3},${v + 8})`;
      ctx.fillRect(x + offset + 1, y + 1, tabW - 2, rowH - 2);

      const hv = 115 + Math.floor(Math.random() * 40);
      hCtx.fillStyle = `rgb(${hv},${hv},${hv})`;
      hCtx.fillRect(x + offset + 1, y + 1, tabW - 2, rowH - 2);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, y, size, 2);
  }

  return {
    map: finalizeTexture(cCanvas, anisotropy, 4, 4, true),
    normalMap: heightCanvasToNormalTexture(hCanvas, anisotropy, 1.9, 4, 4),
  };
}

export function createBarnTextures(anisotropy: number) {
  const size = 256;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const ctx = cCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  ctx.fillStyle = '#752326';
  ctx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, size, size);

  const boardW = 16;
  for (let x = 0; x < size; x += boardW) {
    const v = 105 + Math.floor(Math.random() * 22);
    ctx.fillStyle = `rgb(${v},${Math.round(v * 0.29)},${Math.round(v * 0.31)})`;
    ctx.fillRect(x + 2, 0, boardW - 3, size);
    ctx.fillStyle = '#471215';
    ctx.fillRect(x, 0, 2, size);

    hCtx.fillStyle = '#b4b4b4';
    hCtx.fillRect(x + 2, 0, boardW - 3, size);
    hCtx.fillStyle = '#424242';
    hCtx.fillRect(x, 0, 2, size);
  }

  return {
    map: finalizeTexture(cCanvas, anisotropy, 3, 2, true),
    normalMap: heightCanvasToNormalTexture(hCanvas, anisotropy, 1.9, 3, 2),
  };
}

export function createRunwayTexture(anisotropy: number): THREE.CanvasTexture {
  const w = 256;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#24262b';
  ctx.fillRect(0, 0, w, h);

  // Subtle tarmac grain
  for (let i = 0; i < 6500; i++) {
    const shade = 28 + Math.floor(Math.random() * 24);
    ctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 5})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }

  // Edge lines
  ctx.fillStyle = '#e4e4e7';
  ctx.fillRect(10, 0, 5, h);
  ctx.fillRect(w - 15, 0, 5, h);

  // Center dashed markings
  for (let y = 24; y < h; y += 64) {
    ctx.fillRect(w / 2 - 4, y, 8, 34);
  }

  // Threshold piano keys at bottom
  for (let x = 24; x < w - 24; x += 24) {
    ctx.fillRect(x, h - 56, 12, 42);
  }

  return finalizeTexture(canvas, anisotropy, 1, 3, true);
}

export function createInteriorFloorTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const tile = 32;
  for (let y = 0; y < size; y += tile) {
    for (let x = 0; x < size; x += tile) {
      const dark = ((x / tile) + (y / tile)) % 2 === 0;
      ctx.fillStyle = dark ? '#1f2937' : '#e5e7eb';
      ctx.fillRect(x, y, tile, tile);
    }
  }
  return finalizeTexture(canvas, anisotropy, 4, 4, true);
}

export function createDesertSandTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b97a4b';
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 4) {
    const wave = Math.sin(y * 0.14) * 14;
    ctx.fillStyle = wave > 0 ? 'rgba(245, 200, 145, 0.14)' : 'rgba(110, 55, 25, 0.14)';
    ctx.fillRect(0, y, size, 3);
  }
  for (let i = 0; i < 4500; i++) {
    const c = Math.random() > 0.5 ? 'rgba(255,228,196,0.16)' : 'rgba(92,48,24,0.18)';
    ctx.fillStyle = c;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }

  return finalizeTexture(canvas, anisotropy, 14, 14, true);
}

export function createParagonChestEmblemTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  // Outer crimson pentagonal diamond shield
  ctx.beginPath();
  ctx.moveTo(56, 44);
  ctx.lineTo(200, 44);
  ctx.lineTo(240, 96);
  ctx.lineTo(128, 224);
  ctx.lineTo(16, 96);
  ctx.closePath();
  const shieldGrad = ctx.createLinearGradient(0, 40, 0, 224);
  shieldGrad.addColorStop(0, '#ef4444');
  shieldGrad.addColorStop(1, '#b91c1c');
  ctx.fillStyle = shieldGrad;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#991b1b';
  ctx.stroke();

  // Inner crimson backdrop bevel
  ctx.beginPath();
  ctx.moveTo(68, 60);
  ctx.lineTo(188, 60);
  ctx.lineTo(216, 98);
  ctx.lineTo(128, 198);
  ctx.lineTo(40, 98);
  ctx.closePath();
  ctx.fillStyle = '#dc2626';
  ctx.fill();

  // Stylized bold diagonal yellow S-crest ribbons (inspired by hero chest emblem)
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(76, 66);
  ctx.lineTo(176, 66);
  ctx.lineTo(202, 98);
  ctx.lineTo(174, 130);
  ctx.lineTo(94, 84);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(64, 96);
  ctx.lineTo(168, 152);
  ctx.lineTo(128, 192);
  ctx.lineTo(52, 108);
  ctx.closePath();
  ctx.fill();

  // Crisp gold highlight rim inside pentagon
  ctx.beginPath();
  ctx.moveTo(62, 54);
  ctx.lineTo(194, 54);
  ctx.lineTo(226, 96);
  ctx.lineTo(128, 208);
  ctx.lineTo(30, 96);
  ctx.closePath();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#fde047';
  ctx.stroke();

  return finalizeTexture(canvas, anisotropy, 1, 1, true);
}

export function createCorrugatedMetalTextures(anisotropy: number): {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
} {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  const heightCanvas = document.createElement('canvas');
  heightCanvas.width = size;
  heightCanvas.height = size;
  const hctx = heightCanvas.getContext('2d')!;

  ctx.fillStyle = '#9ca3af';
  ctx.fillRect(0, 0, size, size);
  hctx.fillStyle = '#808080';
  hctx.fillRect(0, 0, size, size);

  const ribs = 32;
  const ribW = size / ribs;
  for (let i = 0; i < ribs; i++) {
    const x = i * ribW;
    const grad = ctx.createLinearGradient(x, 0, x + ribW, 0);
    grad.addColorStop(0.0, '#6b7280');
    grad.addColorStop(0.35, '#9ca3af');
    grad.addColorStop(0.55, '#d1d5db');
    grad.addColorStop(0.85, '#7c8594');
    grad.addColorStop(1.0, '#6b7280');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, ribW, size);

    const hgrad = hctx.createLinearGradient(x, 0, x + ribW, 0);
    hgrad.addColorStop(0.0, '#404040');
    hgrad.addColorStop(0.5, '#efefef');
    hgrad.addColorStop(1.0, '#404040');
    hctx.fillStyle = hgrad;
    hctx.fillRect(x, 0, ribW, size);
  }

  for (let y = 0; y < size; y += 128) {
    ctx.fillStyle = 'rgba(31, 41, 55, 0.25)';
    ctx.fillRect(0, y, size, 3);
    hctx.fillStyle = '#252525';
    hctx.fillRect(0, y, size, 3);
  }

  let seed = 7331;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 420; i++) {
    const px = nextRand() * size;
    const py = nextRand() * size;
    ctx.fillStyle = nextRand() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)';
    ctx.fillRect(px, py, 2 + nextRand() * 4, 4 + nextRand() * 14);
  }

  return {
    map: finalizeTexture(colorCanvas, anisotropy, 6, 3, true),
    normalMap: heightCanvasToNormalTexture(heightCanvas, anisotropy, 2.4, 6, 3),
  };
}

export function createPoliceDoorDecalTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 160);

  ctx.fillStyle = '#ef4444';
  ctx.font = '900 108px "Impact", "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('POLICE', 256, 84);

  return finalizeTexture(canvas, anisotropy, 1, 1, true);
}

export function createMuscle01DecalTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f97316';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(128, 128, 108, 78, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#09090b';
  ctx.font = '900 116px "Impact", "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('01', 128, 134);

  return finalizeTexture(canvas, anisotropy, 1, 1, true);
}

export function createExpressSideLiveryTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 1024, 384);

  // Subtle side cargo panel seam lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, 988, 348);

  // Bold FedEx Express livery (purple "Fed", bright orange "Ex", slate "Express")
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = '900 176px "Arial Black", "Inter", sans-serif';
  ctx.fillStyle = '#4f1d96';
  ctx.fillText('Fed', 140, 210);
  const fedWidth = ctx.measureText('Fed').width;
  ctx.fillStyle = '#f97316';
  ctx.fillText('Ex', 132 + fedWidth, 210);

  ctx.fillStyle = '#334155';
  ctx.font = 'italic 700 62px "Inter", sans-serif';
  ctx.fillText('Express', 640, 282);

  return finalizeTexture(canvas, anisotropy, 1, 1, true);
}

export function createExpressHoodLiveryTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 192);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = '900 104px "Arial Black", "Inter", sans-serif';
  ctx.fillStyle = '#4f1d96';
  ctx.fillText('Fed', 76, 98);
  const fedW = ctx.measureText('Fed').width;
  ctx.fillStyle = '#f97316';
  ctx.fillText('Ex', 72 + fedW, 98);

  return finalizeTexture(canvas, anisotropy, 1, 1, true);
}

export function createNarutoBackCrestTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f97316';
  ctx.fillRect(0, 0, 256, 256);

  // Crimson circular disc
  ctx.beginPath();
  ctx.arc(128, 128, 92, 0, Math.PI * 2);
  ctx.fillStyle = '#b91c1c';
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#18181b';
  ctx.stroke();

  // Uzumaki black spiral
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 5.2; a += 0.12) {
    const r = (a / (Math.PI * 5.2)) * 68;
    const x = 128 + Math.cos(a) * r;
    const y = 128 + Math.sin(a) * r;
    if (a === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#111827';
  ctx.stroke();

  return finalizeTexture(canvas, anisotropy, 1, 1, true);
}

export function createTankerHullTextures(anisotropy: number) {
  // 1. Hull side banner with welded steel plates and bold white "TEN" lettering
  const sideC = document.createElement('canvas');
  sideC.width = 1024;
  sideC.height = 256;
  const sCtx = sideC.getContext('2d')!;
  sCtx.fillStyle = '#14171d';
  sCtx.fillRect(0, 0, 1024, 256);

  // Subtle welded hull plate grid
  sCtx.strokeStyle = 'rgba(255,255,255,0.06)';
  sCtx.lineWidth = 2;
  for (let x = 0; x < 1024; x += 64) {
    sCtx.beginPath();
    sCtx.moveTo(x, 0);
    sCtx.lineTo(x, 256);
    sCtx.stroke();
  }
  for (let y = 40; y < 256; y += 64) {
    sCtx.beginPath();
    sCtx.moveTo(0, y);
    sCtx.lineTo(1024, y);
    sCtx.stroke();
  }
  // Crisp white waterline draft stripe & giant "TEN" emblem
  sCtx.fillStyle = '#e2e8f0';
  sCtx.fillRect(0, 232, 1024, 14);
  sCtx.font = '900 132px "Arial Black", "Impact", sans-serif';
  sCtx.textAlign = 'center';
  sCtx.textBaseline = 'middle';
  sCtx.fillStyle = '#f8fafc';
  sCtx.fillText('T   E   N', 360, 128);

  // 2. Bow Yellow Helipad "H" Deck Circle
  const heliC = document.createElement('canvas');
  heliC.width = 256;
  heliC.height = 256;
  const hCtx = heliC.getContext('2d')!;
  hCtx.fillStyle = '#5f6873';
  hCtx.fillRect(0, 0, 256, 256);
  hCtx.beginPath();
  hCtx.arc(128, 128, 104, 0, Math.PI * 2);
  hCtx.fillStyle = '#475569';
  hCtx.fill();
  hCtx.lineWidth = 10;
  hCtx.strokeStyle = '#facc15';
  hCtx.stroke();
  // Bold yellow H
  hCtx.fillStyle = '#facc15';
  hCtx.fillRect(82, 74, 22, 108);
  hCtx.fillRect(152, 74, 22, 108);
  hCtx.fillRect(82, 118, 92, 20);

  // 3. Aft Funnel Logo Band ("T" crest inside navy/yellow stack livery)
  const funC = document.createElement('canvas');
  funC.width = 256;
  funC.height = 256;
  const fCtx = funC.getContext('2d')!;
  fCtx.fillStyle = '#f8fafc';
  fCtx.fillRect(0, 0, 256, 256);
  fCtx.fillStyle = '#0f172a';
  fCtx.fillRect(0, 0, 256, 54);
  fCtx.fillStyle = '#facc15';
  fCtx.fillRect(0, 208, 256, 48);
  fCtx.fillStyle = '#1e3a8a';
  fCtx.fillRect(0, 54, 34, 154);
  fCtx.fillRect(222, 54, 34, 154);
  // Crimson T emblem
  fCtx.fillStyle = '#dc2626';
  fCtx.fillRect(72, 86, 112, 24);
  fCtx.fillRect(114, 86, 28, 96);
  fCtx.strokeStyle = '#1e3a8a';
  fCtx.lineWidth = 4;
  fCtx.strokeRect(72, 86, 112, 24);

  return {
    hullSide: finalizeTexture(sideC, anisotropy, 1, 1, true),
    helipad: finalizeTexture(heliC, anisotropy, 1, 1, true),
    funnel: finalizeTexture(funC, anisotropy, 1, 1, true),
  };
}

export function createSageClapboardTextures(anisotropy: number) {
  const size = 256;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const ctx = cCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  const courses = 16;
  const cH = size / courses;
  for (let i = 0; i < courses; i++) {
    const y = i * cH;
    const grad = ctx.createLinearGradient(0, y, 0, y + cH);
    grad.addColorStop(0.0, '#789175');
    grad.addColorStop(0.76, '#657d63');
    grad.addColorStop(0.92, '#51674f');
    grad.addColorStop(1.0, '#364635');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, size, cH);

    const hGrad = hCtx.createLinearGradient(0, y, 0, y + cH);
    hGrad.addColorStop(0.0, '#9e9e9e');
    hGrad.addColorStop(0.85, '#efefef');
    hGrad.addColorStop(1.0, '#2c2c2c');
    hCtx.fillStyle = hGrad;
    hCtx.fillRect(0, y, size, cH);
  }

  // Subtle wood grain & weathering flecks
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(15,23,15,0.045)';
    ctx.fillRect((i * 73) % size, (i * 37) % size, 12, 1);
  }

  return {
    map: finalizeTexture(cCanvas, anisotropy, 2, 2, true),
    normalMap: heightCanvasToNormalTexture(hCanvas, anisotropy, 2.2, 2, 2),
  };
}

export function createLeafCanopyTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  let seed = 4242;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // Draw dense organic overlapping leaf blades clustered inside soft circular boundary
  for (let i = 0; i < 240; i++) {
    const angle = rnd() * Math.PI * 2;
    const rad = Math.sqrt(rnd()) * 112;
    const cx = 128 + Math.cos(angle) * rad;
    const cy = 128 + Math.sin(angle) * rad;
    const leafRot = rnd() * Math.PI * 2;
    const lw = 11 + rnd() * 11;
    const lh = 6 + rnd() * 5;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(leafRot);
    const shade = rnd();
    ctx.fillStyle =
      shade < 0.3
        ? '#2b581e'
        : shade < 0.65
          ? '#3b7324'
          : shade < 0.88
            ? '#4f8c2f'
            : '#68a33e';
    ctx.beginPath();
    ctx.ellipse(0, 0, lw, lh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createDesertCamoTextures(anisotropy: number) {
  const size = 256;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const ctx = cCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  // Cream/sand base fabric
  ctx.fillStyle = '#e7dcc4';
  ctx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#848484';
  hCtx.fillRect(0, 0, size, size);

  let seed = 8821;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // Organic tan, medium chocolate, and dark espresso desert camo blotches
  const blotchSpecs = [
    { count: 28, color: '#c49b66', rMin: 16, rMax: 34 },
    { count: 22, color: '#8a5d32', rMin: 12, rMax: 24 },
    { count: 16, color: '#1b1815', rMin: 7, rMax: 15 },
  ];
  for (const spec of blotchSpecs) {
    ctx.fillStyle = spec.color;
    for (let i = 0; i < spec.count; i++) {
      const cx = rnd() * size;
      const cy = rnd() * size;
      const rx = spec.rMin + rnd() * (spec.rMax - spec.rMin);
      const ry = rx * (0.55 + rnd() * 0.55);
      const rot = rnd() * Math.PI;
      for (const ox of [-size, 0, size]) {
        for (const oy of [-size, 0, size]) {
          ctx.beginPath();
          ctx.ellipse(cx + ox, cy + oy, rx, ry, rot, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // Subtle ripstop weave normal relief
  for (let y = 0; y < size; y += 3) {
    hCtx.fillStyle = y % 6 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
    hCtx.fillRect(0, y, size, 1);
  }
  for (let x = 0; x < size; x += 3) {
    hCtx.fillStyle = x % 6 === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    hCtx.fillRect(x, 0, 1, size);
  }

  return {
    map: finalizeTexture(cCanvas, anisotropy, 2, 2, true),
    normalMap: heightCanvasToNormalTexture(hCanvas, anisotropy, 1.4, 2, 2),
  };
}

export function createDarkKnightEmblemTexture(anisotropy: number): THREE.CanvasTexture {
  const w = 256;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  const drawBat = (fill: string, stroke?: string, lineWidth = 0) => {
    ctx.beginPath();
    ctx.moveTo(128, 28);
    ctx.lineTo(138, 16);
    ctx.lineTo(146, 36);
    ctx.quadraticCurveTo(188, 34, 240, 22);
    ctx.quadraticCurveTo(212, 58, 194, 72);
    ctx.quadraticCurveTo(168, 72, 154, 88);
    ctx.lineTo(128, 114);
    ctx.lineTo(102, 88);
    ctx.quadraticCurveTo(88, 72, 62, 72);
    ctx.quadraticCurveTo(44, 58, 16, 22);
    ctx.quadraticCurveTo(68, 34, 110, 36);
    ctx.lineTo(118, 16);
    ctx.closePath();
    if (stroke && lineWidth > 0) {
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
    ctx.fillStyle = fill;
    ctx.fill();
  };

  drawBat('#111418', '#d4b27c', 11);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createGothicStoneTextures(anisotropy: number) {
  const size = 256;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const ctx = cCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  ctx.fillStyle = '#525861';
  ctx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#484848';
  hCtx.fillRect(0, 0, size, size);

  const rowH = 16;
  const blockW = 32;
  for (let r = 0; r < size / rowH; r++) {
    const off = (r % 2) * (blockW * 0.5);
    for (let c = -1; c <= size / blockW; c++) {
      const n = Math.sin(r * 17.3 + c * 31.7) * 0.5 + 0.5;
      const v = Math.round(98 + n * 42);
      ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
      ctx.fillRect(c * blockW + off + 1, r * rowH + 1, blockW - 2, rowH - 2);

      const hv = Math.round(135 + n * 55);
      hCtx.fillStyle = `rgb(${hv},${hv},${hv})`;
      hCtx.fillRect(c * blockW + off + 1, r * rowH + 1, blockW - 2, rowH - 2);
    }
  }

  for (let i = 0; i < 2400; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)';
    ctx.fillRect((i * 53) % size, (i * 29) % size, 3, 2);
  }

  return {
    map: finalizeTexture(cCanvas, anisotropy, 3, 3, true),
    normalMap: heightCanvasToNormalTexture(hCanvas, anisotropy, 2.2, 3, 3),
  };
}

export function createRollingHillGrassTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#4c6d2c';
  ctx.fillRect(0, 0, size, size);

  let seed = 3199;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const patches = [
    { count: 95, color: 'rgba(56, 92, 32, 0.45)', r: 38 },
    { count: 80, color: 'rgba(112, 134, 58, 0.38)', r: 30 },
    { count: 48, color: 'rgba(116, 94, 56, 0.35)', r: 24 },
  ];
  for (const p of patches) {
    ctx.fillStyle = p.color;
    for (let i = 0; i < p.count; i++) {
      const cx = rnd() * size;
      const cy = rnd() * size;
      const rad = p.r * (0.4 + rnd() * 0.9);
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < 12000; i++) {
    const g = 55 + Math.floor(rnd() * 68);
    ctx.fillStyle = `rgb(${Math.round(g * 0.72)},${g},${Math.round(g * 0.42)})`;
    ctx.fillRect(rnd() * size, rnd() * size, 2, 2);
  }

  return finalizeTexture(canvas, anisotropy, 12, 6, true);
}

export function createSkylineR34Textures(anisotropy: number) {
  // 1. Hood & Front Nose Twin Electric-Blue Stripes + Hood Louver Vents (transparent overlay)
  const hW = 256;
  const hH = 256;
  const hoodCanvas = document.createElement('canvas');
  hoodCanvas.width = hW;
  hoodCanvas.height = hH;
  const hCtx = hoodCanvas.getContext('2d')!;
  hCtx.clearRect(0, 0, hW, hH);

  // Soft white-silver bevel highlight behind twin blue stripes
  hCtx.fillStyle = 'rgba(226, 232, 240, 0.45)';
  hCtx.fillRect(88, 0, 32, hH);
  hCtx.fillRect(136, 0, 32, hH);

  // Twin electric-blue center racing stripes
  const stripeGrad = hCtx.createLinearGradient(0, 0, hW, 0);
  stripeGrad.addColorStop(0.32, '#1d4ed8');
  stripeGrad.addColorStop(0.5, '#2563eb');
  stripeGrad.addColorStop(0.68, '#1d4ed8');
  hCtx.fillStyle = stripeGrad;
  hCtx.fillRect(92, 0, 24, hH);
  hCtx.fillRect(140, 0, 24, hH);

  // Staggered hood louver vents along left & right hood shoulders
  for (let i = 0; i < 7; i++) {
    const y = 32 + i * 26;
    const tilt = i * 1.4;
    hCtx.fillStyle = 'rgba(29, 78, 216, 0.88)';
    hCtx.fillRect(22 + tilt, y, 28, 7);
    hCtx.fillRect(206 - tilt, y, 28, 7);
    hCtx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    hCtx.fillRect(22 + tilt, y + 6, 28, 3);
    hCtx.fillRect(206 - tilt, y + 6, 28, 3);
  }

  const hoodMap = new THREE.CanvasTexture(hoodCanvas);
  hoodMap.colorSpace = THREE.SRGBColorSpace;
  hoodMap.anisotropy = anisotropy;
  hoodMap.needsUpdate = true;

  // 2. Side Flank Diagonal Electric-Blue Vinyl Livery (u=0 front, u=1 rear)
  const sW = 512;
  const sH = 128;
  const sideCanvas = document.createElement('canvas');
  sideCanvas.width = sW;
  sideCanvas.height = sH;
  const sCtx = sideCanvas.getContext('2d')!;
  sCtx.clearRect(0, 0, sW, sH);

  // Lower rocker skirt blue stripe
  sCtx.fillStyle = '#1d5fe8';
  sCtx.beginPath();
  sCtx.moveTo(76, 128);
  sCtx.lineTo(sW, 128);
  sCtx.lineTo(sW, 74);
  sCtx.lineTo(340, 96);
  sCtx.lineTo(76, 110);
  sCtx.closePath();
  sCtx.fill();

  // Diagonal swept speed slashes climbing toward rear quarter fender
  for (let i = 0; i < 14; i++) {
    const bx = 68 + i * 28;
    const w = i > 10 ? 22 : 13;
    sCtx.fillStyle = i % 2 === 0 ? '#1d5fe8' : '#2563eb';
    sCtx.beginPath();
    sCtx.moveTo(bx, 124);
    sCtx.lineTo(bx + w, 124);
    sCtx.lineTo(bx + w + 58 - i * 1.2, Math.max(12, 92 - i * 6.2));
    sCtx.lineTo(bx + 58 - i * 1.2, Math.max(12, 92 - i * 6.2));
    sCtx.closePath();
    sCtx.fill();
  }

  // Sharp rear quarter upper winglet slash
  sCtx.fillStyle = '#1d5fe8';
  sCtx.beginPath();
  sCtx.moveTo(418, 42);
  sCtx.lineTo(506, 8);
  sCtx.lineTo(512, 34);
  sCtx.lineTo(442, 62);
  sCtx.closePath();
  sCtx.fill();

  const sideLiveryMap = new THREE.CanvasTexture(sideCanvas);
  sideLiveryMap.colorSpace = THREE.SRGBColorSpace;
  sideLiveryMap.anisotropy = anisotropy;
  sideLiveryMap.needsUpdate = true;

  return { hoodMap, sideLiveryMap };
}

export function createArmyWallTexture(anisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Weathered khaki-grey precast military concrete
  ctx.fillStyle = '#8b8577';
  ctx.fillRect(0, 0, w, h);

  // Subtle concrete mottling & sand weathering near base
  for (let i = 0; i < 2400; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.06)' : 'rgba(255,248,230,0.05)';
    ctx.fillRect((i * 73) % w, (i * 41) % h, 4, 3);
  }
  const dustGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
  dustGrad.addColorStop(0, 'rgba(180, 148, 98, 0)');
  dustGrad.addColorStop(1, 'rgba(168, 134, 82, 0.45)');
  ctx.fillStyle = dustGrad;
  ctx.fillRect(0, h * 0.65, w, h * 0.35);

  // Precast T-wall vertical joints & recessed lifting eyes
  for (let x = 0; x < w; x += 128) {
    ctx.fillStyle = '#4a473f';
    ctx.fillRect(x, 0, 5, h);
    ctx.fillStyle = '#a39d8f';
    ctx.fillRect(x + 5, 0, 3, h);
    ctx.fillStyle = '#3f3d36';
    ctx.fillRect(x + 56, 46, 16, 8);
  }

  // Top olive-drab & yellow caution chevron band
  ctx.fillStyle = '#3f4a32';
  ctx.fillRect(0, 10, w, 24);
  ctx.fillStyle = '#eab308';
  for (let x = -16; x < w; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 34);
    ctx.lineTo(x + 14, 34);
    ctx.lineTo(x + 24, 10);
    ctx.lineTo(x + 10, 10);
    ctx.closePath();
    ctx.fill();
  }

  // Military stencil lettering
  ctx.fillStyle = 'rgba(30, 36, 24, 0.65)';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('FORT SOLARIS · RESTRICTED ZONE', 256, 136);

  return finalizeTexture(canvas, anisotropy, 2, 1, true);
}



