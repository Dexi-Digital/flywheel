# Instruções para Conclusão da Implementação

Implementei a maior parte das especificações técnicas do **Agentforce Command Center**. Abaixo estão os detalhes do que foi feito e o que você precisa fazer para finalizar.

## O que foi implementado:

1.  **Visão Global (Dashboard):**
    *   Novos KPIs: **Capital sob Gestão Agêntica** (Top-Line) e **Economia Gerada** (Bottom-Line).
    *   **Liveness Log:** Widget ticker em tempo real no topo do dashboard mostrando a atividade dos agentes.
    *   **Força de Trabalho Digital:** Gráfico de barras horizontal empilhado comparando resoluções por IA vs. escalonamento humano.

2.  **Telas de Agente:**
    *   **Kanban Customizado:** Fluxos específicos para Vendas/Mkt e Cobrança conforme a especificação.
    *   **O Cérebro (Intelligence Drawer):** Drawer lateral com abas para Chat, Raciocínio JSON e Memória (Shadow CRM Sync).

3.  **Governança:**
    *   **Ação Treinar:** Modal de monitoramento de qualidade (Antes vs. Depois) na página do OTTO.

4.  **Infraestrutura:**
    *   Camada DAL preparada para multi-contexto (tecnologia, devforaiagents, etc.).
    *   Scripts SQL prontos para as novas tabelas especificadas.

## O que você precisa fazer:

### 1. Banco de Dados (Supabase)
Como o sistema é Read-Only por segurança, eu não posso criar as tabelas diretamente no seu banco de dados.
*   Acesse o painel do Supabase para cada um dos seus projetos.
*   Execute o script SQL que deixei em: `supabase/migrations/002_specification_tables.sql`.

### 2. Variáveis de Ambiente
Atualize seu arquivo `.env.local` com as URLs e chaves de cada contexto conforme o novo modelo em `.env.example`. Certifique-se de adicionar as chaves para os novos agentes se necessário.

### 3. Conexão Real (Services)
Atualmente, as métricas do Dashboard usam dados simulados baseados nas fórmulas da especificação. Para torná-las 100% reais:
*   No arquivo `src/services/angela.service.ts` (e nos novos serviços que você criar), você deve implementar as queries SQL reais apontando para as tabelas que você criou no passo 1.
*   Exemplo de fórmula a implementar: `Soma de tgv_parcela.valor_parcela onde status = 'em aberto'`.

### 4. Deploy
Como você prefere que o dashboard seja um site permanente:
*   Recomendo o deploy na **Vercel** ou **Netlify**, conectando este repositório GitHub.
*   Não esqueça de configurar todas as variáveis de ambiente no painel do provedor de deploy.

As alterações estão prontas na branch `feature/supabase-integration`.
