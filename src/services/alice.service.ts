import type { SupabaseClient } from '@supabase/supabase-js';
import type { AgentService } from '@/types/service.type';
import { getBrowserTenantClient } from '@/lib/supabase/agentClients';
import { getTenantConfig } from '@/lib/supabase/agents';
import { Lead, Event } from '@/types/database.types';
import { buildAgentCommon } from './common';

// ============================================================================
// TIPOS PARA O FUNIL DE PROSPECÇÃO DA ALICE
// ============================================================================

/**
 * Interface para os pontos da Timeline de Atividade Operacional da Alice
 *
 * Cada ponto representa a atividade de um dia específico com:
 * - Disparos realizados (passado) - quantidade de mensagens efetivamente enviadas
 * - Disparos previstos (futuro) - quantidade de mensagens agendadas para envio
 */
export interface AliceTimelinePoint {
  /** Data do ponto no formato 'YYYY-MM-DD' */
  data: string;

  /** Quantidade de disparos efetivamente realizados (dados históricos) */
  realizado: number;

  /** Quantidade de disparos previstos/agendados (projeção futura) */
  previsto: number;
}

/**
 * Interface para os KPIs do Funil de Prospecção da Alice (BDR Outbound)
 *
 * O funil representa a jornada do lead desde a importação até o engajamento:
 * Base Total → Válidos → Contatados → Engajados
 */
export interface AliceFunnelKPI {
  /** Total de leads importados na base de prospecção */
  base_total: number;

  /** Leads com WhatsApp válido (número verificado e ativo) */
  validos: number;

  /** Leads que receberam pelo menos um disparo de mensagem */
  contatados: number;

  /** Leads que responderam às mensagens (Novo Fundo de Funil) */
  engajados: number;
}

/**
 * Interface para os leads da lista de trabalho priorizada da Alice
 *
 * A lista é ordenada por prioridade: quem respondeu primeiro aparece no topo.
 * Limite de 50 registros por chamada.
 *
 * @remarks
 * **Dicas de UI (para implementação futura):**
 * - Se `precisa_intervencao === true`: exibir badge vermelho de alerta
 * - Se `ultima_resposta !== null`: destacar a linha visualmente (lead engajado)
 * - Se `data_proximo_contato` está no passado: indicar follow-up atrasado
 */
export interface AliceLead {
  /** ID único do lead na tabela leads_frios */
  id: number;

  /** Nome do lead */
  nome: string;

  /** Número de WhatsApp do lead */
  whatsapp: string;

  /** Veículo de interesse informado (pode ser null se não informado) */
  veiculo_interesse: string | null;

  // -------------------------------------------------------------------------
  // Dados Críticos de Ordenação
  // -------------------------------------------------------------------------

  /**
   * Texto da última resposta do lead ou null se nunca respondeu.
   * Leads com resposta têm prioridade na ordenação.
   */
  ultima_resposta: string | null;

  /** Session ID para links de conversa e buscas relacionadas */
  session_id: string;

  // -------------------------------------------------------------------------
  // Colunas Calculadas
  // -------------------------------------------------------------------------

  /**
   * Data ISO do próximo contato agendado ou null se não houver agendamento.
   * Formato: 'YYYY-MM-DDTHH:mm:ss.sssZ'
   */
  data_proximo_contato: string | null;

  /**
   * Indica se o lead precisa de intervenção humana.
   * true = existe registro na tabela intervencao_humana para este lead.
   */
  precisa_intervencao: boolean;
}

/**
 * Interface para estatísticas de conversão por modelo de veículo
 *
 * Usado para gerar o heatmap de performance por veículo, permitindo
 * identificar quais modelos têm maior taxa de engajamento.
 *
 * @remarks
 * **Cálculo de Taxa de Conversão (para o componente visual):**
 * ```typescript
 * const taxaConversao = (stat.total_respostas / stat.total_leads) * 100;
 * ```
 */
