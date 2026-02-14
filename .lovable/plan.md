

# Permitir Edição de Notas nas Reuniões

## Problema
Atualmente, notas de reunião só podem ser adicionadas e excluídas. Não há como editar o conteúdo de uma nota já salva.

## Solução
Adicionar funcionalidade de edição inline nas notas existentes, com um botão de editar (ícone de lápis) ao lado do botão de excluir.

## Alterações

### 1. `src/hooks/useMeetings.ts`
- Criar o hook `useUpdateNote` com mutation que faz `UPDATE` na tabela `meeting_notes` atualizando o campo `content` pelo `id`.
- Invalidar a query `['meeting-notes', meeting_id]` ao concluir.

### 2. `src/components/dashboard/meetings/MeetingNotes.tsx`
- Adicionar estado `editingNoteId` e `editContent` para controlar qual nota está sendo editada.
- Ao clicar no ícone de editar (Pencil), a nota entra em modo de edição: o texto vira um `Textarea` editável com botões de salvar (Check) e cancelar (X).
- Ao salvar, chamar `useUpdateNote` e sair do modo de edição.
- Importar o hook `useUpdateNote` e os ícones `Pencil`, `Check`, `X` do Lucide.

## Detalhes Técnicos

Hook `useUpdateNote`:
```typescript
export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; meeting_id: string; content: string }) => {
      const { error } = await supabase
        .from('meeting_notes')
        .update({ content: input.content })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['meeting-notes', vars.meeting_id] });
    },
  });
}
```

No componente, cada nota terá dois modos:
- **Visualização**: texto + botões editar/excluir
- **Edição**: textarea com conteúdo atual + botões salvar/cancelar

Nenhuma alteração de banco de dados necessária.

