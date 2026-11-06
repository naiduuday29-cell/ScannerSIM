export type DimensionUnit = 'm' | 'mm' | 'in';
export type SpeedUnit = 'm/s' | 'm/min' | 'mm/s' | 'ft/min';
export type PartType = 'carton' | 'tyre';

export interface UnitConfig {
  dimension: DimensionUnit;
  speed: SpeedUnit;
}

export interface ConveyorConfig {
  width: number; // in meters (SI base)
  height: number; // conveyor surface elevation from ground in meters
  length: number; // conveyor length in meters
  beltSpeed: number; // m/s (SI base)
  sideRailHeight: number; // in meters
  color?: string; // conveyor belt color e.g. #00843D
}

export interface CartonDimensions {
  length: number; // X axis in meters
  width: number;  // Z axis in meters
  height: number; // Y axis in meters
  weightKg?: number;
}

export interface TyreDimensions {
  outerDiameter: number; // in meters (e.g. 0.65m = 650mm)
  innerDiameter: number; // rim hole diameter (e.g. 0.38m = 380mm / 15 inch)
  height: number;        // tread/section width when laying flat (e.g. 0.22m = 225mm)
  weightKg?: number;
}

export type BarcodeFace = 'top' | 'bottom' | 'left' | 'right' | 'front' | 'back';
export type TyreBarcodeLocation = 'sidewall_top' | 'sidewall_bottom' | 'tread';

export type CartonTargetType = 'small' | 'large' | 'custom';
export type TyreTargetType = 'passenger' | 'truck' | 'custom';

export interface CartonConfig {
  smallCarton: CartonDimensions;
  largeCarton: CartonDimensions;
  customCarton: CartonDimensions;
  activeTarget: CartonTargetType;
  lateralOffsetZ: number; // in meters relative to conveyor centerline
  rotationYaw: number;    // in degrees (skew angle on the belt)
  barcodeFaces: BarcodeFace[]; // multiple selected faces
  barcodeOffsetU: number; // -0.4 to +0.4 normalized offset along surface width
  barcodeOffsetV: number; // -0.4 to +0.4 normalized offset along surface height
  barcodeType: '1D_Code128' | '2D_DataMatrix' | 'QR_Code';
  barcodeWidth: number; // in meters
  barcodeHeight: number; // in meters
}

export interface TyreConfig {
  passengerTyre: TyreDimensions;
  truckTyre: TyreDimensions;
  customTyre: TyreDimensions;
  activeTarget: TyreTargetType;
  lateralOffsetZ: number; // in meters relative to conveyor centerline
  rotationYaw: number;    // in degrees (rotation angle around belt)
  barcodeLocation: TyreBarcodeLocation;
  radialDistanceRatio: number; // 0.0 (inner rim) to 1.0 (outer shoulder)
  radialAngleDeg: number;      // 0 to 360 degrees
  barcodeType: '1D_Code128' | '2D_DataMatrix' | 'QR_Code';
  barcodeWidth: number;
  barcodeHeight: number;
}

export interface OpticalTwoPointCalibration {
  enabled?: boolean;
  d1: number; // Near distance in meters
  w1: number; // Near capture width in meters (X-axis)
  h1: number; // Near capture height in meters (Y-axis)
  d2: number; // Far distance in meters
  w2: number; // Far capture width in meters (X-axis)
  h2: number; // Far capture height in meters (Y-axis)
  syncDof?: boolean; // Whether to update dofNear & dofFar from d1 & d2
}

export interface OpticalSpecs {
  horizontalFov: number; // in degrees
  verticalFov: number;   // in degrees
  dofNear: number;        // Near Limit in meters
  dofFar: number;         // Far Limit in meters
  maxRange: number;       // Extended range visual cut-off in meters
  resolution: string;
  scannerModel: string;
  focalLengthMm: number;
  twoPointCalibration?: OpticalTwoPointCalibration;
}

export interface Scanner {
  id: string;
  name: string;
  isActive: boolean;
  isLocked?: boolean; // When true, settings are protected from accidental modifications
  position: {
    x: number; // relative to conveyor center (m)
    y: number; // relative to conveyor surface (m)
    z: number; // relative to conveyor center (m)
  };
  rotation: {
    pitch: number; // degrees
    roll: number;  // degrees
    yaw: number;   // degrees
  };
  optical: OpticalSpecs;
  color: string;
}

export interface MotionSimulation {
  isPlaying: boolean;
  progress: number; // 0.0 to 1.0 along the conveyor length
  speedMultiplier: number; // 0.25, 0.5, 1, 2
  isLooping: boolean;
  currentX: number; // absolute X coordinate along conveyor
  elapsedTime: number;
}

export type ReadStatus = 'SEARCHING' | 'READING' | 'PASS' | 'FAIL';

export interface ScanHitInfo {
  scannerId: string;
  scannerName: string;
  distance: number;
  incidenceAngleDeg: number;
  face: string;
  inDofZone: boolean;
}

export interface TrajectorySample {
  x: number;
  y: number;
  z: number;
  isCovered: boolean;
  coveringScanners: string[];
}

export interface TelemetryState {
  readState: ReadStatus;
  activeHits: ScanHitInfo[];
  totalSamples: number;
  coveredSamples: number;
  coveragePercentage: number;
  blindSpotsCount: number;
  currentPassResult: 'PENDING' | 'PASS' | 'FAIL';
  firstReadX: number | null;
  lastReadX: number | null;
  history: Array<{
    id: string;
    timestamp: string;
    partType: PartType;
    target: string;
    speed: number;
    result: 'PASS' | 'FAIL';
    coveragePct: number;
    hitScanners: string[];
  }>;
}

export interface PresetTunnel {
  name: string;
  description: string;
  category: string;
  scanners: Scanner[];
}

export type FloorType = 'white' | 'gray';
export type EnvironmentType = 'open_white' | 'warehouse_shed';

export interface ViewSettings {
  showFrustums: boolean;
  showDofZones: boolean;
  showWireframe: boolean;
  showConveyorRollerMotion: boolean;
  showTrajectoryTrail: boolean;
  showGantryStructure: boolean;
  showOpticalRays: boolean;
  showFloorGrid: boolean;
  showHeatmap: boolean;
  environmentBrightness: number;
  cameraFov: number;
  floorType: FloorType;
  environmentType: EnvironmentType;
  gantryOpacity: number;
  conveyorOpacity: number;
  visionConeOpacity: number;
  dofZoneOpacity: number;
  trajectoryTrailOpacity: number;
  cameraSnapTarget?: {
    position: [number, number, number];
    target: [number, number, number];
    name: string;
    timestamp: number;
  };
}
