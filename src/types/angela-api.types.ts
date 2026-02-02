/**
 * Tipos para a API do Dashboard Agente Angela (CSM - Pós-Venda e Sucesso do Cliente).
 * Banco: tecnologia.attraveiculos (regua_relacionamento, angela_ai_analysis, angela_chat_histories).
 */

// ============================================================================
// KPI PULSE - PULSO GERAL DA OPERAÇÃO
// ============================================================================

/**
 * Interface para o "pulso" geral da operação Angela
 *
 * Representa as métricas agregadas de alto nível que indicam
 * a saúde geral da operação de pós-venda e sucesso do cliente.
 *
 * @example
 * const pulse = await getAngelaKpiPulse();
 * if (pulse) {
 *   const taxaSentimentoPositivo = (pulse.sentimento_positivo / pulse.total_atendimentos) * 100;
 *   const taxaProblemas = (pulse.problemas_detectados / pulse.total_atendimentos) * 100;
 * }
 */
export interface AngelaKpiPulse {
  /** Volume total da base analisada (interações processadas) */
  total_atendimentos: number;

  /** Número de clientes com sentimento classificado como positivo/satisfeito */
  sentimento_positivo: number;

  /** Número de clientes com sentimento classificado como negativo/insatisfeito */
  sentimento_negativo: number;

  /** Número de interações com tag de "problema" identificado pela IA */
  problemas_detectados: number;
}

// ============================================================================
// URGENT LIST - LISTA DE INCÊNDIOS (CLIENTES QUE PRECISAM DE ATENÇÃO IMEDIATA)
// ============================================================================

/**
 * Interface para um lead urgente na "Lista de Incêndios" da Angela
 *
 * Representa clientes que precisam de atenção imediata:
 * - Insatisfeitos (sentimento negativo)
 * - Com problemas relatados
 * - Solicitando retorno/follow-up
 *
 * Os leads são ordenados por gravidade (mais críticos primeiro).
 *
 * @example
 * const urgentList = await getAngelaUrgentList();
 * if (urgentList) {
 *   const criticos = urgentList.filter(lead => lead.precisa_verificacao);
 *   const insatisfeitos = urgentList.filter(lead =>
 *     lead.sentimento?.toLowerCase().includes('negativo')
 *   );
 * }
 *
 * @ui_hints
 * - Se `precisa_verificacao === true`: exibir Badge Vermelho ("Verificar Follow-up")
 * - Se `sentimento` contiver "Negativo": linha com fundo avermelhado suave (bg-red-50)
 * - Ordenar por gravidade: precisa_verificacao > sentimento negativo > problema_relatado
 */
export interface AngelaUrgentLead {
  /** ID único do lead/interação */
  id: number;

  /** Nome do cliente */
  nome: string;

  /** Número de WhatsApp do cliente */
  whatsapp: string;

  /** Loja/concessionária associada ao cliente */
  loja: string | null;

  /** Classificação de sentimento pela IA (Ex: "Negativo", "Positivo", "Neutro") */
  sentimento: string | null;

  /** Descrição do problema relatado pelo cliente */
  problema_relatado: string | null;

  /** Resumo da conversa gerado pela IA */
  resumo: string | null;

  /** Data da última interação (formato ISO) */
  data_interacao: string;

  /**
   * CRÍTICO: Se true, o cliente está na lista de "leads-verificar-followUp"
   * Indica que precisa de atenção humana urgente
   */
  precisa_verificacao: boolean;
}

// ============================================================================
// SENTIMENT TIMELINE - EVOLUÇÃO TEMPORAL DE SENTIMENTOS
// ============================================================================

