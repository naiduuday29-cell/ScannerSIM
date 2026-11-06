import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useSimulator } from '../../context/SimulatorContext';
import { getWarehouseFloorBumpTexture, getWarehouseFloorTexture } from '../../utils/textureGenerator';

export const SceneEnvironment: React.FC = () => {
  const { conveyor, viewSettings } = useSimulator();
  const brightness = viewSettings.environmentBrightness || 1.6;
  const isWhiteFloor = viewSettings.floorType === 'white';
  const isWarehouseShed = viewSettings.environmentType === 'warehouse_shed';

  // Authentic polished industrial warehouse concrete floor textures
  const floorTexture = useMemo(() => getWarehouseFloorTexture(), []);
  const floorBump = useMemo(() => getWarehouseFloorBumpTexture(), []);

  const fogColor = isWarehouseShed ? '#b0bac7' : '#ffffff';
  const fogNear = isWarehouseShed ? 25 : 18;
  const fogFar = isWarehouseShed ? 65 : 48;

  return (
    <group>
      {/* Dynamic Horizon Atmosphere Fog */}
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

      {/* Omnidirectional Sky / Ground Ambient Fill Light */}
      <hemisphereLight
        args={[
          isWarehouseShed ? '#f8fafc' : '#ffffff',
          isWarehouseShed ? '#94a3b8' : '#f1f5f9',
          1.2 * brightness
        ]}
      />

      {/* Main Overhead Ambient Fill Light */}
      <ambientLight intensity={0.9 * brightness} />

      {/* Primary Key Spotlight casting soft realistic shadows */}
      <directionalLight
        position={[8, 14, 9]}
        intensity={1.6 * brightness}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={42}
        shadow-camera-left={-conveyor.length * 0.9}
        shadow-camera-right={conveyor.length * 0.9}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0003}
      />

      {/* Front-Fill Light (brightens carton faces and side rails) */}
      <directionalLight
        position={[conveyor.length * 0.5, 4, -6]}
        intensity={0.9 * brightness}
        color="#ffffff"
      />

      {/* Rear Rim Light for depth definition */}
      <directionalLight
        position={[-conveyor.length * 0.6, 5, 6]}
        intensity={0.7 * brightness}
        color="#f8fafc"
      />

      {/* Ground Upward Soft Fill */}
      <directionalLight
        position={[0, -2, 0]}
        intensity={0.4 * brightness}
        color="#ffffff"
      />

      {/* =========================================================================
          FLOOR (WHITE STUDIO VS REALISTIC GREY WAREHOUSE CONCRETE)
         ========================================================================= */}
      {isWhiteFloor ? (
        <mesh
          key="floor-white-mesh"
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.001, 0]}
          receiveShadow
        >
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.2}
            metalness={0.02}
          />
        </mesh>
      ) : (
        <mesh
          key="floor-gray-mesh"
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.001, 0]}
          receiveShadow
        >
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial
            color="#ffffff"
            map={floorTexture}
            bumpMap={floorBump}
            bumpScale={0.003}
            roughness={0.42}
            metalness={0.08}
          />
        </mesh>
      )}

      {/* Clean Engineering Coordinate Floor Grid */}
      {viewSettings.showFloorGrid && (
        <gridHelper
          key={`grid-${isWhiteFloor ? 'white' : 'gray'}`}
          args={[
            36,
            72,
            isWhiteFloor ? '#94a3b8' : '#475569',
            isWhiteFloor ? '#e2e8f0' : '#64748b'
          ]}
          position={[0, 0.002, 0]}
        />
      )}

      {/* Conveyor Safety Perimeter Boundary Lines (Industrial Yellow Hazard Line) */}
      <group position={[0, 0.003, 0]}>
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={8}
              array={new Float32Array([
                -(conveyor.length / 2 + 0.6), 0, -(conveyor.width / 2 + 0.6),
                 (conveyor.length / 2 + 0.6), 0, -(conveyor.width / 2 + 0.6),

                 (conveyor.length / 2 + 0.6), 0, -(conveyor.width / 2 + 0.6),
                 (conveyor.length / 2 + 0.6), 0,  (conveyor.width / 2 + 0.6),

                 (conveyor.length / 2 + 0.6), 0,  (conveyor.width / 2 + 0.6),
                -(conveyor.length / 2 + 0.6), 0,  (conveyor.width / 2 + 0.6),

                -(conveyor.length / 2 + 0.6), 0,  (conveyor.width / 2 + 0.6),
                -(conveyor.length / 2 + 0.6), 0, -(conveyor.width / 2 + 0.6),
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#eab308" linewidth={2} transparent opacity={0.85} />
        </lineSegments>
      </group>

      {/* =========================================================================
          WAREHOUSE SHED ENCLOSURE (Walls, Roof Trusses, High-Bay UFO LED Fixtures)
         ========================================================================= */}
      {isWarehouseShed && <WarehouseShedStructure />}
    </group>
  );
};

// =============================================================================
// SUBCOMPONENT: Industrial Logistics Warehouse Shed Structure
// =============================================================================
const WarehouseShedStructure: React.FC = () => {
  // Spacious warehouse hall: 54m long (X), 38m wide (Z), 11m ceiling height (Y)
  // Positioned far outside conveyor (conveyor is at center, so walls are at X = ±27m and Z = ±19m)
  const hallLength = 54;
  const hallWidth = 38;
  const hallHeight = 11.0;
  const halfX = hallLength / 2;
  const halfZ = hallWidth / 2;

  // Steel roof truss positions along X axis
  const trussPositions = useMemo(() => {
    return [-18, -9, 0, 9, 18];
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* Inverted Warehouse Room Enclosure (Walls & Ceiling)
          Using BackSide ensures near walls never block camera view from any orbit angle,
          and distant walls form the authentic warehouse interior backdrop without clipping equipment! */}
      <mesh position={[0, hallHeight / 2, 0]}>
        <boxGeometry args={[hallLength, hallHeight, hallWidth]} />
        <meshStandardMaterial
          color="#525d6b"
          roughness={0.7}
          metalness={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Far End Loading Bay Doors (at X = -halfX + 0.05) */}
      <group position={[-halfX + 0.1, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 2.5, 0]}>
          <planeGeometry args={[5.2, 5.0]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} side={THREE.DoubleSide} />
        </mesh>
        <lineSegments position={[0, 2.5, 0.01]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(5.4, 5.2)]} />
          <lineBasicMaterial color="#eab308" linewidth={3} />
        </lineSegments>
      </group>

      {/* Opposite Far End Exit Bay Doors (at X = halfX - 0.05) */}
      <group position={[halfX - 0.1, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, 2.5, 0]}>
          <planeGeometry args={[5.2, 5.0]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} side={THREE.DoubleSide} />
        </mesh>
        <lineSegments position={[0, 2.5, 0.01]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(5.4, 5.2)]} />
          <lineBasicMaterial color="#eab308" linewidth={3} />
        </lineSegments>
      </group>

      {/* High Clerestory Window Bands along the top of side walls (Z = ±halfZ) */}
      {[-halfZ + 0.1, halfZ - 0.1].map((zPos, idx) => (
        <mesh key={`window-${idx}`} position={[0, hallHeight - 1.2, zPos]}>
          <boxGeometry args={[hallLength * 0.9, 1.2, 0.05]} />
          <meshBasicMaterial color="#94a3b8" transparent opacity={0.6} />
        </mesh>
      ))}

      {/* Structural Vertical Wall Columns along side perimeter */}
      {trussPositions.map((xPos, idx) => (
        <React.Fragment key={`wall-cols-${idx}`}>
          <mesh position={[xPos, hallHeight / 2, -halfZ + 0.2]}>
            <boxGeometry args={[0.3, hallHeight, 0.3]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[xPos, hallHeight / 2, halfZ - 0.2]}>
            <boxGeometry args={[0.3, hallHeight, 0.3]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
        </React.Fragment>
      ))}

      {/* Open-Web Steel Roof Trusses Spanning Across Ceiling (Z Axis at Y = 10m) */}
      {trussPositions.map((xPos, tIdx) => (
        <group key={`truss-${tIdx}`} position={[xPos, hallHeight - 1.0, 0]}>
          {/* Top Chord Beam */}
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[0.15, 0.08, hallWidth - 0.4]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Bottom Chord Beam */}
          <mesh position={[0, -0.35, 0]}>
            <boxGeometry args={[0.15, 0.08, hallWidth - 0.4]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Triangular Webbing Diagonal Struts */}
          {[-14, -10, -6, -2, 2, 6, 10, 14].map((zOffset, wIdx) => (
            <mesh
              key={`web-${wIdx}`}
              position={[0, 0, zOffset]}
              rotation={[0, 0, (wIdx % 2 === 0 ? 1 : -1) * 0.55]}
            >
              <boxGeometry args={[0.06, 0.8, 0.06]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}

          {/* Suspended High-Bay UFO LED Luminaire above the conveyor */}
          <group position={[0, -0.85, 0]}>
            {/* Hanging rod */}
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.5, 8]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            {/* UFO LED housing */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.22, 0.3, 0.08, 20]} />
              <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
            </mesh>
            {/* Emissive high-output LED lens */}
            <mesh position={[0, -0.041, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.22, 20]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
};
