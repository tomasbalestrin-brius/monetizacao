
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MonthSelectorProps {
  selectedMonth: Date;
  onMonthChange: (month: Date) => void;
  className?: string;
}

export function MonthSelector({ selectedMonth, onMonthChange, className }: MonthSelectorProps) {
  const handlePrevMonth = () => {
    onMonthChange(subMonths(selectedMonth, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(selectedMonth, 1));
  };

  // Don't allow navigating to future months
  const isCurrentMonth = format(selectedMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  return (
    <div className={`flex items-center gap-1 ${className || ''}`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevMonth}
        className="h-8 w-8"
      >
        <ChevronLeft size={18} />
      </Button>
      
      <span className="min-w-[140px] text-center font-medium text-foreground capitalize">
        {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
      </span>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextMonth}
        disabled={isCurrentMonth}
        className="h-8 w-8"
      >
        <ChevronRight size={18} />
      </Button>
    </div>
  );
}

// Helper to get period boundaries from a month
export function getMonthPeriod(month: Date) {
  return {
    periodStart: format(startOfMonth(month), 'yyyy-MM-dd'),
    periodEnd: format(endOfMonth(month), 'yyyy-MM-dd'),
  };
}
