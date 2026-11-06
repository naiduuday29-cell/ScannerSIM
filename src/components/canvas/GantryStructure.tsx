import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useSimulator } from '../../context/SimulatorContext';

export const GantryStructure: React.FC = () => {
  const { conveyor, scanners, selectedScannerId, viewSettings } = useSimulator();

  if (!viewSettings.showGantryStructure) return null;

  const gantryOpacity = viewSettings.gantryOpacity ?? 1.0;
  const isOpaque = gantryOpacity >= 0.99;

  // Shared reactive materials that respond immediately to gantryOpacity slider
  const aluMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#94a3b8',
      metalness: 0.88,
      roughness: 0.22,
      transparent: true,
      opacity: gantryOpacity,
      depthWrite: isOpaque,
    });
  }, [gantryOpacity, isOpaque]);

  const darkMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#1e293b',
      metalness: 0.85,
      roughness: 0.3,
      transparent: true,
      opacity: gantryOpacity,
      depthWrite: isOpaque,
    });
  }, [gantryOpacity, isOpaque]);

  const gussetMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#64748b',
      metalness: 0.85,
      roughness: 0.26,
      transparent: true,
      opacity: gantryOpacity,
      depthWrite: isOpaque,
    });
  }, [gantryOpacity, isOpaque]);

  const yellowMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#eab308',
      roughness: 0.35,
      metalness: 0.25,
      transparent: true,
      opacity: gantryOpacity,
      depthWrite: isOpaque,
    });
  }, [gantryOpacity, isOpaque]);

  const selStrutMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#e0f2fe',
      metalness: 0.88,
      roughness: 0.22,
      transparent: true,
      opacity: gantryOpacity,
      depthWrite: isOpaque,
    });
  }, [gantryOpacity, isOpaque]);

  const selGlowMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#00f0ff',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: gantryOpacity,
      depthWrite: isOpaque,
    });
  }, [gantryOpacity, isOpaque]);

  const activeScanners = useMemo(() => scanners.filter((s) => s.isActive), [scanners]);

  // Calculate scanner world coordinates
  const scannerData = useMemo(() => {
    return activeScanners.map((s) => {
      const worldX = s.position.x;
      const worldY = conveyor.height + s.position.y;
      const worldZ = s.position.z;
      return {
        scanner: s,
        worldX,
        worldY,
        worldZ,
        isSelected: s.id === selectedScannerId,
      };
    });
  }, [activeScanners, conveyor.height, selectedScannerId]);

  // Compute adaptive bounding frame envelope based on scanner array layout
  const frameMetrics = useMemo(() => {
    const postThickness = 0.045; // 45x45mm industrial T-slot extrusion profile

    if (scannerData.length === 0) {
      const defaultHalfZ = conveyor.width / 2 + 0.35;
      const defaultTopY = conveyor.height + 1.45;
      return {
        halfZ: defaultHalfZ,
        width: defaultHalfZ * 2,
        topY: defaultTopY,
        startX: -0.3,
        endX: 0.3,
        midX: 0,
        isTunnel: false,
        length: 0.6,
        postThickness,
      };
    }

    const xVals = scannerData.map((d) => d.worldX);
    const yVals = scannerData.map((d) => d.worldY);
    const zAbsVals = scannerData.map((d) => Math.abs(d.worldZ));

    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const maxY = Math.max(...yVals);
    const maxAbsZ = Math.max(...zAbsVals);

    // Lateral clearance: columns must sit comfortably outside conveyor rails and all scanners
    const halfZ = Math.max(conveyor.width / 2 + 0.36, maxAbsZ + 0.22);

    // Height clearance: top frame must always clear above the highest scanner
    const topY = Math.max(conveyor.height + 1.35, maxY + 0.2);

    const spanX = maxX - minX;
    const isTunnel = spanX >= 0.35;
    const midX = (minX + maxX) / 2;

    const startX = isTunnel ? minX - 0.25 : midX - 0.3;
    const endX = isTunnel ? maxX + 0.25 : midX + 0.3;
    const length = Math.max(0.6, endX - startX);

    return {
      halfZ,
      width: halfZ * 2,
      topY,
      startX,
      endX,
      midX,
      isTunnel,
      length,
      postThickness,
    };
  }, [scannerData, conveyor.width, conveyor.height]);

  const { halfZ, width, topY, startX, endX, midX, isTunnel, length, postThickness } = frameMetrics;

  // Group overhead scanners that share nearly the same X position (within 6cm)
  const overheadCrossbars = useMemo(() => {
    const bars: { x: number; scanners: typeof scannerData }[] = [];
    scannerData.forEach((item) => {
      const isOverhead = item.worldY >= conveyor.height + 0.45 && Math.abs(item.worldZ) <= halfZ - 0.1;
      if (isOverhead) {
        const existing = bars.find((b) => Math.abs(b.x - item.worldX) < 0.06);
        if (existing) {
          existing.scanners.push(item);
        } else {
          bars.push({ x: item.worldX, scanners: [item] });
        }
      }
    });
    return bars;
  }, [scannerData, conveyor.height, halfZ]);

  // Identify side scanners (lateral inspection or low-level mounts)
  const sideMountScanners = useMemo(() => {
    return scannerData.filter((item) => {
      const isOverhead = item.worldY >= conveyor.height + 0.45 && Math.abs(item.worldZ) <= halfZ - 0.1;
      return !isOverhead;
    });
  }, [scannerData, conveyor.height, halfZ]);

  return (
    <group>
      {/* =========================================================================
          1. STRUCTURAL ALUMINUM GANTRY PORTALS & LONGITUDINAL RUNNERS
         ========================================================================= */}
      {/* Entrance Portal Arch (or Single Central Arch if compact) */}
      <PortalArch
        x={isTunnel ? startX : midX}
        width={width}
        halfZ={halfZ}
        height={topY}
        thickness={postThickness}
        aluMat={aluMat}
        darkMat={darkMat}
        yellowMat={yellowMat}
        gussetMat={gussetMat}
      />

      {/* Exit Portal Arch (rendered if multi-scanner tunnel layout) */}
      {isTunnel && (
        <PortalArch
          x={endX}
          width={width}
          halfZ={halfZ}
          height={topY}
          thickness={postThickness}
          aluMat={aluMat}
          darkMat={darkMat}
          yellowMat={yellowMat}
          gussetMat={gussetMat}
        />
      )}

      {/* Intermediate Support Arch for long scan tunnels (> 2.0m) */}
      {isTunnel && length > 2.0 && (
        <PortalArch
          x={(startX + endX) / 2}
          width={width}
          halfZ={halfZ}
          height={topY}
          thickness={postThickness}
          aluMat={aluMat}
          darkMat={darkMat}
          yellowMat={yellowMat}
          gussetMat={gussetMat}
          isSecondary
        />
      )}

      {/* Longitudinal Upper Aluminum Runners (T-slot 45x45mm) connecting portal arches */}
      <group>
        {/* Left Upper Longitudinal Runner */}
        <mesh position={[(startX + endX) / 2, topY, -halfZ]} castShadow material={aluMat}>
          <boxGeometry args={[length, postThickness, postThickness]} />
        </mesh>
        {/* Right Upper Longitudinal Runner */}
        <mesh position={[(startX + endX) / 2, topY, halfZ]} castShadow material={aluMat}>
          <boxGeometry args={[length, postThickness, postThickness]} />
        </mesh>

        {/* Lower / Mid Side Stabilization Rails */}
        {isTunnel && (
          <>
            <mesh position={[(startX + endX) / 2, conveyor.height + 0.15, -halfZ]} material={gussetMat}>
              <boxGeometry args={[length, 0.035, 0.035]} />
            </mesh>
            <mesh position={[(startX + endX) / 2, conveyor.height + 0.15, halfZ]} material={gussetMat}>
              <boxGeometry args={[length, 0.035, 0.035]} />
            </mesh>
          </>
        )}
      </group>

      {/* Fore & Aft Diagonal Stabilizer Braces (for compact single-arch configurations) */}
      {!isTunnel && (
        <group>
          {[-halfZ, halfZ].map((z, idx) => (
            <React.Fragment key={idx}>
              <mesh position={[midX + 0.35, topY * 0.5, z]} rotation={[0, 0, 0.4]} material={gussetMat}>
                <cylinderGeometry args={[0.015, 0.015, 0.75, 12]} />
              </mesh>
              <mesh position={[midX - 0.35, topY * 0.5, z]} rotation={[0, 0, -0.4]} material={gussetMat}>
                <cylinderGeometry args={[0.015, 0.015, 0.75, 12]} />
              </mesh>
            </React.Fragment>
          ))}
        </group>
      )}

      {/* =========================================================================
          2. DYNAMIC RIGGING FOR OVERHEAD SCANNERS
         ========================================================================= */}
      {overheadCrossbars.map((bar, barIdx) => (
        <group key={`overhead-bar-${barIdx}`}>
          {/* Sliding Transverse Aluminum Crossbeam (45x45mm profile) spanning across gantry top */}
          <mesh position={[bar.x, topY, 0]} castShadow material={aluMat}>
            <boxGeometry args={[postThickness, postThickness, width + 0.02]} />
          </mesh>

          {/* Left & Right End Corner Clamping Gussets onto Longitudinal Runners */}
          {[-halfZ, halfZ].map((zPos, gIdx) => (
            <mesh key={gIdx} position={[bar.x, topY - 0.025, zPos]} material={darkMat}>
              <boxGeometry args={[0.065, 0.05, 0.065]} />
            </mesh>
          ))}

          {/* For each overhead scanner on this crossbar */}
          {bar.scanners.map((item) => {
            const dropTop = topY - 0.025;
            const dropBottom = item.worldY + 0.055;
            const dropHeight = Math.max(0.04, dropTop - dropBottom);
            const dropCenterY = dropBottom + dropHeight / 2;

            return (
              <group key={item.scanner.id}>
                {/* T-Slot Slider Clamp Collar on Crossbeam */}
                <mesh position={[item.worldX, topY - 0.025, item.worldZ]} castShadow material={darkMat}>
                  <boxGeometry args={[0.06, 0.04, 0.06]} />
                </mesh>

                {/* Vertical Telescoping Aluminum Drop Strut */}
                <mesh
                  position={[item.worldX, dropCenterY, item.worldZ]}
                  castShadow
                  material={item.isSelected ? selStrutMat : aluMat}
                >
                  <boxGeometry args={[0.035, dropHeight, 0.035]} />
                </mesh>

                {/* Strut T-slot center line details */}
                <mesh position={[item.worldX, dropCenterY, item.worldZ + 0.018]} material={darkMat}>
                  <boxGeometry args={[0.008, dropHeight * 0.98, 0.002]} />
                </mesh>

                {/* Swivel Knuckle / Pan-Tilt Joint directly connected to Scanner Body */}
                <group position={[item.worldX, item.worldY + 0.055, item.worldZ]}>
                  <mesh rotation={[0, 0, Math.PI / 2]} material={darkMat}>
                    <cylinderGeometry args={[0.018, 0.018, 0.045, 16]} />
                  </mesh>
                  {/* Flange plate */}
                  <mesh position={[0, -0.01, 0]} material={darkMat}>
                    <boxGeometry args={[0.04, 0.01, 0.05]} />
                  </mesh>
                  {/* Selected glow indicator */}
                  {item.isSelected && (
                    <mesh position={[0, 0.015, 0]} material={selGlowMat}>
                      <ringGeometry args={[0.025, 0.032, 24]} />
                    </mesh>
                  )}
                </group>
              </group>
            );
          })}
        </group>
      ))}

      {/* =========================================================================
          3. DYNAMIC RIGGING FOR SIDE / ANGLE / LOW SCANNERS
         ========================================================================= */}
      {sideMountScanners.map((item) => {
        const isRight = item.worldZ >= 0;
        const sideZ = isRight ? halfZ : -halfZ;
        const postH = topY;
        const boomLen = Math.max(0.06, Math.abs(sideZ - item.worldZ));
        const boomCenterZ = (sideZ + item.worldZ) / 2;

        return (
          <group key={item.scanner.id}>
            {/* Auxiliary Vertical Side Column at Scanner X */}
            <mesh position={[item.worldX, postH / 2, sideZ]} castShadow material={aluMat}>
              <boxGeometry args={[postThickness, postH, postThickness]} />
            </mesh>

            {/* Top connection bracket into Upper Longitudinal Runner */}
            <mesh position={[item.worldX, topY, sideZ]} material={darkMat}>
              <boxGeometry args={[0.065, 0.065, 0.065]} />
            </mesh>

            {/* Heavy Floor Footplate for Side Post */}
            <mesh position={[item.worldX, 0.01, sideZ]} material={darkMat}>
              <boxGeometry args={[0.16, 0.02, 0.16]} />
            </mesh>

            {/* Vertical Slider Clamp Carriage at Scanner Y */}
            <mesh position={[item.worldX, item.worldY, sideZ]} castShadow material={darkMat}>
              <boxGeometry args={[0.065, 0.08, 0.065]} />
            </mesh>

            {/* Horizontal Cantilever Aluminum Boom Arm extending to Scanner */}
            <mesh
              position={[item.worldX, item.worldY, boomCenterZ]}
              castShadow
              material={item.isSelected ? selStrutMat : aluMat}
            >
              <boxGeometry args={[0.035, 0.035, boomLen]} />
            </mesh>

            {/* Boom Arm End Mount Collar & Swivel Joint grasping Scanner */}
            <group position={[item.worldX, item.worldY, item.worldZ]}>
              <mesh position={[0, 0, isRight ? 0.035 : -0.035]} material={darkMat}>
                <boxGeometry args={[0.045, 0.05, 0.03]} />
              </mesh>
              {/* Selected highlight */}
              {item.isSelected && (
                <mesh position={[0, 0, isRight ? 0.05 : -0.05]} material={selGlowMat}>
                  <ringGeometry args={[0.022, 0.03, 16]} />
                </mesh>
              )}
            </group>
          </group>
        );
      })}
    </group>
  );
};

