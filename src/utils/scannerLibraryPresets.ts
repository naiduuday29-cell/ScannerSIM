import { ScannerLibraryItem } from '../types';

export const DEFAULT_SCANNER_LIBRARY: ScannerLibraryItem[] = [
  {
    id: 'keyence-sr-5000-wide',
    name: 'SR-5000 (Wide FOV)',
    manufacturer: 'Keyence',
    description: 'Ultra-wide logistics barcode reader with high depth-of-field for high-speed automated sorters.',
    optical: {
      horizontalFov: 58,
      verticalFov: 44,
      dofNear: 0.35,
      dofFar: 1.40,
      maxRange: 2.2,
      resolution: '3.2 MP High-Speed CMOS',
      scannerModel: 'Keyence SR-5000 (Wide FOV)',
      focalLengthMm: 24
    },
    isCustom: false
  },
  {
    id: 'keyence-sr-5000-tele',
    name: 'SR-5000 (Tele / High-Density)',
    manufacturer: 'Keyence',
    description: 'Narrow telephoto optics for reading small codes on tall parcel arrays or high conveyor elevations.',
    optical: {
      horizontalFov: 36,
      verticalFov: 28,
      dofNear: 0.50,
      dofFar: 2.00,
      maxRange: 2.8,
      resolution: '3.2 MP High-Speed CMOS',
      scannerModel: 'Keyence SR-5000 (Tele / High-Density)',
      focalLengthMm: 35
    },
    isCustom: false
  },
  {
    id: 'keyence-sr-2000-std',
    name: 'SR-2000 (Standard)',
    manufacturer: 'Keyence',
    description: 'Compact logistics 1D/2D code reader with dynamic focus for medium-distance package inspection.',
    optical: {
      horizontalFov: 48,
      verticalFov: 36,
      dofNear: 0.20,
      dofFar: 1.00,
      maxRange: 1.6,
      resolution: '2.0 MP CMOS',
      scannerModel: 'Keyence SR-2000 (Standard)',
      focalLengthMm: 16
    },
    isCustom: false
  },
  {
    id: 'keyence-sr-1000-compact',
    name: 'SR-1000 (Compact)',
    manufacturer: 'Keyence',
    description: 'Close-range autofocused code reader designed for lateral side reading and tote conveyor stations.',
    optical: {
      horizontalFov: 44,
      verticalFov: 33,
      dofNear: 0.15,
      dofFar: 0.75,
      maxRange: 1.2,
      resolution: '1.3 MP CMOS',
      scannerModel: 'Keyence SR-1000 (Compact)',
      focalLengthMm: 12
    },
    isCustom: false
  },
  {
    id: 'cognex-dm470-wide',
    name: 'DataMan 470 (Wide Field 16mm)',
    manufacturer: 'Cognex',
    description: 'Multi-core processing with high-speed multi-code reader for high-throughput distribution tunnels.',
    optical: {
      horizontalFov: 60,
      verticalFov: 45,
      dofNear: 0.40,
      dofFar: 1.50,
      maxRange: 2.4,
      resolution: '5.0 MP High-Speed',
      scannerModel: 'Cognex DataMan 470 (Wide Field 16mm)',
      focalLengthMm: 16
    },
    isCustom: false
  },
  {
    id: 'cognex-dm370-std',
    name: 'DataMan 370 (High Density 25mm)',
    manufacturer: 'Cognex',
    description: 'Vision-based industrial barcode reader with integrated high-power illumination for top & lateral reads.',
    optical: {
      horizontalFov: 42,
      verticalFov: 32,
      dofNear: 0.30,
      dofFar: 1.20,
      maxRange: 1.8,
      resolution: '3.2 MP High-Speed',
      scannerModel: 'Cognex DataMan 370 (High Density 25mm)',
      focalLengthMm: 25
    },
    isCustom: false
  },
  {
    id: 'sick-clv690-line',
    name: 'CLV690 (Long-Range Line Scanner)',
    manufacturer: 'SICK',
    description: 'High-speed oscillating mirror & line scanning system for automated pallet and case sortation lines.',
    optical: {
      horizontalFov: 65,
      verticalFov: 22,
      dofNear: 0.50,
      dofFar: 2.10,
      maxRange: 2.6,
      resolution: 'Laser High Frequency',
      scannerModel: 'SICK CLV690 (Long-Range Line Scanner)',
      focalLengthMm: 50
    },
    isCustom: false
  },
  {
    id: 'datalogic-matrix320',
    name: 'Matrix 320 (Liquid Lens 16mm)',
    manufacturer: 'Datalogic',
    description: 'Liquid lens image-based industrial scanner for e-commerce, warehousing, and retail cross-docking.',
    optical: {
      horizontalFov: 52,
      verticalFov: 38,
      dofNear: 0.30,
      dofFar: 1.30,
      maxRange: 2.0,
      resolution: '3.0 MP Global Shutter',
      scannerModel: 'Datalogic Matrix 320 (Liquid Lens 16mm)',
      focalLengthMm: 16
    },
    isCustom: false
  }
];

const STORAGE_KEY = 'scannersim_library_presets_v1';

export function loadSavedScannerLibrary(): ScannerLibraryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SCANNER_LIBRARY;
    const customItems: ScannerLibraryItem[] = JSON.parse(raw);
    
    // Combine built-in presets with any custom saved items
    const customMap = new Map(customItems.map(item => [item.id, item]));
    const combined = [...DEFAULT_SCANNER_LIBRARY];
    
    // Append or override with saved custom presets
    for (const item of customItems) {
      const existingIdx = combined.findIndex(c => c.id === item.id);
      if (existingIdx >= 0) {
        combined[existingIdx] = item;
      } else {
        combined.push(item);
      }
    }
    return combined;
  } catch (e) {
    console.error('Failed to load scanner library from localStorage', e);
    return DEFAULT_SCANNER_LIBRARY;
  }
}

export function saveScannerLibrary(items: ScannerLibraryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save scanner library to localStorage', e);
  }
}
