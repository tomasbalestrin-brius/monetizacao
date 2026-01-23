
# Plano: Corrigir Sincronização que Apaga Dados

## Problema Identificado

O cron job `sync-google-sheets` roda **a cada 1 minuto** e sincroniza **TODOS os closers** usando a configuração global (coluna G). Como as abas do Alcateia e Sharks têm estrutura diferente (coluna G = "SAB" ao invés de "SEMANAL"), ele sobrescreve os dados corretos com zeros.

**Fluxo atual problemático:**
1. Você sincroniza Alcateia via `sync-squad-sheets` → dados corretos salvos
2. 1 minuto depois: cron `sync-google-sheets` → lê coluna G (vazia) → sobrescreve com zeros

## Solução Proposta

Modificar a Edge Function `sync-google-sheets` para **excluir squads que têm configuração própria** na tabela `squad_sheets_config`.

### Lógica:

```text
sync-google-sheets (cron):
  1. Buscar lista de squads com configuração própria em squad_sheets_config
  2. Ao processar closers, PULAR os que pertencem a squads com config própria
  3. Sincronizar apenas closers de squads SEM config própria (Eagles)
```

## Alterações Técnicas

### 1. Modificar `sync-google-sheets/index.ts`

Adicionar verificação para pular squads com configuração própria:

```typescript
// Buscar squads que têm configuração própria
const { data: squadConfigs } = await adminClient
  .from('squad_sheets_config')
  .select('squad_id');

const squadsWithOwnConfig = new Set(
  (squadConfigs || []).map(c => c.squad_id)
);

// No loop de closers, pular os que têm config própria
for (const { sheetName, closer } of validSheets) {
  // NOVO: Pular closers de squads com config própria
  if (squadsWithOwnConfig.has(closer.squad_id)) {
    console.log(`[sync-google-sheets] Skipping ${closer.name} - squad has own config`);
    continue;
  }
  
  // ... resto do código
}
```

### 2. Atualizar mensagem de log

Adicionar log indicando quantos closers foram pulados por terem config própria.

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/sync-google-sheets/index.ts` | Adicionar lógica para pular squads com config própria |

## Fluxo Após Correção

```text
sync-google-sheets (cron):
  - Busca squads com config própria: [Alcateia, Sharks]
  - Processa HANNAH → Eagles não tem config própria → sincroniza ✅
  - Processa CARLOS → Eagles não tem config própria → sincroniza ✅
  - Processa DEYVID → Eagles não tem config própria → sincroniza ✅
  - Processa ISIS → Alcateia TEM config própria → PULA ✅
  - Processa GISELE → Alcateia TEM config própria → PULA ✅
  - Processa TAINARA → Alcateia TEM config própria → PULA ✅
  - Processa LEANDRO → Sharks TEM config própria → PULA ✅

sync-squad-sheets?squad=alcateia (manual):
  - Sincroniza ISIS, GISELE, TAINARA usando coluna H ✅
  - Dados não são sobrescritos pelo cron ✅

sync-squad-sheets?squad=sharks (manual):
  - Sincroniza LEANDRO usando coluna H ✅
  - Dados não são sobrescritos pelo cron ✅
```

## Resultado Esperado

1. **Eagles**: Continuam sincronizando via cron (coluna G)
2. **Alcateia/Sharks**: Sincronizam apenas quando você clica em "Sincronizar" na página do squad (coluna H)
3. **Dados não são mais apagados** pelo cron automático

## Próximos Passos Após Implementação

1. Verificar que Alcateia e Sharks têm configuração salva em `squad_sheets_config`
2. Aguardar 2 minutos para confirmar que o cron não sobrescreve mais os dados
3. Se desejar sincronização automática para Alcateia/Sharks, podemos criar um cron específico para o `sync-squad-sheets`
