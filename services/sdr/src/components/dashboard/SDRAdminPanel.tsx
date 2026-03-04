import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSDRs } from '@/hooks/useSdrMetrics';
import { useCrmColumns } from '@/hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Users, Kanban, Shield } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export function SDRAdminPanel() {
  const { isAdmin } = useAuth();
  const { data: sdrs, isLoading: loadingSDRs } = useSDRs();
  const { data: columns, isLoading: loadingColumns } = useCrmColumns();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium text-foreground">Acesso Restrito</p>
          <p className="text-muted-foreground">Apenas administradores podem acessar este painel.</p>
        </div>
      </div>
    );
  }

  if (loadingSDRs || loadingColumns) {
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
          <Settings size={24} />
          Painel Admin SDR
        </h1>
        <p className="text-muted-foreground mt-1">Gerencie o sistema de SDR</p>
      </div>

      <Tabs defaultValue="sdrs">
        <TabsList>
          <TabsTrigger value="sdrs" className="gap-2">
            <Users size={16} />
            SDRs
          </TabsTrigger>
          <TabsTrigger value="crm" className="gap-2">
            <Kanban size={16} />
            Colunas CRM
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sdrs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} />
                SDRs Cadastrados ({sdrs?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sdrs && sdrs.length > 0 ? (
                <div className="space-y-3">
                  {sdrs.map((sdr: any) => (
                    <div key={sdr.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <span className="font-bold text-emerald-600">{sdr.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium">{sdr.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Criado em {new Date(sdr.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={sdr.type === 'social_selling' ? 'secondary' : 'default'}>
                        {sdr.type === 'social_selling' ? 'Social Selling' : 'SDR'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">Nenhum SDR cadastrado.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crm" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Kanban size={20} />
                Colunas do Kanban ({columns?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {columns && columns.length > 0 ? (
                <div className="space-y-2">
                  {columns.map((col: any) => (
                    <div key={col.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: col.color || '#6b7280' }}
                        />
                        <span className="font-medium">{col.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Posição: {col.position}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">Nenhuma coluna configurada.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
