import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  Compass,
  Ruler,
  Layers,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { ConveyorConfig, Scanner, UnitConfig } from '../../types';
import { toDisplayLength, toDisplaySpeed } from '../../utils/units';
import { calculateAimPoint, getScannerLocationType, downloadMountingReportPdf } from '../../utils/pdfReport';

interface CadReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  conveyor: ConveyorConfig;
  scanners: Scanner[];
  units: UnitConfig;
}

export const CadReportModal: React.FC<CadReportModalProps> = ({
  isOpen,
  onClose,
  conveyor,
  scanners,
  units
}) => {
  const [activeScannerIdx, setActiveScannerIdx] = useState(0);

  if (!isOpen || scanners.length === 0) return null;

  const currentScanner = scanners[activeScannerIdx] || scanners[0];
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

  const aimInfo = calculateAimPoint(currentScanner, conveyor);
  const aff = conveyor.height + currentScanner.position.y;
  const halfBeltW = conveyor.width / 2;
  const railClearance = Math.abs(currentScanner.position.z) - halfBeltW;
  const locType = getScannerLocationType(currentScanner, conveyor);

  // SVG CAD Scaling parameters
  // SVG Canvas: 560 x 320 for Front Elevation, 560 x 320 for Side Elevation
  const svgW = 560;
  const svgH = 310;
  const frontOriginX = svgW / 2;
  const frontOriginY = 195; // Conveyor Belt surface (Y=0)
  const scale = 115; // 1 meter = 115 px

  const floorY = frontOriginY + conveyor.height * scale;
  const scFrontX = frontOriginX + currentScanner.position.z * scale;
  const scFrontY = frontOriginY - currentScanner.position.y * scale;

  const halfBW = (conveyor.width / 2) * scale;
  const portalHW = halfBW + 0.35 * scale;
  const beamY = frontOriginY - (Math.max(currentScanner.position.y, 1.1) + 0.18) * scale;

  // Side Elevation
  const sideOriginX = svgW / 2;
  const sideOriginY = 195;
  const sideFloorY = sideOriginY + conveyor.height * scale;
  const scSideX = sideOriginX + currentScanner.position.x * scale;
  const scSideY = sideOriginY - currentScanner.position.y * scale;
  const aimSideX = sideOriginX + aimInfo.aimX * scale;

  const handleDownloadPdf = () => {
    downloadMountingReportPdf({ conveyor, scanners, units });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100 font-sans">
        {/* Modal Top Header Bar */}
        <div className="px-5 py-3.5 bg-industrial-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100 tracking-wide font-mono uppercase">
                  Mechanical Installation CAD Drawings
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold">
                  INTEGRATOR BLUEPRINT
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Orthographic dimensional drawings of each scanner mounting setup with respect to conveyor datum
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-950/50 border border-cyan-400/30 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-cyan-100" />
              <span>Download PDF Report</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scanner Navigation Tabs */}
        <div className="px-5 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between overflow-x-auto gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-400 font-bold mr-1">SCANNER SHEETS:</span>
            {scanners.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setActiveScannerIdx(idx)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all border flex items-center gap-1.5 ${
                  activeScannerIdx === idx
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/70 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span>{`DWG-${(idx + 1).toString().padStart(2, '0')}:`}</span>
                <span>{s.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveScannerIdx((prev) => Math.max(0, prev - 1))}
              disabled={activeScannerIdx === 0}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400 px-1">
              {activeScannerIdx + 1} / {scanners.length}
            </span>
            <button
              onClick={() => setActiveScannerIdx((prev) => Math.min(scanners.length - 1, prev + 1))}
              disabled={activeScannerIdx === scanners.length - 1}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Active Scanner Subtitle & Quick Specs */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-extrabold text-cyan-400">
                  {`SHEET DWG-MNT-${(activeScannerIdx + 1).toString().padStart(2, '0')}:`}
                </span>
                <span className="text-xs font-bold text-slate-100">{currentScanner.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-semibold border border-emerald-500/30">
                  {locType}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Model: {currentScanner.optical.scannerModel} ({currentScanner.optical.focalLengthMm}mm lens · {currentScanner.optical.resolution})
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right">
                <div className="text-slate-400 text-[10px]">BELT ELEVATION (ΔY)</div>
                <div className="text-emerald-400 font-bold">{fmtLen(currentScanner.position.y)}</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 text-[10px]">FLOOR HEIGHT (AFF)</div>
                <div className="text-cyan-400 font-bold">{fmtLen(aff)}</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 text-[10px]">CENTERLINE (ΔZ)</div>
                <div className="text-amber-400 font-bold">{fmtLen(currentScanner.position.z)}</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 text-[10px]">FLOW OFFSET (ΔX)</div>
                <div className="text-blue-400 font-bold">{fmtLen(currentScanner.position.x)}</div>
              </div>
            </div>
          </div>

          {/* TWO ORTHOGRAPHIC CAD PROJECTIONS: FRONT & SIDE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ---------------- VIEW A: FRONT ELEVATION ---------------- */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  VIEW A: FRONT ELEVATION (Z-Y CROSS SECTION)
                </span>
                <span className="text-[10px] font-mono text-slate-400">LOOKING DOWNSTREAM (+X)</span>
              </div>

              {/* SVG CAD Drawing */}
              <div className="relative bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center">
                <svg
                  viewBox={`0 0 ${svgW} ${svgH}`}
                  className="w-full h-auto select-none font-mono"
                  style={{ minHeight: '280px' }}
                >
                  <defs>
                    <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                    </pattern>
                    <marker id="arrowCAD" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#38bdf8" />
                    </marker>
                    <marker id="arrowGreen" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#10b981" />
                    </marker>
                  </defs>

                  {/* Grid background */}
                  <rect width={svgW} height={svgH} fill="url(#gridPattern)" />

                  {/* Floor Datum Line & Hash */}
                  <line x1="20" y1={floorY} x2={svgW - 20} y2={floorY} stroke="#64748b" strokeWidth="2" />
                  {Array.from({ length: 45 }, (_, i) => 25 + i * 12).map((gx) => (
                    <line key={gx} x1={gx} y1={floorY} x2={gx - 8} y2={floorY + 7} stroke="#475569" strokeWidth="1" />
                  ))}
                  <text x="25" y={floorY - 6} fill="#94a3b8" fontSize="10" fontWeight="bold">
                    FINISHED FLOOR DATUM (Y = -{fmtLen(conveyor.height)})
                  </text>

                  {/* Conveyor Centerline CL */}
                  <line x1={frontOriginX} y1="20" x2={frontOriginX} y2={floorY + 10} stroke="#ef4444" strokeWidth="1.2" strokeDasharray="8 3 2 3" />
                  <text x={frontOriginX + 5} y="32" fill="#ef4444" fontSize="10" fontWeight="bold">
                    CL (BELT CENTERLINE)
                  </text>

                  {/* Gantry Frame */}
                  <rect x={frontOriginX - portalHW - 6} y={beamY} width="12" height={floorY - beamY} fill="#475569" stroke="#334155" strokeWidth="1" />
                  <rect x={frontOriginX + portalHW - 6} y={beamY} width="12" height={floorY - beamY} fill="#475569" stroke="#334155" strokeWidth="1" />
                  <rect x={frontOriginX - portalHW - 8} y={beamY - 10} width={(portalHW + 8) * 2} height="12" fill="#475569" stroke="#334155" strokeWidth="1" />

                  {/* Conveyor Bed Cross Section */}
                  {/* Green belt surface */}
                  <rect x={frontOriginX - halfBW} y={frontOriginY - 4} width={halfBW * 2} height="4" fill="#00843D" stroke="#00602c" strokeWidth="1" />
                  {/* Slider bed frame */}
                  <rect x={frontOriginX - halfBW} y={frontOriginY} width={halfBW * 2} height="14" fill="#64748b" stroke="#475569" strokeWidth="1" />
                  {/* Side rails */}
                  <rect x={frontOriginX - halfBW - 4} y={frontOriginY - 14} width="4" height="28" fill="#eab308" />
                  <rect x={frontOriginX + halfBW} y={frontOriginY - 14} width="4" height="28" fill="#eab308" />
                  {/* Conveyor legs */}
                  <rect x={frontOriginX - halfBW * 0.75 - 4} y={frontOriginY + 14} width="8" height={floorY - frontOriginY - 14} fill="#334155" />
                  <rect x={frontOriginX + halfBW * 0.75 - 4} y={frontOriginY + 14} width="8" height={floorY - frontOriginY - 14} fill="#334155" />

                  {/* Scanner Mounting Bracket */}
                  {currentScanner.position.y > 0.8 ? (
                    <line x1={scFrontX} y1={beamY + 2} x2={scFrontX} y2={scFrontY - 10} stroke="#94a3b8" strokeWidth="3" />
                  ) : currentScanner.position.z > 0 ? (
                    <line x1={frontOriginX + portalHW - 6} y1={scFrontY} x2={scFrontX + 12} y2={scFrontY} stroke="#94a3b8" strokeWidth="3" />
                  ) : (
                    <line x1={frontOriginX - portalHW + 6} y1={scFrontY} x2={scFrontX - 12} y2={scFrontY} stroke="#94a3b8" strokeWidth="3" />
                  )}

                  {/* Scanner Housing */}
                  <rect x={scFrontX - 12} y={scFrontY - 9} width="24" height="18" rx="2" fill="#06b6d4" stroke="#0891b2" strokeWidth="1.5" />
                  <rect x={scFrontX - 6} y={scFrontY + 9} width="12" height="4" rx="1" fill="#0f172a" />

                  {/* Boresight Sightline */}
                  <line x1={scFrontX} y1={scFrontY + 13} x2={frontOriginX} y2={frontOriginY} stroke="#06b6d4" strokeWidth="1.2" strokeDasharray="4 2" />

                  {/* DIMENSION LINES */}
                  {/* 1. Height Above Belt (ΔY) */}
                  <line x1={svgW - 55} y1={frontOriginY} x2={svgW - 55} y2={scFrontY} stroke="#10b981" strokeWidth="1.2" markerStart="url(#arrowGreen)" markerEnd="url(#arrowGreen)" />
                  <line x1={frontOriginX + halfBW + 4} y1={frontOriginY} x2={svgW - 45} y2={frontOriginY} stroke="#10b981" strokeWidth="0.5" strokeDasharray="2 2" />
                  <line x1={scFrontX + 14} y1={scFrontY} x2={svgW - 45} y2={scFrontY} stroke="#10b981" strokeWidth="0.5" strokeDasharray="2 2" />
                  <rect x={svgW - 95} y={(frontOriginY + scFrontY) / 2 - 8} width="80" height="16" rx="3" fill="#022c22" stroke="#10b981" strokeWidth="0.8" />
                  <text x={svgW - 55} y={(frontOriginY + scFrontY) / 2 + 3} fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle">
                    ΔY = {fmtLen(currentScanner.position.y)}
                  </text>

                  {/* 2. Total Height (AFF) */}
                  <line x1={svgW - 20} y1={floorY} x2={svgW - 20} y2={scFrontY} stroke="#38bdf8" strokeWidth="1.2" markerStart="url(#arrowCAD)" markerEnd="url(#arrowCAD)" />
                  <line x1={frontOriginX + portalHW + 8} y1={floorY} x2={svgW - 10} y2={floorY} stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="2 2" />
                  <line x1={svgW - 45} y1={scFrontY} x2={svgW - 10} y2={scFrontY} stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="2 2" />
                  <text x={svgW - 16} y={(floorY + scFrontY) / 2} fill="#38bdf8" fontSize="9" fontWeight="bold" transform={`rotate(-90 ${svgW - 16} ${(floorY + scFrontY) / 2})`} textAnchor="middle">
                    AFF = {fmtLen(aff)}
                  </text>

                  {/* 3. Centerline Offset (ΔZ) */}
                  {Math.abs(currentScanner.position.z) > 0.02 && (
                    <>
                      <line x1={frontOriginX} y1={scFrontY - 24} x2={scFrontX} y2={scFrontY - 24} stroke="#f59e0b" strokeWidth="1.2" markerStart="url(#arrowCAD)" markerEnd="url(#arrowCAD)" />
                      <line x1={frontOriginX} y1={scFrontY - 32} x2={frontOriginX} y2={scFrontY - 16} stroke="#f59e0b" strokeWidth="0.5" />
                      <line x1={scFrontX} y1={scFrontY - 32} x2={scFrontX} y2={scFrontY - 11} stroke="#f59e0b" strokeWidth="0.5" />
                      <rect x={(frontOriginX + scFrontX) / 2 - 35} y={scFrontY - 32} width="70" height="15" rx="3" fill="#451a03" stroke="#f59e0b" strokeWidth="0.8" />
                      <text x={(frontOriginX + scFrontX) / 2} y={scFrontY - 21} fill="#fbbf24" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                        ΔZ = {fmtLen(Math.abs(currentScanner.position.z))}
                      </text>
                    </>
                  )}

                  {/* Belt Width Dimension */}
                  <line x1={frontOriginX - halfBW} y1={frontOriginY + 28} x2={frontOriginX + halfBW} y2={frontOriginY + 28} stroke="#94a3b8" strokeWidth="1.2" markerStart="url(#arrowCAD)" markerEnd="url(#arrowCAD)" />
                  <line x1={frontOriginX - halfBW} y1={frontOriginY + 14} x2={frontOriginX - halfBW} y2={frontOriginY + 34} stroke="#94a3b8" strokeWidth="0.5" />
                  <line x1={frontOriginX + halfBW} y1={frontOriginY + 14} x2={frontOriginX + halfBW} y2={frontOriginY + 34} stroke="#94a3b8" strokeWidth="0.5" />
                  <text x={frontOriginX} y={frontOriginY + 25} fill="#cbd5e1" fontSize="9" fontWeight="bold" textAnchor="middle">
                    BELT WIDTH = {fmtLen(conveyor.width)}
                  </text>
                </svg>
              </div>
            </div>

            {/* ---------------- VIEW B: SIDE ELEVATION ---------------- */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  VIEW B: SIDE ELEVATION (X-Y FLOW SECTION)
                </span>
                <span className="text-[10px] font-mono text-slate-400">LOOKING ACROSS CONVEYOR</span>
              </div>

              {/* SVG Side Drawing */}
              <div className="relative bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center">
                <svg
                  viewBox={`0 0 ${svgW} ${svgH}`}
                  className="w-full h-auto select-none font-mono"
                  style={{ minHeight: '280px' }}
                >
                  <rect width={svgW} height={svgH} fill="url(#gridPattern)" />

                  {/* Floor Datum */}
                  <line x1="20" y1={sideFloorY} x2={svgW - 20} y2={sideFloorY} stroke="#64748b" strokeWidth="2" />
                  {Array.from({ length: 45 }, (_, i) => 25 + i * 12).map((gx) => (
                    <line key={gx} x1={gx} y1={sideFloorY} x2={gx - 8} y2={sideFloorY + 7} stroke="#475569" strokeWidth="1" />
                  ))}
                  <text x="25" y={sideFloorY - 6} fill="#94a3b8" fontSize="10" fontWeight="bold">
                    FINISHED FLOOR DATUM
                  </text>

                  {/* Gantry Centerline X=0 */}
                  <line x1={sideOriginX} y1="20" x2={sideOriginX} y2={sideFloorY + 10} stroke="#ef4444" strokeWidth="1.2" strokeDasharray="8 3 2 3" />
                  <text x={sideOriginX + 5} y="32" fill="#ef4444" fontSize="10" fontWeight="bold">
                    GANTRY CL (X = 0)
                  </text>

                  {/* Conveyor Bed along flow */}
                  <rect x="50" y={sideOriginY - 4} width={svgW - 100} height="4" fill="#00843D" stroke="#00602c" strokeWidth="1" />
                  <rect x="50" y={sideOriginY} width={svgW - 100} height="14" fill="#64748b" stroke="#475569" strokeWidth="1" />
                  {/* Flow arrow on belt */}
                  <text x={sideOriginX - 70} y={sideOriginY + 10} fill="#f8fafc" fontSize="9" fontWeight="bold">
                    ---&gt; CONVEYOR FLOW (+X) ---&gt;
                  </text>

                  {/* Gantry Vertical Column at X=0 */}
                  <rect x={sideOriginX - 6} y={beamY} width="12" height={sideFloorY - beamY} fill="#475569" stroke="#334155" strokeWidth="1" />

                  {/* Scanner along X */}
                  <line x1={sideOriginX} y1={scSideY} x2={scSideX} y2={scSideY} stroke="#94a3b8" strokeWidth="3" />
                  <rect x={scSideX - 12} y={scSideY - 9} width="24" height="18" rx="2" fill="#06b6d4" stroke="#0891b2" strokeWidth="1.5" />
                  <rect x={scSideX - 6} y={scSideY + 9} width="12" height="4" rx="1" fill="#0f172a" />

                  {/* Sightline ray to Aim Point on Belt */}
                  <line x1={scSideX} y1={scSideY + 13} x2={aimSideX} y2={sideOriginY} stroke="#06b6d4" strokeWidth="1.2" strokeDasharray="4 2" />
                  {/* Aim target on belt */}
                  <circle cx={aimSideX} cy={sideOriginY} r="4" fill="#ef4444" />
                  <text x={aimSideX - 25} y={sideOriginY - 8} fill="#ef4444" fontSize="9" fontWeight="bold">
                    AIM (X={fmtLen(aimInfo.aimX)})
                  </text>

                  {/* Longitudinal Offset Dimension (ΔX) */}
                  {Math.abs(currentScanner.position.x) > 0.01 && (
                    <>
                      <line x1={sideOriginX} y1={scSideY - 24} x2={scSideX} y2={scSideY - 24} stroke="#38bdf8" strokeWidth="1.2" markerStart="url(#arrowCAD)" markerEnd="url(#arrowCAD)" />
                      <line x1={sideOriginX} y1={scSideY - 32} x2={sideOriginX} y2={scSideY - 14} stroke="#38bdf8" strokeWidth="0.5" />
                      <line x1={scSideX} y1={scSideY - 32} x2={scSideX} y2={scSideY - 11} stroke="#38bdf8" strokeWidth="0.5" />
                      <rect x={(sideOriginX + scSideX) / 2 - 35} y={scSideY - 32} width="70" height="15" rx="3" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="0.8" />
                      <text x={(sideOriginX + scSideX) / 2} y={scSideY - 21} fill="#7dd3fc" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                        ΔX = {fmtLen(currentScanner.position.x)}
                      </text>
                    </>
                  )}

                  {/* Optical Working Distance */}
                  <rect x={(scSideX + aimSideX) / 2 - 40} y={(scSideY + sideOriginY) / 2 - 7} width="80" height="15" rx="3" fill="#042f2e" stroke="#14b8a6" strokeWidth="0.8" />
                  <text x={(scSideX + aimSideX) / 2} y={(scSideY + sideOriginY) / 2 + 4} fill="#2dd4bf" fontSize="9" fontWeight="bold" textAnchor="middle">
                    WD = {fmtLen(aimInfo.workingDist)}
                  </text>

                  {/* Pitch angle note */}
                  <text x={scSideX + 16} y={scSideY} fill="#f59e0b" fontSize="10" fontWeight="bold">
                    PITCH: {currentScanner.rotation.pitch}°
                  </text>
                </svg>
              </div>
            </div>
          </div>

          {/* MECHANICAL INSTALLATION SPECIFICATIONS TABLE */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                <Ruler className="w-4 h-4 text-cyan-400" />
                MECHANICAL MOUNTING COORDINATES & TORQUE SPECIFICATION
              </span>
              <span className="text-[10px] font-mono text-slate-400">TOLERANCES: LINEAR ±2mm | ANGULAR ±0.5°</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px]">1. VERTICAL HEIGHT (Y)</span>
                <div className="text-emerald-400 font-bold text-sm">{fmtLen(currentScanner.position.y)}</div>
                <span className="text-slate-400 text-[9px]">Above Conveyor Belt Surface</span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px]">2. FLOOR ELEVATION (AFF)</span>
                <div className="text-cyan-400 font-bold text-sm">{fmtLen(aff)}</div>
                <span className="text-slate-400 text-[9px]">Height Above Finished Floor</span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px]">3. LATERAL OFFSET (Z)</span>
                <div className="text-amber-400 font-bold text-sm">
                  {fmtLen(currentScanner.position.z)} ({currentScanner.position.z > 0 ? 'Left' : currentScanner.position.z < 0 ? 'Right' : 'Center'})
                </div>
                <span className="text-slate-400 text-[9px]">Standoff: {railClearance > 0 ? `+${fmtLen(railClearance)} out` : `${fmtLen(Math.abs(railClearance))} in`}</span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px]">4. FLOW OFFSET (X)</span>
                <div className="text-blue-400 font-bold text-sm">{fmtLen(currentScanner.position.x)}</div>
                <span className="text-slate-400 text-[9px]">From Gantry Portal Centerline</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono pt-1">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-[11px]">
                <span className="text-slate-400 block text-[10px]">MOUNTING ANGLES:</span>
                <span className="text-purple-300 font-bold">
                  Pitch: {currentScanner.rotation.pitch}° · Roll: {currentScanner.rotation.roll}° · Yaw: {currentScanner.rotation.yaw}°
                </span>
              </div>

              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-[11px]">
                <span className="text-slate-400 block text-[10px]">OPTICAL FOCUS (DOF):</span>
                <span className="text-cyan-300 font-bold">
                  {fmtLen(currentScanner.optical.dofNear)} to {fmtLen(currentScanner.optical.dofFar)} (ΔDOF: {fmtLen(currentScanner.optical.dofFar - currentScanner.optical.dofNear)})
                </span>
              </div>

              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-[11px]">
                <span className="text-slate-400 block text-[10px]">BRACKET & FASTENERS:</span>
                <span className="text-emerald-300 font-bold">
                  45×45mm Aluminum Profile · M8 T-Bolts @ 25 Nm
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-industrial-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="text-slate-400">
            Datum: WCS Conveyor Centerline [0,0,0] · Active Units: [{dim}, {spd}]
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold flex items-center gap-2 shadow-md shadow-cyan-950/40 border border-cyan-400/40 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Full CAD Report PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
