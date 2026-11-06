import * as THREE from 'three';

const textureCache: Record<string, THREE.CanvasTexture> = {};

/**
 * Generates high-contrast crisp 1D Barcode, 2D DataMatrix, or QR Code canvas texture
 */
export function getBarcodeTexture(type: '1D_Code128' | '2D_DataMatrix' | 'QR_Code' = '1D_Code128', codeText = 'LOG-8842-X'): THREE.CanvasTexture {
  const cacheKey = `barcode_${type}_${codeText}`;
  if (textureCache[cacheKey]) return textureCache[cacheKey];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  if (type === '1D_Code128') {
    canvas.width = 512;
    canvas.height = 256;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    const marginX = 32;
    const barTop = 24;
    const barHeight = 160;
    const availableWidth = canvas.width - (marginX * 2);

    ctx.fillStyle = '#05070a';

    let currentX = marginX;
    const seed = Array.from(codeText).reduce((acc, char) => acc + char.charCodeAt(0), 42);
    let pseudoRand = seed;

    while (currentX < marginX + availableWidth) {
      pseudoRand = (pseudoRand * 9301 + 49297) % 233280;
      const barWidth = 3 + (pseudoRand % 5) * 2.5;
      pseudoRand = (pseudoRand * 9301 + 49297) % 233280;
      const spaceWidth = 2 + (pseudoRand % 4) * 2;

      if (currentX + barWidth > marginX + availableWidth) break;
      ctx.fillRect(currentX, barTop, barWidth, barHeight);
      currentX += barWidth + spaceWidth;
    }

    ctx.fillRect(marginX - 6, barTop - 4, 3, barHeight + 8);
    ctx.fillRect(marginX + availableWidth + 3, barTop - 4, 3, barHeight + 8);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`* ${codeText} *`, canvas.width / 2, canvas.height - 24);
  } else if (type === '2D_DataMatrix') {
    canvas.width = 384;
    canvas.height = 384;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const margin = 32;
    const size = canvas.width - margin * 2;
    const grid = 24;
    const cellSize = size / grid;

    ctx.fillStyle = '#05070a';

    ctx.fillRect(margin, margin, cellSize, size);
    ctx.fillRect(margin, margin + size - cellSize, size, cellSize);

    for (let i = 0; i < grid; i += 2) {
      ctx.fillRect(margin + i * cellSize, margin, cellSize, cellSize);
      ctx.fillRect(margin + size - cellSize, margin + i * cellSize, cellSize, cellSize);
    }

    let pseudoRand = 12345;
    for (let r = 1; r < grid - 1; r++) {
      for (let c = 1; c < grid - 1; c++) {
        pseudoRand = (pseudoRand * 16807) % 2147483647;
        if (pseudoRand % 2 === 0) {
          ctx.fillRect(margin + c * cellSize + 1, margin + r * cellSize + 1, cellSize - 1, cellSize - 1);
        }
      }
    }

    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ECC200-LOG-DM', canvas.width / 2, canvas.height - 8);
  } else {
    canvas.width = 384;
    canvas.height = 384;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const margin = 32;
    const size = canvas.width - margin * 2;
    const grid = 21;
    const cell = size / grid;

    ctx.fillStyle = '#05070a';

    const drawFinder = (x: number, y: number) => {
      ctx.fillRect(x, y, 7 * cell, 7 * cell);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + cell, y + cell, 5 * cell, 5 * cell);
      ctx.fillStyle = '#05070a';
      ctx.fillRect(x + 2 * cell, y + 2 * cell, 3 * cell, 3 * cell);
    };

    drawFinder(margin, margin);
    drawFinder(margin + 14 * cell, margin);
    drawFinder(margin, margin + 14 * cell);

    let pseudoRand = 78912;
    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        if ((r < 8 && c < 8) || (r < 8 && c >= 13) || (r >= 13 && c < 8)) continue;
        pseudoRand = (pseudoRand * 16807) % 2147483647;
        if (pseudoRand % 3 === 0) {
          ctx.fillRect(margin + c * cell, margin + r * cell, cell, cell);
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  textureCache[cacheKey] = texture;
  return texture;
}

/**
 * Authentic Tyre Sidewall Bead Barcode Label Texture (matching user reference image)
 * Slim, horizontal rectangular sticker with quiet zones, side numbers and dense vertical bars
 */
