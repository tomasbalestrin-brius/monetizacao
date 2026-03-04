import React, { useState } from 'react';
import { useSDRs } from '@/hooks/useSdrMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Users, TrendingUp } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export function SDRGoalsPage() {
  const { data: sdrs, isLoading } = useSDRs();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Target size={24} />
          Metas SDR
        </h1>
        <p className="text-muted-foreground mt-1">Acompanhe as metas individuais e do time</p>
      </div>

      {/* Team Goal */}
      <Card className="border-emerald-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            Meta do Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Configuração de metas</p>
            <p className="text-sm mt-1">Configure as metas mensais para o time no Painel Admin.</p>
          </div>
        </CardContent>
      </Card>

      {/* Individual SDR Goals */}
      {sdrs && sdrs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sdrs.map((sdr: any) => (
            <Card key={sdr.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <span className="font-bold text-emerald-600">{sdr.name?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{sdr.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{sdr.type === 'social_selling' ? 'Social Selling' : 'SDR'}</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Ativados</span>
                      <span className="font-medium">-</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Agendados</span>
                      <span className="font-medium">-</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Vendas</span>
                      <span className="font-medium">-</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
