# Análise Completa do Sistema - Bethel Monetizacao

## 1. Visão Geral

O **Bethel Monetizacao** é um **dashboard de performance de vendas e métricas** construído como uma **Progressive Web App (PWA)** para rastrear o desempenho de times comerciais. O sistema é organizado em torno de **Squads** (times de vendas), **Closers** (vendedores que fecham negócios) e **SDRs** (Sales Development Representatives, pré-vendas).

**Repositório fonte**: https://github.com/tomasbalestrin-brius/monetizacao.git

## 2. Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **UI** | shadcn/ui + Radix UI + Tailwind CSS |
| **State/Cache** | TanStack React Query |
| **Roteamento** | React Router DOM v6 |
| **Backend/DB** | Supabase (PostgreSQL + Auth + Edge Functions + Realtime) |
| **Gráficos** | Recharts |
| **Validação** | Zod + React Hook Form |
| **PWA** | vite-plugin-pwa (Workbox) |
| **Plataforma origem** | Lovable.dev |

## 3. Arquitetura de Autenticação e Autorização

O sistema implementa um modelo RBAC (Role-Based Access Control) com 4 papéis:

| Papel | Descrição |
|-------|-----------|
| **admin** | Acesso total a tudo. Pode criar/deletar usuários, gerenciar squads, etc. |
| **manager** | Acesso controlado por `module_permissions`. Só vê e gerencia dados dos módulos atribuídos. |
| **viewer** | Visualização restrita por `module_permissions`. Somente leitura. |
| **user** | UI completamente diferente (`UserDashboard`). Vê apenas dados da entidade (closer/SDR) vinculada. |

### Fluxo de Autenticação
1. Login via Supabase Auth (email/senha)
2. Trigger automático cria `profiles` + atribui role `viewer` por padrão
3. Admin pode alterar roles, permissões de módulo e links de entidade
4. `AuthContext` fornece: `signIn`, `signUp`, `signOut`, `role`, `permissions`, `isAdmin`, `isManager`, `isUser`, `hasPermission(module)`

## 4. Modelo de Dados (21 tabelas)

### A. Gestão de Usuários
- **`profiles`** - Perfil do usuário (id, email, timestamps). Auto-criado via trigger `handle_new_user()`
- **`user_roles`** - Papel do usuário (enum: admin, manager, viewer, user). Default: viewer via trigger `assign_default_role()`
- **`module_permissions`** - Permissões granulares por módulo (eagles, sharks, sdrs, admin, reports, dashboard)
- **`user_entity_links`** - Vinculação polimórfica usuário ↔ closer/SDR (entity_type + entity_id)

### B. Estrutura de Vendas
- **`squads`** - Times de vendas (Eagles, Alcateia, Sharks). Campos: id, name, slug
- **`closers`** - Vendedores pertencentes a squads. FK para squads(id)
- **`sdrs`** - Pré-vendedores. Tipo: `sdr` ou `social_selling`

### C. Métricas de Performance
- **`metrics`** - Métricas de closers por período:
  - calls, sales, revenue, entries (valores brutos)
  - revenue_trend, entries_trend (projeções)
  - cancellations, cancellation_value, cancellation_entries
  - source (manual/sheets), created_by
  - Unique: (closer_id, period_start, period_end)
- **`sdr_metrics`** - Métricas diárias de SDRs por funil:
  - activated, scheduled, scheduled_same_day, scheduled_follow_up
  - attended, sales
  - scheduled_rate, attendance_rate, conversion_rate
  - Unique: (sdr_id, date, funnel)
- **`goals`** - Metas mensais por entidade e métrica:
  - entity_type, entity_id, month, metric_key, target_value
  - Unique: (entity_type, entity_id, month, metric_key)

### D. Sistema de Funis
- **`funnels`** - Registro centralizado de funis de vendas (name, category, is_active)
- **`user_funnels`** - Atribuição de funis a usuários
- **`funnel_daily_data`** - Dados diários por closer/funil:
  - calls_scheduled, calls_done, sales_count, sales_value
  - leads_count, qualified_count
  - sdr_id (atribuição SDR opcional)
  - Unique: (user_id, funnel_id, date, sdr_id)
- **`sdr_funnels`** - Mapeamento SDR ↔ funil

### E. Integração Google Sheets
- **`google_sheets_config`** - Config de sync para métricas de closers (spreadsheet_id, row_mapping JSONB, sync_status)
- **`sdr_sheets_config`** - Config de sync para métricas de SDRs
- **`squad_sheets_config`** - Config de sync por squad com mapeamento detalhado de layout (block layout JSON)

### F. Reuniões
- **`meetings`** - Registro de reuniões (title, description, meeting_date, status)
- **`meeting_participants`** - Participantes N:N
- **`meeting_notes`** - Notas das reuniões
- **`meeting_action_items`** - Itens de ação (title, assigned_to, due_date, status)

