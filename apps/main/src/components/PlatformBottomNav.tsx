import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, TrendingUp } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Início', icon: LayoutDashboard, path: '/' },
  { id: 'monetizacao', label: 'Monetização', icon: TrendingUp, path: '/monetizacao' },
  // Future: { id: 'crm', label: 'CRM', icon: Users, path: '/crm' },
];

export function PlatformBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleTap = (path: string) => {
    if (navigator.vibrate) navigator.vibrate(10);
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => handleTap(item.path)}
              className={`
                flex flex-col items-center justify-center gap-0.5 flex-1 h-full
                transition-colors touch-manipulation
                ${active ? 'text-primary' : 'text-muted-foreground'}
              `}
            >
              <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
