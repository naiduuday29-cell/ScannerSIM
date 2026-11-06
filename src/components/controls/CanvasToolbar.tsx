import React from 'react';
import {
  Cone,
  Palette,
  Box,
  Spline,
  GitCommit,
  Radio,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import { useSimulator } from '../../context/SimulatorContext';

export const CanvasToolbar: React.FC = () => {
  const { viewSettings, updateViewSettings, snapCameraTo } = useSimulator();

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const buttons = [
    {
      id: 'frustums',
      label: 'Vision Cones',
      active: viewSettings.showFrustums,
      icon: <Cone className="w-3.5 h-3.5" />,
      onClick: () => updateViewSettings({ showFrustums: !viewSettings.showFrustums })
    },
    {
      id: 'dof',
      label: 'DOF Zones',
      active: viewSettings.showDofZones,
      icon: <Palette className="w-3.5 h-3.5" />,
      onClick: () => updateViewSettings({ showDofZones: !viewSettings.showDofZones })
    },
    {
      id: 'wireframe',
      label: 'Wireframe',
      active: viewSettings.showWireframe,
      icon: <Box className="w-3.5 h-3.5" />,
      onClick: () => updateViewSettings({ showWireframe: !viewSettings.showWireframe })
    },
    {
      id: 'trail',
      label: 'Trajectory Trail',
      active: viewSettings.showTrajectoryTrail,
      icon: <Spline className="w-3.5 h-3.5" />,
      onClick: () => updateViewSettings({ showTrajectoryTrail: !viewSettings.showTrajectoryTrail })
    },
    {
      id: 'gantry',
      label: 'Gantry Portal',
      active: viewSettings.showGantryStructure,
      icon: <GitCommit className="w-3.5 h-3.5" />,
      onClick: () => updateViewSettings({ showGantryStructure: !viewSettings.showGantryStructure })
    },
    {
      id: 'rays',
      label: 'Optical Sightlines',
      active: viewSettings.showOpticalRays,
      icon: <Radio className="w-3.5 h-3.5" />,
      onClick: () => updateViewSettings({ showOpticalRays: !viewSettings.showOpticalRays })
    }
  ];

  return (
    <div className="absolute top-4 left-4 z-30 pointer-events-auto flex items-center gap-1.5 bg-industrial-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-xl text-xs">
      {buttons.map((btn) => (
        <button
          key={btn.id}
          onClick={btn.onClick}
          title={btn.label}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all ${
            btn.active
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          {btn.icon}
          <span className="hidden md:inline">{btn.label}</span>
        </button>
      ))}

      <div className="w-px h-4 bg-slate-800 mx-1" />

      {/* Camera Reset */}
      <button
        onClick={() => snapCameraTo('ISOMETRIC')}
        title="Reset Camera View to Isometric"
        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      {/* Fullscreen */}
      <button
        onClick={handleFullscreen}
        title="Toggle Fullscreen"
        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
