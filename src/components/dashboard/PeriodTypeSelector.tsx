import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';

export type PeriodType = 'day' | 'week' | 'month';

interface PeriodTypeSelectorProps {
  value: PeriodType;
  onChange: (value: PeriodType) => void;
}

export function PeriodTypeSelector({ value, onChange }: PeriodTypeSelectorProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => val && onChange(val as PeriodType)}
      className="justify-start"
    >
      <ToggleGroupItem value="day" aria-label="Dia" className="gap-2">
        <Calendar size={16} />
        Dia
      </ToggleGroupItem>
      <ToggleGroupItem value="week" aria-label="Semana" className="gap-2">
        <CalendarDays size={16} />
        Semana
      </ToggleGroupItem>
      <ToggleGroupItem value="month" aria-label="Mês" className="gap-2">
        <CalendarRange size={16} />
        Mês
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
