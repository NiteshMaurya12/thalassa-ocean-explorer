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
  ChevronLeft,
  ChevronRight,
  Compass,
} from 'lucide-react';
import {
  MAX_OCEAN_DEPTH,
  OCEAN_ZONES,
  MARINE_ORGANISMS,
  DEPTH_LANDMARKS,
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
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [showAssumptions, setShowAssumptions] = useState<boolean>(false);

  useEffect(() => {
    setManualInput(String(Math.round(currentDepth)));
  }, [currentDepth]);

  const activeZone = getZoneForDepth(currentDepth);
  const pressureAtm = calculateHydrostaticPressureAtm(currentDepth);
  const sunlightPct = calculateSunlightPercentage(currentDepth);
  const temperatureC = calculateIllustrativeTemperatureC(currentDepth);
  const visibleOrganisms = getVisibleOrganismsAtDepth(currentDepth, 65);
  const zoneOrganisms = MARINE_ORGANISMS.filter(
    (org) => org.zoneId === activeZone.id
  );

  // Find nearest visual storytelling discovery milestone to currentDepth
  let nearestMilestoneIndex = 0;
  let minMilestoneDist = Infinity;
  DEPTH_LANDMARKS.forEach((lm, idx) => {
    const dist = Math.abs(lm.depth - currentDepth);
    if (dist < minMilestoneDist) {
      minMilestoneDist = dist;
      nearestMilestoneIndex = idx;
    }
  });
  const nearestMilestone = DEPTH_LANDMARKS[nearestMilestoneIndex];

  const handleStepMilestone = (direction: -1 | 1) => {
    const nextIdx = Math.max(
      0,
      Math.min(DEPTH_LANDMARKS.length - 1, nearestMilestoneIndex + direction)
    );
    onChangeDepth(DEPTH_LANDMARKS[nextIdx].depth);
  };

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
      {/* Compact ~230px Floating Glassmorphism Current Depth Widget (Upper-Left) */}
      <aside
        aria-label="Ocean Depth Telemetry Panel"
        data-testid="compact-depth-widget"
        className="pointer-events-auto absolute top-14 left-3 sm:top-16 sm:left-4 z-20 w-[215px] sm:w-[230px] bg-[#030b18]/62 border border-cyan-500/20 rounded-xl px-3 py-2.5 shadow-lg transition-all duration-300"
      >
        {/* Primary Compact View: Only Current Depth, Zone Name & Small Pressure Indicator */}
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <span className="text-[9px] font-mono-tabular uppercase tracking-widest text-slate-400 block">
              CURRENT DEPTH
            </span>
            <div className="flex items-baseline mt-0.5">
              <span
                data-testid="live-depth-value"
                className="text-xl sm:text-2xl font-mono-tabular font-bold text-white leading-none tracking-tight"
              >
                {Math.round(currentDepth).toLocaleString()}
              </span>
              <span className="text-[11px] uppercase font-mono-tabular text-cyan-400 ml-1 font-semibold">
                m
              </span>
            </div>
          </div>

          {/* Small Hydrostatic Pressure Indicator */}
          <div className="text-right">
            <span className="text-[9px] font-mono-tabular uppercase tracking-wider text-slate-400 block">
              PRESSURE
            </span>
            <div className="flex items-baseline justify-end mt-0.5">
              <span
                data-testid="live-pressure-value"
                className="text-xs font-mono-tabular font-semibold text-cyan-300"
              >
                ~{pressureAtm}
              </span>
              <span className="text-[10px] font-mono-tabular text-slate-400 ml-0.5">
                atm
              </span>
            </div>
          </div>
        </div>

        {/* Zone Name & Expandable Details Toggle Row */}
        <div className="mt-1.5 pt-1.5 border-t border-slate-800/70 flex items-center justify-between gap-1.5">
          <div className="min-w-0">
            <span
              data-testid="live-zone-name"
              className="text-xs font-semibold text-slate-100 truncate block"
            >
              {activeZone.name}
            </span>
          </div>

          <button
            type="button"
            aria-expanded={isDetailsExpanded}
            aria-label={
              isDetailsExpanded
                ? 'Collapse scientific telemetry details'
                : 'Expand scientific telemetry details'
            }
            onClick={() => setIsDetailsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono-tabular text-cyan-300 hover:text-white bg-[#06152b]/70 border border-cyan-500/25 rounded transition-colors cursor-pointer shrink-0"
          >
            <span>{isDetailsExpanded ? 'Less' : 'Details'}</span>
            {isDetailsExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>

        {/* Expandable Details Section: Sunlight, Temperature, Milestones, Species & Provenance */}
        {isDetailsExpanded && (
          <div
            data-testid="expanded-telemetry-details"
            className="mt-2 pt-2 border-t border-slate-800/80 space-y-2 text-left"
          >
            {/* Sunlight & Temperature Secondary Readouts */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-[#061326]/70 border border-slate-800/80 rounded-md px-2 py-1">
                <span className="text-[8px] font-mono-tabular uppercase tracking-wider text-slate-400 block">
                  SUNLIGHT (OPTICAL)
                </span>
                <div className="flex items-baseline">
                  <span
                    data-testid="live-sunlight-value"
                    className="text-xs font-mono-tabular font-bold text-white"
                  >
                    {sunlightPct}
                  </span>
                  <span className="text-[9px] font-mono-tabular text-slate-400 ml-0.5">
                    %
                  </span>
                </div>
              </div>

              <div className="bg-[#061326]/70 border border-slate-800/80 rounded-md px-2 py-1">
                <span className="text-[8px] font-mono-tabular uppercase tracking-wider text-slate-400 block">
                  TEMP (EST · REF)
                </span>
                <div className="flex items-baseline">
                  <span
                    data-testid="live-temp-value"
                    className="text-xs font-mono-tabular font-bold text-white"
                  >
                    ~{temperatureC}
                  </span>
                  <span className="text-[9px] font-mono-tabular text-slate-400 ml-0.5">
                    °C
                  </span>
                </div>
              </div>
            </div>

            {/* Nearest Discovery Milestone Stepper */}
            <div className="pt-1 border-t border-slate-800/70">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[9px] font-mono-tabular uppercase tracking-wider text-amber-300 flex items-center gap-1 truncate">
                  <Compass className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                  <span>
                    {nearestMilestone.depth.toLocaleString()} m Milestone
                  </span>
                </span>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    aria-label="Previous Depth Milestone"
                    disabled={nearestMilestoneIndex === 0}
                    onClick={() => handleStepMilestone(-1)}
                    className="p-0.5 rounded bg-[#071529] border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next Depth Milestone"
                    disabled={
                      nearestMilestoneIndex === DEPTH_LANDMARKS.length - 1
                    }
                    onClick={() => handleStepMilestone(1)}
                    className="p-0.5 rounded bg-[#071529] border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onChangeDepth(nearestMilestone.depth)}
                className="w-full text-left bg-[#061224]/85 border border-slate-800/90 hover:border-amber-400/50 rounded-md px-2 py-1 transition-colors cursor-pointer"
              >
                <div className="text-[11px] font-semibold text-white leading-tight truncate">
                  {nearestMilestone.title}
                </div>
              </button>
            </div>

            {/* Active Species Quick Select */}
            <div className="pt-1 border-t border-slate-800/70">
              <div className="text-[10px] text-slate-400 mb-1">
                Species ({visibleOrganisms.length || zoneOrganisms.length})
              </div>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {(visibleOrganisms.length > 0
                  ? visibleOrganisms
                  : zoneOrganisms
                ).map((org) => {
                  const isSelected = selectedOrganism?.id === org.id;
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => onSelectOrganism(org)}
                      className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-cyan-950 border-cyan-400 text-white font-medium'
                          : 'bg-[#061224] border-slate-800 text-slate-300 hover:border-cyan-400/50 hover:text-white'
                      }`}
                    >
                      {org.commonName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scientific Provenance & Assumptions Disclosure */}
            <div className="pt-1 border-t border-slate-800/70 flex items-center justify-between text-[9px] text-slate-400">
              <span>P(z): calc · Temp: est</span>
              <button
                type="button"
                onClick={() => setShowAssumptions((prev) => !prev)}
                className="inline-flex items-center gap-0.5 text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                <Info className="w-2.5 h-2.5" />
                <span>Formula</span>
              </button>
            </div>

            {showAssumptions && (
              <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-300 leading-snug">
                <code className="text-cyan-300 font-mono-tabular block mb-0.5">
                  P(z) = 1 + (ρ·g·z)/101325 atm
                </code>
                <span>
                  ρ=1,027 kg/m³. Temp &amp; 3D organism depths represent
                  illustrative mid-latitude reference profiles.
                </span>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Vertical Depth Slider Rail (Right side when species panel is closed) */}
      {!selectedOrganism && (
        <div className="pointer-events-auto hidden md:flex flex-col items-center justify-between absolute top-20 bottom-28 right-4 z-20 w-10 overflow-hidden bg-[#030b18]/65 border border-cyan-500/20 rounded-xl py-3 px-1 shadow-lg">
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
              className="w-60 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 shrink-0"
              style={{ transform: 'rotate(90deg)' }}
            />
          </div>
          <span className="text-[10px] font-mono-tabular text-slate-400 shrink-0">
            10.9k
          </span>
        </div>
      )}

      {/* Compact Floating Bottom Depth Control Panel with Collapse/Expand Option */}
      <div className="pointer-events-none absolute bottom-3 inset-x-0 z-20 flex flex-col items-center px-4">
        <div className="pointer-events-auto flex items-center gap-2 mb-1">
          <button
            type="button"
            onClick={() => setIsDockCollapsed((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium text-slate-200 bg-[#030b18]/78 border border-cyan-500/20 rounded-full hover:border-cyan-400/60 hover:text-cyan-300 transition-colors cursor-pointer shadow"
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Show Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hide Controls</span>
              </>
            )}
          </button>
        </div>

        {!isDockCollapsed && (
          <div className="pointer-events-auto w-full max-w-3xl bg-[#030b18]/78 border border-cyan-500/20 rounded-xl px-3.5 py-2.5 shadow-2xl">
            {/* Row 1: Compact Depth Slider + Go to Depth Manual Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mb-2">
              <label
                htmlFor="depth-range-slider"
                className="text-[11px] font-mono-tabular uppercase tracking-wider text-slate-300 whitespace-nowrap shrink-0"
              >
                Depth Control (0 – 10,935 m)
              </label>

              <div className="flex-1 flex items-center">
                <input
                  id="depth-range-slider"
                  aria-label="Ocean Depth Slider in Metres"
                  type="range"
                  min={0}
                  max={MAX_OCEAN_DEPTH}
                  step={5}
                  value={Math.round(currentDepth)}
                  onChange={(e) => onChangeDepth(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
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
                  className="w-20 px-2 py-1 text-xs font-mono-tabular text-white bg-[#071529] border border-slate-700 rounded-md focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 text-xs font-semibold text-slate-950 bg-cyan-400 rounded-md hover:bg-cyan-300 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Go to m
                </button>
              </form>
            </div>

            {/* Row 2: Compact Playback, Speed Multipliers, Zone Quick-Jumps & Fullscreen */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
              {/* Auto-descent & Speed Controls */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={onToggleAutoDescent}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-200 bg-[#071529] border border-slate-700 rounded-md hover:border-cyan-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Return to Surface</span>
                </button>

                {/* Speed Multiplier Selector */}
                <div
                  role="group"
                  aria-label="Descent Speed Multiplier"
                  className="flex items-center bg-[#071529] border border-slate-800 rounded-md p-0.5"
                >
                  {speedOptions.map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => onChangeDescentSpeed(spd)}
                      className={`px-1.5 py-0.5 text-[11px] font-mono-tabular rounded transition-colors cursor-pointer whitespace-nowrap ${
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

              {/* Quick Ocean Zone Presets & Fullscreen */}
              <div className="flex flex-wrap items-center gap-1">
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
                      className={`px-2 py-1 text-[11px] rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-200 font-medium'
                          : 'bg-[#06101e] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
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
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-300 bg-[#071529] border border-slate-700 rounded-md hover:border-cyan-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Exit Fullscreen</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3 h-3" />
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
