# Análise de Lacunas - Agentforce Command Center

## 1. Infraestrutura e DAL
- **Atual:** Conexões simples via Supabase em `agentClients.ts`.
- **Necessário:** Camada DAL multi-contexto isolada por contexto de negócio (tecnologia, devforaiagents, corretoraagente, tgvempreendimentos).
- **Ação:** Refatorar `getBrowserTenantClient` para suportar os contextos específicos do documento.

## 2. Command Center (Dashboard)
- **KPI Capital sob Gestão:**
  - **Atual:** Não existe.
  - **Necessário:** Soma de `tgv_parcela.valor_parcela` (Vitor) + (Leads Qualificados * R$ 120k).
- **Força de Trabalho Digital:**
  - **Atual:** Gráfico de performance simples.
  - **Necessário:** Gráfico de barras horizontal empilhado (Resolvido IA vs Escalado Humano).
- **Economia Gerada:**
  - **Atual:** Não existe.
  - **Necessário:** Cálculo (Leads Ativos * 10min * Custo/Min).
- **Liveness Log:**
  - **Atual:** Não existe.
  - **Necessário:** Widget ticker com eventos em tempo real.

## 3. Telas de Agente
- **Kanban:**
  - **Atual:** Kanban genérico.
  - **Necessário:** Mapeamento de status específico para Vendas/Mkt e Cobrança.
- **Detalhamento por Contexto:**
  - **Atual:** Visão padrão para todos.
  - **Necessário:** Campos específicos (ex: `last_message_ia` para Fernanda, `priority_score` para Alice, `Badge Sentimento` para Angela/Luis).

## 4. Governança e Drawer "O Cérebro"
- **Drawer:**
  - **Atual:** Não existe (ou é muito simples).
  - **Necessário:** Drawer lateral com 3 abas (Chat, Raciocínio JSON, Memória/Shadow CRM).
- **Sync CRM:**
  - **Atual:** Não existe.
  - **Necessário:** Indicador visual de sincronização com "CRM Vende Aí".
- **Tela de Governança:**
  - **Atual:** Não existe.
  - **Necessário:** Modal de Treinamento (Antes vs Depois).

## 5. Estrutura de Dados (Mock/Supabase)
- **Necessário:** Criar/Mapear tabelas: `leads_nao_convertidos_fase02`, `leads_frios`, `analise_interacoes`, `acompanhamento_leads`, `tgv_parcela`, `intervencao_humana`.
