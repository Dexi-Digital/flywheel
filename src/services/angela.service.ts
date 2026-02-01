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

  // 4. Análises de IA (sentimento, problemas, oportunidades)
  const analysisPromise = sb
    .from("angela_ai_analysis")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  // 5. Histórico de chat
  const chatPromise = sb
    .from("angela_chat_histories")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  // Aguardar todas em paralelo
  const [leadsAtivosRes, alertasRes, intervencaoRes, analysisRes, chatRes] = await Promise.all([
    leadsAtivosPromise,
    alertasPromise,
    intervencaoPromise,
    analysisPromise,
    chatPromise,
  ]);

  if (leadsAtivosRes.error) console.warn(`regua_relacionamento: ${leadsAtivosRes.error.message}`);
  if (alertasRes.error) console.warn(`logs_alertas_enviados: ${alertasRes.error.message}`);
  if (intervencaoRes.error) console.warn(`intervencao_humana: ${intervencaoRes.error.message}`);
  if (analysisRes.error) console.warn(`angela_ai_analysis: ${analysisRes.error.message}`);
  if (chatRes.error) console.warn(`angela_chat_histories: ${chatRes.error.message}`);

  const leadsAtivos = (leadsAtivosRes.data ?? []) as Record<string, any>[];
  const alertas = (alertasRes.data ?? []) as Record<string, any>[];
  const intervencoes = (intervencaoRes.data ?? []) as Record<string, any>[];
  const analysis = (analysisRes.data ?? []) as Record<string, any>[];
  const chat = (chatRes.data ?? []) as Record<string, any>[];

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
    analysis,
    chat,
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

    // MÉTRICAS ESPECÍFICAS DA ÂNGELA (CSM - Customer Success Manager)

    // 1. Resgate de inativos (>6 meses sem contato)
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
    const leadsInativos = data.leadsAtivos.filter(l => {
      const lastInteraction = new Date(l.updated_at || l.created_at);
      return lastInteraction < seisMesesAtras;
    }).length;
    const taxaResgateInativos = data.leadsAtivos.length > 0 ?
      (leadsInativos / data.leadsAtivos.length) * 100 : 0;

    // 2. Análise de satisfação (sentimento)
    const satisfacaoPositiva = data.analysis.filter(a =>
      a.sentimento && (a.sentimento.toLowerCase().includes('positivo') || a.sentimento.toLowerCase().includes('satisfeito'))
    ).length;
    const satisfacaoNegativa = data.analysis.filter(a =>
      a.sentimento && (a.sentimento.toLowerCase().includes('negativo') || a.sentimento.toLowerCase().includes('insatisfeito'))
    ).length;
    const satisfacaoMedia = data.analysis.length > 0 ?
      ((satisfacaoPositiva - satisfacaoNegativa) / data.analysis.length) * 100 : 0;

    // 3. Detecção de churn (problemas identificados)
    const alertasChurn = data.analysis.filter(a =>
      a.problema && (
        a.problema.toLowerCase().includes('cancelamento') ||
        a.problema.toLowerCase().includes('insatisfação') ||
        a.problema.toLowerCase().includes('reclamação')
      )
    ).length;

    // 4. Oportunidades de upgrade
    const oportunidadesUpgrade = data.analysis.filter(a =>
      a.problema && (
        a.problema.toLowerCase().includes('upgrade') ||
        a.problema.toLowerCase().includes('expansão') ||
        a.problema.toLowerCase().includes('crescimento')
      )
    ).length;

    // 5. Visitas presenciais agendadas (via chat)
    const visitasAgendadas = data.chat.filter(c =>
      c.message && (
        c.message.toLowerCase().includes('agendar') ||
        c.message.toLowerCase().includes('visita') ||
        c.message.toLowerCase().includes('café na loja')
      )
    ).length;

    // Calcular métricas gerais
    const leadsTransferidos = eventosAlertas.length;
    const intervencoes = eventosIntervencao.length;
    const valorGerado = allEvents.reduce((sum, e) => sum + (e.metadata.valor ?? 0), 0);

    console.log(`[Angela CSM] Leads Ativos: ${leadsAtivos.length}, Inativos: ${leadsInativos}, ` +
      `Satisfação: ${satisfacaoMedia.toFixed(1)}%, Alertas Churn: ${alertasChurn}, Visitas: ${visitasAgendadas}`);

    return buildAgentCommon(agentId, "Ângela", leadsAtivos, allEvents, {
      tipo: 'CSM', // CORREÇÃO: Angela é CSM, não SDR
      metricas_agregadas: {
        leads_ativos: leadsAtivos.length,
        conversoes: visitasAgendadas,
        receita_total: valorGerado,
        disparos_hoje: allEvents.length,
        leads_transferidos: leadsTransferidos,
        intervencoes_humanas: intervencoes,
        leads_inativos: leadsInativos,
        taxa_resgate_inativos: taxaResgateInativos,
        satisfacao_media: satisfacaoMedia,
        satisfacao_positiva: satisfacaoPositiva,
        satisfacao_negativa: satisfacaoNegativa,
        alertas_churn: alertasChurn,
        oportunidades_upgrade: oportunidadesUpgrade,
        visitas_agendadas: visitasAgendadas,
      },
    });
  },
};