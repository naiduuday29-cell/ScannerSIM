import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimulator } from '../../context/SimulatorContext';
import { getBarcodeTexture, getCardboardTexture } from '../../utils/textureGenerator';
import { BarcodeFace } from '../../types';

export const CartonModel: React.FC = () => {
  const { conveyor, carton, motion, telemetry, getActiveDimensions } = useSimulator();
  const groupRef = useRef<THREE.Group>(null);
  const scanLaserRef = useRef<THREE.Mesh>(null);

  const dims = getActiveDimensions();
  const { length, width, height } = dims;

  // Textures
  const cardboardTexture = useMemo(() => getCardboardTexture(), []);
  const barcodeTexture = useMemo(
    () => getBarcodeTexture(carton.barcodeType, 'LOG-9482-X'),
    [carton.barcodeType]
  );

  const isBeingRead = telemetry.activeHits.length > 0;

  // Barcode dimensions
  const bWidth = Math.min(length * 0.7, width * 0.7, carton.barcodeWidth || 0.14);
  const bHeight = carton.barcodeHeight || 0.06;

  // Surface X and Y offsets (-0.45 to +0.45)
  const offsetU = carton.barcodeOffsetU || 0;
  const offsetV = carton.barcodeOffsetV || 0;

  useFrame((state) => {
    if (groupRef.current) {
      const targetY = conveyor.height + height / 2;
      const lateralZ = carton.lateralOffsetZ || 0;
      const yawRad = THREE.MathUtils.degToRad(carton.rotationYaw || 0);

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

  const renderBarcodeForFace = (face: BarcodeFace) => {
    const isTarget = carton.barcodeFaces.includes(face);
    if (!isTarget) return null;

    let pos: [number, number, number] = [0, 0, 0];
    let rot: [number, number, number] = [0, 0, 0];
    const offset = 0.002;

    switch (face) {
      case 'top': {
        const su = offsetU * (length * 0.7);
        const sv = offsetV * (width * 0.7);
        pos = [su, height / 2 + offset, sv];
        rot = [-Math.PI / 2, 0, 0];
        break;
      }
      case 'bottom': {
        const su = offsetU * (length * 0.7);
        const sv = offsetV * (width * 0.7);
        pos = [su, -height / 2 - offset, sv];
        rot = [Math.PI / 2, 0, 0];
        break;
      }
      case 'left': {
        const su = offsetU * (length * 0.7);
        const sv = offsetV * (height * 0.7);
        pos = [su, sv, -width / 2 - offset];
        rot = [0, Math.PI, 0];
        break;
      }
      case 'right': {
        const su = offsetU * (length * 0.7);
        const sv = offsetV * (height * 0.7);
        pos = [su, sv, width / 2 + offset];
        rot = [0, 0, 0];
        break;
      }
      case 'front': {
        const su = offsetU * (width * 0.7);
        const sv = offsetV * (height * 0.7);
        pos = [length / 2 + offset, sv, su];
        rot = [0, Math.PI / 2, 0];
        break;
      }
      case 'back': {
        const su = offsetU * (width * 0.7);
        const sv = offsetV * (height * 0.7);
        pos = [-length / 2 - offset, sv, su];
        rot = [0, -Math.PI / 2, 0];
        break;
      }
    }

    return (
      <group key={face} position={pos} rotation={rot}>
        <mesh>
          <planeGeometry args={[bWidth + 0.02, bHeight + 0.015]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[bWidth, bHeight]} />
          <meshBasicMaterial
            map={barcodeTexture}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>
        {isBeingRead && (
          <mesh position={[0, 0, 0.002]}>
            <planeGeometry args={[bWidth + 0.03, bHeight + 0.025]} />
            <meshBasicMaterial
              color="#00f0ff"
              wireframe
              wireframeLinewidth={2}
              transparent
              opacity={0.8}
            />
          </mesh>
        )}
      </group>
    );
  };

  return (
    <group
      ref={groupRef}
      position={[motion.currentX, conveyor.height + height / 2, carton.lateralOffsetZ || 0]}
      rotation={[0, THREE.MathUtils.degToRad(carton.rotationYaw || 0), 0]}
    >
      {/* Corrugated Box Main Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[length, height, width]} />
        <meshStandardMaterial
          map={cardboardTexture}
          roughness={0.8}
          metalness={0.05}
          color="#e0a365"
        />
      </mesh>

      {/* Box Corner Wireframe */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(length, height, width)]} />
        <lineBasicMaterial color="#854d19" linewidth={1.5} />
      </lineSegments>

      {/* Barcodes rendered on selected faces with X/Y surface offsets */}
      {(['top', 'bottom', 'left', 'right', 'front', 'back'] as BarcodeFace[]).map(face =>
        renderBarcodeForFace(face)
      )}

      {/* Scanning Target Bounding Ring */}
      <mesh
        ref={scanLaserRef}
        visible={isBeingRead}
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[Math.max(length, width) * 0.65, Math.max(length, width) * 0.72, 32]} />
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
