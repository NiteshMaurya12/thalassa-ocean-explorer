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
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.08 }
      );
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out', delay: 0.18 }
      );
      gsap.fromTo(
        actionsRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out', delay: 0.28 }
      );
    }, heroContainerRef);

    return () => ctx.revert();
  }, []);

  // Smoothly fade out and hide the hero card as soon as user clicks Start Exploring or descends below 0m.
  // Reappears smoothly when user returns to surface (0m and not actively diving).
  const isHidden = isDivingStarted || currentDepth > 5;

  return (
    <div
      ref={heroContainerRef}
      aria-hidden={isHidden}
      className={`pointer-events-none absolute inset-x-0 top-14 sm:top-16 z-20 flex flex-col items-center justify-center px-4 pt-2 transition-all duration-500 ease-out ${
        isHidden
          ? 'opacity-0 -translate-y-2 scale-95 invisible'
          : 'opacity-100 translate-y-0 scale-100 visible'
      }`}
    >
      <div
        data-testid="hero-surface-card"
        className="pointer-events-auto w-full max-w-[310px] sm:max-w-[350px] mx-auto text-center bg-[#030b18]/38 border border-cyan-400/20 rounded-xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-lg"
      >
        <p className="text-[9px] font-mono-tabular tracking-[0.2em] text-cyan-300/90 uppercase mb-1">
          THALASSA · 3D OCEAN EXPEDITION
        </p>

        <h1
          ref={titleRef}
          className="font-display text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white leading-snug mb-1.5 drop-shadow"
        >
          THE OCEAN IS DEEPER THAN YOU THINK.
        </h1>

        <p
          ref={subtitleRef}
          className="text-[11px] sm:text-xs text-slate-200/90 max-w-[270px] mx-auto leading-normal mb-3"
        >
          Descend from the sunlit surface to 10,935 m in real-time 3D.
        </p>

        <div
          ref={actionsRef}
          className="flex items-center justify-center gap-2"
        >
          <button
            type="button"
            onClick={onStartDiving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 rounded-md hover:bg-cyan-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Start Exploring</span>
          </button>

          <button
            type="button"
            onClick={onExploreSections}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-100 bg-[#051326]/55 border border-cyan-500/25 rounded-md hover:border-cyan-400/60 hover:bg-[#071a33]/80 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Atlas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
