import React, { useState } from 'react';
import { Compass, MapPin } from 'lucide-react';
import { EXPLORATION_MAP_SITES } from '../data/oceanData';
import { ExplorationMapSite } from '../types/ocean';
import { calculateHydrostaticPressureAtm } from '../utils/oceanMath';

interface OceanExplorationMapSectionProps {
  onDiveToDepth: (depth: number) => void;
}

export const OceanExplorationMapSection: React.FC<
  OceanExplorationMapSectionProps
> = ({ onDiveToDepth }) => {
  const [activeCategory, setActiveCategory] = useState<
    'all' | ExplorationMapSite['category']
  >('all');
  const [selectedSiteId, setSelectedSiteId] = useState<string>(
    EXPLORATION_MAP_SITES[0].id
  );

  const filteredSites =
    activeCategory === 'all'
      ? EXPLORATION_MAP_SITES
      : EXPLORATION_MAP_SITES.filter((s) => s.category === activeCategory);

  const activeSite =
    EXPLORATION_MAP_SITES.find((s) => s.id === selectedSiteId) ??
    filteredSites[0] ??
    EXPLORATION_MAP_SITES[0];

  const activePressureAtm = calculateHydrostaticPressureAtm(
    activeSite.depthMetres
  );

  const categoryLabels: {
    id: 'all' | ExplorationMapSite['category'];
    label: string;
  }[] = [
    { id: 'all', label: `All Sites (${EXPLORATION_MAP_SITES.length})` },
    { id: 'trench', label: 'Hadal Trenches' },
    { id: 'shipwreck', label: 'Historic Shipwrecks' },
    { id: 'hydrothermal', label: 'Hydrothermal Vents' },
    { id: 'expedition', label: 'Depth Records' },
  ];

  return (
    <section
      id="exploration-map"
      aria-label="Global Ocean Exploration Map"
      className="gs-reveal-section py-20 px-6 bg-[#040b18] border-t border-slate-800/80"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-3xl">
            <p className="text-xs font-mono-tabular uppercase tracking-widest text-cyan-400 mb-2">
              07. GLOBAL BATHYMETRIC &amp; EXPEDITION ATLAS
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
              Ocean Exploration Map
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Inspect verified geographic coordinates for Earth’s deepest
              subduction trenches, historic deep-sea shipwrecks, hydrothermal
              vent fields, and biological depth records. Select any pin to view
              its telemetry or pilot the 3D explorer to its exact depth.
            </p>
          </div>

          {/* Category Filter Bar */}
          <div
            role="group"
            aria-label="Filter Exploration Map Sites"
            className="flex flex-wrap items-center gap-1 p-1 bg-[#071428] border border-slate-800 rounded-lg self-start"
          >
            {categoryLabels.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  const nextList =
                    cat.id === 'all'
                      ? EXPLORATION_MAP_SITES
                      : EXPLORATION_MAP_SITES.filter(
                          (s) => s.category === cat.id
                        );
                  if (
                    nextList.length > 0 &&
                    !nextList.some((s) => s.id === selectedSiteId)
                  ) {
                    setSelectedSiteId(nextList[0].id);
                  }
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-cyan-400 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Interactive SVG Global Bathymetric Chart (7 cols) */}
          <div className="lg:col-span-7 bg-[#030914] border border-slate-800 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs font-mono-tabular text-slate-400 mb-3">
              <span>GLOBAL BATHYMETRIC CHART · EQUATORIAL &amp; BASIN PROJECTION</span>
              <span className="text-cyan-400">
                ACTIVE PIN: {activeSite.coordinates}
              </span>
            </div>

            <div className="relative w-full overflow-hidden rounded-lg border border-slate-800/90 bg-[#051124]">
              <svg
                viewBox="0 0 1000 500"
                className="w-full h-auto block"
                role="img"
                aria-label="Interactive global ocean exploration map with clickable expedition pins"
              >
                {/* Latitude / Longitude Graticule Grid */}
                {[100, 200, 250, 300, 400].map((y) => (
                  <line
                    key={`lat-${y}`}
                    x1="0"
                    y1={y}
                    x2="1000"
                    y2={y}
                    stroke={y === 250 ? '#1e3a5f' : '#0f233f'}
                    strokeDasharray={y === 250 ? '6 4' : '3 3'}
                    strokeWidth={y === 250 ? '1.5' : '1'}
                  />
                ))}
                {[150, 300, 500, 700, 850].map((x) => (
                  <line
                    key={`lon-${x}`}
                    x1={x}
                    y1="0"
                    x2={x}
                    y2="500"
                    stroke="#0f233f"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                ))}

                {/* Stylized Continental Landmass Polygons */}
                {/* North America */}
                <polygon
                  points="95,55 245,45 315,120 265,195 235,230 175,180 115,115"
                  fill="#0a192f"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                />
                {/* South America */}
                <polygon
                  points="265,240 345,265 365,335 315,445 280,435 270,315"
                  fill="#0a192f"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                />
                {/* Europe & Eurasia */}
                <polygon
                  points="445,55 620,45 845,60 885,140 795,215 710,205 635,175 540,145 455,130"
                  fill="#0a192f"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                />
                {/* Africa */}
                <polygon
                  points="455,155 575,165 615,255 570,385 515,380 475,265 440,210"
                  fill="#0a192f"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                />
                {/* Australia */}
                <polygon
                  points="765,305 865,300 880,375 805,395 755,355"
                  fill="#0a192f"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                />

                {/* Mid-Ocean Ridge & Subduction Trench Tectonic Fracture Lines */}
                <path
                  d="M 385,65 Q 360,140 385,195 T 415,345 T 440,455"
                  fill="none"
                  stroke="#0284c7"
                  strokeOpacity="0.4"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                />
                <path
                  d="M 825,140 Q 815,215 780,245 M 895,280 Q 915,330 890,395"
                  fill="none"
                  stroke="#22d3ee"
                  strokeOpacity="0.55"
                  strokeWidth="2.5"
                />

                {/* Ocean Basin Watermark Labels */}
                <text
                  x="355"
                  y="110"
                  fill="#334155"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  NORTH ATLANTIC
                </text>
                <text
                  x="150"
                  y="290"
                  fill="#334155"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  EASTERN PACIFIC
                </text>
                <text
                  x="655"
                  y="275"
                  fill="#334155"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  INDIAN OCEAN
                </text>
                <text
                  x="815"
                  y="125"
                  fill="#334155"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  WESTERN PACIFIC TRENCHES
                </text>

                {/* Interactive Expedition Pins */}
                {filteredSites.map((site) => {
                  const isSelected = site.id === activeSite.id;
                  const pinColor =
                    site.category === 'trench'
                      ? '#22d3ee'
                      : site.category === 'shipwreck'
                      ? '#fbbf24'
                      : site.category === 'hydrothermal'
                      ? '#fb923c'
                      : '#34d399';

                  return (
                    <g
                      key={site.id}
                      transform={`translate(${site.mapX}, ${site.mapY})`}
                      onClick={() => setSelectedSiteId(site.id)}
                      className="cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={`Select map site ${site.name} (${site.depthMetres} m)`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedSiteId(site.id);
                        }
                      }}
                    >
                      {isSelected && (
                        <circle
                          r="18"
                          fill={pinColor}
                          fillOpacity="0.22"
                          stroke={pinColor}
                          strokeWidth="1.5"
                        />
                      )}
                      <circle
                        r={isSelected ? '7.5' : '5.5'}
                        fill={pinColor}
                        stroke="#030914"
                        strokeWidth="2"
                      />
                      <text
                        x="11"
                        y="4"
                        fill={isSelected ? '#ffffff' : '#cbd5e1'}
                        fontSize={isSelected ? '12' : '10.5'}
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        fontFamily="sans-serif"
                      >
                        {site.depthMetres.toLocaleString()}m
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Quick Site Pill Selector Below Map */}
            <div className="mt-4 flex flex-wrap gap-2">
              {filteredSites.map((site) => {
                const isSelected = site.id === activeSite.id;
                return (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => setSelectedSiteId(site.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950 border-cyan-400 text-white font-semibold'
                        : 'bg-[#061326] border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{site.name}</span>
                    <span className="font-mono-tabular text-cyan-300">
                      ({site.depthMetres.toLocaleString()} m)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Site Scientific Telemetry Dossier (5 cols) */}
          <div className="lg:col-span-5 bg-[#051022] border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 text-xs font-mono-tabular text-cyan-400 mb-2">
                <span className="uppercase">{activeSite.category} SITE</span>
                <span>{activeSite.yearOrEra}</span>
              </div>

              <h3 className="font-display text-2xl font-bold text-white mb-1">
                {activeSite.name}
              </h3>
              <p className="text-xs font-mono-tabular text-slate-400 mb-4">
                {activeSite.oceanBasin} · Coordinates: {activeSite.coordinates}
              </p>

              <div className="grid grid-cols-2 gap-3 bg-[#071730] border border-slate-800 rounded-lg p-3.5 mb-4">
                <div>
                  <span className="text-[10px] font-mono-tabular uppercase tracking-wider text-slate-400 block">
                    SURVEYED DEPTH
                  </span>
                  <span className="text-xl font-mono-tabular font-bold text-white">
                    {activeSite.depthMetres.toLocaleString()} m
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono-tabular uppercase tracking-wider text-slate-400 block">
                    HYDROSTATIC PRESSURE
                  </span>
                  <span className="text-xl font-mono-tabular font-bold text-cyan-300">
                    ~{activePressureAtm} atm
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed mb-4">
                {activeSite.summary}
              </p>

              <div className="p-3 rounded-lg bg-[#030b18] border border-slate-800/90 text-xs text-slate-300 mb-6">
                <span className="font-semibold text-emerald-400 block mb-0.5">
                  Verified Bathymetric Data Note:
                </span>
                {activeSite.verifiedDataNote}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDiveToDepth(activeSite.depthMetres)}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-950 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>
                Pilot 3D Submersible to {activeSite.name} (
                {activeSite.depthMetres.toLocaleString()} m)
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
