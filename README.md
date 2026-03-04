# Bethel Platform

Plataforma de gestao comercial da Bethel, construida como monorepo com arquitetura de micro-frontends.

## Estrutura do Monorepo

```
bethel-platform/
├── apps/
│   └── main/                    # Sistema Mae (shell da plataforma)
├── services/
│   └── monetizacao/             # Micro-frontend de Monetizacao
├── packages/
│   ├── shared-auth/             # Autenticacao compartilhada (AuthProvider, hooks)
│   ├── shared-supabase/         # Cliente Supabase singleton
│   └── shared-ui/               # Componentes UI compartilhados
├── package.json                 # Workspaces root
└── SYSTEM_ANALYSIS.md           # Analise tecnica detalhada
```

## Visao Geral

| Parte | Descricao | Doc |
|-------|-----------|-----|
| **Sistema Mae** (`apps/main`) | Shell da plataforma: layout, rotas, sidebar, navegacao. Monta os micro-frontends. | [README](apps/main/README.md) |
| **Monetizacao** (`services/monetizacao`) | Dashboard de vendas: metricas, squads, closers, SDRs, CRM, agenda, relatorios. | [README](services/monetizacao/README.md) |
| **Shared Auth** (`packages/shared-auth`) | AuthProvider com RBAC, hooks de permissao, contexto de usuario. | - |
| **Shared Supabase** (`packages/shared-supabase`) | Factory singleton do cliente Supabase. | - |
| **Shared UI** (`packages/shared-ui`) | Componentes base (Button, Card, etc.) compartilhados entre apps. | - |

## Stack Tecnologico

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Radix UI + Tailwind CSS |
| State/Cache | TanStack React Query |
| Roteamento | React Router DOM v6 |
| Backend/DB | Supabase (PostgreSQL + Auth + Edge Functions + Realtime) |
| Graficos | Recharts |
| Validacao | Zod + React Hook Form |
| PWA | vite-plugin-pwa (Workbox) |
| Monorepo | npm workspaces |

## Como Rodar

### Pre-requisitos
- Node.js >= 18
- npm >= 9

### Instalacao

```bash
# Instalar todas as dependencias (root + workspaces)
npm install
```

### Desenvolvimento

```bash
# Rodar o sistema mae (inclui monetizacao como dependencia)
npm run dev

# Rodar monetizacao standalone (desenvolvimento isolado)
npm run dev:monetizacao
```

### Build

```bash
# Build do sistema mae
npm run build

# Build da monetizacao standalone
npm run build:monetizacao

# Build de todos os workspaces
npm run build:all
```

### Testes

```bash
npm test
```

## Variaveis de Ambiente

Crie um `.env` ou `.env.local` nos workspaces que precisam de acesso ao Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

## Arquitetura de Micro-frontends

O sistema mae (`apps/main`) atua como **shell** que:
1. Inicializa o Supabase client (singleton)
2. Fornece autenticacao global via `AuthProvider`
3. Define o layout da plataforma (sidebar, header, bottom nav)
4. Monta micro-frontends via lazy loading nas rotas

Cada micro-frontend (ex: `services/monetizacao`) pode rodar:
- **Integrado**: importado como modulo pelo sistema mae em `/monetizacao/*`
- **Standalone**: rodando `npm run dev:monetizacao` para desenvolvimento isolado

```
Browser
  └── apps/main (Shell)
        ├── PlatformLayout (sidebar + header + bottom nav)
        ├── /                  → HomePage
        ├── /monetizacao/*     → @bethel/monetizacao (MonetizacaoRoutes)
        ├── /sdr/*             → (em desenvolvimento)
        └── /auth              → AuthPage
```

## Modelo de Permissoes (RBAC)

| Papel | Acesso |
|-------|--------|
| **admin** | Tudo. CRUD de usuarios, squads, metricas, configuracoes. |
| **manager** | Controlado por `module_permissions`. So ve modulos atribuidos. |
| **viewer** | Leitura nos modulos atribuidos. |
| **user** | Dashboard individual. Ve apenas dados da entidade vinculada (closer/SDR). |
| **lider** | Tudo exceto painel admin. |
| **closer** | Agenda + Disponibilidade apenas. |

## Documentacao Adicional

- [SYSTEM_ANALYSIS.md](SYSTEM_ANALYSIS.md) - Analise tecnica completa (tabelas, RPCs, RLS, Edge Functions)
- [apps/main/README.md](apps/main/README.md) - Documentacao do sistema mae
- [services/monetizacao/README.md](services/monetizacao/README.md) - Documentacao do servico de monetizacao
