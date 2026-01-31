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
  // Leads CRM (base principal com detalhes de veículo)
  const leadsPromise = sb
    .from('Leads CRM')
    .select(`
      id,created_at,nome,email,telefone,origem,status,ultima_interacao,valor_potencial,
      "Tipo de Atendimento",message,contato_realizado,
      id_veiculo,url_veiculo,marca_veiculo,modelo_veiculo,versao_veiculo,ano_veiculo,cor_veiculo,condicao_veiculo
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  // AI Chat Sessions com metadados
  const sessionsPromise = sb
    .from('ai_chat_sessions')
    .select(`
      id,lead_id,session_id,created_at,updated_at,status,last_message_at,
      vendedor_id,loja_id,platform,session_data
    `)
    .order('last_message_at', { ascending: false })
    .limit(50);

  // Análise de interações IA (cérebro analítico)
  const analisesPromise = sb
    .from('analise_interacoes_ia')
    .select(`
      id,created_at,nome,whatsapp,loja,interesse,interesse_veiculo,veiculo,
      interesse_compra_futura,solicitou_retorno,data_retorno,respondeu,alerta,
      justificativa_alerta,problema,relato_problema,feedback,analise_sentimento,
      resumo_interacao,reanalise
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  // Chat histories BDR (históricos da conversa)
  const chatHistoriesBdrPromise = sb
    .from('chat_histories_bdr')
    .select('id,session_id,message,created_at')
    .order('created_at', { ascending: true })
    .limit(100);

  // Automated reminders (lembretes automáticos)
  const remindersPromise = sb
    .from('automated_reminders')
    .select('id,reminder_type,scheduled_for,sent_at,status,content,lead_id')
    .order('scheduled_for', { ascending: false })
    .limit(30);

  // Follow-up config (configuração de follow-up)
  const followupConfigPromise = sb
    .from('followup_config')
    .select('id,ia_nome,tipo_followup,tempo_minuto')
    .eq('ia_nome', 'Luis');

  // Buffer de mensagens
  const bufferMessagePromise = sb
    .from('buffer_message')
    .select('id,created_at,message,chatId,idMessage,timestamp')
    .order('created_at', { ascending: false })
    .limit(50);

  // Evolution API config (Status do WhatsApp)
  const evolutionConfigPromise = sb
    .from('evolution_api_config')
    .select('instance_name,api_url,phone_number,qr_code,status,is_active,created_at,updated_at')
    .order('created_at', { ascending: false })
    .limit(1);

  // Contatos
  const contatosPromise = sb
    .from('contatos')
    .select('id,nome,whatsapp,email,created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  // Documents (base de conhecimento)
  const documentsPromise = sb
    .from('documents')
    .select('id,content,metadata,embedding,created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  // Aguardar todas em paralelo
  const [
    leadsRes,
    sessionsRes,
    analisesRes,
    chatHistoriesRes,
    remindersRes,
    followupConfigRes,
    bufferMessageRes,
    evolutionConfigRes,
    contatosRes,
    documentsRes,
  ] = await Promise.all([
    leadsPromise,
    sessionsPromise,
    analisesPromise,
    chatHistoriesBdrPromise,
    remindersPromise,
    followupConfigPromise,
    bufferMessagePromise,
    evolutionConfigPromise,
    contatosPromise,
    documentsPromise,
  ]);

  if (leadsRes.error) throw new Error(`Leads CRM: ${leadsRes.error.message}`);
  if (sessionsRes.error) console.warn(`ai_chat_sessions (non-critical): ${sessionsRes.error.message}`);
  if (analisesRes.error) console.warn(`analise_interacoes_ia (non-critical): ${analisesRes.error.message}`);
  if (chatHistoriesRes.error) console.warn(`chat_histories_bdr (non-critical): ${chatHistoriesRes.error.message}`);
  if (remindersRes.error) console.warn(`automated_reminders (non-critical): ${remindersRes.error.message}`);
  if (followupConfigRes.error) console.warn(`followup_config (non-critical): ${followupConfigRes.error.message}`);
  if (bufferMessageRes.error) console.warn(`buffer_message (non-critical): ${bufferMessageRes.error.message}`);
  if (evolutionConfigRes.error) console.warn(`evolution_api_config (non-critical): ${evolutionConfigRes.error.message}`);
  if (contatosRes.error) console.warn(`contatos (non-critical): ${contatosRes.error.message}`);
  if (documentsRes.error) console.warn(`documents (non-critical): ${documentsRes.error.message}`);

  return {
    leads: (leadsRes.data ?? []) as Record<string, any>[],
    sessions: (sessionsRes.data ?? []) as Record<string, any>[],
    analises: (analisesRes.data ?? []) as Record<string, any>[],
    chatHistories: (chatHistoriesRes.data ?? []) as Record<string, any>[],
    reminders: (remindersRes.data ?? []) as Record<string, any>[],
    followupConfig: (followupConfigRes.data ?? []) as Record<string, any>[],
    bufferMessage: (bufferMessageRes.data ?? []) as Record<string, any>[],
    evolutionConfig: (evolutionConfigRes.data ?? []) as Record<string, any>[],
    contatos: (contatosRes.data ?? []) as Record<string, any>[],
    documents: (documentsRes.data ?? []) as Record<string, any>[],
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
    console.log(`[Luis] Leads: ${leads.length}, Sessions: ${data.sessions.length}, Analises: ${data.analises.length}, ` +
      `ChatHistories: ${data.chatHistories.length}, Reminders: ${data.reminders.length}, ` +
      `FollowupConfig: ${data.followupConfig.length}, BufferMsg: ${data.bufferMessage.length}, ` +
      `Contatos: ${data.contatos.length}, Documents: ${data.documents.length}`);

    return buildAgentCommon(agentId, 'Luís', leads, events);
  },
};
