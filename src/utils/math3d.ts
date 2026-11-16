import * as THREE from 'three';
import { Scanner, CartonDimensions, BarcodeFace, TyreDimensions, TyreBarcodeLocation, ScanHitInfo } from '../types';

/**
 * Creates a truncated pyramid BufferGeometry for a frustum segment between dNear and dFar
 */
export function createFrustumSegmentGeometry(
  dNear: number,
  dFar: number,
  hFovDeg: number,
  vFovDeg: number
): THREE.BufferGeometry {
  const hFovRad = THREE.MathUtils.degToRad(hFovDeg);
  const vFovRad = THREE.MathUtils.degToRad(vFovDeg);

  const tanH = Math.tan(hFovRad / 2);
  const tanV = Math.tan(vFovRad / 2);

  const xn = dNear * tanH;
  const yn = dNear * tanV;
  const zn = -dNear;

  const xf = dFar * tanH;
  const yf = dFar * tanV;
  const zf = -dFar;

  const v = [
    -xn,  yn, zn, // 0
     xn,  yn, zn, // 1
     xn, -yn, zn, // 2
    -xn, -yn, zn, // 3
    -xf,  yf, zf, // 4
     xf,  yf, zf, // 5
     xf, -yf, zf, // 6
    -xf, -yf, zf  // 7
  ];

  const indices = [
    0, 2, 1,  0, 3, 2, // Near face
    4, 5, 6,  4, 6, 7, // Far face
    0, 1, 5,  0, 5, 4, // Top face
    3, 6, 2,  3, 7, 6, // Bottom face
    1, 2, 6,  1, 6, 5, // Right face
    0, 4, 7,  0, 7, 3  // Left face
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates wireframe line geometry for the 12 bounding edges of a truncated frustum segment
 */
export function createFrustumWireframeGeometry(
  dNear: number,
  dFar: number,
  hFovDeg: number,
  vFovDeg: number
): THREE.BufferGeometry {
  const hFovRad = THREE.MathUtils.degToRad(hFovDeg);
  const vFovRad = THREE.MathUtils.degToRad(vFovDeg);

  const tanH = Math.tan(hFovRad / 2);
  const tanV = Math.tan(vFovRad / 2);

  const xn = dNear * tanH;
  const yn = dNear * tanV;
  const zn = -dNear;

  const xf = dFar * tanH;
  const yf = dFar * tanV;
  const zf = -dFar;

  const points = [
    // Near ring
    new THREE.Vector3(-xn,  yn, zn), new THREE.Vector3( xn,  yn, zn),
    new THREE.Vector3( xn,  yn, zn), new THREE.Vector3( xn, -yn, zn),
    new THREE.Vector3( xn, -yn, zn), new THREE.Vector3(-xn, -yn, zn),
    new THREE.Vector3(-xn, -yn, zn), new THREE.Vector3(-xn,  yn, zn),

    // Far ring
    new THREE.Vector3(-xf,  yf, zf), new THREE.Vector3( xf,  yf, zf),
    new THREE.Vector3( xf,  yf, zf), new THREE.Vector3( xf, -yf, zf),
    new THREE.Vector3( xf, -yf, zf), new THREE.Vector3(-xf, -yf, zf),
    new THREE.Vector3(-xf, -yf, zf), new THREE.Vector3(-xf,  yf, zf),

    // 4 corner struts
    new THREE.Vector3(-xn,  yn, zn), new THREE.Vector3(-xf,  yf, zf),
    new THREE.Vector3( xn,  yn, zn), new THREE.Vector3( xf,  yf, zf),
    new THREE.Vector3( xn, -yn, zn), new THREE.Vector3( xf, -yf, zf),
    new THREE.Vector3(-xn, -yn, zn), new THREE.Vector3(-xf, -yf, zf)
  ];

  return new THREE.BufferGeometry().setFromPoints(points);
}

/**
 * Creates a truncated pyramid BufferGeometry for a reflected frustum segment
 * expanding from the mirror base along reflected ray R
 */
export function createReflectedFrustumSegmentGeometry(
  sStart: number,
  sEnd: number,
  distA: number,
  wBase: number,
  hBase: number
): THREE.BufferGeometry {
  const safeDistA = Math.max(0.01, distA);
  const factorN = (safeDistA + sStart) / safeDistA;
  const factorF = (safeDistA + sEnd) / safeDistA;

  const xn = (wBase / 2) * factorN;
  const yn = (hBase / 2) * factorN;
  const zn = -sStart;

  const xf = (wBase / 2) * factorF;
  const yf = (hBase / 2) * factorF;
  const zf = -sEnd;

  const v = [
    -xn,  yn, zn, // 0
     xn,  yn, zn, // 1
     xn, -yn, zn, // 2
    -xn, -yn, zn, // 3
    -xf,  yf, zf, // 4
     xf,  yf, zf, // 5
     xf, -yf, zf, // 6
    -xf, -yf, zf  // 7
  ];

  const indices = [
    0, 2, 1,  0, 3, 2, // Near face
    4, 5, 6,  4, 6, 7, // Far face
    0, 1, 5,  0, 5, 4, // Top face
    3, 6, 2,  3, 7, 6, // Bottom face
    1, 2, 6,  1, 6, 5, // Right face
    0, 4, 7,  0, 7, 3  // Left face
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates wireframe line geometry for a reflected frustum segment
 */
export function createReflectedFrustumWireframeGeometry(
  sStart: number,
  sEnd: number,
  distA: number,
  wBase: number,
  hBase: number
): THREE.BufferGeometry {
  const safeDistA = Math.max(0.01, distA);
  const factorN = (safeDistA + sStart) / safeDistA;
  const factorF = (safeDistA + sEnd) / safeDistA;

  const xn = (wBase / 2) * factorN;
  const yn = (hBase / 2) * factorN;
  const zn = -sStart;

  const xf = (wBase / 2) * factorF;
  const yf = (hBase / 2) * factorF;
  const zf = -sEnd;

  const points = [
    // Near ring
    new THREE.Vector3(-xn,  yn, zn), new THREE.Vector3( xn,  yn, zn),
    new THREE.Vector3( xn,  yn, zn), new THREE.Vector3( xn, -yn, zn),
    new THREE.Vector3( xn, -yn, zn), new THREE.Vector3(-xn, -yn, zn),
    new THREE.Vector3(-xn, -yn, zn), new THREE.Vector3(-xn,  yn, zn),

    // Far ring
    new THREE.Vector3(-xf,  yf, zf), new THREE.Vector3( xf,  yf, zf),
    new THREE.Vector3( xf,  yf, zf), new THREE.Vector3( xf, -yf, zf),
    new THREE.Vector3( xf, -yf, zf), new THREE.Vector3(-xf, -yf, zf),
    new THREE.Vector3(-xf, -yf, zf), new THREE.Vector3(-xf,  yf, zf),

    // 4 corner struts
    new THREE.Vector3(-xn,  yn, zn), new THREE.Vector3(-xf,  yf, zf),
    new THREE.Vector3( xn,  yn, zn), new THREE.Vector3( xf,  yf, zf),
    new THREE.Vector3( xn, -yn, zn), new THREE.Vector3( xf, -yf, zf),
    new THREE.Vector3(-xn, -yn, zn), new THREE.Vector3(-xf, -yf, zf)
  ];

  return new THREE.BufferGeometry().setFromPoints(points);
}

/**
 * Creates BufferGeometry for a general 8-vertex polyhedron (frustum segment)
 * nearPts[0..3] (top-left, top-right, bottom-right, bottom-left)
 * farPts[0..3]  (top-left, top-right, bottom-right, bottom-left)
 */
export function createPolyhedronGeometry(
  nearPts: THREE.Vector3[],
  farPts: THREE.Vector3[]
): THREE.BufferGeometry {
  const v = [
    nearPts[0].x, nearPts[0].y, nearPts[0].z, // 0
    nearPts[1].x, nearPts[1].y, nearPts[1].z, // 1
    nearPts[2].x, nearPts[2].y, nearPts[2].z, // 2
    nearPts[3].x, nearPts[3].y, nearPts[3].z, // 3
    farPts[0].x,  farPts[0].y,  farPts[0].z,  // 4
    farPts[1].x,  farPts[1].y,  farPts[1].z,  // 5
    farPts[2].x,  farPts[2].y,  farPts[2].z,  // 6
    farPts[3].x,  farPts[3].y,  farPts[3].z   // 7
  ];

  const indices = [
    0, 2, 1,  0, 3, 2, // Near face
    4, 5, 6,  4, 6, 7, // Far face
    0, 1, 5,  0, 5, 4, // Top face
    3, 6, 2,  3, 7, 6, // Bottom face
    1, 2, 6,  1, 6, 5, // Right face
    0, 4, 7,  0, 7, 3  // Left face
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Creates wireframe lines for a general 8-vertex polyhedron
 */
export function createPolyhedronWireframeGeometry(
  nearPts: THREE.Vector3[],
  farPts: THREE.Vector3[]
): THREE.BufferGeometry {
  const points = [
    // Near ring
    nearPts[0], nearPts[1],
    nearPts[1], nearPts[2],
    nearPts[2], nearPts[3],
    nearPts[3], nearPts[0],

    // Far ring
    farPts[0], farPts[1],
    farPts[1], farPts[2],
    farPts[2], farPts[3],
    farPts[3], farPts[0],

    // 4 corner struts
    nearPts[0], farPts[0],
    nearPts[1], farPts[1],
    nearPts[2], farPts[2],
    nearPts[3], farPts[3]
  ];

  return new THREE.BufferGeometry().setFromPoints(points);
}

export interface FoldedOpticalPath {
  hasMirror: boolean;
  distanceA: number; // Standoff distance from scanner lens to mirror center (m)
  scannerLensPos: THREE.Vector3; // World position of scanner lens
  mirrorPos: THREE.Vector3; // World position of mirror center
  mirrorNormal: THREE.Vector3; // Surface normal of mirror (opposing incident ray)
  mirrorRotationEuler: THREE.Euler; // World Euler rotation of mirror
  mirrorWidth: number; // Physical mirror width (m)
  mirrorHeight: number; // Physical mirror height (m)
  incidentVector: THREE.Vector3; // Unit vector from scanner lens to mirror center
  reflectedVector: THREE.Vector3; // Unit reflected vector: R = I - 2 * (I . N) * N
  beamWidthAtMirror: number; // Incoming optical FOV cone width at mirror distance (m)
  beamHeightAtMirror: number; // Incoming optical FOV cone height at mirror distance (m)
  clampedBaseWidth: number; // Clamped width of reflected frustum base (m)
  clampedBaseHeight: number; // Clamped height of reflected frustum base (m)
  isApertureClipped: boolean; // True if incoming FOV cone exceeds mirror dimensions
  clippingPercentage: number; // Percentage of beam truncated by mirror aperture
  reflectedRotation: THREE.Euler; // Euler rotation for reflected frustum group pointing along R
  mirrorLocalAxes: {
    u: THREE.Vector3; // Mirror local horizontal axis in world space
    v: THREE.Vector3; // Mirror local vertical axis in world space
  };
  // Exact 3D world-space coordinates for seamless beam-to-mirror coupling
  lensCornersWorld: THREE.Vector3[];
  mirrorApertureCornersWorld: THREE.Vector3[];
  reflectedCornerRayDirs: THREE.Vector3[];
}

/**
 * Computes all folded optical path vectors, mirror normal, reflected vector,
 * and aperture clipping metrics for a scanner with a deflection mirror.
 */
export function computeMirrorFoldedPath(
  scanner: Scanner,
  conveyorSurfaceY = 0
): FoldedOpticalPath | null {
  const hasMirror = Boolean(scanner.hasMirror || scanner.mirror?.enabled);
  if (!hasMirror) return null;

  const mirrorWidth = scanner.mirror?.width ?? scanner.mirrorWidth ?? 0.25;
  const mirrorHeight = scanner.mirror?.height ?? scanner.mirrorHeight ?? 0.20;

  // Scanner World Position & Orientation
  const sPos = new THREE.Vector3(
    scanner.position.x,
    conveyorSurfaceY + scanner.position.y,
    scanner.position.z
  );
  const sEuler = new THREE.Euler(
    THREE.MathUtils.degToRad(scanner.rotation.pitch),
    THREE.MathUtils.degToRad(scanner.rotation.yaw),
    THREE.MathUtils.degToRad(scanner.rotation.roll),
    'YXZ'
  );
  const sBoresight = new THREE.Vector3(0, 0, -1).applyEuler(sEuler).normalize();
  const sUp = new THREE.Vector3(0, 1, 0).applyEuler(sEuler).normalize();
  const sRight = new THREE.Vector3(1, 0, 0).applyEuler(sEuler).normalize();

  // Mirror World Position
  let mPos: THREE.Vector3;
  if (scanner.mirror?.position) {
    mPos = new THREE.Vector3(
      scanner.mirror.position.x,
      conveyorSurfaceY + scanner.mirror.position.y,
      scanner.mirror.position.z
    );
  } else {
    const distA = scanner.mirror?.distanceFromScanner ?? 0.35;
    mPos = sPos.clone().addScaledVector(sBoresight, distA);
  }

  // Incident vector: from scanner lens to mirror center
  const vInc = mPos.clone().sub(sPos);
  const distanceA = Math.max(0.001, vInc.length());
  const incidentVector = vInc.clone().normalize();

  // Mirror Rotation & Local Axes
  let mEuler: THREE.Euler;
  if (scanner.mirror?.rotation) {
    mEuler = new THREE.Euler(
      THREE.MathUtils.degToRad(scanner.mirror.rotation.pitch),
      THREE.MathUtils.degToRad(scanner.mirror.rotation.yaw),
      THREE.MathUtils.degToRad(scanner.mirror.rotation.roll),
      'YXZ'
    );
  } else {
    // Default 45 deg pitch to deflect downward
    mEuler = new THREE.Euler(
      THREE.MathUtils.degToRad(scanner.rotation.pitch + 45),
      THREE.MathUtils.degToRad(scanner.rotation.yaw),
      THREE.MathUtils.degToRad(scanner.rotation.roll),
      'YXZ'
    );
  }

  // Mirror surface normal (in world coordinates)
  const mNormalRaw = new THREE.Vector3(0, 0, 1).applyEuler(mEuler).normalize();
  const mRight = new THREE.Vector3(1, 0, 0).applyEuler(mEuler).normalize();
  const mUp = new THREE.Vector3(0, 1, 0).applyEuler(mEuler).normalize();

  // Ensure normal faces opposing the incident vector (I . N <= 0)
  const mirrorNormal = incidentVector.dot(mNormalRaw) > 0 ? mNormalRaw.clone().negate() : mNormalRaw.clone();

  // Reflected Vector formula: R = I - 2 * (I . N) * N
  const dotIN = incidentVector.dot(mirrorNormal);
  const reflectedVector = incidentVector.clone().sub(mirrorNormal.clone().multiplyScalar(2 * dotIN)).normalize();

  // Beam dimensions at mirror distance (Distance A)
  const tanH = Math.tan(THREE.MathUtils.degToRad(scanner.optical.horizontalFov / 2));
  const tanV = Math.tan(THREE.MathUtils.degToRad(scanner.optical.verticalFov / 2));
  const beamWidthAtMirror = 2 * distanceA * tanH;
  const beamHeightAtMirror = 2 * distanceA * tanV;

  // Aperture Constraint: Clamp reflected frustum base to physical mirror boundaries
  const clampedBaseWidth = Math.min(beamWidthAtMirror, mirrorWidth);
  const clampedBaseHeight = Math.min(beamHeightAtMirror, mirrorHeight);

  // Check Aperture Clipping
  const isApertureClipped = beamWidthAtMirror > mirrorWidth || beamHeightAtMirror > mirrorHeight;
  const clipPctX = Math.max(0, (beamWidthAtMirror - mirrorWidth) / beamWidthAtMirror) * 100;
  const clipPctY = Math.max(0, (beamHeightAtMirror - mirrorHeight) / beamHeightAtMirror) * 100;
  const clippingPercentage = Math.round(Math.max(clipPctX, clipPctY));

  // Compute orientation for reflected frustum group pointing along R (where local -Z is along R)
  const zRefl = reflectedVector.clone().negate(); // -Z points along R
  let yReflTentative = sUp.clone().sub(mirrorNormal.clone().multiplyScalar(2 * sUp.dot(mirrorNormal)));
  if (yReflTentative.clone().cross(zRefl).lengthSq() < 0.001) {
    yReflTentative = sRight.clone().sub(mirrorNormal.clone().multiplyScalar(2 * sRight.dot(mirrorNormal)));
  }
  const xRefl = new THREE.Vector3().crossVectors(yReflTentative, zRefl).normalize();
  const yRefl = new THREE.Vector3().crossVectors(zRefl, xRefl).normalize();

  const rotMat = new THREE.Matrix4().makeBasis(xRefl, yRefl, zRefl);
  const reflectedRotation = new THREE.Euler().setFromRotationMatrix(rotMat, 'YXZ');

  // Exact 3D coordinates for flush boundary matching:
  // 1. Lens front face corners at standoff 0.04m from scanner nodal point
  const dLens = 0.04;
  const lensCornersWorld: THREE.Vector3[] = [
    sPos.clone().addScaledVector(sBoresight, dLens).addScaledVector(sRight, -dLens * tanH).addScaledVector(sUp, dLens * tanV),
    sPos.clone().addScaledVector(sBoresight, dLens).addScaledVector(sRight, dLens * tanH).addScaledVector(sUp, dLens * tanV),
    sPos.clone().addScaledVector(sBoresight, dLens).addScaledVector(sRight, dLens * tanH).addScaledVector(sUp, -dLens * tanV),
    sPos.clone().addScaledVector(sBoresight, dLens).addScaledVector(sRight, -dLens * tanH).addScaledVector(sUp, -dLens * tanV)
  ];

  // 2. Exact illuminated aperture corners ON the mirror plane surface
  const wHalf = clampedBaseWidth / 2;
  const hHalf = clampedBaseHeight / 2;
  const mirrorApertureCornersWorld: THREE.Vector3[] = [
    mPos.clone().addScaledVector(mRight, -wHalf).addScaledVector(mUp, hHalf),
    mPos.clone().addScaledVector(mRight, wHalf).addScaledVector(mUp, hHalf),
    mPos.clone().addScaledVector(mRight, wHalf).addScaledVector(mUp, -hHalf),
    mPos.clone().addScaledVector(mRight, -wHalf).addScaledVector(mUp, -hHalf)
  ];

  // 3. Exact reflected ray vector emerging from each of the 4 aperture corners
  const reflectedCornerRayDirs = mirrorApertureCornersWorld.map((cornerPt) => {
    const incVec = cornerPt.clone().sub(sPos).normalize();
    const dotC = incVec.dot(mirrorNormal);
    return incVec.clone().sub(mirrorNormal.clone().multiplyScalar(2 * dotC)).normalize();
  });

  return {
    hasMirror: true,
    distanceA,
    scannerLensPos: sPos,
    mirrorPos: mPos,
    mirrorNormal,
    mirrorRotationEuler: mEuler,
    mirrorWidth,
    mirrorHeight,
    incidentVector,
    reflectedVector,
    beamWidthAtMirror,
    beamHeightAtMirror,
    clampedBaseWidth,
    clampedBaseHeight,
    isApertureClipped,
    clippingPercentage,
    reflectedRotation,
    mirrorLocalAxes: {
      u: mRight,
      v: mUp
    },
    lensCornersWorld,
    mirrorApertureCornersWorld,
    reflectedCornerRayDirs
  };
}

/**
 * Creates default mirror configuration positioned along scanner optical axis
 */
export function getDefaultMirrorConfig(scanner: Scanner): import('../types').ScannerMirrorConfig {
  const distA = 0.35; // 350 mm standoff from lens
  const pitchRad = THREE.MathUtils.degToRad(scanner.rotation.pitch);
  const yawRad = THREE.MathUtils.degToRad(scanner.rotation.yaw);
  const rollRad = THREE.MathUtils.degToRad(scanner.rotation.roll);
  const euler = new THREE.Euler(pitchRad, yawRad, rollRad, 'YXZ');
  const forward = new THREE.Vector3(0, 0, -1).applyEuler(euler);

  return {
    enabled: true,
    width: 0.25,  // 250 mm
    height: 0.20, // 200 mm
    distanceFromScanner: distA,
    position: {
      x: Number((scanner.position.x + forward.x * distA).toFixed(3)),
      y: Number((scanner.position.y + forward.y * distA).toFixed(3)),
      z: Number((scanner.position.z + forward.z * distA).toFixed(3))
    },
    rotation: {
      pitch: Number((scanner.rotation.pitch + 45).toFixed(1)),
      roll: scanner.rotation.roll,
      yaw: scanner.rotation.yaw
    }
  };
}

/**
 * Builds the transformation matrix for a scanner
 */
export function getScannerMatrix(scanner: Scanner, conveyorSurfaceY: number): THREE.Matrix4 {
  const position = new THREE.Vector3(
    scanner.position.x,
    conveyorSurfaceY + scanner.position.y,
    scanner.position.z
  );

  const euler = new THREE.Euler(
    THREE.MathUtils.degToRad(scanner.rotation.pitch),
    THREE.MathUtils.degToRad(scanner.rotation.yaw),
    THREE.MathUtils.degToRad(scanner.rotation.roll),
    'YXZ'
  );

  const quaternion = new THREE.Quaternion().setFromEuler(euler);
  const matrix = new THREE.Matrix4().compose(position, quaternion, new THREE.Vector3(1, 1, 1));
  return matrix;
}

export interface BarcodeTargetInfo {
  face: string;
  center: THREE.Vector3;
  normal: THREE.Vector3;
  samplePoints: THREE.Vector3[];
}

/**
 * Calculates world-space position and sample points for barcode target(s) on a carton,
 * including surface X/Y offsets (U, V) and carton yaw rotation
 */
export function getCartonBarcodeTargets(
  cartonPos: THREE.Vector3,
  dimensions: CartonDimensions,
  faces: BarcodeFace[],
  rotationYawDeg = 0,
  offsetU = 0, // -0.4 to +0.4 normalized offset along surface horizontal
  offsetV = 0  // -0.4 to +0.4 normalized offset along surface vertical
): BarcodeTargetInfo[] {
  const halfL = dimensions.length / 2;
  const halfW = dimensions.width / 2;
  const halfH = dimensions.height / 2;

  const yawRad = THREE.MathUtils.degToRad(rotationYawDeg);
  const upAxis = new THREE.Vector3(0, 1, 0);

  return faces.map(face => {
    let localCenter = new THREE.Vector3();
    let normal = new THREE.Vector3();
    let u = new THREE.Vector3();
    let v = new THREE.Vector3();
    let faceWidth = 0.2;
    let faceHeight = 0.2;

    switch (face) {
      case 'top':
        localCenter.set(0, halfH + 0.002, 0);
        normal.set(0, 1, 0);
        u.set(1, 0, 0);
        v.set(0, 0, 1);
        faceWidth = dimensions.length;
        faceHeight = dimensions.width;
        break;
      case 'bottom':
        localCenter.set(0, -halfH - 0.002, 0);
        normal.set(0, -1, 0);
        u.set(1, 0, 0);
        v.set(0, 0, 1);
        faceWidth = dimensions.length;
        faceHeight = dimensions.width;
        break;
      case 'left':
        localCenter.set(0, 0, -halfW - 0.002);
        normal.set(0, 0, -1);
        u.set(1, 0, 0);
        v.set(0, 1, 0);
        faceWidth = dimensions.length;
        faceHeight = dimensions.height;
        break;
      case 'right':
        localCenter.set(0, 0, halfW + 0.002);
        normal.set(0, 0, 1);
        u.set(1, 0, 0);
        v.set(0, 1, 0);
        faceWidth = dimensions.length;
        faceHeight = dimensions.height;
        break;
      case 'front':
        localCenter.set(halfL + 0.002, 0, 0);
        normal.set(1, 0, 0);
        u.set(0, 0, 1);
        v.set(0, 1, 0);
        faceWidth = dimensions.width;
        faceHeight = dimensions.height;
        break;
      case 'back':
        localCenter.set(-halfL - 0.002, 0, 0);
        normal.set(-1, 0, 0);
        u.set(0, 0, 1);
        v.set(0, 1, 0);
        faceWidth = dimensions.width;
        faceHeight = dimensions.height;
        break;
    }

    // Shift barcode center along face horizontal (U) and vertical (V)
    const shiftU = offsetU * (faceWidth * 0.7);
    const shiftV = offsetV * (faceHeight * 0.7);
    localCenter.addScaledVector(u, shiftU).addScaledVector(v, shiftV);

    // Apply carton yaw rotation
    if (Math.abs(rotationYawDeg) > 0.001) {
      localCenter.applyAxisAngle(upAxis, yawRad);
      normal.applyAxisAngle(upAxis, yawRad);
      u.applyAxisAngle(upAxis, yawRad);
      v.applyAxisAngle(upAxis, yawRad);
    }

    const center = cartonPos.clone().add(localCenter);
    const uSpan = 0.08;
    const vSpan = 0.04;

    const samplePoints: THREE.Vector3[] = [
      center.clone(),
      center.clone().addScaledVector(u, uSpan * 0.45).addScaledVector(v, vSpan * 0.45),
      center.clone().addScaledVector(u, -uSpan * 0.45).addScaledVector(v, vSpan * 0.45),
      center.clone().addScaledVector(u, uSpan * 0.45).addScaledVector(v, -vSpan * 0.45),
      center.clone().addScaledVector(u, -uSpan * 0.45).addScaledVector(v, -vSpan * 0.45),
    ];

    return {
      face,
      center,
      normal,
      samplePoints
    };
  });
}

/**
 * Calculates world-space position and sample points for barcode target(s) on a tyre,
 * positioned by radial distance ratio and angle around circumference
 */
export function getTyreBarcodeTargets(
  tyrePos: THREE.Vector3,
  dimensions: TyreDimensions,
  location: TyreBarcodeLocation,
  radialDistanceRatio = 0.5, // 0.0 = inner bead, 1.0 = outer shoulder
  radialAngleDeg = 0,
  rotationYawDeg = 0
): BarcodeTargetInfo[] {
  const rOuter = dimensions.outerDiameter / 2;
  const rInner = dimensions.innerDiameter / 2;
  const halfH = dimensions.height / 2;

  const totalAngleDeg = (radialAngleDeg + rotationYawDeg) % 360;
  const theta = THREE.MathUtils.degToRad(totalAngleDeg);

  let localCenter = new THREE.Vector3();
  let normal = new THREE.Vector3();
  let u = new THREE.Vector3(); // tangential
  let v = new THREE.Vector3(); // radial or vertical

  if (location === 'tread') {
    // Barcode on outer perimeter tread
    const r = rOuter + 0.005;
    localCenter.set(r * Math.cos(theta), 0, r * Math.sin(theta));
    normal.set(Math.cos(theta), 0, Math.sin(theta)); // outward
    u.set(-Math.sin(theta), 0, Math.cos(theta)); // tangent along circumference
    v.set(0, 1, 0); // across tread width
  } else {
    // Sidewall (top or bottom face) - positioned near bead matching reference photo
    const isTop = location === 'sidewall_top';
    const shoulderMargin = 0.035;
    const rSpan = Math.max(0.04, rOuter - rInner - shoulderMargin);
    const r = rInner + 0.02 + radialDistanceRatio * rSpan;
    const y = isTop ? halfH + 0.002 : -halfH - 0.002;

    localCenter.set(r * Math.cos(theta), y, r * Math.sin(theta));
    normal.set(0, isTop ? 1 : -1, 0);
    u.set(-Math.sin(theta), 0, Math.cos(theta)); // tangential along circumference
    v.set(Math.cos(theta), 0, Math.sin(theta));  // radial from center
  }

  const center = tyrePos.clone().add(localCenter);
  const uSpan = 0.075; // 75mm length along tangent
  const vSpan = 0.022; // 22mm height along radius

  const samplePoints: THREE.Vector3[] = [
    center.clone(),
    center.clone().addScaledVector(u, uSpan * 0.45).addScaledVector(v, vSpan * 0.45),
    center.clone().addScaledVector(u, -uSpan * 0.45).addScaledVector(v, vSpan * 0.45),
    center.clone().addScaledVector(u, uSpan * 0.45).addScaledVector(v, -vSpan * 0.45),
    center.clone().addScaledVector(u, -uSpan * 0.45).addScaledVector(v, -vSpan * 0.45),
  ];

  return [{
    face: `tyre_${location}`,
    center,
    normal,
    samplePoints
  }];
}

/**
 * Evaluates whether a barcode target is read by a specific scanner
 */
export function testBarcodeScannerIntersection(
  target: BarcodeTargetInfo,
  scanner: Scanner,
  scannerWorldMatrix: THREE.Matrix4,
  scannerInverseMatrix: THREE.Matrix4,
  conveyorHeight = 0
): ScanHitInfo | null {
  if (!scanner.isActive) return null;

  // 1. Folded Optical Path via Mirror
  if (scanner.hasMirror || scanner.mirror?.enabled) {
    const mirrorData = computeMirrorFoldedPath(scanner, conveyorHeight);
    if (mirrorData) {
      return testFoldedMirrorBarcodeIntersection(target, scanner, mirrorData, scannerInverseMatrix);
    }
  }

  // 2. Direct Line-of-Sight
  const scannerPos = new THREE.Vector3().setFromMatrixPosition(scannerWorldMatrix);
  const tanH = Math.tan(THREE.MathUtils.degToRad(scanner.optical.horizontalFov / 2));
  const tanV = Math.tan(THREE.MathUtils.degToRad(scanner.optical.verticalFov / 2));

  // Check incidence angle
  const toScannerVec = new THREE.Vector3().subVectors(scannerPos, target.center).normalize();
  const cosIncidence = target.normal.dot(toScannerVec);

  if (cosIncidence <= 0.05) {
    return null;
  }

  const incidenceAngleDeg = THREE.MathUtils.radToDeg(Math.acos(Math.min(1, Math.max(-1, cosIncidence))));
  if (incidenceAngleDeg > 70) {
    return null;
  }

  // Test sample points in scanner local space
  let pointsInValidZone = 0;
  let averageDistance = 0;

  for (const point of target.samplePoints) {
    const localPoint = point.clone().applyMatrix4(scannerInverseMatrix);
    const depth = -localPoint.z;

    if (depth <= 0.05) continue;

    const maxHalfX = depth * tanH;
    const maxHalfY = depth * tanV;

    if (Math.abs(localPoint.x) <= maxHalfX && Math.abs(localPoint.y) <= maxHalfY) {
      if (depth >= scanner.optical.dofNear && depth <= scanner.optical.dofFar) {
        pointsInValidZone++;
        averageDistance += depth;
      }
    }
  }

  if (pointsInValidZone >= 3) {
    return {
      scannerId: scanner.id,
      scannerName: scanner.name,
      distance: averageDistance / pointsInValidZone,
      incidenceAngleDeg,
      face: target.face,
      inDofZone: true
    };
  }

  return null;
}

/**
 * Evaluates barcode target reading through folded mirror reflection with aperture clipping
 */
function testFoldedMirrorBarcodeIntersection(
  target: BarcodeTargetInfo,
  scanner: Scanner,
  mirrorData: FoldedOpticalPath,
  scannerInverseMatrix: THREE.Matrix4
): ScanHitInfo | null {
  const {
    mirrorPos,
    mirrorNormal,
    mirrorWidth,
    mirrorHeight,
    distanceA,
    mirrorLocalAxes,
    scannerLensPos
  } = mirrorData;

  // 1. Incidence angle on barcode: barcode must face toward mirror
  const toMirrorVec = new THREE.Vector3().subVectors(mirrorPos, target.center).normalize();
  const cosIncidence = target.normal.dot(toMirrorVec);
  if (cosIncidence <= 0.05) {
    return null;
  }

  const incidenceAngleDeg = THREE.MathUtils.radToDeg(Math.acos(Math.min(1, Math.max(-1, cosIncidence))));
  if (incidenceAngleDeg > 70) {
    return null;
  }

  const tanH = Math.tan(THREE.MathUtils.degToRad(scanner.optical.horizontalFov / 2));
  const tanV = Math.tan(THREE.MathUtils.degToRad(scanner.optical.verticalFov / 2));

  let pointsInValidZone = 0;
  let totalDistanceSum = 0;

  for (const point of target.samplePoints) {
    // Reflect sample point across the mirror plane to obtain virtual image
    const vToPlane = point.clone().sub(mirrorPos);
    const distToPlane = vToPlane.dot(mirrorNormal);
    const virtualPoint = point.clone().sub(mirrorNormal.clone().multiplyScalar(2 * distToPlane));

    // Physical aperture check: Does ray from scanner lens to virtual target pass through physical mirror?
    const rayDir = virtualPoint.clone().sub(scannerLensPos);
    const denom = rayDir.dot(mirrorNormal);
    if (Math.abs(denom) > 0.0001) {
      const t = mirrorPos.clone().sub(scannerLensPos).dot(mirrorNormal) / denom;
      if (t > 0 && t <= 1.0) {
        const hitOnMirror = scannerLensPos.clone().addScaledVector(rayDir, t);
        const hitOffset = hitOnMirror.clone().sub(mirrorPos);

        const localX = hitOffset.dot(mirrorLocalAxes.u);
        const localY = hitOffset.dot(mirrorLocalAxes.v);

        // If ray falls outside physical mirror rectangular aperture, it is clipped
        if (Math.abs(localX) > mirrorWidth / 2 || Math.abs(localY) > mirrorHeight / 2) {
          continue;
        }
      }
    }

    // Distance B (from mirror to target)
    const distanceB = point.distanceTo(mirrorPos);
    const totalEffectiveDistance = distanceA + distanceB;

    // Transform virtual point into scanner local space
    const localVirtual = virtualPoint.clone().applyMatrix4(scannerInverseMatrix);
    const depth = -localVirtual.z;

    if (depth <= 0.05) continue;

    const maxHalfX = depth * tanH;
    const maxHalfY = depth * tanV;

    if (Math.abs(localVirtual.x) <= maxHalfX && Math.abs(localVirtual.y) <= maxHalfY) {
      if (totalEffectiveDistance >= scanner.optical.dofNear && totalEffectiveDistance <= scanner.optical.dofFar) {
        pointsInValidZone++;
        totalDistanceSum += totalEffectiveDistance;
      }
    }
  }

  if (pointsInValidZone >= 3) {
    return {
      scannerId: scanner.id,
      scannerName: scanner.name,
      distance: totalDistanceSum / pointsInValidZone,
      incidenceAngleDeg,
      face: target.face,
      inDofZone: true
    };
  }

  return null;
}

/**
 * Calculates optical Horizontal and Vertical Viewing Angles (FOV)
 * from capture area dimensions (Width X, Height Y) at two distance points (D1 near, D2 far).
 *
 * Formula:
 * tan(FOV_H / 2) = (W2 - W1) / (2 * (D2 - D1))
 * tan(FOV_V / 2) = (H2 - H1) / (2 * (D2 - D1))
 */
export function calculateFovFromTwoDistancePoints(
  d1: number, // Near distance (meters)
  w1: number, // Near capture width / X-axis (meters)
  h1: number, // Near capture height / Y-axis (meters)
  d2: number, // Far distance (meters)
  w2: number, // Far capture width / X-axis (meters)
  h2: number  // Far capture height / Y-axis (meters)
): {
  horizontalFovDeg: number;
  verticalFovDeg: number;
  isValid: boolean;
  error?: string;
} {
  const deltaD = d2 - d1;
  const deltaW = w2 - w1;
  const deltaH = h2 - h1;

  if (deltaD <= 0.0001) {
    return {
      horizontalFovDeg: 0,
      verticalFovDeg: 0,
      isValid: false,
      error: 'Far distance (Point 2) must be greater than Near distance (Point 1)'
    };
  }

  if (deltaW <= 0.0001) {
    return {
      horizontalFovDeg: 0,
      verticalFovDeg: 0,
      isValid: false,
      error: 'Far capture width (W2) must be greater than Near capture width (W1)'
    };
  }

  if (deltaH <= 0.0001) {
    return {
      horizontalFovDeg: 0,
      verticalFovDeg: 0,
      isValid: false,
      error: 'Far capture height (H2) must be greater than Near capture height (H1)'
    };
  }

  const hFovRad = 2 * Math.atan(deltaW / (2 * deltaD));
  const vFovRad = 2 * Math.atan(deltaH / (2 * deltaD));

  const hDeg = THREE.MathUtils.radToDeg(hFovRad);
  const vDeg = THREE.MathUtils.radToDeg(vFovRad);

  return {
    horizontalFovDeg: Math.round(hDeg * 10) / 10,
    verticalFovDeg: Math.round(vDeg * 10) / 10,
    isValid: true
  };
}