## 5. Diagrama de Relacionamentos

```
auth.users (Supabase Auth)
  │
  ├──< profiles (1:1, ON DELETE CASCADE)
  ├──< user_roles (1:N, ON DELETE CASCADE)
  ├──< module_permissions (1:N, ON DELETE CASCADE)
  ├──< metrics.created_by (1:N)
  └──< sdr_metrics.created_by (1:N)

profiles
  └──< user_entity_links (1:N, polimórfico → closer ou sdr)

squads
  ├──< closers (1:N, ON DELETE CASCADE)
  └──< squad_sheets_config (1:1, ON DELETE CASCADE)

closers
  └──< metrics (1:N, ON DELETE CASCADE)

sdrs
  ├──< sdr_metrics (1:N, ON DELETE CASCADE)
  └──< sdr_funnels (1:N, ON DELETE CASCADE)

funnels
  ├──< funnel_daily_data (1:N, ON DELETE CASCADE)
  └──< user_funnels (1:N, ON DELETE CASCADE)

meetings
  ├──< meeting_participants (1:N, ON DELETE CASCADE)
  ├──< meeting_notes (1:N, ON DELETE CASCADE)
  └──< meeting_action_items (1:N, ON DELETE CASCADE)
```

## 6. Páginas e Funcionalidades

### Dashboard Overview (`DashboardOverview`)
- Métricas totais consolidadas: faturamento, entradas, ligações, vendas, taxa de conversão
- Cards resumo por squad
- Seletor de mês
- Dados em tempo real via Supabase Realtime

### Página do Squad (`SquadPage`)
- Métricas agregadas do squad (faturamento, entradas, cancelamentos)
- Lista de closers com cards de resumo
- Dialog para adicionar métricas manuais

### Detalhe do Closer (`CloserDetailPage`)
- Métricas completas: ligações, vendas, conversão, faturamento, entradas, tendências, cancelamentos
- Cálculo líquido: Vendas brutas - cancelamentos = vendas líquidas
- Gráfico de comparação semanal
- Tabela de dados com CRUD (criar/editar/deletar)
- Filtro por funil
- Navegação por swipe entre closers (mobile)
- Pull-to-refresh
- Metas sobrepostas nos cards quando configuradas

### Dashboard SDR (`SDRDashboard`)
- Toggle entre SDR e Social Selling
- Métricas consolidadas: ativados, agendados, taxa, follow-ups, mesmo dia, realizados, vendas
- Lista de SDRs com cards individuais
- Seletores de mês e semana

### Detalhe do SDR (`SDRDetailPage`)
- Métricas detalhadas com metas sobrepostas
- Seletor de funil (quando SDR tem múltiplos funis)
- Agregação de métricas por data quando visualizando "todos os funis"
- Gráfico semanal + tabela de dados com CRUD
- Gestão de funis do SDR (admin/manager)
- Swipe navigation entre SDRs

### Painel Admin (`AdminPanel`)
- **Aba Métricas**: Tabela de métricas em massa
- **Aba Usuários**: CRUD de usuários via Edge Functions
  - Criar com role/permissões/links de entidade
  - Editar roles e permissões de módulo
  - Editar links de entidade (closer/SDR)
  - Deletar (com cascata completa)
- **Aba Metas**: Configuração de metas mensais

### Configuração de Metas (`GoalsConfig`)
- Definir targets mensais por closer ou SDR
- Métricas suportadas - Closers: calls, sales, revenue, entries
- Métricas suportadas - SDRs: activated, scheduled, attended, sales
- Managers só configurar metas de entidades que têm permissão

### Relatórios (`ReportsPage`)
- **Aba Visão Geral**: Resumo de funis (leads, qualificados, agendados, realizados, vendas, faturamento)
- **Aba Por Produto**: Vendas por pessoa e produto (via RPC server-side)
- Gráfico de funil interativo (`FunnelChart`)
- Filtro por período (mês ou range customizado)

### Reuniões (`MeetingsPage` + `MeetingDetailPage`)
- Lista de reuniões com filtro por status (agendada/completa/cancelada)
- Criação com seleção de participantes
- Detalhe com 3 abas: Detalhes, Plano de Ação, Notas

### Dashboard do Usuário (`UserDashboard`)
- Layout dedicado para role `user` (sem sidebar)
- Mostra estado "aguardando vinculação" se sem entidade linkada
- Renderiza `CloserDetailPage` ou `SDRDetailPage` baseado no link primário

## 7. Edge Functions (Supabase Deno)

| Função | Descrição |
|--------|-----------|
| **admin-create-user** | Cria usuário Auth + profile + role + permissões + entity links. Verifica JWT do caller e requer role admin. |
| **admin-delete-user** | Deleta usuário com limpeza em cascata (user_entity_links, module_permissions, user_roles, user_funnels, goals, profiles, auth). Impede auto-deleção. |

