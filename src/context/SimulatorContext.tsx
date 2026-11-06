import React, { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import {
  ConveyorConfig,
  CartonConfig,
  CartonDimensions,
  BarcodeFace,
  TyreConfig,
  TyreDimensions,
  PartType,
  Scanner,
  ScannerLibraryItem,
  MotionSimulation,
  TelemetryState,
  ViewSettings,
  ScanHitInfo,
  TrajectorySample,
  UnitConfig
} from '../types';
import { INITIAL_SCANNERS, PRESET_TUNNELS } from '../utils/presets';
import { loadSavedScannerLibrary, saveScannerLibrary } from '../utils/scannerLibraryPresets';
import { getCartonBarcodeTargets, getTyreBarcodeTargets, getScannerMatrix, testBarcodeScannerIntersection } from '../utils/math3d';
import * as THREE from 'three';

interface SimulatorContextType {
  // Unit System
  units: UnitConfig;
  updateUnits: (updates: Partial<UnitConfig>) => void;

  // Part Type (Carton vs Tyre)
  partType: PartType;
  setPartType: (type: PartType) => void;

  // Conveyor state
  conveyor: ConveyorConfig;
  updateConveyor: (updates: Partial<ConveyorConfig>) => void;

  // Carton state
  carton: CartonConfig;
  updateCarton: (updates: Partial<CartonConfig>) => void;
  toggleBarcodeFace: (face: BarcodeFace) => void;
  setAllBarcodeFaces: (faces: BarcodeFace[]) => void;
  getActiveDimensions: () => CartonDimensions;

  // Tyre state
  tyre: TyreConfig;
  updateTyre: (updates: Partial<TyreConfig>) => void;
  getActiveTyreDimensions: () => TyreDimensions;

  // Scanners state
  scanners: Scanner[];
  selectedScannerId: string | null;
  setSelectedScannerId: (id: string | null) => void;
  addScanner: (scanner?: Partial<Scanner>) => void;
  updateScanner: (id: string, updates: Partial<Scanner>) => void;
  removeScanner: (id: string) => void;
  duplicateScanner: (id: string) => void;
  moveScanner: (id: string, direction: 'up' | 'down') => void;
  reorderScanners: (fromIndex: number, toIndex: number) => void;
  loadPreset: (presetName: string) => void;

  // Scanner Library & FOV Presets
  scannerLibrary: ScannerLibraryItem[];
  addLibraryScanner: (item: Omit<ScannerLibraryItem, 'id'>) => string;
  updateLibraryScanner: (id: string, updates: Partial<ScannerLibraryItem>) => void;
  removeLibraryScanner: (id: string) => void;
  applyLibraryScannerToScanner: (scannerId: string, libraryItemId: string) => void;
  isScannerLibraryOpen: boolean;
  setIsScannerLibraryOpen: (open: boolean) => void;

  // Motion simulation
  motion: MotionSimulation;
  setMotionPlaying: (playing: boolean) => void;
  setMotionProgress: (progress: number) => void;
  setSpeedMultiplier: (mult: number) => void;
  toggleLooping: () => void;
  resetMotion: () => void;
  stepMotion: (deltaX: number) => void;

  // Telemetry & Analysis
  telemetry: TelemetryState;
  trajectorySamples: TrajectorySample[];
  resetTelemetry: () => void;

  // View & Camera Snap
  viewSettings: ViewSettings;
  updateViewSettings: (updates: Partial<ViewSettings>) => void;
  cameraSnap: { position: [number, number, number]; target: [number, number, number]; name: string; key: number } | null;
  snapCameraTo: (view: 'TOP' | 'BOTTOM' | 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'ISOMETRIC' | 'TUNNEL') => void;
  snapCameraToAngles: (pitchDeg: number, yawDeg: number, distance?: number) => void;

  // Export / Import
  exportConfiguration: () => void;
  importConfiguration: (jsonString: string) => boolean;
}

const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined);

const DEFAULT_UNITS: UnitConfig = {
  dimension: 'mm',
  speed: 'm/min'
};

const DEFAULT_CONVEYOR: ConveyorConfig = {
  width: 0.9,
  height: 0.85,
  length: 5.0,
  beltSpeed: 1.2,
  sideRailHeight: 0.08,
  color: '#00843D'
};

