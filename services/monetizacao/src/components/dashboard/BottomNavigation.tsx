import { LayoutDashboard, Calendar, FileText, Clock, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ModuleId } from './Sidebar';

interface BottomNavigationProps {
  activeModule: ModuleId;
  onModuleChange: (module: ModuleId) => void;
}

const allNavItems = [
  { id: 'dashboard' as ModuleId, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'agenda' as ModuleId, label: 'Agenda', icon: Calendar },
  { id: 'reports' as ModuleId, label: 'Relatórios', icon: FileText },
  { id: 'availability' as ModuleId, label: 'Horários', icon: Clock },
];

// Closer sees Agenda + Disponibilidade
const closerNavItems = [
  { id: 'agenda' as ModuleId, label: 'Agenda', icon: Calendar },
  { id: 'availability' as ModuleId, label: 'Horários', icon: Clock },
];

export function BottomNavigation({ activeModule, onModuleChange }: BottomNavigationProps) {
  const { isCloser } = useAuth();
  const navItems = isCloser ? closerNavItems : allNavItems;

  const handleClick = (moduleId: ModuleId) => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    onModuleChange(moduleId);
  };

  const handleBackToHome = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    window.location.href = '/';
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/80 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {/* Back to platform button */}
        <button
          onClick={handleBackToHome}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 active:scale-95 touch-manipulation text-muted-foreground hover:text-foreground"
        >
          <div className="p-1.5 rounded-xl transition-all duration-200">
            <Home size={22} strokeWidth={2} />
          </div>
          <span className="text-[10px] font-medium">Início</span>
        </button>

        {navItems.map((item) => {
          const isActive = activeModule === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200",
                "active:scale-95 touch-manipulation",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all duration-200",
                  isActive && "bg-primary/10"
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
