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
  // Leads (base principal - campanhas ativas)
  const leadsPromise = sb
    .from('leads')
    .select(`
      id,created_at,nome,whatsapp,sessionId,interesse,etapa,ultima_mensagem_user,
      ultima_mensagem_ia,contato_realizado,followup_01_sent,followup_02_sent,
      followup_03_sent,followup_04_sent,lid,veiculo,origem,evento,"ATIVO"
    `)
    .eq('ATIVO', true)
    .order('created_at', { ascending: false })
    .limit(50);

  // Leads de eventos/campanhas específicas
  const leadsEventoPromise = sb
    .from('leads_evento')
    .select('id,created_at,nome,whatsapp,cidade,campanha,e-mail,session_id,lid')
    .order('created_at', { ascending: false })
    .limit(50);

  // Follow-ups agendados
  const followupAgendadosPromise = sb
    .from('FollowUp_Agendados')
    .select('id,created_at,tipo_followUp,sessionId_Lead')
    .order('created_at', { ascending: false })
    .limit(30);

  // Decisões da IA sobre follow-ups
  const followupControlPromise = sb
    .from('FollowUp_Control')
    .select('id,created_at,sessionId,decisao_IA,tipo_followUp,sucess')
    .order('created_at', { ascending: false })
    .limit(50);

  // Execução dos follow-ups
  const followupLogsPromise = sb
    .from('followup_logs')
    .select('id,sessionId_lead,tipo_followup,message_followup,data_envio,status,response,webhook_url')
    .order('data_envio', { ascending: false })
    .limit(50);

  // Configuração das cadências
  const followupConfigPromise = sb
    .from('followup_config')
    .select('id,tipo_followup,tempo_minuto,ativo,message_1,message_2,message_3,url_webhook');

  // Memória (contexto da conversa)
  const memoriaPromise = sb
    .from('memoria')
    .select('session_id,created_at,last_message_user,last_message_ia,memoria_lead')
    .order('created_at', { ascending: false })
    .limit(50);

  // Históricos de chat (n8n)
  const chatHistoriesPromise = sb
    .from('n8n_chat_histories')
    .select('id,session_id,created_at,message')
    .order('created_at', { ascending: false })
    .limit(100);

  // Buffer de mensagens
  const bufferMessagePromise = sb
    .from('buffer_message')
    .select('id,created_at,message,chatId,messageId')
    .order('created_at', { ascending: false })
    .limit(50);

  // Curadoria - qualidade das interações
  const curadoriaPromise = sb
    .from('curadoria_interacao_ai')
    .select('id,created_at,name,sessionId,message_user,message_ai,internal_reasoning')
    .order('created_at', { ascending: false })
    .limit(30);

  // Alertas enviados
  const alertasPromise = sb
    .from('logs_alertas_enviados')
    .select('id,sessionId,alerta,created_at')
    .order('created_at', { ascending: false })
    .limit(30);

  // Intervenção humana
  const intervencaoPromise = sb
    .from('intervencao_humana')
    .select('id,whatsapp,date_time,create_date,motivo')
    .order('create_date', { ascending: false })
    .limit(30);

  // Prompts / Configuração de cérebro da Iza
  const promptsPromise = sb
    .from('agent_rag_prompts')
    .select('id,tipo,prompt_analise_interacao,prompt_agente_conhecimento,modelo_saida_estruturada_analise,modelo_saida_estruturada_conhecimento')
    .order('created_at', { ascending: false })
    .limit(10);

  // Aguardar todas em paralelo
  const [
    leadsRes,
    leadsEventoRes,
    followupAgendadosRes,
    followupControlRes,
    followupLogsRes,
    followupConfigRes,
    memoriaRes,
    chatHistoriesRes,
    bufferMessageRes,
    curadoriaRes,
    alertasRes,
    intervencaoRes,
    promptsRes,
  ] = await Promise.all([
    leadsPromise,
    leadsEventoPromise,
    followupAgendadosPromise,
    followupControlPromise,
    followupLogsPromise,
    followupConfigPromise,
    memoriaPromise,
    chatHistoriesPromise,
    bufferMessagePromise,
    curadoriaPromise,
    alertasPromise,
    intervencaoPromise,
    promptsPromise,
  ]);

  if (leadsRes.error) throw new Error(`leads: ${leadsRes.error.message}`);
  if (leadsEventoRes.error) console.warn(`leads_evento (non-critical): ${leadsEventoRes.error.message}`);
  if (followupAgendadosRes.error) console.warn(`FollowUp_Agendados (non-critical): ${followupAgendadosRes.error.message}`);
  if (followupControlRes.error) console.warn(`FollowUp_Control (non-critical): ${followupControlRes.error.message}`);
  if (followupLogsRes.error) console.warn(`followup_logs (non-critical): ${followupLogsRes.error.message}`);
  if (followupConfigRes.error) console.warn(`followup_config (non-critical): ${followupConfigRes.error.message}`);
  if (memoriaRes.error) console.warn(`memoria (non-critical): ${memoriaRes.error.message}`);
  if (chatHistoriesRes.error) console.warn(`n8n_chat_histories (non-critical): ${chatHistoriesRes.error.message}`);
  if (bufferMessageRes.error) console.warn(`buffer_message (non-critical): ${bufferMessageRes.error.message}`);
  if (curadoriaRes.error) console.warn(`curadoria_interacao_ai (non-critical): ${curadoriaRes.error.message}`);
  if (alertasRes.error) console.warn(`logs_alertas_enviados (non-critical): ${alertasRes.error.message}`);
  if (intervencaoRes.error) console.warn(`intervencao_humana (non-critical): ${intervencaoRes.error.message}`);
  if (promptsRes.error) console.warn(`agent_rag_prompts (non-critical): ${promptsRes.error.message}`);

  return {
    leads: (leadsRes.data ?? []) as Record<string, any>[],
    leadsEvento: (leadsEventoRes.data ?? []) as Record<string, any>[],
    followupAgendados: (followupAgendadosRes.data ?? []) as Record<string, any>[],
    followupControl: (followupControlRes.data ?? []) as Record<string, any>[],
    followupLogs: (followupLogsRes.data ?? []) as Record<string, any>[],
    followupConfig: (followupConfigRes.data ?? []) as Record<string, any>[],
    memoria: (memoriaRes.data ?? []) as Record<string, any>[],
    chatHistories: (chatHistoriesRes.data ?? []) as Record<string, any>[],
    bufferMessage: (bufferMessageRes.data ?? []) as Record<string, any>[],
    curadoria: (curadoriaRes.data ?? []) as Record<string, any>[],
    alertas: (alertasRes.data ?? []) as Record<string, any>[],
    intervencao: (intervencaoRes.data ?? []) as Record<string, any>[],
    prompts: (promptsRes.data ?? []) as Record<string, any>[],
  };
}

