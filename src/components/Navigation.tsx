import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavigationProps {
  onStartDiving: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  onStartDiving,
  onNavigateSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dive Explorer', id: 'dive-explorer' },
    { label: 'Ocean Zones', id: 'ocean-zones' },
    { label: 'Marine Life', id: 'marine-life' },
    { label: 'Deepest Places', id: 'deepest-places' },
    { label: 'Discoveries', id: 'discoveries' },
    { label: 'Exploration Map', id: 'exploration-map' },
    { label: 'Conservation', id: 'research-conservation' },
  ];

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigateSection(id);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#030812]/95 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-5 py-3">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#home"
          onClick={(e) => handleNavClick(e, 'home')}
          className="font-display text-lg font-bold tracking-wider text-white whitespace-nowrap shrink-0 hover:text-cyan-300 transition-colors"
        >
          THALASSA
        </a>

        {/* Zone 2: Concise single-line text navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-5 text-xs xl:text-sm font-medium text-slate-300"
        >
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleNavClick(e, item.id)}
              className="hover:text-white hover:underline underline-offset-8 decoration-cyan-400 transition-colors whitespace-nowrap shrink-0"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onStartDiving();
            }}
            className="px-3.5 py-1.5 text-xs font-semibold tracking-wider text-slate-950 bg-cyan-400 rounded-md hover:bg-cyan-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            START DIVING
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 text-slate-300 hover:text-white rounded-md border border-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive mobile/tablet drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden bg-[#040a17] border-b border-slate-800 px-6 py-4 flex flex-col gap-2.5"
        >
          <a
            href="#home"
            onClick={(e) => handleNavClick(e, 'home')}
            className="py-1.5 text-sm font-medium text-slate-200 hover:text-cyan-300"
          >
            Home
          </a>
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleNavClick(e, item.id)}
              className="py-1.5 text-sm font-medium text-slate-200 hover:text-cyan-300"
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
};
