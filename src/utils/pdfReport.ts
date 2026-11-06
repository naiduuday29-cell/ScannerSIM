import * as THREE from 'three';
import { ConveyorConfig, Scanner, UnitConfig } from '../types';
import { toDisplayLength, toDisplaySpeed } from './units';

/**
 * Pure TypeScript PDF 1.4 Document Generator
 * Zero external dependencies. Generates 100% compliant ISO 32000-1 / PDF 1.4 binary documents.
 * Includes complete vector mechanical CAD drawing engine for orthographic projections & dimension callouts.
 */
export class PdfDocument {
  private pages: { content: string }[] = [];
  private currentPage = 0;
  readonly width = 595.28; // A4 standard width in points (72 pt / inch)
  readonly height = 841.89; // A4 standard height in points
  readonly margin = 36; // 0.5 inch margins

  constructor() {
    this.addPage();
  }

  addPage(): number {
    this.pages.push({ content: '' });
    this.currentPage = this.pages.length - 1;
    return this.currentPage;
  }

  setPage(idx: number): void {
    if (idx >= 0 && idx < this.pages.length) {
      this.currentPage = idx;
    }
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  getPageCount(): number {
    return this.pages.length;
  }

  private append(cmd: string): void {
    this.pages[this.currentPage].content += cmd + '\n';
  }

  drawRect(
    x: number,
    y: number,
    w: number,
    h: number,
    fillRgb?: [number, number, number],
    strokeRgb?: [number, number, number],
    lineWidth = 1
  ): void {
    let cmd = 'q\n[] 0 d\n';
    if (lineWidth) cmd += `${lineWidth.toFixed(2)} w\n`;
    if (strokeRgb) {
      cmd += `${strokeRgb[0].toFixed(3)} ${strokeRgb[1].toFixed(3)} ${strokeRgb[2].toFixed(3)} RG\n`;
    }
    if (fillRgb) {
      cmd += `${fillRgb[0].toFixed(3)} ${fillRgb[1].toFixed(3)} ${fillRgb[2].toFixed(3)} rg\n`;
    }
    cmd += `${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re\n`;
    if (fillRgb && strokeRgb) cmd += 'B\n';
    else if (fillRgb) cmd += 'f\n';
    else if (strokeRgb) cmd += 'S\n';
    cmd += 'Q\n';
    this.append(cmd);
  }

  drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    strokeRgb: [number, number, number] = [0.8, 0.85, 0.9],
    lineWidth = 1
  ): void {
    let cmd = 'q\n[] 0 d\n';
    cmd += `${lineWidth.toFixed(2)} w\n`;
    cmd += `${strokeRgb[0].toFixed(3)} ${strokeRgb[1].toFixed(3)} ${strokeRgb[2].toFixed(3)} RG\n`;
    cmd += `${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S\n`;
    cmd += 'Q\n';
    this.append(cmd);
  }

  drawDashedLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    strokeRgb: [number, number, number] = [0.4, 0.45, 0.5],
    lineWidth = 0.8,
    dash = '[3 2] 0'
  ): void {
    let cmd = 'q\n';
    cmd += `${lineWidth.toFixed(2)} w\n`;
    cmd += `${dash} d\n`;
    cmd += `${strokeRgb[0].toFixed(3)} ${strokeRgb[1].toFixed(3)} ${strokeRgb[2].toFixed(3)} RG\n`;
    cmd += `${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S\n`;
    cmd += 'Q\n';
    this.append(cmd);
  }

  drawCenterline(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    strokeRgb: [number, number, number] = [0.75, 0.25, 0.2]
  ): void {
    // Standard CAD Centerline: long dash, short gap, dot, short gap
    this.drawDashedLine(x1, y1, x2, y2, strokeRgb, 0.65, '[7 2 1.5 2] 0');
  }

  // Draw arrow at tip (x, y) pointing towards angleRad
  drawArrow(
    x: number,
    y: number,
    angleRad: number,
    length = 5,
    width = 2.2,
    rgb: [number, number, number] = [0.05, 0.35, 0.70]
  ): void {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const perpCos = -sin;
    const perpSin = cos;

    const baseCenterX = x - length * cos;
    const baseCenterY = y - length * sin;

    const corner1X = baseCenterX + width * perpCos;
    const corner1Y = baseCenterY + width * perpSin;
    const corner2X = baseCenterX - width * perpCos;
    const corner2Y = baseCenterY - width * perpSin;

    let cmd = 'q\n[] 0 d\n';
    cmd += `${rgb[0].toFixed(3)} ${rgb[1].toFixed(3)} ${rgb[2].toFixed(3)} rg\n`;
    cmd += `${x.toFixed(2)} ${y.toFixed(2)} m `;
    cmd += `${corner1X.toFixed(2)} ${corner1Y.toFixed(2)} l `;
    cmd += `${corner2X.toFixed(2)} ${corner2Y.toFixed(2)} l f\n`;
    cmd += 'Q\n';
    this.append(cmd);
  }

  // Engineering Dimension line with arrows, extension lines and text label
  drawDimension(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    text: string,
    options?: {
      color?: [number, number, number];
      extLine1?: { fromX: number; fromY: number };
      extLine2?: { fromX: number; fromY: number };
      fontSize?: number;
    }
  ): void {
    const rgb = options?.color || [0.05, 0.35, 0.70]; // CAD blue
    const fontSize = options?.fontSize || 6.5;

    // Witness / Extension Lines
    if (options?.extLine1) {
      this.drawLine(options.extLine1.fromX, options.extLine1.fromY, x1, y1, rgb, 0.4);
    }
    if (options?.extLine2) {
      this.drawLine(options.extLine2.fromX, options.extLine2.fromY, x2, y2, rgb, 0.4);
    }

    // Main Dimension Line
    this.drawLine(x1, y1, x2, y2, rgb, 0.75);

    // Arrows at both ends
    const angle = Math.atan2(y2 - y1, x2 - x1);
    this.drawArrow(x1, y1, angle + Math.PI, 4.5, 2.0, rgb);
    this.drawArrow(x2, y2, angle, 4.5, 2.0, rgb);

    // Dimension label with small white background pill
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const charW = fontSize * 0.58;
    const boxW = text.length * charW + 4;
    const boxH = fontSize + 3;

    this.drawRect(midX - boxW / 2, midY - boxH / 2, boxW, boxH, [1, 1, 1], undefined);
    this.drawText(text, midX, midY - fontSize * 0.35, {
      font: 'F4',
      size: fontSize,
      color: rgb,
      align: 'center'
    });
  }

  // Ground Hatch pattern (///) below a floor line
  drawGroundHatch(x1: number, x2: number, y: number, depth = 5): void {
    this.drawLine(x1, y, x2, y, [0.3, 0.35, 0.4], 1.2);
    const step = 6;
    for (let curX = x1; curX <= x2; curX += step) {
      this.drawLine(curX, y, curX - 4, y - depth, [0.6, 0.65, 0.7], 0.6);
    }
  }

  drawText(
    text: string,
    x: number,
    y: number,
    options?: {
      font?: 'F1' | 'F2' | 'F3' | 'F4'; // F1: Helvetica, F2: Helvetica-Bold, F3: Courier, F4: Courier-Bold
      size?: number;
      color?: [number, number, number];
      align?: 'left' | 'center' | 'right';
      width?: number;
    }
  ): void {
    const font = options?.font || 'F1';
    const size = options?.size || 9;
    const color = options?.color || [0.1, 0.1, 0.1];
    const align = options?.align || 'left';

    const approxCharWidth = font === 'F3' || font === 'F4' ? 0.6 * size : 0.52 * size;
    const textWidth = text.length * approxCharWidth;

    let posX = x;
    if (align === 'center') {
      posX = options?.width ? x + (options.width - textWidth) / 2 : x - textWidth / 2;
    } else if (align === 'right') {
      posX = options?.width ? x + options.width - textWidth : x - textWidth;
    }

    const safeText = text
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');

    let cmd = 'BT\n';
    cmd += `/${font} ${size.toFixed(2)} Tf\n`;
    cmd += `${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} rg\n`;
    cmd += `1 0 0 1 ${posX.toFixed(2)} ${y.toFixed(2)} Tm\n`;
    cmd += `(${safeText}) Tj\n`;
    cmd += 'ET\n';
    this.append(cmd);
  }

  buildPdf(): Uint8Array {
    const numPages = this.pages.length;
    const font1Id = 3 + numPages;
    const font2Id = 4 + numPages;
    const font3Id = 5 + numPages;
    const font4Id = 6 + numPages;
    const firstStreamId = 7 + numPages;

    const bodyParts: { id: number; data: string }[] = [];

    // Catalog
    bodyParts.push({
      id: 1,
      data: `<< /Type /Catalog /Pages 2 0 R >>`
    });

    // Pages list
    const pageRefs = Array.from({ length: numPages }, (_, i) => `${3 + i} 0 R`).join(' ');
    bodyParts.push({
      id: 2,
      data: `<< /Type /Pages /Kids [${pageRefs}] /Count ${numPages} >>`
    });

    // Page objects
    for (let i = 0; i < numPages; i++) {
      const pageId = 3 + i;
      const streamId = firstStreamId + i;
      bodyParts.push({
        id: pageId,
        data: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.width.toFixed(2)} ${this.height.toFixed(2)}] /Resources << /Font << /F1 ${font1Id} 0 R /F2 ${font2Id} 0 R /F3 ${font3Id} 0 R /F4 ${font4Id} 0 R >> >> /Contents ${streamId} 0 R >>`
      });
    }

    // Type 1 Standard Core Fonts (Supported natively by all PDF Viewers)
    bodyParts.push({ id: font1Id, data: `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>` });
    bodyParts.push({ id: font2Id, data: `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>` });
    bodyParts.push({ id: font3Id, data: `<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>` });
    bodyParts.push({ id: font4Id, data: `<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>` });

    // Page content streams
    for (let i = 0; i < numPages; i++) {
      const streamId = firstStreamId + i;
      const content = this.pages[i].content;
      const encoder = new TextEncoder();
      const encoded = encoder.encode(content);
      bodyParts.push({
        id: streamId,
        data: `<< /Length ${encoded.length} >>\nstream\n${content}\nendstream`
      });
    }

    bodyParts.sort((a, b) => a.id - b.id);

    // Assembly
    const headerStr = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [encoder.encode(headerStr)];
    let currentOffset = chunks[0].length;

    const xrefOffsets: number[] = [0];

    for (const part of bodyParts) {
      xrefOffsets[part.id] = currentOffset;
      const partStr = `${part.id} 0 obj\n${part.data}\nendobj\n`;
      const partBuf = encoder.encode(partStr);
      chunks.push(partBuf);
      currentOffset += partBuf.length;
    }

    const startXref = currentOffset;
    const totalObjects = bodyParts.length + 1;

    let xrefStr = `xref\n0 ${totalObjects}\n0000000000 65535 f \n`;
    for (let i = 1; i < totalObjects; i++) {
      const off = xrefOffsets[i] || 0;
      xrefStr += off.toString().padStart(10, '0') + ' 00000 n \n';
    }

    const trailerStr = `trailer\n<< /Size ${totalObjects} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
    chunks.push(encoder.encode(xrefStr + trailerStr));

    let totalLength = 0;
    for (const c of chunks) totalLength += c.length;
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const c of chunks) {
      result.set(c, offset);
      offset += c.length;
    }

    return result;
  }
}

/**
 * Calculates optical aim point and working distance on conveyor belt surface
 */
export function calculateAimPoint(scanner: Scanner, conveyor: ConveyorConfig) {
  const euler = new THREE.Euler(
    THREE.MathUtils.degToRad(scanner.rotation.pitch),
    THREE.MathUtils.degToRad(scanner.rotation.yaw),
    THREE.MathUtils.degToRad(scanner.rotation.roll),
    'YXZ'
  );
  const quat = new THREE.Quaternion().setFromEuler(euler);
  const boresight = new THREE.Vector3(0, 0, -1).applyQuaternion(quat).normalize();

  const rayOrigin = new THREE.Vector3(scanner.position.x, scanner.position.y, scanner.position.z);

  if (Math.abs(boresight.y) > 0.001) {
    const t = -rayOrigin.y / boresight.y;
    if (t > 0) {
      const aim = rayOrigin.clone().add(boresight.clone().multiplyScalar(t));
      return {
        aimX: aim.x,
        aimZ: aim.z,
        workingDist: t,
        strikesBelt: Math.abs(aim.z) <= conveyor.width / 2 && Math.abs(aim.x) <= conveyor.length / 2
      };
    }
  }

  const directDist = rayOrigin.length();
  return {
    aimX: scanner.position.x,
    aimZ: scanner.position.z,
    workingDist: directDist,
    strikesBelt: false
  };
}

/**
 * Helper to get descriptive location classification for a scanner
 */