/**
 * Interface para um ponto na timeline de sentimentos da Angela
 *
 * Representa a evolução diária do volume de atendimentos e a proporção
 * de sentimentos (Positivo vs Negativo) nos últimos 30 dias.
 *
 * @example
 * const timeline = await getAngelaSentimentTimeline();
 * if (timeline) {
 *   const totalPositivos = timeline.reduce((sum, p) => sum + p.positivos, 0);
 *   const totalNegativos = timeline.reduce((sum, p) => sum + p.negativos, 0);
 *   const taxaSatisfacao = (totalPositivos / (totalPositivos + totalNegativos)) * 100;
 * }
 *
 * @ui_hints (Recharts)
 * - Tipo de gráfico: AreaChart ou BarChart empilhado/agrupado
 * - Série `positivos`: cor verde (#22c55e ou green-500)
 * - Série `negativos`: cor vermelha (#ef4444 ou red-500)
 * - Série `total`: pode ser linha sobreposta ou tooltip
 * - Eixo X: data formatada (DD/MM ou dia da semana)
 * - Eixo Y: quantidade de atendimentos
 */
export interface AngelaSentimentPoint {
  /** Data do ponto (formato YYYY-MM-DD) */
  data: string;

  /** Volume total de atendimentos no dia */
  total: number;

  /** Quantidade de atendimentos com sentimento "Positivo" */
  positivos: number;

  /** Quantidade de atendimentos com sentimento "Negativo" */
  negativos: number;
}

// ============================================================================
// PROBLEM STATS - ESTATÍSTICAS DE PROBLEMAS (TOP OFENSORES)
// ============================================================================

/**
 * Interface para estatística de problema na Angela
 *
 * Representa o ranking dos principais motivos de reclamação ou suporte,
 * ordenado por quantidade de ocorrências (Top 10).
 *
 * @example
 * const problems = await getAngelaProblemStats();
 * if (problems) {
 *   const topProblema = problems[0];
 *   console.log(`Principal problema: ${topProblema.problema} (${topProblema.total} ocorrências)`);
 * }
 *
 * @ui_hints (Recharts)
 * - Tipo de gráfico: BarChart com layout="vertical" (barras horizontais)
 * - Ordenar do maior para o menor (já vem ordenado do backend)
 * - Cores sugeridas: gradiente de vermelho (mais ocorrências = mais intenso)
 * - Ou cores categóricas distintas para cada tipo de problema
 * - Eixo Y: nome do problema
 * - Eixo X: quantidade de ocorrências
 * - Considerar adicionar % do total no tooltip
 */
export interface AngelaProblemStat {
  /** Nome da categoria do problema (ex: "Oficina", "Financeiro", "Entrega") */
  problema: string;

  /** Quantidade de ocorrências desta categoria */
  total: number;
}

// ============================================================================
// GOVERNANCE - GOVERNANÇA E SAÚDE TÉCNICA
// ============================================================================

/**
 * Interface para um log de alerta do sistema Angela
 *
 * Representa um registro de alerta técnico ou operacional
 * gerado pelo sistema de monitoramento.
 */
export interface AngelaAlertLog {
  /** Mensagem descritiva do alerta */
  alerta: string;

  /** Data/hora do alerta (formato ISO) */
  created_at: string;

  /** ID da sessão afetada (null se alerta geral do sistema) */
  sessionId: string | null;
}

/**
 * Interface para dados de governança e saúde técnica da Angela
 *
 * Representa métricas de performance do sistema e estabilidade da IA,
 * essenciais para monitoramento operacional.
 *
 * @example
 * const governance = await getAngelaGovernance();
 * if (governance) {
 *   if (governance.perda_contexto > 0) {
 *     showCriticalAlert('IA perdendo contexto em conversas!');
 *   }
 *   if (governance.fila_tecnica > 20) {
 *     showWarning('Sistema lento - fila de mensagens alta');
 *   }
 * }
 *
 * @ui_hints
 * - `perda_contexto > 0`: Alerta CRÍTICO vermelho (falha na lógica da IA)
 * - `fila_tecnica > 20`: Alerta WARNING amarelo (lentidão no disparo)
 * - `fila_tecnica > 50`: Alerta CRÍTICO vermelho (sistema sobrecarregado)
 * - `ultimos_alertas`: Exibir em lista/timeline com ícones por severidade
 */
export interface AngelaGovernanceData {
  /** Mensagens aguardando envio no buffer (fila técnica) */
  fila_tecnica: number;

  /** Quantidade de vezes que a IA perdeu contexto na conversa */
  perda_contexto: number;

  /** Lista dos últimos alertas do sistema */
  ultimos_alertas: AngelaAlertLog[];
}

