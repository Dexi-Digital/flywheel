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

async function fetchAlice(sb: SupabaseClient) {
  const { data, error } = await sb
    .from('leads_frios')
    .select('id,created_at,nome,temperatura,proxima_acao_ia,ultima_objecao,followups,email,telefone,valor_potencial')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Record<string, any>[];
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
    origem: 'Outbound',
    status: 'EM_CONTATO',
    agente_atual_id: agentId,
    tempo_parado: undefined,
    valor_potencial: Number(row.valor_potencial) || 0,
    ultima_interacao: createdAt,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

export const aliceService: AgentService = {
  id: 'agent-alice',

  async getAgent(agentId: string) {
    const cfg = getTenantConfig(agentId);
    const sb = getBrowserTenantClient(agentId, cfg);

    const rows = await fetchAlice(sb);
    const leads = rows.map((r) => normalizeLead(r, agentId));
    const events: Event[] = [];

    return buildAgentCommon(agentId, 'Alice', leads, events);
  },
};