function normalizeLead(row: Record<string, any>, agentId: string): Lead {
  const createdAt = toStr(row.created_at) ?? new Date().toISOString();
  return {
    id: String(row.id),
    nome: toStr(row.nome) ?? 'Sem nome',
    email: toStr(row['e-mail']) ?? '',
    whatsapp: toStr(row.whatsapp),
    telefone: undefined,
    empresa: undefined,
    origem: (row.origem as any) ?? 'Campanha',
    status: (row.etapa as any) ?? 'NOVO',
    agente_atual_id: agentId,
    tempo_parado: undefined,
    valor_potencial: 0,
    ultima_interacao: toStr(row.ultima_mensagem_ia) ?? toStr(row.ultima_mensagem_user) ?? createdAt,
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
    console.log(`[Iza] Leads: ${leads.length}, LeadsEvento: ${data.leadsEvento.length}, FollowupControl: ${data.followupControl.length}, ` +
      `FollowupLogs: ${data.followupLogs.length}, Memoria: ${data.memoria.length}, ` +
      `ChatHistories: ${data.chatHistories.length}, Curadoria: ${data.curadoria.length}, ` +
      `Alertas: ${data.alertas.length}, Intervencao: ${data.intervencao.length}`);

    return buildAgentCommon(agentId, 'Iza', leads, events);
  },
};
