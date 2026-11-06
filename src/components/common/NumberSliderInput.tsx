import React from 'react';
import { Tooltip } from './Tooltip';

interface NumberSliderInputProps {
  label: string;
  tooltip?: string;
  value: number; // in current display units
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  precision?: number;
  accentColor?: string; // e.g. 'accent-cyan-400', 'accent-emerald-400'
}

export const NumberSliderInput: React.FC<NumberSliderInputProps> = ({
  label,
  tooltip,
  value,
  onChange,
  min,
  max,
  step = 0.01,
  unit = '',
  precision = 2,
  accentColor = 'accent-cyan-400'
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-slate-300">
        <span className="flex items-center gap-1 font-medium">
          <span>{label}</span>
          {tooltip && <Tooltip content={tooltip} />}
        </span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            step={step}
            value={Number(value.toFixed(precision))}
            onChange={handleInputChange}
            className="w-16 bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-cyan-400 rounded px-1.5 py-0.5 text-right font-mono text-cyan-300 text-xs focus:outline-none transition-colors"
          />
          {unit && <span className="text-[10px] text-slate-400 font-mono w-5">{unit}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`flex-1 ${accentColor} bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer`}
        />
      </div>
    </div>
  );
};
