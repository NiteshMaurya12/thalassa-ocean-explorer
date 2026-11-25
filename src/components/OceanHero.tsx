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
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.1 }
      );
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.25 }
      );
      gsap.fromTo(
        actionsRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.4 }
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
      className={`pointer-events-none absolute inset-x-0 top-20 z-20 flex flex-col items-center justify-center px-6 pt-6 pb-12 transition-opacity duration-500 ${
        isHidden ? 'opacity-0 invisible' : 'opacity-100 visible'
      }`}
    >
      <div className="pointer-events-auto max-w-xl lg:translate-x-28 mx-auto text-center bg-[#030b18]/88 border border-slate-700/80 rounded-xl px-6 py-7 md:px-9 md:py-8 shadow-2xl">
        <p className="text-xs font-mono-tabular tracking-[0.22em] text-cyan-300 uppercase mb-3">
          THALASSA · DESCEND INTO THE UNKNOWN
        </p>

        <h1
          ref={titleRef}
          className="font-display text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.08] mb-4"
        >
          THE OCEAN IS DEEPER THAN YOU THINK.
        </h1>

        <p
          ref={subtitleRef}
          className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8"
        >
          An interactive journey from the ocean surface to the deepest known
          parts of our planet.
        </p>

        <div
          ref={actionsRef}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <button
            type="button"
            onClick={onStartDiving}
            className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold text-slate-950 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowDown className="w-4 h-4" />
            <span>START DIVING</span>
          </button>

          <button
            type="button"
            onClick={onExploreSections}
            className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold text-slate-100 bg-[#071529] border border-slate-700 rounded-lg hover:border-cyan-400 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>EXPLORE THE OCEAN</span>
          </button>
        </div>

        <div className="mt-7 pt-5 border-t border-slate-800/90 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-400">
          <span>0 m Surface Column</span>
          <span aria-hidden="true">·</span>
          <span>5 Bathymetric Zones</span>
          <span aria-hidden="true">·</span>
          <span>15 Representative 3D Species</span>
          <span aria-hidden="true">·</span>
          <span>10,935 m Challenger Deep</span>
        </div>
      </div>
    </div>
  );
};