export function getTyreBeadBarcodeTexture(codeText = '1234 5678'): THREE.CanvasTexture {
  const cacheKey = `tyre_bead_barcode_${codeText}`;
  if (textureCache[cacheKey]) return textureCache[cacheKey];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 144; // ~3.5:1 aspect ratio
  const ctx = canvas.getContext('2d')!;

  // Crisp white sticker background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

  // Left vertical text (e.g. "1234" oriented vertically like in reference image)
  ctx.save();
  ctx.translate(28, canvas.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('1234', 0, 0);
  ctx.restore();

  // Right vertical text (e.g. "5678" oriented vertically)
  ctx.save();
  ctx.translate(canvas.width - 28, canvas.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('5678', 0, 0);
  ctx.restore();

  // Dense vertical Code 128 barcode bars in center
  const startX = 64;
  const endX = canvas.width - 64;
  const barTop = 16;
  const barHeight = canvas.height - 32;

  ctx.fillStyle = '#05070a';

  let currentX = startX;
  let pseudoRand = 94821;

  while (currentX < endX) {
    pseudoRand = (pseudoRand * 9301 + 49297) % 233280;
    const barWidth = 3 + (pseudoRand % 4) * 2.2;
    pseudoRand = (pseudoRand * 9301 + 49297) % 233280;
    const spaceWidth = 2.5 + (pseudoRand % 3) * 2;

    if (currentX + barWidth > endX) break;
    ctx.fillRect(currentX, barTop, barWidth, barHeight);
    currentX += barWidth + spaceWidth;
  }

  // Guard bars
  ctx.fillRect(startX - 4, barTop - 4, 3, barHeight + 8);
  ctx.fillRect(endX + 2, barTop - 4, 3, barHeight + 8);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  textureCache[cacheKey] = texture;
  return texture;
}

/**
 * Realistic Kraft Corrugated Cardboard box texture
 */
export function getCardboardTexture(): THREE.CanvasTexture {
  const cacheKey = 'cardboard_texture';
  if (textureCache[cacheKey]) return textureCache[cacheKey];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b78752';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(120, 80, 40, 0.12)';
  ctx.lineWidth = 1.5;
  for (let y = 0; y < canvas.height; y += 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 16;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain * 0.9));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain * 0.6));
  }
  ctx.putImageData(imgData, 0, 0);

  ctx.fillStyle = 'rgba(168, 116, 60, 0.65)';
  ctx.fillRect(canvas.width * 0.35, 0, canvas.width * 0.3, canvas.height);
  ctx.strokeStyle = 'rgba(90, 55, 20, 0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(canvas.width * 0.35, 0, canvas.width * 0.3, canvas.height);

  ctx.fillStyle = 'rgba(40, 25, 10, 0.7)';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('↑↑ FRAGILE', 36, 60);

  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('♻ 100% RECYCLED', 36, canvas.height - 30);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  textureCache[cacheKey] = texture;
  return texture;
}

/**
 * Industrial Conveyor Belt Texture with custom #00843D green tone and directional guides
 */
export function getConveyorBeltTexture(baseColor = '#00843D'): THREE.CanvasTexture {
  const cacheKey = `conveyor_belt_texture_${baseColor}`;
  if (textureCache[cacheKey]) return textureCache[cacheKey];

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(0, 60, 25, 0.4)';
  ctx.lineWidth = 2;
  for (let y = 0; y < canvas.height; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 4;

  const numChevrons = 8;
  const step = canvas.width / numChevrons;
  for (let i = 0; i < numChevrons; i++) {
    const x = i * step + 40;
    const centerY = canvas.height / 2;
    const arm = 50;

    ctx.beginPath();
    ctx.moveTo(x - arm, centerY - arm);
    ctx.lineTo(x, centerY);
    ctx.lineTo(x - arm, centerY + arm);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(234, 179, 8, 0.5)';
  ctx.fillRect(0, 0, canvas.width, 14);
  ctx.fillRect(0, canvas.height - 14, canvas.width, 14);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 12]);
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache[cacheKey] = texture;
  return texture;
}

/**
 * Vulcanized rubber tyre tread and sidewall texture
 */
