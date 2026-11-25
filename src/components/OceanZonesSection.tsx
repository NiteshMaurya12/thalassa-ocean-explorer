import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { OCEAN_ZONES, MARINE_ORGANISMS } from '../data/oceanData';
import { MarineOrganismData, OceanZoneData } from '../types/ocean';

interface OceanZonesSectionProps {
  onDiveToDepth: (depth: number) => void;
  onSelectOrganism: (org: MarineOrganismData) => void;
}

export const OceanZonesSection: React.FC<OceanZonesSectionProps> = ({
  onDiveToDepth,
  onSelectOrganism,
}) => {
  const getRepresentativeDepth = (zone: OceanZoneData) => {
    if (zone.id === 'epipelagic') return 50;
    if (zone.id === 'mesopelagic') return 500;
    if (zone.id === 'bathypelagic') return 2000;
    if (zone.id === 'abyssopelagic') return 5000;
    return 8000;
  };

  return (
    <section
      id="ocean-zones"
      className="gs-reveal-section py-20 px-6 bg-[#030711] border-t border-slate-800/80"
    >
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-mono-tabular uppercase tracking-widest text-cyan-400 mb-2">
            02. VERTICAL STRATIFICATION
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            Explore the Five Major Ocean Zones
          </h2>
          <p className="text-slate-300 text-base leading-relaxed">
            Oceanographers classify the water column into five distinct pelagic
            strata governed by solar photon attenuation, thermohaline
            circulation, and hydrostatic pressure gradients.
          </p>
        </div>

        <div className="space-y-6">
          {OCEAN_ZONES.map((zone, index) => {
            const zoneSpecies = MARINE_ORGANISMS.filter(
              (org) => org.zoneId === zone.id
            );
            const targetDepth = getRepresentativeDepth(zone);

            return (
              <article
                key={zone.id}
                className="bg-[#050d1d] border border-slate-800 rounded-xl p-6 md:p-8 transition-colors hover:border-slate-700"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left: Zone Identity & Physical Telemetry */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono-tabular text-cyan-400">
                      <span>LAYER 0{index + 1}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {zone.minDepth.toLocaleString()} –{' '}
                        {zone.maxDepth.toLocaleString()} m
                      </span>
                    </div>

                    <h3 className="font-display text-2xl font-bold text-white">
                      {zone.name}
                    </h3>
                    <p className="text-sm text-slate-400">{zone.subtitle}</p>

                    <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 block">
                          Hydrostatic Pressure:
                        </span>
                        <span className="font-mono-tabular text-white font-semibold">
                          {zone.pressureRangeAtm}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">
                          Solar Irradiance:
                        </span>
                        <span className="text-slate-200">
                          {zone.lightLevelDescription}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">
                          Temperature Profile:
                        </span>
                        <span className="font-mono-tabular text-slate-200">
                          {zone.temperatureRangeC}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => onDiveToDepth(targetDepth)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 rounded-md hover:bg-cyan-300 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <span>
                          Dive to {zone.name.replace(' Zone', '')} (
                          {targetDepth.toLocaleString()} m)
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Center: Summary & Environmental Characteristics */}
                  <div className="lg:col-span-5 space-y-4">
                    <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                      {zone.summary}
                    </p>
                    <div>
                      <h4 className="text-xs font-mono-tabular uppercase tracking-wider text-slate-400 mb-2">
                        Defining Environmental Characteristics
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {zone.environmentalTraits.map((trait, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-cyan-400 font-mono-tabular">
                              ·
                            </span>
                            <span>{trait}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Right: Representative Organisms */}
                  <div className="lg:col-span-3 bg-[#071329] border border-slate-800/90 rounded-lg p-4">
                    <h4 className="text-xs font-mono-tabular uppercase tracking-wider text-slate-400 mb-3">
                      Representative Organisms ({zoneSpecies.length})
                    </h4>
                    <div className="space-y-2">
                      {zoneSpecies.map((org) => (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => onSelectOrganism(org)}
                          className="w-full text-left p-2.5 rounded-md bg-[#040c1a] border border-slate-800 hover:border-cyan-400 transition-colors cursor-pointer"
                        >
                          <div className="text-xs font-semibold text-white">
                            {org.commonName}
                          </div>
                          <div className="text-[11px] italic text-slate-400">
                            {org.scientificName}
                          </div>
                          <div className="text-[11px] font-mono-tabular text-cyan-300 mt-1">
                            {org.illustrativeMinDepth.toLocaleString()}–
                            {org.illustrativeMaxDepth.toLocaleString()} m
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
