import { Scanner, PresetTunnel } from '../types';

export const INITIAL_SCANNERS: Scanner[] = [
  {
    id: 'scanner-top-1',
    name: 'Top Overhead Scanner A',
    isActive: true,
    position: { x: 0.0, y: 1.25, z: 0.0 },
    rotation: { pitch: -90, roll: 0, yaw: 0 },
    optical: {
      horizontalFov: 58,
      verticalFov: 44,
      dofNear: 0.45,
      dofFar: 1.45,
      maxRange: 2.2,
      resolution: '5.0 MP High-Speed',
      scannerModel: 'Cognex DataMan 470',
      focalLengthMm: 16
    },
    color: '#00f0ff'
  },
  {
    id: 'scanner-side-left',
    name: 'Left Lateral 45° Scanner',
    isActive: true,
    position: { x: 0.2, y: 0.65, z: -0.85 },
    rotation: { pitch: -30, roll: 0, yaw: -90 },
    optical: {
      horizontalFov: 52,
      verticalFov: 38,
      dofNear: 0.35,
      dofFar: 1.30,
      maxRange: 1.9,
      resolution: '3.2 MP Matrix',
      scannerModel: 'Keyence SR-5000',
      focalLengthMm: 24
    },
    color: '#10b981'
  },
  {
    id: 'scanner-side-right',
    name: 'Right Lateral 45° Scanner',
    isActive: true,
    position: { x: -0.2, y: 0.65, z: 0.85 },
    rotation: { pitch: -30, roll: 0, yaw: 90 },
    optical: {
      horizontalFov: 52,
      verticalFov: 38,
      dofNear: 0.35,
      dofFar: 1.30,
      maxRange: 1.9,
      resolution: '3.2 MP Matrix',
      scannerModel: 'Keyence SR-5000',
      focalLengthMm: 24
    },
    color: '#f59e0b'
  }
];

