import React, { useState } from 'react';
import * as THREE from 'three';
import {
  ChevronDown,
  ChevronUp,
  Box,
  Disc,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CornerDownRight,
  Check,
  RotateCcw,
  MoveHorizontal,
  Compass,
  Crosshair,
  Ruler
} from 'lucide-react';
import { useSimulator } from '../../context/SimulatorContext';
import { BarcodeFace, CartonTargetType, TyreBarcodeLocation, TyreTargetType } from '../../types';
import { Tooltip } from '../common/Tooltip';
import { NumberSliderInput } from '../common/NumberSliderInput';
import { toDisplayLength, fromDisplayLength, formatLength } from '../../utils/units';

export const PartSettingsCard: React.FC = () => {
  const {
    units,
    conveyor,
    partType,
    setPartType,
    carton,
    updateCarton,
    toggleBarcodeFace,
    setAllBarcodeFaces,
    getActiveDimensions,
    tyre,
    updateTyre,
    getActiveTyreDimensions
  } = useSimulator();

  // Collapsed at opening as requested
  const [isOpen, setIsOpen] = useState(false);

  const dimUnit = units.dimension;
  const cartonDims = getActiveDimensions();
  const tyreDims = getActiveTyreDimensions();

  // ---------------- CARTON CALCULATIONS ----------------
  const currentYaw = carton.rotationYaw || 0;
  const yawRad = THREE.MathUtils.degToRad(currentYaw);
  const cartonProjectedWidth = Math.abs(cartonDims.length * Math.sin(yawRad)) + Math.abs(cartonDims.width * Math.cos(yawRad));
  const maxCartonLateralMeters = Math.max(0, (conveyor.width - cartonProjectedWidth) / 2);
  const maxCartonLateralDisplay = toDisplayLength(maxCartonLateralMeters, dimUnit);
  const currentCartonLateral = Math.max(-maxCartonLateralMeters, Math.min(maxCartonLateralMeters, carton.lateralOffsetZ || 0));

  // ---------------- TYRE CALCULATIONS ----------------
  const maxTyreLateralMeters = Math.max(0, (conveyor.width - tyreDims.outerDiameter) / 2);
  const maxTyreLateralDisplay = toDisplayLength(maxTyreLateralMeters, dimUnit);
  const currentTyreLateral = Math.max(-maxTyreLateralMeters, Math.min(maxTyreLateralMeters, tyre.lateralOffsetZ || 0));

  const allFaces: BarcodeFace[] = ['top', 'bottom', 'left', 'right', 'front', 'back'];
  const faceDefs: { id: BarcodeFace; label: string; icon: React.ReactNode }[] = [
    { id: 'top', label: 'Top', icon: <ArrowUp className="w-3.5 h-3.5" /> },
    { id: 'bottom', label: 'Bottom', icon: <ArrowDown className="w-3.5 h-3.5" /> },
    { id: 'left', label: 'Left Side', icon: <ArrowLeft className="w-3.5 h-3.5" /> },
    { id: 'right', label: 'Right Side', icon: <ArrowRight className="w-3.5 h-3.5" /> },
    { id: 'front', label: 'Front (Lead)', icon: <CornerDownRight className="w-3.5 h-3.5" /> },
    { id: 'back', label: 'Back (Trail)', icon: <CornerDownRight className="w-3.5 h-3.5 rotate-180" /> },
  ];

  const handleCartonDimensionChange = (field: 'length' | 'width' | 'height', valMeters: number) => {
    if (carton.activeTarget === 'small') {
      updateCarton({ smallCarton: { ...carton.smallCarton, [field]: valMeters } });
    } else if (carton.activeTarget === 'large') {
      updateCarton({ largeCarton: { ...carton.largeCarton, [field]: valMeters } });
    } else {
      updateCarton({ customCarton: { ...carton.customCarton, [field]: valMeters } });
    }
  };

  const handleTyreDimensionChange = (field: 'outerDiameter' | 'innerDiameter' | 'height', valMeters: number) => {
    if (tyre.activeTarget === 'passenger') {
      updateTyre({ passengerTyre: { ...tyre.passengerTyre, [field]: valMeters } });
    } else if (tyre.activeTarget === 'truck') {
      updateTyre({ truckTyre: { ...tyre.truckTyre, [field]: valMeters } });
    } else {
      updateTyre({ customTyre: { ...tyre.customTyre, [field]: valMeters } });
    }
  };

  return (
    <div className="bg-gradient-to-b from-amber-950/40 via-industrial-900/90 to-slate-900/90 rounded-xl border border-amber-500/35 hover:border-amber-500/60 shadow-md shadow-amber-950/20 overflow-hidden transition-all">
      {/* Card Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-amber-950/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-900/40">
            {partType === 'carton' ? <Box className="w-4 h-4" /> : <Disc className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-amber-200 tracking-wide font-mono uppercase">
                Part & Code Engine
              </h3>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-semibold border border-amber-500/30 uppercase">
                {partType}
              </span>
            </div>
            <p className="text-[10px] text-amber-400/70 font-mono capitalize">
              {partType === 'carton' ? (
                `Carton · ${carton.activeTarget} (${carton.barcodeFaces.length} code faces)`
              ) : (
                `Tyre · ${tyre.activeTarget} (${tyre.barcodeLocation})`
              )}
            </p>
          </div>
        </div>
        <div className="text-amber-400/80">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Card Body */}
      {isOpen && (
        <div className="p-3.5 pt-1 space-y-4 border-t border-amber-900/40 text-xs">
          {/* 1. TOP PART TYPE TOGGLE: CARTON VS TYRE */}
          <div className="bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 mb-1 px-1 font-semibold flex items-center justify-between">
              <span>ACTIVE INSPECTION PART</span>
              <span className="text-cyan-400 font-bold uppercase">{partType}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setPartType('carton')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-mono text-xs font-bold border transition-all ${
                  partType === 'carton'
                    ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Box className="w-4 h-4" />
                <span>Carton Box</span>
              </button>

              <button
                onClick={() => setPartType('tyre')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-mono text-xs font-bold border transition-all ${
                  partType === 'tyre'
                    ? 'bg-cyan-500/20 border-cyan-500/80 text-cyan-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Disc className="w-4 h-4" />
                <span>Industrial Tyre</span>
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/*                   SECTION A: CARTON SETTINGS                   */}
          {/* ============================================================== */}
          {partType === 'carton' && (
            <div className="space-y-3.5">
              {/* Carton Profile */}
              <div>
                <div className="flex items-center justify-between mb-1.5 text-slate-300 font-medium">
                  <span>Carton Profile</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['small', 'large', 'custom'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => updateCarton({ activeTarget: type })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium capitalize border transition-all ${
                        carton.activeTarget === type
                          ? 'bg-amber-500/20 border-amber-500/70 text-amber-300 font-bold shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Carton Dimensions */}
              <div className="space-y-2 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/70">
                <div className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Carton Dimensions</span>
                  <span className="font-mono text-cyan-400 text-[10px]">
                    {toDisplayLength(cartonDims.length, dimUnit)} × {toDisplayLength(cartonDims.width, dimUnit)} × {toDisplayLength(cartonDims.height, dimUnit)} {dimUnit}
                  </span>
                </div>

                <NumberSliderInput
                  label="Length (X - Travel)"
                  value={toDisplayLength(cartonDims.length, dimUnit)}
                  unit={dimUnit}
                  min={dimUnit === 'mm' ? 100 : dimUnit === 'in' ? 4 : 0.1}
                  max={dimUnit === 'mm' ? 1400 : dimUnit === 'in' ? 55 : 1.4}
                  step={dimUnit === 'mm' ? 10 : dimUnit === 'in' ? 0.5 : 0.02}
                  accentColor="accent-amber-400"
                  onChange={(val) => handleCartonDimensionChange('length', fromDisplayLength(val, dimUnit))}
                />

                <NumberSliderInput
                  label="Width (Z - Across Belt)"
                  value={toDisplayLength(cartonDims.width, dimUnit)}
                  unit={dimUnit}
                  min={dimUnit === 'mm' ? 100 : dimUnit === 'in' ? 4 : 0.1}
                  max={dimUnit === 'mm' ? 1200 : dimUnit === 'in' ? 48 : 1.2}
                  step={dimUnit === 'mm' ? 10 : dimUnit === 'in' ? 0.5 : 0.02}
                  accentColor="accent-amber-400"
                  onChange={(val) => handleCartonDimensionChange('width', fromDisplayLength(val, dimUnit))}
                />

                <NumberSliderInput
                  label="Height (Y - Elevation)"
                  value={toDisplayLength(cartonDims.height, dimUnit)}
                  unit={dimUnit}
                  min={dimUnit === 'mm' ? 50 : dimUnit === 'in' ? 2 : 0.05}
                  max={dimUnit === 'mm' ? 1000 : dimUnit === 'in' ? 40 : 1.0}
                  step={dimUnit === 'mm' ? 10 : dimUnit === 'in' ? 0.5 : 0.02}
                  accentColor="accent-amber-400"
                  onChange={(val) => handleCartonDimensionChange('height', fromDisplayLength(val, dimUnit))}
                />
              </div>

              {/* Carton Belt Position & Rotation */}
              <div className="space-y-2.5 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/70">
                <div className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MoveHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Belt Alignment & Skew</span>
                  </span>
                  {(currentCartonLateral !== 0 || currentYaw !== 0) && (
                    <button
                      onClick={() => updateCarton({ lateralOffsetZ: 0, rotationYaw: 0 })}
                      className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/80 transition-colors"
                      title="Reset to center and 0° skew"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Re-center</span>
                    </button>
                  )}
                </div>

                <NumberSliderInput
                  label="Lateral Offset (Z - Across Belt)"
                  tooltip="Transverse offset of the parcel across conveyor width. Bounded to keep parcel safely inside guard rails."
                  value={toDisplayLength(currentCartonLateral, dimUnit)}
                  unit={dimUnit}
                  min={-maxCartonLateralDisplay}
                  max={maxCartonLateralDisplay}
                  step={dimUnit === 'mm' ? 5 : dimUnit === 'in' ? 0.2 : 0.01}
                  accentColor="accent-cyan-400"
                  onChange={(val) => {
                    const meters = fromDisplayLength(val, dimUnit);
                    const clamped = Math.max(-maxCartonLateralMeters, Math.min(maxCartonLateralMeters, meters));
                    updateCarton({ lateralOffsetZ: clamped });
                  }}
                />

                <NumberSliderInput
                  label="Skew Angle (Yaw Rotation)"
                  tooltip="Angular skew of the parcel on the belt."
                  value={currentYaw}
                  unit="°"
                  min={-90}
                  max={90}
                  step={1}
                  precision={0}
                  accentColor="accent-cyan-400"
                  onChange={(val) => {
                    const newYawRad = THREE.MathUtils.degToRad(val);
                    const newProjectedW = Math.abs(cartonDims.length * Math.sin(newYawRad)) + Math.abs(cartonDims.width * Math.cos(newYawRad));
                    const newMax = Math.max(0, (conveyor.width - newProjectedW) / 2);
                    const clampedZ = Math.max(-newMax, Math.min(newMax, currentCartonLateral));
                    updateCarton({ rotationYaw: val, lateralOffsetZ: clampedZ });
                  }}
                />
              </div>

              {/* Multi-Select Barcode Placement Faces */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <span>Barcode Positions (Multi-Select)</span>
                    <Tooltip content="Click any face to toggle barcode on or off. Supports multiple active faces simultaneously." />
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setAllBarcodeFaces(allFaces)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 px-1 py-0.5 rounded hover:bg-slate-800 transition-colors"
                    >
                      All (Omni)
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      onClick={() => setAllBarcodeFaces([])}
                      className="text-[10px] text-rose-400 hover:text-rose-300 px-1 py-0.5 rounded hover:bg-slate-800 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {faceDefs.map((f) => {
                    const isActive = carton.barcodeFaces.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        onClick={() => toggleBarcodeFace(f.id)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-mono border transition-all ${
                          isActive
                            ? 'bg-cyan-500/20 border-cyan-500/80 text-cyan-200 font-semibold shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {f.icon}
                          <span>{f.label}</span>
                        </div>
                        {isActive ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <span className="w-2 h-2 rounded-full bg-slate-800" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BARCODE SURFACE POSITION: MOVE ALONG X & Y OF EVERY SURFACE */}
              <div className="space-y-2 bg-slate-950/60 p-2.5 rounded-lg border border-cyan-900/40">
                <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-300">
                  <span className="flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Barcode Surface Position (X & Y)</span>
                  </span>
                  {(carton.barcodeOffsetU !== 0 || carton.barcodeOffsetV !== 0) && (
                    <button
                      onClick={() => updateCarton({ barcodeOffsetU: 0, barcodeOffsetV: 0 })}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300"
                    >
                      Center Label
                    </button>
                  )}
                </div>

                <NumberSliderInput
                  label="Face Position X (Horizontal Across Face)"
                  tooltip="Moves the barcode horizontally across the surface of each active face (-40% left to +40% right)."
                  value={Math.round((carton.barcodeOffsetU || 0) * 100)}
                  unit="%"
                  min={-40}
                  max={40}
                  step={5}
                  precision={0}
                  accentColor="accent-cyan-400"
                  onChange={(val) => updateCarton({ barcodeOffsetU: val / 100 })}
                />

                <NumberSliderInput
                  label="Face Position Y (Vertical Across Face)"
                  tooltip="Moves the barcode vertically across the surface of each active face (-40% bottom to +40% top)."
                  value={Math.round((carton.barcodeOffsetV || 0) * 100)}
                  unit="%"
                  min={-40}
                  max={40}
                  step={5}
                  precision={0}
                  accentColor="accent-cyan-400"
                  onChange={(val) => updateCarton({ barcodeOffsetV: val / 100 })}
                />

                {/* Quick 2D surface position presets */}
                <div className="grid grid-cols-5 gap-1 pt-1 border-t border-slate-800 text-[9px] font-mono">
                  {[
                    { label: 'Center', u: 0, v: 0 },
                    { label: 'Top-R', u: 0.3, v: 0.3 },
                    { label: 'Btm-L', u: -0.3, v: -0.3 },
                    { label: 'Left', u: -0.35, v: 0 },
                    { label: 'Right', u: 0.35, v: 0 },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => updateCarton({ barcodeOffsetU: p.u, barcodeOffsetV: p.v })}
                      className="py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 text-center transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/*                    SECTION B: TYRE SETTINGS                    */}
          {/* ============================================================== */}
          {partType === 'tyre' && (
            <div className="space-y-3.5">
              {/* Tyre Profile */}
              <div>
                <div className="flex items-center justify-between mb-1.5 text-slate-300 font-medium">
                  <span>Tyre Profile</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['passenger', 'truck', 'custom'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => updateTyre({ activeTarget: type })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium capitalize border transition-all ${
                        tyre.activeTarget === type
                          ? 'bg-cyan-500/20 border-cyan-500/70 text-cyan-300 font-bold shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tyre Dimensions */}
              <div className="space-y-2 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/70">
                <div className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Tyre Dimensions</span>
                  <span className="font-mono text-cyan-400 text-[10px]">
                    OD: {formatLength(tyreDims.outerDiameter, dimUnit)} · Width: {formatLength(tyreDims.height, dimUnit)}
                  </span>
                </div>

                <NumberSliderInput
                  label="Outer Diameter (OD)"
                  tooltip="Overall tire outside diameter across tread."
                  value={toDisplayLength(tyreDims.outerDiameter, dimUnit)}
                  unit={dimUnit}
                  min={dimUnit === 'mm' ? 400 : dimUnit === 'in' ? 16 : 0.4}
                  max={dimUnit === 'mm' ? 1400 : dimUnit === 'in' ? 55 : 1.4}
                  step={dimUnit === 'mm' ? 10 : dimUnit === 'in' ? 0.5 : 0.02}
                  accentColor="accent-cyan-400"
                  onChange={(val) => handleTyreDimensionChange('outerDiameter', fromDisplayLength(val, dimUnit))}
                />

                <NumberSliderInput
                  label="Rim Hole Diameter (ID)"
                  tooltip="Internal rim diameter / wheel bead hole diameter."
                  value={toDisplayLength(tyreDims.innerDiameter, dimUnit)}
                  unit={dimUnit}
                  min={dimUnit === 'mm' ? 250 : dimUnit === 'in' ? 10 : 0.25}
                  max={toDisplayLength(tyreDims.outerDiameter * 0.85, dimUnit)}
                  step={dimUnit === 'mm' ? 10 : dimUnit === 'in' ? 0.5 : 0.02}
                  accentColor="accent-cyan-400"
                  onChange={(val) => handleTyreDimensionChange('innerDiameter', fromDisplayLength(val, dimUnit))}
                />

                <NumberSliderInput
                  label="Section Width / Height (Laying Flat)"
                  tooltip="Tire cross-section width (elevation height when laying flat on conveyor belt)."
                  value={toDisplayLength(tyreDims.height, dimUnit)}
                  unit={dimUnit}
                  min={dimUnit === 'mm' ? 120 : dimUnit === 'in' ? 5 : 0.12}
                  max={dimUnit === 'mm' ? 450 : dimUnit === 'in' ? 18 : 0.45}
                  step={dimUnit === 'mm' ? 10 : dimUnit === 'in' ? 0.5 : 0.02}
                  accentColor="accent-cyan-400"
                  onChange={(val) => handleTyreDimensionChange('height', fromDisplayLength(val, dimUnit))}
                />
              </div>

              {/* Tyre Belt Alignment & Skew */}
              <div className="space-y-2.5 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/70">
                <div className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MoveHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Conveyor Belt Alignment</span>
                  </span>
                  {(currentTyreLateral !== 0 || tyre.rotationYaw !== 0) && (
                    <button
                      onClick={() => updateTyre({ lateralOffsetZ: 0, rotationYaw: 0 })}
                      className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/80 transition-colors"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Re-center</span>
                    </button>
                  )}
                </div>

                <NumberSliderInput
                  label="Lateral Position (Across Belt)"
                  tooltip="Transverse offset across conveyor width."
                  value={toDisplayLength(currentTyreLateral, dimUnit)}
                  unit={dimUnit}
                  min={-maxTyreLateralDisplay}
                  max={maxTyreLateralDisplay}
                  step={dimUnit === 'mm' ? 5 : dimUnit === 'in' ? 0.2 : 0.01}
                  accentColor="accent-cyan-400"
                  onChange={(val) => {
                    const meters = fromDisplayLength(val, dimUnit);
                    const clamped = Math.max(-maxTyreLateralMeters, Math.min(maxTyreLateralMeters, meters));
                    updateTyre({ lateralOffsetZ: clamped });
                  }}
                />

                <NumberSliderInput
                  label="Tyre Rotation on Belt"
                  tooltip="Rotation angle of the tyre on the conveyor belt."
                  value={tyre.rotationYaw || 0}
                  unit="°"
                  min={-180}
                  max={180}
                  step={5}
                  precision={0}
                  accentColor="accent-cyan-400"
                  onChange={(val) => updateTyre({ rotationYaw: val })}
                />
              </div>

              {/* Barcode Location on Tyre */}
              <div>
                <div className="flex items-center justify-between mb-1.5 text-slate-300 font-medium">
                  <span>Barcode Placement Surface</span>
                  <Tooltip content="Choose whether barcode/tag is located on the Top Sidewall, Bottom Sidewall, or Outer Tread." />
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'sidewall_top', label: 'Top Sidewall' },
                    { id: 'tread', label: 'Outer Tread' },
                    { id: 'sidewall_bottom', label: 'Bottom Wall' },
                  ].map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => updateTyre({ barcodeLocation: loc.id as TyreBarcodeLocation })}
                      className={`py-1.5 px-1.5 rounded-lg text-[11px] font-mono border transition-all text-center ${
                        tyre.barcodeLocation === loc.id
                          ? 'bg-cyan-500/20 border-cyan-500/70 text-cyan-300 font-bold shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TYRE RADIAL POSITION & ANGLE CONTROLS */}
              <div className="space-y-2.5 bg-slate-950/60 p-2.5 rounded-lg border border-cyan-900/40">
                <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-300">
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Barcode Radial Position</span>
                  </span>
                  <span className="font-mono text-[10px] text-cyan-400">
                    {tyre.radialAngleDeg}° @ {Math.round(tyre.radialDistanceRatio * 100)}% radius
                  </span>
                </div>

                {/* Circumferential Angle */}
                <NumberSliderInput
                  label="Radial Angle around Circumference (θ)"
                  tooltip="Clock position of barcode tag around tyre (0° to 360°)."
                  value={tyre.radialAngleDeg || 0}
                  unit="°"
                  min={0}
                  max={360}
                  step={5}
                  precision={0}
                  accentColor="accent-cyan-400"
                  onChange={(val) => updateTyre({ radialAngleDeg: val % 360 })}
                />

                {/* Radial Distance from Bead to Shoulder (if sidewall) */}
                {tyre.barcodeLocation !== 'tread' && (
                  <NumberSliderInput
                    label="Radial Height (Bead → Shoulder)"
                    tooltip="Distance from the inner bead hole (0%) to the outer shoulder tread (100%)."
                    value={Math.round((tyre.radialDistanceRatio || 0.5) * 100)}
                    unit="%"
                    min={10}
                    max={90}
                    step={5}
                    precision={0}
                    accentColor="accent-cyan-400"
                    onChange={(val) => updateTyre({ radialDistanceRatio: val / 100 })}
                  />
                )}

                {/* Quick Angle Snaps */}
                <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-800 text-[10px] font-mono">
                  {[
                    { label: '0° North', angle: 0 },
                    { label: '90° East', angle: 90 },
                    { label: '180° South', angle: 180 },
                    { label: '270° West', angle: 270 },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => updateTyre({ radialAngleDeg: p.angle })}
                      className="py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 text-center transition-colors truncate"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
