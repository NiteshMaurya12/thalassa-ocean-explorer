import React from 'react';
import {
  DEPTH_LANDMARKS,
  MAX_OCEAN_DEPTH,
  OCEAN_ZONES,
} from '../data/oceanData';
import {
  calculateHydrostaticPressureAtm,
  getProportionalDepthPercent,
} from '../utils/oceanMath';

interface DepthComparisonProps {
  currentDepth: number;
  onSelectDepth: (depth: number) => void;
}

export const DepthComparison: React.FC<DepthComparisonProps> = ({
  currentDepth,
  onSelectDepth,
}) => {
  const currentPercent = getProportionalDepthPercent(currentDepth);

  return (
    <section
      aria-label="True-Scale Ocean Depth Comparison"
      className="py-20 px-6 bg-[#030916] border-t border-slate-800/80"
    >
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-mono-tabular uppercase tracking-widest text-cyan-400 mb-2">
            01. TRUE PROPORTIONAL HYPSOMETRY
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            Proportional Depth Comparison Scale
          </h2>
          <p className="text-slate-300 text-base leading-relaxed">
            Most ocean diagrams distort vertical scale so the sunlit surface
            appears huge. On a true linear scale from 0 m to 10,935 m, the entire
            sunlit Epipelagic Zone occupies just{' '}
            <span className="font-mono-tabular text-cyan-300 font-semibold">
              1.83%
            </span>{' '}
            of the vertical column. Click any zone or landmark below to pilot the
            3D depth explorer to that exact horizon.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: True-Scale Vertical Proportional Column (0 to 10,935 m) */}
          <div className="lg:col-span-5 bg-[#050f21] border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div>
                <span className="text-xs font-mono-tabular uppercase text-slate-400 block">
                  SELECTED DEPTH POSITION
                </span>
                <span className="text-xl font-mono-tabular font-bold text-white">
                  {Math.round(currentDepth).toLocaleString()} m{' '}
                  <span className="text-sm font-normal text-cyan-400">
                    ({currentPercent.toFixed(1)}% of full ocean depth)
                  </span>
                </span>
              </div>
            </div>

            {/* True Proportional Vertical Scale Container (640px tall) */}
            <div className="relative h-[640px] w-full flex gap-4">
              {/* Proportional Zone Stack */}
              <div className="relative w-20 sm:w-24 h-full rounded-lg overflow-hidden border border-slate-700/80 flex flex-col shrink-0">
                {OCEAN_ZONES.map((zone) => {
                  const spanMetres = zone.maxDepth - zone.minDepth;
                  const heightPercent = (spanMetres / MAX_OCEAN_DEPTH) * 100;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() =>
                        onSelectDepth(
                          Math.round((zone.minDepth + zone.maxDepth) / 2)
                        )
                      }
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: zone.colorHex,
                      }}
                      title={`${zone.name}: ${zone.minDepth}–${zone.maxDepth} m (${heightPercent.toFixed(
                        1
                      )}% of total depth)`}
                      className="w-full border-b border-slate-700/60 last:border-b-0 flex items-center justify-center text-[10px] font-mono-tabular text-slate-200 hover:brightness-125 transition-all cursor-pointer overflow-hidden px-1"
                    >
                      {heightPercent > 5 ? (
                        <span className="truncate">
                          {zone.name.replace(' Zone', '')} ({heightPercent.toFixed(0)}%)
                        </span>
                      ) : null}
                    </button>
                  );
                })}

                {/* Live Current Depth Horizontal Marker */}
                <div
                  style={{ top: `${Math.min(99.5, Math.max(0.5, currentPercent))}%` }}
                  className="pointer-events-none absolute inset-x-0 h-0.5 bg-cyan-300 shadow-[0_0_8px_#22d3ee]"
                />
              </div>

              {/* True-Scale Proportional Annotations */}
              <div className="relative flex-1 h-full border-l border-slate-800 pl-4">
                {OCEAN_ZONES.map((zone) => {
                  const topPercent = getProportionalDepthPercent(zone.minDepth);
                  const spanPercent =
                    getProportionalDepthPercent(zone.maxDepth) - topPercent;
                  return (
                    <div
                      key={zone.id}
                      style={{ top: `${topPercent}%` }}
                      className="absolute left-4 right-0 flex items-baseline justify-between text-xs border-t border-slate-800/70 pt-0.5"
                    >
                      <span className="font-semibold text-slate-200">
                        {zone.name}
                      </span>
                      <span className="font-mono-tabular text-slate-400">
                        {zone.minDepth.toLocaleString()}–{zone.maxDepth.toLocaleString()} m (
                        {spanPercent.toFixed(1)}%)
                      </span>
                    </div>
                  );
                })}

                {/* Bottom Challenger Deep marker */}
                <div className="absolute bottom-0 left-4 right-0 flex items-baseline justify-between text-xs border-b border-cyan-500/50 pb-1">
                  <span className="font-semibold text-cyan-300">
                    Challenger Deep Floor
                  </span>
                  <span className="font-mono-tabular text-cyan-300">
                    10,935 m (100%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Depth Landmarks & Exploration Benchmarks */}
          <div className="lg:col-span-7 bg-[#050f21] border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="font-display text-xl font-bold text-white mb-1">
                Ocean Exploration & Bathymetric Landmarks
              </h3>
              <p className="text-xs text-slate-400">
                Select any depth marker to jump the 3D camera directly to that
                horizon.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEPTH_LANDMARKS.map((landmark) => {
                const isNear = Math.abs(currentDepth - landmark.depth) < 120;
                const pct = getProportionalDepthPercent(landmark.depth);
                const pressure = calculateHydrostaticPressureAtm(landmark.depth);
                return (
                  <button
                    key={landmark.id}
                    type="button"
                    onClick={() => onSelectDepth(landmark.depth)}
                    className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                      isNear
                        ? 'bg-cyan-950/80 border-cyan-400 text-white'
                        : 'bg-[#07152b] border-slate-800/90 text-slate-200 hover:border-cyan-500/60'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-sm font-mono-tabular font-bold text-cyan-300">
                        {landmark.depth.toLocaleString()} m
                      </span>
                      <span className="text-[11px] font-mono-tabular text-slate-400">
                        {pct.toFixed(1)}% depth · ~{pressure} atm
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white mb-1">
                      {landmark.title}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {landmark.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
