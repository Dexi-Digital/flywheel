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

async function fetchAliceData(sb: SupabaseClient) {
  // Leads frios (base principal)
  const leadsPromise = sb
    .from('leads_frios')
    .select('id,nome,nome_pf,whatsapp,email,cidade,site,origem,veiculo_interesse,priority_score,whatsapp_existe,contato_realizado,data_disparo,last_message_ia,last_message_lead,sessionId,created_at')
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
  const createdAt = toStr(row.created_at) ?? new Date().toISOString();
  const ultimaInteracao = toStr(row.last_message_ia) ?? toStr(row.last_message_lead) ?? createdAt;

  return {
    id: String(row.id),
    nome: toStr(row.nome) ?? toStr(row.nome_pf) ?? 'Sem nome',
    email: toStr(row.email) ?? '',
    whatsapp: toStr(row.whatsapp),
    telefone: toStr(row.number),
    empresa: toStr(row.site),
    origem: (toStr(row.origem) ?? 'Outbound') as any,
    status: row.contato_realizado === 'Sim' ? 'EM_CONTATO' : 'NOVO',
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

    // Log summary
    console.log(`[Alice] Leads: ${leads.length}, Chat: ${data.chat.length}, Memoria: ${data.memoria.length}, FollowUps: ${data.followups.length}, Curadoria: ${data.curadoria.length}, Intervencao: ${data.intervencao.length}, Alertas: ${data.alertas.length}`);

    return buildAgentCommon(agentId, 'Alice', leads, events);
  },
};
