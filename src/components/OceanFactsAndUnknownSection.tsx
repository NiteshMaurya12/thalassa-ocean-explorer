import React, { useState } from 'react';
import { ArrowUpRight, Compass } from 'lucide-react';
import { OCEAN_FACTS, DISCOVERY_MILESTONES } from '../data/oceanData';

interface OceanFactsAndUnknownSectionProps {
  onDiveToDepth: (depth: number) => void;
}

export const OceanFactsAndUnknownSection: React.FC<
  OceanFactsAndUnknownSectionProps
> = ({ onDiveToDepth }) => {
  const [activeFactId, setActiveFactId] = useState<string>(OCEAN_FACTS[0].id);
  const activeFact =
    OCEAN_FACTS.find((f) => f.id === activeFactId) ?? OCEAN_FACTS[0];

  return (
    <>
      {/* Section D: Ocean Facts & Physical Oceanography */}
      <section
        id="ocean-facts"
        className="gs-reveal-section py-20 px-6 bg-[#040a17] border-t border-slate-800/80"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12">
            <p className="text-xs font-mono-tabular uppercase tracking-widest text-cyan-400 mb-2">
              05. PHYSICAL OCEANOGRAPHY & TELEMETRY
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Ocean Facts: Pressure, Light, Temperature & Geography
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              The physical parameters of the deep sea govern every biological
              adaptation and engineering constraint of underwater exploration.
            </p>
          </div>

          {/* 4 Fact Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {OCEAN_FACTS.map((fact) => {
              const isSelected = fact.id === activeFact.id;
              return (
                <button
                  key={fact.id}
                  type="button"
                  onClick={() => setActiveFactId(fact.id)}
                  className={`text-left p-5 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#071832] border-cyan-400'
                      : 'bg-[#050e1f] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-mono-tabular uppercase tracking-wider text-slate-400 block mb-2">
                    {fact.category}
                  </span>
                  <div className="flex items-baseline mb-2">
                    <span className="text-3xl font-mono-tabular font-bold text-white">
                      {fact.metricValue}
                    </span>
                    <span className="text-xs font-mono-tabular text-cyan-400 ml-1.5">
                      {fact.metricUnit}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-white mb-1">
                    {fact.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {fact.summary}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Detailed Interactive Breakdown for Selected Physical Parameter */}
          <div className="bg-[#050f21] border border-slate-800 rounded-xl p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <div className="text-xs font-mono-tabular text-cyan-300">
                  GOVERNING PRINCIPLE: {activeFact.formulaOrPrinciple}
                </div>
                <h3 className="font-display text-2xl font-bold text-white">
                  {activeFact.title}
                </h3>
                <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                  {activeFact.details}
                </p>
              </div>

              <div className="lg:col-span-6 space-y-2.5">
                <h4 className="text-xs font-mono-tabular uppercase tracking-wider text-slate-400 mb-3">
                  Depth Benchmark Measurements (Click to Inspect in 3D)
                </h4>
                {activeFact.dataPoints.map((dp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onDiveToDepth(dp.depthM)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-[#07152b] border border-slate-800 hover:border-cyan-400 transition-colors cursor-pointer"
                  >
                    <div className="text-left">
                      <span className="text-sm font-semibold text-white block">
                        {dp.label}
                      </span>
                      <span className="text-xs font-mono-tabular text-slate-400">
                        Depth: {dp.depthM.toLocaleString()} m
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono-tabular font-semibold text-cyan-300">
                        {dp.value}
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section E: Explore the Unknown — Ocean Exploration & Scientific Discoveries */}
      <section
        id="discoveries"
        className="gs-reveal-section py-20 px-6 bg-[#030711] border-t border-slate-800/80"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12">
            <p className="text-xs font-mono-tabular uppercase tracking-widest text-cyan-400 mb-2">
              06. FRONTIERS OF DEEP-SEA SCIENCE
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Explore the Unknown: Scientific Expeditions & Frontiers
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Over 74% of Earth’s seabed remains unmapped at high direct-sonar
              resolution. Every major descent into the abyssal and hadal realms
              has reshaped our understanding of planetary biology and geology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DISCOVERY_MILESTONES.map((milestone) => (
              <article
                key={milestone.id}
                className="bg-[#050d1d] border border-slate-800 rounded-xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono-tabular text-cyan-400 mb-2">
                    <span>{milestone.year}</span>
                    <span aria-hidden="true">·</span>
                    <span>{milestone.depthMetres.toLocaleString()} m</span>
                    <span aria-hidden="true">·</span>
                    <span>{milestone.region}</span>
                  </div>

                  <h3 className="font-display text-xl font-bold text-white mb-1">
                    {milestone.title}
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    Platform: {milestone.vesselOrMethod}
                  </p>

                  <p className="text-sm text-slate-200 leading-relaxed mb-4">
                    {milestone.summary}
                  </p>

                  <div className="p-3 rounded-lg bg-[#071429] border border-slate-800/80 text-xs text-slate-300 mb-5">
                    <span className="font-semibold text-cyan-300">
                      Scientific Impact:{' '}
                    </span>
                    {milestone.scientificImpact}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDiveToDepth(milestone.depthMetres)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-200 bg-[#081730] border border-slate-700 rounded-md hover:border-cyan-400 hover:text-white transition-colors cursor-pointer self-start"
                >
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    Inspect {milestone.depthMetres.toLocaleString()} m Horizon in
                    3D
                  </span>
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Clean Editorial Footer (No Ornamental Telemetry Clutter) */}
      <footer className="py-12 px-6 bg-[#02050c] border-t border-slate-800/80 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-white tracking-wider">
              THALASSA
            </span>
            <span aria-hidden="true">·</span>
            <span>Interactive 3D Bathymetric & Marine Biology Explorer</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <a
              href="#dive-explorer"
              onClick={(e) => {
                e.preventDefault();
                onDiveToDepth(0);
              }}
              className="hover:text-cyan-300 transition-colors"
            >
              Return to Ocean Surface (0 m)
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="#dive-explorer"
              onClick={(e) => {
                e.preventDefault();
                onDiveToDepth(10935);
              }}
              className="hover:text-cyan-300 transition-colors"
            >
              Jump to Challenger Deep (10,935 m)
            </a>
          </div>
        </div>
      </footer>
    </>
  );
};
