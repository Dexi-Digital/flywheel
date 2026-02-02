import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentService } from "@/types/service.type";
import { getBrowserTenantClient } from "@/lib/supabase/agentClients";
import { Lead, LeadOrigin, Event, EventType } from "@/types/database.types";
import { getTenantConfig } from "@/lib/supabase/agents";
import { buildAgentCommon } from "./common";
import type {
  AngelaKpiPulse,
  AngelaUrgentLead,
  AngelaSentimentPoint,
  AngelaProblemStat,
  AngelaGovernanceData,
  AngelaAlertLog,
} from "@/types/angela-api.types";

function toStr(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  return String(v);
}

function toNum(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const num = Number(v);
  return isNaN(num) ? 0 : num;
}

// Extrai valor da descrição do alerta (formato: "Carro: X, Valor: R$ Y")
function extractValorFromDescricao(descricao: string | null | undefined): number {
  if (!descricao) return 0;

  const match = descricao.match(/valor[:\s]*r?\$?\s*([\d.,]+)/i);
  if (match && match[1]) {
    const valorStr = match[1].replace(/\./g, '').replace(',', '.');
    return parseFloat(valorStr) || 0;
  }
  return 0;
}

async function fetchAngelaData(sb: SupabaseClient) {
  // 1. Leads ativos: regua_relacionamento onde ativo == true
  const leadsAtivosPromise = sb
    .from("regua_relacionamento")
    .select("*")
    .eq("ativo", true)
    .order("created_at", { ascending: false })
    .limit(100);

  // 2. Leads transferidos (alertas): logs_alertas_enviados
  const alertasPromise = sb
    .from("logs_alertas_enviados")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  // 3. Leads transferidos (intervenção): intervencao_humana
  const intervencaoPromise = sb
    .from("intervencao_humana")
    .select("*")
    .order("date_time", { ascending: false })
    .limit(100);

  // 4. Análises de IA (sentimento, problemas, oportunidades)
  const analysisPromise = sb
    .from("angela_ai_analysis")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  // 5. Histórico de chat
  const chatPromise = sb
    .from("angela_chat_histories")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  // Aguardar todas em paralelo
  const [leadsAtivosRes, alertasRes, intervencaoRes, analysisRes, chatRes] = await Promise.all([
    leadsAtivosPromise,
    alertasPromise,
    intervencaoPromise,
    analysisPromise,
    chatPromise,
  ]);

  if (leadsAtivosRes.error) console.warn(`regua_relacionamento: ${leadsAtivosRes.error.message}`);
  if (alertasRes.error) console.warn(`logs_alertas_enviados: ${alertasRes.error.message}`);
  if (intervencaoRes.error) console.warn(`intervencao_humana: ${intervencaoRes.error.message}`);
  if (analysisRes.error) console.warn(`angela_ai_analysis: ${analysisRes.error.message}`);
  if (chatRes.error) console.warn(`angela_chat_histories: ${chatRes.error.message}`);

  const leadsAtivos = (leadsAtivosRes.data ?? []) as Record<string, any>[];
  const alertas = (alertasRes.data ?? []) as Record<string, any>[];
  const intervencoes = (intervencaoRes.data ?? []) as Record<string, any>[];
  const analysis = (analysisRes.data ?? []) as Record<string, any>[];
  const chat = (chatRes.data ?? []) as Record<string, any>[];

  // Buscar dados completos dos leads transferidos via JOIN manual
  const sessionIdsAlertas = alertas.map(a => a.sessionId).filter(Boolean);
  const sessionIdsIntervencao = intervencoes.map(i => i.sessionId).filter(Boolean);
  const allSessionIds = [...new Set([...sessionIdsAlertas, ...sessionIdsIntervencao])];

  let leadsTransferidos: Record<string, any>[] = [];
  if (allSessionIds.length > 0) {
    const { data, error } = await sb
      .from("regua_relacionamento")
      .select("*")
      .in("sessionId", allSessionIds);

    if (error) {
      console.warn(`regua_relacionamento (transferidos): ${error.message}`);
    } else {
      leadsTransferidos = data ?? [];
    }
  }

  // Criar mapa de sessionId -> lead para facilitar JOIN
  const leadsMap = new Map<string, Record<string, any>>();
  [...leadsAtivos, ...leadsTransferidos].forEach(lead => {
    if (lead.sessionId) {
      leadsMap.set(lead.sessionId, lead);
    }
  });

  return {
    leadsAtivos,
    alertas,
    intervencoes,
    analysis,
    chat,
    leadsMap,
  };
}