export interface AliceVehicleStat {
  /** Nome/modelo do veículo (ex: "FERRARI RYS0F90") */
  veiculo: string;

  /** Total de leads interessados neste veículo */
  total_leads: number;

  /** Total de leads que engajaram/responderam */
  total_respostas: number;
}

/**
 * Interface para log de erro individual da Alice
 *
 * Representa um registro de falha cognitiva ou erro de processamento
 * para fins de auditoria e debugging.
 */
export interface AliceErrorLog {
  /** ID único do registro de erro */
  id: number;

  /** Data/hora do erro no formato ISO */
  created_at: string;

  /** Session ID do chat onde ocorreu o erro (pode ser null) */
  sessionId: string | null;

  /** Mensagem do usuário que causou o erro (pode ser null) */
  message_user: string | null;

  /** Resposta da IA no momento do erro (pode ser null) */
  message_ai: string | null;

  /** Detalhes internos do erro em formato JSONB */
  internal_reasoning: unknown;
}

/**
 * Interface para dados de Governança e Saúde Técnica da Alice
 *
 * Consolida métricas críticas para monitoramento operacional:
 * - Fila de mensagens (buffer)
 * - Taxa de intervenção humana
 * - Logs de erros recentes
 *
 * @remarks
 * **Regras de Negócio para implementação visual:**
 * - Se `buffer_queue > 0`: exibir alerta de "Gargalo de Envio" (amarelo/warning)
 * - Se `intervention_rate > 10`: exibir status "Crítico" (vermelho/danger)
 * - Se `recent_errors.length > 0`: exibir badge com contagem de erros
 */
export interface AliceGovernanceData {
  /**
   * Quantidade de mensagens presas na fila de envio.
   * Valor > 0 indica gargalo no processamento.
   */
  buffer_queue: number;

  /**
   * Porcentagem (0-100) de chats que exigiram intervenção humana.
   * Valores acima de 10% são considerados críticos.
   */
  intervention_rate: number;

  /**
   * Lista dos últimos 5 erros para auditoria.
   * Ordenados do mais recente para o mais antigo.
   */
  recent_errors: AliceErrorLog[];
}

/**
 * Busca os KPIs do Funil de Prospecção da Alice via RPC
 *
 * @description Chama a função Postgres `get_alice_kpi_funnel` que retorna
 * as métricas agregadas do funil de prospecção outbound.
 *
 * @returns Promise<AliceFunnelKPI | null> - Objeto com as métricas ou null em caso de erro
 *
 * @example
 * const funnel = await getAliceFunnelMetrics();
 * if (funnel) {
 *   const taxaValidacao = (funnel.validos / funnel.base_total) * 100;
 *   const taxaContato = (funnel.contatados / funnel.validos) * 100;
 *   const taxaEngajamento = (funnel.engajados / funnel.contatados) * 100;
 * }
 */
export async function getAliceFunnelMetrics(): Promise<AliceFunnelKPI | null> {
  try {
    // Obter configuração e cliente Supabase para a Alice
    const cfg = getTenantConfig('agent-alice');
    const sb = getBrowserTenantClient('agent-alice', cfg);

    // Chamar a função RPC do Supabase
    // POST https://<supabase_url>/rest/v1/rpc/get_alice_kpi_funnel
    const { data, error } = await sb.rpc('get_alice_kpi_funnel');

    // Tratamento de erro do Supabase
    if (error) {
      console.error('[Alice Funnel] Erro ao buscar KPIs do funil:', JSON.stringify(error, null, 2));
      return null;
    }

    // Normalizar resposta: pode ser objeto único ou array
    // Se for array, pega o primeiro elemento
    let rawData: Record<string, unknown>;
    if (Array.isArray(data)) {
      if (data.length === 0) {
        console.warn('[Alice Funnel] RPC retornou array vazio');
        return null;
      }
      rawData = data[0];
    } else if (data && typeof data === 'object') {
      rawData = data as Record<string, unknown>;
    } else {
      console.warn('[Alice Funnel] Formato de resposta inesperado:', typeof data);
      return null;
    }

    // Validar e extrair campos com valores padrão seguros
    const funnel: AliceFunnelKPI = {
      base_total: Number(rawData.base_total) || 0,
      validos: Number(rawData.validos) || 0,
      contatados: Number(rawData.contatados) || 0,
      engajados: Number(rawData.engajados) || 0,
    };

    // Log para debug
    console.log('[Alice Funnel] KPIs carregados:', {
      base_total: funnel.base_total,
      validos: funnel.validos,
      contatados: funnel.contatados,
      engajados: funnel.engajados,
      taxa_validacao: funnel.base_total > 0
        ? `${((funnel.validos / funnel.base_total) * 100).toFixed(1)}%`
        : 'N/A',
      taxa_engajamento: funnel.contatados > 0
        ? `${((funnel.engajados / funnel.contatados) * 100).toFixed(1)}%`
        : 'N/A',
    });

    return funnel;
  } catch (err) {
    // Tratamento de exceções não esperadas
    console.error('[Alice Funnel] Exceção ao buscar KPIs:', err);
    return null;
  }
}

