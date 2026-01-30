import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentService } from "@/types/service.type";
import { getBrowserTenantClient } from "@/lib/supabase/agentClients";
import { Agent, AgentType, AgentStatus, Lead, LeadStatus, LeadOrigin, Event, EventType } from "@/types/database.types";
import { getTenantConfig } from "@/lib/supabase/agents";
import { DisparoRow, InteracaoRow } from "./types";

function nowIso() {
    return new Date().toISOString();
}

function toStr(v: unknown): string | undefined {
    if (v === null || v === undefined) return undefined;
    return String(v);
}

function toNum(v: unknown, fallback = 0): number {
    if (v === null || v === undefined) return fallback;
    if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

/**
 * Regra de status (exemplo) — ajuste para sua lógica real
 */
function inferLeadStatus(row: InteracaoRow): LeadStatus {
    if (row.alerta) return "ESTAGNADO";
    if (row.respondeu) return "EM_CONTATO";
    return "NOVO";
}

function normalizeLead(row: InteracaoRow, agentId: string): Lead {
    const createdAt = toStr(row.created_at) ?? nowIso();

    return {
        id: String(row.id),
        nome: toStr(row.nome) ?? "Sem nome",
        email: "", // Email não disponível nos dados da Ângela
        telefone: toStr(row.whatsapp) ?? toStr(row.telefone),
        empresa: toStr(row.empresa) ?? toStr(row.loja),
        origem: row.origem as LeadOrigin, // Ajuste conforme sua lógica
        status: inferLeadStatus(row),
        agente_atual_id: agentId,
        valor_potencial: toNum(row.valor_potencial, 0),
        ultima_interacao: createdAt,
        created_at: createdAt,
        updated_at: createdAt,
    };
}

function normalizeEvent(row: DisparoRow, agentId: string): Event {
    const ts = toStr(row.created_at) ?? nowIso();

    return {
        id: String(row.id),
        tipo: row.event_type as EventType, // ajuste se quiser mapear tipos diferentes
        lead_id: toStr(row.id_lead) ?? toStr(row.session_id) ?? "unknown",
        agente_id: agentId,
        metadata: {
            nome: toStr(row.nome),
            telefone: toStr(row.telefone),
            session_id: toStr(row.session_id),
        },
        timestamp: ts,
    };
}

function buildAgent(
    agentId: string,
    leads: Lead[],
    events: Event[],
    overrides?: Partial<Agent>
  ): Agent {
    const leadsAtivos = leads.length;
    const conversoes = leads.filter((l) => l.status === "GANHO").length;
  
    const taxaConversao = leadsAtivos > 0 ? conversoes / leadsAtivos : 0; // 0..1
  
    const receitaTotal = leads
      .filter((l) => l.status === "GANHO")
      .reduce((sum, l) => sum + (l.valor_potencial ?? 0), 0);
  
    return {
      id: agentId,
      nome: "Ângela",
      tipo: "SDR" as AgentType,
      status: "ATIVO" as AgentStatus,
      avatar_url: undefined,
      metricas_agregadas: {
        leads_ativos: leadsAtivos,
        conversoes,
        taxa_conversao: taxaConversao, // UI: (taxa_conversao * 100).toFixed(1) + '%'
        receita_total: receitaTotal,   // UI: formatCurrency(receita_total)
        disparos_hoje: events.length,
      },
      created_at: nowIso(),
      updated_at: nowIso(),
      ...overrides,
    };
  }

async function fetchAngelaData(sb: SupabaseClient) {
    // ✅ selecione só o que a UI precisa (mais rápido)
    const { data: interacoes, error: e1 } = await sb
        .from("analise_interacoes")
        .select("id,created_at,nome,whatsapp,telefone,loja,empresa,valor_potencial,respondeu,alerta")
        .order("created_at", { ascending: false })
        .limit(50);

    if (e1) throw new Error(e1.message);

    const { data: disparos, error: e2 } = await sb
        .from("follow-disparos")
        .select("id,created_at,nome,telefone,session_id,id_lead")
        .order("created_at", { ascending: false })
        .limit(10);

    if (e2) throw new Error(e2.message);

    return {
        interacoes: (interacoes ?? []) as unknown as InteracaoRow[],
        disparos: (disparos ?? []) as unknown as DisparoRow[],
    };
}

export const angelaService: AgentService = {
    id: "agent-angela",

    async getAgent(agentId: string): Promise<Agent> {
        const cfg = getTenantConfig(agentId);
        const sb = getBrowserTenantClient(agentId, cfg);

        const { interacoes, disparos } = await fetchAngelaData(sb);

        const leads = interacoes.map((row) => normalizeLead(row, agentId));
        const events = disparos.map((row) => normalizeEvent(row, agentId));
        const agent = buildAgent(agentId, leads, events);

        return agent;
    }
};