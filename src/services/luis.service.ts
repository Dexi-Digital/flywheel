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
  // Nota: A coluna é "Nome" (maiúsculo) no banco de dados
  // Email não existe na tabela, removido da query
  const leadsPromise = sb
    .from('Leads CRM')
    .select(`
      id,created_at,Nome,telefone,origem,status,ultima_interacao,valor_potencial,
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
  // Nota: A tabela contatos pode não ter as colunas email e created_at
  const contatosPromise = sb
    .from('contatos')
    .select('id,nome,whatsapp')
    .limit(50);

  // Documents (base de conhecimento)
  // Nota: A tabela documents pode não ter a coluna created_at
  const documentsPromise = sb
    .from('documents')
    .select('id,content,metadata,embedding')
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
    // Nota: A coluna no banco é "Nome" (maiúsculo)
    nome: toStr(row.Nome) ?? toStr(row.nome) ?? 'Sem nome',
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

    // MÉTRICAS ESPECÍFICAS DO LUÍS

    // 1. Speed to Lead (<60s SLA)
    let speedToLeadCount = 0;
    let totalDigitalLeads = 0;

    data.sessions.forEach(session => {
      const lead = data.leads.find(l => String(l.id) === String(session.lead_id));
      if (lead && ['Site', 'Chat', 'WebMotors'].includes(lead.origem)) {
        totalDigitalLeads++;
        const leadCreated = new Date(lead.created_at).getTime();
        const sessionCreated = new Date(session.created_at).getTime();
        const diffSeconds = (sessionCreated - leadCreated) / 1000;
        if (diffSeconds <= 60) speedToLeadCount++;
      }
    });

    const speedToLeadRate = totalDigitalLeads > 0 ? (speedToLeadCount / totalDigitalLeads) * 100 : 0;

    // 2. Score de Qualificação BANT (média)
    let totalScore = 0;
    let scoredLeads = 0;

    data.analises.forEach(analise => {
      let score = 0;
      if (analise.interesse === 'Alto') score += 30;
      else if (analise.interesse === 'Médio') score += 15;

      if (analise.interesse_compra_futura === 'Imediato') score += 30;
      else if (analise.interesse_compra_futura === 'Curto prazo') score += 20;
      else if (analise.interesse_compra_futura === 'Médio prazo') score += 10;

      if (analise.solicitou_retorno === true) score += 20;
      if (analise.respondeu === true) score += 20;

      if (score > 0) {
        totalScore += score;
        scoredLeads++;
      }
    });

    const avgQualificationScore = scoredLeads > 0 ? totalScore / scoredLeads : 0;

    // 3. Follow-ups ativos
    const followupsAtivos = data.reminders.filter(r => r.status === 'pending').length;

    // 4. Taxa de resposta pós-follow-up
    const followupsSent = data.reminders.filter(r => r.status === 'sent').length;
    const followupResponseRate = followupsSent > 0 ?
      (data.analises.filter(a => a.respondeu === true).length / followupsSent) * 100 : 0;

    // Log summary
    console.log(`[Luis] Leads: ${leads.length}, Speed-to-Lead: ${speedToLeadRate.toFixed(1)}%, ` +
      `Avg Score: ${avgQualificationScore.toFixed(0)}, Followups Ativos: ${followupsAtivos}`);

    return buildAgentCommon(agentId, 'Luís', leads, events, {
      tipo: 'SDR',
      metricas_agregadas: {
        leads_ativos: leads.length,
        conversoes: leads.filter(l => l.status === 'GANHO').length,
        receita_total: leads.filter(l => l.status === 'GANHO').reduce((s, l) => s + l.valor_potencial, 0),
        disparos_hoje: events.length,
        speed_to_lead_rate: speedToLeadRate,
        avg_qualification_score: avgQualificationScore,
        followups_ativos: followupsAtivos,
        followup_response_rate: followupResponseRate,
      },
    });
  },
};
