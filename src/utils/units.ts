import { DimensionUnit, SpeedUnit } from '../types';

/**
 * Length conversions (Base SI unit is meters)
 */
export function toDisplayLength(meters: number, unit: DimensionUnit): number {
  switch (unit) {
    case 'mm':
      return Math.round(meters * 1000 * 10) / 10;
    case 'in':
      return Math.round(meters * 39.3701 * 100) / 100;
    case 'm':
    default:
      return Math.round(meters * 1000) / 1000;
  }
}

export function fromDisplayLength(val: number, unit: DimensionUnit): number {
  if (isNaN(val)) return 0;
  switch (unit) {
    case 'mm':
      return val / 1000;
    case 'in':
      return val / 39.3701;
    case 'm':
    default:
      return val;
  }
}

export function formatLength(meters: number, unit: DimensionUnit, decimals = 2): string {
  const disp = toDisplayLength(meters, unit);
  return `${disp.toFixed(unit === 'mm' ? 0 : decimals)} ${unit}`;
}

/**
 * Speed conversions (Base SI unit is m/s)
 */
export function toDisplaySpeed(mps: number, unit: SpeedUnit): number {
  switch (unit) {
    case 'm/min':
      return Math.round(mps * 60 * 10) / 10;
    case 'mm/s':
      return Math.round(mps * 1000);
    case 'ft/min':
      return Math.round(mps * 196.85);
    case 'm/s':
    default:
      return Math.round(mps * 100) / 100;
  }
}

export function fromDisplaySpeed(val: number, unit: SpeedUnit): number {
  if (isNaN(val)) return 0;
  switch (unit) {
    case 'm/min':
      return val / 60;
    case 'mm/s':
      return val / 1000;
    case 'ft/min':
      return val / 196.85;
    case 'm/s':
    default:
      return val;
  }
}

export function formatSpeed(mps: number, unit: SpeedUnit): string {
  const disp = toDisplaySpeed(mps, unit);
  return `${disp} ${unit}`;
}
