import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  MAX_OCEAN_DEPTH,
  OCEAN_ZONES,
  MARINE_ORGANISMS,
} from '../data/oceanData';
import { MarineOrganismData } from '../types/ocean';
import {
  calculateHydrostaticPressureAtm,
  calculateSunlightPercentage,
  calculateIllustrativeTemperatureC,
  clampDepth,
  getZoneForDepth,
  getVisibleOrganismsAtDepth,
} from '../utils/oceanMath';

interface DepthExplorerHUDProps {
  currentDepth: number;
  isAutoDescending: boolean;
  descentSpeed: number;
  isFullscreen: boolean;
  selectedOrganism: MarineOrganismData | null;
  onChangeDepth: (depth: number) => void;
  onToggleAutoDescent: () => void;
  onChangeDescentSpeed: (speed: number) => void;
  onReturnToSurface: () => void;
  onToggleFullscreen: () => void;
  onSelectOrganism: (org: MarineOrganismData) => void;
}

export const DepthExplorerHUD: React.FC<DepthExplorerHUDProps> = ({
  currentDepth,
  isAutoDescending,
  descentSpeed,
  isFullscreen,
  selectedOrganism,
  onChangeDepth,
  onToggleAutoDescent,
  onChangeDescentSpeed,
  onReturnToSurface,
  onToggleFullscreen,
  onSelectOrganism,
}) => {
  const [manualInput, setManualInput] = useState<string>(
    String(Math.round(currentDepth))
  );
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [showAssumptions, setShowAssumptions] = useState<boolean>(false);

  useEffect(() => {
    setManualInput(String(Math.round(currentDepth)));
  }, [currentDepth]);

  const activeZone = getZoneForDepth(currentDepth);
  const pressureAtm = calculateHydrostaticPressureAtm(currentDepth);
  const sunlightPct = calculateSunlightPercentage(currentDepth);
  const temperatureC = calculateIllustrativeTemperatureC(currentDepth);
  const visibleOrganisms = getVisibleOrganismsAtDepth(currentDepth, 60);
  const zoneOrganisms = MARINE_ORGANISMS.filter(
    (org) => org.zoneId === activeZone.id
  );

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(manualInput);
    if (!Number.isNaN(parsed)) {
      onChangeDepth(clampDepth(parsed));
    }
  };

  const speedOptions = [0.5, 1, 2, 5];

  return (
    <>
      {/* Top-Left Minimal Telemetry Instrument Ribbon (Unobstructed 3D Center) */}
      <div className="pointer-events-auto absolute top-16 left-4 z-20 max-w-sm bg-[#040b17]/92 border border-slate-800 rounded-lg px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-2 mb-2.5">
          <div>
            <span className="text-[11px] font-mono-tabular uppercase tracking-wider text-slate-400 block">
              CURRENT DEPTH
            </span>
            <div className="flex items-baseline">
              <span
                data-testid="live-depth-value"
                className="text-2xl sm:text-3xl font-mono-tabular font-bold text-white"
              >
                {Math.round(currentDepth).toLocaleString()}
              </span>
              <span className="text-xs uppercase font-mono-tabular text-cyan-400 ml-1.5">
                m
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono-tabular uppercase tracking-wider text-slate-400 block">
              OCEAN ZONE
            </span>
            <span
              data-testid="live-zone-name"
              className="text-sm font-semibold text-cyan-300 block"
            >
              {activeZone.name}
            </span>
            <span className="text-xs text-slate-400 block">
              {activeZone.subtitle} ({activeZone.minDepth}–{activeZone.maxDepth} m)
            </span>
          </div>
        </div>

        {/* Scientific Telemetry Readouts */}
        <div className="grid grid-cols-3 gap-3 text-left">
          <div>
            <span className="text-[10px] font-mono-tabular uppercase tracking-wider text-slate-400 block">
              PRESSURE (APPROX)
            </span>
            <div className="flex items-baseline">
              <span
                data-testid="live-pressure-value"
                className="text-sm font-mono-tabular font-semibold text-white"
              >
                ~{pressureAtm}
              </span>
              <span className="text-[11px] font-mono-tabular text-slate-400 ml-1">
                atm
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono-tabular uppercase tracking-wider text-slate-400 block">
              SUNLIGHT
            </span>
            <div className="flex items-baseline">
              <span
                data-testid="live-sunlight-value"
                className="text-sm font-mono-tabular font-semibold text-white"
              >
                {sunlightPct}
              </span>
              <span className="text-[11px] font-mono-tabular text-slate-400 ml-1">
                %
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono-tabular uppercase tracking-wider text-slate-400 block">
              TEMP (REF)
            </span>
            <div className="flex items-baseline">
              <span
                data-testid="live-temp-value"
                className="text-sm font-mono-tabular font-semibold text-white"
              >
                ~{temperatureC}
              </span>
              <span className="text-[11px] font-mono-tabular text-slate-400 ml-1">
                °C
              </span>
            </div>
          </div>
        </div>

        {/* Species visible at current depth / zone */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span>
              {visibleOrganisms.length > 0
                ? `Species at ${Math.round(currentDepth)} m (${visibleOrganisms.length})`
                : `Zone Species in ${activeZone.name}`}
            </span>
            <button
              type="button"
              onClick={() => setShowAssumptions((prev) => !prev)}
              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Assumptions</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(visibleOrganisms.length > 0 ? visibleOrganisms : zoneOrganisms).map(
              (org) => {
                const isAtExactDepth = visibleOrganisms.some(
                  (v) => v.id === org.id
                );
                const isSelected = selectedOrganism?.id === org.id;
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => onSelectOrganism(org)}
                    className={`px-2 py-1 text-xs rounded border transition-colors cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-cyan-950 border-cyan-400 text-white'
                        : isAtExactDepth
                        ? 'bg-[#081b33] border-cyan-500/50 text-cyan-200 hover:border-cyan-400'
                        : 'bg-[#061020] border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {org.commonName}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Hydrostatic Approximation & Illustrative Value Disclosure */}
        {showAssumptions && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-800 text-[11px] text-slate-300 leading-relaxed space-y-1">
            <p className="font-semibold text-white">
              Hydrostatic Pressure & Reference Assumptions:
            </p>
            <p>
              Pressure is calculated dynamically via{' '}
              <code className="text-cyan-300 font-mono-tabular">
                P(z) = 1.0 + (ρ · g · z) / 101,325
              </code>{' '}
              atm assuming mean seawater density{' '}
              <span className="font-mono-tabular">ρ = 1,027 kg/m³</span> and{' '}
              <span className="font-mono-tabular">g = 9.80665 m/s²</span> (~1 atm
              per 10.06 m).
            </p>
            <p>
              Temperatures represent an illustrative mid-latitude ocean column
              profile. Organism 3D depths represent curated educational habitats.
            </p>
          </div>
        )}
      </div>

      {/* Vertical Depth Slider Rail (Right side when species panel is closed) */}
      {!selectedOrganism && (
        <div className="pointer-events-auto hidden md:flex flex-col items-center justify-between absolute top-20 bottom-36 right-4 z-20 w-12 overflow-hidden bg-[#040b17]/92 border border-slate-800 rounded-xl py-3 px-1.5 shadow-lg">
          <span className="text-[10px] font-mono-tabular text-cyan-400 shrink-0">
            0m
          </span>
          <div className="relative flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden my-2">
            <input
              aria-label="Vertical Ocean Depth Slider"
              type="range"
              min={0}
              max={MAX_OCEAN_DEPTH}
              step={5}
              value={Math.round(currentDepth)}
              onChange={(e) => onChangeDepth(Number(e.target.value))}
              className="w-64 h-2 -rotate-90 reversed-vertical-slider bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 shrink-0"
              style={{ transform: 'rotate(90deg)' }}
            />
          </div>
          <span className="text-[10px] font-mono-tabular text-slate-400 shrink-0">
            10.9k
          </span>
        </div>
      )}

      {/* Unified Collapsible Bottom Control Dock (Per Three.js Ergonomic HUD Directive) */}
      <div className="pointer-events-none absolute bottom-4 inset-x-0 z-20 flex flex-col items-center px-4">
        <div className="pointer-events-auto flex items-center gap-2 mb-1.5">
          <button
            type="button"
            onClick={() => setIsDockCollapsed((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-200 bg-[#040b17]/95 border border-slate-800 rounded-t-md hover:text-cyan-300 transition-colors cursor-pointer"
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Show Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Hide Controls</span>
              </>
            )}
          </button>
        </div>

        {!isDockCollapsed && (
          <div className="pointer-events-auto w-full max-w-[940px] bg-[#040b17]/95 border border-slate-800 rounded-xl p-3.5 shadow-2xl">
            {/* Row 1: Primary Interactive Depth Scrubber Slider */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3">
              <label
                htmlFor="depth-range-slider"
                className="text-xs font-mono-tabular uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0"
              >
                Depth Control (0 – 10,935 m)
              </label>

              <div className="flex-1 flex items-center gap-3">
                <input
                  id="depth-range-slider"
                  aria-label="Ocean Depth Slider in Metres"
                  type="range"
                  min={0}
                  max={MAX_OCEAN_DEPTH}
                  step={5}
                  value={Math.round(currentDepth)}
                  onChange={(e) => onChangeDepth(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Manual Depth Input Form */}
              <form
                onSubmit={handleManualSubmit}
                className="flex items-center gap-1.5 shrink-0"
              >
                <label htmlFor="manual-depth-input" className="sr-only">
                  Manual Depth Input (metres)
                </label>
                <input
                  id="manual-depth-input"
                  aria-label="Manual Depth Input (metres)"
                  type="number"
                  min={0}
                  max={MAX_OCEAN_DEPTH}
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="w-24 px-2.5 py-1.5 text-xs font-mono-tabular text-white bg-[#081529] border border-slate-700 rounded-md focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 rounded-md hover:bg-cyan-300 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Go to m
                </button>
              </form>
            </div>

            {/* Row 2: Playback, Speed Multipliers, Quick Zone Jumps, Surface & Fullscreen */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-800/90">
              {/* Auto-descent & Speed Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleAutoDescent}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    isAutoDescending
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                      : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                  }`}
                >
                  {isAutoDescending ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Descent</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Auto-Descend</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onReturnToSurface}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#081529] border border-slate-700 rounded-md hover:border-cyan-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Return to Surface</span>
                </button>

                {/* Speed Multiplier Selector */}
                <div
                  role="group"
                  aria-label="Descent Speed Multiplier"
                  className="flex items-center bg-[#081529] border border-slate-800 rounded-md p-0.5"
                >
                  {speedOptions.map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => onChangeDescentSpeed(spd)}
                      className={`px-2 py-1 text-[11px] font-mono-tabular rounded transition-colors cursor-pointer whitespace-nowrap ${
                        descentSpeed === spd
                          ? 'bg-cyan-400 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Ocean Zone Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                {OCEAN_ZONES.map((zone) => {
                  const isActive = activeZone.id === zone.id;
                  const targetDepth =
                    zone.id === 'epipelagic'
                      ? 45
                      : zone.id === 'mesopelagic'
                      ? 420
                      : zone.id === 'bathypelagic'
                      ? 1650
                      : zone.id === 'abyssopelagic'
                      ? 4450
                      : 7500;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => onChangeDepth(targetDepth)}
                      className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-200 font-medium'
                          : 'bg-[#071120] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {zone.name.replace(' Zone', '')}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={onToggleFullscreen}
                  aria-label={
                    isFullscreen
                      ? 'Exit Full-Screen Exploration'
                      : 'Enter Full-Screen Exploration'
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-[#081529] border border-slate-700 rounded-md hover:border-cyan-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Exit Fullscreen</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Fullscreen</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
