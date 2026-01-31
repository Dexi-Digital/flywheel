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

async function fetchVictorData(sb: SupabaseClient) {
  // Acompanhamento de leads (base principal)
  const acompanhamentoPromise = sb
    .from('acompanhamento_leads')
    .select('id,created_at,nome_cliente,valor_devido,dias_em_atraso,ultima_interacao,session_id,email,telefone')
    .order('created_at', { ascending: false })
    .limit(50);

  // Parcelas (para calcular total devido)
  const parcelasPromise = sb
    .from('tgv_parcela')
    .select('id,lead_id,valor_parcela,vencimento,status')
    .order('vencimento', { ascending: true })
    .limit(100);

  // Controle de disparo
  const disparoPromise = sb
    .from('controle_disparo')
    .select('id,lead_id,created_at,dateTime_disparo,tipo_mensagem')
    .order('dateTime_disparo', { ascending: false })
    .limit(50);

  // Renegociação
  const renegociacaoPromise = sb
    .from('tgv_renegociacao')
    .select('id,lead_id,created_at,status,historico')
    .order('created_at', { ascending: false })
    .limit(30);

  // Aguardar todas em paralelo
  const [acompanhamentoRes, parcelasRes, disparoRes, renegociacaoRes] = await Promise.all([
    acompanhamentoPromise,
    parcelasPromise,
    disparoPromise,
    renegociacaoPromise,
  ]);

  if (acompanhamentoRes.error) throw new Error(`acompanhamento_leads: ${acompanhamentoRes.error.message}`);
  if (parcelasRes.error) console.warn(`tgv_parcela (non-critical): ${parcelasRes.error.message}`);
  if (disparoRes.error) console.warn(`controle_disparo (non-critical): ${disparoRes.error.message}`);
  if (renegociacaoRes.error) console.warn(`tgv_renegociacao (non-critical): ${renegociacaoRes.error.message}`);

  return {
    acompanhamento: (acompanhamentoRes.data ?? []) as Record<string, any>[],
    parcelas: (parcelasRes.data ?? []) as Record<string, any>[],
    disparo: (disparoRes.data ?? []) as Record<string, any>[],
    renegociacao: (renegociacaoRes.data ?? []) as Record<string, any>[],
  };
}

function normalizeLead(row: Record<string, any>, agentId: string): Lead {
  const createdAt = toStr(row.created_at) ?? new Date().toISOString();
  return {
    id: String(row.id),
    nome: toStr(row.nome_cliente) ?? 'Sem nome',
    email: toStr(row.email) ?? '',
    whatsapp: undefined,
    telefone: toStr(row.telefone),
    empresa: undefined,
    origem: 'Inbound',
    status: 'EM_CONTATO',
    agente_atual_id: agentId,
    tempo_parado: undefined,
    valor_potencial: Number(row.valor_devido) || 0,
    ultima_interacao: toStr(row.ultima_interacao) ?? createdAt,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

export const victorService: AgentService = {
  id: 'agent-victor',

  async getAgent(agentId: string) {
    const cfg = getTenantConfig(agentId);
    const sb = getBrowserTenantClient(agentId, cfg);

    const data = await fetchVictorData(sb);

    const leads = data.acompanhamento.map((r) => normalizeLead(r, agentId));
    const events: Event[] = [];

    // Log summary
    console.log(`[Victor] Leads: ${leads.length}, Parcelas: ${data.parcelas.length}, Disparo: ${data.disparo.length}, Renegociacao: ${data.renegociacao.length}`);

    return buildAgentCommon(agentId, 'Victor', leads, events);
  },
};
