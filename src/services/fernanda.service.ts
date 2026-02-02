import type { SupabaseClient } from '@supabase/supabase-js';
import type { AgentService } from '@/types/service.type';
import { getBrowserTenantClient } from '@/lib/supabase/agentClients';
import { getTenantConfig } from '@/lib/supabase/agents';
import { Lead, Event } from '@/types/database.types';
import { buildAgentCommon } from './common';
import type {
  FernandaFunnelKPI,
  FernandaLead,
  FernandaTimelineItem,
  FernandaIntentStat,
  FernandaGovernanceData,
  FernandaErrorLog,
} from '@/types/fernanda-api.types';

function toStr(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  return String(v);
}

// ============================================================================
// FUNÇÕES RPC - ENDPOINTS DO DASHBOARD FERNANDA
// ============================================================================

/**
 * Busca as métricas do Funil de Conversão da Fernanda via RPC.
 *
 * Endpoint: rpc/get_fernanda_kpi_funnel (POST)
 *
 * @returns Objeto com as métricas do funil ou null em caso de erro
 *
 * @example
 * const metrics = await getFernandaFunnelMetrics();
 * if (metrics) {
 *   console.log(`Base Total: ${metrics.base_total}`);
 *   console.log(`Válidos: ${metrics.validos}`);
 *   console.log(`Com Intenção: ${metrics.com_intencao}`);
 *   console.log(`Intervenções: ${metrics.intervencoes}`);
 * }
 */
