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

  ctx.fillStyle = '#23252a';
  ctx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, size, size);

  // Subtle tire-worn tracks along the two lanes
  const trackGrad = ctx.createLinearGradient(0, 0, size, 0);
  trackGrad.addColorStop(0.0, 'rgba(0,0,0,0.12)');
  trackGrad.addColorStop(0.18, 'rgba(18,19,22,0.22)');
  trackGrad.addColorStop(0.35, 'rgba(0,0,0,0.02)');
  trackGrad.addColorStop(0.65, 'rgba(0,0,0,0.02)');
  trackGrad.addColorStop(0.82, 'rgba(18,19,22,0.22)');
  trackGrad.addColorStop(1.0, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = trackGrad;
  ctx.fillRect(0, 0, size, size);

  // Aggregate mineral speckle for realistic tarmac micro-texture
  for (let i = 0; i < 14000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const v = 26 + Math.floor(Math.random() * 34);
    ctx.fillStyle = `rgb(${v},${v + 1},${v + 4})`;
    ctx.fillRect(x, y, 2, 2);

    const hv = 95 + Math.floor(Math.random() * 75);
    hCtx.fillStyle = `rgb(${hv},${hv},${hv})`;
    hCtx.fillRect(x, y, 2, 2);
  }

  // Crisp shoulder lines
  ctx.fillStyle = 'rgba(244, 244, 245, 0.8)';
  ctx.fillRect(16, 0, 7, size);
  ctx.fillRect(size - 23, 0, 7, size);

  // Double dashed / solid amber centerline
  ctx.fillStyle = '#eab308';
  for (let y = 0; y < size; y += 64) {
    ctx.fillRect(248, y + 6, 6, 40);
    ctx.fillRect(258, y + 6, 6, 40);
  }

  return {
    map: finalizeTexture(colorCanvas, anisotropy, 1, 1, true),
    normalMap: heightCanvasToNormalTexture(heightCanvas, anisotropy, 2.2, 1, 1),
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
        ? '#e2e5ea'
        : style === 'limestone_classic'
          ? '#cbc6bc'
          : baseHex;

  dCtx.fillStyle = baseColor;
  dCtx.fillRect(0, 0, w, h);
  nCtx.fillStyle = '#050811';
  nCtx.fillRect(0, 0, w, h);
  hCtx.fillStyle = '#dcdcdc';
  hCtx.fillRect(0, 0, w, h);

  const cols = style === 'modern_stripe' ? 10 : 8;
  const rows = style === 'limestone_classic' ? 20 : 18;
  const padX = style === 'modern_stripe' ? 1 : 4;
  const padY = style === 'modern_stripe' ? 6 : 5;
  const cellW = w / cols;
  const cellH = h / rows;

  for (let r = 0; r < rows; r++) {
    // Spandrel floor band
    dCtx.fillStyle =
      style === 'modern_stripe'
        ? '#f4f4f5'
        : style === 'limestone_classic'
          ? 'rgba(0,0,0,0.08)'
          : 'rgba(15, 23, 42, 0.55)';
    dCtx.fillRect(0, r * cellH, w, style === 'modern_stripe' ? 7 : 4);

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
        grad.addColorStop(0, seed > 0.35 ? '#38bdf8' : '#0284c7');
        grad.addColorStop(1, '#0c4a6e');
      } else if (style === 'limestone_classic') {
        grad.addColorStop(0, seed > 0.45 ? '#475569' : '#334155');
        grad.addColorStop(1, '#1e293b');
      } else {
        grad.addColorStop(0, seed > 0.45 ? '#38bdf8' : '#1e3a5f');
        grad.addColorStop(1, '#0f172a');
      }
      dCtx.fillStyle = grad;
      dCtx.fillRect(wx, wy, ww, wh);

      if (style === 'terracotta') {
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

export function createWaterNormalMap(anisotropy: number): THREE.CanvasTexture {
  const size = 256;
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
        Math.sin(u * 3 + v * 2) * 0.35 +
        Math.cos(u * 5 - v * 4) * 0.25 +
        Math.sin(u * 9 + v * 7) * 0.15;
      const val = Math.max(0, Math.min(255, Math.round((wave * 0.5 + 0.5) * 255)));
      const idx = (y * size + x) * 4;
      d[idx] = val;
      d[idx + 1] = val;
      d[idx + 2] = val;
      d[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return heightCanvasToNormalTexture(hCanvas, anisotropy, 2.4, 14, 10);
}

export function createGrassTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3d5e2a';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle dark earth patches
  for (let i = 0; i < 420; i++) {
    ctx.fillStyle = 'rgba(58, 46, 32, 0.22)';
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 5, 4);
  }

  // Dense multi-tone grass blade micro-texture
  for (let i = 0; i < 6500; i++) {
    const r = 46 + Math.floor(Math.random() * 44);
    const g = 88 + Math.floor(Math.random() * 58);
    const b = 26 + Math.floor(Math.random() * 26);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 3);
  }

  // Scattered dry autumn leaf flecks
  for (let i = 0; i < 220; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(138, 92, 46, 0.72)' : 'rgba(161, 114, 52, 0.65)';
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 2);
  }

  return finalizeTexture(canvas, anisotropy, 8, 8, true);
}

export function createSandTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d6be8a';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 4200; i++) {
    const r = 196 + Math.floor(Math.random() * 34);
    const g = 170 + Math.floor(Math.random() * 32);
    const b = 116 + Math.floor(Math.random() * 28);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }

  return finalizeTexture(canvas, anisotropy, 18, 4, true);
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



