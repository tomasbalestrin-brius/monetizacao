
# Adicionar Novos Funis para SDRs

## Situacao Atual
- **Nathali**: 50 Scripts, Organico Cleiton
- **Jaque**: MPM, Reels magnetico, Teste
- **Carlos**: Implementacao Carlos, Implementacao Julia, Mentoria Cleiton

## Alteracoes Solicitadas
1. **Nathali** - Adicionar funil "Implementacao"
2. **Jaque** - Adicionar funil "Implementacao"
3. **Carlos** - Adicionar funil "50 Scripts"

## Como Sera Feito
Inserir registros semente (com valores zerados) na tabela `sdr_metrics` para cada novo funil. Como o sistema descobre funis dinamicamente a partir dos dados existentes, esses registros farao os novos funis aparecerem automaticamente nos seletores da interface.

Serao 3 inserts no banco de dados, um para cada combinacao SDR + funil. Nenhuma alteracao de codigo e necessaria.
