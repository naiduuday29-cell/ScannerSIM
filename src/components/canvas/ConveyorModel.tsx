import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimulator } from '../../context/SimulatorContext';
import { getConveyorBeltTexture } from '../../utils/textureGenerator';

export const ConveyorModel: React.FC = () => {
  const { conveyor, motion, viewSettings } = useSimulator();
  const beltColor = conveyor.color || '#00843D';
  const beltTexture = useMemo(() => getConveyorBeltTexture(beltColor), [beltColor]);
  const beltMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const conveyorOpacity = viewSettings.conveyorOpacity ?? 1.0;
  const isOpaque = conveyorOpacity >= 0.99;

  // Animate the belt texture offset to reflect real physical speed
  useFrame((_, delta) => {
    if (beltTexture && motion.isPlaying) {
      const speedFactor = (conveyor.beltSpeed * motion.speedMultiplier) / conveyor.length;
      beltTexture.offset.x -= delta * speedFactor * 1.5;
    }
  });

  // Calculate geometry dimensions
  // conveyor.width is strictly the usable inner belt width between guard rails
  const { width, height, length, sideRailHeight } = conveyor;
  const halfL = length / 2;
  const bedThickness = 0.12;
  const legRadius = 0.035;
  const legHeight = height - bedThickness / 2;

  // Rail thickness and spacing:
  // The guard rail inner edge is flush with the outer edge of the belt (z = ±width/2).
  // The rail body sits entirely OUTSIDE the usable belt width.
  const railThickness = 0.024;
  const railCenterZ = width / 2 + railThickness / 2;
  const bedWidth = width + 2 * railThickness + 0.06;

  // Number of leg pairs along conveyor length
  const numLegPairs = Math.max(2, Math.ceil(length / 2.0));
  const legPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const zOffset = bedWidth / 2 - 0.045;
    for (let i = 0; i < numLegPairs; i++) {
      const x = -halfL + 0.35 + (i * (length - 0.7)) / (numLegPairs - 1);
      positions.push([x, legHeight / 2, -zOffset]);
      positions.push([x, legHeight / 2, zOffset]);
    }
    return positions;
  }, [length, halfL, numLegPairs, bedWidth, legHeight]);

  // Shared dynamic opacity materials for conveyor elements
  const beltMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: beltTexture,
      roughness: 0.65,
      metalness: 0.15,
      color: beltColor,
      transparent: true,
      opacity: conveyorOpacity,
      depthWrite: isOpaque,
    });
  }, [beltTexture, beltColor, conveyorOpacity, isOpaque]);

  const bedMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#1e2533',
      roughness: 0.35,
      metalness: 0.8,
      transparent: true,
      opacity: conveyorOpacity,
      depthWrite: isOpaque,
    });
  }, [conveyorOpacity, isOpaque]);

  const railMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#2d3748',
      metalness: 0.7,
      roughness: 0.3,
      transparent: true,
      opacity: conveyorOpacity,
      depthWrite: isOpaque,
    });
  }, [conveyorOpacity, isOpaque]);

  const yellowMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#eab308',
      transparent: true,
      opacity: conveyorOpacity,
      depthWrite: isOpaque,
    });
  }, [conveyorOpacity, isOpaque]);

  const legMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#334155',
      metalness: 0.8,
      roughness: 0.3,
      transparent: true,
      opacity: conveyorOpacity,
      depthWrite: isOpaque,
    });
  }, [conveyorOpacity, isOpaque]);

  const footMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#1e293b',
      metalness: 0.85,
      roughness: 0.35,
      transparent: true,
      opacity: conveyorOpacity,
      depthWrite: isOpaque,
    });
  }, [conveyorOpacity, isOpaque]);

  const pulleyMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#64748b',
      metalness: 0.9,
      roughness: 0.2,
      transparent: true,
      opacity: conveyorOpacity,
      depthWrite: isOpaque,
    });
  }, [conveyorOpacity, isOpaque]);

  return (
    <group position={[0, 0, 0]}>
      {/* Moving Rubberized Usable Top Belt with Industrial #00843D Green */}
      <mesh
        position={[0, height, 0]}
        receiveShadow
        material={beltMat}
        ref={beltMatRef as any}
      >
        <boxGeometry args={[length, 0.015, width]} />
      </mesh>

      {/* Main Steel Frame Bed (Extends under belt + rails + mounts) */}
      <mesh
        position={[0, height - bedThickness / 2 - 0.008, 0]}
        castShadow
        receiveShadow
        material={bedMat}
      >
        <boxGeometry args={[length + 0.08, bedThickness, bedWidth]} />
      </mesh>

      {/* Side Guard Rails mounted completely OUTSIDE the usable belt width */}
      {/* Left Guard Rail */}
      <mesh
        position={[0, height + sideRailHeight / 2, -railCenterZ]}
        castShadow
        material={railMat}
      >
        <boxGeometry args={[length + 0.06, sideRailHeight, railThickness]} />
      </mesh>
      {/* Right Guard Rail */}
      <mesh
        position={[0, height + sideRailHeight / 2, railCenterZ]}
        castShadow
        material={railMat}
      >
        <boxGeometry args={[length + 0.06, sideRailHeight, railThickness]} />
      </mesh>

      {/* Yellow Safety Accent Strips on Rail Tops */}
      <mesh
        position={[0, height + sideRailHeight + 0.003, -railCenterZ]}
        material={yellowMat}
      >
        <boxGeometry args={[length + 0.06, 0.006, railThickness + 0.004]} />
      </mesh>
      <mesh
        position={[0, height + sideRailHeight + 0.003, railCenterZ]}
        material={yellowMat}
      >
        <boxGeometry args={[length + 0.06, 0.006, railThickness + 0.004]} />
      </mesh>

      {/* Rail Support Standoff Brackets connecting rails to the steel bed */}
      {Array.from({ length: Math.max(3, Math.ceil(length / 1.0)) }).map((_, idx, arr) => {
        const x = -halfL + 0.2 + (idx * (length - 0.4)) / (arr.length - 1);
        return (
          <group key={`bracket-${idx}`}>
            <mesh
              position={[x, height + 0.02, -railCenterZ - railThickness / 2]}
              material={footMat}
            >
              <boxGeometry args={[0.04, 0.06, 0.02]} />
            </mesh>
            <mesh
              position={[x, height + 0.02, railCenterZ + railThickness / 2]}
              material={footMat}
            >
              <boxGeometry args={[0.04, 0.06, 0.02]} />
            </mesh>
          </group>
        );
      })}

      {/* Exposed End Drums / Pulleys */}
      <mesh
        position={[-halfL - 0.02, height - 0.02, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        material={pulleyMat}
      >
        <cylinderGeometry args={[0.07, 0.07, width + 0.01, 24]} />
      </mesh>
      <mesh
        position={[halfL + 0.02, height - 0.02, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        material={pulleyMat}
      >
        <cylinderGeometry args={[0.07, 0.07, width + 0.01, 24]} />
      </mesh>

      {/* Heavy Steel Support Legs & Floor Anchors */}
      {legPositions.map(([lx, ly, lz], idx) => (
        <group key={idx} position={[lx, ly, lz]}>
          <mesh castShadow material={legMat}>
            <cylinderGeometry args={[legRadius, legRadius, legHeight, 16]} />
          </mesh>
          <mesh position={[0, -legHeight / 2 + 0.01, 0]} receiveShadow material={footMat}>
            <boxGeometry args={[0.15, 0.02, 0.15]} />
          </mesh>
        </group>
      ))}

      {/* Crossbeams connecting leg pairs */}
      {Array.from({ length: numLegPairs }).map((_, i) => {
        const x = -halfL + 0.35 + (i * (length - 0.7)) / (numLegPairs - 1);
        return (
          <mesh
            key={`cross-${i}`}
            position={[x, legHeight * 0.4, 0]}
            material={legMat}
          >
            <boxGeometry args={[0.05, 0.04, bedWidth - 0.08]} />
          </mesh>
        );
      })}
    </group>
  );
};
