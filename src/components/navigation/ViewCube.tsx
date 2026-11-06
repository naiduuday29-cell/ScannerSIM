import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulator } from '../../context/SimulatorContext';
import { cameraSyncState } from '../../utils/cameraSync';
import { Compass, Eye, RotateCcw } from 'lucide-react';

type FaceName = 'TOP' | 'BOTTOM' | 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT';

interface CubeFaceDef {
  name: FaceName;
  position: [number, number, number];
  rotation: [number, number, number];
}

const CUBE_FACES: CubeFaceDef[] = [
  { name: 'RIGHT',  position: [0, 0, 0.505],  rotation: [0, 0, 0] },
  { name: 'LEFT',   position: [0, 0, -0.505], rotation: [0, Math.PI, 0] },
  { name: 'FRONT',  position: [0.505, 0, 0],  rotation: [0, Math.PI / 2, 0] },
  { name: 'BACK',   position: [-0.505, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  { name: 'TOP',    position: [0, 0.505, 0],  rotation: [-Math.PI / 2, 0, 0] },
  { name: 'BOTTOM', position: [0, -0.505, 0], rotation: [Math.PI / 2, 0, 0] },
];

function createFaceTexture(label: string, isHovered: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = isHovered ? '#0284c7' : '#1e293b';
  ctx.fillRect(0, 0, 256, 256);

  // Border
  ctx.strokeStyle = isHovered ? '#38bdf8' : '#334155';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 244, 244);

  // Subtle cross grid
  ctx.strokeStyle = isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(100,116,139,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(128, 16); ctx.lineTo(128, 240);
  ctx.moveTo(16, 128); ctx.lineTo(240, 128);
  ctx.stroke();

  // Text
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 44px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Inner 3D Cube that mirrors main camera's rotation
const ViewCubeModel: React.FC<{
  hoveredFace: FaceName | null;
  setHoveredFace: (face: FaceName | null) => void;
  onFaceClick: (face: FaceName) => void;
}> = ({ hoveredFace, setHoveredFace, onFaceClick }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Cache textures for normal and hovered states
  const textures = useMemo(() => {
    const map: Record<string, THREE.CanvasTexture> = {};
    for (const f of CUBE_FACES) {
      map[`${f.name}_normal`] = createFaceTexture(f.name, false);
      map[`${f.name}_hover`] = createFaceTexture(f.name, true);
    }
    return map;
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      // Invert main camera's rotation quaternion so cube stays oriented with world
      groupRef.current.quaternion.copy(cameraSyncState.quaternion).invert();
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Solid Cube */}
      <mesh>
        <boxGeometry args={[0.99, 0.99, 0.99]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* 6 Clickable Faces */}
      {CUBE_FACES.map((face) => {
        const isHover = hoveredFace === face.name;
        const texture = textures[`${face.name}_${isHover ? 'hover' : 'normal'}`];

        return (
          <mesh
            key={face.name}
            position={face.position}
            rotation={face.rotation}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredFace(face.name);
            }}
            onPointerOut={() => {
              setHoveredFace(null);
            }}
            onClick={(e) => {
              e.stopPropagation();
              onFaceClick(face.name);
            }}
          >
            <planeGeometry args={[0.96, 0.96]} />
            <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
          </mesh>
        );
      })}

      {/* Chamfered Edge Line Accents */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.0, 1.0, 1.0)]} />
        <lineBasicMaterial color="#00f0ff" linewidth={1.5} transparent opacity={0.6} />
      </lineSegments>

      {/* World Origin Axes in Center */}
      <axesHelper args={[0.6]} />
    </group>
  );
};

export const ViewCube: React.FC = () => {
  const { snapCameraTo, snapCameraToAngles } = useSimulator();
  const [hoveredFace, setHoveredFace] = useState<FaceName | null>(null);

  // Local angle inputs
  const [pitchInput, setPitchInput] = useState<number>(35);
  const [yawInput, setYawInput] = useState<number>(45);

  // Sync inputs with main camera movement
  useEffect(() => {
    const unsubscribe = () => {
      // Keep inputs somewhat in sync when user orbits
      setPitchInput(cameraSyncState.pitchDeg);
      setYawInput(cameraSyncState.yawDeg);
    };
    cameraSyncState.listeners.add(unsubscribe);
    return () => {
      cameraSyncState.listeners.delete(unsubscribe);
    };
  }, []);

  const handleApplyAngles = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    snapCameraToAngles(Number(pitchInput), Number(yawInput));
  };

  return (
    <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2 pointer-events-auto">
      {/* View Cube 3D Canvas Box */}
      <div className="relative w-36 h-36 bg-industrial-900/90 backdrop-blur-md rounded-xl border border-slate-700/60 shadow-2xl p-1 flex items-center justify-center overflow-hidden group">
        {/* Subtle coordinate label */}
        <div className="absolute top-1.5 left-2 z-10 flex items-center gap-1 text-[10px] font-mono text-slate-400 select-none">
          <Compass className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
          <span>NAV CUBE</span>
        </div>

        {/* Hovered Face Badge */}
        {hoveredFace && (
          <div className="absolute bottom-1 left-2 z-10 text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
            {hoveredFace}
          </div>
        )}

        {/* Isometric Snap Button in corner */}
        <button
          onClick={() => snapCameraTo('ISOMETRIC')}
          title="Snap to Isometric View"
          className="absolute top-1.5 right-1.5 z-10 p-1 text-slate-400 hover:text-cyan-400 bg-slate-800/70 hover:bg-slate-700 rounded transition-all"
        >
          <RotateCcw className="w-3 h-3" />
        </button>

        {/* The Isolated Secondary Three.js Canvas */}
        <Canvas
          className="w-full h-full cursor-pointer"
          camera={{ position: [0, 0, 2.7], fov: 32 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={1.2} />
          <directionalLight position={[3, 5, 4]} intensity={1.5} />
          <ViewCubeModel
            hoveredFace={hoveredFace}
            setHoveredFace={setHoveredFace}
            onFaceClick={(face) => snapCameraTo(face)}
          />
        </Canvas>
      </div>

      {/* Floating Precise Engineering Angle Inputs & Quick Snaps */}
      <div className="bg-industrial-900/90 backdrop-blur-md rounded-xl border border-slate-700/60 shadow-xl p-2.5 w-48 text-xs font-mono text-slate-300">
        <form onSubmit={handleApplyAngles} className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 border-b border-slate-800 pb-1">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Camera Angle</span>
            </span>
            <button
              type="submit"
              className="text-[10px] bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/40 transition-colors"
            >
              Apply
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Pitch (°)</label>
              <input
                type="number"
                min="-89"
                max="89"
                value={pitchInput}
                onChange={(e) => setPitchInput(Number(e.target.value))}
                className="w-full bg-slate-950/80 border border-slate-700 rounded px-1.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Yaw (°)</label>
              <input
                type="number"
                min="-180"
                max="180"
                value={yawInput}
                onChange={(e) => setYawInput(Number(e.target.value))}
                className="w-full bg-slate-950/80 border border-slate-700 rounded px-1.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </form>

        {/* Quick Viewport Presets */}
        <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-800/80 mt-2">
          {(['TOP', 'FRONT', 'LEFT', 'TUNNEL'] as const).map((view) => (
            <button
              key={view}
              onClick={() => snapCameraTo(view)}
              className="text-[9px] font-bold text-slate-400 hover:text-cyan-300 bg-slate-800/60 hover:bg-slate-800 py-1 rounded transition-colors text-center"
            >
              {view === 'TUNNEL' ? 'TUNL' : view}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
