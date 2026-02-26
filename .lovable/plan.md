

# Integrar dados de SDR/Social Selling nos Relatórios por Funil

## Problema
Os RPCs `get_all_funnels_summary` e `get_funnel_report` só consultam a tabela `funnel_daily_data` (preenchida por Closers). Os SDRs e Social Selling preenchem dados na tabela `sdr_metrics` com campo `funnel` (texto) que mapeia para os nomes dos funis na tabela `funnels`. Esses dados não aparecem nos relatórios.

Dados existentes em `sdr_metrics` para fevereiro/2026: 891 ativados (Social Selling Cleiton), 407 ativados (Teste), 300 ativados (50 Scripts), etc. Nada disso aparece na página de Relatórios.

## Mapeamento de campos

| sdr_metrics | Relatório |
|---|---|
| activated | leads (ativados = leads gerados pelo SDR) |
| scheduled | calls_scheduled (agendamentos) |
| attended | calls_done (realizadas) |
| sales | sales |

Os SDRs não preenchem `qualified_count` nem `sales_value`, então esses campos virão apenas de `funnel_daily_data`.

## Solução

### 1. Atualizar RPC `get_all_funnels_summary`
- Fazer JOIN com `sdr_metrics` via `funnels.name = sdr_metrics.funnel`
- Somar `activated` ao `total_leads`, `scheduled` ao `total_calls_scheduled`, `attended` ao `total_calls_done`, `sales` ao `total_sales`
- Manter `qualified_count` e `sales_value` apenas de `funnel_daily_data`
- Recalcular taxas de conversão com os totais combinados

### 2. Atualizar RPC `get_funnel_report`
- Mesma lógica: combinar dados de `funnel_daily_data` + `sdr_metrics` para o funil específico
- Recalcular todas as taxas de conversão entre estágios

### Arquivos alterados
- Migration SQL: atualizar as duas funções RPC

### Nota técnica
O JOIN entre `sdr_metrics.funnel` (texto) e `funnels.name` (texto) já funciona para os dados existentes. Não é necessário alterar código frontend — os RPCs já alimentam os componentes da página de Relatórios.

