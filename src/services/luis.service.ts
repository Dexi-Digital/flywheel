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

async function fetchLuisData(sb: SupabaseClient) {
  // Leads CRM (base principal)
  const leadsPromise = sb
    .from('Leads CRM')
    .select('id,created_at,nome,email,telefone,origem,status,ultima_interacao,valor_potencial')
    .order('created_at', { ascending: false })
    .limit(50);

  // AI Chat Sessions
  const sessionsPromise = sb
    .from('ai_chat_sessions')
    .select('id,lead_id,session_id,created_at,status,last_message_at')
    .order('created_at', { ascending: false })
    .limit(50);

  // Análise de interações IA
  const analisesPromise = sb
    .from('analise_interacoes_ia')
    .select('id,created_at,session_id,sentimento,problema,sugestao')
    .order('created_at', { ascending: false })
    .limit(50);

  // Aguardar todas em paralelo
  const [leadsRes, sessionsRes, analisesRes] = await Promise.all([
    leadsPromise,
    sessionsPromise,
    analisesPromise,
  ]);

  if (leadsRes.error) throw new Error(`Leads CRM: ${leadsRes.error.message}`);
  if (sessionsRes.error) console.warn(`ai_chat_sessions (non-critical): ${sessionsRes.error.message}`);
  if (analisesRes.error) console.warn(`analise_interacoes_ia (non-critical): ${analisesRes.error.message}`);

  return {
    leads: (leadsRes.data ?? []) as Record<string, any>[],
    sessions: (sessionsRes.data ?? []) as Record<string, any>[],
    analises: (analisesRes.data ?? []) as Record<string, any>[],
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

export const luisService: AgentService = {
  id: 'agent-luis',

  async getAgent(agentId: string) {
    const cfg = getTenantConfig(agentId);
    const sb = getBrowserTenantClient(agentId, cfg);

    const data = await fetchLuisData(sb);

    const leads = data.leads.map((r) => normalizeLead(r, agentId));
    const events: Event[] = [];

    // Log summary
    console.log(`[Luis] Leads: ${leads.length}, Sessions: ${data.sessions.length}, Analises: ${data.analises.length}`);

    return buildAgentCommon(agentId, 'Luís', leads, events);
  },
};
