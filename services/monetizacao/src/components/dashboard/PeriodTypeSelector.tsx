import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PeriodType = 'day' | 'week' | 'month';

interface PeriodTypeSelectorProps {
  value: PeriodType;
  onChange: (value: PeriodType) => void;
}

const periodOptions = [
  { 
    value: 'day' as const, 
    label: 'Dia', 
    icon: Calendar,
    activeClass: 'data-[state=on]:bg-blue-500/20 data-[state=on]:text-blue-400 data-[state=on]:border-blue-500/50',
    iconColor: 'text-blue-400'
  },
  { 
    value: 'week' as const, 
    label: 'Semana', 
    icon: CalendarDays,
    activeClass: 'data-[state=on]:bg-purple-500/20 data-[state=on]:text-purple-400 data-[state=on]:border-purple-500/50',
    iconColor: 'text-purple-400'
  },
  { 
    value: 'month' as const, 
    label: 'Mês', 
    icon: CalendarRange,
    activeClass: 'data-[state=on]:bg-emerald-500/20 data-[state=on]:text-emerald-400 data-[state=on]:border-emerald-500/50',
    iconColor: 'text-emerald-400'
  },
];

export function PeriodTypeSelector({ value, onChange }: PeriodTypeSelectorProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => val && onChange(val as PeriodType)}
      className="justify-start bg-muted/30 p-1 rounded-lg border border-border/50"
    >
      {periodOptions.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.value;
        
        return (
          <ToggleGroupItem 
            key={option.value}
            value={option.value} 
            aria-label={option.label} 
            className={cn(
              "gap-2 px-4 py-2 rounded-md border border-transparent transition-all duration-200",
              "hover:bg-muted/50",
              option.activeClass
            )}
          >
            <Icon 
              size={16} 
              className={cn(
                "transition-colors",
                isActive ? option.iconColor : "text-muted-foreground"
              )} 
            />
            <span className="font-medium">{option.label}</span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