export const PRESET_TUNNELS: PresetTunnel[] = [
  {
    name: '3-Sided Standard Arch (Top + Dual-Angled Sides)',
    category: 'Distribution Center',
    description: 'Comprehensive top and bilateral side coverage for standard conveyor sorts.',
    scanners: [
      {
        id: 's-top',
        name: 'Top Overhead Scanner',
        isActive: true,
        position: { x: 0.0, y: 1.25, z: 0.0 },
        rotation: { pitch: -90, roll: 0, yaw: 0 },
        optical: {
          horizontalFov: 60,
          verticalFov: 45,
          dofNear: 0.40,
          dofFar: 1.50,
          maxRange: 2.2,
          resolution: '5.0 MP High-Speed',
          scannerModel: 'Cognex DataMan 470',
          focalLengthMm: 16
        },
        color: '#00f0ff'
      },
      {
        id: 's-left',
        name: 'Left Angled Lateral',
        isActive: true,
        position: { x: 0.15, y: 0.65, z: -0.85 },
        rotation: { pitch: -30, roll: 0, yaw: -90 },
        optical: {
          horizontalFov: 54,
          verticalFov: 40,
          dofNear: 0.35,
          dofFar: 1.35,
          maxRange: 1.9,
          resolution: '3.2 MP Matrix',
          scannerModel: 'Keyence SR-5000',
          focalLengthMm: 24
        },
        color: '#10b981'
      },
      {
        id: 's-right',
        name: 'Right Angled Lateral',
        isActive: true,
        position: { x: -0.15, y: 0.65, z: 0.85 },
        rotation: { pitch: -30, roll: 0, yaw: 90 },
        optical: {
          horizontalFov: 54,
          verticalFov: 40,
          dofNear: 0.35,
          dofFar: 1.35,
          maxRange: 1.9,
          resolution: '3.2 MP Matrix',
          scannerModel: 'Keyence SR-5000',
          focalLengthMm: 24
        },
        color: '#f59e0b'
      }
    ]
  },
  {
    name: '5-Sided High-Throughput Scan Tunnel',
    category: 'Enterprise Fulfillment',
    description: 'Reads Top, Left, Right, Leading Front, and Trailing Back faces simultaneously.',
    scanners: [
      {
        id: 's-5s-top',
        name: 'Top Gantry Primary',
        isActive: true,
        position: { x: 0.0, y: 1.30, z: 0.0 },
        rotation: { pitch: -90, roll: 0, yaw: 0 },
        optical: {
          horizontalFov: 62,
          verticalFov: 48,
          dofNear: 0.45,
          dofFar: 1.55,
          maxRange: 2.3,
          resolution: '5.0 MP High-Speed',
          scannerModel: 'Cognex DataMan 470',
          focalLengthMm: 16
        },
        color: '#00f0ff'
      },
      {
        id: 's-5s-left',
        name: 'Left Wall Scanner',
        isActive: true,
        position: { x: 0.0, y: 0.55, z: -0.90 },
        rotation: { pitch: -20, roll: 0, yaw: -90 },
        optical: {
          horizontalFov: 55,
          verticalFov: 42,
          dofNear: 0.35,
          dofFar: 1.40,
          maxRange: 2.0,
          resolution: '3.2 MP Matrix',
          scannerModel: 'Keyence SR-5000',
          focalLengthMm: 24
        },
        color: '#10b981'
      },
      {
        id: 's-5s-right',
        name: 'Right Wall Scanner',
        isActive: true,
        position: { x: 0.0, y: 0.55, z: 0.90 },
        rotation: { pitch: -20, roll: 0, yaw: 90 },
        optical: {
          horizontalFov: 55,
          verticalFov: 42,
          dofNear: 0.35,
          dofFar: 1.40,
          maxRange: 2.0,
          resolution: '3.2 MP Matrix',
          scannerModel: 'Keyence SR-5000',
          focalLengthMm: 24
        },
        color: '#f59e0b'
      },
      {
        id: 's-5s-front',
        name: 'Leading Face Angled',
        isActive: true,
        position: { x: 0.85, y: 1.10, z: 0.0 },
        rotation: { pitch: -45, roll: 0, yaw: 180 },
        optical: {
          horizontalFov: 52,
          verticalFov: 38,
          dofNear: 0.40,
          dofFar: 1.45,
          maxRange: 2.1,
          resolution: '3.2 MP LineScan',
          scannerModel: 'SICK Lector65x',
          focalLengthMm: 20
        },
        color: '#a855f7'
      },
      {
        id: 's-5s-back',
        name: 'Trailing Face Angled',
        isActive: true,
        position: { x: -0.85, y: 1.10, z: 0.0 },
        rotation: { pitch: -45, roll: 0, yaw: 0 },
        optical: {
          horizontalFov: 52,
          verticalFov: 38,
          dofNear: 0.40,
          dofFar: 1.45,
          maxRange: 2.1,
          resolution: '3.2 MP LineScan',
          scannerModel: 'SICK Lector65x',
          focalLengthMm: 20
        },
        color: '#ec4899'
      }
    ]
  },
  {
    name: 'Single Overhead Wide-FOV Sorter',
    category: 'Budget / Low Complexity',
    description: 'Single ultra-wide angle scanner covering top face and moderate parcel height variance.',
    scanners: [
      {
        id: 's-single-overhead',
        name: 'Overhead Wide-Field Scanner',
        isActive: true,
        position: { x: 0.0, y: 1.40, z: 0.0 },
        rotation: { pitch: -90, roll: 0, yaw: 0 },
        optical: {
          horizontalFov: 72,
          verticalFov: 55,
          dofNear: 0.45,
          dofFar: 1.70,
          maxRange: 2.5,
          resolution: '12.0 MP Wide',
          scannerModel: 'Datalogic Matrix 320',
          focalLengthMm: 12
        },
        color: '#00f0ff'
      }
    ]
  },
  {
    name: 'Bottom Gap + Dual Cross Scanner',
    category: 'Postal & Parcel Sortation',
    description: 'Inspects parcel underside through conveyor transfer gap alongside angled top reads.',
    scanners: [
      {
        id: 's-bottom-gap',
        name: 'Conveyor Under-Gap Scanner',
        isActive: true,
        position: { x: 0.0, y: -0.45, z: 0.0 },
        rotation: { pitch: 90, roll: 0, yaw: 0 },
        optical: {
          horizontalFov: 65,
          verticalFov: 48,
          dofNear: 0.25,
          dofFar: 0.95,
          maxRange: 1.5,
          resolution: '5.0 MP High-Speed',
          scannerModel: 'Cognex DataMan 470',
          focalLengthMm: 16
        },
        color: '#3b82f6'
      },
      {
        id: 's-top-cross',
        name: 'Top High Gantry',
        isActive: true,
        position: { x: 0.3, y: 1.30, z: 0.0 },
        rotation: { pitch: -80, roll: 0, yaw: 180 },
        optical: {
          horizontalFov: 58,
          verticalFov: 44,
          dofNear: 0.40,
          dofFar: 1.50,
          maxRange: 2.2,
          resolution: '5.0 MP High-Speed',
          scannerModel: 'Cognex DataMan 470',
          focalLengthMm: 16
        },
        color: '#10b981'
      }
    ]
  }
];