export function getScannerLocationType(scanner: Scanner, conveyor: ConveyorConfig): string {
  const halfW = conveyor.width / 2;
  if (scanner.position.y >= 0.7 && Math.abs(scanner.position.z) <= halfW * 0.8) {
    return 'Overhead (Top-Down)';
  } else if (scanner.position.z > halfW * 0.7) {
    return 'Left Side (Cross-Belt)';
  } else if (scanner.position.z < -halfW * 0.7) {
    return 'Right Side (Cross-Belt)';
  } else if (scanner.position.y < 0.2) {
    return 'Underside (Bottom Gap)';
  }
  return 'Angled Portal Array';
}

/**
 * Renders an official engineering CAD Title Block in bottom right corner of a drawing sheet
 */
function drawCadTitleBlock(
  pdf: PdfDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  dwgNo: string,
  dateStr: string,
  unitStr: string
) {
  pdf.drawRect(x, y, w, h, [0.98, 0.99, 1.0], [0.15, 0.25, 0.40], 1.0);
  pdf.drawLine(x, y + h - 18, x + w, y + h - 18, [0.2, 0.3, 0.45], 0.6);
  pdf.drawLine(x, y + 16, x + w, y + 16, [0.2, 0.3, 0.45], 0.6);

  // Subdivisions
  pdf.drawLine(x + w * 0.6, y, x + w * 0.6, y + h - 18, [0.2, 0.3, 0.45], 0.6);

  // Header Title
  pdf.drawText('PROJECT: INDUSTRIAL SCANNER MOUNTING SETUP', x + 6, y + h - 13, { font: 'F2', size: 7, color: [0.1, 0.2, 0.35] });
  pdf.drawText(`DWG NO: ${dwgNo}`, x + w - 6, y + h - 13, { font: 'F4', size: 7.5, color: [0.05, 0.35, 0.7], align: 'right' });

  // Main Drawing Name
  pdf.drawText(title, x + 6, y + 22, { font: 'F2', size: 8.5, color: [0.05, 0.15, 0.3] });

  // Right column: Date, Scale, Tolerances
  pdf.drawText(`DATE: ${dateStr}`, x + w * 0.6 + 6, y + 36, { font: 'F3', size: 6.5, color: [0.2, 0.25, 0.3] });
  pdf.drawText(`UNITS: ${unitStr.toUpperCase()}`, x + w * 0.6 + 6, y + 26, { font: 'F4', size: 6.5, color: [0.05, 0.45, 0.2] });
  pdf.drawText(`TOLERANCE: ±2mm / ±0.5°`, x + w * 0.6 + 6, y + 18, { font: 'F3', size: 6, color: [0.3, 0.35, 0.4] });

  // Bottom row: Standard CAD disclaimer
  pdf.drawText('THIRD ANGLE PROJECTION · WCS CONVEYOR BELT CENTERLINE DATUM [0,0,0]', x + 6, y + 5, { font: 'F1', size: 5.5, color: [0.4, 0.45, 0.5] });
}

/**
 * Generates the complete Multi-Page PDF report including CAD Orthographic Drawings with full dimensions
 */
