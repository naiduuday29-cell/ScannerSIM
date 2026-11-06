import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Scanner } from '../../types';
import { useSimulator } from '../../context/SimulatorContext';
import { createFrustumSegmentGeometry, createFrustumWireframeGeometry } from '../../utils/math3d';

interface ScannerFrustumProps {
  scanner: Scanner;
}

export const ScannerFrustum: React.FC<ScannerFrustumProps> = ({ scanner }) => {
  const { conveyor, selectedScannerId, setSelectedScannerId, telemetry, viewSettings } = useSimulator();
  const groupRef = useRef<THREE.Group>(null);
  const statusLedMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const isSelected = selectedScannerId === scanner.id;
  const isActivelyReading = telemetry.activeHits.some(h => h.scannerId === scanner.id);

  const { horizontalFov, verticalFov, dofNear, dofFar, maxRange } = scanner.optical;

  // Frustum Geometries (Memoized per optical configuration)
  const nearVolGeom = useMemo(
    () => createFrustumSegmentGeometry(0.04, dofNear, horizontalFov, verticalFov),
    [dofNear, horizontalFov, verticalFov]
  );
  const nearWireGeom = useMemo(
    () => createFrustumWireframeGeometry(0.04, dofNear, horizontalFov, verticalFov),
    [dofNear, horizontalFov, verticalFov]
  );

  const validVolGeom = useMemo(
    () => createFrustumSegmentGeometry(dofNear, dofFar, horizontalFov, verticalFov),
    [dofNear, dofFar, horizontalFov, verticalFov]
  );
  const validWireGeom = useMemo(
    () => createFrustumWireframeGeometry(dofNear, dofFar, horizontalFov, verticalFov),
    [dofNear, dofFar, horizontalFov, verticalFov]
  );

  const farVolGeom = useMemo(
    () => createFrustumSegmentGeometry(dofFar, Math.max(dofFar + 0.3, maxRange), horizontalFov, verticalFov),
    [dofFar, maxRange, horizontalFov, verticalFov]
  );
  const farWireGeom = useMemo(
    () => createFrustumWireframeGeometry(dofFar, Math.max(dofFar + 0.3, maxRange), horizontalFov, verticalFov),
    [dofFar, maxRange, horizontalFov, verticalFov]
  );

  // Position and Euler Rotation
  const worldPos: [number, number, number] = [
    scanner.position.x,
    conveyor.height + scanner.position.y,
    scanner.position.z
  ];

  const rotationEuler = useMemo(() => {
    return new THREE.Euler(
      THREE.MathUtils.degToRad(scanner.rotation.pitch),
      THREE.MathUtils.degToRad(scanner.rotation.yaw),
      THREE.MathUtils.degToRad(scanner.rotation.roll),
      'YXZ'
    );
  }, [scanner.rotation.pitch, scanner.rotation.yaw, scanner.rotation.roll]);

  // Dynamic LED flash during active read
  useFrame((state) => {
    if (statusLedMatRef.current) {
      if (isActivelyReading) {
        const pulse = 0.7 + Math.sin(state.clock.getElapsedTime() * 20) * 0.3;
        statusLedMatRef.current.color.setRGB(0, pulse, 0.4);
      } else {
        statusLedMatRef.current.color.setRGB(0.1, 0.7, 0.9);
      }
    }
  });

  if (!scanner.isActive) return null;

  return (
    <group
      ref={groupRef}
      position={worldPos}
      rotation={rotationEuler}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedScannerId(scanner.id);
      }}
    >
      {/* =========================================================================
          PHYSICAL INDUSTRIAL SCANNER BODY & MOUNT
         ========================================================================= */}
      <group position={[0, 0, 0]}>
        {/* Main Cast Aluminum Enclosure */}
        <mesh castShadow position={[0, 0, 0.08]}>
          <boxGeometry args={[0.08, 0.08, 0.16]} />
          <meshStandardMaterial
            color={isSelected ? '#38bdf8' : '#1e293b'}
            metalness={0.85}
            roughness={0.25}
          />
        </mesh>

        {/* Selected Highlight Outline */}
        {isSelected && (
          <lineSegments position={[0, 0, 0.08]}>
            <edgesGeometry args={[new THREE.BoxGeometry(0.085, 0.085, 0.165)]} />
            <lineBasicMaterial color="#00f0ff" linewidth={2} />
          </lineSegments>
        )}

        {/* Lens Barrel protruding forward towards -Z */}
        <mesh position={[0, 0, -0.015]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.032, 0.04, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.15} />
        </mesh>

        {/* Optical Glass Lens Front Face */}
        <mesh position={[0, 0, -0.036]}>
          <circleGeometry args={[0.025, 24]} />
          <meshStandardMaterial
            color="#0284c7"
            roughness={0.05}
            metalness={0.95}
          />
        </mesh>

        {/* High-Intensity Ring Illuminator (LEDs around lens) */}
        <mesh position={[0, 0, -0.034]} rotation={[0, 0, 0]}>
          <ringGeometry args={[0.026, 0.034, 24]} />
          <meshBasicMaterial
            color={isActivelyReading ? '#ffffff' : '#e0f2fe'}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Scanner Rear Status LED indicator */}
        <mesh position={[0, 0.032, 0.161]}>
          <planeGeometry args={[0.02, 0.015]} />
          <meshBasicMaterial ref={statusLedMatRef} color="#00f0ff" side={THREE.DoubleSide} />
        </mesh>

        {/* Swivel Mount Bracket */}
        <mesh position={[0, 0.055, 0.08]}>
          <boxGeometry args={[0.03, 0.04, 0.05]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Optical Sightline Center Axis Ray */}
        {viewSettings.showOpticalRays && (
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([0, 0, 0, 0, 0, -dofFar])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineDashedMaterial
              color={isActivelyReading ? '#10b981' : '#64748b'}
              dashSize={0.05}
              gapSize={0.03}
              transparent
              opacity={0.65}
            />
          </lineSegments>
        )}
      </group>

      {/* =========================================================================
          VISION CONES / FIELD OF VIEW (FOV) & DEPTH OF FIELD (DOF) VOLUMES
         ========================================================================= */}
      {viewSettings.showFrustums && (() => {
        const coneFactor = viewSettings.visionConeOpacity ?? 0.35;
        const dofFactor = viewSettings.dofZoneOpacity ?? 0.45;
        const scaleFactor = coneFactor / 0.35;

        return (
          <group>
            {/* ZONE 1: Too Close / Blind Spot (Near Limit) - RED */}
            {viewSettings.showDofZones && (
              <group>
                {!viewSettings.showWireframe && (
                  <mesh geometry={nearVolGeom}>
                    <meshBasicMaterial
                      color="#ef4444"
                      transparent
                      opacity={Math.min(1.0, 0.25 * dofFactor * scaleFactor)}
                      depthWrite={false}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                )}
                <lineSegments geometry={nearWireGeom}>
                  <lineBasicMaterial
                    color="#ef4444"
                    transparent
                    opacity={Math.min(1.0, 0.5 * coneFactor + 0.2)}
                  />
                </lineSegments>
              </group>
            )}

            {/* ZONE 2: VALID READING ZONE (Near to Far Limit) - SEMI-TRANSPARENT GREEN */}
            <group>
              {!viewSettings.showWireframe && (
                <mesh geometry={validVolGeom}>
                  <meshBasicMaterial
                    color={isActivelyReading ? '#10b981' : (viewSettings.showDofZones ? '#22c55e' : scanner.color)}
                    transparent
                    opacity={Math.min(
                      1.0,
                      (isActivelyReading ? 0.8 : isSelected ? 0.55 : 0.4) * dofFactor * scaleFactor
                    )}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              )}
              <lineSegments geometry={validWireGeom}>
                <lineBasicMaterial
                  color={isActivelyReading ? '#34d399' : (viewSettings.showDofZones ? '#10b981' : scanner.color)}
                  transparent
                  opacity={Math.min(1.0, (isActivelyReading ? 0.98 : 0.75) * scaleFactor)}
                  linewidth={isSelected ? 2 : 1}
                />
              </lineSegments>
            </group>

            {/* ZONE 3: Out of Focus (Far Limit to Max Range) - YELLOW / GREY */}
            {viewSettings.showDofZones && (
              <group>
                {!viewSettings.showWireframe && (
                  <mesh geometry={farVolGeom}>
                    <meshBasicMaterial
                      color="#eab308"
                      transparent
                      opacity={Math.min(1.0, 0.18 * dofFactor * scaleFactor)}
                      depthWrite={false}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                )}
                <lineSegments geometry={farWireGeom}>
                  <lineBasicMaterial
                    color="#ca8a04"
                    transparent
                    opacity={Math.min(1.0, 0.45 * coneFactor + 0.15)}
                  />
                </lineSegments>
              </group>
            )}
          </group>
        );
      })()}
    </group>
  );
};