export function getTyreTexture(): THREE.CanvasTexture {
  const cacheKey = 'tyre_texture';
  if (textureCache[cacheKey]) return textureCache[cacheKey];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e242d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#0f1318';
  ctx.lineWidth = 4;
  for (let i = 0; i < canvas.width; i += 24) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache[cacheKey] = texture;
  return texture;
}

/**
 * Authentic Polished Industrial Warehouse Concrete Floor Texture
 * Featuring saw-cut expansion joints, power-trowel swirl patterns, micro-aggregate grain,
 * and high-durability satin concrete sealer finish
 */
export function getWarehouseFloorTexture(): THREE.CanvasTexture {
  const cacheKey = 'warehouse_floor_texture';
  if (textureCache[cacheKey]) return textureCache[cacheKey];

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // 1. Base medium industrial concrete grey
  ctx.fillStyle = '#78808d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Concrete slab bays (2x2 grid per tile) with subtle batch pour variations
  const halfW = canvas.width / 2;
  const halfH = canvas.height / 2;
  const slabs = [
    { x: 0, y: 0, w: halfW, h: halfH, tint: 'rgba(255, 255, 255, 0.03)' },
    { x: halfW, y: 0, w: halfW, h: halfH, tint: 'rgba(0, 0, 0, 0.035)' },
    { x: 0, y: halfH, w: halfW, h: halfH, tint: 'rgba(0, 0, 0, 0.02)' },
    { x: halfW, y: halfH, w: halfW, h: halfH, tint: 'rgba(255, 255, 255, 0.04)' },
  ];

  for (const slab of slabs) {
    ctx.fillStyle = slab.tint;
    ctx.fillRect(slab.x, slab.y, slab.w, slab.h);
  }

  // 3. Power-trowel circular swirl marks (characteristic of machine-finished warehouse concrete slabs)
  ctx.save();
  for (const slab of slabs) {
    const cx = slab.x + slab.w / 2;
    const cy = slab.y + slab.h / 2;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 14;
    for (let r = 60; r < slab.w * 0.7; r += 55) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
    ctx.lineWidth = 16;
    for (let r = 85; r < slab.w * 0.7; r += 70) {
      ctx.beginPath();
      ctx.arc(cx + 30, cy - 25, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();

  // 4. Micro-aggregate grain and fine surface stippling
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  let seed = 49281;
  for (let i = 0; i < data.length; i += 4) {
    seed = (seed * 9301 + 49297) % 233280;
    const rnd = seed / 233280;
    const noise = (rnd - 0.5) * 24;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.96));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.92));
  }
  ctx.putImageData(imgData, 0, 0);

  // 5. Crisp saw-cut expansion joints with elastomeric dark seal
  ctx.strokeStyle = '#232932';
  ctx.lineWidth = 4;
  // Horizontal joint
  ctx.beginPath();
  ctx.moveTo(0, halfH);
  ctx.lineTo(canvas.width, halfH);
  ctx.stroke();
  // Vertical joint
  ctx.beginPath();
  ctx.moveTo(halfW, 0);
  ctx.lineTo(halfW, canvas.height);
  ctx.stroke();

  // Chamfer / bevel light highlight along joint edge
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, halfH + 3);
  ctx.lineTo(canvas.width, halfH + 3);
  ctx.moveTo(halfW + 3, 0);
  ctx.lineTo(halfW + 3, canvas.height);
  ctx.stroke();

  // Tile borders (to match neighboring tiles)
  ctx.strokeStyle = '#232932';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12); // ~3m x 3m bays on a 60m floor
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  textureCache[cacheKey] = texture;
  return texture;
}

/**
 * Concrete micro-roughness and joint relief bump map
 */
export function getWarehouseFloorBumpTexture(): THREE.CanvasTexture {
  const cacheKey = 'warehouse_floor_bump';
  if (textureCache[cacheKey]) return textureCache[cacheKey];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  let seed = 81723;
  for (let i = 0; i < data.length; i += 4) {
    seed = (seed * 9301 + 49297) % 233280;
    const val = 128 + (seed / 233280 - 0.5) * 40;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
  ctx.putImageData(imgData, 0, 0);

  // Expansion joint depressions in bump map
  const half = canvas.width / 2;
  ctx.strokeStyle = '#101010';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, half); ctx.lineTo(canvas.width, half);
  ctx.moveTo(half, 0); ctx.lineTo(half, canvas.height);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  textureCache[cacheKey] = texture;
  return texture;
}