function normalizeLead(row: Record<string, any>, agentId: string, valorPotencial: number = 0): Lead {
  const createdAt = toStr(row.created_at) ?? new Date().toISOString();
  const ultimaInteracao = toStr(row.updated_at) ?? toStr(row.last_interaction) ?? createdAt;

  return {
    id: String(row.id ?? row.sessionId),
    nome: toStr(row.nome) ?? toStr(row.name) ?? "Sem nome",
    email: toStr(row.email) ?? "",
    whatsapp: toStr(row.whatsapp) ?? toStr(row.telefone),
    telefone: toStr(row.telefone),
    empresa: toStr(row.loja) ?? toStr(row.empresa),
    origem: "Inbound" as LeadOrigin,
    status: row.ativo === true ? "EM_CONTATO" : "NOVO",
    agente_atual_id: agentId,
    valor_potencial: valorPotencial,
    ultima_interacao: ultimaInteracao,
    created_at: createdAt,
    updated_at: ultimaInteracao,
  };
}

function normalizeEvent(
  alerta: Record<string, any>,
  lead: Record<string, any> | undefined,
  agentId: string,
  tipo: EventType
): Event {
  const timestamp = toStr(alerta.created_at) ?? toStr(alerta.date_time) ?? new Date().toISOString();
  const leadId = String(lead?.id ?? lead?.sessionId ?? alerta.sessionId ?? "unknown");

  // Extrair valor da descrição se disponível
  const valor = extractValorFromDescricao(alerta.descricao);

  return {
    id: String(alerta.id),
    tipo,
    lead_id: leadId,
    agente_id: agentId,
    metadata: {
      motivo: toStr(alerta.alerta) ?? toStr(alerta.block) ?? "Transferência",
      valor: valor > 0 ? valor : undefined,
      sessionId: toStr(alerta.sessionId),
      descricao: toStr(alerta.descricao),
    },
    timestamp,
  };
}

