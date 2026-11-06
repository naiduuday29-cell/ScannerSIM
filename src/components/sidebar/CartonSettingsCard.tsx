import React, { useState } from 'react';
import * as THREE from 'three';
import {
  ChevronDown,
  ChevronUp,
  Box,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CornerDownRight,
  Check,
  Globe,
  X,
  RotateCcw,
  MoveHorizontal,
  Compass
} from 'lucide-react';
import { useSimulator } from '../../context/SimulatorContext';
import { BarcodeFace, CartonTargetType } from '../../types';
import { Tooltip } from '../common/Tooltip';
import { NumberSliderInput } from '../common/NumberSliderInput';
import { toDisplayLength, fromDisplayLength } from '../../utils/units';

export const CartonSettingsCard: React.FC = () => {
  const {
    units,
    conveyor,
    carton,
    updateCarton,
    toggleBarcodeFace,
    setAllBarcodeFaces,
    getActiveDimensions
  } = useSimulator();

  const [isOpen, setIsOpen] = useState(true);
  const dims = getActiveDimensions();
  const dimUnit = units.dimension;

  const handleTargetChange = (type: CartonTargetType) => {
    updateCarton({ activeTarget: type });
  };

  const handleDimensionChange = (field: 'length' | 'width' | 'height', valMeters: number) => {
    if (carton.activeTarget === 'small') {
      updateCarton({ smallCarton: { ...carton.smallCarton, [field]: valMeters } });
    } else if (carton.activeTarget === 'large') {
      updateCarton({ largeCarton: { ...carton.largeCarton, [field]: valMeters } });
    } else {
      updateCarton({ customCarton: { ...carton.customCarton, [field]: valMeters } });
    }
  };

  const allFaces: BarcodeFace[] = ['top', 'bottom', 'left', 'right', 'front', 'back'];

  const faceDefs: { id: BarcodeFace; label: string; icon: React.ReactNode }[] = [
    { id: 'top', label: 'Top', icon: <ArrowUp className="w-3.5 h-3.5" /> },
    { id: 'bottom', label: 'Bottom', icon: <ArrowDown className="w-3.5 h-3.5" /> },
    { id: 'left', label: 'Left Side', icon: <ArrowLeft className="w-3.5 h-3.5" /> },
    { id: 'right', label: 'Right Side', icon: <ArrowRight className="w-3.5 h-3.5" /> },
    { id: 'front', label: 'Front (Lead)', icon: <CornerDownRight className="w-3.5 h-3.5" /> },
    { id: 'back', label: 'Back (Trail)', icon: <CornerDownRight className="w-3.5 h-3.5 rotate-180" /> },
  ];

  const maxL = dimUnit === 'mm' ? 1400 : dimUnit === 'in' ? 55 : 1.4;
  const maxW = dimUnit === 'mm' ? 1200 : dimUnit === 'in' ? 48 : 1.2;
  const maxH = dimUnit === 'mm' ? 1000 : dimUnit === 'in' ? 40 : 1.0;
  const step = dimUnit === 'mm' ? 10 : dimUnit === 'in' ? 0.5 : 0.02;

  // Projected transverse width along Z taking into account carton yaw rotation
  const currentYaw = carton.rotationYaw || 0;
  const yawRad = THREE.MathUtils.degToRad(currentYaw);
  const projectedWidth = Math.abs(dims.length * Math.sin(yawRad)) + Math.abs(dims.width * Math.cos(yawRad));

  // The guard rails are placed completely outside the usable belt width at ±(conveyor.width/2).
  // The maximum lateral offset ensures the carton edges never penetrate or clip the guard rails:
  const maxLateralMeters = Math.max(0, (conveyor.width - projectedWidth) / 2);
  const maxLateralDisplay = toDisplayLength(maxLateralMeters, dimUnit);
  const lateralStep = dimUnit === 'mm' ? 5 : dimUnit === 'in' ? 0.2 : 0.01;

  const currentLateral = Math.max(-maxLateralMeters, Math.min(maxLateralMeters, carton.lateralOffsetZ || 0));

  return (
    <div className="bg-industrial-900/80 rounded-xl border border-slate-800/80 shadow-md overflow-hidden transition-all">
      {/* Card Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 tracking-wide font-mono uppercase">
              Carton Specs & Barcodes
            </h3>
            <p className="text-[10px] text-slate-400 capitalize">
              {carton.activeTarget} · {carton.barcodeFaces.length} code{carton.barcodeFaces.length !== 1 ? 's' : ''} ({carton.barcodeFaces.join(', ') || 'none'})
            </p>
          </div>
        </div>
        <div className="text-slate-400">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Card Body */}
      {isOpen && (
        <div className="p-3.5 pt-1 space-y-3.5 border-t border-slate-800/60 text-xs">
          {/* Active Target Size Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span>Parcel Size Profile</span>
                <Tooltip content="Select between standard small parcel, large bulk parcel, or custom logistics package dimensions." />
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(['small', 'large', 'custom'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleTargetChange(type)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium capitalize border transition-all ${
                    carton.activeTarget === type
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Dimension Controls with Sliders + Exact Inputs */}
          <div className="space-y-2.5 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/70">
            <div className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Parcel Dimensions</span>
              <span className="font-mono text-cyan-400 text-[10px]">
                {toDisplayLength(dims.length, dimUnit)} × {toDisplayLength(dims.width, dimUnit)} × {toDisplayLength(dims.height, dimUnit)} {dimUnit}
              </span>
            </div>

            <NumberSliderInput
              label="Length (X - Travel)"
              value={toDisplayLength(dims.length, dimUnit)}
              unit={dimUnit}
              min={dimUnit === 'mm' ? 100 : dimUnit === 'in' ? 4 : 0.1}
              max={maxL}
              step={step}
              accentColor="accent-amber-400"
              onChange={(val) => handleDimensionChange('length', fromDisplayLength(val, dimUnit))}
            />

            <NumberSliderInput
              label="Width (Z - Across Belt)"
              value={toDisplayLength(dims.width, dimUnit)}
              unit={dimUnit}
              min={dimUnit === 'mm' ? 100 : dimUnit === 'in' ? 4 : 0.1}
              max={maxW}
              step={step}
              accentColor="accent-amber-400"
              onChange={(val) => handleDimensionChange('width', fromDisplayLength(val, dimUnit))}
            />

            <NumberSliderInput
              label="Height (Y - Elevation)"
              value={toDisplayLength(dims.height, dimUnit)}
              unit={dimUnit}
              min={dimUnit === 'mm' ? 50 : dimUnit === 'in' ? 2 : 0.05}
              max={maxH}
              step={step}
              accentColor="accent-amber-400"
              onChange={(val) => handleDimensionChange('height', fromDisplayLength(val, dimUnit))}
            />
          </div>

          {/* CARTON BELT POSITION & ROTATION SKEW */}
          <div className="space-y-2.5 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/70">
            <div className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MoveHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Belt Alignment & Skew</span>
              </span>
              {(currentLateral !== 0 || currentYaw !== 0) && (
                <button
                  onClick={() => updateCarton({ lateralOffsetZ: 0, rotationYaw: 0 })}
                  className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/80 transition-colors"
                  title="Reset to conveyor center and 0° skew"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Re-center</span>
                </button>
              )}
            </div>

            {/* Lateral Offset (Z) */}
            <NumberSliderInput
              label="Lateral Offset (Z - Across Belt)"
              tooltip="Transverse offset of the parcel across the conveyor width. In real logistics, parcels often travel off-center or hug side rails."
              value={toDisplayLength(currentLateral, dimUnit)}
              unit={dimUnit}
              min={-maxLateralDisplay}
              max={maxLateralDisplay}
              step={lateralStep}
              accentColor="accent-cyan-400"
              onChange={(val) => {
                const meters = fromDisplayLength(val, dimUnit);
                const clamped = Math.max(-maxLateralMeters, Math.min(maxLateralMeters, meters));
                updateCarton({ lateralOffsetZ: clamped });
              }}
            />

            {/* Skew Rotation Angle (Yaw) */}
            <NumberSliderInput
              label="Skew Angle (Yaw Rotation)"
              tooltip="Rotational orientation of the parcel on the belt. Parcels rarely arrive perfectly aligned; skew changes incidence angles relative to scanners."
              value={currentYaw}
              unit="°"
              min={-90}
              max={90}
              step={1}
              precision={0}
              accentColor="accent-cyan-400"
              onChange={(val) => {
                const newYawRad = THREE.MathUtils.degToRad(val);
                const newProjectedW = Math.abs(dims.length * Math.sin(newYawRad)) + Math.abs(dims.width * Math.cos(newYawRad));
                const newMax = Math.max(0, (conveyor.width - newProjectedW) / 2);
                const clampedZ = Math.max(-newMax, Math.min(newMax, currentLateral));
                updateCarton({ rotationYaw: val, lateralOffsetZ: clampedZ });
              }}
            />

            {/* Quick Skew Presets */}
            <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-800/60 text-[10px] font-mono">
              {[
                { label: '0° Center', ratio: 0, yaw: 0 },
                { label: '+15° Skew', ratio: 0.6, yaw: 15 },
                { label: '-15° Skew', ratio: -0.6, yaw: -15 },
                { label: '45° Angle', ratio: 0, yaw: 45 },
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const newYawRad = THREE.MathUtils.degToRad(preset.yaw);
                    const newProjectedW = Math.abs(dims.length * Math.sin(newYawRad)) + Math.abs(dims.width * Math.cos(newYawRad));
                    const newMax = Math.max(0, (conveyor.width - newProjectedW) / 2);
                    updateCarton({ lateralOffsetZ: preset.ratio * newMax, rotationYaw: preset.yaw });
                  }}
                  className="py-1 px-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-center transition-colors truncate"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* MULTI-SELECT BARCODE PLACEMENT FACES */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span>Barcode Positions (Multi-Select)</span>
                <Tooltip content="Click any face to toggle barcode on or off. Select multiple faces (e.g. Front & Back, or Left & Top) to validate multi-sided read setups." />
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
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {f.icon}
                      <span>{f.label}</span>
                    </div>
                    {isActive ? (
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-800" />
                    )}
                  </button>
                );
              })}
            </div>
            {carton.barcodeFaces.length === 0 && (
              <div className="text-[10px] text-amber-400/90 font-mono mt-1 text-center bg-amber-950/30 p-1 rounded border border-amber-900/40">
                ⚠ No barcodes active. Click faces above to place barcodes.
              </div>
            )}
          </div>

          {/* Symbology Type */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span>Barcode Symbology</span>
                <Tooltip content="Optical barcode type: 1D linear (Code 128) or 2D matrix (DataMatrix / QR)." />
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: '1D_Code128', label: '1D Code 128' },
                { id: '2D_DataMatrix', label: 'DataMatrix' },
                { id: 'QR_Code', label: 'QR Code' }
              ].map((sym) => (
                <button
                  key={sym.id}
                  onClick={() => updateCarton({ barcodeType: sym.id as any })}
                  className={`py-1 px-1.5 rounded text-[10px] font-mono border transition-all ${
                    carton.barcodeType === sym.id
                      ? 'bg-slate-800 border-cyan-500/50 text-cyan-300 font-bold'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sym.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