## 8. RPCs Server-Side (PostgreSQL Functions)

| RPC | Descrição |
|-----|-----------|
| `has_role(user_id, role)` | Verifica se usuário tem determinado papel |
| `has_module_permission(user_id, module)` | Verifica permissão de módulo |
| `get_user_role(user_id)` | Retorna o papel do usuário |
| `is_linked_to_entity(user_id, entity_type, entity_id)` | Verifica link com entidade |
| `manager_can_access_closer(user_id, closer_id)` | Verifica acesso de manager a closer (via squad/module) |
| `manager_can_access_sdr(user_id, sdr_id)` | Verifica acesso de manager a SDR |
| `get_sdr_total_metrics(type, start, end)` | Agrega métricas SDR por tipo e período |
| `get_funnel_report(funnel_id, start, end)` | Relatório detalhado de um funil |
| `get_all_funnels_summary(start, end)` | Resumo de todos os funis ativos |
| `get_sales_by_person_and_product(start, end)` | Vendas por pessoa e produto |

## 9. Segurança (Row Level Security)

Todas as tabelas possuem RLS habilitado com 4 níveis de acesso:

1. **Admins** - Acesso irrestrito (ALL) em todas as tabelas
2. **Managers** - Acesso restrito por módulo via `manager_can_access_closer()` / `manager_can_access_sdr()`
3. **Users** - Acesso apenas a entidades vinculadas via `user_entity_links`, com restrição `created_by = auth.uid()` para escrita
4. **Viewers/Authenticated** - SELECT público para dados gerais (squads, closers, sdrs, metrics, funnels)

Funções de segurança usam `SECURITY DEFINER` com `SET search_path = public` para prevenir ataques de search path injection.

## 10. Recursos PWA e Mobile

- **Standalone mode** com ícones (192px, 512px) e manifest completo
- **Service Worker** com auto-update
- **Caching offline**: assets estáticos + API Supabase (NetworkFirst, max 100 entries, 1h TTL)
- **Bottom navigation** (mobile) com feedback háptico (`navigator.vibrate`)
- **Pull-to-refresh** com física de resistência e indicador visual
- **Swipe navigation** horizontal entre closers/SDRs
- **Safe area** para dispositivos com notch
- **Orientação portrait** forçada
- **Touch optimization** (touch-manipulation CSS)

## 11. Cálculo de Dias Úteis e Tendências

A biblioteca `workingDays.ts` implementa:
- Cálculo de dias úteis no Brasil (seg-sex = 1 dia, sáb = 0.5, dom = 0)
- Feriados nacionais fixos (Ano Novo, Tiradentes, Trabalho, Independência, N.S. Aparecida, Finados, República, Natal)
- Feriados móveis via algoritmo Computus (Carnaval, Sexta-feira Santa, Corpus Christi)
- Dias não-úteis customizados da empresa
- Projeção de fim de mês: `(valor_atual / dias_trabalhados) * total_dias_úteis_no_mês`

## 12. Fluxo de Dados

```
Supabase PostgreSQL
    ↕ (Realtime subscriptions para metrics/sdr_metrics)
    ↕ (RPC para agregações pesadas - 10-50x mais rápido que client-side)
    ↓
React Query Hooks (30s stale time, 5min GC, retry com backoff exponencial)
    ↓
Componentes React (lazy loading + code splitting + ErrorBoundary por módulo)
```

### Tabelas com Realtime habilitado:
- `metrics`
- `sdr_metrics`
- `google_sheets_config`
- `sdr_sheets_config`

## 13. Padrões Arquiteturais Notáveis

1. **SPA com switch de módulos**: Ao invés de múltiplas rotas, usa uma única rota protegida com switch/case por `activeModule`. Deep linking via query params (`?module=xxx&closer=yyy`).

2. **Branching de layout por role**: Role `user` recebe componente completamente diferente (`UserDashboard`) sem sidebar.

3. **Lazy loading**: Componentes pesados usam `React.lazy()` com `Suspense` para code splitting.

4. **ErrorBoundary por módulo**: Cada módulo é isolado - crash de um módulo não derruba a aplicação.

5. **Cálculo líquido de vendas**: Métricas brutas - cancelamentos = valores líquidos. Taxa de cancelamento calculada sobre bruto.

6. **Agregações server-side via RPC**: Cálculos pesados rodam no PostgreSQL, não no browser.

7. **Upsert com conflict handling**: SDR metrics usa `onConflict: 'sdr_id,date,funnel'` para update-or-insert.

8. **Duas bibliotecas de toast**: shadcn/ui Toaster + Sonner (inconsistência de desenvolvimento iterativo).

9. **Validação Zod**: Formulários de auth e métricas validados com schemas Zod.

10. **Model polimórfico**: `user_entity_links` e `goals` usam `entity_type + entity_id` para referência flexível a closers ou SDRs.
