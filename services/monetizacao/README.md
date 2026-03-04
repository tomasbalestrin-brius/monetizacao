# services/monetizacao - Micro-frontend de Monetizacao

Dashboard de performance de vendas da Bethel. Rastreia metricas de **Squads**, **Closers** e **SDRs**, gerencia leads via CRM Kanban, agenda de calls, disponibilidade de closers e limpeza de leads.

## Modos de Execucao

| Modo | Comando | Descricao |
|------|---------|-----------|
| **Standalone** | `npm run dev:monetizacao` | Roda isolado com layout proprio (sidebar + header internos) |
| **Integrado** | Importado pelo sistema mae | Montado em `/monetizacao/*` usando `MonetizacaoRoutes` |

### Exportacoes Principais (`module.tsx`)

```tsx
// Modulo completo (com QueryClient, Toasters, Tooltip)
export function MonetizacaoModule() { ... }

// Apenas as rotas (para embedding no sistema mae)
export function MonetizacaoRoutes() { ... }

// Hooks reutilizaveis
export { useSquads, useClosers, useMetrics, useTotalMetrics } from './hooks/useMetrics';
export { useSDRs, useSDRMetrics } from './hooks/useSdrMetrics';
export { useFunnels } from './hooks/useFunnels';
export { useGoals, useAllGoals } from './hooks/useGoals';
export { useMeetings } from './hooks/useMeetings';
```

## Estrutura de Arquivos

```
services/monetizacao/src/
├── module.tsx                          # Entry point do micro-frontend
├── main.tsx                            # Bootstrap standalone
├── App.tsx                             # Providers standalone
│
├── pages/
│   ├── Index.tsx                       # Roteador de modulos (switch por activeModule)
│   ├── Auth.tsx                        # Login standalone
│   └── NotFound.tsx                    # 404
│
├── contexts/
│   └── AuthContext.tsx                 # Auth com RBAC (admin/manager/viewer/user/lider/closer)
│
├── hooks/
│   ├── useMetrics.ts                   # Metricas de closers + squads
│   ├── useSdrMetrics.ts                # Metricas de SDRs
│   ├── useFunnels.ts                   # Funis de vendas
│   ├── useGoals.ts                     # Metas mensais
│   ├── useAppointments.ts              # Agendamentos + calls
│   ├── useMeetings.ts                  # Reunioes
│   ├── useLeads.ts                     # CRUD de leads + CRM Kanban
│   ├── useNotifications.ts             # Notificacoes realtime
│   ├── useCloserAvailability.ts        # Disponibilidade de closers
│   ├── useLeadCleanup.ts              # Arquivamento/restauracao de leads
│   ├── useUserManagement.ts            # CRUD de usuarios (admin)
│   ├── useUserEntityLinks.ts           # Links usuario <-> closer/SDR
│   ├── useRealtimeMetrics.ts           # Subscricoes Supabase Realtime
│   ├── usePullToRefresh.ts             # Pull-to-refresh mobile
│   ├── useSwipeNavigation.ts           # Swipe entre closers/SDRs
│   └── use-mobile.tsx                  # Deteccao mobile
│
├── components/dashboard/
│   ├── Sidebar.tsx                     # Sidebar interna com modulos
│   ├── Header.tsx                      # Header com NotificationBell
│   ├── BottomNavigation.tsx            # Bottom nav mobile
│   ├── DashboardOverview.tsx           # Dashboard principal
│   ├── SquadPage.tsx                   # Pagina de squad
│   ├── AdminPanel.tsx                  # Painel admin (usuarios, metricas, metas)
│   ├── GoalsConfig.tsx                 # Configuracao de metas
│   ├── UserDashboard.tsx               # Dashboard individual (role user)
│   │
│   ├── agenda/                         # Modulo Agenda
│   │   ├── AgendaPage.tsx              # Lista semanal de calls
│   │   ├── AppointmentCard.tsx         # Card de agendamento
│   │   ├── AppointmentDetailsModal.tsx # Detalhes do agendamento
│   │   └── CallResultModal.tsx         # Registrar resultado de call
│   │
│   ├── crm/                           # Modulo CRM Kanban
│   │   ├── CrmKanbanPage.tsx           # Quadro Kanban com drag-and-drop
│   │   ├── LeadCard.tsx                # Card de lead no kanban
│   │   ├── LeadDetailModal.tsx         # Detalhes do lead + atividades + acoes
│   │   └── CreateLeadModal.tsx         # Formulario de novo lead
│   │
│   ├── notifications/                  # Modulo Notificacoes
│   │   └── NotificationBell.tsx        # Sino com badge + painel dropdown
│   │
│   ├── availability/                   # Modulo Disponibilidade
│   │   └── AvailabilityPage.tsx        # Editor de horarios semanal
│   │
│   ├── cleanup/                        # Modulo Limpeza
│   │   └── CleanupPage.tsx             # Arquivamento em lote + historico
│   │
│   ├── sdr/                            # Dashboard SDR
│   │   └── index.tsx
│   │
│   ├── reports/                        # Relatorios
│   │   └── index.tsx
│   │
│   └── meetings/                       # Reunioes
│       └── index.tsx
│
├── integrations/supabase/
│   ├── client.ts                       # Cliente Supabase
│   └── types.ts                        # Tipos gerados do banco
│
└── lib/
    ├── utils.ts                        # cn() e utilidades
    └── workingDays.ts                  # Calculo de dias uteis BR + projecoes
```

