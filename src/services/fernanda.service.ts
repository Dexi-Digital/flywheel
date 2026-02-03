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

// Helper para obter o cliente
function getClient(agentId: string = 'agent-fernanda') {
  const cfg = getTenantConfig(agentId);
  return getBrowserTenantClient(agentId, cfg);
}

// ============================================================================
// FUNÇÕES - IMPLEMENTAÇÃO DIRETA (SEM RPC)
// ============================================================================

export async function getFernandaFunnelMetrics(): Promise<FernandaFunnelKPI | null> {
  try {
    const sb = getClient();

    // Buscar todos os leads para contagem (idealmente seria count(), mas para MVP vamos de select com head false ou limit)
    // Supabase count é eficiente.

    const { count: baseTotal, error: errBase } = await sb
      .from('leads_nao_convertidos_fase02')
      .select('*', { count: 'exact', head: true })
      .eq('VENDEDOR', 'Fernanda');

    const { count: validos, error: errValidos } = await sb
      .from('leads_nao_convertidos_fase02')
      .select('*', { count: 'exact', head: true })
      .eq('VENDEDOR', 'Fernanda')
      .eq('CONTATADO', 'Sim');

    // Com intenção: leads onde INTENCAO não é nulo/vazio e não é 'Indefinido'/'Sem Interesse'
    // Como SQL filter complexo pode ser chato, vamos pegar os leads contatados e filtrar, ou usar um filtro aproximado
    // Vamos usar lógica simplificada no query builder
    const { count: comIntencao, error: errIntencao } = await sb
      .from('leads_nao_convertidos_fase02')
      .select('*', { count: 'exact', head: true })
      .eq('VENDEDOR', 'Fernanda')
      .neq('INTENCAO', null)
      .neq('INTENCAO', 'Indefinido')
      .neq('INTENCAO', 'Sem Interesse');

    // Intervenções: Tabela intervencao_humana
    const { count: intervencoes, error: errIntervencoes } = await sb
      .from('intervencao_humana')
      .select('*', { count: 'exact', head: true });

    if (errBase) throw errBase;

    return {
      base_total: baseTotal || 0,
      validos: validos || 0,
      com_intencao: comIntencao || 0,
      intervencoes: intervencoes || 0
    };
  } catch (err) {
    console.error('[Fernanda FunnelKPI] Erro:', err);
    return null;
  }
}

export async function getFernandaLeadList(): Promise<FernandaLead[] | null> {
  try {
    const sb = getClient();

    // Buscar leads recentes
    const { data, error } = await sb
      .from('leads_nao_convertidos_fase02')
      .select('id, created_at, nome, whatsapp, VEICULO, INTENCAO, last_message_ia, last_message_lead, sessionId, CONTATADO')
      .eq('VENDEDOR', 'Fernanda')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!data) return [];

    return data.map((row: any) => {
      const intencao = row.INTENCAO || 'Indefinido';
      const precisaAtencao = !row.CONTATADO && (new Date().getTime() - new Date(row.created_at).getTime()) > 86400000; // Exemplo: > 24h sem contato

      return {
        id: row.id,
        nome: row.nome || 'Sem Nome',
        whatsapp: row.whatsapp,
        veiculo: row.VEICULO,
        intencao: intencao,
        precisa_atencao: precisaAtencao,
        ultima_interacao: row.last_message_ia || row.last_message_lead || row.created_at,
        session_id: row.sessionId || '',
        created_at: row.created_at
      };
    }).sort((a, b) => {
      // Ordenação customizada no cliente
      if (a.precisa_atencao && !b.precisa_atencao) return -1;
      if (!a.precisa_atencao && b.precisa_atencao) return 1;
      if (a.intencao !== 'Indefinido' && b.intencao === 'Indefinido') return -1;
      return 0; // Mantém ordem de data
    });

  } catch (err) {
    console.error('[Fernanda LeadList] Erro:', err);
    return null;
  }
}

export async function getFernandaActivityTimeline(): Promise<FernandaTimelineItem[] | null> {
  try {
    const sb = getClient();

    // Agregação manual simplificada: Pegar ultimas 100 mensagens e agrupar por dia
    const { data, error } = await sb
      .from('chat_histories_fase_02')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(500); // Amostra maior

    if (error) throw error;

    const countByDate: Record<string, number> = {};
    data?.forEach((row: any) => {
      const date = new Date(row.created_at).toISOString().split('T')[0];
      countByDate[date] = (countByDate[date] || 0) + 1;
    });

    return Object.entries(countByDate).map(([date, count]) => ({
      data: date,
      total_conversas: count
    })).sort((a, b) => a.data.localeCompare(b.data));

  } catch (err) {
    console.error('[Fernanda Timeline] Erro:', err);
    return null;
  }
}

export async function getFernandaIntentDistribution(): Promise<FernandaIntentStat[] | null> {
  try {
    const sb = getClient();

    // Buscar intents de todos os leads da Fernanda
    // Nota: Se a base for grande, isso deveria ser RPC, mas para MVP vamos puxar os últimos 200
    const { data, error } = await sb
      .from('leads_nao_convertidos_fase02')
      .select('INTENCAO')
      .eq('VENDEDOR', 'Fernanda')
      .limit(500);

    if (error) throw error;

    const counts: Record<string, number> = {};
    data?.forEach((row: any) => {
      const intent = row.INTENCAO || 'Indefinido';
      counts[intent] = (counts[intent] || 0) + 1;
    });

    return Object.entries(counts).map(([intencao, total]) => ({
      intencao,
      total
    }));

  } catch (err) {
    console.error('[Fernanda IntentDistribution] Erro:', err);
    return null;
  }
}

export async function getFernandaGovernance(): Promise<FernandaGovernanceData | null> {
  try {
    const sb = getClient();

    // Fila pendente (exemplo: mensagens em buffer ou leads sem contato)
    const { count: filaPendente } = await sb
      .from('leads_nao_convertidos_fase02')
      .select('*', { count: 'exact', head: true })
      .eq('VENDEDOR', 'Fernanda')
      .eq('CONTATADO', 'Não'); // Assumindo 'Não' como pendente

    // Taxa Intervenção (calculado sobre base total ou 100 ultimos)
    const { count: intervencoes } = await sb.from('intervencao_humana').select('*', { count: 'exact', head: true });
    // Pegar total de conversas para calcular taxa
    const { count: totalConversas } = await sb.from('chat_histories_fase_02').select('*', { count: 'exact', head: true });

    const taxa = totalConversas ? (intervencoes! / totalConversas) * 100 : 0;

    // Últimos erros (Curadoria com falha)
    const { data: erros } = await sb
      .from('curadoria')
      .select('id, created_at, message_ai, internal_reasoning')
      .not('internal_reasoning', 'is', null) // Assumindo que erros têm reasoning
      .order('created_at', { ascending: false })
      .limit(5);

    const normalizedErrors: FernandaErrorLog[] = (erros || []).map((e: any) => ({
      id: e.id,
      created_at: e.created_at,
      message_ai: e.message_ai,
      internal_reasoning: e.internal_reasoning
    }));

    return {
      fila_pendente: filaPendente || 0,
      taxa_intervencao: taxa,
      ultimos_erros: normalizedErrors
    };

  } catch (err) {
    console.error('[Fernanda Governance] Erro:', err);
    return null;
  }
}

// ============================================================================
// FUNÇÕES LEGADO / GET AGENT
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