// =============================================================================
// SUBCOMPONENT: Modular Industrial Aluminum Portal Arch
// =============================================================================
interface PortalArchProps {
  x: number;
  width: number;
  halfZ: number;
  height: number;
  thickness: number;
  aluMat: THREE.Material;
  darkMat: THREE.Material;
  yellowMat: THREE.Material;
  gussetMat: THREE.Material;
  isSecondary?: boolean;
}

const PortalArch: React.FC<PortalArchProps> = ({
  x,
  width,
  halfZ,
  height,
  thickness,
  aluMat,
  darkMat,
  yellowMat,
  gussetMat,
  isSecondary = false,
}) => {
  return (
    <group position={[x, 0, 0]}>
      {/* Left Upright Column */}
      <mesh position={[0, height / 2, -halfZ]} castShadow material={aluMat}>
        <boxGeometry args={[thickness, height, thickness]} />
      </mesh>
      {/* Left Column Safety Yellow Hazard Base Band */}
      <mesh position={[0, 0.12, -halfZ]} material={yellowMat}>
        <boxGeometry args={[thickness + 0.004, 0.22, thickness + 0.004]} />
      </mesh>
      {/* Left Heavy Floor Footplate with Anchor Bolts */}
      <mesh position={[0, 0.01, -halfZ]} material={darkMat}>
        <boxGeometry args={[0.18, 0.02, 0.18]} />
      </mesh>

      {/* Right Upright Column */}
      <mesh position={[0, height / 2, halfZ]} castShadow material={aluMat}>
        <boxGeometry args={[thickness, height, thickness]} />
      </mesh>
      {/* Right Column Safety Yellow Hazard Base Band */}
      <mesh position={[0, 0.12, halfZ]} material={yellowMat}>
        <boxGeometry args={[thickness + 0.004, 0.22, thickness + 0.004]} />
      </mesh>
      {/* Right Heavy Floor Footplate with Anchor Bolts */}
      <mesh position={[0, 0.01, halfZ]} material={darkMat}>
        <boxGeometry args={[0.18, 0.02, 0.18]} />
      </mesh>

      {/* Top Transverse Portal Crossbeam */}
      <mesh position={[0, height, 0]} castShadow material={aluMat}>
        <boxGeometry args={[thickness, thickness, width + 0.04]} />
      </mesh>

      {/* Die-Cast Aluminum Corner Gussets (45° Triangular Brackets) */}
      <mesh position={[0, height - 0.08, -halfZ + 0.08]} rotation={[0, 0, 0]} material={gussetMat}>
        <boxGeometry args={[thickness * 0.9, 0.08, 0.08]} />
      </mesh>
      <mesh position={[0, height - 0.08, halfZ - 0.08]} rotation={[0, 0, 0]} material={gussetMat}>
        <boxGeometry args={[thickness * 0.9, 0.08, 0.08]} />
      </mesh>

      {/* Secondary Upper Rigging Bar (only on primary portal arches) */}
      {!isSecondary && (
        <mesh position={[0, height - 0.22, 0]} material={gussetMat}>
          <boxGeometry args={[0.025, 0.025, width - 0.06]} />
        </mesh>
      )}
    </group>
  );
};
