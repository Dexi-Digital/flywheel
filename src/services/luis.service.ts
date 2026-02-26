import type { SupabaseClient } from '@supabase/supabase-js';
import type { AgentService } from '@/types/service.type';
import { getBrowserTenantClient } from '@/lib/supabase/agentClients';
import { getTenantConfig } from '@/lib/supabase/agents';
import { Lead, Event } from '@/types/database.types';
import { buildAgentCommon } from './common';
import type {
  LuisKpiPulse,
  LuisQualificationLead,
  LuisTrafficData,
  LuisVehicleStat,
  LuisGovernanceData,
  LuisEngagementRate,
  LuisLeadsInAttendance,
  LuisLeadsOutsideBusinessHours,
  LuisTotalLeadsToday,
  LuisUserLoja,
  LuisUserRole,
  LuisDocumentMatch,
} from '@/types/luis-api.types';

// ============================================================================
// NOVAS FUNÇÕES SDR HÍBRIDO (MÉTRICAS E RPCS)
// ============================================================================

/**
 * Chama a Edge Function rpc-metrics para obter KPIs específicos.
 * 
 * @param action - A ação a ser executada (total_leads_today, engagement_rate, etc)
 * @param params - Parâmetros opcionais (tz, business_start_hour, etc)
 */
export async function getLuisMetrics<T>(action: string, params: Record<string, any> = {}): Promise<T | null> {
  try {
    const cfg = getTenantConfig('agent-luis');
    // A URL da Edge Function segue o padrão: https://<PROJECT_REF>.functions.supabase.co/<FUNCTION_NAME>
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_LUIS || cfg.supabaseUrl;
    const projectRef = baseUrl.split('//')[1].split('.')[0];
    const functionUrl = `https://${projectRef}.functions.supabase.co/rpc-metrics`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.anonKey}`,
        'apikey': cfg.anonKey,
      },
      body: JSON.stringify({ action, params }),
    });

    if (!response.ok) {
      throw new Error(`Erro na Edge Function rpc-metrics: ${response.statusText}`);
    }

    const result = await response.json();
    return result as T;
  } catch (err) {
    console.error(`[Luis Metrics] Erro ao chamar ação ${action}:`, err);
    return null;
  }
}

/** Obtém a loja do usuário atual */
export async function getCurrentUserLoja(): Promise<LuisUserLoja | null> {
  try {
    const cfg = getTenantConfig('agent-luis');
    const sb = getBrowserTenantClient('agent-luis', cfg);
    const { data, error } = await sb.rpc('get_current_user_loja');
    if (error) throw error;
    return data as LuisUserLoja;
  } catch (err) {
    console.error('[Luis] Erro ao buscar loja do usuário:', err);
    return null;
  }
}

/** Obtém o papel (role) do usuário atual */
export async function getCurrentUserRole(): Promise<LuisUserRole | null> {
  try {
    const cfg = getTenantConfig('agent-luis');
    const sb = getBrowserTenantClient('agent-luis', cfg);
    const { data, error } = await sb.rpc('get_current_user_role');
    if (error) throw error;
    return data as LuisUserRole;
  } catch (err) {
    console.error('[Luis] Erro ao buscar role do usuário:', err);
    return null;
  }
}

/** Busca correspondência de documentos via vetorial */
export async function matchDocuments(options: {
  query_text: string;
  match_limit?: number;
  match_threshold?: number;
}): Promise<LuisDocumentMatch[] | null> {
  try {
    const cfg = getTenantConfig('agent-luis');
    const sb = getBrowserTenantClient('agent-luis', cfg);
    const { data, error } = await sb.rpc('match_documents', options);
    if (error) throw error;
    return data as LuisDocumentMatch[];
  } catch (err) {
    console.error('[Luis] Erro ao buscar documentos:', err);
    return null;
  }
}

/** Insere um novo lead via RPC */
export async function insertLead(leadData: any): Promise<any | null> {
  try {
    const cfg = getTenantConfig('agent-luis');
    const sb = getBrowserTenantClient('agent-luis', cfg);
    const { data, error } = await sb.rpc('insert_lead', leadData);
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Luis] Erro ao inserir lead:', err);
    return null;
  }
}

/** Triga o processamento manual de follow-ups da IA */
export async function processarFollowupsIA(): Promise<any | null> {
  try {
    const cfg = getTenantConfig('agent-luis');
    const sb = getBrowserTenantClient('agent-luis', cfg);
    const { data, error } = await sb.rpc('processar_followups_ia');
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Luis] Erro ao processar follow-ups IA:', err);
    return null;
  }
}

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

// ============================================================================
// KPI PULSE - PULSO GERAL DA OPERAÇÃO LUÍS
// ============================================================================

/**
 * Busca as métricas de pulso (KPI Pulse) do agente Luís.
 *
 * @returns Objeto com métricas de KPI ou null em caso de erro.
 *
 * @ui_hints
 * - `leads_fora_horario` é a MÉTRICA PRINCIPAL DE VALOR do Luís
 *   → Deve ter DESTAQUE VISUAL (card maior, cor diferenciada, ícone especial)
 *   → Representa leads que seriam perdidos sem atendimento automático
 *
 * @example
 * const pulse = await getLuisKpiPulse();
 * if (pulse) {
 *   console.log(`Leads fora do horário: ${pulse.leads_fora_horario}`);
 * }
 */
export async function getLuisKpiPulse(): Promise<LuisKpiPulse | null> {
  try {
    // Obter configuração e cliente Supabase para o Luís
    const cfg = getTenantConfig('agent-luis');
    const sb = getBrowserTenantClient('agent-luis', cfg);

    // Chamar a função RPC do Supabase
    // POST https://<supabase_url>/rest/v1/rpc/get_luis_kpi_pulse
    const { data, error } = await sb.rpc('get_luis_kpi_pulse');

    // Tratamento de erro do Supabase
    if (error) {
      console.error('[Luis KPI Pulse] Erro ao buscar KPIs:', JSON.stringify(error, null, 2));
      return null;
    }

    // Validar se data existe
    if (!data) {
      console.warn('[Luis KPI Pulse] Nenhum dado retornado');
      return null;
    }

    // Log de debug para desenvolvimento
    console.log('[Luis KPI Pulse] Dados recebidos:', data);

    return data as LuisKpiPulse;
  } catch (err) {
    console.error('[Luis KPI Pulse] Erro inesperado:', err);
    return null;
  }
}

// ============================================================================
// QUALIFICATION LIST - LISTA DE LEADS QUENTES (PLANTÃO)
// ============================================================================

/**
 * Busca a lista de leads qualificados ("Leads Quentes") do agente Luís.
 *
 * Retorna os Top 20 leads que chegaram no plantão e foram pré-qualificados
 * pela IA, prontos para atendimento humano (agendamento).
 *
 * @returns Array de leads qualificados ou null em caso de erro.
 *
 * @ui_hints
 * - Se `solicitou_humano === true`: Badge "Solicitou Agente" com prioridade MÁXIMA
 * - `resumo_ia`: Exibir truncado com tooltip ou em linha secundária menor
 * - Ordenar por prioridade: solicitou_humano primeiro, depois por horario_entrada
 *
 * @example
 * const leads = await getLuisQualificationList();
 * if (leads) {
 *   const urgentes = leads.filter(l => l.solicitou_humano);
 *   console.log(`${urgentes.length} leads solicitaram agente humano`);
 * }
 */
export async function getLuisQualificationList(): Promise<LuisQualificationLead[] | null> {
  try {
    // Obter configuração e cliente Supabase para o Luís
    const cfg = getTenantConfig('agent-luis');
    const sb = getBrowserTenantClient('agent-luis', cfg);

    // Chamar a função RPC do Supabase
    // POST https://<supabase_url>/rest/v1/rpc/get_luis_qualification_list
    const { data, error } = await sb.rpc('get_luis_qualification_list');

    // Tratamento de erro do Supabase
    if (error) {
      console.error('[Luis Qualification List] Erro ao buscar leads qualificados:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    // Validar se data existe e é um array
    if (!data || !Array.isArray(data)) {
      console.warn('[Luis Qualification List] Nenhum dado retornado ou formato inválido');
      return [];
    }

    // Log de debug para desenvolvimento
    console.log(`[Luis Qualification List] ${data.length} leads qualificados encontrados`);

    return data as LuisQualificationLead[];
  } catch (err) {
    console.error('[Luis Qualification List] Erro inesperado:', err);
    return null;
  }
}

// ============================================================================
// TRAFFIC HEATMAP - DISTRIBUIÇÃO DE TRÁFEGO POR HORA
// ============================================================================

/**
 * Busca a distribuição de tráfego por hora do agente Luís.
 *
 * Retorna o volume de leads acumulado por hora do dia (0-23h),
 * permitindo identificar picos de atendimento, especialmente os noturnos.
 *
 * @returns Array com 24 objetos (um por hora) ou null em caso de erro.
 *
 * @ui_hints (Recharts BarChart)
 * - Tipo de gráfico: BarChart vertical
 * - Eixo X: hora (formatar 0 -> "00h", 13 -> "13h")
 * - Eixo Y: volume de leads
 * - Tooltip: "X leads às Yh" (ex: "15 leads às 22h")
 *
 * - DESTAQUE VISUAL para "Turno do Luís" (19h-08h):
 *   → Barras 19h-23h e 00h-07h: cor diferenciada (indigo/violet)
 *   → Barras 08h-18h: cor neutra (slate/gray)
 *
 * @example
 * const traffic = await getLuisTrafficHeatmap();
 * if (traffic) {
 *   const turnoLuis = traffic.filter(t => t.hora >= 19 || t.hora < 8);
 *   const volumeNoturno = turnoLuis.reduce((sum, t) => sum + t.volume, 0);
 * }
 */
export async function getLuisTrafficHeatmap(): Promise<LuisTrafficData[] | null> {
  try {
    // Obter configuração e cliente Supabase para o Luís
    const cfg = getTenantConfig('agent-luis');
    const sb = getBrowserTenantClient('agent-luis', cfg);

    // Chamar a função RPC do Supabase
    // POST https://<supabase_url>/rest/v1/rpc/get_luis_traffic_heatmap
    const { data, error } = await sb.rpc('get_luis_traffic_heatmap');

    // Tratamento de erro do Supabase
    if (error) {
      console.error('[Luis Traffic Heatmap] Erro ao buscar distribuição de tráfego:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    // Validar se data existe e é um array
    if (!data || !Array.isArray(data)) {
      console.warn('[Luis Traffic Heatmap] Nenhum dado retornado ou formato inválido');
      return [];
    }

    // Log de debug para desenvolvimento
    const totalVolume = data.reduce((sum: number, item: LuisTrafficData) => sum + item.volume, 0);
    console.log(`[Luis Traffic Heatmap] ${data.length} horas, ${totalVolume} leads total`);

    return data as LuisTrafficData[];
  } catch (err) {
    console.error('[Luis Traffic Heatmap] Erro inesperado:', err);
    return null;
  }
}

// ============================================================================
// VEHICLE INTEREST - PREFERÊNCIA DE VEÍCULOS (TOP 10)
// ============================================================================

/**
 * Busca o ranking de veículos mais procurados pelos leads do Luís.
 *
 * Retorna o Top 10 modelos mais solicitados, já limpos e padronizados,
 * ideal para entender o perfil da demanda noturna.
 *
 * @returns Array com Top 10 veículos ou null em caso de erro.
 *
 * @ui_hints (Recharts PieChart ou Lista Classificada)
 * - PieChart/Donut: mostra "fatia" de cada modelo na demanda
 *   → Cores categóricas distintas
 *   → Tooltip: "X interessados (Y%)"
 *
 * - Alternativa: Lista/Ranking com barras de progresso
 *   → Ordenado do maior para menor
 *   → Badge com posição (#1, #2, etc)
 *
 * @example
 * const vehicles = await getLuisVehicleInterest();
 * if (vehicles) {
 *   const top3 = vehicles.slice(0, 3);
 *   console.log(`Top 3: ${top3.map(v => v.veiculo).join(', ')}`);
 * }
 */
export async function getLuisVehicleInterest(): Promise<LuisVehicleStat[] | null> {
  try {
    // Obter configuração e cliente Supabase para o Luís
    const cfg = getTenantConfig('agent-luis');
    const sb = getBrowserTenantClient('agent-luis', cfg);

    // Chamar a função RPC do Supabase
    // POST https://<supabase_url>/rest/v1/rpc/get_luis_vehicle_interest
    const { data, error } = await sb.rpc('get_luis_vehicle_interest');

    // Tratamento de erro do Supabase
    if (error) {
      console.error('[Luis Vehicle Interest] Erro ao buscar preferência de veículos:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    // Validar se data existe e é um array
    if (!data || !Array.isArray(data)) {
      console.warn('[Luis Vehicle Interest] Nenhum dado retornado ou formato inválido');
      return [];
    }

    // Log de debug para desenvolvimento
    const totalInteresse = data.reduce((sum: number, item: LuisVehicleStat) => sum + item.total, 0);
    console.log(`[Luis Vehicle Interest] ${data.length} veículos, ${totalInteresse} interessados total`);

    return data as LuisVehicleStat[];
  } catch (err) {
    console.error('[Luis Vehicle Interest] Erro inesperado:', err);
    return null;
  }
}

// ============================================================================
// GOVERNANCE - GOVERNANÇA E SAÚDE TÉCNICA
// ============================================================================

/**
 * Busca os dados de governança e saúde técnica do agente Luís.
 *
 * Monitora se a infraestrutura (WhatsApp) está operacional e se o agente
 * está deixando passar leads (falha crítica de negócio).
 *
 * @returns Objeto com status de governança ou null em caso de erro.
 *
 * @ui_hints (Regras de Alerta)
 * - `status_whatsapp !== 'connected'` = ALERTA VERMELHO (Sistema Offline)
 * - `leads_sem_atendimento > 0` = ALERTA VERMELHO (Perda de Vendas)
 * - `fila_envio > 20` = ALERTA AMARELO (Lentidão)
 * - `fila_envio > 50` = ALERTA VERMELHO (Sistema sobrecarregado)
 *
 * @example
 * const governance = await getLuisGovernance();
 * if (governance) {
 *   const isHealthy = governance.status_whatsapp === 'connected'
 *     && governance.leads_sem_atendimento === 0
 *     && governance.fila_envio < 20;
 *   console.log(`Sistema ${isHealthy ? 'OK' : 'COM PROBLEMAS'}`);
 * }
 */
export async function getLuisGovernance(): Promise<LuisGovernanceData | null> {
  try {
    // Obter configuração e cliente Supabase para o Luís
    const cfg = getTenantConfig('agent-luis');
    const sb = getBrowserTenantClient('agent-luis', cfg);

    // Chamar a função RPC do Supabase
    // POST https://<supabase_url>/rest/v1/rpc/get_luis_governance
    const { data, error } = await sb.rpc('get_luis_governance');

    // Tratamento de erro do Supabase
    if (error) {
      console.error('[Luis Governance] Erro ao buscar dados de governança:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    // Validar se data existe
    if (!data) {
      console.warn('[Luis Governance] Nenhum dado retornado');
      return null;
    }

    // Log de debug com status de saúde
    const isHealthy = data.status_whatsapp === 'connected'
      && data.leads_sem_atendimento === 0
      && data.fila_envio < 20;

    console.log(`[Luis Governance] Status: ${isHealthy ? '✅ OK' : '⚠️ ATENÇÃO'}`, {
      whatsapp: data.status_whatsapp,
      fila: data.fila_envio,
      leads_perdidos: data.leads_sem_atendimento,
    });

    // Alertas críticos no console para debugging
    if (data.status_whatsapp !== 'connected') {
      console.error('[Luis Governance] 🚨 CRÍTICO: WhatsApp OFFLINE!');
    }
    if (data.leads_sem_atendimento > 0) {
      console.error(`[Luis Governance] 🚨 CRÍTICO: ${data.leads_sem_atendimento} leads sem atendimento!`);
    }
    if (data.fila_envio > 50) {
      console.error(`[Luis Governance] 🚨 CRÍTICO: Fila sobrecarregada (${data.fila_envio} mensagens)`);
    } else if (data.fila_envio > 20) {
      console.warn(`[Luis Governance] ⚠️ AVISO: Fila alta (${data.fila_envio} mensagens)`);
    }

    return data as LuisGovernanceData;
  } catch (err) {
    console.error('[Luis Governance] Erro inesperado:', err);
    return null;
  }
}
