import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimulator } from '../../context/SimulatorContext';
import { getTyreBeadBarcodeTexture, getTyreTexture } from '../../utils/textureGenerator';

export const TyreModel: React.FC = () => {
  const { conveyor, tyre, motion, telemetry, getActiveTyreDimensions } = useSimulator();
  const groupRef = useRef<THREE.Group>(null);
  const scanLaserRef = useRef<THREE.Mesh>(null);

  const dims = getActiveTyreDimensions();
  const { outerDiameter, innerDiameter, height } = dims;

  const rOuter = outerDiameter / 2;
  const rInner = innerDiameter / 2;
  const halfH = height / 2;

  const tyreTexture = useMemo(() => getTyreTexture(), []);
  const barcodeTexture = useMemo(
    () => getTyreBeadBarcodeTexture('1234 5678'),
    []
  );

  const isBeingRead = telemetry.activeHits.length > 0;

  // 100% Watertight, Artifact-Free Body of Revolution via LatheGeometry
  // Generates smooth rounded shoulders, sidewalls, tread, and inner rim with zero triangulation errors
  const tyreGeometry = useMemo(() => {
    const shoulder = Math.min(0.04, (rOuter - rInner) * 0.2, halfH * 0.25);
    const beadLip = Math.min(0.02, (rOuter - rInner) * 0.1);

    const pts: THREE.Vector2[] = [
      // 1. Inner bottom bead corner
      new THREE.Vector2(rInner, -halfH),
      // 2. Bottom bead lip
      new THREE.Vector2(rInner + beadLip, -halfH),
      // 3. Bottom sidewall flat
      new THREE.Vector2(rOuter - shoulder, -halfH),
      // 4. Bottom outer shoulder curve
      new THREE.Vector2(rOuter - shoulder * 0.35, -halfH + shoulder * 0.35),
      new THREE.Vector2(rOuter, -halfH + shoulder),
      // 5. Outer tread crown
      new THREE.Vector2(rOuter + 0.003, 0),
      // 6. Top outer shoulder curve
      new THREE.Vector2(rOuter, halfH - shoulder),
      new THREE.Vector2(rOuter - shoulder * 0.35, halfH - shoulder * 0.35),
      // 7. Top sidewall flat
      new THREE.Vector2(rOuter - shoulder, halfH),
      // 8. Top bead lip
      new THREE.Vector2(rInner + beadLip, halfH),
      // 9. Inner top bead corner
      new THREE.Vector2(rInner, halfH),
      // 10. Inner rim cylinder wall
      new THREE.Vector2(rInner, 0),
      // 11. Closed back to inner bottom bead
      new THREE.Vector2(rInner, -halfH)
    ];

    const geom = new THREE.LatheGeometry(pts, 56);
    geom.computeVertexNormals();
    return geom;
  }, [rOuter, rInner, halfH]);

  // Slim, high-contrast barcode label dimensions matching reference image
  const bLength = 0.075; // 75mm length along tangent
  const bHeight = 0.022; // 22mm height along radius

  // Animation frame update
  useFrame((state) => {
    if (groupRef.current) {
      const targetY = conveyor.height + halfH + 0.001;
      const lateralZ = tyre.lateralOffsetZ || 0;
      const yawRad = THREE.MathUtils.degToRad(tyre.rotationYaw || 0);

      groupRef.current.position.set(motion.currentX, targetY, lateralZ);
      groupRef.current.rotation.set(0, yawRad, 0);
    }

    if (scanLaserRef.current) {
      if (isBeingRead) {
        scanLaserRef.current.visible = true;
        const time = state.clock.getElapsedTime();
        const mat = scanLaserRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.7 + Math.sin(time * 15) * 0.3;
      } else {
        scanLaserRef.current.visible = false;
      }
    }
  });

  // Calculate barcode position and tangential orientation on tyre sidewall
  const barcodeTransform = useMemo(() => {
    const theta = THREE.MathUtils.degToRad(tyre.radialAngleDeg || 0);
    const pos: [number, number, number] = [0, 0, 0];
    const rot: [number, number, number] = [0, 0, 0];

    if (tyre.barcodeLocation === 'tread') {
      const r = rOuter + 0.005;
      pos[0] = r * Math.cos(theta);
      pos[1] = 0;
      pos[2] = r * Math.sin(theta);
      rot[0] = 0;
      rot[1] = -theta + Math.PI / 2;
      rot[2] = 0;
    } else {
      // Sidewall (Top or Bottom)
      const isTop = tyre.barcodeLocation === 'sidewall_top';
      // Radial position: radialDistanceRatio moves label from inner bead toward outer shoulder
      // Default ~0.25 - 0.40 sits right near the bead, matching reference photo!
      const shoulderMargin = 0.035;
      const rSpan = Math.max(0.04, rOuter - rInner - shoulderMargin);
      const r = rInner + 0.02 + tyre.radialDistanceRatio * rSpan;

      pos[0] = r * Math.cos(theta);
      pos[1] = isTop ? halfH + 0.002 : -halfH - 0.002;
      pos[2] = r * Math.sin(theta);

      // Tangential alignment: long axis of barcode follows the circular curve of the sidewall
      rot[0] = isTop ? -Math.PI / 2 : Math.PI / 2;
      rot[1] = 0;
      rot[2] = isTop ? -theta + Math.PI / 2 : theta - Math.PI / 2;
    }

    return { pos, rot };
  }, [tyre.barcodeLocation, tyre.radialAngleDeg, tyre.radialDistanceRatio, rOuter, rInner, halfH]);

  return (
    <group
      ref={groupRef}
      position={[motion.currentX, conveyor.height + halfH + 0.001, tyre.lateralOffsetZ || 0]}
      rotation={[0, THREE.MathUtils.degToRad(tyre.rotationYaw || 0), 0]}
    >
      {/* 3D Watertight Rubber Tyre Body */}
      <mesh
        geometry={tyreGeometry}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#1c2027"
          roughness={0.72}
          metalness={0.12}
          map={tyreTexture}
        />
      </mesh>

      {/* Decorative inner bead ring line */}
      <mesh position={[0, halfH + 0.0005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[rInner + 0.015, rInner + 0.018, 48]} />
        <meshBasicMaterial color="#101318" side={THREE.DoubleSide} />
      </mesh>

      {/* Barcode Applied Tangentially on Sidewall (Matching Reference Image) */}
      <group position={barcodeTransform.pos} rotation={barcodeTransform.rot}>
        {/* White sticker background backing */}
        <mesh>
          <planeGeometry args={[bLength + 0.006, bHeight + 0.004]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
        {/* High-density barcode label texture with side numbers and vertical bars */}
        <mesh position={[0, 0, 0.0005]}>
          <planeGeometry args={[bLength, bHeight]} />
          <meshBasicMaterial
            map={barcodeTexture}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Read Confirmation Glow Border */}
        {isBeingRead && (
          <mesh position={[0, 0, 0.001]}>
            <planeGeometry args={[bLength + 0.012, bHeight + 0.008]} />
            <meshBasicMaterial
              color="#00f0ff"
              wireframe
              wireframeLinewidth={2}
              transparent
              opacity={0.85}
            />
          </mesh>
        )}
      </group>

      {/* Active Read Status Halo */}
      <mesh
        ref={scanLaserRef}
        visible={isBeingRead}
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[rOuter * 1.04, rOuter * 1.12, 48]} />
        <meshBasicMaterial
          color={isBeingRead ? '#10b981' : '#00f0ff'}
          side={THREE.DoubleSide}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
};
