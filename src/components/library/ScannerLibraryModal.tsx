import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Copy,
  Edit3,
  Check,
  Calculator,
  Compass,
  Layers,
  BookOpen,
  ArrowRight,
  Info
} from 'lucide-react';
import { useSimulator } from '../../context/SimulatorContext';
import { ScannerLibraryPreset, DimensionUnit, OpticalTwoPointCalibration } from '../../types';
import { NumberSliderInput } from '../common/NumberSliderInput';
import { toDisplayLength, fromDisplayLength } from '../../utils/units';
import { calculateFovFromTwoDistancePoints } from '../../utils/math3d';

export const ScannerLibraryModal: React.FC = () => {
  const {
    isScannerLibraryOpen,
    setIsScannerLibraryOpen,
    scannerLibrary,
    addScannerPreset,
    updateScannerPreset,
    deleteScannerPreset,
    applyScannerPreset,
    scanners,
    units
  } = useSimulator();

  const dimUnit: DimensionUnit = units.dimension;

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [fovMode, setFovMode] = useState<'angles' | 'twopoint'>('angles');

  // Direct Angle Specs
  const [hFov, setHFov] = useState<number>(58);
  const [vFov, setVFov] = useState<number>(44);
  const [dofNear, setDofNear] = useState<number>(0.25); // in meters
  const [dofFar, setDofFar] = useState<number>(1.50); // in meters

  // 2-Point Calculation Specs (in display units)
  const [d1, setD1] = useState<number>(toDisplayLength(0.4, dimUnit));
  const [w1, setW1] = useState<number>(toDisplayLength(0.45, dimUnit));
  const [h1, setH1] = useState<number>(toDisplayLength(0.35, dimUnit));
  const [d2, setD2] = useState<number>(toDisplayLength(1.6, dimUnit));
  const [w2, setW2] = useState<number>(toDisplayLength(1.75, dimUnit));
  const [h2, setH2] = useState<number>(toDisplayLength(1.35, dimUnit));

  // Quick Apply target selection
  const [targetScannerId, setTargetScannerId] = useState<string>(scanners[0]?.id || '');
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  if (!isScannerLibraryOpen) return null;

  // Real-time 2-point calculation
  const d1M = fromDisplayLength(Number(d1) || 0, dimUnit);
  const w1M = fromDisplayLength(Number(w1) || 0, dimUnit);
  const h1M = fromDisplayLength(Number(h1) || 0, dimUnit);
  const d2M = fromDisplayLength(Number(d2) || 0, dimUnit);
  const w2M = fromDisplayLength(Number(w2) || 0, dimUnit);
  const h2M = fromDisplayLength(Number(h2) || 0, dimUnit);

  const calc2Point = calculateFovFromTwoDistancePoints(d1M, w1M, h1M, d2M, w2M, h2M);

  const effectiveHFov = fovMode === 'twopoint' && calc2Point.isValid ? calc2Point.horizontalFovDeg : hFov;
  const effectiveVFov = fovMode === 'twopoint' && calc2Point.isValid ? calc2Point.verticalFovDeg : vFov;
  const effectiveNear = fovMode === 'twopoint' && d1M > 0 ? d1M : dofNear;
  const effectiveFar = fovMode === 'twopoint' && d2M > 0 ? d2M : dofFar;

  const resetForm = () => {
    setFormName('');
    setFovMode('angles');
    setHFov(58);
    setVFov(44);
    setDofNear(0.25);
    setDofFar(1.50);
    setD1(toDisplayLength(0.4, dimUnit));
    setW1(toDisplayLength(0.45, dimUnit));
    setH1(toDisplayLength(0.35, dimUnit));
    setD2(toDisplayLength(1.6, dimUnit));
    setW2(toDisplayLength(1.75, dimUnit));
    setH2(toDisplayLength(1.35, dimUnit));
    setEditingId(null);
  };

  const handleStartCreate = () => {
    resetForm();
    setViewMode('create');
  };

  const handleStartEdit = (preset: ScannerLibraryPreset) => {
    setEditingId(preset.id);
    setFormName(preset.name);
    setHFov(preset.optical.horizontalFov);
    setVFov(preset.optical.verticalFov);
    setDofNear(preset.optical.dofNear);
    setDofFar(preset.optical.dofFar);

    if (preset.optical.twoPointCalibration?.enabled) {
      setFovMode('twopoint');
      const c = preset.optical.twoPointCalibration;
      setD1(toDisplayLength(c.d1, dimUnit));
      setW1(toDisplayLength(c.w1, dimUnit));
      setH1(toDisplayLength(c.h1, dimUnit));
      setD2(toDisplayLength(c.d2, dimUnit));
      setW2(toDisplayLength(c.w2, dimUnit));
      setH2(toDisplayLength(c.h2, dimUnit));
    } else {
      setFovMode('angles');
    }
    setViewMode('edit');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Please enter a scanner model name.');
      return;
    }

    const twoPointCalibration: OpticalTwoPointCalibration | undefined =
      fovMode === 'twopoint' && calc2Point.isValid
        ? {
            enabled: true,
            d1: d1M,
            w1: w1M,
            h1: h1M,
            d2: d2M,
            w2: w2M,
            h2: h2M
          }
        : undefined;

    const opticalData = {
      horizontalFov: Number(effectiveHFov.toFixed(1)),
      verticalFov: Number(effectiveVFov.toFixed(1)),
      dofNear: Number(effectiveNear),
      dofFar: Number(effectiveFar),
      maxRange: Number((effectiveFar * 1.5).toFixed(2)),
      resolution: 'Matrix Imager',
      scannerModel: formName.trim(),
      focalLengthMm: 16,
      twoPointCalibration
    };

    if (viewMode === 'edit' && editingId) {
      updateScannerPreset(editingId, {
        name: formName.trim(),
        optical: opticalData
      });
    } else {
      addScannerPreset({
        name: formName.trim(),
        optical: opticalData
      });
    }

    resetForm();
    setViewMode('list');
  };

  const handleDuplicate = (preset: ScannerLibraryPreset) => {
    addScannerPreset({
      name: `${preset.name} (Copy)`,
      description: preset.description,
      optical: { ...preset.optical }
    });
  };

  const handleApply = (presetId: string, sId?: string) => {
    const scId = sId || targetScannerId || scanners[0]?.id;
    if (!scId) {
      alert('No active scanners available to apply this preset to.');
      return;
    }
    applyScannerPreset(scId, presetId);
    const targetScanner = scanners.find(s => s.id === scId);
    setAppliedFeedback(`Applied to ${targetScanner?.name || 'scanner'}!`);
    setTimeout(() => setAppliedFeedback(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>Scanner Library</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
                  FOV Presets
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Create & save pre-configured optical FOV models to apply instantly across projects.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsScannerLibraryOpen(false);
              setViewMode('list');
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs font-sans">
          {/* Notification feedback */}
          {appliedFeedback && (
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-mono text-xs flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{appliedFeedback}</span>
            </div>
          )}

          {/* =========================================================================
              VIEW 1: LIST OF PRESETS
             ========================================================================= */}
          {viewMode === 'list' && (
            <>
              {/* Header Action Bar */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300">
                  SAVED SCANNER MODELS ({scannerLibrary.length})
                </span>
                <button
                  onClick={handleStartCreate}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Scanner</span>
                </button>
              </div>

              {/* Empty state when started (as requested by user) */}
              {scannerLibrary.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mx-auto flex items-center justify-center">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-200">
                      Scanner Library is Empty
                    </h3>
                    <p className="text-slate-400 max-w-md mx-auto text-xs leading-relaxed">
                      Add scanner models with your calibrated FOV angles and focal depth limits.
                      Once saved, you can pick them directly from the scanner 3-dots menu to configure any scanner in 1 click!
                    </p>
                  </div>
                  <button
                    onClick={handleStartCreate}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold inline-flex items-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Scanner Preset</span>
                  </button>
                </div>
              ) : (
                /* List of Presets */
                <div className="grid grid-cols-1 gap-3">
                  {scannerLibrary.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{preset.name}</span>
                            {preset.optical.twoPointCalibration?.enabled && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                2-Point Calibrated
                              </span>
                            )}
                          </h4>
                          {preset.description && (
                            <p className="text-slate-400 text-xs mt-0.5">{preset.description}</p>
                          )}
                        </div>

                        {/* Card action buttons */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleStartEdit(preset)}
                            title="Edit preset"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(preset)}
                            title="Duplicate preset"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${preset.name}" from library?`)) {
                                deleteScannerPreset(preset.id);
                              }
                            }}
                            title="Delete preset"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Specs Badge Grid */}
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 font-mono text-[11px]">
                        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Horizontal FOV</span>
                          <span className="text-cyan-300 font-bold">{preset.optical.horizontalFov.toFixed(1)}°</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Vertical FOV</span>
                          <span className="text-cyan-300 font-bold">{preset.optical.verticalFov.toFixed(1)}°</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Focus Range ({dimUnit})</span>
                          <span className="text-amber-300 font-bold">
                            {toDisplayLength(preset.optical.dofNear, dimUnit)} - {toDisplayLength(preset.optical.dofFar, dimUnit)}
                          </span>
                        </div>
                      </div>

                      {/* Apply to active scanner bar */}
                      {scanners.length > 0 && (
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <span className="text-slate-400 font-mono">Apply to scanner:</span>
                          <div className="flex items-center gap-1.5">
                            <select
                              value={targetScannerId}
                              onChange={(e) => setTargetScannerId(e.target.value)}
                              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                            >
                              {scanners.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleApply(preset.id)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold transition-all"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* =========================================================================
              VIEW 2 & 3: CREATE OR EDIT SCANNER PRESET (Matching Attached Image 2!)
             ========================================================================= */}
          {(viewMode === 'create' || viewMode === 'edit') && (
            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-white text-sm">
                  {viewMode === 'create' ? 'Create Scanner Model Preset' : 'Edit Scanner Preset'}
                </span>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                >
                  &larr; Back to Library
                </button>
              </div>

              {/* 1. Scanner Model Name (Clean input, no placeholder, notes removed) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Scanner Model / Custom Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              {/* 2. FIELD OF VIEW & FOCUS CONFIGURATION (Image 2) */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-amber-400 text-xs tracking-wide">
                    Field of View & Focus
                  </span>

                  {/* Mode switcher tabs (matching Image 2) */}
                  <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={() => setFovMode('angles')}
                      className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                        fovMode === 'angles'
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Angles (°)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFovMode('twopoint')}
                      className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 cursor-pointer ${
                        fovMode === 'twopoint'
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Calculator className="w-3 h-3" />
                      <span>2-Point Calc</span>
                    </button>
                  </div>
                </div>

                {/* Sub-mode 1: Direct Angles */}
                {fovMode === 'angles' ? (
                  <div className="space-y-3 pt-1">
                    <NumberSliderInput
                      label="Horizontal FOV (X-Axis)"
                      tooltip="Optical spread angle across camera sensor width."
                      value={hFov}
                      unit="°"
                      min={20}
                      max={90}
                      step={1}
                      precision={1}
                      accentColor="accent-amber-400"
                      onChange={(v) => setHFov(v)}
                    />
                    <NumberSliderInput
                      label="Vertical FOV (Y-Axis)"
                      tooltip="Optical spread angle across camera sensor height."
                      value={vFov}
                      unit="°"
                      min={15}
                      max={80}
                      step={1}
                      precision={1}
                      accentColor="accent-amber-400"
                      onChange={(v) => setVFov(v)}
                    />
                  </div>
                ) : (
                  /* Sub-mode 2: 2-Point Distance Capture Area Calculator */
                  <div className="space-y-3 pt-1">
                    <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 text-[11px] leading-relaxed">
                      Enter the measured field dimensions at two working distances. The exact Horizontal and Vertical optical angles will be computed automatically.
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Point 1 */}
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
                        <span className="font-mono font-bold text-cyan-400 block text-[10px]">
                          POINT 1 (NEAR DISTANCE)
                        </span>
                        <div>
                          <label className="text-slate-400 block text-[10px]">Distance d1 ({dimUnit})</label>
                          <input
                            type="number"
                            value={d1}
                            onChange={(e) => setD1(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block text-[10px]">Capture Width w1 ({dimUnit})</label>
                          <input
                            type="number"
                            value={w1}
                            onChange={(e) => setW1(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block text-[10px]">Capture Height h1 ({dimUnit})</label>
                          <input
                            type="number"
                            value={h1}
                            onChange={(e) => setH1(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>

                      {/* Point 2 */}
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
                        <span className="font-mono font-bold text-emerald-400 block text-[10px]">
                          POINT 2 (FAR DISTANCE)
                        </span>
                        <div>
                          <label className="text-slate-400 block text-[10px]">Distance d2 ({dimUnit})</label>
                          <input
                            type="number"
                            value={d2}
                            onChange={(e) => setD2(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block text-[10px]">Capture Width w2 ({dimUnit})</label>
                          <input
                            type="number"
                            value={w2}
                            onChange={(e) => setW2(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block text-[10px]">Capture Height h2 ({dimUnit})</label>
                          <input
                            type="number"
                            value={h2}
                            onChange={(e) => setH2(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Computed angle readout */}
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-around font-mono text-[11px]">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Computed Horiz FOV:</span>
                        <span className="text-cyan-300 font-bold text-xs">{calc2Point.horizontalFovDeg.toFixed(1)}°</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Computed Vert FOV:</span>
                        <span className="text-cyan-300 font-bold text-xs">{calc2Point.verticalFovDeg.toFixed(1)}°</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Depth of Field Focus Limits */}
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <NumberSliderInput
                    label="DOF Near Limit (Red Zone Blind Spot)"
                    tooltip="Distance where barcodes first enter focus."
                    value={toDisplayLength(dofNear, dimUnit)}
                    unit={dimUnit}
                    min={dimUnit === 'mm' ? 100 : dimUnit === 'in' ? 4 : 0.1}
                    max={dimUnit === 'mm' ? 1500 : dimUnit === 'in' ? 60 : 1.5}
                    step={dimUnit === 'mm' ? 25 : 1}
                    accentColor="accent-rose-400"
                    onChange={(v) => setDofNear(fromDisplayLength(v, dimUnit))}
                  />

                  <NumberSliderInput
                    label="DOF Far Limit (Focus Boundary End)"
                    tooltip="Maximum distance where barcodes remain in focus."
                    value={toDisplayLength(dofFar, dimUnit)}
                    unit={dimUnit}
                    min={dimUnit === 'mm' ? 500 : dimUnit === 'in' ? 20 : 0.5}
                    max={dimUnit === 'mm' ? 4000 : dimUnit === 'in' ? 160 : 4.0}
                    step={dimUnit === 'mm' ? 50 : 2}
                    accentColor="accent-emerald-400"
                    onChange={(v) => setDofFar(fromDisplayLength(v, dimUnit))}
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-md transition-all cursor-pointer"
                >
                  {viewMode === 'create' ? 'Save to Library' : 'Update Preset'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
