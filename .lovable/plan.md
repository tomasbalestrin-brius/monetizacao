

# Remover SDR Dienifer do sistema

**SDR encontrada**: Dienifer (ID: `c963ddbf-c212-4b14-97f6-a7527e1be407`, tipo: sdr)

## Dados associados que serão removidos
- 32 registros em `sdr_metrics`
- 1 registro em `sdr_funnels`
- 0 vínculos de usuário
- 0 metas

## Ordem de exclusão (via insert tool)
1. Deletar `sdr_metrics` onde `sdr_id = 'c963ddbf-...'`
2. Deletar `sdr_funnels` onde `sdr_id = 'c963ddbf-...'`
3. Deletar `sdrs` onde `id = 'c963ddbf-...'`

Nenhuma alteração de código necessária — apenas operações de dados no banco.

