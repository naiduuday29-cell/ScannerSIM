import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { DimensionUnit, OpticalTwoPointCalibration, Scanner } from '../../types';
import { toDisplayLength, fromDisplayLength } from '../../utils/units';
import { calculateFovFromTwoDistancePoints } from '../../utils/math3d';

interface TwoPointFovCalculatorProps {
  scanner: Scanner;
  dimUnit: DimensionUnit;
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

  // When dimUnit changes, re-scale display values
  useEffect(() => {
    setD1(toDisplayLength(initD1, dimUnit));
    setW1(toDisplayLength(initW1, dimUnit));
    setH1(toDisplayLength(initH1, dimUnit));
    setD2(toDisplayLength(initD2, dimUnit));
    setW2(toDisplayLength(initW2, dimUnit));
    setH2(toDisplayLength(initH2, dimUnit));
  }, [dimUnit]);

  // Convert inputs to meters (SI base) for mathematical calculation
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

  // Automatically apply calculated FOV & DOF in real-time as user types/adjusts inputs
  useEffect(() => {
    if (!calcResult.isValid) return;

    const currentH = scanner.optical.horizontalFov;
    const currentV = scanner.optical.verticalFov;
    const currentNear = scanner.optical.dofNear;
    const currentFar = scanner.optical.dofFar;

    const anglesChanged =
      Math.abs(currentH - calcResult.horizontalFovDeg) > 0.05 ||
      Math.abs(currentV - calcResult.verticalFovDeg) > 0.05;

    const dofChanged =
      Math.abs(currentNear - d1Meters) > 0.005 || Math.abs(currentFar - d2Meters) > 0.005;

    if (anglesChanged || dofChanged || !scanner.optical.twoPointCalibration?.enabled) {
      onApply({
        horizontalFov: calcResult.horizontalFovDeg,
        verticalFov: calcResult.verticalFovDeg,
        dofNear: d1Meters > 0 ? d1Meters : undefined,
        dofFar: d2Meters > 0 ? d2Meters : undefined,
        calibrationData: {
          enabled: true,
          d1: d1Meters,
          w1: w1Meters,
          h1: h1Meters,
          d2: d2Meters,
          w2: w2Meters,
          h2: h2Meters,
          syncDof: true
        }
      });
    }
  }, [d1, w1, h1, d2, w2, h2, dimUnit, calcResult.isValid, calcResult.horizontalFovDeg, calcResult.verticalFovDeg]);

  return (
    <div className="bg-slate-950/80 rounded-xl border border-cyan-500/30 p-2.5 space-y-2.5 text-xs">
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
              onChange={(e) => setD1(parseFloat(e.target.value) || 0)}
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
              onChange={(e) => setW1(parseFloat(e.target.value) || 0)}
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
              onChange={(e) => setH1(parseFloat(e.target.value) || 0)}
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
              onChange={(e) => setD2(parseFloat(e.target.value) || 0)}
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
              onChange={(e) => setW2(parseFloat(e.target.value) || 0)}
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
              onChange={(e) => setH2(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
