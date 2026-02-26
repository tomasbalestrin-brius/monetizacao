

# Plano de Implementação — PRD Closer Intensivo v3.0

O PRD abrange 4 frentes selecionadas. Dado o tamanho, a implementação será faseada seguindo as dependências do cronograma do PRD.

---

## Fase 1: Schema SQL + Ajustes de Dados (P0)

### 1.1 Criar tabela `funnels` (sistema centralizado de funis)
Nova tabela para gerenciamento global de funis, substituindo o modelo atual onde funis são apenas strings na `sdr_metrics`:

```text
funnels
├── id (UUID PK)
├── name (TEXT UNIQUE NOT NULL)
├── category (TEXT) — Social Selling, Mentoria, Implementação, etc.
├── is_active (BOOLEAN DEFAULT true)
├── created_at, created_by
```

### 1.2 Criar tabela `user_funnels` (atribuição funil↔usuário)
Vincula SDRs/Closers a funis específicos:

```text
user_funnels
├── id (UUID PK)
├── user_id (UUID NOT NULL)
├── funnel_id (UUID FK → funnels)
├── assigned_at, assigned_by
├── UNIQUE(user_id, funnel_id)
```

### 1.3 Criar tabela `funnel_daily_data` (dados do closer por funil)
Granularidade por funil para os closers:

```text
funnel_daily_data
├── id (UUID PK)
├── user_id (UUID NOT NULL) — closer
├── funnel_id (UUID FK → funnels)
├── date (DATE NOT NULL)
├── calls_scheduled, calls_done, sales_count, sales_value
├── sdr_id (UUID nullable) — SDR de origem da venda
├── leads_count, qualified_count
├── UNIQUE(user_id, funnel_id, date, sdr_id)
```

### 1.4 RLS policies
- Admin: ALL em todas as novas tabelas
- Manager: ALL com verificação de acesso ao módulo
- User/Closer: SELECT + INSERT/UPDATE em `funnel_daily_data` (apenas seus registros)
- SELECT público em `funnels` (autenticados)

### 1.5 Índices
Criar índices em `funnel_daily_data(user_id)`, `(funnel_id)`, `(date)`, `(sdr_id)` e `user_funnels(user_id)`, `(funnel_id)`.

### 1.6 Migrar dados existentes de `sdr_funnels`
Popular a tabela `funnels` com os funis já existentes em `sdr_funnels` e criar os vínculos correspondentes em `user_funnels`.

### 1.7 Operações de dados
- Remover SDR Dienifer do sistema (ou marcar como inativa)
- Atribuir funil "Social Selling" para Nathi via `user_funnels`

---

## Fase 2: Exclusão de Usuários (P1)

### 2.1 Criar RPC `delete_user_completely`
Função no banco que executa exclusão em cascata:
- Verifica se executor é admin
- Verifica que não está excluindo a si mesmo
- Remove: `user_entity_links`, `module_permissions`, `user_roles`, `profiles`, `goals`, `user_funnels`
- Dados de métricas (`metrics`, `sdr_metrics`, `funnel_daily_data`) são preservados ou excluídos conforme regra

### 2.2 Edge Function para deletar do Auth
Chamar `supabase.auth.admin.deleteUser()` via edge function (requer service role key).

### 2.3 Frontend: `DeleteUserDialog`
- Modal com confirmação dupla (digitar email do usuário)
- Loading state durante exclusão
- Toast de sucesso/erro
- Atualização automática da lista

### 2.4 Atualizar `AdminPanel.tsx`
- Substituir o botão de delete atual pelo novo `DeleteUserDialog`

---

## Fase 3: Correção do Cálculo de Tendência (P1)

### Estado atual
O `calculateTrend` em `workingDays.ts` já implementa a fórmula `(valor / dias_trabalhados) × total_dias_úteis`, com feriados brasileiros e sábados como 0.5. Isso **já está alinhado** com o PRD.

### Ajustes necessários
- **Caso `dias_trabalhados = 0`**: Atualmente retorna 0; PRD pede exibir "Sem dados suficientes" — ajustar o `MetricCard` para mostrar mensagem quando tendência é 0 e há dados
- **Caso `dias_trabalhados = 1`**: Adicionar aviso "Projeção com base em apenas 1 dia"
- **Filtro de período customizado**: Já funciona pois `calculateTrend` recebe `periodStart`
- Verificar se o cálculo está sendo usado consistentemente em todos os módulos (Closer detail, Squad, Dashboard, SDR)

---

## Fase 4: Módulo de Relatórios Backend (P1)

### 4.1 Views e RPCs no banco
- **RPC `get_funnel_report`**: Retorna indicadores compilados por funil (leads, qualificados, agendados, realizados, vendas, taxas de conversão entre etapas)
- **RPC `get_all_funnels_summary`**: Resumo agregado de todos os funis para o período

### 4.2 Frontend: Página de Relatórios
- Substituir o placeholder atual por página funcional
- Listar todos os funis cadastrados com seus indicadores
- Gráfico de funil (funnel chart) mostrando progressão: Leads → Qualificados → Agendados → Realizados → Vendas
- Gráfico de linha temporal (evolução diária/semanal/mensal)
- Filtros: período, funil específico, SDR, Closer, agrupamento

### 4.3 Hooks de dados
- `useFunnels()` — lista funis
- `useFunnelReport(funnelId, startDate, endDate)` — indicadores por funil
- `useAllFunnelsSummary(startDate, endDate)` — resumo geral

---

## Fase 5: Cadastro Closer por Funil + Filtro (P1-P2)

### 5.1 Reestruturar formulário de entrada de dados do Closer
- Interface com seções/cards expansíveis por funil ativo
- Campos por funil: calls realizadas, calls agendadas, vendas, valor da venda
- Campo condicional "SDR de Origem" quando há venda (dropdown filtrado por SDR atribuído ao funil)
- Salvamento batch (inserir dados de múltiplos funis de uma vez)

### 5.2 Filtro por funil no dashboard do Closer
- Dropdown na barra de filtros: "Todos os Funis" (padrão) + funis ativos
- Ao selecionar funil: filtrar cards, gráficos e indicadores
- Combinação com filtro de período existente
- Tendência respeita o filtro de funil

### 5.3 Hooks de dados
- `useCloserFunnelData(closerId, funnelId, period)` — dados por funil
- `useCreateFunnelDailyData()` — inserção batch

---

## Ordem de Execução Recomendada

Dado que são muitas alterações, recomendo implementar em mensagens separadas:

1. **Mensagem 1**: Fase 1 (Schema SQL + migrações + dados)
2. **Mensagem 2**: Fase 2 (Exclusão de usuários)
3. **Mensagem 3**: Fase 3 (Correção tendência)
4. **Mensagem 4**: Fase 4 (Relatórios backend + frontend)
5. **Mensagem 5**: Fase 5 (Cadastro closer por funil + filtro)

Total estimado: ~35-40 horas conforme PRD.

