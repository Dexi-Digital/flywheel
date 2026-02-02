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
      console.error('[Alice Funnel] Erro ao buscar KPIs do funil:', {
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