## Modulos Disponiveis

O roteamento interno usa um `activeModule` state (nao rotas). Deep linking via `?module=xxx`.

| Modulo | ID | Descricao | Acesso |
|--------|----|-----------|--------|
| Dashboard | `dashboard` | Metricas consolidadas, cards por squad | admin, manager, lider |
| Agenda | `agenda` | Calls da semana, agrupadas por dia | todos (closer ve so as suas) |
| CRM Leads | `crm` | Kanban de leads com drag-and-drop | admin, lider, manager |
| SDRs | `sdrs` | Dashboard de SDRs + metricas | admin, lider, manager |
| Squad Eagles | `eagles` | Metricas do squad Eagles | por permissao |
| Squad Sharks | `sharks` | Metricas do squad Sharks | por permissao |
| Metas | `goals` | Configuracao de targets mensais | admin, manager |
| Reunioes | `meetings` | Registro de reunioes + plano de acao | admin, manager |
| Relatorios | `reports` | Funil, vendas por produto | admin, lider, manager |
| Disponibilidade | `availability` | Horarios de atendimento dos closers | admin, lider, closer |
| Limpeza | `cleanup` | Arquivamento de leads bronze/nao-fit | admin, lider |
| Admin | `admin` | CRUD usuarios, metricas em massa | admin |

## Hooks - Referencia Rapida

### useLeads

```tsx
import { useLeads, useLeadsByColumn, useMoveLead, useCreateLead, useUpdateLead } from '@/hooks/useLeads';

// Listar leads com filtros
const { data: leads } = useLeads({ search: 'joao', classification: 'ouro', funnelId: '...' });

// Kanban: leads agrupados por coluna CRM
const { columns, grouped, isLoading } = useLeadsByColumn();

// Mover lead entre colunas (drag-and-drop)
const moveLead = useMoveLead();
moveLead.mutate({ leadId: '...', columnId: '...' });

// Criar lead
const createLead = useCreateLead();
createLead.mutate({ full_name: 'Joao', phone: '...', niche: '...' });
```

### useNotifications

```tsx
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';

// Notificacoes com Realtime (auto-refresh em INSERT)
const { data: notifications } = useNotifications();
const unread = useUnreadCount();

// Marcar como lida
const markRead = useMarkAsRead();
markRead.mutate(notificationId);

// Marcar todas
const markAll = useMarkAllAsRead();
markAll.mutate();
```

### useCloserAvailability

```tsx
import { useCloserAvailability, useDefaultAvailability, useSaveCloserAvailability } from '@/hooks/useCloserAvailability';

// Horarios de um closer
const { data: slots } = useCloserAvailability(closerId);

// Horario padrao
const { data: defaults } = useDefaultAvailability();

// Salvar (deleta existentes + insere novos)
const save = useSaveCloserAvailability();
save.mutate({ closerId, slots: [...] });
```

### useLeadCleanup