export async function getFernandaFunnelMetrics(): Promise<FernandaFunnelKPI | null> {
  try {
    // Obter configuração e cliente Supabase para a Fernanda
    const cfg = getTenantConfig('agent-fernanda');
    const sb = getBrowserTenantClient('agent-fernanda', cfg);

    // Chamar a função RPC do Supabase
    // POST https://<supabase_url>/rest/v1/rpc/get_fernanda_kpi_funnel
    const { data, error } = await sb.rpc('get_fernanda_kpi_funnel');

    // Tratamento de erro do Supabase
    if (error) {
      console.error('[Fernanda FunnelKPI] Erro ao buscar métricas:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    // Validação básica do retorno
    if (!data) {
      console.warn('[Fernanda FunnelKPI] Retorno vazio do RPC');
      return null;
    }

    // O retorno já é o objeto, não precisa de map
    return data as FernandaFunnelKPI;
  } catch (err) {
    console.error('[Fernanda FunnelKPI] Erro inesperado:', err);
    return null;
  }
}

/**
 * Busca a lista de oportunidades (leads) da Fernanda via RPC.
 *
 * Endpoint: rpc/get_fernanda_lead_list (POST)
 *
 * NOTA DE UI - ORDENAÇÃO JÁ APLICADA PELO BANCO:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ 1º: Leads que precisam de atenção (precisa_atencao = true)  │
 * │     → Exibir com Badge VERMELHO (Erro/Intervenção)          │
 * │ 2º: Leads com intenção preenchida                           │
 * │     → Exibir com Badge VERDE/AZUL conforme tipo             │
 * │ 3º: Leads mais recentes (created_at DESC)                   │
 * │     → Ordenação padrão para os demais                       │
 * └─────────────────────────────────────────────────────────────┘
 *
 * @returns Array de leads ordenados ou null em caso de erro
 *
 * @example
 * const leads = await getFernandaLeadList();
 * if (leads) {
 *   leads.forEach(lead => {
 *     if (lead.precisa_atencao) {
 *       // Renderizar com alerta vermelho
 *     }
 *   });
 * }
 */
export async function getFernandaLeadList(): Promise<FernandaLead[] | null> {
  try {
    // Obter configuração e cliente Supabase para a Fernanda
    const cfg = getTenantConfig('agent-fernanda');
    const sb = getBrowserTenantClient('agent-fernanda', cfg);

    // Chamar a função RPC do Supabase
    // POST https://<supabase_url>/rest/v1/rpc/get_fernanda_lead_list
    const { data, error } = await sb.rpc('get_fernanda_lead_list');

    // Tratamento de erro do Supabase
    if (error) {
      console.error('[Fernanda LeadList] Erro ao buscar lista de leads:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    // Validação básica do retorno
    if (!data) {
      console.warn('[Fernanda LeadList] Retorno vazio do RPC');
      return [];
    }

    // O retorno já é um array ordenado pelo banco
    return data as FernandaLead[];
  } catch (err) {
    console.error('[Fernanda LeadList] Erro inesperado:', err);
    return null;
  }
}

/**
 * Busca a timeline de atividade (volume de conversas por dia) da Fernanda via RPC.
 *
 * Endpoint: rpc/get_fernanda_activity_timeline (POST)
 *
 * NOTA PARA UI (Recharts):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ • Use `dataKey="data"` no XAxis para eixo temporal                      │
 * │ • O banco retorna apenas dias COM atividade                             │
 * │ • Para gráfico contínuo, preencha gaps de datas no frontend:            │
 * │   - Itere do primeiro ao último dia retornado                           │
 * │   - Insira { data: 'YYYY-MM-DD', total_conversas: 0 } nos dias faltantes│
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * @returns Array de itens da timeline ordenados por data ou null em caso de erro
 *
 * @example
 * const timeline = await getFernandaActivityTimeline();
 * if (timeline) {
 *   // Usar com Recharts AreaChart ou BarChart
 *   <AreaChart data={timeline}>
 *     <XAxis dataKey="data" />
 *     <YAxis />
 *     <Area dataKey="total_conversas" />
 *   </AreaChart>
 * }
 */
export async function getFernandaActivityTimeline(): Promise<FernandaTimelineItem[] | null> {
  try {
    // Obter configuração e cliente Supabase para a Fernanda
    const cfg = getTenantConfig('agent-fernanda');
    const sb = getBrowserTenantClient('agent-fernanda', cfg);

    // Chamar a função RPC do Supabase
    // POST https://<supabase_url>/rest/v1/rpc/get_fernanda_activity_timeline
    const { data, error } = await sb.rpc('get_fernanda_activity_timeline');

    // Tratamento de erro do Supabase
    if (error) {
      console.error('[Fernanda Timeline] Erro ao buscar timeline de atividade:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    // Validação básica do retorno
    if (!data || !Array.isArray(data)) {
      console.warn('[Fernanda Timeline] Retorno vazio ou inválido do RPC');
      return [];
    }

    // Garantir que total_conversas seja numérico
    const normalizedData: FernandaTimelineItem[] = data.map((item: Record<string, unknown>) => ({
      data: String(item.data ?? ''),
      total_conversas: Number(item.total_conversas) || 0,
    }));

    return normalizedData;
  } catch (err) {
    console.error('[Fernanda Timeline] Erro inesperado:', err);
    return null;
  }
}

/**
 * Busca a distribuição de intenções de compra dos leads da Fernanda via RPC.
 *
 * Endpoint: rpc/get_fernanda_intent_distribution (POST)
 *
 * NOTA PARA UI (Cores sugeridas para PieChart/BarChart):
 * ┌────────────────────────────────────────────────────────────┐
 * │ QUENTES (Verde/Azul): "Compra Imediata", "Negociando"      │
 * │ MORNAS (Amarelo/Laranja): "Pesquisando", "Interessado"     │
 * │ FRIAS (Cinza): "Sem Interesse", "Indefinido", null         │
 * └────────────────────────────────────────────────────────────┘
 *
 * Nomes longos de intenção serão tratados pelo componente visual (truncate).
 *
 * @returns Array de estatísticas por intenção ou null em caso de erro
 *
 * @example
 * const distribution = await getFernandaIntentDistribution();
 * if (distribution) {
 *   // Usar com Recharts PieChart
 *   <PieChart>
 *     <Pie data={distribution} dataKey="total" nameKey="intencao" />
 *   </PieChart>
 * }
 */
export async function getFernandaIntentDistribution(): Promise<FernandaIntentStat[] | null> {
  try {
    // Obter configuração e cliente Supabase para a Fernanda
    const cfg = getTenantConfig('agent-fernanda');
    const sb = getBrowserTenantClient('agent-fernanda', cfg);

    // Chamar a função RPC do Supabase
    // POST https://<supabase_url>/rest/v1/rpc/get_fernanda_intent_distribution
    const { data, error } = await sb.rpc('get_fernanda_intent_distribution');

    // Tratamento de erro do Supabase
    if (error) {
      console.error('[Fernanda IntentDistribution] Erro ao buscar distribuição:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    // Validação básica do retorno
    if (!data || !Array.isArray(data)) {
      console.warn('[Fernanda IntentDistribution] Retorno vazio ou inválido do RPC');
      return [];
    }

    // Normalizar dados garantindo tipos corretos
    const normalizedData: FernandaIntentStat[] = data.map((item: Record<string, unknown>) => ({
      intencao: String(item.intencao ?? 'Indefinido'),
      total: Number(item.total) || 0,
    }));

    return normalizedData;
  } catch (err) {
    console.error('[Fernanda IntentDistribution] Erro inesperado:', err);
    return null;
  }
}

/**
 * Busca os dados de governança e saúde técnica da Fernanda via RPC.
 *
 * Endpoint: rpc/get_fernanda_governance (POST)
 *
 * REGRAS DE ALERTA PARA UI:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ fila_pendente > 10                                                      │
 * │   → ALERTA AMARELO (Warning)                                            │
 * │   → Mensagem: "Sistema lento - Fila de mensagens represada"             │
 * │   → Ícone: ⚠️ ou AlertTriangle                                          │
 * │                                                                         │
 * │ taxa_intervencao > 5                                                    │
 * │   → ALERTA VERMELHO (Critical)                                          │
 * │   → Mensagem: "IA falhando muito com clientes da Fernanda"              │
 * │   → Ícone: 🚨 ou AlertCircle                                            │
 * │                                                                         │
 * │ ultimos_erros.length > 0                                                │
 * │   → Exibir badge com contagem                                           │
 * │   → Permitir expandir drawer/modal com detalhes                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * @returns Dados de governança ou null em caso de erro
 *
 * @example
 * const governance = await getFernandaGovernance();
 * if (governance) {
 *   if (governance.fila_pendente > 10) {
 *     showWarning('Sistema lento');
 *   }
 *   if (governance.taxa_intervencao > 5) {
 *     showCritical('IA falhando muito');
 *   }
 * }
 */
export async function getFernandaGovernance(): Promise<FernandaGovernanceData | null> {
  try {
    // Obter configuração e cliente Supabase para a Fernanda
    const cfg = getTenantConfig('agent-fernanda');
    const sb = getBrowserTenantClient('agent-fernanda', cfg);

    // Chamar a função RPC do Supabase
    // POST https://<supabase_url>/rest/v1/rpc/get_fernanda_governance
    const { data, error } = await sb.rpc('get_fernanda_governance');

    // Tratamento de erro do Supabase
    if (error) {
      console.error('[Fernanda Governance] Erro ao buscar dados de governança:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    // Validação básica do retorno
    if (!data) {
      console.warn('[Fernanda Governance] Retorno vazio do RPC');
      return null;
    }

    // Normalizar dados garantindo tipos corretos
    const rawData = data as Record<string, unknown>;

    // Normalizar array de erros
    const rawErrors = Array.isArray(rawData.ultimos_erros) ? rawData.ultimos_erros : [];
    const normalizedErrors: FernandaErrorLog[] = rawErrors.map((err: Record<string, unknown>) => ({
      id: Number(err.id) || 0,
      created_at: String(err.created_at ?? new Date().toISOString()),
      message_ai: err.message_ai != null ? String(err.message_ai) : null,
      internal_reasoning: err.internal_reasoning ?? null,
    }));

    const normalizedData: FernandaGovernanceData = {
      fila_pendente: Number(rawData.fila_pendente) || 0,
      taxa_intervencao: Number(rawData.taxa_intervencao) || 0,
      ultimos_erros: normalizedErrors,
    };

    return normalizedData;
  } catch (err) {
    console.error('[Fernanda Governance] Erro inesperado:', err);
    return null;
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES DE FETCH
// ============================================================================

async function fetchFernandaData(sb: SupabaseClient) {
  // Leads não convertidos (VENDEDOR = 'Fernanda')
  const leadsPromise = sb
    .from('leads_nao_convertidos_fase02')
    .select('id,created_at,nome,VEICULO,INTENCAO,whatsapp,EMAIL,sessionId,last_message_ia,last_message_lead,CONTATADO')
    .eq('VENDEDOR', 'Fernanda')
    .order('created_at', { ascending: false })
    .limit(50);

  // Memória / histórico de sessões
  const memoriaPromise = sb
    .from('memoria')
    .select('session_id,created_at,last_message_user,last_message_ia,memoria_lead')
    .order('created_at', { ascending: false })
    .limit(50);

  // Histórico de chat
  const chatPromise = sb
    .from('chat_histories_fase_02')
    .select('session_id,message,created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  // Intervenções humanas
  const intervencaoPromise = sb
    .from('intervencao_humana')
    .select('sessionId,block,date_time')
    .order('date_time', { ascending: false })
    .limit(50);

  // Curadoria (erros)
  const curadoriaPromise = sb
    .from('curadoria')
    .select('id,created_at,name,sessionId,message_user,message_ai,internal_reasoning')
    .order('created_at', { ascending: false })
    .limit(50);

  // Aguardar todas as requisições em paralelo
  const [leadsRes, memoriaRes, chatRes, intervencaoRes, curadoriaRes] = await Promise.all([
    leadsPromise,
    memoriaPromise,
    chatPromise,
    intervencaoPromise,
    curadoriaPromise,
  ]);

  if (leadsRes.error) throw new Error(`leads_nao_convertidos_fase02: ${leadsRes.error.message}`);
  if (memoriaRes.error) console.warn(`memoria (non-critical): ${memoriaRes.error.message}`);
  if (chatRes.error) console.warn(`chat_histories_fase_02 (non-critical): ${chatRes.error.message}`);
  if (intervencaoRes.error) console.warn(`intervencao_humana (non-critical): ${intervencaoRes.error.message}`);
  if (curadoriaRes.error) console.warn(`curadoria (non-critical): ${curadoriaRes.error.message}`);

  return {
    leads: (leadsRes.data ?? []) as Record<string, any>[],
    memoria: (memoriaRes.data ?? []) as Record<string, any>[],
    chat: (chatRes.data ?? []) as Record<string, any>[],
    intervencao: (intervencaoRes.data ?? []) as Record<string, any>[],
    curadoria: (curadoriaRes.data ?? []) as Record<string, any>[],
  };
}

function normalizeLead(row: Record<string, any>, agentId: string): Lead {
  const createdAt = toStr(row.created_at) ?? new Date().toISOString();
  const ultimaInteracao = toStr(row.last_message_ia) ?? toStr(row.last_message_lead) ?? createdAt;

  // Determinar status baseado em CONTATADO e INTENCAO
  let status: any = 'PERDIDO'; // Default para leads não convertidos
  if (row.CONTATADO === 'Sim') {
    // Se foi contatado, pode estar em diferentes estágios
    const intencao = toStr(row.INTENCAO)?.toLowerCase() || '';
    if (intencao.includes('compra') || intencao.includes('interesse')) {
      status = 'QUALIFICADO';
    } else if (intencao.includes('negociação') || intencao.includes('proposta')) {
      status = 'NEGOCIACAO';
    } else {
      status = 'EM_CONTATO';
    }
  }

  // Estimar valor potencial baseado no veículo (se disponível)
  const veiculo = toStr(row.VEICULO) || '';
  let valorPotencial = 0;
  if (veiculo) {
    // Estimativa simples baseada em palavras-chave
    if (veiculo.toLowerCase().includes('suv') || veiculo.toLowerCase().includes('hilux')) {
      valorPotencial = 150000 + Math.random() * 100000;
    } else if (veiculo.toLowerCase().includes('sedan') || veiculo.toLowerCase().includes('corolla')) {
      valorPotencial = 80000 + Math.random() * 50000;
    } else {
      valorPotencial = 50000 + Math.random() * 30000;
    }
  }

  return {
    id: String(row.id),
    nome: toStr(row.nome) ?? 'Sem nome',
    email: toStr(row.EMAIL) ?? '',
    whatsapp: toStr(row.whatsapp),
    telefone: undefined,
    empresa: undefined,
    origem: 'Inbound',
    status: status,
    agente_atual_id: agentId,
    tempo_parado: undefined,
    valor_potencial: Math.round(valorPotencial),
    ultima_interacao: ultimaInteracao,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

export const fernandaService: AgentService = {
  id: 'agent-fernanda',

  async getAgent(agentId: string) {
    const cfg = getTenantConfig(agentId);
    const sb = getBrowserTenantClient(agentId, cfg);

    const data = await fetchFernandaData(sb);

    const leads = data.leads.map((r) => normalizeLead(r, agentId));
    const events: Event[] = [];

    // MÉTRICAS ESPECÍFICAS DA FERNANDA (Win-back/Reconversão)

    // 1. Taxa de reconversão (leads que voltaram a engajar)
    const leadsContatados = data.leads.filter(l => l.CONTATADO === 'Sim').length;
    const taxaReconversao = data.leads.length > 0 ? (leadsContatados / data.leads.length) * 100 : 0;

    // 2. Classificação de motivos de perda (via curadoria)
    const motivosPerda = {
      preco: 0,
      produto: 0,
      atendimento: 0,
      timing: 0,
      outros: 0,
    };

    data.curadoria.forEach(c => {
      if (!c.internal_reasoning || typeof c.internal_reasoning !== 'string') return;
      const reasoning = c.internal_reasoning.toLowerCase();
      if (reasoning.includes('preço') || reasoning.includes('caro')) motivosPerda.preco++;
      else if (reasoning.includes('produto') || reasoning.includes('veículo')) motivosPerda.produto++;
      else if (reasoning.includes('atendimento') || reasoning.includes('vendedor')) motivosPerda.atendimento++;
      else if (reasoning.includes('tempo') || reasoning.includes('prazo')) motivosPerda.timing++;
      else if (reasoning) motivosPerda.outros++;
    });

    // 3. Leads que reabriram conversa (mudança de contexto)
    const leadsReabertos = data.memoria.filter(m =>
      m.memoria_lead && typeof m.memoria_lead === 'string' && m.memoria_lead.toLowerCase().includes('retomou contato')
    ).length;

    // 4. Intervenções humanas (handoff para vendedor)
    const intervencoes = data.intervencao.filter(i => i.block === true).length;

    // 5. Análise de qualidade (leads com análise completa)
    const leadsAnalisados = data.curadoria.filter(c =>
      c.internal_reasoning && typeof c.internal_reasoning === 'string' && c.internal_reasoning.length > 50
    ).length;

    // Log summary
    console.log(`[Fernanda] Leads: ${leads.length}, Taxa Reconversão: ${taxaReconversao.toFixed(1)}%, ` +
      `Leads Reabertos: ${leadsReabertos}, Intervenções: ${intervencoes}, Analisados: ${leadsAnalisados}`);

    return buildAgentCommon(agentId, 'Fernanda', leads, events, {
      tipo: 'WINBACK',
      metricas_agregadas: {
        leads_ativos: leads.length,
        conversoes: leadsContatados,
        receita_total: 0,
        disparos_hoje: events.length,
        taxa_reconversao: taxaReconversao,
        leads_reabertos: leadsReabertos,
        intervencoes_humanas: intervencoes,
        leads_analisados: leadsAnalisados,
        motivos_perda_preco: motivosPerda.preco,
        motivos_perda_produto: motivosPerda.produto,
        motivos_perda_atendimento: motivosPerda.atendimento,
        motivos_perda_timing: motivosPerda.timing,
        motivos_perda_outros: motivosPerda.outros,
      },
    });
  },
};