const DEFAULT_CARTON: CartonConfig = {
  smallCarton: { length: 0.32, width: 0.22, height: 0.18, weightKg: 2.5 },
  largeCarton: { length: 0.58, width: 0.42, height: 0.38, weightKg: 8.0 },
  customCarton: { length: 0.45, width: 0.30, height: 0.25, weightKg: 4.5 },
  activeTarget: 'small',
  lateralOffsetZ: 0.0,
  rotationYaw: 0,
  barcodeFaces: ['top'],
  barcodeOffsetU: 0.0,
  barcodeOffsetV: 0.0,
  barcodeType: '1D_Code128',
  barcodeWidth: 0.14,
  barcodeHeight: 0.06
};

const DEFAULT_TYRE: TyreConfig = {
  passengerTyre: { outerDiameter: 0.65, innerDiameter: 0.38, height: 0.22, weightKg: 9.5 },
  truckTyre: { outerDiameter: 1.05, innerDiameter: 0.57, height: 0.31, weightKg: 45.0 },
  customTyre: { outerDiameter: 0.75, innerDiameter: 0.42, height: 0.25, weightKg: 14.0 },
  activeTarget: 'passenger',
  lateralOffsetZ: 0.0,
  rotationYaw: 0,
  barcodeLocation: 'sidewall_top',
  radialDistanceRatio: 0.35,
  radialAngleDeg: 45,
  barcodeType: '1D_Code128',
  barcodeWidth: 0.12,
  barcodeHeight: 0.05
};

const DEFAULT_VIEW_SETTINGS: ViewSettings = {
  showFrustums: true,
  showDofZones: true,
  showWireframe: false,
  showConveyorRollerMotion: true,
  showTrajectoryTrail: true,
  showGantryStructure: true,
  showOpticalRays: true,
  showFloorGrid: true,
  showHeatmap: true,
  environmentBrightness: 1.6,
  cameraFov: 45,
  floorType: 'gray',
  environmentType: 'warehouse_shed',
  gantryOpacity: 1.0,
  conveyorOpacity: 1.0,
  visionConeOpacity: 0.35,
  dofZoneOpacity: 0.45,
  trajectoryTrailOpacity: 0.85
};