export function generateMountingReportPdf(options: {
  conveyor: ConveyorConfig;
  scanners: Scanner[];
  units: UnitConfig;
}): Blob {
  const { conveyor, scanners, units } = options;
  const pdf = new PdfDocument();

  const dim = units.dimension;
  const spd = units.speed;

  const fmtLen = (m: number) => {
    const val = toDisplayLength(m, dim);
    return `${val.toFixed(dim === 'mm' ? 0 : 2)} ${dim}`;
  };

  const fmtSpd = (mps: number) => {
    const val = toDisplaySpeed(mps, spd);
    return `${val.toFixed(1)} ${spd}`;
  };

  const dateStr = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const contentW = pdf.width - 2 * pdf.margin; // 523.28 pt

  // =========================================================================
  // PAGE 1: EXECUTIVE SUMMARY & MULTI-SCANNER ARRAY MASTER CAD ELEVATION
  // =========================================================================

  // Top Banner
  pdf.drawRect(pdf.margin, 762, contentW, 44, [0.03, 0.10, 0.20], undefined);
  pdf.drawRect(pdf.margin, 759, contentW, 3, [0.00, 0.70, 0.90], undefined); // Cyan stripe

  pdf.drawText('SCANNER 3D SIMULATOR - MOUNTING SETUP REPORT', pdf.margin + 12, 788, {
    font: 'F2',
    size: 13,
    color: [1, 1, 1]
  });
  pdf.drawText('Conveyor Reference Datum & Multi-Scanner Dimensional Installation Datasheet', pdf.margin + 12, 772, {
    font: 'F1',
    size: 8.5,
    color: [0.70, 0.85, 1.00]
  });
  pdf.drawText(`Date: ${dateStr}`, pdf.margin + contentW - 12, 788, {
    font: 'F3',
    size: 8,
    color: [0.85, 0.92, 1.00],
    align: 'right'
  });
  pdf.drawText(`Units: [${dim.toUpperCase()}, ${spd.toUpperCase()}]`, pdf.margin + contentW - 12, 772, {
    font: 'F4',
    size: 8,
    color: [0.30, 0.85, 1.00],
    align: 'right'
  });

  // Section 1: Conveyor Baseline
  let curY = 740;
  pdf.drawText('1. CONVEYOR BASELINE REFERENCE DATUM', pdf.margin, curY, {
    font: 'F2',
    size: 9.5,
    color: [0.05, 0.52, 0.24]
  });
  curY -= 5;
  pdf.drawLine(pdf.margin, curY, pdf.margin + contentW, curY, [0.05, 0.52, 0.24], 1.2);

  curY -= 40;
  pdf.drawRect(pdf.margin, curY, contentW, 36, [0.96, 0.98, 0.97], [0.80, 0.88, 0.82], 0.8);

  const colW = contentW / 4;
  const specItems = [
    { label: 'Belt Width (Z)', val: fmtLen(conveyor.width), sub: `Half-Width: ±${fmtLen(conveyor.width / 2)}` },
    { label: 'Bed Elevation (Y)', val: fmtLen(conveyor.height), sub: 'Height Above Floor Datum' },
    { label: 'Conveyor Length (X)', val: fmtLen(conveyor.length), sub: `Span: ±${fmtLen(conveyor.length / 2)}` },
    { label: 'Belt Velocity', val: fmtSpd(conveyor.beltSpeed), sub: `Side Rails: ${fmtLen(conveyor.sideRailHeight)}` }
  ];

  for (let i = 0; i < specItems.length; i++) {
    const item = specItems[i];
    const bx = pdf.margin + i * colW;
    pdf.drawText(item.label, bx + 8, curY + 24, { font: 'F2', size: 7.5, color: [0.2, 0.3, 0.25] });
    pdf.drawText(item.val, bx + 8, curY + 13, { font: 'F4', size: 9, color: [0.03, 0.45, 0.20] });
    pdf.drawText(item.sub, bx + 8, curY + 4, { font: 'F1', size: 6, color: [0.45, 0.55, 0.50] });
    if (i > 0) pdf.drawLine(bx, curY + 3, bx, curY + 33, [0.85, 0.90, 0.87], 0.6);
  }

  // Section 2: Master Array CAD Front Elevation View (Z-Y Cross-Section)
  curY -= 18;
  pdf.drawText('2. SCANNER ARRAY MASTER CAD FRONT ELEVATION (Z-Y CROSS-SECTION WRT CONVEYOR)', pdf.margin, curY, {
    font: 'F2',
    size: 9.5,
    color: [0.05, 0.35, 0.70]
  });
  curY -= 5;
  pdf.drawLine(pdf.margin, curY, pdf.margin + contentW, curY, [0.05, 0.35, 0.70], 1.2);

  // Master CAD Drawing Frame
  const masterCadH = 240;
  curY -= masterCadH;
  const cadX = pdf.margin;
  const cadY = curY;
  pdf.drawRect(cadX, cadY, contentW, masterCadH, [0.985, 0.99, 1.0], [0.75, 0.82, 0.90], 0.8);

  // Blueprint background gridlines (subtle 20pt grid)
  for (let gx = cadX + 20; gx < cadX + contentW; gx += 25) {
    pdf.drawLine(gx, cadY, gx, cadY + masterCadH, [0.93, 0.95, 0.98], 0.4);
  }
  for (let gy = cadY + 20; gy < cadY + masterCadH; gy += 25) {
    pdf.drawLine(cadX, gy, cadX + contentW, gy, [0.93, 0.95, 0.98], 0.4);
  }

  // CAD Drawing View Label
  pdf.drawText('FRONT ELEVATION VIEW — LOOKING DOWNSTREAM ALONG CONVEYOR FLOW (+X)', cadX + 10, cadY + masterCadH - 14, {
    font: 'F2',
    size: 7.5,
    color: [0.2, 0.3, 0.45]
  });

  // Calculate master CAD scale
  const masterOriginX = cadX + contentW / 2;
  const masterOriginY = cadY + 80; // Conveyor Belt surface (Y=0)
  const masterScale = 110; // 1 meter = 110 pt

  // Floor Datum Line
  const floorY = masterOriginY - conveyor.height * masterScale;
  pdf.drawGroundHatch(cadX + 15, cadX + contentW - 15, floorY, 6);
  pdf.drawText(`FINISHED FLOOR DATUM (Y = -${fmtLen(conveyor.height)})`, cadX + 20, floorY + 4, {
    font: 'F2',
    size: 6.5,
    color: [0.3, 0.35, 0.4]
  });

  // Centerline (CL)
  pdf.drawCenterline(masterOriginX, floorY - 6, masterOriginX, cadY + masterCadH - 20);
  pdf.drawText('CL (CONVEYOR CENTERLINE)', masterOriginX + 3, cadY + masterCadH - 25, {
    font: 'F2',
    size: 6,
    color: [0.75, 0.25, 0.2]
  });

  // Conveyor Bed Cross-Section
  const halfBW = (conveyor.width / 2) * masterScale;
  // Green belt surface
  pdf.drawRect(masterOriginX - halfBW, masterOriginY - 3, halfBW * 2, 3, [0.0, 0.52, 0.24], [0.0, 0.4, 0.18], 0.8);
  // Conveyor bed structure
  pdf.drawRect(masterOriginX - halfBW, masterOriginY - 14, halfBW * 2, 11, [0.82, 0.85, 0.88], [0.6, 0.65, 0.7], 0.6);
  // Side guard rails
  const railH = conveyor.sideRailHeight * masterScale;
  pdf.drawRect(masterOriginX - halfBW - 3, masterOriginY - 14, 3, 14 + railH, [0.95, 0.75, 0.1], [0.8, 0.6, 0.05], 0.6); // Yellow left rail
  pdf.drawRect(masterOriginX + halfBW, masterOriginY - 14, 3, 14 + railH, [0.95, 0.75, 0.1], [0.8, 0.6, 0.05], 0.6); // Yellow right rail

  // Conveyor support legs down to floor
  pdf.drawRect(masterOriginX - halfBW * 0.75 - 3, floorY, 6, masterOriginY - 14 - floorY, [0.2, 0.25, 0.3], undefined);
  pdf.drawRect(masterOriginX + halfBW * 0.75 - 3, floorY, 6, masterOriginY - 14 - floorY, [0.2, 0.25, 0.3], undefined);

  // Gantry Portal Frame
  const portalHalfW = halfBW + 0.35 * masterScale;
  const maxScannerY = Math.max(...scanners.map((s) => s.position.y), 1.0);
  const beamHeight = (maxScannerY + 0.18) * masterScale;
  const beamY = masterOriginY + beamHeight;

  // Gantry Posts
  pdf.drawRect(masterOriginX - portalHalfW - 5, floorY, 10, beamY - floorY, [0.4, 0.45, 0.5], [0.25, 0.3, 0.35], 0.8);
  pdf.drawRect(masterOriginX + portalHalfW - 5, floorY, 10, beamY - floorY, [0.4, 0.45, 0.5], [0.25, 0.3, 0.35], 0.8);
  // Top Crossbeam
  pdf.drawRect(masterOriginX - portalHalfW - 8, beamY, (portalHalfW + 8) * 2, 10, [0.4, 0.45, 0.5], [0.25, 0.3, 0.35], 0.8);

  // Render all active scanners onto the Master Front Elevation
  scanners.forEach((scanner, sIdx) => {
    const scX = masterOriginX + scanner.position.z * masterScale;
    const scY = masterOriginY + scanner.position.y * masterScale;

    // Bracket connection to gantry
    if (scanner.position.y > 0.8) {
      // Overhead drop bracket from top beam
      pdf.drawLine(scX, beamY, scX, scY + 6, [0.3, 0.35, 0.4], 2.0);
    } else if (scanner.position.z > conveyor.width / 2) {
      // Left side bracket from post
      pdf.drawLine(masterOriginX + portalHalfW - 5, scY, scX + 6, scY, [0.3, 0.35, 0.4], 2.0);
    } else if (scanner.position.z < -conveyor.width / 2) {
      // Right side bracket from post
      pdf.drawLine(masterOriginX - portalHalfW + 5, scY, scX - 6, scY, [0.3, 0.35, 0.4], 2.0);
    }

    // Scanner Box (12pt x 8pt)
    pdf.drawRect(scX - 6, scY - 4, 12, 8, [0.03, 0.55, 0.8], [0.05, 0.25, 0.45], 0.8);
    // Lens
    pdf.drawRect(scX - 3, scY - 5, 6, 2, [0.1, 0.15, 0.2], undefined);

    // Optical sightline dashed cone
    pdf.drawDashedLine(scX, scY - 4, masterOriginX, masterOriginY, [0.0, 0.7, 0.85], 0.6);

    // Callout badge with scanner number
    pdf.drawRect(scX - 5, scY + 7, 10, 8, [0.05, 0.35, 0.7], undefined);
    pdf.drawText(`S${sIdx + 1}`, scX, scY + 8.5, { font: 'F4', size: 5.5, color: [1, 1, 1], align: 'center' });
  });

  // Conveyor Belt Width Dimension Callout on Master View
  pdf.drawDimension(
    masterOriginX - halfBW,
    masterOriginY - 26,
    masterOriginX + halfBW,
    masterOriginY - 26,
    `BELT WIDTH = ${fmtLen(conveyor.width)}`,
    {
      color: [0.05, 0.50, 0.25],
      extLine1: { fromX: masterOriginX - halfBW, fromY: masterOriginY - 5 },
      extLine2: { fromX: masterOriginX + halfBW, fromY: masterOriginY - 5 },
      fontSize: 6.5
    }
  );

  // Section 3: Summary Table
  curY -= 16;
  pdf.drawText('3. SCANNER ARRAY INSTALLATION SUMMARY TABLE', pdf.margin, curY, {
    font: 'F2',
    size: 9.5,
    color: [0.03, 0.40, 0.65]
  });
  curY -= 5;
  pdf.drawLine(pdf.margin, curY, pdf.margin + contentW, curY, [0.03, 0.40, 0.65], 1.2);

  // Table Headers
  curY -= 16;
  pdf.drawRect(pdf.margin, curY, contentW, 15, [0.08, 0.20, 0.35], undefined);

  const tCols = [
    { label: '# Scanner Name', w: 105, align: 'left' as const },
    { label: 'Location', w: 85, align: 'left' as const },
    { label: `X (Flow)`, w: 50, align: 'right' as const },
    { label: `Y (Belt)`, w: 50, align: 'right' as const },
    { label: `AFF (Floor)`, w: 52, align: 'right' as const },
    { label: `Z (Offset)`, w: 50, align: 'right' as const },
    { label: `Rail Standoff`, w: 55, align: 'right' as const },
    { label: `Pitch / Roll / Yaw`, w: 76, align: 'center' as const }
  ];

  let curTableX = pdf.margin;
  for (const c of tCols) {
    pdf.drawText(c.label, curTableX + 4, curY + 4, {
      font: 'F2',
      size: 6.5,
      color: [1, 1, 1],
      width: c.w - 8,
      align: c.align
    });
    curTableX += c.w;
  }

  // Table Rows
  const halfBeltW = conveyor.width / 2;
  scanners.forEach((scanner, idx) => {
    curY -= 14;
    const isEven = idx % 2 === 0;
    pdf.drawRect(pdf.margin, curY, contentW, 14, isEven ? [0.98, 0.99, 1.0] : [0.93, 0.95, 0.98], [0.85, 0.88, 0.92], 0.4);

    const locType = getScannerLocationType(scanner, conveyor);
    const aff = conveyor.height + scanner.position.y;
    const zOffset = scanner.position.z;
    const railStandoff = Math.abs(zOffset) - halfBeltW;
    const railStr = railStandoff > 0 ? `+${fmtLen(railStandoff)} (ext)` : `${fmtLen(Math.abs(railStandoff))} (over)`;
    const anglesStr = `${scanner.rotation.pitch}° / ${scanner.rotation.roll}° / ${scanner.rotation.yaw}°`;

    let rX = pdf.margin;
    pdf.drawText(`S${idx + 1}. ${scanner.name}`, rX + 4, curY + 3.5, { font: 'F2', size: 6.5, color: [0.1, 0.15, 0.25], width: 97, align: 'left' });
    rX += 105;
    pdf.drawText(locType, rX + 4, curY + 3.5, { font: 'F1', size: 6, color: [0.25, 0.35, 0.45], width: 77, align: 'left' });
    rX += 85;
    pdf.drawText(fmtLen(scanner.position.x), rX + 4, curY + 3.5, { font: 'F3', size: 6.5, color: [0.1, 0.1, 0.1], width: 42, align: 'right' });
    rX += 50;
    pdf.drawText(fmtLen(scanner.position.y), rX + 4, curY + 3.5, { font: 'F4', size: 6.5, color: [0.05, 0.50, 0.25], width: 42, align: 'right' });
    rX += 50;
    pdf.drawText(fmtLen(aff), rX + 4, curY + 3.5, { font: 'F3', size: 6.5, color: [0.1, 0.25, 0.5], width: 44, align: 'right' });
    rX += 52;
    pdf.drawText(fmtLen(zOffset), rX + 4, curY + 3.5, { font: 'F3', size: 6.5, color: [0.1, 0.1, 0.1], width: 42, align: 'right' });
    rX += 50;
    pdf.drawText(railStr, rX + 4, curY + 3.5, { font: 'F1', size: 6, color: railStandoff > 0 ? [0.15, 0.45, 0.25] : [0.65, 0.35, 0.05], width: 47, align: 'right' });
    rX += 55;
    pdf.drawText(anglesStr, rX + 4, curY + 3.5, { font: 'F3', size: 6, color: [0.2, 0.2, 0.3], width: 68, align: 'center' });
  });

  // Footer Page 1
  pdf.drawLine(pdf.margin, 34, pdf.margin + contentW, 34, [0.8, 0.85, 0.9], 0.6);
  pdf.drawText('Scanner 3D Simulation & Optical Deployment Engine', pdf.margin, 24, { font: 'F1', size: 7, color: [0.5, 0.55, 0.6] });
  pdf.drawText(`Sheet 1 of ${scanners.length + 1} · Master Layout & Array CAD Elevation`, pdf.margin + contentW, 24, {
    font: 'F3',
    size: 7,
    color: [0.5, 0.55, 0.6],
    align: 'right'
  });

  // =========================================================================
  // DEDICATED CAD DRAWING SHEETS (1 PAGE PER SCANNER)
  // Shows full Front Elevation (Z-Y), Side Elevation (X-Y), & Installation Specs
  // =========================================================================
  scanners.forEach((scanner, sIdx) => {
    pdf.addPage();
    const sheetNo = `DWG-MNT-${(sIdx + 1).toString().padStart(2, '0')}`;

    // Engineering Drawing Outer & Inner Border
    pdf.drawRect(pdf.margin, pdf.margin, contentW, pdf.height - 2 * pdf.margin, undefined, [0.1, 0.15, 0.25], 1.2);
    pdf.drawRect(pdf.margin + 3, pdf.margin + 3, contentW - 6, pdf.height - 2 * pdf.margin - 6, undefined, [0.3, 0.4, 0.5], 0.5);

    // Sheet Header
    pdf.drawRect(pdf.margin + 3, pdf.height - pdf.margin - 38, contentW - 6, 35, [0.03, 0.10, 0.20], undefined);
    pdf.drawRect(pdf.margin + 3, pdf.height - pdf.margin - 40, contentW - 6, 2, [0.0, 0.70, 0.90], undefined);

    pdf.drawText(`MECHANICAL INSTALLATION CAD DETAIL: SCANNER ${sIdx + 1} — ${scanner.name.toUpperCase()}`, pdf.margin + 12, pdf.height - pdf.margin - 20, {
      font: 'F2',
      size: 11,
      color: [1, 1, 1]
    });
    pdf.drawText(`Orthographic Mounting Standoffs, Angular Aiming & Dimensional Callouts WRT Conveyor Datum`, pdf.margin + 12, pdf.height - pdf.margin - 32, {
      font: 'F1',
      size: 7.5,
      color: [0.70, 0.85, 1.00]
    });
    pdf.drawText(`SHEET ${sIdx + 2} OF ${scanners.length + 1} · ${sheetNo}`, pdf.margin + contentW - 12, pdf.height - pdf.margin - 20, {
      font: 'F4',
      size: 8.5,
      color: [0.30, 0.85, 1.00],
      align: 'right'
    });

    const aimInfo = calculateAimPoint(scanner, conveyor);
    const aff = conveyor.height + scanner.position.y;
    const railClearance = Math.abs(scanner.position.z) - halfBeltW;

    // Split drawing area into two large CAD panels:
    // PANEL 1: FRONT ELEVATION VIEW (Z-Y Cross Section)
    // PANEL 2: SIDE ELEVATION VIEW (X-Y Flow Section)
    const viewTopY = pdf.height - pdf.margin - 50;
    const panelH = 340;
    const panelW = (contentW - 14) / 2; // ~254 pt each
    const panel1X = pdf.margin + 5;
    const panel2X = panel1X + panelW + 4;
    const panelY = viewTopY - panelH;

    // -----------------------------------------------------------------------
    // CAD VIEW 1: FRONT ELEVATION (Z-Y CROSS SECTION)
    // -----------------------------------------------------------------------
    pdf.drawRect(panel1X, panelY, panelW, panelH, [0.985, 0.99, 1.0], [0.75, 0.82, 0.90], 0.8);
    // Gridlines
    for (let gx = panel1X + 20; gx < panel1X + panelW; gx += 20) {
      pdf.drawLine(gx, panelY, gx, panelY + panelH, [0.94, 0.96, 0.98], 0.35);
    }
    for (let gy = panelY + 20; gy < panelY + panelH; gy += 20) {
      pdf.drawLine(panel1X, gy, panel1X + panelW, gy, [0.94, 0.96, 0.98], 0.35);
    }

    pdf.drawText('VIEW A: FRONT ELEVATION (Z-Y CROSS SECTION)', panel1X + 8, panelY + panelH - 14, { font: 'F2', size: 7.5, color: [0.15, 0.25, 0.45] });
    pdf.drawText('LOOKING DOWNSTREAM IN FLOW DIRECTION (+X)', panel1X + 8, panelY + panelH - 24, { font: 'F1', size: 6, color: [0.4, 0.45, 0.55] });

    // Front Elevation Geometry
    const fOriginX = panel1X + panelW / 2;
    const fOriginY = panelY + 110; // Conveyor Belt surface (Y=0)
    const fScale = 90; // 1 meter = 90 pt

    const fFloorY = fOriginY - conveyor.height * fScale;
    pdf.drawGroundHatch(panel1X + 10, panel1X + panelW - 10, fFloorY, 5);
    pdf.drawText('FLOOR DATUM', panel1X + 12, fFloorY + 3, { font: 'F3', size: 5.5, color: [0.35, 0.4, 0.45] });

    // Centerline
    pdf.drawCenterline(fOriginX, fFloorY - 4, fOriginX, panelY + panelH - 30);
    pdf.drawText('CL', fOriginX + 2, panelY + panelH - 35, { font: 'F2', size: 6, color: [0.75, 0.25, 0.2] });

    // Conveyor Bed
    const fHalfBW = (conveyor.width / 2) * fScale;
    pdf.drawRect(fOriginX - fHalfBW, fOriginY - 3, fHalfBW * 2, 3, [0.0, 0.52, 0.24], [0.0, 0.4, 0.18], 0.8);
    pdf.drawRect(fOriginX - fHalfBW, fOriginY - 12, fHalfBW * 2, 9, [0.82, 0.85, 0.88], [0.6, 0.65, 0.7], 0.6);
    // Rails
    const fRailH = conveyor.sideRailHeight * fScale;
    pdf.drawRect(fOriginX - fHalfBW - 2.5, fOriginY - 12, 2.5, 12 + fRailH, [0.95, 0.75, 0.1], undefined);
    pdf.drawRect(fOriginX + fHalfBW, fOriginY - 12, 2.5, 12 + fRailH, [0.95, 0.75, 0.1], undefined);
    // Legs
    pdf.drawRect(fOriginX - fHalfBW * 0.75 - 2.5, fFloorY, 5, fOriginY - 12 - fFloorY, [0.2, 0.25, 0.3], undefined);
    pdf.drawRect(fOriginX + fHalfBW * 0.75 - 2.5, fFloorY, 5, fOriginY - 12 - fFloorY, [0.2, 0.25, 0.3], undefined);

    // Gantry Frame
    const fPortalHW = fHalfBW + 0.35 * fScale;
    const fBeamY = fOriginY + (Math.max(scanner.position.y, 1.1) + 0.18) * fScale;
    pdf.drawRect(fOriginX - fPortalHW - 4, fFloorY, 8, fBeamY - fFloorY, [0.45, 0.5, 0.55], [0.3, 0.35, 0.4], 0.7);
    pdf.drawRect(fOriginX + fPortalHW - 4, fFloorY, 8, fBeamY - fFloorY, [0.45, 0.5, 0.55], [0.3, 0.35, 0.4], 0.7);
    pdf.drawRect(fOriginX - fPortalHW - 6, fBeamY, (fPortalHW + 6) * 2, 8, [0.45, 0.5, 0.55], [0.3, 0.35, 0.4], 0.7);

    // Scanner
    const fScX = fOriginX + scanner.position.z * fScale;
    const fScY = fOriginY + scanner.position.y * fScale;

    // Bracket
    if (scanner.position.y > 0.8) {
      pdf.drawLine(fScX, fBeamY, fScX, fScY + 7, [0.25, 0.3, 0.35], 2.2);
    } else if (scanner.position.z > 0) {
      pdf.drawLine(fOriginX + fPortalHW - 4, fScY, fScX + 8, fScY, [0.25, 0.3, 0.35], 2.2);
    } else {
      pdf.drawLine(fOriginX - fPortalHW + 4, fScY, fScX - 8, fScY, [0.25, 0.3, 0.35], 2.2);
    }

    // Scanner Camera Box
    pdf.drawRect(fScX - 7, fScY - 5, 14, 10, [0.03, 0.55, 0.8], [0.05, 0.25, 0.45], 0.8);
    pdf.drawRect(fScX - 3.5, fScY - 7, 7, 2, [0.1, 0.15, 0.2], undefined); // Lens
    // Boresight ray to belt
    pdf.drawDashedLine(fScX, fScY - 6, fOriginX, fOriginY, [0.0, 0.65, 0.8], 0.8);

    // Front Elevation DIMENSIONS:
    // 1. Height Above Belt (ΔY)
    const dimYOffset = panel1X + panelW - 35;
    pdf.drawDimension(dimYOffset, fOriginY, dimYOffset, fScY, `ΔY = ${fmtLen(scanner.position.y)}`, {
      color: [0.05, 0.5, 0.25],
      extLine1: { fromX: fOriginX + fHalfBW + 3, fromY: fOriginY },
      extLine2: { fromX: fScX + 8, fromY: fScY },
      fontSize: 6.5
    });

    // 2. Height Above Finished Floor (AFF)
    const dimAffOffset = panel1X + panelW - 14;
    pdf.drawDimension(dimAffOffset, fFloorY, dimAffOffset, fScY, `AFF = ${fmtLen(aff)}`, {
      color: [0.1, 0.25, 0.55],
      extLine1: { fromX: panel1X + panelW - 25, fromY: fFloorY },
      extLine2: { fromX: dimYOffset + 4, fromY: fScY },
      fontSize: 6.5
    });

    // 3. Centerline Offset (ΔZ)
    if (Math.abs(scanner.position.z) > 0.02) {
      pdf.drawDimension(fOriginX, fScY + 14, fScX, fScY + 14, `ΔZ = ${fmtLen(Math.abs(scanner.position.z))}`, {
        color: [0.75, 0.25, 0.2],
        extLine1: { fromX: fOriginX, fromY: fScY + 3 },
        extLine2: { fromX: fScX, fromY: fScY + 6 },
        fontSize: 6.5
      });
    }

    // 4. Belt Width
    pdf.drawDimension(fOriginX - fHalfBW, fOriginY - 24, fOriginX + fHalfBW, fOriginY - 24, `W = ${fmtLen(conveyor.width)}`, {
      color: [0.2, 0.3, 0.4],
      extLine1: { fromX: fOriginX - fHalfBW, fromY: fOriginY - 4 },
      extLine2: { fromX: fOriginX + fHalfBW, fromY: fOriginY - 4 },
      fontSize: 6
    });

    // Roll angle callout
    pdf.drawText(`ROLL: ${scanner.rotation.roll}°`, fScX + 10, fScY + 2, { font: 'F4', size: 6.5, color: [0.4, 0.2, 0.6] });

    // -----------------------------------------------------------------------
    // CAD VIEW 2: SIDE ELEVATION (X-Y FLOW SECTION)
    // -----------------------------------------------------------------------
    pdf.drawRect(panel2X, panelY, panelW, panelH, [0.985, 0.99, 1.0], [0.75, 0.82, 0.90], 0.8);
    for (let gx = panel2X + 20; gx < panel2X + panelW; gx += 20) {
      pdf.drawLine(gx, panelY, gx, panelY + panelH, [0.94, 0.96, 0.98], 0.35);
    }
    for (let gy = panelY + 20; gy < panelY + panelH; gy += 20) {
      pdf.drawLine(panel2X, gy, panel2X + panelW, gy, [0.94, 0.96, 0.98], 0.35);
    }

    pdf.drawText('VIEW B: SIDE ELEVATION (X-Y LONGITUDINAL FLOW)', panel2X + 8, panelY + panelH - 14, { font: 'F2', size: 7.5, color: [0.15, 0.25, 0.45] });
    pdf.drawText('LOOKING FROM SIDE ACROSS CONVEYOR BELT', panel2X + 8, panelY + panelH - 24, { font: 'F1', size: 6, color: [0.4, 0.45, 0.55] });

    const sOriginX = panel2X + panelW / 2;
    const sOriginY = panelY + 110;
    const sScale = 90;

    const sFloorY = sOriginY - conveyor.height * sScale;
    pdf.drawGroundHatch(panel2X + 10, panel2X + panelW - 10, sFloorY, 5);
    pdf.drawText('FLOOR DATUM', panel2X + 12, sFloorY + 3, { font: 'F3', size: 5.5, color: [0.35, 0.4, 0.45] });

    // Gantry Centerline (X=0)
    pdf.drawCenterline(sOriginX, sFloorY - 4, sOriginX, panelY + panelH - 30);
    pdf.drawText('GANTRY CL (X=0)', sOriginX + 2, panelY + panelH - 35, { font: 'F2', size: 6, color: [0.75, 0.25, 0.2] });

    // Conveyor Bed Profile along Flow (spanning ~2m of length)
    const bedHalfLen = 1.1 * sScale;
    pdf.drawRect(sOriginX - bedHalfLen, sOriginY - 3, bedHalfLen * 2, 3, [0.0, 0.52, 0.24], [0.0, 0.4, 0.18], 0.8);
    pdf.drawRect(sOriginX - bedHalfLen, sOriginY - 12, bedHalfLen * 2, 9, [0.82, 0.85, 0.88], [0.6, 0.65, 0.7], 0.6);

    // Travel Direction Arrow on belt
    pdf.drawText('---> CONVEYOR FLOW (+X) --->', sOriginX - 45, sOriginY - 9, { font: 'F2', size: 5.5, color: [0.15, 0.35, 0.2] });

    // Gantry Upright at X=0
    const sBeamY = sOriginY + (Math.max(scanner.position.y, 1.1) + 0.18) * sScale;
    pdf.drawRect(sOriginX - 4, sFloorY, 8, sBeamY - sFloorY, [0.45, 0.5, 0.55], [0.3, 0.35, 0.4], 0.7);

    // Scanner along X
    const sScX = sOriginX + scanner.position.x * sScale;
    const sScY = sOriginY + scanner.position.y * sScale;

    // Horizontal bracket extension from gantry post if X != 0
    pdf.drawLine(sOriginX, sScY + 2, sScX, sScY + 2, [0.25, 0.3, 0.35], 2.2);

    // Scanner Camera Box
    pdf.drawRect(sScX - 7, sScY - 5, 14, 10, [0.03, 0.55, 0.8], [0.05, 0.25, 0.45], 0.8);
    // Optical Sightline Ray to Aim Point
    const sAimX = sOriginX + aimInfo.aimX * sScale;
    pdf.drawDashedLine(sScX, sScY - 5, sAimX, sOriginY, [0.0, 0.65, 0.8], 0.8);
    // Aim Target symbol on belt
    pdf.drawRect(sAimX - 3, sOriginY - 1, 6, 2, [0.8, 0.1, 0.1], undefined);

    // Side Elevation DIMENSIONS:
    // 1. Longitudinal Offset (ΔX)
    if (Math.abs(scanner.position.x) > 0.01) {
      pdf.drawDimension(sOriginX, sScY + 16, sScX, sScY + 16, `ΔX = ${fmtLen(scanner.position.x)}`, {
        color: [0.05, 0.35, 0.7],
        extLine1: { fromX: sOriginX, fromY: sScY + 3 },
        extLine2: { fromX: sScX, fromY: sScY + 5 },
        fontSize: 6.5
      });
    }

    // 2. Optical Working Distance Dimension along sightline
    pdf.drawDimension(sScX - 4, sScY - 4, sAimX - 4, sOriginY + 4, `WD = ${fmtLen(aimInfo.workingDist)}`, {
      color: [0.03, 0.45, 0.65],
      fontSize: 6
    });

    // Pitch Angle Callout
    pdf.drawText(`PITCH: ${scanner.rotation.pitch}°`, sScX + 9, sScY - 2, { font: 'F4', size: 6.5, color: [0.7, 0.3, 0.05] });

    // Aim point callout
    pdf.drawText(`AIM: X=${fmtLen(aimInfo.aimX)}`, sAimX - 15, sOriginY + 8, { font: 'F3', size: 5.5, color: [0.8, 0.1, 0.1] });

    // -----------------------------------------------------------------------
    // LOWER SECTION: MECHANICAL SPECS TABLE & CAD TITLE BLOCK
    // -----------------------------------------------------------------------
    const lowerY = panelY - 150;
    const lowerH = 142;

    // Left Panel: Mechanical Installation Dimensional Checklist Table
    const specsW = contentW - 190;
    pdf.drawRect(panel1X, lowerY, specsW, lowerH, [0.97, 0.985, 0.99], [0.78, 0.84, 0.90], 0.8);

    pdf.drawRect(panel1X, lowerY + lowerH - 16, specsW, 16, [0.1, 0.2, 0.35], undefined);
    pdf.drawText(`MECHANICAL INSTALLATION SPECIFICATIONS & MOUNTING CHECKLIST`, panel1X + 8, lowerY + lowerH - 11, {
      font: 'F2',
      size: 7.5,
      color: [1, 1, 1]
    });

    const mRows = [
      { param: '1. Vertical Elevation Above Belt (Y Datum)', val: fmtLen(scanner.position.y), note: 'Belt surface reference datum (Y = 0.00)' },
      { param: '2. Total Finished Floor Height (AFF)', val: fmtLen(aff), note: 'From finished warehouse concrete floor' },
      { param: '3. Lateral Offset from Centerline (Z)', val: `${fmtLen(scanner.position.z)} (${scanner.position.z > 0 ? 'Left +Z' : scanner.position.z < 0 ? 'Right -Z' : 'Center'})`, note: 'Measured from conveyor belt centerline' },
      { param: '4. Clear Standoff to Belt Edge', val: railClearance > 0 ? `+${fmtLen(railClearance)} (outside rail)` : `${fmtLen(Math.abs(railClearance))} (overhang inside)`, note: `Conveyor half-width = ±${fmtLen(halfBeltW)}` },
      { param: '5. Longitudinal Flow Position (X)', val: `${fmtLen(scanner.position.x)} (${scanner.position.x >= 0 ? 'Downstream' : 'Upstream'})`, note: 'Offset from gantry portal center plane' },
      { param: '6. Mounting Orientation Angles', val: `Pitch: ${scanner.rotation.pitch}° | Roll: ${scanner.rotation.roll}° | Yaw: ${scanner.rotation.yaw}°`, note: 'Torque bracket bolts to 25 Nm' },
      { param: '7. Optical Boresight Aim on Belt', val: `X = ${fmtLen(aimInfo.aimX)}, Z = ${fmtLen(aimInfo.aimZ)}`, note: `Target Working Distance = ${fmtLen(aimInfo.workingDist)}` },
      { param: '8. Depth of Field (Focus Window)', val: `${fmtLen(scanner.optical.dofNear)} to ${fmtLen(scanner.optical.dofFar)} (ΔDOF: ${fmtLen(scanner.optical.dofFar - scanner.optical.dofNear)})`, note: `Lens: ${scanner.optical.focalLengthMm}mm (${scanner.optical.resolution})` }
    ];

    let rowCurY = lowerY + lowerH - 28;
    for (const r of mRows) {
      pdf.drawText(r.param, panel1X + 8, rowCurY, { font: 'F2', size: 6.5, color: [0.15, 0.2, 0.3] });
      pdf.drawText(r.val, panel1X + 160, rowCurY, { font: 'F4', size: 6.5, color: [0.05, 0.40, 0.70] });
      pdf.drawText(r.note, panel1X + 250, rowCurY, { font: 'F1', size: 6, color: [0.45, 0.5, 0.55] });
      rowCurY -= 14;
    }

    // Right Panel: Official CAD Engineering Title Block
    const titleBlockX = panel1X + specsW + 4;
    const titleBlockW = contentW - specsW - 14;
    drawCadTitleBlock(
      pdf,
      titleBlockX,
      lowerY,
      titleBlockW,
      lowerH,
      `${scanner.name.toUpperCase()}\nMOUNTING CAD DETAIL`,
      sheetNo,
      dateStr,
      dim
    );
  });

  const bytes = pdf.buildPdf();
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

/**
 * Triggers an immediate browser download of the generated PDF file
 */
export function downloadMountingReportPdf(options: {
  conveyor: ConveyorConfig;
  scanners: Scanner[];
  units: UnitConfig;
}): void {
  const blob = generateMountingReportPdf(options);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  link.download = `Scanner_Mounting_CAD_Drawing_Report_${timestamp}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 5000);
}
