

# Adicionar funis ao SDR Carlos

O SDR Carlos (`a8163c8c-174c-4752-ba46-24b82df7a03f`) já possui 3 funis: Mentoria Cleiton, 50 Scripts, Implementação Julia.

Os funis "Convidado Carlos" e "Funil do Intensivo" precisam ser adicionados. O sistema de funis de SDR usa a tabela `sdr_funnels` com `funnel_name` (texto livre), então basta inserir dois registros.

Adicionalmente, esses funis devem ser criados na tabela `funnels` (tabela centralizada) para que apareçam nos relatórios e filtros.

## Ações

| Ação | Detalhe |
|------|---------|
| Criar funis na tabela `funnels` | INSERT "Convidado Carlos" e "Funil do Intensivo" |
| Vincular ao SDR Carlos em `sdr_funnels` | INSERT 2 registros com `sdr_id` do Carlos e os nomes dos funis |

