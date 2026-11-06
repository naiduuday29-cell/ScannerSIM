import * as THREE from 'three';

// Global orientation bridge between main canvas and ViewCube overlay canvas
export const cameraSyncState = {
  quaternion: new THREE.Quaternion(),
  position: new THREE.Vector3(4, 3, 4),
  target: new THREE.Vector3(0, 0.85, 0),
  pitchDeg: 35,
  yawDeg: 45,
  listeners: new Set<() => void>()
};

export function updateMainCameraState(
  quaternion: THREE.Quaternion,
  position: THREE.Vector3,
  target: THREE.Vector3
) {
  cameraSyncState.quaternion.copy(quaternion);
  cameraSyncState.position.copy(position);
  cameraSyncState.target.copy(target);

  // Compute spherical angles relative to target
  const offset = new THREE.Vector3().subVectors(position, target);
  const radius = offset.length();
  if (radius > 0.001) {
    const pitch = Math.asin(Math.max(-1, Math.min(1, offset.y / radius)));
    const yaw = Math.atan2(offset.x, offset.z);
    cameraSyncState.pitchDeg = Math.round(THREE.MathUtils.radToDeg(pitch));
    cameraSyncState.yawDeg = Math.round(THREE.MathUtils.radToDeg(yaw));
  }

  // Notify listeners
  cameraSyncState.listeners.forEach(fn => fn());
}

export function subscribeCameraSync(listener: () => void): () => void {
  cameraSyncState.listeners.add(listener);
  return () => {
    cameraSyncState.listeners.delete(listener);
  };
}
