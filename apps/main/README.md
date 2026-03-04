# apps/main - Sistema Mae (Platform Shell)

O sistema mae e o **shell da plataforma Bethel**. Ele fornece o layout global, a navegacao entre servicos, a autenticacao e monta os micro-frontends nas rotas correspondentes.

## Responsabilidades

1. **Inicializar o Supabase** (singleton via `@bethel/shared-supabase`)
2. **Prover autenticacao** global via `AuthProvider` (`@bethel/shared-auth`)
3. **Layout da plataforma** (sidebar, header, bottom nav mobile)
4. **Roteamento** entre micro-frontends
5. **Controle de acesso** por role (filtra servicos visiveis na sidebar/home)

## Estrutura de Arquivos

```
apps/main/src/
├── App.tsx                      # Ponto de entrada: providers, rotas, lazy loading
├── main.tsx                     # Bootstrap React DOM
├── vite-env.d.ts
│
├── components/
│   ├── PlatformSidebar.tsx      # Sidebar com navegacao entre servicos
│   ├── PlatformHeader.tsx       # Header com menu hamburger + user info
│   ├── PlatformBottomNav.tsx    # Bottom nav mobile
│   └── ProtectedRoute.tsx       # Wrapper de rota autenticada
│
├── layouts/
│   └── PlatformLayout.tsx       # Layout master: sidebar + header + <Outlet/>
│
├── pages/
│   ├── HomePage.tsx             # Pagina inicial: cards de servicos disponveis
│   ├── AuthPage.tsx             # Login/cadastro
│   └── NotFoundPage.tsx         # 404
│
└── styles/
    └── index.css                # Tailwind base + customizacoes
```

## Rotas

| Rota | Componente | Descricao |
|------|-----------|-----------|
| `/auth` | `AuthPage` | Login/cadastro (publica) |
| `/` | `HomePage` | Pagina inicial com cards de servicos |
| `/monetizacao/*` | `@bethel/monetizacao` → `MonetizacaoRoutes` | Micro-frontend de monetizacao |
| `/sdr/*` | `SDRPlaceholder` | Micro-frontend SDR (em desenvolvimento) |
| `*` | `NotFoundPage` | 404 |

## Servicos Registrados

Os servicos sao definidos em `PlatformSidebar.tsx` e `HomePage.tsx`:

| Servico | Path | Roles Permitidas | Status |
|---------|------|-------------------|--------|
| Inicio | `/` | todos | ativo |
| Monetizacao | `/monetizacao` | admin, lider, closer | ativo |
| Bethel SDR | `/sdr` | admin, lider, sdr | ativo (placeholder) |

### Como Adicionar um Novo Servico

1. Criar o servico em `services/novo-servico/` com um `module.tsx` exportando rotas
2. Adicionar a dependencia no `package.json` do `apps/main`:
   ```json
   "@bethel/novo-servico": "*"
   ```
3. Lazy-load no `App.tsx`:
   ```tsx
   const NovoServico = React.lazy(
     () => import("@bethel/novo-servico").then((m) => ({ default: m.NovoServicoRoutes }))
   );
   ```
4. Adicionar a rota no `App.tsx`:
   ```tsx
   <Route path="novo-servico/*" element={<React.Suspense fallback={...}><NovoServico /></React.Suspense>} />
   ```
5. Registrar na sidebar (`PlatformSidebar.tsx`) e na home (`HomePage.tsx`)

## Dependencias Compartilhadas

| Package | Uso |
|---------|-----|
| `@bethel/shared-auth` | `AuthProvider`, `useAuth()`, roles, permissoes |
| `@bethel/shared-supabase` | `createSupabaseClient()`, `getSupabaseClient()` |
| `@bethel/shared-ui` | Componentes UI base (Button, Card, etc.) |
| `@bethel/monetizacao` | Micro-frontend montado em `/monetizacao/*` |

## Layout

```
┌──────────────────────────────────────────────┐
│ PlatformHeader (menu hamburger | user info)  │
├─────────┬────────────────────────────────────┤
│         │                                    │
│ Platform│         <Outlet />                 │
│ Sidebar │    (HomePage ou micro-frontend)    │
│         │                                    │
│ - Inicio│                                    │
│ - Monet.│                                    │
│ - SDR   │                                    │
│         │                                    │
├─────────┴────────────────────────────────────┤
│       PlatformBottomNav (mobile only)        │
└──────────────────────────────────────────────┘
```

## Controle de Acesso

O sistema mae filtra servicos na sidebar/home baseado no `role` do usuario:

```tsx
const visibleServices = services.filter((service) => {
  if (!service.allowedRoles) return true;  // sem restricao = todos veem
  if (!role) return false;
  return service.allowedRoles.includes(role);
});
```

Cada micro-frontend gerencia suas **proprias permissoes internas** (ex: admin vs manager vs closer dentro da monetizacao).

## Desenvolvimento

```bash
# Da raiz do monorepo
npm run dev            # Roda apps/main na porta padrao

# Diretamente
cd apps/main && npm run dev
```

## Build

```bash
npm run build          # Da raiz
cd apps/main && npm run build  # Direto
```

## Variaveis de Ambiente

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```
