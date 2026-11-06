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
  scannerInverseMatrix: THREE.Matrix4
): ScanHitInfo | null {
  if (!scanner.isActive) return null;

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
