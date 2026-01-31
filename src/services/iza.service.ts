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

async function fetchIzaData(sb: SupabaseClient) {
  // Leads (base principal)
  const leadsPromise = sb
    .from('leads')
    .select('id,created_at,nome,email,telefone,origem,status,ultima_interacao,valor_potencial')
    .order('created_at', { ascending: false })
    .limit(50);

  // FollowUp_Control (cadências/decisões autônomas)
  const followupPromise = sb
    .from('FollowUp_Control')
    .select('id,created_at,lead_id,decisao_IA,success,scheduled_for')
    .order('created_at', { ascending: false })
    .limit(50);

  // Curadoria (erros)
  const curadoriaPromise = sb
    .from('curadoria')
    .select('id,created_at,sessionId,message_user,message_ai,internal_reasoning')
    .order('created_at', { ascending: false })
    .limit(30);

  // Aguardar todas em paralelo
  const [leadsRes, followupRes, curadoriaRes] = await Promise.all([
    leadsPromise,
    followupPromise,
    curadoriaPromise,
  ]);

  if (leadsRes.error) throw new Error(`leads: ${leadsRes.error.message}`);
  if (followupRes.error) console.warn(`FollowUp_Control (non-critical): ${followupRes.error.message}`);
  if (curadoriaRes.error) console.warn(`curadoria (non-critical): ${curadoriaRes.error.message}`);

  return {
    leads: (leadsRes.data ?? []) as Record<string, any>[],
    followup: (followupRes.data ?? []) as Record<string, any>[],
    curadoria: (curadoriaRes.data ?? []) as Record<string, any>[],
  };
}

function normalizeLead(row: Record<string, any>, agentId: string): Lead {
  const createdAt = toStr(row.created_at) ?? new Date().toISOString();
  return {
    id: String(row.id),
    nome: toStr(row.nome) ?? 'Sem nome',
    email: toStr(row.email) ?? '',
    whatsapp: undefined,
    telefone: toStr(row.telefone),
    empresa: undefined,
    origem: (row.origem as any) ?? 'Inbound',
    status: (row.status as any) ?? 'NOVO',
    agente_atual_id: agentId,
    tempo_parado: undefined,
    valor_potencial: Number(row.valor_potencial) || 0,
    ultima_interacao: toStr(row.ultima_interacao) ?? createdAt,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

export const izaService: AgentService = {
  id: 'agent-iza',

  async getAgent(agentId: string) {
    const cfg = getTenantConfig(agentId);
    const sb = getBrowserTenantClient(agentId, cfg);

    const data = await fetchIzaData(sb);

    const leads = data.leads.map((r) => normalizeLead(r, agentId));
    const events: Event[] = [];

    // Log summary
    console.log(`[Iza] Leads: ${leads.length}, FollowUp: ${data.followup.length}, Curadoria: ${data.curadoria.length}`);

    return buildAgentCommon(agentId, 'Iza', leads, events);
  },
};
