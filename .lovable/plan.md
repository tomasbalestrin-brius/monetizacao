
# Plano: Corrigir Leitura de Dados da Planilha

## Diagnóstico

Identifiquei **dois problemas** que impedem a leitura correta dos dados:

### 1. Configuração com Valores Incorretos no Banco

A configuração salva está no formato legado com valores que parecem ser **linhas absolutas**, não offsets relativos:

| Métrica | Valor Atual | Valor Correto |
|---------|-------------|---------------|
| calls | 7 | 0 |
| sales | 14 | 1 |
| revenue | 10 | 3 |
| entries | 11 | 4 |
| revenueTrend | 12 | 5 |
| entriesTrend | 13 | 6 |
| cancellations | 15 | 7 |
| cancellationValue | 16 | 9 |
| cancellationEntries | 17 | 10 |

**Resultado**: O sistema procura métricas nas linhas erradas e encontra células vazias.

### 2. Número de Blocos Fixo em 4

A configuração não inclui `numberOfBlocks`, então usa o padrão de **4 blocos/semanas**. Se você precisa de mais semanas, é necessário ajustar essa configuração.

**Cálculo atual (4 blocos):**
- Bloco 1: Linhas 5-15
- Bloco 2: Linhas 18-28
- Bloco 3: Linhas 31-41
- Bloco 4: Linhas 44-54

## Solução

### Opção 1: Resetar Configuração via Admin Panel (Recomendado)

1. Acessar Admin Panel → Configuração Google Sheets
2. Expandir "Configuração de Blocos Semanais"
3. Verificar/ajustar os valores:
   - **Primeira semana começa na linha**: 5
   - **Linhas entre cada semana**: 13
   - **Número de semanas por aba**: 4 (ou mais se precisar)
4. Verificar os offsets das métricas (devem ser 0, 1, 3, 4, 5, 6, 7, 9, 10)
5. Clicar em "Salvar Configuração"
6. Sincronizar novamente

### Opção 2: Corrigir Automaticamente via Código

Atualizar a Edge Function para usar valores padrão corretos quando detectar configuração legada inválida.

## Alterações Técnicas

### 1. Edge Function - Melhorar Detecção de Configuração Legada

```typescript
// supabase/functions/sync-google-sheets/index.ts

function normalizeConfig(rawConfig: unknown): WeekBlockConfig {
  // Se detectar valores suspeitos (offsets > 10), usar padrões
  if ('calls' in config && (config.calls as number) > 10) {
    console.log('Detected invalid legacy config with absolute row values, using defaults');
    return {
      ...DEFAULT_CONFIG,
      column: (config.column as string) || DEFAULT_CONFIG.column,
    };
  }
  // ... resto do código
}
```

### 2. Corrigir Dados no Banco

Atualizar a configuração existente com valores corretos:

```sql
UPDATE google_sheets_config 
SET row_mapping = '{
  "firstBlockStartRow": 5,
  "blockOffset": 13,
  "numberOfBlocks": 4,
  "dateRow": 1,
  "column": "G",
  "metrics": {
    "calls": 0,
    "sales": 1,
    "revenue": 3,
    "entries": 4,
    "revenueTrend": 5,
    "entriesTrend": 6,
    "cancellations": 7,
    "cancellationValue": 9,
    "cancellationEntries": 10
  }
}'::jsonb
WHERE id = 'dfeae186-b8ef-4ea3-9755-f762c725ca35';
```

### 3. Adicionar Mais Blocos (se necessário)

Se a planilha tem mais de 4 semanas, alterar `numberOfBlocks` para o número correto (ex: 5, 6, etc).

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/sync-google-sheets/index.ts` | Detectar configuração legada inválida e usar padrões |
| **Migração SQL** | Corrigir `row_mapping` no banco de dados |

## Resultado Esperado

Após as correções:
- Métricas serão lidas das linhas corretas (5, 6, 8, 9, etc.)
- Todas as 4 semanas serão sincronizadas
- Dados aparecerão corretamente no dashboard

## Próximos Passos Após Implementação

1. Re-sincronizar a planilha
2. Verificar logs para confirmar que as métricas estão sendo lidas corretamente
3. Ajustar `numberOfBlocks` se precisar de mais semanas
