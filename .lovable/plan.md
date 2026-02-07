

# Nova Role "user" - Acesso Restrito ao Proprio Canal

## Objetivo

Criar uma nova role `user` no sistema onde o usuario so ve e gerencia os dados da entidade (Closer ou SDR) vinculada a ele. Diferente do `viewer` que ve tudo em modo leitura, o `user` tera uma experiencia focada exclusivamente nos seus proprios dados.

## O que muda

### 1. Banco de Dados

**Adicionar valor `user` ao enum `app_role`:**

```sql
ALTER TYPE public.app_role ADD VALUE 'user';
```

**Atualizar RLS das tabelas `metrics` e `sdr_metrics`** para que o role `user` possa inserir/editar/deletar metricas das suas entidades vinculadas (usando `is_linked_to_entity`).

**Atualizar RLS de `closers` e `sdrs`** para que o `user` veja apenas as entidades vinculadas a ele.

### 2. Experiencia do Usuario com Role `user`

Quando um usuario com role `user` faz login:

- **Sem sidebar/navegacao completa**: ele vai direto para a pagina de detalhe da sua entidade vinculada
- Se esta vinculado a um **Closer**: ve o `CloserDetailPage` diretamente
- Se esta vinculado a um **SDR**: ve o `SDRDetailPage` diretamente
- **Nao ve**: Dashboard geral, Squads, outros closers/SDRs, Admin, Relatorios
- **Pode**: ver suas metricas, adicionar metricas, ver suas metas

### 3. Fluxo de Navegacao

```text
Login -> Verificar role
  |
  +-> admin/manager/viewer -> Dashboard normal (como hoje)
  |
  +-> user -> Buscar entity_links do usuario
                |
                +-> Vinculado a Closer -> CloserDetailPage direto
                +-> Vinculado a SDR -> SDRDetailPage direto
                +-> Sem vinculo -> Tela de "aguardando vinculo"
```

### 4. Arquivos Alterados

| Arquivo | Alteracao |
|---------|-----------|
| Migracao SQL | Adicionar `user` ao enum, atualizar RLS |
| `src/contexts/AuthContext.tsx` | Adicionar `isUser` ao contexto |
| `src/pages/Index.tsx` | Detectar role `user` e redirecionar para view dedicada |
| `src/components/dashboard/Sidebar.tsx` | Esconder sidebar para role `user` |
| `src/components/dashboard/BottomNavigation.tsx` | Esconder ou simplificar para role `user` |
| `src/components/dashboard/AdminPanel.tsx` | Adicionar `user` como opcao no Select de roles |
| `src/components/dashboard/CreateUserDialog.tsx` | Adicionar `user` como opcao |

### 5. Novo Componente

| Arquivo | Descricao |
|---------|-----------|
| `src/components/dashboard/UserDashboard.tsx` | Pagina dedicada para role `user` que carrega automaticamente a entidade vinculada e exibe o detail page correspondente |

## Detalhes Tecnicos

### SQL da Migracao

```sql
-- Adicionar nova role
ALTER TYPE public.app_role ADD VALUE 'user';

-- Permitir que users vejam apenas suas entidades vinculadas (closers)
CREATE POLICY "Users can view linked closers"
  ON public.closers FOR SELECT
  USING (
    has_role(auth.uid(), 'user'::app_role)
    AND is_linked_to_entity(auth.uid(), 'closer', id)
  );

-- Permitir que users vejam apenas suas entidades vinculadas (sdrs)
CREATE POLICY "Users can view linked sdrs"
  ON public.sdrs FOR SELECT
  USING (
    has_role(auth.uid(), 'user'::app_role)
    AND is_linked_to_entity(auth.uid(), 'sdr', id)
  );

-- Permitir que users insiram metricas para suas entidades
CREATE POLICY "Users can insert metrics for linked closers"
  ON public.metrics FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'user'::app_role)
    AND is_linked_to_entity(auth.uid(), 'closer', closer_id)
    AND created_by = auth.uid()
  );

-- Permitir que users insiram metricas SDR para suas entidades
CREATE POLICY "Users can insert sdr_metrics for linked sdrs"
  ON public.sdr_metrics FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'user'::app_role)
    AND is_linked_to_entity(auth.uid(), 'sdr', sdr_id)
    AND created_by = auth.uid()
  );
```

### Logica do UserDashboard

O componente `UserDashboard` ira:
1. Buscar `user_entity_links` do usuario logado
2. Identificar se e Closer ou SDR
3. Renderizar o `CloserDetailPage` ou `SDRDetailPage` correspondente
4. Sem navegacao lateral - layout limpo e focado
5. Header simplificado com apenas o nome e botao de logout

### Mudanca no Index.tsx

```text
if (role === 'user') {
  return <UserDashboard />  // Layout dedicado sem sidebar
} else {
  return <Layout com Sidebar>  // Layout atual
}
```

### Select de Roles no Admin

Atualizar o dropdown de roles para incluir a opcao "Usuário" alem de Admin, Gerente e Visualizador.

