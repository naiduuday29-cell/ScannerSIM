import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useSimulator } from '../../context/SimulatorContext';
import { updateMainCameraState } from '../../utils/cameraSync';
import { SceneEnvironment } from './SceneEnvironment';
import { ConveyorModel } from './ConveyorModel';
import { CartonModel } from './CartonModel';
import { TyreModel } from './TyreModel';
import { ScannerFrustum } from './ScannerFrustum';
import { GantryStructure } from './GantryStructure';
import { TrajectoryTrail } from './TrajectoryTrail';

const CameraSyncController: React.FC = () => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { cameraSnap, conveyor } = useSimulator();

  // Animation target state for lerping
  const animRef = useRef<{
    active: boolean;
    targetPos: THREE.Vector3;
    targetLook: THREE.Vector3;
    speed: number;
  }>({
    active: false,
    targetPos: new THREE.Vector3(),
    targetLook: new THREE.Vector3(),
    speed: 6.0
  });

  // When cameraSnap changes, kick off smooth interpolation
  useEffect(() => {
    if (cameraSnap) {
      animRef.current.active = true;
      animRef.current.targetPos.set(...cameraSnap.position);
      animRef.current.targetLook.set(...cameraSnap.target);
    }
  }, [cameraSnap]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (animRef.current.active) {
      const step = Math.min(1.0, animRef.current.speed * delta);
      camera.position.lerp(animRef.current.targetPos, step);
      controls.target.lerp(animRef.current.targetLook, step);

      // Check if arrived within tolerance
      const distPos = camera.position.distanceTo(animRef.current.targetPos);
      const distTarget = controls.target.distanceTo(animRef.current.targetLook);
      if (distPos < 0.02 && distTarget < 0.02) {
        camera.position.copy(animRef.current.targetPos);
        controls.target.copy(animRef.current.targetLook);
        animRef.current.active = false;
      }
      controls.update();
    }

    // Broadcast current main camera orientation to View Cube overlay
    updateMainCameraState(camera.quaternion, camera.position, controls.target);
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      minDistance={0.8}
      maxDistance={24.0}
      target={[0, conveyor.height * 0.9, 0]}
    />
  );
};

export const MainCanvas: React.FC = () => {
  const { scanners, conveyor, partType, viewSettings } = useSimulator();
  const isWhiteEnv = viewSettings.environmentType === 'open_white';
  const bgColor = isWhiteEnv ? '#ffffff' : '#c5cdd8';

  return (
    <div className={`w-full h-full relative overflow-hidden ${isWhiteEnv ? 'bg-white' : 'bg-[#c5cdd8]'}`}>
      <Canvas
        shadows
        camera={{
          position: [conveyor.length * 0.75, conveyor.height + 2.2, conveyor.width * 2.8],
          fov: 45,
          near: 0.1,
          far: 60
        }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false
        }}
      >
        {/* Dynamic Studio White or Warehouse Shed Background */}
        <color attach="background" args={[bgColor]} />

        <CameraSyncController />
        <SceneEnvironment />
        <ConveyorModel />
        {partType === 'tyre' ? <TyreModel /> : <CartonModel />}
        <GantryStructure />
        <TrajectoryTrail />

        {/* Scanner Frustums */}
        {scanners.map((scanner) => (
          <ScannerFrustum key={scanner.id} scanner={scanner} />
        ))}
      </Canvas>
    </div>
  );
};
