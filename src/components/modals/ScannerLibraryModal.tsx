import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Search,
  Layers,
  Sparkles,
  Crosshair,
  Sliders,
  Calculator,
  Eye,
  Info
} from 'lucide-react';
import { useSimulator } from '../../context/SimulatorContext';
import { ScannerLibraryItem, OpticalSpecs, OpticalTwoPointCalibration } from '../../types';
import { toDisplayLength, fromDisplayLength } from '../../utils/units';

interface ScannerLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetScannerId?: string | null;
}

export const ScannerLibraryModal: React.FC<ScannerLibraryModalProps> = ({
  isOpen,
  onClose,
  targetScannerId
}) => {
  const {
    units,
    scanners,
    scannerLibrary,
    addLibraryScanner,
    updateLibraryScanner,
    removeLibraryScanner,
    applyLibraryScannerToScanner
  } = useSimulator();

  const dimUnit = units.dimension;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  // Editor drawer state (null = closed, 'new' = creating, string = editing ID)
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formManufacturer, setFormManufacturer] = useState('Keyence');
  const [formDescription, setFormDescription] = useState('');
  const [formResolution, setFormResolution] = useState('3.2 MP High-Speed CMOS');
  const [formFocalLength, setFormFocalLength] = useState(24);
  const [formMaxRange, setFormMaxRange] = useState(2.2);

  // Optical mode: 'angle' | 'twopoint'
  const [formMode, setFormMode] = useState<'angle' | 'twopoint'>('angle');

  // Angle mode inputs
  const [formFovH, setFormFovH] = useState(55);
  const [formFovV, setFormFovV] = useState(42);
  const [formDofNearDisplay, setFormDofNearDisplay] = useState(350);
  const [formDofFarDisplay, setFormDofFarDisplay] = useState(1400);

  // Two-point calibration inputs (stored in active display length unit)
  const [tpD1, setTpD1] = useState(400);
  const [tpW1, setTpW1] = useState(380);
  const [tpH1, setTpH1] = useState(290);
  const [tpD2, setTpD2] = useState(1400);
  const [tpW2, setTpW2] = useState(1280);
  const [tpH2, setTpH2] = useState(960);

  // Quick apply scanner selection per card
  const [selectedScannerForCard, setSelectedScannerForCard] = useState<Record<string, string>>({});

  // Reset/populate editor form
  const openEditor = (item?: ScannerLibraryItem) => {
    if (!item) {
      // New item
      setEditingId('new');
      setFormName('');
      setFormManufacturer('Custom');
      setFormDescription('');
      setFormResolution('3.2 MP High-Speed CMOS');
      setFormFocalLength(24);
      setFormMaxRange(2.2);
      setFormMode('angle');
      setFormFovH(55);
      setFormFovV(42);
      setFormDofNearDisplay(toDisplayLength(0.35, dimUnit));
      setFormDofFarDisplay(toDisplayLength(1.40, dimUnit));
    } else {
      // Editing existing
      setEditingId(item.id);
      setFormName(item.name);
      setFormManufacturer(item.manufacturer || 'Custom');
      setFormDescription(item.description || '');
      setFormResolution(item.optical.resolution || '3.2 MP');
      setFormFocalLength(item.optical.focalLengthMm || 24);
      setFormMaxRange(item.optical.maxRange || 2.2);

      if (item.optical.twoPointCalibration?.enabled) {
        setFormMode('twopoint');
        const tp = item.optical.twoPointCalibration;
        setTpD1(toDisplayLength(tp.d1, dimUnit));
        setTpW1(toDisplayLength(tp.w1, dimUnit));
        setTpH1(toDisplayLength(tp.h1, dimUnit));
        setTpD2(toDisplayLength(tp.d2, dimUnit));
        setTpW2(toDisplayLength(tp.w2, dimUnit));
        setTpH2(toDisplayLength(tp.h2, dimUnit));
      } else {
        setFormMode('angle');
        setFormFovH(item.optical.horizontalFov);
        setFormFovV(item.optical.verticalFov);
        setFormDofNearDisplay(toDisplayLength(item.optical.dofNear, dimUnit));
        setFormDofFarDisplay(toDisplayLength(item.optical.dofFar, dimUnit));
      }
    }
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Please enter a Scanner Model Name.');
      return;
    }

    let finalH = Number(formFovH);
    let finalV = Number(formFovV);
    let finalNear = fromDisplayLength(Number(formDofNearDisplay), dimUnit);
    let finalFar = fromDisplayLength(Number(formDofFarDisplay), dimUnit);
    let calibration: OpticalTwoPointCalibration | undefined = undefined;

    if (formMode === 'twopoint') {
      const d1M = fromDisplayLength(Number(tpD1), dimUnit);
      const w1M = fromDisplayLength(Number(tpW1), dimUnit);
      const h1M = fromDisplayLength(Number(tpH1), dimUnit);
      const d2M = fromDisplayLength(Number(tpD2), dimUnit);
      const w2M = fromDisplayLength(Number(tpW2), dimUnit);
      const h2M = fromDisplayLength(Number(tpH2), dimUnit);

      const deltaD = Math.max(0.001, d2M - d1M);
      const deltaW = Math.max(0.001, w2M - w1M);
      const deltaH = Math.max(0.001, h2M - h1M);

      finalH = Math.round(2 * Math.atan(deltaW / (2 * deltaD)) * (180 / Math.PI));
      finalV = Math.round(2 * Math.atan(deltaH / (2 * deltaD)) * (180 / Math.PI));
      finalNear = d1M;
      finalFar = d2M;

      calibration = {
        enabled: true,
        d1: d1M,
        w1: w1M,
        h1: h1M,
        d2: d2M,
        w2: w2M,
        h2: h2M,
        syncDof: true
      };
    }

    const opticalPayload: OpticalSpecs = {
      horizontalFov: Math.max(10, Math.min(130, finalH)),
      verticalFov: Math.max(10, Math.min(120, finalV)),
      dofNear: Math.max(0.05, finalNear),
      dofFar: Math.max(finalNear + 0.1, finalFar),
      maxRange: Math.max(finalFar, Number(formMaxRange)),
      resolution: formResolution,
      scannerModel: `${formManufacturer} ${formName.trim()}`,
      focalLengthMm: Number(formFocalLength),
      twoPointCalibration: calibration
    };

    if (editingId === 'new') {
      addLibraryScanner({
        name: formName.trim(),
        manufacturer: formManufacturer.trim(),
        description: formDescription.trim() || 'Custom user calibrated FOV profile',
        optical: opticalPayload,
        isCustom: true
      });
    } else if (editingId) {
      updateLibraryScanner(editingId, {
        name: formName.trim(),
        manufacturer: formManufacturer.trim(),
        description: formDescription.trim(),
        optical: opticalPayload
      });
    }

    setEditingId(null);
  };

  const handleApply = (libraryItem: ScannerLibraryItem, specificScannerId?: string) => {
    const scannerId = specificScannerId || targetScannerId || selectedScannerForCard[libraryItem.id] || scanners[0]?.id;
    if (!scannerId) {
      alert('No scanner available to apply preset. Add a scanner in the sidebar first.');
      return;
    }

    applyLibraryScannerToScanner(scannerId, libraryItem.id);
    const scannerObj = scanners.find(s => s.id === scannerId);
    setAppliedNotice(`Applied "${libraryItem.name}" to ${scannerObj?.name || 'scanner'}!`);
    setTimeout(() => setAppliedNotice(null), 3000);
  };

  // Filtered library presets
  const filteredPresets = useMemo(() => {
    return scannerLibrary.filter(item => {
      const matchCat =
        selectedCategory === 'ALL' ||
        (selectedCategory === 'CUSTOM' && item.isCustom) ||
        (item.manufacturer && item.manufacturer.toUpperCase() === selectedCategory);

      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.manufacturer?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.optical.resolution?.toLowerCase().includes(q);

      return matchCat && matchSearch;
    });
  }, [scannerLibrary, selectedCategory, searchTerm]);

  // Categories list
  const categories = ['ALL', 'KEYENCE', 'COGNEX', 'SICK', 'DATALOGIC', 'CUSTOM'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden font-sans">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-industrial-900/90 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Scanner Library & Optical FOV Presets
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                  {scannerLibrary.length} Models
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pre-calibrated industrial optics for Keyence, Cognex, SICK, and custom barcode readers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openEditor()}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Scanner Preset</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Applied Notification Banner */}
        {appliedNotice && (
          <div className="px-6 py-2 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{appliedNotice}</span>
          </div>
        )}

        {/* Filter Bar & Search */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/20 border border-cyan-500/60 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search model, specs, brand..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Body Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Preset Creation / Editor Form */}
          {editingId !== null && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/40 shadow-xl mb-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white text-sm">
                    {editingId === 'new' ? 'Create New Scanner Optical Preset' : 'Edit Scanner Preset'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePreset} className="space-y-3.5">
                {/* Basic info row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Scanner Model Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SR-5000 Custom Wide"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      list="brandSuggestions"
                      value={formManufacturer}
                      onChange={(e) => setFormManufacturer(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                    <datalist id="brandSuggestions">
                      <option value="Keyence" />
                      <option value="Cognex" />
                      <option value="SICK" />
                      <option value="Datalogic" />
                      <option value="Zebra" />
                      <option value="Custom" />
                    </datalist>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Sensor Resolution
                    </label>
                    <input
                      type="text"
                      value={formResolution}
                      onChange={(e) => setFormResolution(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Application / Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Optimized for high-speed overhead sorting with deep box depth"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Calibration Mode Selector */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>Optical FOV Calibration Mode</span>
                    </span>
                    <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setFormMode('angle')}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                          formMode === 'angle'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Angular FOV (Degrees)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormMode('twopoint')}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                          formMode === 'twopoint'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        2-Point Distance Capture Area
                      </button>
                    </div>
                  </div>

                  {formMode === 'angle' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">
                          Horizontal FOV (°)
                        </label>
                        <input
                          type="number"
                          min="15"
                          max="125"
                          value={formFovH}
                          onChange={(e) => setFormFovH(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">
                          Vertical FOV (°)
                        </label>
                        <input
                          type="number"
                          min="15"
                          max="115"
                          value={formFovV}
                          onChange={(e) => setFormFovV(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">
                          DOF Near Limit ({dimUnit})
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formDofNearDisplay}
                          onChange={(e) => setFormDofNearDisplay(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">
                          DOF Far Limit ({dimUnit})
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formDofFarDisplay}
                          onChange={(e) => setFormDofFarDisplay(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      <p className="text-[10px] text-slate-400">
                        Enter manufacturer catalog field-of-view dimensions at two working distances. Angular FOV is auto-computed.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-2 rounded bg-slate-950 border border-slate-800">
                          <span className="text-[10px] font-bold text-cyan-400 block mb-1.5">
                            Near Calibration Point 1
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[9px] text-slate-400 block">Dist 1 ({dimUnit})</label>
                              <input
                                type="number"
                                value={tpD1}
                                onChange={(e) => setTpD1(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-200"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 block">Width 1 ({dimUnit})</label>
                              <input
                                type="number"
                                value={tpW1}
                                onChange={(e) => setTpW1(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-200"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 block">Height 1 ({dimUnit})</label>
                              <input
                                type="number"
                                value={tpH1}
                                onChange={(e) => setTpH1(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-200"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="p-2 rounded bg-slate-950 border border-slate-800">
                          <span className="text-[10px] font-bold text-emerald-400 block mb-1.5">
                            Far Calibration Point 2
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[9px] text-slate-400 block">Dist 2 ({dimUnit})</label>
                              <input
                                type="number"
                                value={tpD2}
                                onChange={(e) => setTpD2(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-200"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 block">Width 2 ({dimUnit})</label>
                              <input
                                type="number"
                                value={tpW2}
                                onChange={(e) => setTpW2(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-200"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 block">Height 2 ({dimUnit})</label>
                              <input
                                type="number"
                                value={tpH2}
                                onChange={(e) => setTpH2(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-200"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-sm"
                  >
                    Save Preset to Library
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Preset Cards Grid */}
          {filteredPresets.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-sm">No scanner presets found matching your filter.</p>
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchTerm('');
                }}
                className="mt-2 text-xs text-cyan-400 hover:underline"
              >
                Clear search and filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredPresets.map((preset) => {
                const nearDisp = toDisplayLength(preset.optical.dofNear, dimUnit);
                const farDisp = toDisplayLength(preset.optical.dofFar, dimUnit);
                const targetId = selectedScannerForCard[preset.id] || targetScannerId || scanners[0]?.id || '';

                return (
                  <div
                    key={preset.id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 shadow-md group"
                  >
                    <div>
                      {/* Top Row: Brand, Name, Badges */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-400 border border-cyan-800 font-bold uppercase">
                              {preset.manufacturer || 'Industrial'}
                            </span>
                            {preset.isCustom ? (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                                Custom Preset
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                                Factory Verified
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-white mt-1 group-hover:text-cyan-300 transition-colors">
                            {preset.name}
                          </h3>
                        </div>

                        {/* Edit / Delete actions for custom presets */}
                        {preset.isCustom && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditor(preset)}
                              title="Edit custom preset"
                              className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete custom preset "${preset.name}" from library?`)) {
                                  removeLibraryScanner(preset.id);
                                }
                              }}
                              title="Delete preset"
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-slate-400 mb-3 line-clamp-2">
                        {preset.description}
                      </p>

                      {/* Optical Specs Pills Grid */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Angular FOV:</span>
                          <span className="text-cyan-300 font-bold">
                            {preset.optical.horizontalFov}° H × {preset.optical.verticalFov}° V
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Depth of Field:</span>
                          <span className="text-emerald-300 font-bold">
                            {nearDisp} - {farDisp} {dimUnit}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Sensor:</span>
                          <span className="text-slate-300 truncate block">
                            {preset.optical.resolution}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Focal Length:</span>
                          <span className="text-slate-300">
                            {preset.optical.focalLengthMm} mm
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action: Apply to Scanner */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <select
                          value={targetId}
                          onChange={(e) =>
                            setSelectedScannerForCard((prev) => ({
                              ...prev,
                              [preset.id]: e.target.value
                            }))
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-400 truncate cursor-pointer"
                        >
                          {scanners.map((s) => (
                            <option key={s.id} value={s.id}>
                              Apply to: {s.name} {s.isLocked ? '(Locked)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => handleApply(preset, targetId)}
                        disabled={scanners.length === 0}
                        className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply FOV</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-industrial-900/90 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Selecting a preset configures the 3D optical frustum, depth-of-field limits, and angular coverage automatically.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