export const angelaService: AgentService = {
  id: "agent-angela",

  async getAgent(agentId: string) {
    const cfg = getTenantConfig(agentId);
    const sb = getBrowserTenantClient(agentId, cfg);

    const data = await fetchAngelaData(sb);

    // Normalizar leads ativos
    const leadsAtivos = data.leadsAtivos.map((row) => {
      // Tentar extrair valor se houver descrição
      const valor = extractValorFromDescricao(row.descricao);
      return normalizeLead(row, agentId, valor);
    });

    // Criar eventos de alertas (leads transferidos)
    const eventosAlertas: Event[] = data.alertas.map((alerta) => {
      const lead = data.leadsMap.get(alerta.sessionId);
      return normalizeEvent(alerta, lead, agentId, "LEAD_TRANSBORDADO");
    });

    // Criar eventos de intervenção humana
    const eventosIntervencao: Event[] = data.intervencoes.map((intervencao) => {
      const lead = data.leadsMap.get(intervencao.sessionId);
      return normalizeEvent(intervencao, lead, agentId, "INTERVENCAO_OTTO");
    });

    const allEvents = [...eventosAlertas, ...eventosIntervencao];

    // MÉTRICAS ESPECÍFICAS DA ÂNGELA (CSM - Customer Success Manager)

    // 1. Resgate de inativos (>6 meses sem contato)
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
    const leadsInativos = data.leadsAtivos.filter(l => {
      const lastInteraction = new Date(l.updated_at || l.created_at);
      return lastInteraction < seisMesesAtras;
    }).length;
    const taxaResgateInativos = data.leadsAtivos.length > 0 ?
      (leadsInativos / data.leadsAtivos.length) * 100 : 0;

    // 2. Análise de satisfação (sentimento)
    const satisfacaoPositiva = data.analysis.filter(a =>
      a.sentimento && (a.sentimento.toLowerCase().includes('positivo') || a.sentimento.toLowerCase().includes('satisfeito'))
    ).length;
    const satisfacaoNegativa = data.analysis.filter(a =>
      a.sentimento && (a.sentimento.toLowerCase().includes('negativo') || a.sentimento.toLowerCase().includes('insatisfeito'))
    ).length;
    const satisfacaoMedia = data.analysis.length > 0 ?
      ((satisfacaoPositiva - satisfacaoNegativa) / data.analysis.length) * 100 : 0;

    // 3. Detecção de churn (problemas identificados)
    const alertasChurn = data.analysis.filter(a =>
      a.problema && (
        a.problema.toLowerCase().includes('cancelamento') ||
        a.problema.toLowerCase().includes('insatisfação') ||
        a.problema.toLowerCase().includes('reclamação')
      )
    ).length;

    // 4. Oportunidades de upgrade
    const oportunidadesUpgrade = data.analysis.filter(a =>
      a.problema && (
        a.problema.toLowerCase().includes('upgrade') ||
        a.problema.toLowerCase().includes('expansão') ||
        a.problema.toLowerCase().includes('crescimento')
      )
    ).length;

    // 5. Visitas presenciais agendadas (via chat)
    const visitasAgendadas = data.chat.filter(c =>
      c.message && (
        c.message.toLowerCase().includes('agendar') ||
        c.message.toLowerCase().includes('visita') ||
        c.message.toLowerCase().includes('café na loja')
      )
    ).length;

    // Calcular métricas gerais
    const leadsTransferidos = eventosAlertas.length;
    const intervencoes = eventosIntervencao.length;
    const valorGerado = allEvents.reduce((sum, e) => sum + (e.metadata.valor ?? 0), 0);

    console.log(`[Angela CSM] Leads Ativos: ${leadsAtivos.length}, Inativos: ${leadsInativos}, ` +
      `Satisfação: ${satisfacaoMedia.toFixed(1)}%, Alertas Churn: ${alertasChurn}, Visitas: ${visitasAgendadas}`);

    return buildAgentCommon(agentId, "Ângela", leadsAtivos, allEvents, {
      tipo: 'CSM', // CORREÇÃO: Angela é CSM, não SDR
      metricas_agregadas: {
        leads_ativos: leadsAtivos.length,
        conversoes: visitasAgendadas,
        receita_total: valorGerado,
        disparos_hoje: allEvents.length,
        leads_transferidos: leadsTransferidos,
        intervencoes_humanas: intervencoes,
        leads_inativos: leadsInativos,
        taxa_resgate_inativos: taxaResgateInativos,
        satisfacao_media: satisfacaoMedia,
        satisfacao_positiva: satisfacaoPositiva,
        satisfacao_negativa: satisfacaoNegativa,
        alertas_churn: alertasChurn,
        oportunidades_upgrade: oportunidadesUpgrade,
        visitas_agendadas: visitasAgendadas,
      },
    });
  },
};

// ============================================================================
// KPI PULSE - PULSO GERAL DA OPERAÇÃO
// ============================================================================

/**
 * Busca o "pulso" geral da operação Angela via RPC
 *
 * @description Chama a função Postgres `get_angela_kpi_pulse` que retorna
 * as métricas agregadas de alto nível da operação de pós-venda.
 *
 * @returns Promise<AngelaKpiPulse | null> - Objeto com as métricas ou null em caso de erro
 *
 * @example
 * const pulse = await getAngelaKpiPulse();
 * if (pulse) {
 *   const taxaSentimentoPositivo = (pulse.sentimento_positivo / pulse.total_atendimentos) * 100;
 *   const taxaProblemas = (pulse.problemas_detectados / pulse.total_atendimentos) * 100;
 * }
 */
