import React from 'react';
import { Compass, ShieldCheck } from 'lucide-react';
import { CONSERVATION_TOPICS, MARINE_ORGANISMS } from '../data/oceanData';

interface ResearchConservationSectionProps {
  onDiveToDepth: (depth: number) => void;
}

export const ResearchConservationSection: React.FC<
  ResearchConservationSectionProps
> = ({ onDiveToDepth }) => {
  // Summarize verified IUCN statuses across our 18 species
  const threatenedSpecies = MARINE_ORGANISMS.filter(
    (org) =>
      org.conservationStatus.includes('Endangered') ||
      org.conservationStatus.includes('Vulnerable')
  );

  return (
    <section
      id="research-conservation"
      aria-label="Deep-Ocean Research and Conservation"
      className="gs-reveal-section py-20 px-6 bg-[#030711] border-t border-slate-800/80"
    >
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-mono-tabular uppercase tracking-widest text-cyan-400 mb-2">
            08. STEWARDSHIP OF THE DEEP BIOSPHERE
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            Research and Conservation
          </h2>
          <p className="text-slate-300 text-base leading-relaxed">
            The deep ocean regulates Earth’s climate, absorbs over 90% of excess
            anthropogenic heat, and Sequesters gigatonnes of carbon via the
            mesopelagic biological pump. Protecting fragile abyssal and hadal
            ecosystems requires pairing frontier sonar and submersible science
            with international governance.
          </p>
        </div>

        {/* 4 Research & Conservation Pillar Dossiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {CONSERVATION_TOPICS.map((topic) => (
            <article
              key={topic.id}
              className="bg-[#050f20] border border-slate-800 rounded-xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 text-xs font-mono-tabular text-cyan-400 mb-3">
                  <span className="uppercase">{topic.category}</span>
                  <span>
                    TARGET HORIZON: {topic.targetDepthMetres.toLocaleString()} m
                  </span>
                </div>

                <div className="flex items-baseline gap-2.5 mb-2">
                  <span className="text-3xl font-mono-tabular font-bold text-white">
                    {topic.keyMetric}
                  </span>
                  <span className="text-xs text-cyan-300 font-medium">
                    {topic.metricLabel}
                  </span>
                </div>

                <h3 className="font-display text-xl font-bold text-white mb-2">
                  {topic.title}
                </h3>

                <p className="text-sm text-slate-200 leading-relaxed mb-3">
                  {topic.summary}
                </p>

                <p className="text-xs text-slate-400 leading-relaxed mb-5">
                  {topic.scientificContext}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-slate-300">
                  {topic.actionableInsight}
                </span>
                <button
                  type="button"
                  onClick={() => onDiveToDepth(topic.targetDepthMetres)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 rounded-md hover:bg-cyan-300 transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>
                    Inspect {topic.targetDepthMetres.toLocaleString()} m in 3D
                  </span>
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Verified IUCN Red List Priority Megafauna & Deep-Sea Species Summary */}
        <div className="bg-[#061326] border border-slate-800 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono-tabular uppercase tracking-wider text-amber-300 mb-1">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>VERIFIED IUCN RED LIST CONSERVATION WATCHLIST</span>
              </div>
              <h3 className="font-display text-xl font-bold text-white">
                Vulnerable &amp; Endangered Species in the 3D Water Column
              </h3>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Slow growth rates, late sexual maturity (up to 150 years in
              Greenland Sleeper Sharks), and acoustic or bycatch pressures make
              marine megafauna and deep-sea species uniquely sensitive.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {threatenedSpecies.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => onDiveToDepth(org.characteristicDepth)}
                className="text-left p-3.5 rounded-lg bg-[#040c1a] border border-slate-800 hover:border-cyan-400 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono-tabular text-amber-300 block mb-1">
                    {org.conservationStatus.split('(')[0].trim()}
                  </span>
                  <div className="text-sm font-bold text-white">
                    {org.commonName}
                  </div>
                  <div className="text-xs italic text-slate-400 mb-2">
                    {org.scientificName}
                  </div>
                </div>
                <div className="text-[11px] font-mono-tabular text-cyan-300 pt-2 border-t border-slate-800/80">
                  Dive to {org.characteristicDepth.toLocaleString()} m →
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
