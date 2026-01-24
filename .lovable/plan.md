
Objetivo: corrigir a “Taxa de Conversão” do Squad **Alcateia**, que está errada porque os valores de **calls** e **sales** estão sendo importados de linhas erradas da planilha (o que gera vendas gigantes e conversões absurdas).

## Diagnóstico (o que está acontecendo)
- A função de sincronização por squad (`sync-squad-sheets`) já foi ajustada para ter fallback `DEFAULT_CONFIG.blockOffset = 12`.
- Porém, o Alcateia (e também Sharks) **já tem configuração salva no backend** com `row_mapping.blockOffset = 13`.
- Como a função **prioriza o valor salvo no backend**, ela continua usando `13` e lendo as linhas erradas.

Evidência (backend agora):
- `squad_sheets_config` do **alcateia** está com `blockOffset: 13` (igual ao sharks).
- A tabela `metrics` mostra valores claramente “deslocados”, por exemplo:
  - `sales` com 45k / 50k e `revenue = 0`, o que indica que o “sales” está pegando uma linha de dinheiro ou outro campo.

## O que vamos implementar (correção definitiva)
### 1) Corrigir a configuração salva do Alcateia (e Sharks) no backend
Criar uma migração para:
1. Atualizar o `row_mapping.blockOffset` de `13` → `12` **para alcateia e sharks** (sem mexer em outros squads).
2. Ajustar o **default** da coluna `row_mapping` na tabela `squad_sheets_config` para já nascer com `blockOffset: 12` daqui pra frente.

SQL (migração):
- Atualizar registros existentes (alcateia/sharks):
```sql
update public.squad_sheets_config c
set row_mapping = jsonb_set(c.row_mapping, '{blockOffset}', '12'::jsonb, true),
    updated_at = now()
from public.squads s
where c.squad_id = s.id
  and s.slug in ('alcateia', 'sharks');
```

- Atualizar o default da tabela:
```sql
alter table public.squad_sheets_config
alter column row_mapping
set default '{"column":"H","firstBlockStartRow":5,"blockOffset":12,"numberOfBlocks":4,"dateRow":1,"metrics":{"calls":0,"sales":1,"revenue":3,"entries":4,"revenueTrend":5,"entriesTrend":6,"cancellations":7,"cancellationValue":9,"cancellationEntries":10}}'::jsonb;
```

Resultado esperado:
- Próxima sincronização do Alcateia vai ler os blocos nas linhas corretas e gravar calls/sales coerentes.
- As linhas erradas atuais serão sobrescritas (upsert) para os mesmos `period_start/period_end`.

### 2) Corrigir o “defaultRowMapping” do frontend (pra não voltar a salvar errado)
Hoje o frontend ainda salva `blockOffset: 13` quando você conecta uma planilha.
Vamos alterar em:
- `src/hooks/useSquadSheetsConfig.ts`
  - trocar `blockOffset: 13` → `blockOffset: 12` no `defaultRowMapping`.

Isso garante que:
- se você desconectar e conectar de novo, não volta o erro.
- novos squads configurados via UI já ficam no padrão correto.

### 3) (Opcional, mas recomendado) Mostrar o blockOffset em modo “Avançado”
Se vocês tiverem squads com planilhas diferentes no futuro, o ideal é permitir ajustar isso sem mexer em código.
Podemos adicionar depois um “Configuração avançada” no `SquadSheetsConfig` para editar:
- `blockOffset`
- `firstBlockStartRow`
- (talvez) `column`

Não é obrigatório para corrigir Alcateia agora.

## Como vamos validar que ficou certo
Após aplicar as correções acima:
1. Abrir a página do Squad **Alcateia** e clicar em **Sincronizar**.
2. Conferir logs da função:
   - Deve aparecer `Raw config` com `blockOffset: 12` (ou pelo menos `Config` usando `12`).
3. Conferir dados no backend (amostragem):
   - Para o período onde estava absurdo (ex.: 2026-01-15 → 2026-01-19), `sales` deve cair para algo “contagem” (não dezenas de milhares).
4. No app, a “Taxa de Conversão” deve voltar para valores plausíveis e próximos do que vocês enxergam na planilha.

## Arquivos/itens que serão alterados
- Banco (migração nova):
  - Atualizar `row_mapping.blockOffset` de Alcateia e Sharks para 12
  - Alterar default de `row_mapping` para 12
- Frontend:
  - `src/hooks/useSquadSheetsConfig.ts` (defaultRowMapping)

## Observação importante (para expectativas)
A conversão no app é calculada como:
- `conversion = (sales / calls) * 100`
Ela pode não bater “exatamente” com a célula de % da planilha se a planilha usa arredondamento ou uma fórmula diferente; mas deve ficar coerente (não 300%+, não 1000%+).

