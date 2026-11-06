import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Radar,
  ChevronDown,
  ChevronUp,
  History,
  RotateCcw,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useSimulator } from '../../context/SimulatorContext';

export const TelemetryDashboard: React.FC = () => {
  const { telemetry, resetTelemetry, motion, conveyor, carton, tyre, partType } = useSimulator();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const isReading = telemetry.activeHits.length > 0;
  const isFail = telemetry.readState === 'FAIL' || (telemetry.currentPassResult === 'FAIL' && !isReading);
  const isPass = telemetry.currentPassResult === 'PASS';

  // Status banner configuration
  let statusBg = 'bg-slate-900/90 border-slate-700/60 text-slate-300';
  let statusText = 'SEARCHING FOR BARCODE...';
  let statusIcon = <Radar className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />;

  if (isReading) {
    statusBg = 'bg-emerald-950/90 border-emerald-500/80 text-emerald-200 glow-emerald';
    statusText = 'BARCODE READ COMPLETED';
    statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />;
  } else if (isFail) {
    statusBg = 'bg-rose-950/95 border-rose-500/90 text-rose-200 glow-rose animate-pulse';
    statusText = 'FAIL: CRITICAL BLIND SPOT DETECTED';
    statusIcon = <XCircle className="w-4 h-4 text-rose-400" />;
  } else if (isPass) {
    statusBg = 'bg-emerald-950/80 border-emerald-600/70 text-emerald-200';
    statusText = 'PASS: READ VERIFIED ON PASS';
    statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  }

  return (
    <div className="absolute bottom-4 right-4 z-30 w-80 md:w-96 flex flex-col gap-2 pointer-events-auto">
      {/* Real-time Visual Status Ring / Banner */}
      <div
        className={`px-3.5 py-2.5 rounded-xl border backdrop-blur-md shadow-2xl flex items-center justify-between transition-all duration-200 ${statusBg}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex-shrink-0">{statusIcon}</div>
          <div className="min-w-0">
            <div className="font-mono text-xs font-extrabold tracking-wider truncate">
              {statusText}
            </div>
            {isReading && telemetry.activeHits[0] && (
              <div className="text-[10px] text-emerald-300/80 font-mono truncate">
                Hit via {telemetry.activeHits[0].scannerName} @ {telemetry.activeHits[0].distance.toFixed(2)}m (Incidence {telemetry.activeHits[0].incidenceAngleDeg.toFixed(0)}°)
              </div>
            )}
            {isFail && (
              <div className="text-[10px] text-rose-300/90 font-mono">
                {partType === 'carton'
                  ? `Carton cleared conveyor with 0 valid scan frames on face(s) [${carton.barcodeFaces.join(', ') || 'none'}]`
                  : `Tyre cleared conveyor with 0 valid scan frames on [${tyre.barcodeLocation} @ ${tyre.radialAngleDeg}°]`}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800/50 transition-colors"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Telemetry Stats Card */}
      {isExpanded && (
        <div className="bg-industrial-900/90 backdrop-blur-md rounded-xl border border-slate-700/60 shadow-2xl p-3 text-xs font-mono text-slate-200 space-y-3">
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-100">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>TELEMETRY DASHBOARD</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHistory(!showHistory)}
                title="View Pass History Log"
                className={`p-1 rounded text-slate-400 hover:text-cyan-300 transition-colors ${
                  showHistory ? 'text-cyan-400 bg-slate-800' : ''
                }`}
              >
                <History className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={resetTelemetry}
                title="Reset Telemetry Stats"
                className="p-1 rounded text-slate-400 hover:text-cyan-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3 Core Metric Tiles */}
          <div className="grid grid-cols-3 gap-2">
            {/* 1. Total Coverage Percentage */}
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div className="text-[10px] text-slate-400 font-sans font-medium">Coverage Rate</div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-xl font-black text-cyan-300">
                  {telemetry.coveragePercentage}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-400 h-full transition-all duration-150"
                  style={{ width: `${telemetry.coveragePercentage}%` }}
                />
              </div>
            </div>

            {/* 2. Blind Spots Flagged */}
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div className="text-[10px] text-slate-400 font-sans font-medium">Blind Frames</div>
              <div className="flex items-baseline gap-1 my-1">
                <span className={`text-xl font-black ${telemetry.blindSpotsCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {telemetry.blindSpotsCount}
                </span>
                <span className="text-[10px] text-slate-500">pts</span>
              </div>
              <div className="text-[9px] text-slate-400 truncate">
                {telemetry.blindSpotsCount > 0 ? 'Exposed Zone' : 'Fully Covered'}
              </div>
            </div>

            {/* 3. Pass/Fail Indicator */}
            <div
              className={`p-2.5 rounded-lg border flex flex-col justify-between transition-colors ${
                telemetry.currentPassResult === 'PASS'
                  ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                  : telemetry.currentPassResult === 'FAIL'
                  ? 'bg-rose-950/50 border-rose-700/60 text-rose-300'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-[10px] font-sans font-medium">Pass / Fail</div>
              <div className="flex items-center gap-1.5 my-1">
                {telemetry.currentPassResult === 'PASS' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {telemetry.currentPassResult === 'FAIL' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
                {telemetry.currentPassResult === 'PENDING' && <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />}
                <span className="text-sm font-extrabold">
                  {telemetry.currentPassResult}
                </span>
              </div>
              <div className="text-[9px] text-slate-400">
                {motion.isPlaying ? 'Transit Active' : 'Stationary'}
              </div>
            </div>
          </div>

          {/* Active Reading Scanners Breakdown */}
          {telemetry.activeHits.length > 0 && (
            <div className="bg-slate-950/60 p-2 rounded-lg border border-emerald-900/50 space-y-1">
              <div className="text-[10px] font-semibold text-emerald-400 flex items-center justify-between">
                <span>CONCURRENT ACTIVE READS ({telemetry.activeHits.length})</span>
                <span className="animate-ping w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              {telemetry.activeHits.map((hit, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] text-slate-300">
                  <span className="truncate max-w-[140px]">{hit.scannerName}</span>
                  <span className="text-cyan-300 font-mono">
                    {hit.distance.toFixed(2)}m · {hit.incidenceAngleDeg.toFixed(0)}°
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Pass History Table */}
          {showHistory && (
            <div className="space-y-1.5 pt-1 border-t border-slate-800">
              <div className="text-[10px] font-semibold text-slate-400 flex justify-between">
                <span>RECENT MOTION RUN LOG</span>
                <span>{telemetry.history.length} passes</span>
              </div>
              {telemetry.history.length === 0 ? (
                <div className="text-[10px] text-slate-500 py-1 text-center">
                  No completed motion cycles yet.
                </div>
              ) : (
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                  {telemetry.history.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-1.5 rounded bg-slate-950/80 border border-slate-800 text-[10px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1 py-0.2 rounded font-bold ${
                            h.result === 'PASS'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {h.result}
                        </span>
                        <span className="text-slate-400 capitalize">{h.partType || 'carton'}: {h.target}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 font-mono">
                        <span>{h.coveragePct}% cov</span>
                        <span>{h.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
