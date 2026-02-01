import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentService } from "@/types/service.type";
import { getBrowserTenantClient } from "@/lib/supabase/agentClients";
import { Lead, LeadOrigin, Event, EventType } from "@/types/database.types";
import { getTenantConfig } from "@/lib/supabase/agents";
import { buildAgentCommon } from "./common";

function toStr(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  return String(v);
}

function toNum(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const num = Number(v);
  return isNaN(num) ? 0 : num;
}

// Extrai valor da descrição do alerta (formato: "Carro: X, Valor: R$ Y")
function extractValorFromDescricao(descricao: string | null | undefined): number {
  if (!descricao) return 0;

  const match = descricao.match(/valor[:\s]*r?\$?\s*([\d.,]+)/i);
  if (match && match[1]) {
    const valorStr = match[1].replace(/\./g, '').replace(',', '.');
    return parseFloat(valorStr) || 0;
  }
  return 0;
}

async function fetchAngelaData(sb: SupabaseClient) {
  // 1. Leads ativos: regua_relacionamento onde ativo == true
  const leadsAtivosPromise = sb
    .from("regua_relacionamento")
    .select("*")
    .eq("ativo", true)
    .order("created_at", { ascending: false })
    .limit(100);

  // 2. Leads transferidos (alertas): logs_alertas_enviados
  const alertasPromise = sb
    .from("logs_alertas_enviados")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  // 3. Leads transferidos (intervenção): intervencao_humana
  const intervencaoPromise = sb
    .from("intervencao_humana")
    .select("*")
    .order("date_time", { ascending: false })
    .limit(100);

  // Aguardar todas em paralelo
  const [leadsAtivosRes, alertasRes, intervencaoRes] = await Promise.all([
    leadsAtivosPromise,
    alertasPromise,
    intervencaoPromise,
  ]);

  if (leadsAtivosRes.error) console.warn(`regua_relacionamento: ${leadsAtivosRes.error.message}`);
  if (alertasRes.error) console.warn(`logs_alertas_enviados: ${alertasRes.error.message}`);
  if (intervencaoRes.error) console.warn(`intervencao_humana: ${intervencaoRes.error.message}`);

  const leadsAtivos = (leadsAtivosRes.data ?? []) as Record<string, any>[];
  const alertas = (alertasRes.data ?? []) as Record<string, any>[];
  const intervencoes = (intervencaoRes.data ?? []) as Record<string, any>[];

  // Buscar dados completos dos leads transferidos via JOIN manual
  const sessionIdsAlertas = alertas.map(a => a.sessionId).filter(Boolean);
  const sessionIdsIntervencao = intervencoes.map(i => i.sessionId).filter(Boolean);
  const allSessionIds = [...new Set([...sessionIdsAlertas, ...sessionIdsIntervencao])];

  let leadsTransferidos: Record<string, any>[] = [];
  if (allSessionIds.length > 0) {
    const { data, error } = await sb
      .from("regua_relacionamento")
      .select("*")
      .in("sessionId", allSessionIds);

    if (error) {
      console.warn(`regua_relacionamento (transferidos): ${error.message}`);
    } else {
      leadsTransferidos = data ?? [];
    }
  }

  // Criar mapa de sessionId -> lead para facilitar JOIN
  const leadsMap = new Map<string, Record<string, any>>();
  [...leadsAtivos, ...leadsTransferidos].forEach(lead => {
    if (lead.sessionId) {
      leadsMap.set(lead.sessionId, lead);
    }
  });

  return {
    leadsAtivos,
    alertas,
    intervencoes,
    leadsMap,
  };
}

function normalizeLead(row: Record<string, any>, agentId: string, valorPotencial: number = 0): Lead {
  const createdAt = toStr(row.created_at) ?? new Date().toISOString();
  const ultimaInteracao = toStr(row.updated_at) ?? toStr(row.last_interaction) ?? createdAt;

  return {
    id: String(row.id ?? row.sessionId),
    nome: toStr(row.nome) ?? toStr(row.name) ?? "Sem nome",
    email: toStr(row.email) ?? "",
    whatsapp: toStr(row.whatsapp) ?? toStr(row.telefone),
    telefone: toStr(row.telefone),
    empresa: toStr(row.loja) ?? toStr(row.empresa),
    origem: "Inbound" as LeadOrigin,
    status: row.ativo === true ? "EM_CONTATO" : "NOVO",
    agente_atual_id: agentId,
    valor_potencial: valorPotencial,
    ultima_interacao: ultimaInteracao,
    created_at: createdAt,
    updated_at: ultimaInteracao,
  };
}

function normalizeEvent(
  alerta: Record<string, any>,
  lead: Record<string, any> | undefined,
  agentId: string,
  tipo: EventType
): Event {
  const timestamp = toStr(alerta.created_at) ?? toStr(alerta.date_time) ?? new Date().toISOString();
  const leadId = String(lead?.id ?? lead?.sessionId ?? alerta.sessionId ?? "unknown");

  // Extrair valor da descrição se disponível
  const valor = extractValorFromDescricao(alerta.descricao);

  return {
    id: String(alerta.id),
    tipo,
    lead_id: leadId,
    agente_id: agentId,
    metadata: {
      motivo: toStr(alerta.alerta) ?? toStr(alerta.block) ?? "Transferência",
      valor: valor > 0 ? valor : undefined,
      sessionId: toStr(alerta.sessionId),
      descricao: toStr(alerta.descricao),
    },
    timestamp,
  };
}

export const angelaService: AgentService = {
  id: "agent-angela",

  async getAgent(agentId: string) {
    const cfg = getTenantConfig(agentId);
    const sb = getBrowserTenantClient(agentId, cfg);

    const data = await fetchAngelaData(sb);

    // Normalizar leads ativos
    const leadsAtivos = data.leadsAtivos.map((row) => {
      // Tentar extrair valor se houver descrição
      const valor = extractValorFromDescricao(row.descricao);
      return normalizeLead(row, agentId, valor);
    });

    // Criar eventos de alertas (leads transferidos)
    const eventosAlertas: Event[] = data.alertas.map((alerta) => {
      const lead = data.leadsMap.get(alerta.sessionId);
      return normalizeEvent(alerta, lead, agentId, "LEAD_TRANSBORDADO");
    });

    // Criar eventos de intervenção humana
    const eventosIntervencao: Event[] = data.intervencoes.map((intervencao) => {
      const lead = data.leadsMap.get(intervencao.sessionId);
      return normalizeEvent(intervencao, lead, agentId, "INTERVENCAO_OTTO");
    });

    const allEvents = [...eventosAlertas, ...eventosIntervencao];

    // Calcular métricas
    const leadsTransferidos = eventosAlertas.length;
    const intervencoes = eventosIntervencao.length;
    const valorGerado = allEvents.reduce((sum, e) => sum + (e.metadata.valor ?? 0), 0);

    console.log(`[Angela] Leads Ativos: ${leadsAtivos.length}, Alertas: ${eventosAlertas.length}, Intervenções: ${eventosIntervencao.length}, Valor Gerado: R$ ${valorGerado.toLocaleString('pt-BR')}`);

    return buildAgentCommon(agentId, "Ângela", leadsAtivos, allEvents, {
      metricas_agregadas: {
        leads_ativos: leadsAtivos.length,
        conversoes: 0,
        receita_total: valorGerado,
        leads_transferidos: leadsTransferidos,
        intervencoes_humanas: intervencoes,
      },
    });
  },
};