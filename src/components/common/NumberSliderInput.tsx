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
  disabled?: boolean;
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
  accentColor = 'accent-cyan-400',
  disabled = false
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <div className={`space-y-1 transition-opacity ${disabled ? 'opacity-50 pointer-events-none select-none' : ''}`}>
      <div className="flex items-center justify-between text-[11px] text-slate-300">
        <span className="flex items-center gap-1 font-medium">
          <span>{label}</span>
          {tooltip && <Tooltip content={tooltip} />}
        </span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            step={step}
            disabled={disabled}
            value={Number(value.toFixed(precision))}
            onChange={handleInputChange}
            className={`w-16 bg-slate-900 border rounded px-1.5 py-0.5 text-right font-mono text-xs focus:outline-none transition-colors ${
              disabled
                ? 'border-slate-800 text-slate-500 bg-slate-950 cursor-not-allowed'
                : 'border-slate-700 hover:border-slate-600 focus:border-cyan-400 text-cyan-300'
            }`}
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
          disabled={disabled}
          value={value}
          onChange={(e) => !disabled && onChange(parseFloat(e.target.value))}
          className={`flex-1 ${accentColor} bg-slate-800 h-1.5 rounded-lg appearance-none ${
            disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
          }`}
        />
      </div>
    </div>
  );
};
