import React from 'react';
import { LayoutDashboard, Phone, Users, User, Calendar, Kanban, Clock } from 'lucide-react';
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
  { id: 'crm' as ModuleId, label: 'CRM', icon: Kanban },
  { id: 'sdrs' as ModuleId, label: 'SDRs', icon: Phone },
  { id: 'eagles' as ModuleId, label: 'Squads', icon: Users },
];

// Closer sees Agenda + Disponibilidade
const closerNavItems = [
  { id: 'agenda' as ModuleId, label: 'Agenda', icon: Calendar },
  { id: 'availability' as ModuleId, label: 'Horarios', icon: Clock },
];

export function BottomNavigation({ activeModule, onModuleChange }: BottomNavigationProps) {
  const { isCloser } = useAuth();
  const navItems = isCloser ? closerNavItems : allNavItems;
  const handleClick = (moduleId: ModuleId) => {
    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    onModuleChange(moduleId);
  };

  // Check if current module is a squad page
  const isSquadActive = ['eagles', 'sharks'].includes(activeModule);
  const getActiveState = (itemId: ModuleId) => {
    if (itemId === 'eagles' && isSquadActive) return true;
    return activeModule === itemId;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/80 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = getActiveState(item.id);
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
