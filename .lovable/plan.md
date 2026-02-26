

# Adicionar botão de voltar na página de Relatórios

Quando um funil específico é selecionado (via dropdown ou clique no card), não há botão para voltar à visão "Todos os Funis". 

## Alteração

**`src/components/dashboard/reports/ReportsPage.tsx`**:
- Quando `selectedFunnelId` não é `null`, exibir um botão de voltar (ícone `ArrowLeft`) ao lado do título ou próximo ao filtro
- O botão chama `setSelectedFunnelId(null)` para resetar a visão
- Também resetar o dropdown `Select` para "all"

Implementação simples: adicionar um botão com `ArrowLeft` antes do título quando há funil selecionado, similar ao padrão usado no `CloserDetailPage`.

