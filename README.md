# Command Center de IA Comercial

Painel executivo de governança e performance para monitoramento de agentes autônomos de vendas e pós-vendas.

## Stack Tecnológica

- **Frontend:** Next.js 16+ (App Router) + React 19
- **Estilização:** Tailwind CSS
- **Charts:** Recharts
- **Ícones:** Lucide React
- **Backend:** Supabase (PostgreSQL + Auth)
- **State Management:** Zustand

## Funcionalidades

### Dashboard Principal
- 5 KPIs críticos: Leads Ativos, Receita Pipeline, Receita Recuperada, LTV Médio, Leads Salvos OTTO
- Gráfico de evolução de leads (30 dias)
- Funil de conversão
- Performance comparativa entre agentes

### Agentes (8 agentes autônomos)
- **Luís** - SDR Inbound (Speed to Lead, Taxa de Resposta)
- **Alice** - BDR Outbound (Prospecções, Reuniões Agendadas)
- **Iza** - CSM (Customer Success)
- **Fernanda** - Win-back/Reativação (Leads Reativados, CAC Evitado)
- **Ângela** - Suporte
- **Victor** - Financeiro/Cobrança (Inadimplências, Taxa de Recuperação)
- **Sales Pilot** - Agente especializado
- **OTTO** - Governança e orquestração

### Painel OTTO
- Monitoramento de leads estagnados
- Intervenções em tempo real
- Taxa de sucesso pós-transbordo
- Receita salva

## Instalação

```bash
npm install
```

## Desenvolvimento

### Opção 1: Comando direto
```bash
npm run dev
```

### Opção 2: Script helper
```bash
./scripts/dev.sh
```

Acesse [http://localhost:3000](http://localhost:3000)

## Credenciais Demo

- **Email:** lorrayne@dexidigital.com.br
- **Senha:** demo2024

## Build de Produção

### Opção 1: Comandos diretos
```bash
npm run build
npm start
```

### Opção 2: Script helper
```bash
./scripts/build.sh
```

## Configuração Supabase (Produção)

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute as migrations em `supabase/migrations/`
3. Execute o seed em `supabase/seed.sql`
4. Configure as variáveis de ambiente:

```env
NEXT_PUBLIC_SUPABASE_URL=sua-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-key
NEXT_PUBLIC_DEMO_MODE=false
```

## Estrutura de Pastas

```
src/
├── app/                    # Rotas Next.js App Router
│   ├── (auth)/login/      # Página de login
│   └── (dashboard)/       # Dashboard protegido
│       ├── agentes/[id]/  # Performance por agente
│       ├── leads/         # Lista de leads
│       └── otto/          # Painel OTTO
├── components/
│   ├── charts/            # Gráficos (Line, Bar, Funnel)
│   ├── layout/            # Sidebar, Header, DemoBanner
│   ├── metrics/           # KPI Cards
│   └── ui/                # Componentes base
├── lib/
│   ├── mock-data/         # Dados demo gerados
│   └── supabase/          # Cliente Supabase
├── stores/                # Zustand stores
└── types/                 # TypeScript types
```

## Checklist de Validação

- [x] Schema Supabase com RLS
- [x] 8 agentes cadastrados
- [x] Sistema de eventos
- [x] 5 KPIs no dashboard
- [x] Páginas de agentes implementadas
- [x] Painel OTTO funcional
- [x] Login com email/senha
- [x] Modo demo com dados realistas
- [x] Dark mode funcionando
- [x] Responsivo mobile/tablet/desktop
- [x] TypeScript sem erros
- [x] Build de produção sem warnings
