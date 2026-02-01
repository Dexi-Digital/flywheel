import type { SupabaseClient } from '@supabase/supabase-js';
import type { AgentService } from '@/types/service.type';
import { getBrowserTenantClient } from '@/lib/supabase/agentClients';
import { getTenantConfig } from '@/lib/supabase/agents';
import { Lead, Event } from '@/types/database.types';
import { buildAgentCommon } from './common';

function toStr(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  return String(v);
}

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
