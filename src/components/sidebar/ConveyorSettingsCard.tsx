import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Gauge } from 'lucide-react';
import { useSimulator } from '../../context/SimulatorContext';
import { NumberSliderInput } from '../common/NumberSliderInput';
import {
  toDisplayLength,
  fromDisplayLength,
  toDisplaySpeed,
  fromDisplaySpeed
} from '../../utils/units';

export const ConveyorSettingsCard: React.FC = () => {
  const { conveyor, updateConveyor, units } = useSimulator();
  // Collapsed at opening as requested
  const [isOpen, setIsOpen] = useState(false);

  const dimUnit = units.dimension;
  const spdUnit = units.speed;

  // Limits based on unit
  const maxL = dimUnit === 'mm' ? 12000 : dimUnit === 'in' ? 480 : 12.0;
  const minL = dimUnit === 'mm' ? 1500 : dimUnit === 'in' ? 60 : 1.5;
  const stepL = dimUnit === 'mm' ? 100 : dimUnit === 'in' ? 5 : 0.1;

  const maxW = dimUnit === 'mm' ? 2400 : dimUnit === 'in' ? 95 : 2.4;
  const minW = dimUnit === 'mm' ? 400 : dimUnit === 'in' ? 16 : 0.4;
  const stepW = dimUnit === 'mm' ? 20 : dimUnit === 'in' ? 1 : 0.05;

  const maxH = dimUnit === 'mm' ? 1800 : dimUnit === 'in' ? 70 : 1.8;
  const minH = dimUnit === 'mm' ? 300 : dimUnit === 'in' ? 12 : 0.3;
  const stepH = dimUnit === 'mm' ? 20 : dimUnit === 'in' ? 1 : 0.05;

  const maxSpeed = spdUnit === 'm/min' ? 240 : spdUnit === 'mm/s' ? 4000 : spdUnit === 'ft/min' ? 800 : 4.0;
  const minSpeed = spdUnit === 'm/min' ? 6 : spdUnit === 'mm/s' ? 100 : spdUnit === 'ft/min' ? 20 : 0.1;
  const stepSpeed = spdUnit === 'm/min' ? 5 : spdUnit === 'mm/s' ? 50 : spdUnit === 'ft/min' ? 10 : 0.05;

  return (
    <div className="bg-gradient-to-b from-emerald-950/40 via-industrial-900/90 to-slate-900/90 rounded-xl border border-emerald-500/35 hover:border-emerald-500/60 shadow-md shadow-emerald-950/20 overflow-hidden transition-all">
      {/* Card Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-emerald-950/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-900/40">
            <Gauge className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-bold text-emerald-200 tracking-wide font-mono uppercase">
              Conveyor Settings
            </h3>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-semibold border border-emerald-500/30">
              BELT
            </span>
          </div>
        </div>
        <div className="text-emerald-400/80">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Card Body */}
      {isOpen && (
        <div className="p-3.5 pt-1 space-y-3 border-t border-emerald-900/40 text-xs">
          {/* Belt Speed */}
          <NumberSliderInput
            label="Belt Speed"
            tooltip="Physical transport velocity of the conveyor belt. Determines parcel exposure duration inside scanner vision cones."
            value={toDisplaySpeed(conveyor.beltSpeed, spdUnit)}
            unit={spdUnit}
            min={minSpeed}
            max={maxSpeed}
            step={stepSpeed}
            precision={spdUnit === 'm/s' ? 2 : 1}
            accentColor="accent-emerald-400"
            onChange={(val) => updateConveyor({ beltSpeed: fromDisplaySpeed(val, spdUnit) })}
          />

          {/* Width */}
          <NumberSliderInput
            label="Belt Width (Z-Axis)"
            tooltip="Width of the conveyor belt bed. Influences the required lateral spread angle for overhead and lateral vision cones."
            value={toDisplayLength(conveyor.width, dimUnit)}
            unit={dimUnit}
            min={minW}
            max={maxW}
            step={stepW}
            accentColor="accent-emerald-400"
            onChange={(val) => updateConveyor({ width: fromDisplayLength(val, dimUnit) })}
          />

          {/* Length */}
          <NumberSliderInput
            label="Conveyor Length (X-Axis)"
            tooltip="Total travel length of the conveyor. Sets simulation travel cycle."
            value={toDisplayLength(conveyor.length, dimUnit)}
            unit={dimUnit}
            min={minL}
            max={maxL}
            step={stepL}
            accentColor="accent-emerald-400"
            onChange={(val) => updateConveyor({ length: fromDisplayLength(val, dimUnit) })}
          />

          {/* Bed Elevation */}
          <NumberSliderInput
            label="Bed Elevation (Height Above Floor)"
            tooltip="Height of the conveyor top surface above floor level datum."
            value={toDisplayLength(conveyor.height, dimUnit)}
            unit={dimUnit}
            min={minH}
            max={maxH}
            step={stepH}
            accentColor="accent-emerald-400"
            onChange={(val) => updateConveyor({ height: fromDisplayLength(val, dimUnit) })}
          />
        </div>
      )}
    </div>
  );
};