export async function getAngelaKpiPulse(): Promise<AngelaKpiPulse | null> {
  try {
    // Obter configuração e cliente Supabase para a Angela
    const cfg = getTenantConfig('agent-angela');
    const sb = getBrowserTenantClient('agent-angela', cfg);

    // Chamar a função RPC do Supabase
    // POST https://<supabase_url>/rest/v1/rpc/get_angela_kpi_pulse
    const { data, error } = await sb.rpc('get_angela_kpi_pulse');

    // Tratamento de erro do Supabase
    if (error) {
      console.error('[Angela KPI Pulse] Erro ao buscar KPIs:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    // Normalizar resposta: pode ser objeto único ou array
    // Se for array, pega o primeiro elemento
    let rawData: Record<string, unknown>;
    if (Array.isArray(data)) {
      if (data.length === 0) {
        console.warn('[Angela KPI Pulse] RPC retornou array vazio');
        return null;
      }
      rawData = data[0];
    } else if (data && typeof data === 'object') {
      rawData = data as Record<string, unknown>;
    } else {
      console.warn('[Angela KPI Pulse] Formato de resposta inesperado:', typeof data);
      return null;
    }

    // Validar e extrair campos com valores padrão seguros
    const pulse: AngelaKpiPulse = {
      total_atendimentos: Number(rawData.total_atendimentos) || 0,
      sentimento_positivo: Number(rawData.sentimento_positivo) || 0,
      sentimento_negativo: Number(rawData.sentimento_negativo) || 0,
      problemas_detectados: Number(rawData.problemas_detectados) || 0,
    };

    // Log para debug
    console.log('[Angela KPI Pulse] KPIs carregados:', {
      total_atendimentos: pulse.total_atendimentos,
      sentimento_positivo: pulse.sentimento_positivo,
      sentimento_negativo: pulse.sentimento_negativo,
      problemas_detectados: pulse.problemas_detectados,
      taxa_sentimento_positivo: pulse.total_atendimentos > 0
        ? `${((pulse.sentimento_positivo / pulse.total_atendimentos) * 100).toFixed(1)}%`
        : 'N/A',
      taxa_problemas: pulse.total_atendimentos > 0
        ? `${((pulse.problemas_detectados / pulse.total_atendimentos) * 100).toFixed(1)}%`
        : 'N/A',
    });

    return pulse;
  } catch (err) {
    // Tratamento de exceções não esperadas
    console.error('[Angela KPI Pulse] Exceção ao buscar KPIs:', err);
    return null;
  }
}

// ============================================================================
// URGENT LIST - LISTA DE INCÊNDIOS (CLIENTES QUE PRECISAM DE ATENÇÃO IMEDIATA)
// ============================================================================

/**
 * Busca a lista de clientes urgentes ("Lista de Incêndios") via RPC
 *
 * @description Chama a função Postgres `get_angela_urgent_list` que retorna
 * os clientes que precisam de atenção imediata, ordenados por gravidade.
 *
 * Critérios de urgência (em ordem de prioridade):
 * 1. precisa_verificacao = true (cliente na lista de follow-up pendente)
 * 2. sentimento = "Negativo" (cliente insatisfeito)
 * 3. problema_relatado não nulo (cliente com problema identificado)
 *
 * @returns Promise<AngelaUrgentLead[] | null> - Array de leads urgentes ou null em caso de erro
 *
 * @example
 * const urgentList = await getAngelaUrgentList();
 * if (urgentList && urgentList.length > 0) {
 *   const criticos = urgentList.filter(lead => lead.precisa_verificacao);
 *   console.log(`${criticos.length} clientes precisam de verificação urgente`);
 * }
 *
 * @ui_hints
 * - Se `precisa_verificacao === true`: exibir Badge Vermelho ("Verificar Follow-up")
 * - Se `sentimento` contiver "Negativo": linha com fundo avermelhado suave (bg-red-50)
 * - Limite de 50 registros retornados pelo backend
 */
export async function getAngelaUrgentList(): Promise<AngelaUrgentLead[] | null> {
  try {
    // Obter configuração e cliente Supabase para a Angela
    const cfg = getTenantConfig('agent-angela');
    const sb = getBrowserTenantClient('agent-angela', cfg);

    // Chamar a função RPC do Supabase
    // POST https://<supabase_url>/rest/v1/rpc/get_angela_urgent_list
    const { data, error } = await sb.rpc('get_angela_urgent_list');

    // Tratamento de erro do Supabase
    if (error) {
      console.error('[Angela Urgent List] Erro ao buscar lista urgente:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    // Validar que a resposta é um array
    if (!Array.isArray(data)) {
      console.warn('[Angela Urgent List] Formato de resposta inesperado:', typeof data);
      return [];
    }

    // Normalizar e tipar os dados
    const urgentList: AngelaUrgentLead[] = data.map((row: Record<string, unknown>) => ({
      id: Number(row.id) || 0,
      nome: String(row.nome || 'Sem nome'),
      whatsapp: String(row.whatsapp || ''),
      loja: row.loja ? String(row.loja) : null,
      sentimento: row.sentimento ? String(row.sentimento) : null,
      problema_relatado: row.problema_relatado ? String(row.problema_relatado) : null,
      resumo: row.resumo ? String(row.resumo) : null,
      data_interacao: String(row.data_interacao || new Date().toISOString()),
      precisa_verificacao: Boolean(row.precisa_verificacao),
    }));

    // Log para debug com estatísticas
    const criticos = urgentList.filter(l => l.precisa_verificacao).length;
    const negativos = urgentList.filter(l =>
      l.sentimento?.toLowerCase().includes('negativo')
    ).length;
    const comProblema = urgentList.filter(l => l.problema_relatado).length;

    console.log('[Angela Urgent List] Lista carregada:', {
      total: urgentList.length,
      criticos_verificacao: criticos,
      sentimento_negativo: negativos,
      com_problema: comProblema,
    });

    return urgentList;
  } catch (err) {
    // Tratamento de exceções não esperadas
    console.error('[Angela Urgent List] Exceção ao buscar lista:', err);
    return null;
  }
}

// ============================================================================
// SENTIMENT TIMELINE - EVOLUÇÃO TEMPORAL DE SENTIMENTOS
// ============================================================================

/**
 * Busca a timeline de evolução de sentimentos via RPC
 *
 * @description Chama a função Postgres `get_angela_sentiment_timeline` que retorna
 * a evolução diária do volume de atendimentos e proporção de sentimentos
 * nos últimos 30 dias.
 *
 * @returns Promise<AngelaSentimentPoint[] | null> - Array de pontos da timeline ou null em caso de erro
 *
 * @example
 * const timeline = await getAngelaSentimentTimeline();
 * if (timeline && timeline.length > 0) {
 *   const ultimoDia = timeline[timeline.length - 1];
 *   console.log(`Hoje: ${ultimoDia.positivos} positivos, ${ultimoDia.negativos} negativos`);
 * }
 *
 * @ui_hints (Recharts)
 * - Tipo de gráfico: AreaChart ou BarChart empilhado/agrupado
 * - Série `positivos`: cor verde (#22c55e ou green-500)
 * - Série `negativos`: cor vermelha (#ef4444 ou red-500)
 * - Série `total`: pode ser linha sobreposta ou apenas no tooltip
 * - Eixo X: data formatada (DD/MM ou dia da semana)
 * - Eixo Y: quantidade de atendimentos
 * - Considerar usar gradiente para áreas (verde para cima, vermelho para baixo)
 */
export async function getAngelaSentimentTimeline(): Promise<AngelaSentimentPoint[] | null> {
  try {
    // Obter configuração e cliente Supabase para a Angela
    const cfg = getTenantConfig('agent-angela');
    const sb = getBrowserTenantClient('agent-angela', cfg);

    // Chamar a função RPC do Supabase
    // POST https://<supabase_url>/rest/v1/rpc/get_angela_sentiment_timeline
    const { data, error } = await sb.rpc('get_angela_sentiment_timeline');

    // Tratamento de erro do Supabase
    if (error) {
      console.error('[Angela Sentiment Timeline] Erro ao buscar timeline:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    // Validar que a resposta é um array
    if (!Array.isArray(data)) {
      console.warn('[Angela Sentiment Timeline] Formato de resposta inesperado:', typeof data);
      return [];
    }

    // Normalizar e tipar os dados
    const timeline: AngelaSentimentPoint[] = data.map((row: Record<string, unknown>) => ({
      data: String(row.data || ''),
      total: Number(row.total) || 0,
      positivos: Number(row.positivos) || 0,
      negativos: Number(row.negativos) || 0,
    }));

    // Ordenar por data (mais antigo primeiro para o gráfico)
    timeline.sort((a, b) => a.data.localeCompare(b.data));

    // Calcular estatísticas agregadas para log
    const totalAtendimentos = timeline.reduce((sum, p) => sum + p.total, 0);
    const totalPositivos = timeline.reduce((sum, p) => sum + p.positivos, 0);
    const totalNegativos = timeline.reduce((sum, p) => sum + p.negativos, 0);
    const taxaSatisfacao = (totalPositivos + totalNegativos) > 0
      ? ((totalPositivos / (totalPositivos + totalNegativos)) * 100).toFixed(1)
      : 'N/A';

    console.log('[Angela Sentiment Timeline] Timeline carregada:', {
      dias: timeline.length,
      total_atendimentos: totalAtendimentos,
      total_positivos: totalPositivos,
      total_negativos: totalNegativos,
      taxa_satisfacao: `${taxaSatisfacao}%`,
      periodo: timeline.length > 0
        ? `${timeline[0].data} a ${timeline[timeline.length - 1].data}`
        : 'N/A',
    });

    return timeline;
  } catch (err) {
    // Tratamento de exceções não esperadas
    console.error('[Angela Sentiment Timeline] Exceção ao buscar timeline:', err);
    return null;
  }
}

// ============================================================================
// PROBLEM STATS - ESTATÍSTICAS DE PROBLEMAS (TOP OFENSORES)
// ============================================================================

/**
 * Busca as estatísticas de problemas ("Top Ofensores") via RPC
 *
 * @description Chama a função Postgres `get_angela_problem_stats` que retorna
 * o ranking dos principais motivos de reclamação ou suporte, ordenado por
 * quantidade de ocorrências (Top 10).
 *
 * @returns Promise<AngelaProblemStat[] | null> - Array de problemas ou null em caso de erro
 *
 * @example
 * const problems = await getAngelaProblemStats();
 * if (problems && problems.length > 0) {
 *   const topProblema = problems[0];
 *   console.log(`Principal ofensor: ${topProblema.problema} com ${topProblema.total} casos`);
 * }
 *
 * @ui_hints (Recharts)
 * - Tipo de gráfico: BarChart com layout="vertical" (barras horizontais)
 * - Ordenação: maior para menor (já vem ordenado do backend)
 * - Cores: gradiente de vermelho ou cores categóricas
 * - Eixo Y: nome do problema
 * - Eixo X: quantidade de ocorrências
 * - Tooltip: incluir % do total
 */
export async function getAngelaProblemStats(): Promise<AngelaProblemStat[] | null> {
  try {
    // Obter configuração e cliente Supabase para a Angela
    const cfg = getTenantConfig('agent-angela');
    const sb = getBrowserTenantClient('agent-angela', cfg);

    // Chamar a função RPC do Supabase
    // POST https://<supabase_url>/rest/v1/rpc/get_angela_problem_stats
    const { data, error } = await sb.rpc('get_angela_problem_stats');

    // Tratamento de erro do Supabase
    if (error) {
      console.error('[Angela Problem Stats] Erro ao buscar estatísticas:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    // Validar que a resposta é um array
    if (!Array.isArray(data)) {
      console.warn('[Angela Problem Stats] Formato de resposta inesperado:', typeof data);
      return [];
    }

    // Normalizar e tipar os dados
    const problems: AngelaProblemStat[] = data.map((row: Record<string, unknown>) => ({
      problema: String(row.problema || 'Não categorizado'),
      total: Number(row.total) || 0,
    }));

    // Garantir ordenação do maior para menor
    problems.sort((a, b) => b.total - a.total);

    // Calcular total geral para percentuais
    const totalGeral = problems.reduce((sum, p) => sum + p.total, 0);

    console.log('[Angela Problem Stats] Estatísticas carregadas:', {
      categorias: problems.length,
      total_ocorrencias: totalGeral,
      top_3: problems.slice(0, 3).map(p => ({
        problema: p.problema,
        total: p.total,
        percentual: totalGeral > 0 ? `${((p.total / totalGeral) * 100).toFixed(1)}%` : 'N/A',
      })),
    });

    return problems;
  } catch (err) {
    // Tratamento de exceções não esperadas
    console.error('[Angela Problem Stats] Exceção ao buscar estatísticas:', err);
    return null;
  }
}

// ============================================================================
// GOVERNANCE - GOVERNANÇA E SAÚDE TÉCNICA
// ============================================================================

/**
 * Busca dados de governança e saúde técnica via RPC
 *
 * @description Chama a função Postgres `get_angela_governance` que retorna
 * métricas de performance do sistema e estabilidade da IA.
 *
 * @returns Promise<AngelaGovernanceData | null> - Dados de governança ou null em caso de erro
 *
 * @example
 * const governance = await getAngelaGovernance();
 * if (governance) {
 *   if (governance.perda_contexto > 0) {
 *     showCriticalAlert('IA perdendo contexto!');
 *   }
 *   if (governance.fila_tecnica > 20) {
 *     showWarning('Fila de mensagens alta');
 *   }
 * }
 *
 * @ui_hints (Regras de Negócio para Alertas Visuais)
 * - `perda_contexto > 0`: CRÍTICO (vermelho) - Indica falha na lógica da IA
 * - `fila_tecnica > 20`: WARNING (amarelo) - Lentidão no disparo de mensagens
 * - `fila_tecnica > 50`: CRÍTICO (vermelho) - Sistema sobrecarregado
 * - `ultimos_alertas`: Exibir em lista/timeline ordenada por data
 */
export async function getAngelaGovernance(): Promise<AngelaGovernanceData | null> {
  try {
    // Obter configuração e cliente Supabase para a Angela
    const cfg = getTenantConfig('agent-angela');
    const sb = getBrowserTenantClient('agent-angela', cfg);

    // Chamar a função RPC do Supabase
    // POST https://<supabase_url>/rest/v1/rpc/get_angela_governance
    const { data, error } = await sb.rpc('get_angela_governance');

    // Tratamento de erro do Supabase
    if (error) {
      console.error('[Angela Governance] Erro ao buscar dados:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    // Normalizar resposta: pode ser objeto único ou array
    let rawData: Record<string, unknown>;
    if (Array.isArray(data)) {
      if (data.length === 0) {
        console.warn('[Angela Governance] RPC retornou array vazio');
        return null;
      }
      rawData = data[0];
    } else if (data && typeof data === 'object') {
      rawData = data as Record<string, unknown>;
    } else {
      console.warn('[Angela Governance] Formato de resposta inesperado:', typeof data);
      return null;
    }

    // Normalizar array de alertas
    const rawAlertas = Array.isArray(rawData.ultimos_alertas)
      ? rawData.ultimos_alertas
      : [];

    const alertas: AngelaAlertLog[] = rawAlertas.map((alerta: Record<string, unknown>) => ({
      alerta: String(alerta.alerta || 'Alerta sem descrição'),
      created_at: String(alerta.created_at || new Date().toISOString()),
      sessionId: alerta.sessionId ? String(alerta.sessionId) : null,
    }));

    // Ordenar alertas por data (mais recente primeiro)
    alertas.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Montar objeto de governança
    const governance: AngelaGovernanceData = {
      fila_tecnica: Number(rawData.fila_tecnica) || 0,
      perda_contexto: Number(rawData.perda_contexto) || 0,
      ultimos_alertas: alertas,
    };

    // Determinar status de saúde do sistema
    let healthStatus: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';
    const issues: string[] = [];

    if (governance.perda_contexto > 0) {
      healthStatus = 'CRITICAL';
      issues.push(`IA perdeu contexto ${governance.perda_contexto}x`);
    }
    if (governance.fila_tecnica > 50) {
      healthStatus = 'CRITICAL';
      issues.push(`Fila crítica: ${governance.fila_tecnica} mensagens`);
    } else if (governance.fila_tecnica > 20) {
      if (healthStatus !== 'CRITICAL') healthStatus = 'WARNING';
      issues.push(`Fila alta: ${governance.fila_tecnica} mensagens`);
    }

    console.log('[Angela Governance] Dados carregados:', {
      fila_tecnica: governance.fila_tecnica,
      perda_contexto: governance.perda_contexto,
      alertas_count: alertas.length,
      health_status: healthStatus,
      issues: issues.length > 0 ? issues : 'Nenhum problema detectado',
    });

    return governance;
  } catch (err) {
    // Tratamento de exceções não esperadas
    console.error('[Angela Governance] Exceção ao buscar dados:', err);
    return null;
  }
}