import React, { useState } from 'react';
import { useAuth } from '@bethel/shared-auth';
import { getSupabaseClient } from '@bethel/shared-supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Users,
  Settings,
  Loader2,
  TrendingUp,
  UserCheck,
} from 'lucide-react';

type AppRole = 'admin' | 'manager' | 'viewer' | 'user' | 'lider' | 'sdr' | 'closer';

interface UserWithRole {
  id: string;
  email: string;
  role: AppRole | null;
  created_at: string;
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  lider: 'Lider',
  manager: 'Gerente',
  sdr: 'SDR',
  closer: 'Closer',
  user: 'Closer (legado)',
  viewer: 'Visualizador',
};

const serviceAccess: Record<string, { label: string; icon: React.ElementType; color: string; roles: string[] }> = {
  monetizacao: {
    label: 'Monetizacao',
    icon: TrendingUp,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    roles: ['admin', 'lider', 'closer', 'manager', 'user'],
  },
  sdr: {
    label: 'Bethel SDR',
    icon: UserCheck,
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    roles: ['admin', 'lider', 'sdr'],
  },
};

function useAllUsers() {
  return useQuery({
    queryKey: ['master-admin-users'],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      // Fetch all profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch all roles
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      if (roleError) throw roleError;

      const roleMap = new Map<string, AppRole>();
      roles?.forEach((r) => roleMap.set(r.user_id, r.role as AppRole));

      return (profiles ?? []).map((p) => ({
        id: p.id,
        email: p.email,
        role: roleMap.get(p.id) ?? null,
        created_at: p.created_at,
      })) as UserWithRole[];
    },
  });
}

function useAssignRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const supabase = getSupabaseClient();
      // Upsert role
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-admin-users'] });
    },
  });
}

export function MasterAdminPage() {
  const { isAdmin, role } = useAuth();
  const { data: users, isLoading } = useAllUsers();
  const assignRole = useAssignRole();

  if (!isAdmin) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium text-foreground">Acesso Restrito</p>
          <p className="text-muted-foreground">Apenas administradores podem acessar este painel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Painel Admin Mestre
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie o acesso dos usuarios entre servicos da plataforma
        </p>
      </div>

      {/* Service overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(serviceAccess).map(([key, svc]) => {
          const Icon = svc.icon;
          const count = users?.filter(u => u.role && svc.roles.includes(u.role)).length ?? 0;
          return (
            <div key={key} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${svc.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{svc.label}</h3>
                  <p className="text-xs text-muted-foreground">
                    {count} {count === 1 ? 'usuario com acesso' : 'usuarios com acesso'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {svc.roles.map((r) => (
                  <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {roleLabels[r] ?? r}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Users management */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuarios da Plataforma
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {users?.length ?? 0} usuarios cadastrados. Altere a funcao para controlar o acesso entre servicos.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {users?.map((user) => {
              const userServices = Object.entries(serviceAccess)
                .filter(([_, svc]) => user.role && svc.roles.includes(user.role))
                .map(([key]) => key);

              return (
                <div key={user.id} className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Criado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    {/* Role selector */}
                    <div className="flex items-center gap-3">
                      <select
                        value={user.role ?? ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            assignRole.mutate({ userId: user.id, role: e.target.value as AppRole });
                          }
                        }}
                        className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm"
                      >
                        <option value="" disabled>Sem funcao</option>
                        <option value="admin">Administrador</option>
                        <option value="lider">Lider</option>
                        <option value="closer">Closer</option>
                        <option value="sdr">SDR</option>
                      </select>
                    </div>
                  </div>

                  {/* Service access badges */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">Acesso:</span>
                    {userServices.length > 0 ? (
                      userServices.map((svcKey) => {
                        const svc = serviceAccess[svcKey];
                        return (
                          <span key={svcKey} className={`text-xs px-2 py-0.5 rounded-full ${svc.color}`}>
                            {svc.label}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Nenhum servico</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Como funciona:</strong> A funcao do usuario determina quais servicos ele pode acessar.
          <strong> Administradores</strong> e <strong>Lideres</strong> acessam todos os servicos.
          <strong> Closers</strong> acessam apenas a Monetizacao.
          <strong> SDRs</strong> acessam apenas o Bethel SDR.
        </p>
      </div>
    </div>
  );
}
