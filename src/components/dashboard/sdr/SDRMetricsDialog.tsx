import React from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { SDRMetricsForm, type SDRMetricsFormValues } from './SDRMetricsForm';
import { useCreateSDRMetric } from '@/hooks/useSdrMetrics';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SDRMetricsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sdrType: 'sdr' | 'social_selling';
  defaultSdrId?: string;
}

export function SDRMetricsDialog({
  open,
  onOpenChange,
  sdrType,
  defaultSdrId,
}: SDRMetricsDialogProps) {
  const createMetric = useCreateSDRMetric();

  const handleSubmit = async (values: SDRMetricsFormValues) => {
    try {
      await createMetric.mutateAsync({
        sdr_id: values.sdr_id,
        date: format(values.date, 'yyyy-MM-dd'),
        funnel: values.funnel || null,
        activated: values.activated,
        scheduled: values.scheduled,
        scheduled_same_day: values.scheduled_same_day,
        attended: values.attended,
        sales: values.sales,
        source: 'manual',
      });

      toast.success('Métrica adicionada com sucesso!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating SDR metric:', error);
      toast.error('Erro ao adicionar métrica');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nova Métrica {sdrType === 'sdr' ? 'SDR' : 'Social Selling'}
          </DialogTitle>
          <DialogDescription>
            Adicione métricas manualmente para um {sdrType === 'sdr' ? 'SDR' : 'Social Selling'}.
          </DialogDescription>
        </DialogHeader>

        <SDRMetricsForm
          sdrType={sdrType}
          defaultSdrId={defaultSdrId}
          onSubmit={handleSubmit}
          isLoading={createMetric.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
