import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowDown, Compass } from 'lucide-react';

interface OceanHeroProps {
  isDivingStarted: boolean;
  currentDepth: number;
  onStartDiving: () => void;
  onExploreSections: () => void;
}

export const OceanHero: React.FC<OceanHeroProps> = ({
  isDivingStarted,
  currentDepth,
  onStartDiving,
  onExploreSections,
}) => {
  const heroContainerRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', delay: 0.1 }
      );
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out', delay: 0.22 }
      );
      gsap.fromTo(
        actionsRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out', delay: 0.34 }
      );
    }, heroContainerRef);

    return () => ctx.revert();
  }, []);

  // Once the user starts diving or descends below 25m, smoothly fade the hero overlay out
  // so the 3D underwater viewport is completely unobstructed
  const isHidden = isDivingStarted || currentDepth > 25;

  return (
    <div
      ref={heroContainerRef}
      className={`pointer-events-none absolute inset-x-0 top-16 z-20 flex flex-col items-center justify-center px-4 pt-3 pb-4 transition-opacity duration-500 ${
        isHidden ? 'opacity-0 invisible' : 'opacity-100 visible'
      }`}
    >
      <div className="pointer-events-auto max-w-md sm:max-w-lg lg:translate-x-24 mx-auto text-center bg-[#030b18]/50 border border-cyan-400/25 rounded-xl px-5 py-4 sm:px-7 sm:py-5 shadow-2xl">
        <p className="text-[11px] font-mono-tabular tracking-[0.22em] text-cyan-300 uppercase mb-2">
          THALASSA · DESCEND INTO THE UNKNOWN
        </p>

        <h1
          ref={titleRef}
          className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white leading-[1.12] mb-2.5 drop-shadow"
        >
          THE OCEAN IS DEEPER THAN YOU THINK.
        </h1>

        <p
          ref={subtitleRef}
          className="text-xs sm:text-sm text-slate-200/95 max-w-md mx-auto leading-relaxed mb-4"
        >
          An interactive 3D scientific expedition from the sunlit ocean surface
          to the 10,935-metre floor of the Challenger Deep.
        </p>

        <div
          ref={actionsRef}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <button
            type="button"
            onClick={onStartDiving}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-md"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>START EXPLORING</span>
          </button>

          <button
            type="button"
            onClick={onExploreSections}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-100 bg-[#051326]/75 border border-cyan-500/35 rounded-lg hover:border-cyan-400 hover:bg-[#071a33]/90 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>EXPLORE THE OCEAN</span>
          </button>
        </div>

        <div className="mt-3.5 pt-2.5 border-t border-cyan-500/20 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-300/90">
          <span>0 m Surface Column</span>
          <span aria-hidden="true">·</span>
          <span>5 Bathymetric Zones</span>
          <span aria-hidden="true">·</span>
          <span>18 3D Species</span>
          <span aria-hidden="true">·</span>
          <span>17 Depth Milestones</span>
        </div>
      </div>
    </div>
  );
};
