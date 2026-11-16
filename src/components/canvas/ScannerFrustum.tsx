import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Scanner } from '../../types';
import { useSimulator } from '../../context/SimulatorContext';
import {
  createFrustumSegmentGeometry,
  createFrustumWireframeGeometry,
  createReflectedFrustumSegmentGeometry,
  createReflectedFrustumWireframeGeometry,
  computeMirrorFoldedPath
} from '../../utils/math3d';

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

  // Compute Folded Optical Path if mirror enabled
  const mirrorPath = useMemo(() => {
    return computeMirrorFoldedPath(scanner, conveyor.height);
  }, [scanner, conveyor.height]);

  // Direct Scanning Frustum Geometries (Used when mirror is NOT enabled)
  const directNearVolGeom = useMemo(
    () => (!mirrorPath ? createFrustumSegmentGeometry(0.04, dofNear, horizontalFov, verticalFov) : null),
    [mirrorPath, dofNear, horizontalFov, verticalFov]
  );
  const directNearWireGeom = useMemo(
    () => (!mirrorPath ? createFrustumWireframeGeometry(0.04, dofNear, horizontalFov, verticalFov) : null),
    [mirrorPath, dofNear, horizontalFov, verticalFov]
  );
  const directValidVolGeom = useMemo(
    () => (!mirrorPath ? createFrustumSegmentGeometry(dofNear, dofFar, horizontalFov, verticalFov) : null),
    [mirrorPath, dofNear, dofFar, horizontalFov, verticalFov]
  );
  const directValidWireGeom = useMemo(
    () => (!mirrorPath ? createFrustumWireframeGeometry(dofNear, dofFar, horizontalFov, verticalFov) : null),
    [mirrorPath, dofNear, dofFar, horizontalFov, verticalFov]
  );
  const directFarVolGeom = useMemo(
    () => (!mirrorPath ? createFrustumSegmentGeometry(dofFar, Math.max(dofFar + 0.3, maxRange), horizontalFov, verticalFov) : null),
    [mirrorPath, dofFar, maxRange, horizontalFov, verticalFov]
  );
  const directFarWireGeom = useMemo(
    () => (!mirrorPath ? createFrustumWireframeGeometry(dofFar, Math.max(dofFar + 0.3, maxRange), horizontalFov, verticalFov) : null),
    [mirrorPath, dofFar, maxRange, horizontalFov, verticalFov]
  );

  // Primary Frustum Geometries (Lens to Mirror surface, up to distanceA)
  const primaryGeometries = useMemo(() => {
    if (!mirrorPath) return null;
    const dA = mirrorPath.distanceA;

    // Red zone: from 0.04 to min(dA, dofNear)
    const redEnd = Math.min(dA, dofNear);
    const hasRed = redEnd > 0.04;
    const nearVol = hasRed ? createFrustumSegmentGeometry(0.04, redEnd, horizontalFov, verticalFov) : null;
    const nearWire = hasRed ? createFrustumWireframeGeometry(0.04, redEnd, horizontalFov, verticalFov) : null;

    // Green zone: if dA > dofNear, from dofNear to min(dA, dofFar)
    const greenStart = dofNear;
    const greenEnd = Math.min(dA, dofFar);
    const hasGreen = dA > dofNear && greenEnd > greenStart;
    const validVol = hasGreen ? createFrustumSegmentGeometry(greenStart, greenEnd, horizontalFov, verticalFov) : null;
    const validWire = hasGreen ? createFrustumWireframeGeometry(greenStart, greenEnd, horizontalFov, verticalFov) : null;

    // Yellow zone: if dA > dofFar, from dofFar to dA
    const yellowStart = dofFar;
    const yellowEnd = dA;
    const hasYellow = dA > dofFar && yellowEnd > yellowStart;
    const farVol = hasYellow ? createFrustumSegmentGeometry(yellowStart, yellowEnd, horizontalFov, verticalFov) : null;
    const farWire = hasYellow ? createFrustumWireframeGeometry(yellowStart, yellowEnd, horizontalFov, verticalFov) : null;

    return {
      nearVol,
      nearWire,
      validVol,
      validWire,
      farVol,
      farWire
    };
  }, [mirrorPath, horizontalFov, verticalFov, dofNear, dofFar]);

  // Secondary Reflected Frustum Geometries (Clamped to Mirror Aperture)
  const reflectedGeometries = useMemo(() => {
    if (!mirrorPath) return null;
    const dA = mirrorPath.distanceA;
    const wBase = mirrorPath.clampedBaseWidth;
    const hBase = mirrorPath.clampedBaseHeight;

    // 1. Reflected Red Zone: Distance A + s < dofNear => s < dofNear - dA
    const hasRed = dA < dofNear;
    const redEnd = Math.max(0, dofNear - dA);
    const nearVol = hasRed ? createReflectedFrustumSegmentGeometry(0, redEnd, dA, wBase, hBase) : null;
    const nearWire = hasRed ? createReflectedFrustumWireframeGeometry(0, redEnd, dA, wBase, hBase) : null;

    // 2. Reflected Green Zone: dofNear <= Distance A + s <= dofFar
    const greenStart = Math.max(0, dofNear - dA);
    const greenEnd = Math.max(0, dofFar - dA);
    const hasGreen = greenEnd > greenStart;
    const validVol = hasGreen ? createReflectedFrustumSegmentGeometry(greenStart, greenEnd, dA, wBase, hBase) : null;
    const validWire = hasGreen ? createReflectedFrustumWireframeGeometry(greenStart, greenEnd, dA, wBase, hBase) : null;

    // 3. Reflected Yellow Zone: Distance A + s > dofFar
    const yellowStart = Math.max(0, dofFar - dA);
    const yellowEnd = Math.max(yellowStart + 0.3, maxRange - dA);
    const hasYellow = yellowEnd > yellowStart;
    const farVol = hasYellow ? createReflectedFrustumSegmentGeometry(yellowStart, yellowEnd, dA, wBase, hBase) : null;
    const farWire = hasYellow ? createReflectedFrustumWireframeGeometry(yellowStart, yellowEnd, dA, wBase, hBase) : null;

    return {
      nearVol,
      nearWire,
      validVol,
      validWire,
      farVol,
      farWire,
      maxReflectedDist: yellowEnd
    };
  }, [mirrorPath, dofNear, dofFar, maxRange]);

  // Position and Euler Rotation for Scanner Enclosure
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

  const coneFactor = viewSettings.visionConeOpacity ?? 0.35;
  const dofFactor = viewSettings.dofZoneOpacity ?? 0.45;
  const scaleFactor = coneFactor / 0.35;

  return (
    <>
      {/* =========================================================================
          SCANNER BODY & PRIMARY BEAM (LOCAL COORD FRAME)
         ========================================================================= */}
      <group
        ref={groupRef}
        position={worldPos}
        rotation={rotationEuler}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedScannerId(scanner.id);
        }}
      >
        {/* Physical Industrial Scanner Enclosure */}
        <group position={[0, 0, 0]}>
          <mesh castShadow position={[0, 0, 0.08]}>
            <boxGeometry args={[0.08, 0.08, 0.16]} />
            <meshStandardMaterial
              color={isSelected ? '#38bdf8' : '#1e293b'}
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>

          {isSelected && (
            <lineSegments position={[0, 0, 0.08]}>
              <edgesGeometry args={[new THREE.BoxGeometry(0.085, 0.085, 0.165)]} />
              <lineBasicMaterial color="#00f0ff" linewidth={2} />
            </lineSegments>
          )}

          <mesh position={[0, 0, -0.015]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.028, 0.032, 0.04, 24]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.15} />
          </mesh>

          <mesh position={[0, 0, -0.036]}>
            <circleGeometry args={[0.025, 24]} />
            <meshStandardMaterial color="#0284c7" roughness={0.05} metalness={0.95} />
          </mesh>

          <mesh position={[0, 0, -0.034]} rotation={[0, 0, 0]}>
            <ringGeometry args={[0.026, 0.034, 24]} />
            <meshBasicMaterial
              color={isActivelyReading ? '#ffffff' : '#e0f2fe'}
              side={THREE.DoubleSide}
            />
          </mesh>

          <mesh position={[0, 0.032, 0.161]}>
            <planeGeometry args={[0.02, 0.015]} />
            <meshBasicMaterial ref={statusLedMatRef} color="#00f0ff" side={THREE.DoubleSide} />
          </mesh>

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
                  array={new Float32Array([
                    0, 0, 0,
                    0, 0, -(mirrorPath ? mirrorPath.distanceA : dofFar)
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineDashedMaterial
                color={isActivelyReading ? '#10b981' : mirrorPath ? '#38bdf8' : '#64748b'}
                dashSize={0.05}
                gapSize={0.03}
                transparent
                opacity={0.7}
              />
            </lineSegments>
          )}
        </group>

        {/* --- Primary Frustum Volume / Wireframe --- */}
        {viewSettings.showFrustums && (
          <group>
            {/* If Mirror Enabled: Render primary beam up to mirror */}
            {mirrorPath && primaryGeometries ? (
              <group>
                {/* Primary Red Zone */}
                {viewSettings.showDofZones && primaryGeometries.nearVol && (
                  <group>
                    {!viewSettings.showWireframe && (
                      <mesh geometry={primaryGeometries.nearVol}>
                        <meshBasicMaterial
                          color="#ef4444"
                          transparent
                          opacity={Math.min(1.0, 0.25 * dofFactor * scaleFactor)}
                          depthWrite={false}
                          side={THREE.DoubleSide}
                        />
                      </mesh>
                    )}
                    {primaryGeometries.nearWire && (
                      <lineSegments geometry={primaryGeometries.nearWire}>
                        <lineBasicMaterial
                          color="#ef4444"
                          transparent
                          opacity={Math.min(1.0, 0.5 * coneFactor + 0.2)}
                        />
                      </lineSegments>
                    )}
                  </group>
                )}

                {/* Primary Green Zone */}
                {primaryGeometries.validVol && (
                  <group>
                    {!viewSettings.showWireframe && (
                      <mesh geometry={primaryGeometries.validVol}>
                        <meshBasicMaterial
                          color={isActivelyReading ? '#10b981' : (viewSettings.showDofZones ? '#22c55e' : scanner.color)}
                          transparent
                          opacity={Math.min(1.0, (isActivelyReading ? 0.8 : isSelected ? 0.55 : 0.4) * dofFactor * scaleFactor)}
                          depthWrite={false}
                          side={THREE.DoubleSide}
                        />
                      </mesh>
                    )}
                    {primaryGeometries.validWire && (
                      <lineSegments geometry={primaryGeometries.validWire}>
                        <lineBasicMaterial
                          color={isActivelyReading ? '#34d399' : (viewSettings.showDofZones ? '#10b981' : scanner.color)}
                          transparent
                          opacity={Math.min(1.0, (isActivelyReading ? 0.98 : 0.75) * scaleFactor)}
                          linewidth={isSelected ? 2 : 1}
                        />
                      </lineSegments>
                    )}
                  </group>
                )}

                {/* Primary Yellow Zone */}
                {viewSettings.showDofZones && primaryGeometries.farVol && (
                  <group>
                    {!viewSettings.showWireframe && (
                      <mesh geometry={primaryGeometries.farVol}>
                        <meshBasicMaterial
                          color="#eab308"
                          transparent
                          opacity={Math.min(1.0, 0.18 * dofFactor * scaleFactor)}
                          depthWrite={false}
                          side={THREE.DoubleSide}
                        />
                      </mesh>
                    )}
                    {primaryGeometries.farWire && (
                      <lineSegments geometry={primaryGeometries.farWire}>
                        <lineBasicMaterial
                          color="#ca8a04"
                          transparent
                          opacity={Math.min(1.0, 0.45 * coneFactor + 0.15)}
                        />
                      </lineSegments>
                    )}
                  </group>
                )}
              </group>
            ) : (
              /* Direct Scanning Frustum (No mirror) */
              <group>
                {viewSettings.showDofZones && directNearVolGeom && (
                  <group>
                    {!viewSettings.showWireframe && (
                      <mesh geometry={directNearVolGeom}>
                        <meshBasicMaterial
                          color="#ef4444"
                          transparent
                          opacity={Math.min(1.0, 0.25 * dofFactor * scaleFactor)}
                          depthWrite={false}
                          side={THREE.DoubleSide}
                        />
                      </mesh>
                    )}
                    {directNearWireGeom && (
                      <lineSegments geometry={directNearWireGeom}>
                        <lineBasicMaterial
                          color="#ef4444"
                          transparent
                          opacity={Math.min(1.0, 0.5 * coneFactor + 0.2)}
                        />
                      </lineSegments>
                    )}
                  </group>
                )}

                {directValidVolGeom && (
                  <group>
                    {!viewSettings.showWireframe && (
                      <mesh geometry={directValidVolGeom}>
                        <meshBasicMaterial
                          color={isActivelyReading ? '#10b981' : (viewSettings.showDofZones ? '#22c55e' : scanner.color)}
                          transparent
                          opacity={Math.min(1.0, (isActivelyReading ? 0.8 : isSelected ? 0.55 : 0.4) * dofFactor * scaleFactor)}
                          depthWrite={false}
                          side={THREE.DoubleSide}
                        />
                      </mesh>
                    )}
                    {directValidWireGeom && (
                      <lineSegments geometry={directValidWireGeom}>
                        <lineBasicMaterial
                          color={isActivelyReading ? '#34d399' : (viewSettings.showDofZones ? '#10b981' : scanner.color)}
                          transparent
                          opacity={Math.min(1.0, (isActivelyReading ? 0.98 : 0.75) * scaleFactor)}
                          linewidth={isSelected ? 2 : 1}
                        />
                      </lineSegments>
                    )}
                  </group>
                )}

                {viewSettings.showDofZones && directFarVolGeom && (
                  <group>
                    {!viewSettings.showWireframe && (
                      <mesh geometry={directFarVolGeom}>
                        <meshBasicMaterial
                          color="#eab308"
                          transparent
                          opacity={Math.min(1.0, 0.18 * dofFactor * scaleFactor)}
                          depthWrite={false}
                          side={THREE.DoubleSide}
                        />
                      </mesh>
                    )}
                    {directFarWireGeom && (
                      <lineSegments geometry={directFarWireGeom}>
                        <lineBasicMaterial
                          color="#ca8a04"
                          transparent
                          opacity={Math.min(1.0, 0.45 * coneFactor + 0.15)}
                        />
                      </lineSegments>
                    )}
                  </group>
                )}
              </group>
            )}
          </group>
        )}
      </group>

      {/* =========================================================================
          OPTICAL DEFLECTION MIRROR & SECONDARY REFLECTED FRUSTUM
         ========================================================================= */}
      {mirrorPath && (
        <group>
          {/* Mirror Physical Assembly (Metallic Reflective Surface + Frame + Mount) */}
          <group
            position={[mirrorPath.mirrorPos.x, mirrorPath.mirrorPos.y, mirrorPath.mirrorPos.z]}
            rotation={mirrorPath.mirrorRotationEuler}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedScannerId(scanner.id);
            }}
          >
            {/* Front Surface Reflective Metallic Plane */}
            <mesh>
              <planeGeometry args={[mirrorPath.mirrorWidth, mirrorPath.mirrorHeight]} />
              <meshStandardMaterial
                color="#e2e8f0"
                metalness={0.96}
                roughness={0.06}
                envMapIntensity={1.8}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Mirror Frame / Backing Plate */}
            <mesh position={[0, 0, -0.004]}>
              <boxGeometry args={[mirrorPath.mirrorWidth + 0.014, mirrorPath.mirrorHeight + 0.014, 0.008]} />
              <meshStandardMaterial
                color={isSelected ? '#0369a1' : '#1e293b'}
                metalness={0.8}
                roughness={0.3}
              />
            </mesh>

            {/* Mirror Swivel Mount Pivot Socket */}
            <mesh position={[0, 0, -0.015]}>
              <boxGeometry args={[0.035, 0.035, 0.018]} />
              <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Mirror Mounting Arm / Bracket */}
            <mesh position={[0, mirrorPath.mirrorHeight / 2 + 0.015, -0.015]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 0.03, 16]} />
              <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Aperture Boundary Outline (Orange Warning when clipped, Cyan when 100% OK) */}
            <lineSegments>
              <edgesGeometry args={[new THREE.PlaneGeometry(mirrorPath.mirrorWidth, mirrorPath.mirrorHeight)]} />
              <lineBasicMaterial
                color={mirrorPath.isApertureClipped ? '#f59e0b' : '#38bdf8'}
                linewidth={mirrorPath.isApertureClipped ? 3 : 1}
                opacity={mirrorPath.isApertureClipped ? 1.0 : 0.6}
                transparent
              />
            </lineSegments>
          </group>

          {/* Secondary Reflected Frustum Cone (Color-coded by combined Distance A + B) */}
          {viewSettings.showFrustums && reflectedGeometries && (
            <group
              position={[mirrorPath.mirrorPos.x, mirrorPath.mirrorPos.y, mirrorPath.mirrorPos.z]}
              rotation={mirrorPath.reflectedRotation}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedScannerId(scanner.id);
              }}
            >
              {/* Reflected Sightline Center Axis Ray */}
              {viewSettings.showOpticalRays && (
                <lineSegments>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      count={2}
                      array={new Float32Array([
                        0, 0, 0,
                        0, 0, -reflectedGeometries.maxReflectedDist
                      ])}
                      itemSize={3}
                    />
                  </bufferGeometry>
                  <lineDashedMaterial
                    color={isActivelyReading ? '#10b981' : '#38bdf8'}
                    dashSize={0.05}
                    gapSize={0.03}
                    transparent
                    opacity={0.8}
                  />
                </lineSegments>
              )}

              {/* Reflected Zone 1: Blind Spot / Too Close (RED) */}
              {viewSettings.showDofZones && reflectedGeometries.nearVol && (
                <group>
                  {!viewSettings.showWireframe && (
                    <mesh geometry={reflectedGeometries.nearVol}>
                      <meshBasicMaterial
                        color="#ef4444"
                        transparent
                        opacity={Math.min(1.0, 0.25 * dofFactor * scaleFactor)}
                        depthWrite={false}
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                  )}
                  {reflectedGeometries.nearWire && (
                    <lineSegments geometry={reflectedGeometries.nearWire}>
                      <lineBasicMaterial
                        color="#ef4444"
                        transparent
                        opacity={Math.min(1.0, 0.5 * coneFactor + 0.2)}
                      />
                    </lineSegments>
                  )}
                </group>
              )}

              {/* Reflected Zone 2: Valid DOF Reading Zone (GREEN) */}
              {reflectedGeometries.validVol && (
                <group>
                  {!viewSettings.showWireframe && (
                    <mesh geometry={reflectedGeometries.validVol}>
                      <meshBasicMaterial
                        color={isActivelyReading ? '#10b981' : (viewSettings.showDofZones ? '#22c55e' : scanner.color)}
                        transparent
                        opacity={Math.min(1.0, (isActivelyReading ? 0.8 : isSelected ? 0.55 : 0.4) * dofFactor * scaleFactor)}
                        depthWrite={false}
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                  )}
                  {reflectedGeometries.validWire && (
                    <lineSegments geometry={reflectedGeometries.validWire}>
                      <lineBasicMaterial
                        color={isActivelyReading ? '#34d399' : (viewSettings.showDofZones ? '#10b981' : scanner.color)}
                        transparent
                        opacity={Math.min(1.0, (isActivelyReading ? 0.98 : 0.75) * scaleFactor)}
                        linewidth={isSelected ? 2 : 1}
                      />
                    </lineSegments>
                  )}
                </group>
              )}

              {/* Reflected Zone 3: Beyond DOF Far Limit / Out of Focus (YELLOW) */}
              {viewSettings.showDofZones && reflectedGeometries.farVol && (
                <group>
                  {!viewSettings.showWireframe && (
                    <mesh geometry={reflectedGeometries.farVol}>
                      <meshBasicMaterial
                        color="#eab308"
                        transparent
                        opacity={Math.min(1.0, 0.18 * dofFactor * scaleFactor)}
                        depthWrite={false}
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                  )}
                  {reflectedGeometries.farWire && (
                    <lineSegments geometry={reflectedGeometries.farWire}>
                      <lineBasicMaterial
                        color="#ca8a04"
                        transparent
                        opacity={Math.min(1.0, 0.45 * coneFactor + 0.15)}
                      />
                    </lineSegments>
                  )}
                </group>
              )}
            </group>
          )}
        </group>
      )}
    </>
  );
};
