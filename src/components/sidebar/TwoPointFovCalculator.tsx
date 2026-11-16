import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { DimensionUnit, OpticalTwoPointCalibration, Scanner } from '../../types';
import { toDisplayLength, fromDisplayLength } from '../../utils/units';
import { calculateFovFromTwoDistancePoints } from '../../utils/math3d';

interface TwoPointFovCalculatorProps {
  scanner: Scanner;
  dimUnit: DimensionUnit;
  disabled?: boolean;
  onApply: (params: {
    horizontalFov: number;
    verticalFov: number;
    dofNear?: number;
    dofFar?: number;
    calibrationData: OpticalTwoPointCalibration;
  }) => void;
}

export const TwoPointFovCalculator: React.FC<TwoPointFovCalculatorProps> = ({
  scanner,
  dimUnit,
  disabled = false,
  onApply
}) => {
  // Existing calibration or compute defaults from current angles & DOF
  const existing = scanner.optical.twoPointCalibration;

  const initD1 = existing?.d1 ?? (scanner.optical.dofNear || 0.6);
  const initD2 = existing?.d2 ?? (scanner.optical.dofFar || 1.8);

  const hRad = THREE.MathUtils.degToRad(scanner.optical.horizontalFov);
  const vRad = THREE.MathUtils.degToRad(scanner.optical.verticalFov);

  const initW1 = existing?.w1 ?? (2 * initD1 * Math.tan(hRad / 2));
  const initH1 = existing?.h1 ?? (2 * initD1 * Math.tan(vRad / 2));
  const initW2 = existing?.w2 ?? (2 * initD2 * Math.tan(hRad / 2));
  const initH2 = existing?.h2 ?? (2 * initD2 * Math.tan(vRad / 2));

  // Local display values
  const [d1, setD1] = useState<number>(toDisplayLength(initD1, dimUnit));
  const [w1, setW1] = useState<number>(toDisplayLength(initW1, dimUnit));
  const [h1, setH1] = useState<number>(toDisplayLength(initH1, dimUnit));

  const [d2, setD2] = useState<number>(toDisplayLength(initD2, dimUnit));
  const [w2, setW2] = useState<number>(toDisplayLength(initW2, dimUnit));
  const [h2, setH2] = useState<number>(toDisplayLength(initH2, dimUnit));

  // Keep D1 and D2 local display inputs synchronized when scanner.optical.dofNear / dofFar
  // or twoPointCalibration change externally (e.g. from the DOF sliders in ScannerDeploymentCard)
  useEffect(() => {
    const curNearM = scanner.optical.dofNear;
    const curFarM = scanner.optical.dofFar;
    const cal = scanner.optical.twoPointCalibration;

    const targetD1M = cal?.d1 ?? curNearM;
    const targetD2M = cal?.d2 ?? curFarM;

    setD1(prev => {
      const currentM = fromDisplayLength(Number(prev) || 0, dimUnit);
      if (Math.abs(currentM - targetD1M) > 0.001) {
        return toDisplayLength(targetD1M, dimUnit);
      }
      return prev;
    });

    setD2(prev => {
      const currentM = fromDisplayLength(Number(prev) || 0, dimUnit);
      if (Math.abs(currentM - targetD2M) > 0.001) {
        return toDisplayLength(targetD2M, dimUnit);
      }
      return prev;
    });
  }, [scanner.optical.dofNear, scanner.optical.dofFar, scanner.optical.twoPointCalibration, dimUnit]);

  // When dimUnit changes, re-scale display values from SI meters
  useEffect(() => {
    const cal = scanner.optical.twoPointCalibration;
    const curD1M = cal?.d1 ?? (scanner.optical.dofNear || 0.6);
    const curD2M = cal?.d2 ?? (scanner.optical.dofFar || 1.8);
    const hR = THREE.MathUtils.degToRad(scanner.optical.horizontalFov);
    const vR = THREE.MathUtils.degToRad(scanner.optical.verticalFov);

    const curW1M = cal?.w1 ?? (2 * curD1M * Math.tan(hR / 2));
    const curH1M = cal?.h1 ?? (2 * curD1M * Math.tan(vR / 2));
    const curW2M = cal?.w2 ?? (2 * curD2M * Math.tan(hR / 2));
    const curH2M = cal?.h2 ?? (2 * curD2M * Math.tan(vR / 2));

    setD1(toDisplayLength(curD1M, dimUnit));
    setW1(toDisplayLength(curW1M, dimUnit));
    setH1(toDisplayLength(curH1M, dimUnit));
    setD2(toDisplayLength(curD2M, dimUnit));
    setW2(toDisplayLength(curW2M, dimUnit));
    setH2(toDisplayLength(curH2M, dimUnit));
  }, [dimUnit]);

  // Handle direct user edits to any of the 6 fields and apply only on actual user change
  const handleFieldChange = (field: 'd1' | 'w1' | 'h1' | 'd2' | 'w2' | 'h2', rawVal: number) => {
    const val = isNaN(rawVal) ? 0 : rawVal;
    const nextD1 = field === 'd1' ? val : d1;
    const nextW1 = field === 'w1' ? val : w1;
    const nextH1 = field === 'h1' ? val : h1;
    const nextD2 = field === 'd2' ? val : d2;
    const nextW2 = field === 'w2' ? val : w2;
    const nextH2 = field === 'h2' ? val : h2;

    if (field === 'd1') setD1(val);
    else if (field === 'w1') setW1(val);
    else if (field === 'h1') setH1(val);
    else if (field === 'd2') setD2(val);
    else if (field === 'w2') setW2(val);
    else if (field === 'h2') setH2(val);

    const nextD1M = fromDisplayLength(Number(nextD1) || 0, dimUnit);
    const nextW1M = fromDisplayLength(Number(nextW1) || 0, dimUnit);
    const nextH1M = fromDisplayLength(Number(nextH1) || 0, dimUnit);
    const nextD2M = fromDisplayLength(Number(nextD2) || 0, dimUnit);
    const nextW2M = fromDisplayLength(Number(nextW2) || 0, dimUnit);
    const nextH2M = fromDisplayLength(Number(nextH2) || 0, dimUnit);

    const res = calculateFovFromTwoDistancePoints(nextD1M, nextW1M, nextH1M, nextD2M, nextW2M, nextH2M);
    if (res.isValid) {
      onApply({
        horizontalFov: res.horizontalFovDeg,
        verticalFov: res.verticalFovDeg,
        dofNear: nextD1M > 0 ? nextD1M : scanner.optical.dofNear,
        dofFar: nextD2M > 0 ? nextD2M : scanner.optical.dofFar,
        calibrationData: {
          enabled: true,
          d1: nextD1M > 0 ? nextD1M : scanner.optical.dofNear,
          w1: nextW1M,
          h1: nextH1M,
          d2: nextD2M > 0 ? nextD2M : scanner.optical.dofFar,
          w2: nextW2M,
          h2: nextH2M,
          syncDof: true
        }
      });
    }
  };

  // Convert inputs to meters for display readout
  const d1Meters = fromDisplayLength(Number(d1) || 0, dimUnit);
  const w1Meters = fromDisplayLength(Number(w1) || 0, dimUnit);
  const h1Meters = fromDisplayLength(Number(h1) || 0, dimUnit);
  const d2Meters = fromDisplayLength(Number(d2) || 0, dimUnit);
  const w2Meters = fromDisplayLength(Number(w2) || 0, dimUnit);
  const h2Meters = fromDisplayLength(Number(h2) || 0, dimUnit);

  const calcResult = calculateFovFromTwoDistancePoints(
    d1Meters,
    w1Meters,
    h1Meters,
    d2Meters,
    w2Meters,
    h2Meters
  );

  return (
    <div className={`bg-slate-950/80 rounded-xl border border-cyan-500/30 p-2.5 space-y-2.5 text-xs transition-opacity ${
      disabled ? 'opacity-50 pointer-events-none select-none' : ''
    }`}>
      {/* Near distance */}
      <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-slate-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Near distance
          </span>
          <span className="text-[9px] font-mono text-slate-400">Unit: {dimUnit}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[9px] text-slate-400 font-mono block mb-0.5">
              Distance (D1)
            </label>
            <input
              type="number"
              min="0"
              step={dimUnit === 'mm' ? 10 : 0.05}
              value={d1}
              onChange={(e) => handleFieldChange('d1', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[9px] text-slate-400 font-mono block mb-0.5">
              Width X (W1)
            </label>
            <input
              type="number"
              min="0"
              step={dimUnit === 'mm' ? 10 : 0.05}
              value={w1}
              onChange={(e) => handleFieldChange('w1', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[9px] text-slate-400 font-mono block mb-0.5">
              Height Y (H1)
            </label>
            <input
              type="number"
              min="0"
              step={dimUnit === 'mm' ? 10 : 0.05}
              value={h1}
              onChange={(e) => handleFieldChange('h1', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Far distance */}
      <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-slate-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Far distance
          </span>
          <span className="text-[9px] font-mono text-slate-400">Unit: {dimUnit}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[9px] text-slate-400 font-mono block mb-0.5">
              Distance (D2)
            </label>
            <input
              type="number"
              min="0"
              step={dimUnit === 'mm' ? 10 : 0.05}
              value={d2}
              onChange={(e) => handleFieldChange('d2', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[9px] text-slate-400 font-mono block mb-0.5">
              Width X (W2)
            </label>
            <input
              type="number"
              min="0"
              step={dimUnit === 'mm' ? 10 : 0.05}
              value={w2}
              onChange={(e) => handleFieldChange('w2', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[9px] text-slate-400 font-mono block mb-0.5">
              Height Y (H2)
            </label>
            <input
              type="number"
              min="0"
              step={dimUnit === 'mm' ? 10 : 0.05}
              value={h2}
              onChange={(e) => handleFieldChange('h2', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Readout */}
      {calcResult.isValid && (
        <div className="bg-slate-900/60 px-2 py-1.5 rounded border border-slate-800 flex items-center justify-between text-[10px] font-mono text-cyan-300">
          <span>H-FOV: {calcResult.horizontalFovDeg.toFixed(1)}°</span>
          <span>V-FOV: {calcResult.verticalFovDeg.toFixed(1)}°</span>
          <span className="text-slate-400">Span: {toDisplayLength(Math.max(0, d2Meters - d1Meters), dimUnit)} {dimUnit}</span>
        </div>
      )}
    </div>
  );
};
