

# Sistema de Metas Mensais para Closers e SDRs

## Objetivo

Criar um sistema onde administradores definem metas mensais para cada closer e SDR, e cada usuario vinculado pode visualizar suas proprias metas com progresso em relacao aos dados reais.

## 1. Nova tabela no banco de dados

Tabela `goals` com as seguintes colunas:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | Identificador unico |
| entity_type | text | 'closer' ou 'sdr' |
| entity_id | uuid | ID do closer ou SDR |
| month | date | Primeiro dia do mes (ex: 2026-02-01) |
| metric_key | text | Nome da metrica (ex: 'sales', 'revenue', 'calls', 'activated', 'scheduled') |
| target_value | numeric | Valor da meta |
| created_by | uuid | Admin que criou |
| created_at | timestamptz | Data de criacao |
| updated_at | timestamptz | Data de atualizacao |

Restricao unica em `(entity_type, entity_id, month, metric_key)` para evitar duplicatas.

### Metricas disponiveis por tipo

**Closers:** calls, sales, revenue, entries, conversion_rate

**SDRs:** activated, scheduled, scheduled_rate, attended, sales

### RLS Policies

- Admins: ALL (gerenciar tudo)
- Managers: SELECT (visualizar)
- Usuarios autenticados: SELECT apenas metas de entidades vinculadas a eles (via `user_entity_links`)

## 2. Hook de dados (`src/hooks/useGoals.ts`)

- `useGoals(entityType, entityId, month)` - buscar metas de uma entidade/mes
- `useUpsertGoal()` - criar ou atualizar meta (admin only)
- `useDeleteGoal()` - remover meta (admin only)
- `useMyGoals()` - buscar metas do usuario logado usando seus entity links

## 3. Componente de configuracao de metas (Admin)

**Arquivo:** `src/components/dashboard/GoalsConfig.tsx`

- Acessivel no Painel Admin como nova aba "Metas"
- Selecionar tipo (Closer ou SDR), entidade, e mes
- Formulario com campos para cada metrica relevante
- Upsert automatico (cria ou atualiza)

## 4. Exibicao de metas nas paginas individuais

### CloserDetailPage

- Barra de progresso abaixo de cada MetricCard mostrando % da meta atingida
- Indicador visual: verde (>= 100%), amarelo (>= 70%), vermelho (< 70%)

### SDRDetailPage

- Mesma logica de barras de progresso nos SDRMetricCards

### Visualizacao para o usuario vinculado

- Quando um usuario com role `viewer` acessa o sistema e esta vinculado a um closer/SDR via `user_entity_links`, ele ja ve as metas no dashboard da entidade correspondente
- Nenhuma pagina nova necessaria: as metas aparecem automaticamente nos cards existentes

## 5. Componentes novos

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useGoals.ts` | Hook para CRUD de metas |
| `src/components/dashboard/GoalsConfig.tsx` | Painel admin para definir metas |
| `src/components/dashboard/GoalProgress.tsx` | Componente de barra de progresso com indicador visual |

## 6. Alteracoes em arquivos existentes

| Arquivo | Alteracao |
|---------|-----------|
| `AdminPanel.tsx` | Adicionar aba "Metas" com GoalsConfig |
| `CloserDetailPage.tsx` | Integrar GoalProgress nos MetricCards |
| `SDRDetailPage.tsx` | Integrar GoalProgress nos SDRMetricCards |
| `MetricCard.tsx` | Aceitar prop opcional `goal` para exibir barra de progresso |
| `SDRMetricCard.tsx` | Aceitar prop opcional `goal` para exibir barra de progresso |

## Detalhes Tecnicos

### SQL da migracao

```sql
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  month date NOT NULL,
  metric_key text NOT NULL,
  target_value numeric NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, month, metric_key)
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Admins gerenciam tudo
CREATE POLICY "Admins can manage all goals"
  ON public.goals FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Managers podem visualizar
CREATE POLICY "Managers can view goals"
  ON public.goals FOR SELECT
  USING (has_role(auth.uid(), 'manager'::app_role));

-- Usuarios vinculados podem ver metas das suas entidades
CREATE POLICY "Users can view their entity goals"
  ON public.goals FOR SELECT
  USING (
    is_linked_to_entity(auth.uid(), entity_type, entity_id)
  );

-- Trigger para updated_at
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Fluxo de exibicao

Nos cards de metricas, a barra de progresso so aparece quando existe uma meta definida para aquele mes/metrica. O calculo e simples: `(valorAtual / metaDefinida) * 100`.