```tsx
import { useArchiveLead, useArchiveBronzeLeads, useRestoreLead, useCleanupLogs } from '@/hooks/useLeadCleanup';

// Arquivar um lead (salva dados no cleanup_logs antes de deletar)
const archive = useArchiveLead();
archive.mutate({ leadId: '...', reason: 'nao_fit' });

// Arquivar todos os bronze em lote
const archiveBronze = useArchiveBronzeLeads();
archiveBronze.mutate();

// Restaurar lead a partir do log
const restore = useRestoreLead();
restore.mutate(cleanupLogId);

// Historico
const { data: logs } = useCleanupLogs();
```

### Outros Hooks

| Hook | Descricao |
|------|-----------|
| `useMetrics()` | Metricas de closers (calls, vendas, faturamento, cancelamentos) |
| `useSdrMetrics()` | Metricas de SDRs (ativados, agendados, realizados) |
| `useFunnels()` | Lista de funis ativos |
| `useGoals()` | Metas mensais por entidade |
| `useAppointments()` | Agendamentos com dados de lead |
| `useMeetings()` | Reunioes + participantes + notas + itens de acao |
| `useUserManagement()` | CRUD de usuarios via Edge Functions |

## Tabelas do Banco (Supabase)

### Leads e CRM
| Tabela | Descricao |
|--------|-----------|
| `leads` | Dados do lead (nome, contato, nicho, classificacao, status, crm_column_id) |
| `crm_columns` | Colunas do kanban (nome, posicao, cor) |
| `lead_activities` | Historico de acoes no lead (mudanca de coluna, notas, etc.) |
| `appointments` | Agendamentos de calls |

### Metricas
| Tabela | Descricao |
|--------|-----------|
| `metrics` | Metricas de closers por periodo |
| `sdr_metrics` | Metricas diarias de SDRs por funil |
| `goals` | Metas mensais por entidade |
| `funnel_daily_data` | Dados diarios por closer/funil |

### Disponibilidade
| Tabela | Descricao |
|--------|-----------|
| `closer_availability` | Horarios por closer (dia, inicio, fim, intervalo) |
| `default_availability` | Template padrao de horarios |

### Notificacoes
| Tabela | Descricao |
|--------|-----------|
| `notifications` | Notificacoes por usuario (title, message, type, read) |

### Limpeza
| Tabela | Descricao |
|--------|-----------|
| `cleanup_logs` | Historico de leads arquivados (lead_data preservado para restauracao) |

### Usuarios e Permissoes
| Tabela | Descricao |
|--------|-----------|
| `profiles` | Perfis de usuario |
| `user_roles` | Papel do usuario (admin, manager, viewer, user) |
| `module_permissions` | Permissoes granulares por modulo |
| `user_entity_links` | Vinculacao usuario <-> closer/SDR |

### Vendas
| Tabela | Descricao |
|--------|-----------|
| `squads` | Times de vendas |
| `closers` | Vendedores |
| `sdrs` | Pre-vendedores |
| `funnels` | Funis de vendas |

## Classificacao de Leads

| Classificacao | Descricao |
|---------------|-----------|
| `diamante` | Maior potencial - prioridade maxima |
| `ouro` | Alto potencial |
| `prata` | Potencial medio |
| `bronze` | Baixo potencial - candidato a limpeza |

## Status de Leads

| Status | Descricao |
|--------|-----------|
| `novo` | Recem-criado, sem atendimento |
| `em_atendimento` | SDR esta qualificando |
| `agendado` | Call marcada com closer |
| `concluido` | Processo finalizado |

## Desenvolvimento

```bash
# Standalone (porta isolada)
npm run dev:monetizacao

# Testes
cd services/monetizacao && npm test

# Build
npm run build:monetizacao
```

## Integrar com Sistema Mae

No `apps/main/package.json`:
```json
"@bethel/monetizacao": "*"
```

No `apps/main/src/App.tsx`:
```tsx
const MonetizacaoModule = React.lazy(
  () => import("@bethel/monetizacao").then((m) => ({ default: m.MonetizacaoRoutes }))
);

// Na rota:
<Route path="monetizacao/*" element={<MonetizacaoModule />} />
```

## Variaveis de Ambiente

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```
