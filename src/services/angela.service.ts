import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentService } from "@/types/service.type";
import { getBrowserTenantClient } from "@/lib/supabase/agentClients";
import { Lead, LeadOrigin } from "@/types/database.types";
import { getTenantConfig } from "@/lib/supabase/agents";
import { buildAgentCommon } from "./common";

function toStr(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  return String(v);
}

async function fetchAngelaData(sb: SupabaseClient) {
  // Análise de interações (tabela principal)
  const interacoesPromise = sb
    .from("analise_interacoes")
    .select("id,created_at,nome,whatsapp,loja,interesse,interesse_veiculo,veiculo,interesse_compra_futura,solicitou_retorno,data_retorno,respondeu,alerta,justificativa_alerta,problema,relato_problema,feedback,analise_sentimento,reanalise")
    .order("created_at", { ascending: false })
    .limit(50);

  // Follow-ups agendados
  const followupAgendadoPromise = sb
    .from("followUp_agendado")
    .select("id,created_at,name_lead,number_lead,follow-up_date,follow-up_message,id_lead")
    .gte("follow-up_date", new Date().toISOString())
    .order("follow-up_date", { ascending: true })
    .limit(30);

  // Follow-disparos (já enviados)
  const followDisparodsPromise = sb
    .from("follow-disparos")
    .select("id,created_at,nome,telefone,session_id")
    .order("created_at", { ascending: false })
    .limit(30);

  // Leads para verificar
  const leadsVerificarPromise = sb
    .from("leads-verificar-followUp")
    .select("id,created_at,nome,telefone,session_id")
    .order("created_at", { ascending: false })
    .limit(30);

  // Curadoria
  const curadoriaPromise = sb
    .from("curadoria")
    .select("id,created_at,sessionId,message_user,message_ai,internal_reasoning")
    .order("created_at", { ascending: false })
    .limit(30);

  // Intervenções humanas
  const intervencaoPromise = sb
    .from("intervencao_humana")
    .select("id,sessionId,block,date_time")
    .order("date_time", { ascending: false })
    .limit(30);

  // Buffer de mensagens
  const bufferPromise = sb
    .from("buffer_messages")
    .select("id,created_at,message,chatId,idMessage,timestamp")
    .order("created_at", { ascending: false })
    .limit(30);

  // Veículos sugeridos
  const vehiclesPromise = sb
    .from("cached_vehicles")
    .select("id,created_at,id_lead,vehicle,url_vehicle,enviado")
    .order("created_at", { ascending: false })
    .limit(30);

  // Dados da empresa
  const empresaPromise = sb
    .from("dados_empresa")
    .select("id,created_at,ano_fundacao,segmento_principal,descricao_empresa,endereco,telefone_principal,email_principal,url_site")
    .order("created_at", { ascending: false })
    .limit(1);

  // Aguardar todas em paralelo
  const [
    interacoesRes,
    followupAgendadoRes,
    followDisparodsRes,
    leadsVerificarRes,
    curadoriaRes,
    intervencaoRes,
    bufferRes,
    vehiclesRes,
    empresaRes,
  ] = await Promise.all([
    interacoesPromise,
    followupAgendadoPromise,
    followDisparodsPromise,
    leadsVerificarPromise,
    curadoriaPromise,
    intervencaoPromise,
    bufferPromise,
    vehiclesPromise,
    empresaPromise,
  ]);

  if (interacoesRes.error) throw new Error(`analise_interacoes: ${interacoesRes.error.message}`);
  if (followupAgendadoRes.error) console.warn(`followUp_agendado (non-critical): ${followupAgendadoRes.error.message}`);
  if (followDisparodsRes.error) console.warn(`follow-disparos (non-critical): ${followDisparodsRes.error.message}`);
  if (leadsVerificarRes.error) console.warn(`leads-verificar-followUp (non-critical): ${leadsVerificarRes.error.message}`);
  if (curadoriaRes.error) console.warn(`curadoria (non-critical): ${curadoriaRes.error.message}`);
  if (intervencaoRes.error) console.warn(`intervencao_humana (non-critical): ${intervencaoRes.error.message}`);
  if (bufferRes.error) console.warn(`buffer_messages (non-critical): ${bufferRes.error.message}`);
  if (vehiclesRes.error) console.warn(`cached_vehicles (non-critical): ${vehiclesRes.error.message}`);
  if (empresaRes.error) console.warn(`dados_empresa (non-critical): ${empresaRes.error.message}`);

  return {
    interacoes: (interacoesRes.data ?? []) as Record<string, any>[],
    followupAgendado: (followupAgendadoRes.data ?? []) as Record<string, any>[],
    followDisparos: (followDisparodsRes.data ?? []) as Record<string, any>[],
    leadsVerificar: (leadsVerificarRes.data ?? []) as Record<string, any>[],
    curadoria: (curadoriaRes.data ?? []) as Record<string, any>[],
    intervencao: (intervencaoRes.data ?? []) as Record<string, any>[],
    buffer: (bufferRes.data ?? []) as Record<string, any>[],
    vehicles: (vehiclesRes.data ?? []) as Record<string, any>[],
    empresa: (empresaRes.data ?? []) as Record<string, any>[],
  };
}

function normalizeLead(row: Record<string, any>, agentId: string): Lead {
  const createdAt = toStr(row.created_at) ?? new Date().toISOString();
  const valorPotencial = row.interesse_compra_futura ? 5000 : 0;

  return {
    id: String(row.id),
    nome: toStr(row.nome) ?? "Sem nome",
    email: "",
    whatsapp: toStr(row.whatsapp),
    telefone: undefined,
    empresa: toStr(row.loja),
    origem: "Outbound" as LeadOrigin,
    status: row.respondeu === "Sim" ? "EM_CONTATO" : "NOVO",
    agente_atual_id: agentId,
    valor_potencial: valorPotencial,
    ultima_interacao: createdAt,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

export const angelaService: AgentService = {
  id: "agent-angela",

  async getAgent(agentId: string) {
    const cfg = getTenantConfig(agentId);
    const sb = getBrowserTenantClient(agentId, cfg);

    const data = await fetchAngelaData(sb);

    const leads = data.interacoes.map((row) => normalizeLead(row, agentId));
    const events: any[] = [];

    // Log summary
    console.log(`[Angela] Interacoes: ${leads.length}, FollowupAgendado: ${data.followupAgendado.length}, FollowDisparos: ${data.followDisparos.length}, LeadsVerificar: ${data.leadsVerificar.length}, Curadoria: ${data.curadoria.length}, Intervencao: ${data.intervencao.length}, Buffer: ${data.buffer.length}, Vehicles: ${data.vehicles.length}, Empresa: ${data.empresa.length}`);

    return buildAgentCommon(agentId, "Ângela", leads, events);
  },
};