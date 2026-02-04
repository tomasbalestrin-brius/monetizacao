import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSDRs, type SDRMetric } from '@/hooks/useSdrMetrics';

const sdrMetricsSchema = z.object({
  sdr_id: z.string().min(1, 'Selecione um SDR'),
  date: z.date({ required_error: 'Selecione uma data' }),
  funnel: z.string().optional(),
  activated: z.coerce.number().int().min(0),
  scheduled: z.coerce.number().int().min(0),
  scheduled_same_day: z.coerce.number().int().min(0),
  attended: z.coerce.number().int().min(0),
  sales: z.coerce.number().int().min(0),
});

export type SDRMetricsFormValues = z.infer<typeof sdrMetricsSchema>;

interface SDRMetricsFormProps {
  sdrType: 'sdr' | 'social_selling';
  defaultSdrId?: string;
  defaultMetric?: SDRMetric;
  onSubmit: (values: SDRMetricsFormValues) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function SDRMetricsForm({
  sdrType,
  defaultSdrId,
  defaultMetric,
  onSubmit,
  isLoading,
  submitLabel = 'Adicionar Métrica',
}: SDRMetricsFormProps) {
  const { data: sdrs } = useSDRs(sdrType);

  const form = useForm<SDRMetricsFormValues>({
    resolver: zodResolver(sdrMetricsSchema),
    defaultValues: {
      sdr_id: defaultMetric?.sdr_id || defaultSdrId || '',
      date: defaultMetric ? new Date(defaultMetric.date) : new Date(),
      funnel: defaultMetric?.funnel || '',
      activated: defaultMetric?.activated ?? 0,
      scheduled: defaultMetric?.scheduled ?? 0,
      scheduled_same_day: defaultMetric?.scheduled_same_day ?? 0,
      attended: defaultMetric?.attended ?? 0,
      sales: defaultMetric?.sales ?? 0,
    },
  });

  const handleSubmit = async (values: SDRMetricsFormValues) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* SDR Selector */}
        <FormField
          control={form.control}
          name="sdr_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{sdrType === 'sdr' ? 'SDR' : 'Social Selling'}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={`Selecione um ${sdrType === 'sdr' ? 'SDR' : 'Social Selling'}`} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sdrs?.map((sdr) => (
                    <SelectItem key={sdr.id} value={sdr.id}>
                      {sdr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date Selector */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value
                        ? format(field.value, "dd 'de' MMMM, yyyy", { locale: ptBR })
                        : 'Selecione uma data'}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    locale={ptBR}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Funnel (optional) */}
        <FormField
          control={form.control}
          name="funnel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Funil (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Funil Principal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Divider */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-4">Métricas de Desempenho</h4>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="activated"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ativados</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="scheduled"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agendados</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="scheduled_same_day"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agend. no dia</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="attended"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Realizados</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sales"
            render={({ field }) => (
              <FormItem className="col-span-2 sm:col-span-1">
                <FormLabel>Vendas</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Salvando...' : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
