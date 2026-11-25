import React from 'react';
import { X, Compass } from 'lucide-react';
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
      className="pointer-events-auto fixed md:absolute top-20 right-4 z-30 w-[calc(100vw-2rem)] sm:w-96 max-h-[calc(100vh-7rem)] overflow-y-auto bg-[#040c1a]/96 border border-cyan-500/40 rounded-xl p-5 shadow-2xl text-slate-200"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3.5 mb-4">
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

      {/* Depth & Habitat Metrics */}
      <div className="grid grid-cols-2 gap-3 bg-[#071428] border border-slate-800/90 rounded-lg p-3 mb-4">
        <div>
          <span className="text-[10px] font-mono-tabular uppercase tracking-wider text-slate-400 block">
            3D EXPLORER RANGE
          </span>
          <span className="text-sm font-mono-tabular font-semibold text-cyan-300">
            {organism.illustrativeMinDepth.toLocaleString()} –{' '}
            {organism.illustrativeMaxDepth.toLocaleString()} m
          </span>
        </div>

        <div>
          <span className="text-[10px] font-mono-tabular uppercase tracking-wider text-slate-400 block">
            AMBIENT PRESSURE
          </span>
          <span className="text-sm font-mono-tabular font-semibold text-white">
            ~{minPressure} – {maxPressure} atm
          </span>
        </div>

        <div className="col-span-2 pt-2 border-t border-slate-800/80">
          <span className="text-[10px] font-mono-tabular uppercase tracking-wider text-slate-400 block">
            VERIFIED SCIENTIFIC RECORD NOTE
          </span>
          <span className="text-xs text-slate-300 block mt-0.5">
            {organism.verifiedDepthRecord}
          </span>
        </div>
      </div>

      {/* Habitat & Description */}
      <div className="space-y-3 text-sm leading-relaxed mb-5">
        <div>
          <h3 className="text-xs font-mono-tabular uppercase tracking-wider text-slate-400 mb-1">
            Habitat & Distribution
          </h3>
          <p className="text-slate-200">
            {organism.habitat} · Typical Size: {organism.sizeEstimate}
          </p>
        </div>

        <div>
          <h3 className="text-xs font-mono-tabular uppercase tracking-wider text-slate-400 mb-1">
            Biological Overview
          </h3>
          <p className="text-slate-300">{organism.shortDescription}</p>
        </div>

        <div>
          <h3 className="text-xs font-mono-tabular uppercase tracking-wider text-slate-400 mb-1.5">
            Deep-Ocean Adaptations
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {organism.adaptations.map((adaptation, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-cyan-400 font-mono-tabular">0{idx + 1}.</span>
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
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors cursor-pointer"
      >
        <Compass className="w-4 h-4" />
        <span>
          Explore Depth Range ({organism.characteristicDepth.toLocaleString()} m)
        </span>
      </button>
    </aside>
  );
};
