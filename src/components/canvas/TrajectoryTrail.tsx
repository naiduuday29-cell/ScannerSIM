import React from 'react';
import { useSimulator } from '../../context/SimulatorContext';

export const TrajectoryTrail: React.FC = () => {
  const { trajectorySamples, viewSettings } = useSimulator();

  if (!viewSettings.showTrajectoryTrail || trajectorySamples.length < 2) return null;

  const trailOpacity = viewSettings.trajectoryTrailOpacity ?? 0.85;

  return (
    <group>
      {trajectorySamples.map((sample, idx) => {
        if (idx === 0) return null;
        const prev = trajectorySamples[idx - 1];

        const p1: [number, number, number] = [prev.x, prev.y, prev.z];
        const p2: [number, number, number] = [sample.x, sample.y, sample.z];

        const isGood = sample.isCovered;
        const color = isGood ? '#10b981' : '#ef4444';

        return (
          <group key={idx}>
            {/* Trajectory Segment Line */}
            <lineSegments>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([...p1, ...p2])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color={color}
                linewidth={3}
                transparent
                opacity={Math.min(1.0, (isGood ? 0.95 : 0.45) * trailOpacity)}
              />
            </lineSegments>

            {/* Glowing Sample Beacon */}
            {idx % 4 === 0 && (
              <mesh position={p2}>
                <sphereGeometry args={[0.015, 8, 8]} />
                <meshBasicMaterial
                  color={color}
                  transparent
                  opacity={Math.min(1.0, (isGood ? 0.85 : 0.4) * trailOpacity)}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};
