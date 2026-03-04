import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@bethel/shared-auth';
import { useTheme } from '@bethel/shared-theme';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  LogOut,
  X,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';

interface ServiceItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  description: string;
  // Roles that can see this service. Empty = all authenticated users.
  allowedRoles?: string[];
}

const services: ServiceItem[] = [
  {
    id: 'home',
    label: 'Inicio',
    icon: LayoutDashboard,
    path: '/',
    description: 'Visao geral da plataforma',
  },
  {
    id: 'monetizacao',
    label: 'Monetizacao',
    icon: TrendingUp,
    path: '/monetizacao',
    description: 'Agenda, metricas e performance',
    allowedRoles: ['admin', 'lider', 'closer'],
  },
  {
    id: 'sdr',
    label: 'Bethel SDR',
    icon: Users,
    path: '/sdr',
    description: 'CRM, leads e agendamentos',
    allowedRoles: ['admin', 'lider', 'sdr'],
  },
];

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  lider: 'Lider',
  sdr: 'SDR',
  closer: 'Closer',
};

interface PlatformSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlatformSidebar({ isOpen, onClose }: PlatformSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user, role } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const visibleServices = services.filter((service) => {
    if (!service.allowedRoles) return true;
    if (!role) return false;
    return service.allowedRoles.includes(role);
  });

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Bethel" className="w-8 h-8 object-contain" />
              <div>
                <h1 className="font-bold text-foreground text-sm">Bethel Platform</h1>
                <p className="text-[10px] text-muted-foreground">Sistema de Gestao</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded hover:bg-accent"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Services Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <p className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Servicos
            </p>
            {visibleServices.map((service) => {
              const Icon = service.icon;
              const active = isActive(service.path);
              return (
                <button
                  key={service.id}
                  onClick={() => handleNavigate(service.path)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                    transition-colors group
                    ${active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="flex-1 text-left">
                    <span className="font-medium">{service.label}</span>
                  </div>
                  <ChevronRight
                    className={`h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity
                      ${active ? 'opacity-100' : ''}
                    `}
                  />
                </button>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary text-xs font-semibold">
                  {user?.email?.charAt(0).toUpperCase() ?? 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {user?.email ?? 'Usuario'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {role ? (roleLabels[role] ?? role) : 'Carregando...'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
