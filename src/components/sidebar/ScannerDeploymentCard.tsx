import React, { useState } from 'react';
import * as THREE from 'three';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Crosshair,
  Calculator,
  GripVertical,
  MoreVertical,
  BookOpen,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  Sliders
} from 'lucide-react';
import { useSimulator } from '../../context/SimulatorContext';
import { NumberSliderInput } from '../common/NumberSliderInput';
import { toDisplayLength, fromDisplayLength } from '../../utils/units';
import { TwoPointFovCalculator } from './TwoPointFovCalculator';
import { computeMirrorFoldedPath, getDefaultMirrorConfig } from '../../utils/math3d';

export const ScannerDeploymentCard: React.FC = () => {
  const {
    units,
    scanners,
    selectedScannerId,
    setSelectedScannerId,
    addScanner,
    updateScanner,
    removeScanner,
    duplicateScanner,
    reorderScanners,
    scannerLibrary,
    applyScannerPreset,
    setIsScannerLibraryOpen,
    conveyor
  } = useSimulator();

  // Collapsed at opening as requested
  const [isOpen, setIsOpen] = useState(false);
  const [expandedScannerId, setExpandedScannerId] = useState<string | null>(
    scanners[0]?.id || null
  );
  // Drag and drop reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // 3-dots dropdown menu state
  const [openMenuScannerId, setOpenMenuScannerId] = useState<string | null>(null);
  // Input mode per scanner: 'angles' (default) or 'twopoint' (2-distance capture area)
  const [fovInputMode, setFovInputMode] = useState<Record<string, 'angles' | 'twopoint'>>({});
  // Advanced mirror 3D position disclosure per scanner
  const [expandedMirrorAdvanced, setExpandedMirrorAdvanced] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedScannerId(prev => (prev === id ? null : id));
    setSelectedScannerId(id);
  };

  const dimUnit = units.dimension;

  // Step and range multipliers based on unit
  const posRange = dimUnit === 'mm' ? 3000 : dimUnit === 'in' ? 120 : 3.0;
  const posStep = dimUnit === 'mm' ? 10 : dimUnit === 'in' ? 0.5 : 0.02;

  const dofNearMax = dimUnit === 'mm' ? 1500 : dimUnit === 'in' ? 60 : 1.5;
  const dofFarMax = dimUnit === 'mm' ? 3500 : dimUnit === 'in' ? 140 : 3.5;

  return (
    <div className="bg-gradient-to-b from-cyan-950/40 via-industrial-900/90 to-slate-900/90 rounded-xl border border-cyan-500/35 hover:border-cyan-500/60 shadow-md shadow-cyan-950/20 overflow-hidden transition-all">
      {/* Card Header with Add Button */}
      <div className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-cyan-950/30 transition-colors ${
        isOpen ? 'border-b border-cyan-900/40' : ''
      }`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 flex-1"
        >
          <div className="p-1.5 rounded-md bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-900/40">
            <Crosshair className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-cyan-200 tracking-wide font-mono uppercase truncate">
            Scanner Settings
          </h3>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => addScanner()}
            className="flex items-center gap-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-2 py-1 rounded-md text-[11px] font-mono font-semibold transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Scanner</span>
          </button>
          <button onClick={() => setIsOpen(!isOpen)} className="text-cyan-400/80 hover:text-cyan-300 p-1">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Card Body */}
      {isOpen && (
        <div className="p-2.5 space-y-2 text-xs">
          {scanners.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-xs">
              No scanners deployed. Click "+ Add Scanner" to begin array layout.
            </div>
          ) : (
            scanners.map((scanner, index) => {
              const isExpanded = expandedScannerId === scanner.id;
              const isSelected = selectedScannerId === scanner.id;
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index && draggedIndex !== index;

              return (
                <div
                  key={scanner.id}
                  draggable
                  onDragStart={(e) => {
                    const target = e.target as HTMLElement;
                    if (
                      target.tagName === 'INPUT' ||
                      target.tagName === 'BUTTON' ||
                      target.closest('button') ||
                      target.closest('input')
                    ) {
                      e.preventDefault();
                      return;
                    }
                    setDraggedIndex(index);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', String(index));
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverIndex !== index) {
                      setDragOverIndex(index);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverIndex === index) {
                      setDragOverIndex(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedIndex !== null && draggedIndex !== index) {
                      reorderScanners(draggedIndex, index);
                    }
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  }}
                  onClick={() => setSelectedScannerId(scanner.id)}
                  className={`rounded-lg border transition-all ${
                    isDragging
                      ? 'opacity-40 border-dashed border-cyan-400 bg-slate-900/40 scale-[0.98]'
                      : isDragOver
                      ? 'ring-2 ring-cyan-400 border-cyan-400 bg-cyan-950/40 scale-[1.01]'
                      : isSelected
                      ? 'border-cyan-500/60 bg-slate-900/90 shadow-md ring-1 ring-cyan-500/20'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  {/* Scanner Item Header Bar */}
                  <div className="px-3 py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {/* Drag & Drop Grip Handle */}
                      <div
                        className="p-1 text-slate-500 hover:text-cyan-400 cursor-grab active:cursor-grabbing rounded hover:bg-slate-800 transition-colors flex-shrink-0"
                        title="Drag and drop to reorder scanner in array"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>

                      {/* Active Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateScanner(scanner.id, { isActive: !scanner.isActive });
                        }}
                        title={scanner.isActive ? 'Disable scanner' : 'Enable scanner'}
                        className={`p-1 rounded transition-colors ${
                          scanner.isActive
                            ? 'text-emerald-400 hover:text-emerald-300'
                            : 'text-slate-600 hover:text-slate-400'
                        }`}
                      >
                        {scanner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      {/* Name input */}
                      <input
                        type="text"
                        value={scanner.name}
                        disabled={scanner.isLocked}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateScanner(scanner.id, { name: e.target.value })}
                        className={`bg-transparent text-xs font-semibold focus:outline-none focus:border-b border-cyan-400 truncate w-full ${
                          scanner.isLocked ? 'text-slate-400 cursor-not-allowed' : 'text-slate-200'
                        }`}
                      />

                      {/* Locked subtle indicator icon */}
                      {scanner.isLocked && (
                        <span title="Scanner settings are locked" className="flex-shrink-0 flex items-center">
                          <Lock className="w-3 h-3 text-amber-400" />
                        </span>
                      )}
                    </div>

                    {/* Action Icons: 3-Dots Dropdown Menu & Expand Chevron */}
                    <div className="flex items-center gap-1">
                      {/* Vertical 3-Dots Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuScannerId(openMenuScannerId === scanner.id ? null : scanner.id);
                          }}
                          title="Scanner options"
                          className={`p-1 rounded transition-colors ${
                            openMenuScannerId === scanner.id
                              ? 'text-cyan-300 bg-slate-800'
                              : scanner.isLocked
                              ? 'text-amber-400 hover:text-amber-300 hover:bg-slate-800'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {/* Dropdown List Card */}
                        {openMenuScannerId === scanner.id && (
                          <>
                            {/* Backdrop to capture outside clicks */}
                            <div
                              className="fixed inset-0 z-40 cursor-default"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuScannerId(null);
                              }}
                            />

                            {/* Menu Card */}
                            <div
                              className="absolute right-0 top-full mt-1 w-52 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl z-50 py-1.5 text-[11px] font-medium text-slate-200 backdrop-blur-md"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Scanner FOV Preset Section Header */}
                              <div className="px-2.5 py-1 flex items-center justify-between border-b border-slate-800 pb-1 text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  <span>FOV Preset</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuScannerId(null);
                                    setIsScannerLibraryOpen(true);
                                  }}
                                  className="text-cyan-400 hover:text-cyan-300 hover:underline lowercase font-normal cursor-pointer"
                                >
                                  + library
                                </button>
                              </div>

                              {/* Dropdown Selection for FOV Presets */}
                              <div className="px-2.5 py-2">
                                {scannerLibrary.length === 0 ? (
                                  <div className="text-slate-400 text-[10px]">
                                    <p className="italic text-slate-400">Library is empty</p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuScannerId(null);
                                        setIsScannerLibraryOpen(true);
                                      }}
                                      className="text-cyan-400 hover:underline font-semibold block mt-1 cursor-pointer"
                                    >
                                      + Add in Library
                                    </button>
                                  </div>
                                ) : (
                                  <select
                                    defaultValue=""
                                    disabled={scanner.isLocked}
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        applyScannerPreset(scanner.id, e.target.value);
                                        setOpenMenuScannerId(null);
                                      }
                                    }}
                                    className="w-full bg-slate-950 border border-slate-700 hover:border-cyan-500/50 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <option value="" disabled>
                                      Select Scanner Preset...
                                    </option>
                                    {scannerLibrary.map((preset) => (
                                      <option key={preset.id} value={preset.id} className="bg-slate-900 text-slate-200">
                                        {preset.name} ({preset.optical.horizontalFov.toFixed(0)}°×{preset.optical.verticalFov.toFixed(0)}°)
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>

                              <div className="my-1 border-t border-slate-800" />

                              {/* Lock / Unlock Toggle */}
                              <button
                                type="button"
                                onClick={() => {
                                  updateScanner(scanner.id, { isLocked: !scanner.isLocked });
                                  setOpenMenuScannerId(null);
                                }}
                                className="w-full px-2.5 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 transition-colors cursor-pointer"
                              >
                                {scanner.isLocked ? (
                                  <>
                                    <Unlock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                    <span className="text-amber-300 font-semibold">Unlock Settings</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                    <span>Lock Settings</span>
                                  </>
                                )}
                              </button>

                              {/* Duplicate */}
                              <button
                                type="button"
                                onClick={() => {
                                  duplicateScanner(scanner.id);
                                  setOpenMenuScannerId(null);
                                }}
                                className="w-full px-2.5 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 transition-colors cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span>Duplicate</span>
                              </button>

                              <div className="my-1 border-t border-slate-800" />

                              {/* Delete */}
                              <button
                                type="button"
                                disabled={scanner.isLocked}
                                onClick={() => {
                                  removeScanner(scanner.id);
                                  setOpenMenuScannerId(null);
                                }}
                                title={scanner.isLocked ? 'Unlock scanner before deleting' : 'Delete scanner'}
                                className={`w-full px-2.5 py-1.5 text-left flex items-center gap-2 transition-colors cursor-pointer ${
                                  scanner.isLocked
                                    ? 'opacity-40 text-slate-500 cursor-not-allowed'
                                    : 'text-rose-400 hover:bg-rose-950/40 hover:text-rose-300'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Expand / Collapse Chevron */}
                      <button
                        onClick={(e) => toggleExpand(scanner.id, e)}
                        className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Parameter Sliders + Exact Number Inputs */}
                  {isExpanded && (
                    <div className="p-3 pt-2 space-y-3.5 border-t border-slate-800/80 bg-slate-950/40 text-[11px]">

                      {/* POSITION SECTION */}
                      <div className="space-y-2">
                        <div className="font-semibold text-cyan-400 flex items-center justify-between text-[11px] border-b border-slate-800 pb-0.5">
                          <span>Mounting Position ({dimUnit})</span>
                          <span className="font-mono text-[10px] text-slate-400">Relative to Center</span>
                        </div>

                        {/* Pos X */}
                        <NumberSliderInput
                          label="Position X (Along Belt)"
                          tooltip="Offset along the direction of conveyor travel (+X forward, -X backward)."
                          value={toDisplayLength(scanner.position.x, dimUnit)}
                          unit={dimUnit}
                          min={-posRange}
                          max={posRange}
                          step={posStep}
                          disabled={scanner.isLocked}
                          accentColor="accent-cyan-400"
                          onChange={(val) => {
                            updateScanner(scanner.id, {
                              position: { ...scanner.position, x: fromDisplayLength(val, dimUnit) }
                            });
                          }}
                        />

                        {/* Pos Y */}
                        <NumberSliderInput
                          label="Position Y (Height Above Belt)"
                          tooltip="Elevation above conveyor top surface (+Y above belt, negative Y underneath gap)."
                          value={toDisplayLength(scanner.position.y, dimUnit)}
                          unit={dimUnit}
                          min={dimUnit === 'mm' ? -800 : dimUnit === 'in' ? -32 : -0.8}
                          max={dimUnit === 'mm' ? 2400 : dimUnit === 'in' ? 95 : 2.4}
                          step={posStep}
                          disabled={scanner.isLocked}
                          accentColor="accent-cyan-400"
                          onChange={(val) => {
                            updateScanner(scanner.id, {
                              position: { ...scanner.position, y: fromDisplayLength(val, dimUnit) }
                            });
                          }}
                        />

                        {/* Pos Z */}
                        <NumberSliderInput
                          label="Position Z (Across Belt Width)"
                          tooltip="Lateral offset perpendicular to belt. Negative Z is left side, positive Z is right side."
                          value={toDisplayLength(scanner.position.z, dimUnit)}
                          unit={dimUnit}
                          min={-posRange}
                          max={posRange}
                          step={posStep}
                          disabled={scanner.isLocked}
                          accentColor="accent-cyan-400"
                          onChange={(val) => {
                            updateScanner(scanner.id, {
                              position: { ...scanner.position, z: fromDisplayLength(val, dimUnit) }
                            });
                          }}
                        />
                      </div>

                      {/* ROTATION ANGLES */}
                      <div className="space-y-2">
                        <div className="font-semibold text-emerald-400 flex items-center justify-between text-[11px] border-b border-slate-800 pb-0.5">
                          <span>Aiming Angles (Degrees)</span>
                          <span className="font-mono text-[10px] text-slate-400">Euler YXZ</span>
                        </div>

                        {/* Pitch */}
                        <NumberSliderInput
                          label="Pitch (Tilt Up/Down)"
                          tooltip="Vertical tilt angle. -90° points directly down at top face; 0° is horizontal lateral scan."
                          value={scanner.rotation.pitch}
                          unit="°"
                          min={-90}
                          max={90}
                          step={1}
                          precision={0}
                          disabled={scanner.isLocked}
                          accentColor="accent-emerald-400"
                          onChange={(val) => {
                            updateScanner(scanner.id, {
                              rotation: { ...scanner.rotation, pitch: val }
                            });
                          }}
                        />

                        {/* Yaw */}
                        <NumberSliderInput
                          label="Yaw (Heading Azimuth)"
                          tooltip="Azimuth heading rotation. -90° points across from left; +90° points from right; 0° points along belt."
                          value={scanner.rotation.yaw}
                          unit="°"
                          min={-180}
                          max={180}
                          step={1}
                          precision={0}
                          disabled={scanner.isLocked}
                          accentColor="accent-emerald-400"
                          onChange={(val) => {
                            updateScanner(scanner.id, {
                              rotation: { ...scanner.rotation, yaw: val }
                            });
                          }}
                        />

                        {/* Roll */}
                        <NumberSliderInput
                          label="Roll (Axial Twist)"
                          tooltip="Camera sensor rotation around lens axis."
                          value={scanner.rotation.roll}
                          unit="°"
                          min={-180}
                          max={180}
                          step={1}
                          precision={0}
                          disabled={scanner.isLocked}
                          accentColor="accent-emerald-400"
                          onChange={(val) => {
                            updateScanner(scanner.id, {
                              rotation: { ...scanner.rotation, roll: val }
                            });
                          }}
                        />
                      </div>

                      {/* OPTICAL SPECS */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] border-b border-slate-800 pb-1">
                          <span className="font-semibold text-amber-400">Field of View & Focus</span>
                          {/* Segmented Mode Switch */}
                          <div className={`flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono ${
                            scanner.isLocked ? 'opacity-50 pointer-events-none' : ''
                          }`}>
                            <button
                              type="button"
                              disabled={scanner.isLocked}
                              onClick={() => setFovInputMode(prev => ({ ...prev, [scanner.id]: 'angles' }))}
                              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                                (fovInputMode[scanner.id] || (scanner.optical.twoPointCalibration?.enabled ? 'twopoint' : 'angles')) === 'angles'
                                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              Angles (°)
                            </button>
                            <button
                              type="button"
                              disabled={scanner.isLocked}
                              onClick={() => setFovInputMode(prev => ({ ...prev, [scanner.id]: 'twopoint' }))}
                              className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer ${
                                (fovInputMode[scanner.id] || (scanner.optical.twoPointCalibration?.enabled ? 'twopoint' : 'angles')) === 'twopoint'
                                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <Calculator className="w-3 h-3" />
                              <span>2-Point Calc</span>
                            </button>
                          </div>
                        </div>

                        {/* MODE 1: Direct Angles */}
                        {(fovInputMode[scanner.id] || (scanner.optical.twoPointCalibration?.enabled ? 'twopoint' : 'angles')) === 'angles' ? (
                          <>
                            {/* Horizontal FOV */}
                            <NumberSliderInput
                              label="Horizontal FOV (X-Axis)"
                              tooltip="Optical spread angle across camera sensor width. Wider lenses provide larger field coverage."
                              value={scanner.optical.horizontalFov}
                              unit="°"
                              min={25}
                              max={85}
                              step={1}
                              precision={1}
                              disabled={scanner.isLocked}
                              accentColor="accent-amber-400"
                              onChange={(val) => {
                                updateScanner(scanner.id, {
                                  optical: { ...scanner.optical, horizontalFov: val }
                                });
                              }}
                            />

                            {/* Vertical FOV */}
                            <NumberSliderInput
                              label="Vertical FOV (Y-Axis)"
                              tooltip="Optical spread angle across camera sensor height."
                              value={scanner.optical.verticalFov}
                              unit="°"
                              min={20}
                              max={70}
                              step={1}
                              precision={1}
                              disabled={scanner.isLocked}
                              accentColor="accent-amber-400"
                              onChange={(val) => {
                                updateScanner(scanner.id, {
                                  optical: { ...scanner.optical, verticalFov: val }
                                });
                              }}
                            />
                          </>
                        ) : (
                          /* MODE 2: 2-Point Distance Capture Area Calculator */
                          <TwoPointFovCalculator
                            scanner={scanner}
                            dimUnit={dimUnit}
                            disabled={scanner.isLocked}
                            onApply={({ horizontalFov, verticalFov, dofNear, dofFar, calibrationData }) => {
                              updateScanner(scanner.id, {
                                optical: {
                                  ...scanner.optical,
                                  horizontalFov,
                                  verticalFov,
                                  ...(dofNear !== undefined ? { dofNear } : {}),
                                  ...(dofFar !== undefined ? { dofFar } : {}),
                                  twoPointCalibration: calibrationData
                                }
                              });
                            }}
                          />
                        )}

                        {/* DOF Near */}
                        <NumberSliderInput
                          label="DOF Near Limit (Red Zone)"
                          tooltip="Depth of Field Near Limit: Distance where barcodes first enter acceptable optical focus. Closer distances form a red blind spot."
                          value={toDisplayLength(scanner.optical.dofNear, dimUnit)}
                          unit={dimUnit}
                          min={dimUnit === 'mm' ? 100 : dimUnit === 'in' ? 4 : 0.1}
                          max={dofNearMax}
                          step={posStep}
                          disabled={scanner.isLocked}
                          accentColor="accent-rose-400"
                          onChange={(val) => {
                            updateScanner(scanner.id, {
                              optical: { ...scanner.optical, dofNear: fromDisplayLength(val, dimUnit) }
                            });
                          }}
                        />

                        {/* DOF Far */}
                        <NumberSliderInput
                          label="DOF Far Limit (Green Zone End)"
                          tooltip="Depth of Field Far Limit: Maximum distance where barcodes remain in focus. Zones beyond this are rendered yellow/out of focus."
                          value={toDisplayLength(scanner.optical.dofFar, dimUnit)}
                          unit={dimUnit}
                          min={dimUnit === 'mm' ? 300 : dimUnit === 'in' ? 12 : 0.3}
                          max={dofFarMax}
                          step={posStep}
                          disabled={scanner.isLocked}
                          accentColor="accent-emerald-400"
                          onChange={(val) => {
                            updateScanner(scanner.id, {
                              optical: { ...scanner.optical, dofFar: fromDisplayLength(val, dimUnit) }
                            });
                          }}
                        />
                      </div>

                      {/* OPTICAL DEFLECTION MIRROR SECTION */}
                      {(() => {
                        const hasMirror = Boolean(scanner.hasMirror || scanner.mirror?.enabled);
                        const mirrorPath = hasMirror ? computeMirrorFoldedPath(scanner, conveyor.height) : null;
                        const isMirrorAdvOpen = Boolean(expandedMirrorAdvanced[scanner.id]);

                        return (
                          <div className="space-y-2.5 pt-2 border-t border-slate-800">
                            {/* Section Header with Enable/Disable Toggle */}
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-cyan-400">Optical Deflection Mirror</span>
                                <span className="px-1.5 py-0.2 bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[9px] font-mono rounded">
                                  FOLDED PATH
                                </span>
                              </div>
                              <button
                                type="button"
                                disabled={scanner.isLocked}
                                onClick={() => {
                                  if (hasMirror) {
                                    updateScanner(scanner.id, {
                                      hasMirror: false,
                                      mirror: {
                                        ...(scanner.mirror || getDefaultMirrorConfig(scanner)),
                                        enabled: false
                                      }
                                    });
                                  } else {
                                    const defaultCfg = scanner.mirror || getDefaultMirrorConfig(scanner);
                                    updateScanner(scanner.id, {
                                      hasMirror: true,
                                      mirrorWidth: defaultCfg.width,
                                      mirrorHeight: defaultCfg.height,
                                      mirror: {
                                        ...defaultCfg,
                                        enabled: true
                                      }
                                    });
                                  }
                                }}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                                  hasMirror
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-950/40'
                                    : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-slate-300'
                                } ${scanner.isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                              >
                                {hasMirror ? 'MIRROR ACTIVE' : 'NO MIRROR'}
                              </button>
                            </div>

                            {/* MIRROR CONTROLS (Rendered when mirror is enabled) */}
                            {hasMirror && mirrorPath && (
                              <div className="space-y-2.5 p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-900/50">
                                {/* Aperture Status Alert / Warning */}
                                {mirrorPath.isApertureClipped ? (
                                  <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/60 shadow-sm text-[11px] space-y-1.5 animate-pulse">
                                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                                      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                                      <span>Aperture Clipped Warning ({mirrorPath.clippingPercentage}% beam lost)</span>
                                    </div>
                                    <p className="text-[10px] text-amber-200/90 leading-relaxed">
                                      Incoming scanner beam ({Math.round(mirrorPath.beamWidthAtMirror * 1000)} × {Math.round(mirrorPath.beamHeightAtMirror * 1000)} mm) exceeds mirror aperture ({Math.round(mirrorPath.mirrorWidth * 1000)} × {Math.round(mirrorPath.mirrorHeight * 1000)} mm). Excess optical rays are clipped by the physical mirror boundaries.
                                    </p>
                                    <div className="pt-1 flex items-center justify-between">
                                      <button
                                        type="button"
                                        disabled={scanner.isLocked}
                                        onClick={() => {
                                          const fitW = Math.ceil(mirrorPath.beamWidthAtMirror * 1.15 * 100) / 100;
                                          const fitH = Math.ceil(mirrorPath.beamHeightAtMirror * 1.15 * 100) / 100;
                                          updateScanner(scanner.id, {
                                            mirrorWidth: fitW,
                                            mirrorHeight: fitH,
                                            mirror: {
                                              ...(scanner.mirror || getDefaultMirrorConfig(scanner)),
                                              width: fitW,
                                              height: fitH
                                            }
                                          });
                                        }}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 border border-amber-500/50 text-[10px] font-mono font-semibold transition-all cursor-pointer shadow-sm"
                                      >
                                        <Maximize2 className="w-3 h-3" />
                                        <span>Auto-Fit Mirror to FOV (+15%)</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-[10px] text-emerald-300 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 font-semibold">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Aperture 100% Clear</span>
                                    </div>
                                    <span className="font-mono text-emerald-400/80 text-[9px]">
                                      Beam: {Math.round(mirrorPath.beamWidthAtMirror * 1000)}×{Math.round(mirrorPath.beamHeightAtMirror * 1000)} mm
                                    </span>
                                  </div>
                                )}

                                {/* Telemetry Details */}
                                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800">
                                  <div>
                                    <span className="text-slate-500 block text-[9px]">DISTANCE A (LENS→MIRROR)</span>
                                    <span className="text-cyan-300 font-semibold">
                                      {toDisplayLength(mirrorPath.distanceA, dimUnit).toFixed(0)} {dimUnit}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block text-[9px]">COMBINED WORKING DIST</span>
                                    <span className="text-emerald-300 font-semibold">
                                      Dist A + Dist B
                                    </span>
                                  </div>
                                </div>

                                {/* Mirror Width Slider */}
                                <NumberSliderInput
                                  label="Mirror Physical Width"
                                  tooltip="Physical width of the planar mirror aperture."
                                  value={toDisplayLength(scanner.mirror?.width ?? scanner.mirrorWidth ?? 0.25, dimUnit)}
                                  unit={dimUnit}
                                  min={dimUnit === 'mm' ? 50 : dimUnit === 'in' ? 2 : 0.05}
                                  max={dimUnit === 'mm' ? 800 : dimUnit === 'in' ? 32 : 0.8}
                                  step={posStep}
                                  disabled={scanner.isLocked}
                                  accentColor="accent-cyan-400"
                                  onChange={(val) => {
                                    const w = fromDisplayLength(val, dimUnit);
                                    updateScanner(scanner.id, {
                                      mirrorWidth: w,
                                      mirror: {
                                        ...(scanner.mirror || getDefaultMirrorConfig(scanner)),
                                        width: w
                                      }
                                    });
                                  }}
                                />

                                {/* Mirror Height Slider */}
                                <NumberSliderInput
                                  label="Mirror Physical Height"
                                  tooltip="Physical height of the planar mirror aperture."
                                  value={toDisplayLength(scanner.mirror?.height ?? scanner.mirrorHeight ?? 0.20, dimUnit)}
                                  unit={dimUnit}
                                  min={dimUnit === 'mm' ? 50 : dimUnit === 'in' ? 2 : 0.05}
                                  max={dimUnit === 'mm' ? 800 : dimUnit === 'in' ? 32 : 0.8}
                                  step={posStep}
                                  disabled={scanner.isLocked}
                                  accentColor="accent-cyan-400"
                                  onChange={(val) => {
                                    const h = fromDisplayLength(val, dimUnit);
                                    updateScanner(scanner.id, {
                                      mirrorHeight: h,
                                      mirror: {
                                        ...(scanner.mirror || getDefaultMirrorConfig(scanner)),
                                        height: h
                                      }
                                    });
                                  }}
                                />

                                {/* Distance A (Mirror Standoff from Scanner Lens) */}
                                <NumberSliderInput
                                  label="Distance A (Lens Standoff)"
                                  tooltip="Standoff distance along scanner optical boresight from lens to mirror center."
                                  value={toDisplayLength(mirrorPath.distanceA, dimUnit)}
                                  unit={dimUnit}
                                  min={dimUnit === 'mm' ? 100 : dimUnit === 'in' ? 4 : 0.1}
                                  max={dimUnit === 'mm' ? 1200 : dimUnit === 'in' ? 48 : 1.2}
                                  step={posStep}
                                  disabled={scanner.isLocked}
                                  accentColor="accent-cyan-400"
                                  onChange={(val) => {
                                    const distA = fromDisplayLength(val, dimUnit);
                                    const pitchRad = THREE.MathUtils.degToRad(scanner.rotation.pitch);
                                    const yawRad = THREE.MathUtils.degToRad(scanner.rotation.yaw);
                                    const rollRad = THREE.MathUtils.degToRad(scanner.rotation.roll);
                                    const euler = new THREE.Euler(pitchRad, yawRad, rollRad, 'YXZ');
                                    const forward = new THREE.Vector3(0, 0, -1).applyEuler(euler);
                                    const newPos = {
                                      x: Number((scanner.position.x + forward.x * distA).toFixed(3)),
                                      y: Number((scanner.position.y + forward.y * distA).toFixed(3)),
                                      z: Number((scanner.position.z + forward.z * distA).toFixed(3))
                                    };
                                    updateScanner(scanner.id, {
                                      mirror: {
                                        ...(scanner.mirror || getDefaultMirrorConfig(scanner)),
                                        distanceFromScanner: distA,
                                        position: newPos
                                      }
                                    });
                                  }}
                                />

                                {/* Quick Alignment Presets */}
                                <div className="space-y-1 pt-1">
                                  <span className="text-[10px] text-slate-400 font-medium">Quick Deflection Presets</span>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <button
                                      type="button"
                                      disabled={scanner.isLocked}
                                      onClick={() => {
                                        // 90° Downward Fold: deflect optical axis straight down
                                        updateScanner(scanner.id, {
                                          mirror: {
                                            ...(scanner.mirror || getDefaultMirrorConfig(scanner)),
                                            rotation: {
                                              pitch: Number((scanner.rotation.pitch + 45).toFixed(1)),
                                              roll: scanner.rotation.roll,
                                              yaw: scanner.rotation.yaw
                                            }
                                          }
                                        });
                                      }}
                                      className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-cyan-500/50 text-[10px] font-mono text-center transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                      90° Down Fold
                                    </button>
                                    <button
                                      type="button"
                                      disabled={scanner.isLocked}
                                      onClick={() => {
                                        // 45° Lateral Fold
                                        updateScanner(scanner.id, {
                                          mirror: {
                                            ...(scanner.mirror || getDefaultMirrorConfig(scanner)),
                                            rotation: {
                                              pitch: scanner.rotation.pitch,
                                              roll: scanner.rotation.roll,
                                              yaw: Number((scanner.rotation.yaw + 45).toFixed(1))
                                            }
                                          }
                                        });
                                      }}
                                      className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-cyan-500/50 text-[10px] font-mono text-center transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                      45° Lateral Fold
                                    </button>
                                  </div>
                                </div>

                                {/* Advanced 3D Position & Rotation Disclosure */}
                                <div className="pt-1 border-t border-slate-800/80">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setExpandedMirrorAdvanced(prev => ({
                                        ...prev,
                                        [scanner.id]: !prev[scanner.id]
                                      }));
                                    }}
                                    className="flex items-center justify-between w-full text-[10px] font-mono text-slate-400 hover:text-cyan-300 transition-colors py-1 cursor-pointer"
                                  >
                                    <span className="flex items-center gap-1">
                                      <Sliders className="w-3 h-3" />
                                      <span>Advanced Mirror 3D Positioning</span>
                                    </span>
                                    {isMirrorAdvOpen ? (
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  {isMirrorAdvOpen && (
                                    <div className="space-y-2 pt-2 pb-1 text-[10px]">
                                      {/* Mirror Pitch Angle */}
                                      <NumberSliderInput
                                        label="Mirror Pitch Angle"
                                        value={scanner.mirror?.rotation?.pitch ?? Number((scanner.rotation.pitch + 45).toFixed(1))}
                                        unit="°"
                                        min={-90}
                                        max={90}
                                        step={1}
                                        precision={0}
                                        disabled={scanner.isLocked}
                                        accentColor="accent-emerald-400"
                                        onChange={(val) => {
                                          updateScanner(scanner.id, {
                                            mirror: {
                                              ...(scanner.mirror || getDefaultMirrorConfig(scanner)),
                                              rotation: {
                                                pitch: val,
                                                roll: scanner.mirror?.rotation?.roll ?? scanner.rotation.roll,
                                                yaw: scanner.mirror?.rotation?.yaw ?? scanner.rotation.yaw
                                              }
                                            }
                                          });
                                        }}
                                      />

                                      {/* Mirror Yaw Angle */}
                                      <NumberSliderInput
                                        label="Mirror Yaw Angle"
                                        value={scanner.mirror?.rotation?.yaw ?? scanner.rotation.yaw}
                                        unit="°"
                                        min={-180}
                                        max={180}
                                        step={1}
                                        precision={0}
                                        disabled={scanner.isLocked}
                                        accentColor="accent-emerald-400"
                                        onChange={(val) => {
                                          updateScanner(scanner.id, {
                                            mirror: {
                                              ...(scanner.mirror || getDefaultMirrorConfig(scanner)),
                                              rotation: {
                                                pitch: scanner.mirror?.rotation?.pitch ?? Number((scanner.rotation.pitch + 45).toFixed(1)),
                                                roll: scanner.mirror?.rotation?.roll ?? scanner.rotation.roll,
                                                yaw: val
                                              }
                                            }
                                          });
                                        }}
                                      />

                                      {/* Mirror Roll Angle */}
                                      <NumberSliderInput
                                        label="Mirror Roll Angle"
                                        value={scanner.mirror?.rotation?.roll ?? scanner.rotation.roll}
                                        unit="°"
                                        min={-180}
                                        max={180}
                                        step={1}
                                        precision={0}
                                        disabled={scanner.isLocked}
                                        accentColor="accent-emerald-400"
                                        onChange={(val) => {
                                          updateScanner(scanner.id, {
                                            mirror: {
                                              ...(scanner.mirror || getDefaultMirrorConfig(scanner)),
                                              rotation: {
                                                pitch: scanner.mirror?.rotation?.pitch ?? Number((scanner.rotation.pitch + 45).toFixed(1)),
                                                roll: val,
                                                yaw: scanner.mirror?.rotation?.yaw ?? scanner.rotation.yaw
                                              }
                                            }
                                          });
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
