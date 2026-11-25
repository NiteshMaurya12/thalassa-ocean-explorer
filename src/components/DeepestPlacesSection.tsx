import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { DEEPEST_TRENCHES, MAX_OCEAN_DEPTH } from '../data/oceanData';
import { TrenchData } from '../types/ocean';

interface DeepestPlacesSectionProps {
  onDiveToDepth: (depth: number) => void;
}

export const DeepestPlacesSection: React.FC<DeepestPlacesSectionProps> = ({
  onDiveToDepth,
}) => {
  const [selectedTrench, setSelectedTrench] = useState<TrenchData>(
    DEEPEST_TRENCHES[0]
  );

  return (
    <section
      id="deepest-places"
      className="gs-reveal-section py-20 px-6 bg-[#030711] border-t border-slate-800/80"
    >
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-mono-tabular uppercase tracking-widest text-cyan-400 mb-2">
            04. HADAL SUBDUCTION GEOMORPHOLOGY
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            The Deepest Places on Earth
          </h2>
          <p className="text-slate-300 text-base leading-relaxed">
            Where dense oceanic lithosphere subducts beneath adjacent tectonic
            plates, the seafloor buckles downward into V-shaped hadal trenches
            exceeding 8,000 to 10,935 metres in depth.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: 5 Major Trenches Selector & Proportional Bar Chart */}
          <div className="lg:col-span-6 space-y-3">
            {DEEPEST_TRENCHES.map((trench, idx) => {
              const isSelected = selectedTrench.id === trench.id;
              const widthPercent =
                (trench.maxDepthMetres / MAX_OCEAN_DEPTH) * 100;

              return (
                <div
                  key={trench.id}
                  onClick={() => setSelectedTrench(trench)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedTrench(trench);
                    }
                  }}
                  className={`p-5 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#071832] border-cyan-400'
                      : 'bg-[#050e1f] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-4 mb-2">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-xs font-mono-tabular text-cyan-400">
                        0{idx + 1}.
                      </span>
                      <h3 className="font-display text-lg font-bold text-white">
                        {trench.name}
                      </h3>
                    </div>
                    <span className="text-base font-mono-tabular font-bold text-cyan-300">
                      {trench.maxDepthMetres.toLocaleString()} m
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                    <span>{trench.deepestPointName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{trench.oceanBasin}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">
                      ~{trench.pressureAtm} atm
                    </span>
                  </div>

                  {/* Proportional Bathymetric Depth Bar */}
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${widthPercent}%` }}
                      className="h-full bg-cyan-400"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Trench Scientific Dossier & Bathymetric Profile */}
          <div className="lg:col-span-6 bg-[#050f21] border border-slate-800 rounded-xl p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-6">
                <div>
                  <span className="text-xs font-mono-tabular uppercase tracking-wider text-cyan-400 block">
                    SELECTED TRENCH PROFILE
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
                    {selectedTrench.name}
                  </h3>
                  <p className="text-sm text-slate-400">
                    Deepest Nadir: {selectedTrench.deepestPointName} (
                    {selectedTrench.coordinates})
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-mono-tabular font-bold text-cyan-300 block">
                    {selectedTrench.maxDepthMetres.toLocaleString()} m
                  </span>
                  <span className="text-xs font-mono-tabular text-slate-400">
                    ~{selectedTrench.pressureAtm} atm pressure
                  </span>
                </div>
              </div>

              {/* SVG Cross-Section V-Shaped Subduction Profile */}
              <div className="mb-6 bg-[#030914] border border-slate-800/90 rounded-lg p-4">
                <div className="flex items-center justify-between text-xs font-mono-tabular text-slate-400 mb-2">
                  <span>CROSS-SECTION BATHYMETRIC PROFILE</span>
                  <span>LENGTH: {selectedTrench.lengthKm.toLocaleString()} KM</span>
                </div>
                <svg
                  viewBox="0 0 400 120"
                  className="w-full h-28"
                  role="img"
                  aria-label={`Bathymetric cross-section of ${selectedTrench.name}`}
                >
                  <line
                    x1="0"
                    y1="15"
                    x2="400"
                    y2="15"
                    stroke="#38bdf8"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text x="8" y="12" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                    0 m Sea Level
                  </text>
                  <path
                    d="M 0 45 L 95 48 L 155 58 L 200 108 L 245 54 L 315 38 L 400 40 L 400 120 L 0 120 Z"
                    fill="#0c1f3f"
                    stroke="#22d3ee"
                    strokeWidth="1.5"
                  />
                  <circle cx="200" cy="108" r="4" fill="#22d3ee" />
                  <text
                    x="210"
                    y="111"
                    fill="#e2e8f0"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {selectedTrench.deepestPointName} ({selectedTrench.maxDepthMetres} m)
                  </text>
                </svg>
              </div>

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-6">
                {selectedTrench.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#07152b] border border-slate-800/80 rounded-lg p-4 mb-6 text-xs">
                <div>
                  <span className="font-mono-tabular uppercase text-slate-400 block mb-1">
                    TECTONIC SETTING
                  </span>
                  <span className="text-slate-200">
                    {selectedTrench.tectonicPlates}
                  </span>
                </div>
                <div>
                  <span className="font-mono-tabular uppercase text-slate-400 block mb-1">
                    HISTORIC DESCENTS
                  </span>
                  <span className="text-slate-200">
                    {selectedTrench.notableDescent}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDiveToDepth(selectedTrench.maxDepthMetres)}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-slate-950 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors cursor-pointer"
            >
              <span>
                Descend 3D Explorer to {selectedTrench.deepestPointName} (
                {selectedTrench.maxDepthMetres.toLocaleString()} m)
              </span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
