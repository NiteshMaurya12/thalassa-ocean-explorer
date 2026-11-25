import React from 'react';
import { X, Compass, ShieldAlert } from 'lucide-react';
import { MarineOrganismData } from '../types/ocean';
import { OCEAN_ZONES } from '../data/oceanData';
import { calculateHydrostaticPressureAtm } from '../utils/oceanMath';

interface SpeciesInfoPanelProps {
  organism: MarineOrganismData | null;
  onClose: () => void;
  onExploreDepthRange: (organism: MarineOrganismData) => void;
}

export const SpeciesInfoPanel: React.FC<SpeciesInfoPanelProps> = ({
  organism,
  onClose,
  onExploreDepthRange,
}) => {
  if (!organism) return null;

  const zone = OCEAN_ZONES.find((z) => z.id === organism.zoneId);
  const minPressure = calculateHydrostaticPressureAtm(
    organism.illustrativeMinDepth
  );
  const maxPressure = calculateHydrostaticPressureAtm(
    organism.illustrativeMaxDepth
  );

  return (
    <aside
      aria-label={`Species Discovery Profile: ${organism.commonName}`}
      className="pointer-events-auto fixed md:absolute top-16 right-4 z-30 w-[calc(100vw-2rem)] sm:w-80 md:w-92 max-h-[calc(100vh-11.5rem)] overflow-y-auto bg-[#040c1a]/92 border border-cyan-500/40 rounded-xl p-4 shadow-2xl text-slate-200"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3 mb-3.5">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
            <span>{zone?.name ?? 'Pelagic Zone'}</span>
            <span aria-hidden="true">·</span>
            <span>
              {organism.bioluminescent ? 'Bioluminescent' : 'Non-Bioluminescent'}
            </span>
          </div>
          <h2 className="font-display text-xl font-bold text-white">
            {organism.commonName}
          </h2>
          <p className="text-sm italic text-slate-400">
            {organism.scientificName}
          </p>
        </div>

        <button
          type="button"
          aria-label="Close Species Information Panel"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-md border border-slate-800 hover:border-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Depth & Habitat Metrics (Distinguishing Illustrative 3D Range vs Verified Literature Record) */}
      <div className="grid grid-cols-2 gap-2.5 bg-[#071428] border border-slate-800/90 rounded-lg p-3 mb-3.5">
        <div>
          <span className="text-[10px] font-mono-tabular uppercase tracking-wider text-slate-400 block">
            3D EXPLORER RANGE (EST)
          </span>
          <span className="text-sm font-mono-tabular font-semibold text-cyan-300">
            {organism.illustrativeMinDepth.toLocaleString()} –{' '}
            {organism.illustrativeMaxDepth.toLocaleString()} m
          </span>
        </div>

        <div>
          <span className="text-[10px] font-mono-tabular uppercase tracking-wider text-slate-400 block">
            AMBIENT PRESSURE (CALC)
          </span>
          <span className="text-sm font-mono-tabular font-semibold text-white">
            ~{minPressure} – {maxPressure} atm
          </span>
        </div>

        <div className="col-span-2 pt-2 border-t border-slate-800/80">
          <span className="text-[10px] font-mono-tabular uppercase tracking-wider text-emerald-400/90 block">
            VERIFIED LITERATURE DEPTH RECORD
          </span>
          <span className="text-xs text-slate-200 block mt-0.5">
            {organism.verifiedDepthRecord}
          </span>
        </div>
      </div>

      {/* Habitat, Diet, Conservation Status & Biological Overview */}
      <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed mb-4">
        <div>
          <h3 className="text-[10px] font-mono-tabular uppercase tracking-wider text-slate-400 mb-0.5">
            Habitat &amp; Distribution (Verified)
          </h3>
          <p className="text-slate-200 text-xs">
            {organism.habitat} · Typical Size: {organism.sizeEstimate}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 bg-[#061122] border border-slate-800/80 rounded-lg p-2.5">
          <div>
            <h3 className="text-[10px] font-mono-tabular uppercase tracking-wider text-cyan-300 mb-0.5">
              Verified Diet &amp; Trophic Ecology
            </h3>
            <p className="text-xs text-slate-200">{organism.diet}</p>
          </div>
          <div className="pt-1.5 border-t border-slate-800/80">
            <h3 className="text-[10px] font-mono-tabular uppercase tracking-wider text-amber-300 mb-0.5 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              <span>Conservation Status (IUCN / Assessment)</span>
            </h3>
            <p className="text-xs text-slate-200 font-medium">
              {organism.conservationStatus}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-mono-tabular uppercase tracking-wider text-slate-400 mb-0.5">
            Biological Overview
          </h3>
          <p className="text-slate-300 text-xs leading-relaxed">
            {organism.shortDescription}
          </p>
        </div>

        <div>
          <h3 className="text-[10px] font-mono-tabular uppercase tracking-wider text-slate-400 mb-1">
            Deep-Ocean Adaptations
          </h3>
          <ul className="space-y-1 text-xs text-slate-300">
            {organism.adaptations.map((adaptation, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-cyan-400 font-mono-tabular">
                  0{idx + 1}.
                </span>
                <span>{adaptation}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Explore Depth Range CTA */}
      <button
        type="button"
        onClick={() => onExploreDepthRange(organism)}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors cursor-pointer"
      >
        <Compass className="w-4 h-4" />
        <span>
          Explore Depth Range ({organism.characteristicDepth.toLocaleString()} m)
        </span>
      </button>
    </aside>
  );
};
