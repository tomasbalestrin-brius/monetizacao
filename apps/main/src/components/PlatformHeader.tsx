import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';

interface PlatformHeaderProps {
  onMenuClick: () => void;
}

const routeTitles: Record<string, string> = {
  '/': 'Inicio',
  '/monetizacao': 'Monetizacao',
  '/sdr': 'Bethel SDR',
};

function getTitle(pathname: string): string {
  if (pathname === '/') return routeTitles['/'];
  for (const [path, title] of Object.entries(routeTitles)) {
    if (path !== '/' && pathname.startsWith(path)) return title;
  }
  return 'Bethel Platform';
}

export function PlatformHeader({ onMenuClick }: PlatformHeaderProps) {
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center h-14 px-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-accent mr-2"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
    </header>
  );
}
