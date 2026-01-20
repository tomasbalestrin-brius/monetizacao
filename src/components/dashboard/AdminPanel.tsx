import React, { useState } from 'react';
import { Trash2, Loader2, Plus, Settings, Database, Users } from 'lucide-react';
import { useUsers, useAssignRole, useTogglePermission, useDeleteUser } from '@/hooks/useUserManagement';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetricsTable } from './MetricsTable';
import { CreateUserDialog } from './CreateUserDialog';
import { GoogleSheetsConfig } from './GoogleSheetsConfig';

const MODULES = ['dashboard', 'eagles', 'alcateia', 'sharks', 'sdrs', 'reports', 'admin'];

export function AdminPanel() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsers();
  const assignRole = useAssignRole();
  const togglePermission = useTogglePermission();
  const deleteUser = useDeleteUser();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
        <p className="text-muted-foreground">Gerencie integrações, métricas e usuários do sistema</p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
          <TabsTrigger value="integrations" className="data-[state=active]:bg-background gap-2 px-4 py-2">
            <Settings className="h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="metrics" className="data-[state=active]:bg-background gap-2 px-4 py-2">
            <Database className="h-4 w-4" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-background gap-2 px-4 py-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
        </TabsList>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="grid gap-6">
            <GoogleSheetsConfig />

            {/* Placeholder for future integrations */}
            <div className="border border-dashed border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground text-sm">
                Mais integrações em breve (CRM, Webhooks, etc.)
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <MetricsTable />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Usuários Cadastrados</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {users?.length || 0} usuários no sistema
                  </p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Usuário
                </Button>
              </div>

              <div className="space-y-4">
                {users?.map((user) => {
                  const isCurrentUser = user.id === currentUser?.id;
                  
                  return (
                    <div key={user.id} className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <p className="text-foreground font-semibold text-lg">{user.email}</p>
                          <div className="flex items-center gap-4 mt-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-xs">Função:</span>
                              <Select
                                value={user.role || 'viewer'}
                                onValueChange={(value) => assignRole.mutate({ userId: user.id, role: value as any })}
                                disabled={isCurrentUser}
                              >
                                <SelectTrigger className="w-32 bg-background border-border text-foreground text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="manager">Gerente</SelectItem>
                                  <SelectItem value="viewer">Visualizador</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <p className="text-muted-foreground text-sm">
                              Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        {!isCurrentUser && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteUser.mutate(user.id)}
                            disabled={deleteUser.isPending}
                          >
                            <Trash2 size={16} className="mr-1" />
                            Remover
                          </Button>
                        )}
                      </div>
                      <div>
                        <p className="text-foreground text-sm mb-2 font-medium">Permissões de Acesso:</p>
                        <div className="flex flex-wrap gap-2">
                          {MODULES.map((module) => {
                            const hasPermission = user.permissions.includes(module) || user.role === 'admin';
                            return (
                              <button
                                key={module}
                                onClick={() => !isCurrentUser && togglePermission.mutate({ 
                                  userId: user.id, 
                                  module, 
                                  hasPermission: user.permissions.includes(module) 
                                })}
                                disabled={isCurrentUser || user.role === 'admin'}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  hasPermission
                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                } ${(isCurrentUser || user.role === 'admin') ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                              >
                                {module}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 bg-muted/30 rounded-lg p-4 border border-border">
                <p className="text-muted-foreground text-sm">
                  💡 <strong>Dica:</strong> Use o botão "Novo Usuário" para criar usuários diretamente, 
                  ou eles podem se cadastrar na página de login.
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateUserDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />
    </div>
  );
}
