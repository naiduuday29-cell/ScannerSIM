import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Scanner } from '../../types';
import { useSimulator } from '../../context/SimulatorContext';
import {
  createFrustumSegmentGeometry,
  createFrustumWireframeGeometry,
  createPolyhedronGeometry,
  createPolyhedronWireframeGeometry,
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

  // Seamless Folded Optical Beam Geometries (Flush to Mirror Surface)
  const foldedGeometries = useMemo(() => {
    if (!mirrorPath) return null;
    const dA = mirrorPath.distanceA;
    const lensPts = mirrorPath.lensCornersWorld;
    const mirrorPts = mirrorPath.mirrorApertureCornersWorld;
    const rayDirs = mirrorPath.reflectedCornerRayDirs;

    // 1. Primary Beam (Lens Face -> Flush on Mirror Aperture Surface)
    const isPrimaryBlind = dA <= dofNear;
    const primaryVol = createPolyhedronGeometry(lensPts, mirrorPts);
    const primaryWire = createPolyhedronWireframeGeometry(lensPts, mirrorPts);

    // 2. Reflected Red Zone (Blind spot / Too close): Distance A + s < dofNear
    const hasReflRed = dA < dofNear;
    const sRedEnd = Math.max(0, dofNear - dA);
    let reflRedVol: THREE.BufferGeometry | null = null;
    let reflRedWire: THREE.BufferGeometry | null = null;
    if (hasReflRed && sRedEnd > 0.005) {
      const redNearPts = mirrorPts; // Directly on mirror surface
      const redFarPts = mirrorPts.map((pt, k) => pt.clone().addScaledVector(rayDirs[k], sRedEnd));
      reflRedVol = createPolyhedronGeometry(redNearPts, redFarPts);
      reflRedWire = createPolyhedronWireframeGeometry(redNearPts, redFarPts);
    }

    // 3. Reflected Green Zone (Valid DOF reading range): dofNear <= Distance A + s <= dofFar
    const sGreenStart = Math.max(0, dofNear - dA);
    const sGreenEnd = Math.max(0, dofFar - dA);
    const hasReflGreen = sGreenEnd > sGreenStart + 0.01;
    let reflGreenVol: THREE.BufferGeometry | null = null;
    let reflGreenWire: THREE.BufferGeometry | null = null;
    if (hasReflGreen) {
      const greenNearPts = mirrorPts.map((pt, k) => pt.clone().addScaledVector(rayDirs[k], sGreenStart));
      const greenFarPts = mirrorPts.map((pt, k) => pt.clone().addScaledVector(rayDirs[k], sGreenEnd));
      reflGreenVol = createPolyhedronGeometry(greenNearPts, greenFarPts);
      reflGreenWire = createPolyhedronWireframeGeometry(greenNearPts, greenFarPts);
    }

    // 4. Reflected Yellow Zone (Beyond DOF far limit)
    const sYellowStart = Math.max(0, dofFar - dA);
    const sYellowEnd = Math.max(sYellowStart + 0.35, maxRange - dA);
    const hasReflYellow = sYellowEnd > sYellowStart + 0.01;
    let reflYellowVol: THREE.BufferGeometry | null = null;
    let reflYellowWire: THREE.BufferGeometry | null = null;
    if (hasReflYellow) {
      const yellowNearPts = mirrorPts.map((pt, k) => pt.clone().addScaledVector(rayDirs[k], sYellowStart));
      const yellowFarPts = mirrorPts.map((pt, k) => pt.clone().addScaledVector(rayDirs[k], sYellowEnd));
      reflYellowVol = createPolyhedronGeometry(yellowNearPts, yellowFarPts);
      reflYellowWire = createPolyhedronWireframeGeometry(yellowNearPts, yellowFarPts);
    }

    // Optical sightline points in world coordinates
    const sightlinePts = [
      mirrorPath.scannerLensPos,
      mirrorPath.mirrorPos,
      mirrorPath.mirrorPos,
      mirrorPath.mirrorPos.clone().addScaledVector(mirrorPath.reflectedVector, sYellowEnd)
    ];
    const sightlineGeom = new THREE.BufferGeometry().setFromPoints(sightlinePts);

    return {
      isPrimaryBlind,
      primaryVol,
      primaryWire,
      reflRedVol,
      reflRedWire,
      reflGreenVol,
      reflGreenWire,
      reflYellowVol,
      reflYellowWire,
      sightlineGeom
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
          PHYSICAL INDUSTRIAL SCANNER HOUSING (LOCAL FRAME)
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

          {/* Direct Line-of-sight Sightline Ray (Only when no mirror active) */}
          {!mirrorPath && viewSettings.showOpticalRays && (
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
                opacity={0.7}
              />
            </lineSegments>
          )}
        </group>

        {/* Direct Line-of-sight Frustums (Only when no mirror active) */}
        {!mirrorPath && viewSettings.showFrustums && (
          <group>
            {/* Zone 1: Blind Spot (Red) */}
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

            {/* Zone 2: Valid DOF Reading Zone (Green) */}
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

            {/* Zone 3: Out of Focus (Yellow) */}
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

      {/* =========================================================================
          FOLDED OPTICAL MIRROR REFLECTION & SEAMLESS CONES (WORLD SPACE)
         ========================================================================= */}
      {mirrorPath && foldedGeometries && (
        <group
          onClick={(e) => {
            e.stopPropagation();
            setSelectedScannerId(scanner.id);
          }}
        >
          {/* Continuous Folded Optical Sightline Rays (Lens -> Mirror -> Conveyor) */}
          {viewSettings.showOpticalRays && (
            <lineSegments geometry={foldedGeometries.sightlineGeom}>
              <lineDashedMaterial
                color={isActivelyReading ? '#10b981' : '#38bdf8'}
                dashSize={0.06}
                gapSize={0.03}
                transparent
                opacity={0.85}
              />
            </lineSegments>
          )}

          {/* Frustum Cones */}
          {viewSettings.showFrustums && (
            <group>
              {/* --- 1. PRIMARY BEAM: From Lens to Mirror Face (Flush Termination) --- */}
              <group>
                {!viewSettings.showWireframe && (
                  <mesh geometry={foldedGeometries.primaryVol}>
                    <meshBasicMaterial
                      color={
                        foldedGeometries.isPrimaryBlind
                          ? '#ef4444' // Red if within blind spot
                          : (isActivelyReading ? '#10b981' : (viewSettings.showDofZones ? '#22c55e' : scanner.color))
                      }
                      transparent
                      opacity={Math.min(
                        1.0,
                        (foldedGeometries.isPrimaryBlind ? 0.22 : 0.38) * dofFactor * scaleFactor
                      )}
                      depthWrite={false}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                )}
                <lineSegments geometry={foldedGeometries.primaryWire}>
                  <lineBasicMaterial
                    color={foldedGeometries.isPrimaryBlind ? '#ef4444' : '#38bdf8'}
                    transparent
                    opacity={Math.min(1.0, 0.7 * scaleFactor)}
                    linewidth={1}
                  />
                </lineSegments>
              </group>

              {/* --- 2. REFLECTED RED ZONE (Blind Spot Before Focus): Distance A + s < dofNear --- */}
              {viewSettings.showDofZones && foldedGeometries.reflRedVol && (
                <group>
                  {!viewSettings.showWireframe && (
                    <mesh geometry={foldedGeometries.reflRedVol}>
                      <meshBasicMaterial
                        color="#ef4444"
                        transparent
                        opacity={Math.min(1.0, 0.25 * dofFactor * scaleFactor)}
                        depthWrite={false}
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                  )}
                  {foldedGeometries.reflRedWire && (
                    <lineSegments geometry={foldedGeometries.reflRedWire}>
                      <lineBasicMaterial
                        color="#ef4444"
                        transparent
                        opacity={Math.min(1.0, 0.5 * coneFactor + 0.2)}
                      />
                    </lineSegments>
                  )}
                </group>
              )}

              {/* --- 3. REFLECTED GREEN ZONE (Valid DOF Reading Range): Seamless from Mirror Surface --- */}
              {foldedGeometries.reflGreenVol && (
                <group>
                  {!viewSettings.showWireframe && (
                    <mesh geometry={foldedGeometries.reflGreenVol}>
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
                  {foldedGeometries.reflGreenWire && (
                    <lineSegments geometry={foldedGeometries.reflGreenWire}>
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

              {/* --- 4. REFLECTED YELLOW ZONE (Beyond DOF Far Limit) --- */}
              {viewSettings.showDofZones && foldedGeometries.reflYellowVol && (
                <group>
                  {!viewSettings.showWireframe && (
                    <mesh geometry={foldedGeometries.reflYellowVol}>
                      <meshBasicMaterial
                        color="#eab308"
                        transparent
                        opacity={Math.min(1.0, 0.18 * dofFactor * scaleFactor)}
                        depthWrite={false}
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                  )}
                  {foldedGeometries.reflYellowWire && (
                    <lineSegments geometry={foldedGeometries.reflYellowWire}>
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

          {/* Physical Mirror Mesh Assembly positioned at Mirror World Position */}
          <group
            position={[mirrorPath.mirrorPos.x, mirrorPath.mirrorPos.y, mirrorPath.mirrorPos.z]}
            rotation={mirrorPath.mirrorRotationEuler}
          >
            {/* Front Surface Reflective Metallic Glass Plane */}
            <mesh>
              <planeGeometry args={[mirrorPath.mirrorWidth, mirrorPath.mirrorHeight]} />
              <meshStandardMaterial
                color="#e2e8f0"
                metalness={0.97}
                roughness={0.05}
                envMapIntensity={2.0}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Aluminum Mirror Enclosure & Backing Plate */}
            <mesh position={[0, 0, -0.004]}>
              <boxGeometry args={[mirrorPath.mirrorWidth + 0.012, mirrorPath.mirrorHeight + 0.012, 0.008]} />
              <meshStandardMaterial
                color={isSelected ? '#0369a1' : '#1e293b'}
                metalness={0.8}
                roughness={0.3}
              />
            </mesh>

            {/* Rear Swivel Mount Pivot Socket */}
            <mesh position={[0, 0, -0.015]}>
              <boxGeometry args={[0.035, 0.035, 0.018]} />
              <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Mount Rod / Bracket */}
            <mesh position={[0, mirrorPath.mirrorHeight / 2 + 0.015, -0.015]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 0.03, 16]} />
              <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Aperture Outline (Orange Warning when clipped, Cyan when 100% OK) */}
            <lineSegments>
              <edgesGeometry args={[new THREE.PlaneGeometry(mirrorPath.mirrorWidth, mirrorPath.mirrorHeight)]} />
              <lineBasicMaterial
                color={mirrorPath.isApertureClipped ? '#f59e0b' : '#38bdf8'}
                linewidth={mirrorPath.isApertureClipped ? 3 : 1}
                opacity={mirrorPath.isApertureClipped ? 1.0 : 0.65}
                transparent
              />
            </lineSegments>
          </group>
        </group>
      )}
    </>
  );
};
