import { useState } from 'react';
import { X, CheckCircle, XCircle, DollarSign, Loader2 } from 'lucide-react';
import { useRegisterCallResult } from '@/hooks/useAppointments';
import { toast } from 'sonner';
import type { AppointmentWithLead } from '@/hooks/useAppointments';

interface CallResultModalProps {
  appointment: AppointmentWithLead;
  onClose: () => void;
}

export function CallResultModal({ appointment, onClose }: CallResultModalProps) {
  const [attended, setAttended] = useState<boolean | null>(null);
  const [converted, setConverted] = useState<boolean | null>(null);
  const [conversionValue, setConversionValue] = useState('');
  const [notes, setNotes] = useState('');

  const registerResult = useRegisterCallResult();

  const handleSubmit = async () => {
    if (attended === null) {
      toast.error('Selecione se o lead compareceu ou nao');
      return;
    }

    try {
      await registerResult.mutateAsync({
        appointmentId: appointment.id,
        attended,
        converted: attended ? (converted ?? false) : undefined,
        conversionValue: attended && converted && conversionValue
          ? parseFloat(conversionValue.replace(/\./g, '').replace(',', '.'))
          : undefined,
        notes: notes || undefined,
      });

      toast.success(attended ? 'Resultado registrado com sucesso!' : 'Registrado como nao compareceu');
      onClose();
    } catch (err) {
      toast.error('Erro ao registrar resultado: ' + (err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Registrar Resultado</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Lead info */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="font-medium text-foreground">{appointment.lead?.full_name ?? 'Lead'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(appointment.scheduled_date).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>

          {/* Step 1: Did the lead attend? */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">O lead compareceu?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setAttended(true); setConverted(null); }}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                  ${attended === true
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-border hover:border-green-300'
                  }
                `}
              >
                <CheckCircle className={`h-8 w-8 ${attended === true ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">Sim, compareceu</span>
              </button>
              <button
                onClick={() => { setAttended(false); setConverted(null); }}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                  ${attended === false
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-border hover:border-red-300'
                  }
                `}
              >
                <XCircle className={`h-8 w-8 ${attended === false ? 'text-red-500' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">Nao compareceu</span>
              </button>
            </div>
          </div>

          {/* Step 2: Conversion (only if attended) */}
          {attended === true && (
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Houve venda?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setConverted(true)}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                    ${converted === true
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-border hover:border-green-300'
                    }
                  `}
                >
                  <DollarSign className={`h-8 w-8 ${converted === true ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium">Sim, vendeu!</span>
                </button>
                <button
                  onClick={() => setConverted(false)}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                    ${converted === false
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-border hover:border-orange-300'
                    }
                  `}
                >
                  <XCircle className={`h-8 w-8 ${converted === false ? 'text-orange-500' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium">Nao vendeu</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Conversion value (only if converted) */}
          {attended === true && converted === true && (
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Valor da venda (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                <input
                  type="text"
                  value={conversionValue}
                  onChange={(e) => setConversionValue(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Observacoes (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotacoes sobre a call..."
              rows={3}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={attended === null || registerResult.isPending}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {registerResult.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              'Confirmar Resultado'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
