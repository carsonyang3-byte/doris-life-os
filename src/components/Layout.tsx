import type { PageType } from '../types';

const NAV_ITEMS: { page: PageType; label: string }[] = [
  { page: 'dashboard', label: 'Dashboard' },
  { page: 'reflect', label: 'Reflect' },
  { page: 'goals', label: 'Goals' },
  { page: 'library', label: 'Library' },
  { page: 'journal', label: 'Journal' },
  { page: 'travel', label: 'Travel' },
  { page: 'money', label: 'Money' },
];

interface LayoutProps {
  activePage: PageType;
  onPageChange: (page: PageType) => void;
  children: React.ReactNode;
}

export default function Layout({ activePage, onPageChange, children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Banner */}
      <div className="relative h-44 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80"
          alt="banner"
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.55) saturate(0.7)' }}
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 40%, rgba(247,246,243,0.6) 75%, #F7F6F3 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 max-w-[1100px] mx-auto px-6 pb-6">
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', 'Noto Serif SC', Georgia, serif",
              fontSize: '28px',
              fontWeight: 300,
              color: 'rgba(255, 248, 230, 0.92)',
              letterSpacing: '0.08em',
              textShadow: '0 1px 8px rgba(0,0,0,0.15)',
            }}
          >
            Doris' Life OS
          </h1>
          <div style={{ width: '32px', height: '1.5px', background: 'rgba(201, 169, 110, 0.7)', marginTop: '6px', marginBottom: '4px', borderRadius: '1px' }} />
          <p
            style={{
              fontSize: '12px',
              color: 'rgba(255, 245, 220, 0.75)',
              letterSpacing: '0.12em',
              fontFamily: "'Inter', sans-serif",
              textShadow: '0 1px 6px rgba(0,0,0,0.2)',
            }}
            id="heroDateText"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-[1100px] mx-auto w-full px-6 border-b border-[var(--border)] flex gap-1">
        {NAV_ITEMS.map(({ page, label }) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`text-[12px] font-medium py-3 px-4 relative transition-colors duration-200 tracking-wide bg-transparent border-none cursor-pointer ${
              activePage === page
                ? 'text-[var(--accent-dark)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {label}
            {activePage === page && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[var(--accent)] rounded-sm" />
            )}
          </button>
        ))}
      </div>

      {/* Page Content */}
      <main className="flex-1 max-w-[1100px] mx-auto w-full px-6 py-5 flex flex-col gap-5">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-6">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between px-6 py-3.5">
          <span className="text-[10px] text-[rgba(160,160,160,0.6)]">Doris' Life OS</span>
          <span className="text-[10px] text-[rgba(160,160,160,0.6)]">Data stored locally</span>
        </div>
      </footer>
    </div>
  );
}
