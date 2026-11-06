import React from 'react';
import {
  Ruler,
  Zap,
  Sun,
  Grid,
  Layers,
  Warehouse,
  Maximize2,
  Sliders
} from 'lucide-react';
import { useSimulator } from '../../context/SimulatorContext';
import { DimensionUnit, SpeedUnit } from '../../types';
import { Tooltip } from '../common/Tooltip';
import { NumberSliderInput } from '../common/NumberSliderInput';

export const EnvironmentSettingsCard: React.FC = () => {
  const { units, updateUnits, viewSettings, updateViewSettings } = useSimulator();

  const dimensionUnits: { id: DimensionUnit; label: string; desc: string }[] = [
    { id: 'm', label: 'Meters (m)', desc: 'Standard SI metric unit' },
    { id: 'mm', label: 'Millimeters (mm)', desc: 'Precision industrial mechanical CAD' },
    { id: 'in', label: 'Inches (in)', desc: 'US Imperial warehousing standard' }
  ];

  const speedUnits: { id: SpeedUnit; label: string }[] = [
    { id: 'm/s', label: 'm/s' },
    { id: 'm/min', label: 'm/min' },
    { id: 'mm/s', label: 'mm/s' },
    { id: 'ft/min', label: 'ft/min (FPM)' }
  ];

  return (
    <div className="bg-industrial-900/80 rounded-xl border border-slate-800/80 shadow-md p-3.5 space-y-3.5 text-xs">
      {/* =========================================================================
          1. DIMENSION UNIT
         ========================================================================= */}
      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium text-[11px]">
            <Ruler className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-bold">Dimension Unit</span>
            <Tooltip content="Changes all length, position, and parcel dimensions across inputs, sliders, and telemetry readouts." />
          </span>
          <span className="text-[10px] font-mono text-purple-300 uppercase font-semibold">
            {units.dimension}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {dimensionUnits.map((u) => (
            <button
              key={u.id}
              onClick={() => updateUnits({ dimension: u.id })}
              className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium border transition-all ${
                units.dimension === u.id
                  ? 'bg-purple-500/20 border-purple-500/70 text-purple-200 font-bold shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          2. SPEED UNIT
         ========================================================================= */}
      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium text-[11px]">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-bold">Speed Unit</span>
            <Tooltip content="Velocity format for conveyor belt travel." />
          </span>
          <span className="text-[10px] font-mono text-purple-300 uppercase font-semibold">
            {units.speed}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {speedUnits.map((sp) => (
            <button
              key={sp.id}
              onClick={() => updateUnits({ speed: sp.id })}
              className={`py-1.5 px-1 rounded-lg text-[11px] font-mono border transition-all text-center ${
                units.speed === sp.id
                  ? 'bg-purple-500/20 border-purple-500/70 text-purple-200 font-bold shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {sp.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          3. FLOOR MATERIAL
         ========================================================================= */}
      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-1.5 text-slate-300 font-medium">
          <span className="flex items-center gap-1.5 font-bold text-[11px]">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Floor Material</span>
            <Tooltip content="Switch between pure bright studio white floor and authentic grey warehouse concrete flooring with expansion cuts and power-trowel finish." />
          </span>
          <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
            {viewSettings.floorType}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => updateViewSettings({ floorType: 'white' })}
            className={`flex items-center justify-center gap-2 py-1.5 px-2 rounded-lg font-mono text-xs font-bold border transition-all ${
              viewSettings.floorType === 'white'
                ? 'bg-slate-100 border-white text-slate-900 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-white border border-slate-400" />
            <span>White Floor</span>
          </button>

          <button
            onClick={() => updateViewSettings({ floorType: 'gray' })}
            className={`flex items-center justify-center gap-2 py-1.5 px-2 rounded-lg font-mono text-xs font-bold border transition-all ${
              viewSettings.floorType === 'gray'
                ? 'bg-slate-700/70 border-cyan-500/80 text-cyan-200 font-bold shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-slate-400 border border-slate-500" />
            <span>Gray Concrete</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          4. ENVIRONMENT THEME
         ========================================================================= */}
      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-1.5 text-slate-300 font-medium">
          <span className="flex items-center gap-1.5 font-bold text-[11px]">
            <Warehouse className="w-3.5 h-3.5 text-emerald-400" />
            <span>Environment Theme</span>
            <Tooltip content="Choose between an open minimalist white studio space or a realistic pre-engineered industrial warehouse shed enclosure with corrugated walls, roof trusses, and high-bay UFO LED lighting." />
          </span>
          <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">
            {viewSettings.environmentType === 'open_white' ? 'Open White' : 'Warehouse Shed'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => updateViewSettings({ environmentType: 'open_white' })}
            className={`flex items-center justify-center gap-2 py-1.5 px-2 rounded-lg font-mono text-xs font-bold border transition-all ${
              viewSettings.environmentType === 'open_white'
                ? 'bg-cyan-500/20 border-cyan-500/80 text-cyan-300 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Open White</span>
          </button>

          <button
            onClick={() => updateViewSettings({ environmentType: 'warehouse_shed' })}
            className={`flex items-center justify-center gap-2 py-1.5 px-2 rounded-lg font-mono text-xs font-bold border transition-all ${
              viewSettings.environmentType === 'warehouse_shed'
                ? 'bg-emerald-500/20 border-emerald-500/80 text-emerald-300 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5" />
            <span>Warehouse Shed</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          5. FLOOR GRIDLOCK
         ========================================================================= */}
      <div
        onClick={() => updateViewSettings({ showFloorGrid: !viewSettings.showFloorGrid })}
        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
      >
        <div className="flex items-center gap-2.5">
          <Grid className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-[11px] font-bold text-slate-200">
              Floor Gridlock
            </div>
            <div className="text-[9px] text-slate-400">
              Coordinate engineering reference grid on floor
            </div>
          </div>
        </div>

        {/* Toggle Pill Switch */}
        <div
          className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center ${
            viewSettings.showFloorGrid ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
        </div>
      </div>

      {/* =========================================================================
          6. LIGHTING & ENVIRONMENT BRIGHTNESS
         ========================================================================= */}
      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium text-[11px]">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">Lighting & Brightness</span>
          </span>
          <span className="font-mono text-amber-300 font-bold text-[11px]">
            {(viewSettings.environmentBrightness || 1.6).toFixed(1)}×
          </span>
        </div>

        <NumberSliderInput
          label="Ambiance Intensity"
          tooltip="Adjust overall lighting and ambient exposure in the 3D WebGL viewport."
          value={viewSettings.environmentBrightness || 1.6}
          min={0.8}
          max={2.5}
          step={0.1}
          precision={1}
          unit="×"
          accentColor="accent-amber-400"
          onChange={(val) => updateViewSettings({ environmentBrightness: val })}
        />
      </div>

      {/* =========================================================================
          7. LAYER TRANSPARENCY
         ========================================================================= */}
      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Layer Transparency</span>
          </span>
          <button
            onClick={() =>
              updateViewSettings({
                gantryOpacity: 1.0,
                conveyorOpacity: 1.0,
                visionConeOpacity: 0.35,
                dofZoneOpacity: 0.45,
                trajectoryTrailOpacity: 0.85
              })
            }
            className="text-[10px] text-cyan-400 hover:text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/80 transition-colors"
            title="Reset all opacities to factory defaults"
          >
            Reset Opacity
          </button>
        </div>

        {/* Gantry Opacity */}
        <NumberSliderInput
          label="Gantry Structure Opacity"
          tooltip="Adjusts visibility of the aluminum gantry frame (lower to see through to internal scanners and package belt)."
          value={Math.round((viewSettings.gantryOpacity ?? 1.0) * 100)}
          unit="%"
          min={5}
          max={100}
          step={5}
          precision={0}
          accentColor="accent-blue-400"
          onChange={(val) => updateViewSettings({ gantryOpacity: val / 100 })}
        />

        {/* Conveyor Opacity */}
        <NumberSliderInput
          label="Conveyor Belt Opacity"
          tooltip="Adjusts visibility of the conveyor bed and rails (lower to see underside scanners and roller gaps)."
          value={Math.round((viewSettings.conveyorOpacity ?? 1.0) * 100)}
          unit="%"
          min={5}
          max={100}
          step={5}
          precision={0}
          accentColor="accent-emerald-400"
          onChange={(val) => updateViewSettings({ conveyorOpacity: val / 100 })}
        />

        {/* Vision Cone Opacity */}
        <NumberSliderInput
          label="Vision Cone (FOV) Opacity"
          tooltip="Adjusts opacity of 3D optical field of view projection volumes."
          value={Math.round((viewSettings.visionConeOpacity ?? 0.35) * 100)}
          unit="%"
          min={5}
          max={100}
          step={5}
          precision={0}
          accentColor="accent-cyan-400"
          onChange={(val) => updateViewSettings({ visionConeOpacity: val / 100 })}
        />

        {/* DOF Zone Opacity */}
        <NumberSliderInput
          label="DOF Zone Color Opacity"
          tooltip="Adjusts density of Green (in-focus), Red (near limit), and Yellow (far limit) optical zones."
          value={Math.round((viewSettings.dofZoneOpacity ?? 0.45) * 100)}
          unit="%"
          min={5}
          max={100}
          step={5}
          precision={0}
          accentColor="accent-amber-400"
          onChange={(val) => updateViewSettings({ dofZoneOpacity: val / 100 })}
        />

        {/* Trajectory Trail Opacity */}
        <NumberSliderInput
          label="Trajectory Trail Opacity"
          tooltip="Adjusts intensity of the motion trajectory coverage ribbon and beacon spheres."
          value={Math.round((viewSettings.trajectoryTrailOpacity ?? 0.85) * 100)}
          unit="%"
          min={5}
          max={100}
          step={5}
          precision={0}
          accentColor="accent-purple-400"
          onChange={(val) => updateViewSettings({ trajectoryTrailOpacity: val / 100 })}
        />
      </div>
    </div>
  );
};
