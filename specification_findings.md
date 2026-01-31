# Achados da Especificação Técnica - Agentforce Command Center

## 1. Visão Geral
- **Objetivo:** Motor de Defesa de Patrimônio e Aceleração de Receita.
- **Premissas:** Read-Only (SELECT apenas), Consolidação no Back-end, Escalabilidade.

## 2. Estrutura de Conexões (DAL)
O sistema deve gerenciar pools de conexões independentes por contexto:
1. **tecnologia.attraveiculos:** Fernanda (Vendas), Alice (BDR). Tabelas: `leads_nao_convertidos_fase02`, `leads_frios`, `memoria`, `intervencao_humana`, `curadoria`.
2. **devforaiagents:** Angela (Pós-Venda), Luis (CRM). Tabelas: `analise_interacoes`, `Leads CRM`, `ai_chat_sessions`.
3. **corretoraagente:** Iza (Marketing). Tabelas: `leads`, `FollowUp_Control`, `memoria`, `intervencao_humana`.
4. **tgvempreendimentos:** Vitor (Cobrança). Tabelas: `acompanhamento_leads`, `tgv_parcela`, `controle_disparo`.

## 3. Módulo 1: Command Center (Visão Global)
- **KPI 1.1: Capital sob Gestão Agêntica:** (Recuperação Ativa de Vitor: soma `tgv_parcela.valor_parcela` em aberto) + (Pipeline de Vendas/Mkt: Count Leads Qualificados * Ticket Médio R$ 120k).
- **KPI 1.2: Força de Trabalho Digital:** Gráfico horizontal empilhado. Resolvido pela IA (Sessões) vs Escalado para Humano (`intervencao_humana` + `solicitou_retorno`).
- **KPI 1.3: Economia Gerada:** (Total Leads Ativos * 10min) * Custo/Min Humano.
- **1.4 Liveness Log:** Widget Ticker com eventos em tempo real (`created_at` recente). Formato: `[Agente] [Ação] [Local/Lead] - [Tempo]`.

## 4. Módulo 2: Telas de Agente
- **2.1 Kanban:** 
  - Vendas/Mkt: Novo -> Em Contato -> Qualificado -> Humano Acionado.
  - Cobrança: Em Aberto -> Em Negociação -> Promessa de Pagamento -> Recuperado.
- **2.2 Detalhamento:**
  - **Fernanda:** Fonte `leads_nao_convertidos_fase02`. Insight: `last_message_ia`. Ação: "Assumir".
  - **Alice:** Fonte `leads_frios`. Insight: `priority_score`.
  - **Angela:** Fonte `analise_interacoes`. Visual: Badge Sentimento.
  - **Luis:** Fonte `Leads CRM`. Visual: Status Sessão + Sentimento.
  - **Iza:** Fonte `leads`. Badge: Decisão Autônoma (`FollowUp_Control.decisao_IA`).
  - **Vitor:** Fonte `acompanhamento_leads`. Visual: Soma da dívida + Dias atraso.

## 5. Módulo 3: Governança & Drawer
- **3.1 Governança:** Ação Treinar (Modal Antes e Depois).
- **3.2 Drawer "O Cérebro":**
  - Aba 1: Chat (Estilo WhatsApp).
  - Aba 2: Raciocínio (JSON `internal_reasoning`).
  - Aba 3: Memória & Shadow CRM (Dados estruturados `memoria_lead` + Indicador "Sincronizado com CRM Vende Aí").

## 6. Checklist de Implementação
- [ ] Camada DAL multi-contexto.
- [ ] Queries Read-Only.
- [ ] KPI Capital sob Gestão.
- [ ] Liveness Log.
- [ ] Economia Gerada.
- [ ] Kanban por agente.
- [ ] Drawer com 3 abas.
- [ ] Feature Sync CRM.
