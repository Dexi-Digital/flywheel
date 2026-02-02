/**
 * Serviço para os endpoints do Dashboard Alice (BDR).
 *
 * Estratégia de dados:
 * - Busca dados reais via RPC do Supabase (alice.service.ts)
 * - Se falhar, propaga o erro para a UI exibir ao usuário
 */

import type {
  AliceKpiFunnelResponse,
  AliceTimelineActivityResponse,
  AliceLeadListResponse,
  AliceVehicleHeatmapResponse,
  AliceGovernanceAlertsResponse,
} from '@/types/alice-api.types';

// Importar funções RPC reais do alice.service.ts
import {
  getAliceFunnelMetrics,
  getAliceActivityTimeline,
  getAliceLeadList,
  getAliceVehicleHeatmap,
  getAliceGovernanceAlerts,
} from './alice.service';

// ============================================================================
// FUNÇÕES DE FETCH COM DADOS REAIS (RPC)
// ============================================================================

/**
 * Busca KPIs do Funil de Prospecção
 * Fonte: RPC get_alice_kpi_funnel
 * @throws Error se a chamada RPC falhar
 */
export async function fetchAliceKpiFunnel(): Promise<AliceKpiFunnelResponse> {
  const data = await getAliceFunnelMetrics();

  if (!data) {
    throw new Error('Falha ao carregar KPIs do funil de prospecção');
  }

  // Mapear do contrato RPC para o contrato da UI
  return {
    total_base: data.base_total,
    validos: data.validos,
    contatados: data.contatados,
    engajados: data.engajados,
  };
}

/**
 * Busca Timeline de Atividade (disparos passados + previsão futura)
 * Fonte: RPC get_alice_timeline_activity
 * @throws Error se a chamada RPC falhar
 */
export async function fetchAliceTimelineActivity(): Promise<AliceTimelineActivityResponse> {
  const data = await getAliceActivityTimeline();

  if (!data) {
    throw new Error('Falha ao carregar timeline de atividade');
  }

  // Separar passado e futuro baseado na data de hoje
  const hoje = new Date().toISOString().slice(0, 10);

  const passado = data
    .filter(p => p.data <= hoje)
    .map(p => ({ date: p.data, count: p.realizado }));

  const futuro = data
    .filter(p => p.data > hoje)
    .map(p => ({ date: p.data, count: p.previsto }));

  return { passado, futuro };
}

/**
 * Busca Lista de Leads Priorizada
 * Fonte: RPC get_alice_lead_list
 * @throws Error se a chamada RPC falhar
 */
export async function fetchAliceLeadList(): Promise<AliceLeadListResponse> {
  const data = await getAliceLeadList();

  if (!data) {
    throw new Error('Falha ao carregar lista de leads');
  }

  // Mapear do contrato RPC para o contrato da UI
  return data.map(lead => ({
    nome: lead.nome,
    whatsapp: lead.whatsapp,
    veiculo_interesse: lead.veiculo_interesse ?? '',
    ultima_resposta: lead.ultima_resposta,
    sessionId: lead.session_id,
    data_proximo_contato: lead.data_proximo_contato,
    precisa_intervencao: lead.precisa_intervencao,
  }));
}

/**
 * Busca Heatmap de Veículos (taxa de conversão por modelo)
 * Fonte: RPC get_alice_vehicle_heatmap
 * @throws Error se a chamada RPC falhar
 */
export async function fetchAliceVehicleHeatmap(): Promise<AliceVehicleHeatmapResponse> {
  const data = await getAliceVehicleHeatmap();

  if (!data) {
    throw new Error('Falha ao carregar heatmap de veículos');
  }

  // Mapear do contrato RPC para o contrato da UI
  // Ordenar por TAXA DE RESPOSTA (percentual) DESC
  return data
    .map(v => ({
      veiculo_interesse: v.veiculo,
      total_leads: v.total_leads,
      total_respostas: v.total_respostas,
    }))
    .sort((a, b) => {
      // Calcular taxa de resposta para ordenação
      const taxaA = a.total_leads > 0 ? (a.total_respostas / a.total_leads) * 100 : 0;
      const taxaB = b.total_leads > 0 ? (b.total_respostas / b.total_leads) * 100 : 0;
      return taxaB - taxaA;
    });
}

/**
 * Busca Dados de Governança e Alertas
 * Fonte: RPC get_alice_governance_alerts
 * @throws Error se a chamada RPC falhar
 */
export async function fetchAliceGovernanceAlerts(): Promise<AliceGovernanceAlertsResponse> {
  const data = await getAliceGovernanceAlerts();

  if (!data) {
    throw new Error('Falha ao carregar dados de governança');
  }

  // Mapear do contrato RPC para o contrato da UI
  return {
    buffer_represado: data.buffer_queue,
    total_intervencoes: data.recent_errors.length,
    total_contatados: 0, // Será calculado no front se necessário
    taxa_intervencao: data.intervention_rate,
    ultimos_erros: data.recent_errors.map(err => ({
      id: String(err.id),
      created_at: err.created_at,
      curadoria: err.message_ai || err.message_user || 'Erro não especificado',
      sessionId: err.sessionId ?? undefined,
    })),
  };
}

// ============================================================================
// FUNÇÃO AGREGADORA (carrega todos os dados em paralelo)
// ============================================================================

/**
 * Carrega todos os dados do dashboard Alice de uma vez
 *
 * Executa todas as chamadas em paralelo para melhor performance.
 * Se qualquer chamada falhar, propaga o erro para a UI.
 *
 * @throws Error se qualquer chamada RPC falhar
 */
export async function fetchAliceDashboard() {
  const [kpiFunnel, timelineActivity, leadList, vehicleHeatmap, governanceAlerts] = await Promise.all([
    fetchAliceKpiFunnel(),
    fetchAliceTimelineActivity(),
    fetchAliceLeadList(),
    fetchAliceVehicleHeatmap(),
    fetchAliceGovernanceAlerts(),
  ]);

  return {
    kpiFunnel,
    timelineActivity,
    leadList,
    vehicleHeatmap,
    governanceAlerts,
  };
}