export const SimulatorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [units, setUnits] = useState<UnitConfig>(DEFAULT_UNITS);
  const [partType, setPartTypeState] = useState<PartType>('carton');
  const [conveyor, setConveyor] = useState<ConveyorConfig>(DEFAULT_CONVEYOR);
  const [carton, setCarton] = useState<CartonConfig>(DEFAULT_CARTON);
  const [tyre, setTyre] = useState<TyreConfig>(DEFAULT_TYRE);
  const [scanners, setScanners] = useState<Scanner[]>(INITIAL_SCANNERS);
  const [selectedScannerId, setSelectedScannerId] = useState<string | null>(null);
  const [scannerLibrary, setScannerLibrary] = useState<ScannerLibraryItem[]>(() => loadSavedScannerLibrary());
  const [isScannerLibraryOpen, setIsScannerLibraryOpen] = useState(false);

  const [motion, setMotion] = useState<MotionSimulation>({
    isPlaying: true,
    progress: 0.0,
    speedMultiplier: 1.0,
    isLooping: true,
    currentX: -DEFAULT_CONVEYOR.length / 2,
    elapsedTime: 0
  });

  const [trajectorySamples, setTrajectorySamples] = useState<TrajectorySample[]>([]);

  const [telemetry, setTelemetry] = useState<TelemetryState>({
    readState: 'SEARCHING',
    activeHits: [],
    totalSamples: 0,
    coveredSamples: 0,
    coveragePercentage: 0,
    blindSpotsCount: 0,
    currentPassResult: 'PENDING',
    firstReadX: null,
    lastReadX: null,
    history: []
  });

  const [viewSettings, setViewSettings] = useState<ViewSettings>(DEFAULT_VIEW_SETTINGS);
  const [cameraSnap, setCameraSnap] = useState<{
    position: [number, number, number];
    target: [number, number, number];
    name: string;
    key: number;
  } | null>(null);

  const setPartType = useCallback((type: PartType) => {
    setPartTypeState(type);
    setTrajectorySamples([]);
    setTelemetry(prev => ({
      ...prev,
      readState: 'SEARCHING',
      activeHits: [],
      currentPassResult: 'PENDING'
    }));
  }, []);

  const updateUnits = useCallback((updates: Partial<UnitConfig>) => {
    setUnits(prev => ({ ...prev, ...updates }));
  }, []);

  const getActiveDimensions = useCallback((): CartonDimensions => {
    if (carton.activeTarget === 'small') return carton.smallCarton;
    if (carton.activeTarget === 'large') return carton.largeCarton;
    return carton.customCarton;
  }, [carton]);

  const getActiveTyreDimensions = useCallback((): TyreDimensions => {
    if (tyre.activeTarget === 'passenger') return tyre.passengerTyre;
    if (tyre.activeTarget === 'truck') return tyre.truckTyre;
    return tyre.customTyre;
  }, [tyre]);

  const updateConveyor = useCallback((updates: Partial<ConveyorConfig>) => {
    setConveyor(prev => ({ ...prev, ...updates }));
  }, []);

  const updateCarton = useCallback((updates: Partial<CartonConfig>) => {
    setCarton(prev => ({ ...prev, ...updates }));
    setTelemetry(prev => ({
      ...prev,
      readState: 'SEARCHING',
      activeHits: [],
      currentPassResult: 'PENDING'
    }));
    setTrajectorySamples([]);
  }, []);

  const updateTyre = useCallback((updates: Partial<TyreConfig>) => {
    setTyre(prev => ({ ...prev, ...updates }));
    setTelemetry(prev => ({
      ...prev,
      readState: 'SEARCHING',
      activeHits: [],
      currentPassResult: 'PENDING'
    }));
    setTrajectorySamples([]);
  }, []);

  const toggleBarcodeFace = useCallback((face: BarcodeFace) => {
    setCarton(prev => {
      const exists = prev.barcodeFaces.includes(face);
      const nextFaces = exists
        ? prev.barcodeFaces.filter(f => f !== face)
        : [...prev.barcodeFaces, face];
      return { ...prev, barcodeFaces: nextFaces };
    });
    setTrajectorySamples([]);
    setTelemetry(prev => ({
      ...prev,
      readState: 'SEARCHING',
      activeHits: [],
      currentPassResult: 'PENDING'
    }));
  }, []);

  const setAllBarcodeFaces = useCallback((faces: BarcodeFace[]) => {
    setCarton(prev => ({ ...prev, barcodeFaces: faces }));
    setTrajectorySamples([]);
    setTelemetry(prev => ({
      ...prev,
      readState: 'SEARCHING',
      activeHits: [],
      currentPassResult: 'PENDING'
    }));
  }, []);

  const addScanner = useCallback((scanner?: Partial<Scanner>) => {
    const newId = `scanner-${Date.now()}`;
    const colors = ['#00f0ff', '#10b981', '#f59e0b', '#ec4899', '#a855f7', '#3b82f6'];
    const newScanner: Scanner = {
      id: newId,
      name: scanner?.name || `Scanner Unit ${scanners.length + 1}`,
      isActive: scanner?.isActive ?? true,
      position: scanner?.position || { x: 0.0, y: 1.1, z: 0.0 },
      rotation: scanner?.rotation || { pitch: -90, roll: 0, yaw: 0 },
      optical: scanner?.optical || {
        horizontalFov: 55,
        verticalFov: 42,
        dofNear: 0.35,
        dofFar: 1.40,
        maxRange: 2.1,
        resolution: '3.2 MP Matrix',
        scannerModel: 'Standard Imager',
        focalLengthMm: 16
      },
      color: scanner?.color || colors[scanners.length % colors.length]
    };

    setScanners(prev => [...prev, newScanner]);
    setSelectedScannerId(newId);
  }, [scanners]);

  const updateScanner = useCallback((id: string, updates: Partial<Scanner>) => {
    setScanners(prev => prev.map(s => {
      if (s.id !== id) return s;
      // If scanner is locked, only allow unlocking (updates with isLocked defined)
      if (s.isLocked && updates.isLocked === undefined) return s;
      return {
        ...s,
        ...updates,
        position: updates.position ? { ...s.position, ...updates.position } : s.position,
        rotation: updates.rotation ? { ...s.rotation, ...updates.rotation } : s.rotation,
        optical: updates.optical ? { ...s.optical, ...updates.optical } : s.optical
      };
    }));
  }, []);

  const removeScanner = useCallback((id: string) => {
    setScanners(prev => {
      const target = prev.find(s => s.id === id);
      if (target?.isLocked) {
        alert('This scanner is locked against accidental deletion. Please unlock it first.');
        return prev;
      }
      return prev.filter(s => s.id !== id);
    });
    setSelectedScannerId(prev => (prev === id ? null : prev));
  }, []);

  const moveScanner = useCallback((id: string, direction: 'up' | 'down') => {
    setScanners(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, item);
      return copy;
    });
  }, []);

  const reorderScanners = useCallback((fromIndex: number, toIndex: number) => {
    setScanners(prev => {
      if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  }, []);

  const duplicateScanner = useCallback((id: string) => {
    const existing = scanners.find(s => s.id === id);
    if (!existing) return;
    const duplicated: Scanner = {
      ...existing,
      id: `scanner-${Date.now()}`,
      name: `${existing.name} (Copy)`,
      position: {
        x: existing.position.x + 0.25,
        y: existing.position.y,
        z: existing.position.z
      }
    };
    setScanners(prev => [...prev, duplicated]);
    setSelectedScannerId(duplicated.id);
  }, [scanners]);

  const loadPreset = useCallback((presetName: string) => {
    const preset = PRESET_TUNNELS.find(p => p.name === presetName);
    if (preset) {
      setScanners(preset.scanners);
      setSelectedScannerId(null);
      setTrajectorySamples([]);
      setTelemetry(prev => ({
        ...prev,
        readState: 'SEARCHING',
        activeHits: [],
        totalSamples: 0,
        coveredSamples: 0,
        coveragePercentage: 0,
        blindSpotsCount: 0,
        currentPassResult: 'PENDING'
      }));
    }
  }, []);

  const addLibraryScanner = useCallback((item: Omit<ScannerLibraryItem, 'id'>): string => {
    const newId = `custom-scanner-${Date.now()}`;
    const newItem: ScannerLibraryItem = {
      ...item,
      id: newId,
      isCustom: true,
      createdAt: new Date().toISOString()
    };
    setScannerLibrary(prev => {
      const updated = [newItem, ...prev];
      saveScannerLibrary(updated);
      return updated;
    });
    return newId;
  }, []);

  const updateLibraryScanner = useCallback((id: string, updates: Partial<ScannerLibraryItem>) => {
    setScannerLibrary(prev => {
      const updated = prev.map(item => (item.id === id ? { ...item, ...updates } : item));
      saveScannerLibrary(updated);
      return updated;
    });
  }, []);

  const removeLibraryScanner = useCallback((id: string) => {
    setScannerLibrary(prev => {
      const updated = prev.filter(item => item.id !== id);
      saveScannerLibrary(updated);
      return updated;
    });
  }, []);

  const applyLibraryScannerToScanner = useCallback((scannerId: string, libraryItemId: string) => {
    const libItem = scannerLibrary.find(l => l.id === libraryItemId);
    if (!libItem) return;

    setScanners(prev => prev.map(s => {
      if (s.id !== scannerId) return s;
      if (s.isLocked) {
        alert(`Scanner "${s.name}" is locked. Unlock it before changing its preset.`);
        return s;
      }
      return {
        ...s,
        optical: {
          ...s.optical,
          horizontalFov: libItem.optical.horizontalFov,
          verticalFov: libItem.optical.verticalFov,
          dofNear: libItem.optical.dofNear,
          dofFar: libItem.optical.dofFar,
          maxRange: libItem.optical.maxRange,
          resolution: libItem.optical.resolution,
          scannerModel: `${libItem.manufacturer} ${libItem.name}`,
          focalLengthMm: libItem.optical.focalLengthMm,
          twoPointCalibration: libItem.optical.twoPointCalibration
        }
      };
    }));
  }, [scannerLibrary]);

  const setMotionPlaying = useCallback((playing: boolean) => {
    setMotion(prev => ({ ...prev, isPlaying: playing }));
  }, []);

  const setMotionProgress = useCallback((progress: number) => {
    const clamped = Math.max(0, Math.min(1, progress));
    const startX = -conveyor.length / 2;
    const currentX = startX + clamped * conveyor.length;
    setMotion(prev => ({ ...prev, progress: clamped, currentX }));
  }, [conveyor.length]);

  const setSpeedMultiplier = useCallback((mult: number) => {
    setMotion(prev => ({ ...prev, speedMultiplier: mult }));
  }, []);

  const toggleLooping = useCallback(() => {
    setMotion(prev => ({ ...prev, isLooping: !prev.isLooping }));
  }, []);

  const resetMotion = useCallback(() => {
    const startX = -conveyor.length / 2;
    setMotion(prev => ({
      ...prev,
      progress: 0,
      currentX: startX,
      elapsedTime: 0
    }));
    setTrajectorySamples([]);
    setTelemetry(prev => ({
      ...prev,
      readState: 'SEARCHING',
      activeHits: [],
      currentPassResult: 'PENDING'
    }));
  }, [conveyor.length]);

  const stepMotion = useCallback((deltaX: number) => {
    const halfL = conveyor.length / 2;
    setMotion(prev => {
      let newX = prev.currentX + deltaX;
      let newProgress = (newX + halfL) / conveyor.length;
      if (newProgress > 1) {
        if (prev.isLooping) {
          newProgress = 0;
          newX = -halfL;
        } else {
          newProgress = 1;
          newX = halfL;
        }
      } else if (newProgress < 0) {
        newProgress = 0;
        newX = -halfL;
      }
      return { ...prev, currentX: newX, progress: newProgress };
    });
  }, [conveyor.length]);

  const resetTelemetry = useCallback(() => {
    setTrajectorySamples([]);
    setTelemetry({
      readState: 'SEARCHING',
      activeHits: [],
      totalSamples: 0,
      coveredSamples: 0,
      coveragePercentage: 0,
      blindSpotsCount: 0,
      currentPassResult: 'PENDING',
      firstReadX: null,
      lastReadX: null,
      history: []
    });
  }, []);

  const updateViewSettings = useCallback((updates: Partial<ViewSettings>) => {
    setViewSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const snapCameraTo = useCallback((view: 'TOP' | 'BOTTOM' | 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'ISOMETRIC' | 'TUNNEL') => {
    const centerY = conveyor.height;
    const dist = Math.max(3.5, conveyor.length * 0.9);

    let pos: [number, number, number] = [0, 0, 0];
    let target: [number, number, number] = [0, centerY, 0];

    switch (view) {
      case 'TOP':
        pos = [0, centerY + dist, 0.001];
        break;
      case 'BOTTOM':
        pos = [0, centerY - dist, 0.001];
        break;
      case 'FRONT':
        pos = [dist, centerY + 0.4, 0];
        break;
      case 'BACK':
        pos = [-dist, centerY + 0.4, 0];
        break;
      case 'LEFT':
        pos = [0, centerY + 0.5, -dist];
        break;
      case 'RIGHT':
        pos = [0, centerY + 0.5, dist];
        break;
      case 'TUNNEL':
        pos = [-conveyor.length * 0.6, centerY + 0.35, 0];
        target = [0, centerY + 0.25, 0];
        break;
      case 'ISOMETRIC':
      default:
        pos = [dist * 0.75, centerY + dist * 0.65, dist * 0.85];
        break;
    }

    setCameraSnap({
      position: pos,
      target,
      name: view,
      key: Date.now()
    });
  }, [conveyor.height, conveyor.length]);

  const snapCameraToAngles = useCallback((pitchDeg: number, yawDeg: number, distance = 4.5) => {
    const centerY = conveyor.height;
    const pitchRad = THREE.MathUtils.degToRad(pitchDeg);
    const yawRad = THREE.MathUtils.degToRad(yawDeg);

    const x = distance * Math.cos(pitchRad) * Math.sin(yawRad);
    const y = centerY + distance * Math.sin(pitchRad);
    const z = distance * Math.cos(pitchRad) * Math.cos(yawRad);

    setCameraSnap({
      position: [x, y, z],
      target: [0, centerY, 0],
      name: `Angles(${pitchDeg}°, ${yawDeg}°)`,
      key: Date.now()
    });
  }, [conveyor.height]);

  const exportConfiguration = useCallback(() => {
    const exportData = {
      version: '1.3',
      timestamp: new Date().toISOString(),
      units,
      partType,
      conveyor,
      carton,
      tyre,
      scanners
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scanner-coverage-setup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [units, partType, conveyor, carton, tyre, scanners]);

  const importConfiguration = useCallback((jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.units) setUnits(data.units);
      if (data.partType) setPartTypeState(data.partType);
      if (data.conveyor) setConveyor(data.conveyor);
      if (data.carton) setCarton(data.carton);
      if (data.tyre) setTyre(data.tyre);
      if (Array.isArray(data.scanners)) setScanners(data.scanners);
      resetMotion();
      return true;
    } catch (e) {
      console.error('Failed to parse config JSON', e);
      return false;
    }
  }, [resetMotion]);

  // Animation Loop & Intersection Math
  const lastTimeRef = useRef<number>(performance.now());
  const passSamplesRef = useRef<{ isCovered: boolean; x: number }[]>([]);
  const hasTriggeredPassResultRef = useRef<boolean>(false);

  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      const deltaSec = Math.min(0.1, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (motion.isPlaying) {
        const distanceStep = conveyor.beltSpeed * motion.speedMultiplier * deltaSec;
        const halfL = conveyor.length / 2;

        setMotion(prev => {
          let nextX = prev.currentX + distanceStep;
          let nextProgress = (nextX + halfL) / conveyor.length;
          let passFinished = false;

          if (nextProgress >= 1.0) {
            passFinished = true;
            if (prev.isLooping) {
              nextProgress = 0.0;
              nextX = -halfL;
            } else {
              nextProgress = 1.0;
              nextX = halfL;
            }
          }

          let targets: any[] = [];
          let partCenterY = conveyor.height;
          let partCenterZ = 0;

          if (partType === 'carton') {
            const dims = getActiveDimensions();
            partCenterZ = carton.lateralOffsetZ || 0;
            partCenterY = conveyor.height + dims.height / 2;
            const cartonCenter = new THREE.Vector3(nextX, partCenterY, partCenterZ);

            targets = getCartonBarcodeTargets(
              cartonCenter,
              dims,
              carton.barcodeFaces,
              carton.rotationYaw || 0,
              carton.barcodeOffsetU || 0,
              carton.barcodeOffsetV || 0
            );
          } else {
            // Tyre Part
            const tyreDims = getActiveTyreDimensions();
            partCenterZ = tyre.lateralOffsetZ || 0;
            partCenterY = conveyor.height + tyreDims.height / 2 + 0.001;
            const tyreCenter = new THREE.Vector3(nextX, partCenterY, partCenterZ);

            targets = getTyreBarcodeTargets(
              tyreCenter,
              tyreDims,
              tyre.barcodeLocation,
              tyre.radialDistanceRatio || 0.5,
              tyre.radialAngleDeg || 0,
              tyre.rotationYaw || 0
            );
          }

          const activeHits: ScanHitInfo[] = [];

          if (targets.length > 0) {
            for (const s of scanners) {
              if (!s.isActive) continue;
              const sMat = getScannerMatrix(s, conveyor.height);
              const sInv = sMat.clone().invert();

              for (const t of targets) {
                const hit = testBarcodeScannerIntersection(t, s, sMat, sInv);
                if (hit) {
                  activeHits.push(hit);
                }
              }
            }
          }

          const isCovered = activeHits.length > 0;
          passSamplesRef.current.push({ isCovered, x: nextX });

          setTrajectorySamples(tPrev => {
            const nextPoints = [...tPrev, {
              x: nextX,
              y: partCenterY,
              z: partCenterZ,
              isCovered,
              coveringScanners: activeHits.map(h => h.scannerName)
            }];
            if (nextPoints.length > 120) {
              nextPoints.shift();
            }
            return nextPoints;
          });

          setTelemetry(tPrev => {
            const totalSamples = passSamplesRef.current.length;
            const coveredCount = passSamplesRef.current.filter(p => p.isCovered).length;
            const coveragePercentage = totalSamples > 0 ? Math.round((coveredCount / totalSamples) * 100) : 0;
            const blindSpotsCount = totalSamples - coveredCount;

            let readState: 'SEARCHING' | 'READING' | 'PASS' | 'FAIL' = 'SEARCHING';
            if (isCovered) {
              readState = 'READING';
            }

            let firstRead = tPrev.firstReadX;
            let lastRead = tPrev.lastReadX;
            if (isCovered) {
              if (firstRead === null) firstRead = nextX;
              lastRead = nextX;
            }

            let currentPassResult = tPrev.currentPassResult;
            let history = tPrev.history;

            if (passFinished && !hasTriggeredPassResultRef.current) {
              hasTriggeredPassResultRef.current = true;
              const passed = coveredCount > 0 && targets.length > 0;
              currentPassResult = passed ? 'PASS' : 'FAIL';
              readState = passed ? 'PASS' : 'FAIL';

              const hitScannerNames = Array.from(new Set(activeHits.map(h => h.scannerName)));

              history = [
                {
                  id: `pass-${Date.now()}`,
                  timestamp: new Date().toLocaleTimeString(),
                  partType,
                  target: partType === 'carton' ? carton.activeTarget : tyre.activeTarget,
                  speed: conveyor.beltSpeed,
                  result: currentPassResult,
                  coveragePct: coveragePercentage,
                  hitScanners: hitScannerNames
                },
                ...tPrev.history.slice(0, 9)
              ];

              passSamplesRef.current = [];
            } else if (!passFinished) {
              hasTriggeredPassResultRef.current = false;
            }

            return {
              ...tPrev,
              readState,
              activeHits,
              totalSamples,
              coveredSamples: coveredCount,
              coveragePercentage,
              blindSpotsCount,
              currentPassResult,
              firstReadX: firstRead,
              lastReadX: lastRead,
              history
            };
          });

          return {
            ...prev,
            currentX: nextX,
            progress: nextProgress,
            elapsedTime: prev.elapsedTime + deltaSec,
            isPlaying: passFinished && !prev.isLooping ? false : prev.isPlaying
          };
        });
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [
    motion.isPlaying,
    motion.speedMultiplier,
    conveyor.beltSpeed,
    conveyor.height,
    conveyor.length,
    partType,
    getActiveDimensions,
    getActiveTyreDimensions,
    carton.barcodeFaces,
    carton.activeTarget,
    carton.lateralOffsetZ,
    carton.rotationYaw,
    carton.barcodeOffsetU,
    carton.barcodeOffsetV,
    tyre.barcodeLocation,
    tyre.radialDistanceRatio,
    tyre.radialAngleDeg,
    tyre.lateralOffsetZ,
    tyre.rotationYaw,
    scanners
  ]);

  return (
    <SimulatorContext.Provider
      value={{
        units,
        updateUnits,
        partType,
        setPartType,
        conveyor,
        updateConveyor,
        carton,
        updateCarton,
        toggleBarcodeFace,
        setAllBarcodeFaces,
        getActiveDimensions,
        tyre,
        updateTyre,
        getActiveTyreDimensions,
        scanners,
        selectedScannerId,
        setSelectedScannerId,
        addScanner,
        updateScanner,
        removeScanner,
        duplicateScanner,
        moveScanner,
        reorderScanners,
        loadPreset,
        scannerLibrary,
        addLibraryScanner,
        updateLibraryScanner,
        removeLibraryScanner,
        applyLibraryScannerToScanner,
        isScannerLibraryOpen,
        setIsScannerLibraryOpen,
        motion,
        setMotionPlaying,
        setMotionProgress,
        setSpeedMultiplier,
        toggleLooping,
        resetMotion,
        stepMotion,
        telemetry,
        trajectorySamples,
        resetTelemetry,
        viewSettings,
        updateViewSettings,
        cameraSnap,
        snapCameraTo,
        snapCameraToAngles,
        exportConfiguration,
        importConfiguration
      }}
    >
      {children}
    </SimulatorContext.Provider>
  );
};

export function useSimulator(): SimulatorContextType {
  const context = useContext(SimulatorContext);
  if (!context) {
    throw new Error('useSimulator must be used within a SimulatorProvider');
  }
  return context;
}
