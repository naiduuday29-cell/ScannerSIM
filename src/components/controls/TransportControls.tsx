import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Repeat,
  Gauge
} from 'lucide-react';
import { useSimulator } from '../../context/SimulatorContext';
import { toDisplayLength } from '../../utils/units';

export const TransportControls: React.FC = () => {
  const {
    motion,
    setMotionPlaying,
    setMotionProgress,
    setSpeedMultiplier,
    toggleLooping,
    resetMotion,
    stepMotion,
    conveyor,
    units
  } = useSimulator();

  const dimUnit = units.dimension;
  const halfDisp = toDisplayLength(conveyor.length / 2, dimUnit);
  const currentDisp = toDisplayLength(motion.currentX, dimUnit);

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMotionProgress(val);
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="bg-industrial-900/90 backdrop-blur-md rounded-2xl border border-slate-700/60 shadow-2xl px-4 py-2.5 flex flex-col gap-2 min-w-[320px] sm:min-w-[420px] md:min-w-[500px]">
        {/* Timeline Scrubber & Position Telemetry */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
            -{halfDisp.toFixed(dimUnit === 'mm' ? 0 : 1)}{dimUnit}
          </span>

          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.005"
              value={motion.progress}
              onChange={handleScrubberChange}
              className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
            +{halfDisp.toFixed(dimUnit === 'mm' ? 0 : 1)}{dimUnit}
          </span>

          {/* Current Position Tag */}
          <div className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 font-bold min-w-[80px] text-center">
            {currentDisp >= 0 ? `+${currentDisp.toFixed(dimUnit === 'mm' ? 0 : 2)}` : currentDisp.toFixed(dimUnit === 'mm' ? 0 : 2)} {dimUnit}
          </div>
        </div>

        {/* Main Buttons Row */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/70">
          {/* Left: Reset & Step */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={resetMotion}
              title="Reset to Conveyor Start"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => stepMotion(-0.15)}
              title="Step Backward (0.15m)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>
          </div>

          {/* Center: Big Play/Pause Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMotionPlaying(!motion.isPlaying)}
              className={`px-5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-mono font-bold transition-all shadow-lg ${
                motion.isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
              }`}
            >
              {motion.isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>RUN PASS</span>
                </>
              )}
            </button>
          </div>

          {/* Right: Step Forward, Loop, Speed */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => stepMotion(0.15)}
              title="Step Forward (0.15m)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Loop Toggle */}
            <button
              onClick={toggleLooping}
              title={motion.isLooping ? 'Continuous Loop: ON' : 'Single Pass: OFF'}
              className={`p-1.5 rounded-lg transition-colors ${
                motion.isLooping
                  ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-800'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Repeat className="w-4 h-4" />
            </button>

            {/* Speed Multiplier Pill */}
            <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5 text-[10px] font-mono">
              {[0.5, 1, 2].map((sp) => (
                <button
                  key={sp}
                  onClick={() => setSpeedMultiplier(sp)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    motion.speedMultiplier === sp
                      ? 'bg-cyan-500/30 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sp}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
