import React, { useState } from 'react';
import { Compass } from 'lucide-react';
import { MARINE_ORGANISMS, OCEAN_ZONES } from '../data/oceanData';
import { MarineOrganismData, ZoneId } from '../types/ocean';

interface MarineLifeSectionProps {
  selectedOrganism: MarineOrganismData | null;
  onInspectOrganism: (org: MarineOrganismData) => void;
  onExploreOrganismIn3D: (org: MarineOrganismData) => void;
}

/**
 * Renders a domain-authentic vector biology diagram silhouette for each marine organism
 * so species cards never depend on external image hosts.
 */
const OrganismVectorSilhouette: React.FC<{ org: MarineOrganismData }> = ({
  org,
}) => {
  return (
    <svg
      viewBox="0 0 180 80"
      className="w-full h-24 rounded-lg bg-[#030915] border border-slate-800/80 p-2"
      role="img"
      aria-label={`Biological profile silhouette of ${org.commonName}`}
    >
      <defs>
        <radialGradient id={`glow-${org.id}`} cx="50%" cy="50%" r="50%">
          <stop
            offset="0%"
            stopColor={org.bioluminescent ? org.emissiveColor : org.secondaryColor}
            stopOpacity="0.45"
          />
          <stop offset="100%" stopColor="#030915" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="180" height="80" fill={`url(#glow-${org.id})`} />
      {/* Depth horizon grid lines */}
      <line
        x1="0"
        y1="40"
        x2="180"
        y2="40"
        stroke="#1e293b"
        strokeDasharray="3 3"
        strokeWidth="0.75"
      />

      {org.modelType === 'jellyfish' || org.modelType === 'deep_jellyfish' ? (
        <g transform="translate(90, 34)">
          <path
            d="M -24 0 C -24 -22, 24 -22, 24 0 Z"
            fill={org.primaryColor}
            stroke={org.secondaryColor}
            strokeWidth="1.5"
          />
          <line x1="-14" y1="2" x2="-18" y2="30" stroke={org.emissiveColor || org.secondaryColor} strokeWidth="1.5" />
          <line x1="-5" y1="2" x2="-6" y2="34" stroke={org.secondaryColor} strokeWidth="1.5" />
          <line x1="5" y1="2" x2="7" y2="32" stroke={org.emissiveColor || org.secondaryColor} strokeWidth="1.5" />
          <line x1="14" y1="2" x2="19" y2="28" stroke={org.secondaryColor} strokeWidth="1.5" />
        </g>
      ) : org.modelType === 'anglerfish' ? (
        <g transform="translate(90, 44)">
          <ellipse cx="0" cy="0" rx="28" ry="18" fill={org.primaryColor} stroke={org.secondaryColor} strokeWidth="1.5" />
          <path d="M 10 -16 Q 28 -30 38 -14" fill="none" stroke={org.secondaryColor} strokeWidth="1.5" />
          <circle cx="38" cy="-14" r="4.5" fill={org.emissiveColor} />
          <polygon points="-28,0 -42,-12 -42,12" fill={org.secondaryColor} />
        </g>
      ) : org.modelType === 'giant_isopod' || org.modelType === 'amphipod' || org.modelType === 'deep_crab' ? (
        <g transform="translate(90, 40)">
          <ellipse cx="0" cy="0" rx="34" ry="13" fill={org.primaryColor} stroke={org.secondaryColor} strokeWidth="1.5" />
          <line x1="-18" y1="-12" x2="-18" y2="12" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="-6" y1="-13" x2="-6" y2="13" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="6" y1="-13" x2="6" y2="13" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="18" y1="-12" x2="18" y2="12" stroke="#0f172a" strokeWidth="1.5" />
          <path d="M 32 -3 Q 48 -14 54 -18" fill="none" stroke={org.secondaryColor} strokeWidth="1.2" />
          <path d="M 32 3 Q 48 14 54 18" fill="none" stroke={org.secondaryColor} strokeWidth="1.2" />
        </g>
      ) : (
        <g transform="translate(90, 40)">
          <path
            d="M -38 0 Q -10 -18 36 0 Q -10 18 -38 0 Z"
            fill={org.primaryColor}
            stroke={org.secondaryColor}
            strokeWidth="1.5"
          />
          <polygon points="-36,0 -52,-13 -48,0 -52,13" fill={org.secondaryColor} />
          <polygon points="-4,-10 -14,-22 4,-10" fill={org.secondaryColor} />
          <circle cx="22" cy="-2" r="2.5" fill={org.bioluminescent ? org.emissiveColor : '#ffffff'} />
        </g>
      )}
    </svg>
  );
};

export const MarineLifeSection: React.FC<MarineLifeSectionProps> = ({
  selectedOrganism,
  onInspectOrganism,
  onExploreOrganismIn3D,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | ZoneId>('all');

  const filteredSpecies =
    activeFilter === 'all'
      ? MARINE_ORGANISMS
      : MARINE_ORGANISMS.filter((org) => org.zoneId === activeFilter);

  return (
    <section
      id="marine-life"
      className="gs-reveal-section py-20 px-6 bg-[#040a17] border-t border-slate-800/80"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-mono-tabular uppercase tracking-widest text-cyan-400 mb-2">
              03. CURATED BIOLOGICAL SPECIMENS
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
              Ocean Life Discovery Directory
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Explore 15 representative marine organisms across the five depth
              zones. Select any organism to view its scientific taxonomy and
              verified depth notes, or pilot the 3D camera straight to its
              habitat.
            </p>
          </div>

          {/* Interactive Segmented Filter Bar */}
          <div
            role="group"
            aria-label="Filter Species by Ocean Zone"
            className="flex flex-wrap items-center gap-1 p-1 bg-[#071326] border border-slate-800 rounded-lg self-start"
          >
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-cyan-400 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              All Zones ({MARINE_ORGANISMS.length})
            </button>
            {OCEAN_ZONES.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => setActiveFilter(zone.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  activeFilter === zone.id
                    ? 'bg-cyan-400 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {zone.name.replace(' Zone', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Species Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpecies.map((org) => {
            const zone = OCEAN_ZONES.find((z) => z.id === org.zoneId);
            const isSelected = selectedOrganism?.id === org.id;

            return (
              <article
                key={org.id}
                className={`bg-[#061124] border rounded-xl p-5 flex flex-col justify-between transition-colors ${
                  isSelected
                    ? 'border-cyan-400'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <OrganismVectorSilhouette org={org} />

                  {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-4 mb-1">
                    <span className="text-cyan-400 font-medium">
                      {zone?.name}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">
                      {org.illustrativeMinDepth.toLocaleString()}–
                      {org.illustrativeMaxDepth.toLocaleString()} m
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{org.sizeEstimate}</span>
                  </div>

                  <h3 className="font-display text-xl font-bold text-white">
                    {org.commonName}
                  </h3>
                  <p className="text-xs italic text-slate-400 mb-3">
                    {org.scientificName}
                  </p>

                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    {org.shortDescription}
                  </p>

                  <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-2.5 mb-4">
                    <span className="font-semibold text-slate-300">
                      Literature Depth Record:{' '}
                    </span>
                    <span>{org.verifiedDepthRecord}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => onExploreOrganismIn3D(org)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 rounded-md hover:bg-cyan-300 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Explore in 3D ({org.characteristicDepth} m)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onInspectOrganism(org)}
                    className="px-3 py-2 text-xs font-medium text-slate-200 bg-[#091933] border border-slate-700 rounded-md hover:border-cyan-400 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Full Dossier
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
