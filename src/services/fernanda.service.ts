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
  
  return {
    id: String(row.id),
    nome: toStr(row.nome) ?? 'Sem nome',
    email: toStr(row.EMAIL) ?? '',
    whatsapp: toStr(row.whatsapp),
    telefone: undefined,
    empresa: undefined,
    origem: 'Inbound',
    status: row.CONTATADO === 'Sim' ? 'EM_CONTATO' : 'NOVO',
    agente_atual_id: agentId,
    tempo_parado: undefined,
    valor_potencial: 0,
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

    // Log summary
    console.log(`[Fernanda] Leads: ${leads.length}, Memoria: ${data.memoria.length}, Chat: ${data.chat.length}, Intervencao: ${data.intervencao.length}, Curadoria: ${data.curadoria.length}`);

    return buildAgentCommon(agentId, 'Fernanda', leads, events);
  },
};