// ============================================================================
// TIMELINE DE ATIVIDADE OPERACIONAL
// ============================================================================

/**
 * Busca a timeline de atividade operacional da Alice via RPC
 *
 * @description Chama a função Postgres `get_alice_timeline_activity` que retorna
 * os dados históricos de disparos realizados e a previsão de disparos futuros,
 * consolidados por data.
 *
 * @returns Promise<AliceTimelinePoint[] | null> - Array de pontos ordenados por data ou null em caso de erro
 *
 * @example
 * const timeline = await getAliceActivityTimeline();
 * if (timeline) {
 *   // Separar dados passados e futuros
 *   const hoje = new Date().toISOString().split('T')[0];
 *   const passado = timeline.filter(p => p.data <= hoje);
 *   const futuro = timeline.filter(p => p.data > hoje);
 * }
 */
export async function getAliceActivityTimeline(): Promise<AliceTimelinePoint[] | null> {
  try {
    // Obter configuração e cliente Supabase para a Alice
    const cfg = getTenantConfig('agent-alice');
    const sb = getBrowserTenantClient('agent-alice', cfg);

    // Chamar a função RPC do Supabase
    // POST https://<supabase_url>/rest/v1/rpc/get_alice_timeline_activity
    const { data, error } = await sb.rpc('get_alice_timeline_activity');

    // Tratamento de erro do Supabase
    if (error) {
      console.error('[Alice Timeline] Erro ao buscar atividade:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    // Validar resposta: deve ser um array
    if (!Array.isArray(data)) {
      console.warn('[Alice Timeline] Formato de resposta inesperado:', typeof data);
      return null;
    }

    // Se array vazio, retornar array vazio (comportamento válido)
    if (data.length === 0) {
      console.log('[Alice Timeline] Nenhum dado de atividade encontrado');
      return [];
    }

    // Normalizar e garantir tipos numéricos
    // Isso previne problemas caso o banco retorne strings em cenários de borda
    const timeline: AliceTimelinePoint[] = data.map((item: Record<string, unknown>) => ({
      data: String(item.data),
      realizado: Number(item.realizado) || 0,
      previsto: Number(item.previsto) || 0,
    }));

    // Log para debug
    const totalRealizado = timeline.reduce((acc, p) => acc + p.realizado, 0);
    const totalPrevisto = timeline.reduce((acc, p) => acc + p.previsto, 0);
    console.log('[Alice Timeline] Dados carregados:', {
      pontos: timeline.length,
      periodo: timeline.length > 0
        ? `${timeline[0].data} a ${timeline[timeline.length - 1].data}`
        : 'N/A',
      total_realizado: totalRealizado,
      total_previsto: totalPrevisto,
    });

    return timeline;
  } catch (err) {
    // Tratamento de exceções não esperadas
    console.error('[Alice Timeline] Exceção ao buscar atividade:', err);
    return null;
  }
}

// ============================================================================
// LISTA DE LEADS PRIORIZADA
// ============================================================================

/**
 * Busca a lista de trabalho priorizada de leads da Alice via RPC
 *
 * @description Chama a função Postgres `get_alice_lead_list` que retorna
 * os leads ordenados por prioridade (quem respondeu primeiro aparece no topo).
 * Limite de 50 registros.
 *
 * @returns Promise<AliceLead[] | null> - Array de leads priorizados ou null em caso de erro
 *
 * @example
 * const leads = await getAliceLeadList();
 * if (leads) {
 *   // Filtrar leads que precisam de atenção imediata
 *   const urgentes = leads.filter(l => l.precisa_intervencao);
 *   const engajados = leads.filter(l => l.ultima_resposta !== null);
 * }
 *
 * @remarks
 * **Dicas de UI (para implementação futura):**
 * - Se `precisa_intervencao === true`: exibir badge vermelho de alerta
 * - Se `ultima_resposta !== null`: destacar a linha visualmente (lead engajado)
 * - Se `data_proximo_contato` está no passado: indicar follow-up atrasado
 */
export async function getAliceLeadList(): Promise<AliceLead[] | null> {
  try {
    // Obter configuração e cliente Supabase para a Alice
    const cfg = getTenantConfig('agent-alice');
    const sb = getBrowserTenantClient('agent-alice', cfg);

    // Chamar a função RPC do Supabase
    // POST https://<supabase_url>/rest/v1/rpc/get_alice_lead_list
    const { data, error } = await sb.rpc('get_alice_lead_list');

    // Tratamento de erro do Supabase
    if (error) {
      console.error('[Alice LeadList] Erro ao buscar lista de leads:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    // Validar resposta: deve ser um array
    if (!Array.isArray(data)) {
      console.warn('[Alice LeadList] Formato de resposta inesperado:', typeof data);
      return null;
    }

    // Se array vazio, retornar array vazio (comportamento válido)
    if (data.length === 0) {
      console.log('[Alice LeadList] Nenhum lead encontrado na lista');
      return [];
    }

    // Normalizar e garantir tipos corretos
    // Campos nullable são preservados como null, não convertidos para string vazia
    const leads: AliceLead[] = data.map((item: Record<string, unknown>) => {
      const rawNome = String(item.nome ?? '');
      const rawWhatsapp = String(item.whatsapp ?? '');

      // Detectar se o campo nome contém um número de telefone (padrão brasileiro)
      // Se sim, usar um nome mascarado aleatório para manter o padrão premium
      const isPhoneNumber = /^\+?55?\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(rawNome.trim()) ||
        /^\d{10,11}$/.test(rawNome.trim());

      let nome = rawNome;
      if (isPhoneNumber || !rawNome) {
        const maskedNames = [
          'L*** T*****o',
          'M*** S*****',
          'J*** O*******',
          'A*** C*******',
          'P*** M*******',
          'R*** B*******',
          'S*** K*******'
        ];
        // Seleção consistente baseada no ID do lead
        const leadId = Number(item.id) || 0;
        nome = maskedNames[leadId % maskedNames.length];
      }

      return {
        id: Number(item.id),
        nome,
        whatsapp: rawWhatsapp,
        veiculo_interesse: item.veiculo_interesse != null ? String(item.veiculo_interesse) : null,
        ultima_resposta: item.ultima_resposta != null ? String(item.ultima_resposta) : null,
        session_id: String(item.session_id ?? ''),
        data_proximo_contato: item.data_proximo_contato != null ? String(item.data_proximo_contato) : null,
        precisa_intervencao: Boolean(item.precisa_intervencao),
      };
    });

    // Log para debug com métricas úteis
    const comResposta = leads.filter(l => l.ultima_resposta !== null).length;
    const precisamIntervencao = leads.filter(l => l.precisa_intervencao).length;
    const comAgendamento = leads.filter(l => l.data_proximo_contato !== null).length;

    console.log('[Alice LeadList] Lista carregada:', {
      total: leads.length,
      com_resposta: comResposta,
      precisam_intervencao: precisamIntervencao,
      com_agendamento: comAgendamento,
      taxa_engajamento: leads.length > 0
        ? `${((comResposta / leads.length) * 100).toFixed(1)}%`
        : 'N/A',
    });

    return leads;
  } catch (err) {
    // Tratamento de exceções não esperadas
    console.error('[Alice LeadList] Exceção ao buscar lista de leads:', err);
    return null;
  }
}

// ============================================================================
// HEATMAP DE VEÍCULOS
// ============================================================================

/**
 * Busca estatísticas de conversão por modelo de veículo via RPC
 *
 * @description Chama a função Postgres `get_alice_vehicle_heatmap` que retorna
 * métricas agregadas por veículo para geração do heatmap de performance.
 *
 * @returns Promise<AliceVehicleStat[] | null> - Array de estatísticas por veículo ou null em caso de erro
 *
 * @example
 * const stats = await getAliceVehicleHeatmap();
 * if (stats) {
 *   // Ordenar por taxa de conversão
 *   const ordenado = stats
 *     .map(s => ({ ...s, taxa: (s.total_respostas / s.total_leads) * 100 }))
 *     .sort((a, b) => b.taxa - a.taxa);
 * }
 *
 * @remarks
 * **Cálculo de Taxa de Conversão (para o componente visual):**
 * A taxa deve ser calculada no componente: `(total_respostas / total_leads) * 100`
 * Lembre-se de tratar divisão por zero quando `total_leads === 0`.
 */
export async function getAliceVehicleHeatmap(): Promise<AliceVehicleStat[] | null> {
  try {
    // Obter configuração e cliente Supabase para a Alice
    const cfg = getTenantConfig('agent-alice');
    const sb = getBrowserTenantClient('agent-alice', cfg);

    // Chamar a função RPC do Supabase
    // POST https://<supabase_url>/rest/v1/rpc/get_alice_vehicle_heatmap
    const { data, error } = await sb.rpc('get_alice_vehicle_heatmap');

    // Tratamento de erro do Supabase
    if (error) {
      console.error('[Alice VehicleHeatmap] Erro ao buscar estatísticas:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    // Tratamento de resposta aninhada (caso venha como { get_alice_vehicle_heatmap: [...] })
    // O Supabase REST geralmente retorna array plano, mas tratamos ambos os casos
    let rawData: unknown[];
    if (Array.isArray(data)) {
      rawData = data;
    } else if (data && typeof data === 'object' && 'get_alice_vehicle_heatmap' in data) {
      // Caso venha aninhado (cenário de borda)
      const nested = (data as Record<string, unknown>).get_alice_vehicle_heatmap;
      if (Array.isArray(nested)) {
        rawData = nested;
      } else {
        console.warn('[Alice VehicleHeatmap] Formato aninhado inesperado:', typeof nested);
        return null;
      }
    } else {
      console.warn('[Alice VehicleHeatmap] Formato de resposta inesperado:', typeof data);
      return null;
    }

    // Se array vazio, retornar array vazio (comportamento válido)
    if (rawData.length === 0) {
      console.log('[Alice VehicleHeatmap] Nenhuma estatística de veículo encontrada');
      return [];
    }

    // Normalizar e garantir tipos numéricos
    const stats: AliceVehicleStat[] = rawData.map((item: unknown) => {
      const row = item as Record<string, unknown>;
      return {
        veiculo: String(row.veiculo ?? 'Não informado'),
        total_leads: Number(row.total_leads) || 0,
        total_respostas: Number(row.total_respostas) || 0,
      };
    });

    // Log para debug com métricas agregadas
    const totalLeads = stats.reduce((acc, s) => acc + s.total_leads, 0);
    const totalRespostas = stats.reduce((acc, s) => acc + s.total_respostas, 0);
    const taxaGeral = totalLeads > 0 ? ((totalRespostas / totalLeads) * 100).toFixed(1) : 'N/A';

    // Encontrar veículo com melhor e pior performance
    const comLeads = stats.filter(s => s.total_leads > 0);
    const melhorVeiculo = comLeads.length > 0
      ? comLeads.reduce((best, curr) =>
        (curr.total_respostas / curr.total_leads) > (best.total_respostas / best.total_leads) ? curr : best
      )
      : null;

    console.log('[Alice VehicleHeatmap] Estatísticas carregadas:', {
      veiculos: stats.length,
      total_leads: totalLeads,
      total_respostas: totalRespostas,
      taxa_geral: `${taxaGeral}%`,
      melhor_veiculo: melhorVeiculo?.veiculo ?? 'N/A',
    });

    return stats;
  } catch (err) {
    // Tratamento de exceções não esperadas
    console.error('[Alice VehicleHeatmap] Exceção ao buscar estatísticas:', err);
    return null;
  }
}

// ============================================================================
// GOVERNANÇA E SAÚDE TÉCNICA
// ============================================================================

/**
 * Busca dados de Governança e Saúde Técnica da Alice via RPC
 *
 * @description Chama a função Postgres `get_alice_governance_alerts` que retorna
 * métricas consolidadas de saúde operacional: fila de buffer, taxa de intervenção
 * humana e logs de erros recentes.
 *
 * @returns Promise<AliceGovernanceData | null> - Objeto com métricas de governança ou null em caso de erro
 *
 * @example
 * const governance = await getAliceGovernanceAlerts();
 * if (governance) {
 *   // Verificar alertas críticos
 *   const temGargalo = governance.buffer_queue > 0;
 *   const statusCritico = governance.intervention_rate > 10;
 *   const temErros = governance.recent_errors.length > 0;
 * }
 *
 * @remarks
 * **Regras de Negócio para implementação visual:**
 * - Se `buffer_queue > 0`: exibir alerta de "Gargalo de Envio" (amarelo/warning)
 * - Se `intervention_rate > 10`: exibir status "Crítico" (vermelho/danger)
 * - Se `recent_errors.length > 0`: exibir badge com contagem de erros
 */
export async function getAliceGovernanceAlerts(): Promise<AliceGovernanceData | null> {
  try {
    // Obter configuração e cliente Supabase para a Alice
    const cfg = getTenantConfig('agent-alice');
    const sb = getBrowserTenantClient('agent-alice', cfg);

    // Chamar a função RPC do Supabase
    // POST https://<supabase_url>/rest/v1/rpc/get_alice_governance_alerts
    const { data, error } = await sb.rpc('get_alice_governance_alerts');

    // Tratamento de erro do Supabase
    if (error) {
      console.error('[Alice Governance] Erro ao buscar dados de governança:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    // Validar resposta: deve ser um objeto (não array)
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      console.warn('[Alice Governance] Formato de resposta inesperado:', typeof data);
      return null;
    }

    const rawData = data as Record<string, unknown>;

    // Normalizar recent_errors: garantir que seja array
    let recentErrors: AliceErrorLog[] = [];
    if (Array.isArray(rawData.recent_errors)) {
      recentErrors = rawData.recent_errors.map((item: unknown) => {
        const row = item as Record<string, unknown>;
        return {
          id: Number(row.id) || 0,
          created_at: String(row.created_at ?? ''),
          sessionId: row.sessionId != null ? String(row.sessionId) : null,
          message_user: row.message_user != null ? String(row.message_user) : null,
          message_ai: row.message_ai != null ? String(row.message_ai) : null,
          internal_reasoning: row.internal_reasoning ?? null,
        };
      });
    }

    // Construir objeto de governança normalizado
    const governance: AliceGovernanceData = {
      buffer_queue: Number(rawData.buffer_queue) || 0,
      intervention_rate: Number(rawData.intervention_rate) || 0,
      recent_errors: recentErrors,
    };

    // Log para debug com análise de status
    const statusGeral = governance.intervention_rate > 10 ? 'CRÍTICO' :
      governance.buffer_queue > 0 ? 'ATENÇÃO' : 'SAUDÁVEL';

    console.log('[Alice Governance] Dados carregados:', {
      buffer_queue: governance.buffer_queue,
      intervention_rate: `${governance.intervention_rate.toFixed(1)}%`,
      erros_recentes: governance.recent_errors.length,
      status: statusGeral,
      // Alertas ativos
      alertas: {
        gargalo_envio: governance.buffer_queue > 0,
        taxa_critica: governance.intervention_rate > 10,
        tem_erros: governance.recent_errors.length > 0,
      },
    });

    return governance;
  } catch (err) {
    // Tratamento de exceções não esperadas
    console.error('[Alice Governance] Exceção ao buscar dados de governança:', err);
    return null;
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function toStr(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  return String(v);
}

async function fetchAliceData(sb: SupabaseClient) {
  // Leads frios (base principal)
  // Nota: Selecionando apenas colunas que existem na migration base
  const leadsPromise = sb
    .from('leads_frios')
    .select('id,nome,priority_score')
    .order('priority_score', { ascending: false, nullsFirst: false })
    .limit(50);

  // Chat histories BDR
  const chatPromise = sb
    .from('chat_histories_bdr')
    .select('session_id,message,created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  // Memória
  const memoriaPromise = sb
    .from('memoria')
    .select('session_id,created_at,last_message_user,last_message_ia,memoria_lead')
    .order('created_at', { ascending: false })
    .limit(50);

  // Follow-ups programados
  const followupsPromise = sb
    .from('follow-ups')
    .select('id,created_at,name,number,message,shot_fired,shooting_schedule')
    .order('shooting_schedule', { ascending: true })
    .limit(50);

  // Curadoria
  const curadoriaPromise = sb
    .from('curadoria')
    .select('id,created_at,sessionId,message_user,message_ai,internal_reasoning')
    .order('created_at', { ascending: false })
    .limit(30);

  // Intervenções humanas
  const intervencaoPromise = sb
    .from('intervencao_humana')
    .select('id,sessionId,block,date_time')
    .order('date_time', { ascending: false })
    .limit(30);

  // Alertas
  const alertasPromise = sb
    .from('logs_alertas_enviados')
    .select('id,sessionId,alerta,created_at')
    .order('created_at', { ascending: false })
    .limit(30);

  // Aguardar todas em paralelo
  const [leadsRes, chatRes, memoriaRes, followupsRes, curadoriaRes, intervencaoRes, alertasRes] = await Promise.all([
    leadsPromise,
    chatPromise,
    memoriaPromise,
    followupsPromise,
    curadoriaPromise,
    intervencaoPromise,
    alertasPromise,
  ]);

  if (leadsRes.error) throw new Error(`leads_frios: ${leadsRes.error.message}`);
  if (chatRes.error) console.warn(`chat_histories_bdr (non-critical): ${chatRes.error.message}`);
  if (memoriaRes.error) console.warn(`memoria (non-critical): ${memoriaRes.error.message}`);
  if (followupsRes.error) console.warn(`follow-ups (non-critical): ${followupsRes.error.message}`);
  if (curadoriaRes.error) console.warn(`curadoria (non-critical): ${curadoriaRes.error.message}`);
  if (intervencaoRes.error) console.warn(`intervencao_humana (non-critical): ${intervencaoRes.error.message}`);
  if (alertasRes.error) console.warn(`logs_alertas_enviados (non-critical): ${alertasRes.error.message}`);

  return {
    leads: (leadsRes.data ?? []) as Record<string, any>[],
    chat: (chatRes.data ?? []) as Record<string, any>[],
    memoria: (memoriaRes.data ?? []) as Record<string, any>[],
    followups: (followupsRes.data ?? []) as Record<string, any>[],
    curadoria: (curadoriaRes.data ?? []) as Record<string, any>[],
    intervencao: (intervencaoRes.data ?? []) as Record<string, any>[],
    alertas: (alertasRes.data ?? []) as Record<string, any>[],
  };
}

function normalizeLead(row: Record<string, any>, agentId: string): Lead {
  const createdAt = new Date().toISOString();
  const ultimaInteracao = createdAt;

  return {
    id: String(row.id),
    nome: toStr(row.nome) ?? 'Sem nome',
    email: '',
    whatsapp: undefined,
    telefone: null,
    empresa: undefined,
    origem: 'Outbound' as any,
    status: 'NOVO',
    agente_atual_id: agentId,
    tempo_parado: undefined,
    valor_potencial: 0,
    ultima_interacao: ultimaInteracao,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

export const aliceService: AgentService = {
  id: 'agent-alice',

  async getAgent(agentId: string) {
    const cfg = getTenantConfig(agentId);
    const sb = getBrowserTenantClient(agentId, cfg);

    const data = await fetchAliceData(sb);

    const leads = data.leads.map((r) => normalizeLead(r, agentId));
    const events: Event[] = [];

    // MÉTRICAS ESPECÍFICAS DA ALICE (BDR Outbound)

    // 1. Taxa de bloqueio (crítico para anti-ban)
    const totalAlertas = data.alertas.length;
    const alertasBloqueio = data.alertas.filter(a =>
      a.alerta && (a.alerta.toLowerCase().includes('bloqueio') || a.alerta.toLowerCase().includes('spam'))
    ).length;
    const taxaBloqueio = totalAlertas > 0 ? (alertasBloqueio / totalAlertas) * 100 : 0;

    // 2. Cadências ativas vs pausadas
    const followupsAtivos = data.followups.filter(f => f.shot_fired === false).length;
    const followupsEnviados = data.followups.filter(f => f.shot_fired === true).length;

    // 3. Taxa de resposta (engajamento)
    const totalMensagensEnviadas = data.chat.filter(c =>
      c.message && typeof c.message === 'string' && !c.message.startsWith('[USER]')
    ).length;
    const respostasRecebidas = data.chat.filter(c =>
      c.message && typeof c.message === 'string' && c.message.startsWith('[USER]')
    ).length;
    const taxaResposta = totalMensagensEnviadas > 0 ?
      (respostasRecebidas / totalMensagensEnviadas) * 100 : 0;

    // 4. Intervenções humanas (handoff)
    const intervencoes = data.intervencao.filter(i => i.block === true).length;

    // 5. Análise de sentimento das respostas
    const respostasPositivas = data.curadoria.filter(c =>
      c.internal_reasoning && typeof c.internal_reasoning === 'string' && c.internal_reasoning.toLowerCase().includes('interesse')
    ).length;
    const respostasNegativas = data.curadoria.filter(c =>
      c.internal_reasoning && typeof c.internal_reasoning === 'string' && (
        c.internal_reasoning.toLowerCase().includes('não tenho interesse') ||
        c.internal_reasoning.toLowerCase().includes('não quero')
      )
    ).length;

    // Log summary
    console.log(`[Alice] Leads: ${leads.length}, Taxa Bloqueio: ${taxaBloqueio.toFixed(1)}%, ` +
      `Taxa Resposta: ${taxaResposta.toFixed(1)}%, Followups Ativos: ${followupsAtivos}, Intervenções: ${intervencoes}`);

    return buildAgentCommon(agentId, 'Alice', leads, events, {
      tipo: 'BDR',
      metricas_agregadas: {
        leads_ativos: leads.length,
        conversoes: respostasPositivas,
        receita_total: 0,
        disparos_hoje: followupsEnviados,
        taxa_bloqueio: taxaBloqueio,
        taxa_resposta: taxaResposta,
        followups_ativos: followupsAtivos,
        intervencoes_humanas: intervencoes,
        respostas_positivas: respostasPositivas,
        respostas_negativas: respostasNegativas,
      },
    });
  },
};
