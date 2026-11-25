import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { Navigation } from './components/Navigation';
import { OceanHero } from './components/OceanHero';
import { OceanScene } from './components/OceanScene';
import { DepthExplorerHUD } from './components/DepthExplorerHUD';
import { SpeciesInfoPanel } from './components/SpeciesInfoPanel';
import { DepthComparison } from './components/DepthComparison';
import { OceanZonesSection } from './components/OceanZonesSection';
import { MarineLifeSection } from './components/MarineLifeSection';
import { DeepestPlacesSection } from './components/DeepestPlacesSection';
import { OceanFactsAndUnknownSection } from './components/OceanFactsAndUnknownSection';
import { OceanExplorationMapSection } from './components/OceanExplorationMapSection';
import { ResearchConservationSection } from './components/ResearchConservationSection';
import { MAX_OCEAN_DEPTH } from './data/oceanData';
import { MarineOrganismData } from './types/ocean';
import { clampDepth, getZoneForDepth } from './utils/oceanMath';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const autostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [currentDepth, setCurrentDepth] = useState<number>(autostart ? 65 : 0);
  const [isDivingStarted, setIsDivingStarted] = useState<boolean>(autostart);
  const [isAutoDescending, setIsAutoDescending] = useState<boolean>(false);
  const [descentSpeed, setDescentSpeed] = useState<number>(1);
  const [selectedOrganism, setSelectedOrganism] =
    useState<MarineOrganismData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const explorerStageRef = useRef<HTMLElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Sync key state onto <body> attributes for accessibility / automated verification
  useEffect(() => {
    const zone = getZoneForDepth(currentDepth);
    document.body.dataset.depth = String(Math.round(currentDepth));
    document.body.dataset.zone = zone.id;
    document.body.dataset.state = isDivingStarted ? 'exploring' : 'surface';
  }, [currentDepth, isDivingStarted]);

  // Initialize Lenis smooth scrolling & GSAP ScrollTrigger section entrance animations
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const sections = document.querySelectorAll('.gs-reveal-section');
    sections.forEach((sec) => {
      gsap.fromTo(
        sec,
        { opacity: 0.92, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sec,
            start: 'top 86%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  // Auto-descent loop when active
  useEffect(() => {
    if (!isAutoDescending) return;
    let lastTime = performance.now();
    let timerId = 0;

    const step = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.2);
      lastTime = now;

      setCurrentDepth((prev) => {
        const baseRate = prev < 200 ? 28 : prev < 1000 ? 95 : 240;
        const next = clampDepth(prev + baseRate * descentSpeed * dt);
        if (next >= MAX_OCEAN_DEPTH) {
          setIsAutoDescending(false);
        }
        return next;
      });

      timerId = window.setTimeout(step, 50);
    };

    timerId = window.setTimeout(step, 50);
    return () => clearTimeout(timerId);
  }, [isAutoDescending, descentSpeed]);

  const scrollToSection = useCallback((sectionId: string) => {
    if (sectionId === 'home' || sectionId === 'dive-explorer') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleStartDiving = useCallback(() => {
    setIsDivingStarted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentDepth((prev) => (prev < 45 ? 45 : prev));
    setIsAutoDescending(true);
  }, []);

  const handleChangeDepth = useCallback((newDepth: number) => {
    const clamped = clampDepth(newDepth);
    setCurrentDepth(clamped);
    if (clamped > 0) {
      setIsDivingStarted(true);
    }
  }, []);

  const handleJumpToDepthFromSection = useCallback((targetDepth: number) => {
    setIsAutoDescending(false);
    setIsDivingStarted(true);
    setCurrentDepth(clampDepth(targetDepth));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleExploreOrganismDepthRange = useCallback(
    (org: MarineOrganismData) => {
      setIsAutoDescending(false);
      setIsDivingStarted(true);
      setSelectedOrganism(org);
      setCurrentDepth(clampDepth(org.characteristicDepth));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const handleReturnToSurface = useCallback(() => {
    setIsAutoDescending(false);
    setCurrentDepth(0);
    setIsDivingStarted(false);
    setSelectedOrganism(null);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    const stage = explorerStageRef.current;
    if (!stage) return;
    if (!document.fullscreenElement) {
      stage.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard arrow depth adjustments when focus is not inside an input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === 'ArrowDown') {
        setIsDivingStarted(true);
        setCurrentDepth((prev) => clampDepth(prev + (prev < 200 ? 15 : 100)));
      } else if (e.key === 'ArrowUp') {
        setCurrentDepth((prev) => clampDepth(prev - (prev <= 200 ? 15 : 100)));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mouse-wheel depth control inside the 3D explorer when diving is active
  useEffect(() => {
    const stage = explorerStageRef.current;
    if (!stage) return;

    const handleWheel = (e: WheelEvent) => {
      if (!isDivingStarted || window.scrollY > 40) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest('aside')) return;
      if (e.shiftKey) return;
      if (e.deltaY > 0 && currentDepth >= MAX_OCEAN_DEPTH) return;

      e.preventDefault();
      setIsAutoDescending(false);
      const stepFactor =
        currentDepth < 200 ? 0.25 : currentDepth < 1000 ? 0.9 : 2.5;
      const nextDepth = clampDepth(currentDepth + e.deltaY * stepFactor);
      setCurrentDepth(nextDepth);
    };

    stage.addEventListener('wheel', handleWheel, { passive: false });
    return () => stage.removeEventListener('wheel', handleWheel);
  }, [isDivingStarted, currentDepth]);

  return (
    <div id="home" className="min-h-screen bg-[#030711] text-slate-100">
      {/* Top Bar Navigation */}
      <Navigation
        onStartDiving={handleStartDiving}
        onNavigateSection={scrollToSection}
      />

      {/* Main Content Stage */}
      <main>
        {/* Full-Screen 3D Ocean Surface & Depth Explorer Viewport */}
        <section
          id="dive-explorer"
          ref={explorerStageRef}
          aria-label="3D Interactive Ocean Depth Explorer"
          className="relative w-full h-screen min-h-[680px] overflow-hidden bg-[#041226]"
        >
          {/* Real Interactive 3D Underwater Environment */}
          <OceanScene
            currentDepth={currentDepth}
            selectedOrganism={selectedOrganism}
            onSelectOrganism={(org) => {
              setIsAutoDescending(false);
              setSelectedOrganism(org);
            }}
            onSelectDepth={handleChangeDepth}
          />

          {/* Hero Surface Overlay (Fades out smoothly when diving starts) */}
          <OceanHero
            isDivingStarted={isDivingStarted}
            currentDepth={currentDepth}
            onStartDiving={handleStartDiving}
            onExploreSections={() => scrollToSection('ocean-zones')}
          />

          {/* Live Depth Scientific Instrument Panel & Collapsible Bottom Control Dock */}
          <DepthExplorerHUD
            currentDepth={currentDepth}
            isAutoDescending={isAutoDescending}
            descentSpeed={descentSpeed}
            isFullscreen={isFullscreen}
            selectedOrganism={selectedOrganism}
            onChangeDepth={(d) => {
              setIsAutoDescending(false);
              handleChangeDepth(d);
            }}
            onToggleAutoDescent={() => {
              setIsDivingStarted(true);
              setIsAutoDescending((prev) => !prev);
            }}
            onChangeDescentSpeed={(spd) => setDescentSpeed(spd)}
            onReturnToSurface={handleReturnToSurface}
            onToggleFullscreen={handleToggleFullscreen}
            onSelectOrganism={(org) => {
              setIsAutoDescending(false);
              setSelectedOrganism(org);
            }}
          />

          {/* Interactive Species Discovery Info Panel */}
          <SpeciesInfoPanel
            organism={selectedOrganism}
            onClose={() => setSelectedOrganism(null)}
            onExploreDepthRange={handleExploreOrganismDepthRange}
          />
        </section>

        {/* True-Scale Proportional Depth Comparison Visualization */}
        <DepthComparison
          currentDepth={currentDepth}
          onSelectDepth={handleJumpToDepthFromSection}
        />

        {/* Section: Ocean Zones */}
        <OceanZonesSection
          onDiveToDepth={handleJumpToDepthFromSection}
          onSelectOrganism={(org) => {
            setSelectedOrganism(org);
            handleExploreOrganismDepthRange(org);
          }}
        />

        {/* Section: Marine Life Database */}
        <MarineLifeSection
          selectedOrganism={selectedOrganism}
          onInspectOrganism={(org) => {
            setSelectedOrganism(org);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onExploreOrganismIn3D={handleExploreOrganismDepthRange}
        />

        {/* Section: Deepest Places on Earth */}
        <DeepestPlacesSection onDiveToDepth={handleJumpToDepthFromSection} />

        {/* Sections: Ocean Facts & Discoveries */}
        <OceanFactsAndUnknownSection
          onDiveToDepth={handleJumpToDepthFromSection}
        />

        {/* Section: Global Ocean Exploration Map */}
        <OceanExplorationMapSection
          onDiveToDepth={handleJumpToDepthFromSection}
        />

        {/* Section: Deep-Ocean Research and Conservation */}
        <ResearchConservationSection
          onDiveToDepth={handleJumpToDepthFromSection}
        />

        {/* Clean Editorial Footer */}
        <footer className="py-12 px-6 bg-[#02050c] border-t border-slate-800/80 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-display font-bold text-white tracking-wider">
                THALASSA
              </span>
              <span aria-hidden="true">·</span>
              <span>Interactive 3D Bathymetric &amp; Marine Biology Explorer</span>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <a
                href="#dive-explorer"
                onClick={(e) => {
                  e.preventDefault();
                  handleJumpToDepthFromSection(0);
                }}
                className="hover:text-cyan-300 transition-colors"
              >
                Return to Ocean Surface (0 m)
              </a>
              <span aria-hidden="true">·</span>
              <a
                href="#exploration-map"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('exploration-map');
                }}
                className="hover:text-cyan-300 transition-colors"
              >
                Exploration Map
              </a>
              <span aria-hidden="true">·</span>
              <a
                href="#research-conservation"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('research-conservation');
                }}
                className="hover:text-cyan-300 transition-colors"
              >
                Research &amp; Conservation
              </a>
              <span aria-hidden="true">·</span>
              <a
                href="#dive-explorer"
                onClick={(e) => {
                  e.preventDefault();
                  handleJumpToDepthFromSection(10935);
                }}
                className="hover:text-cyan-300 transition-colors"
              >
                Jump to Challenger Deep (10,935 m)
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
