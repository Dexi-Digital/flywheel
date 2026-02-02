/**
 * Serviço para os endpoints do Dashboard Alice (BDR).
 * Base: /api/alice/* (quando existirem). Fallback: dados mock para desenvolvimento da UI.
 */

import type {
  AliceKpiFunnelResponse,
  AliceTimelineActivityResponse,
  AliceLeadListResponse,
  AliceVehicleHeatmapResponse,
  AliceGovernanceAlertsResponse,
} from '@/types/alice-api.types';

const BASE = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_APP_URL || '';
const API_PREFIX = `${BASE}/api/alice`;

async function get<T>(path: string, mock: T): Promise<T> {
  try {
    const res = await fetch(`${API_PREFIX}${path}`, { cache: 'no-store' });
    if (res.ok) return (await res.json()) as T;
  } catch (_e) {
    // Rede ou API indisponível: usar mock
  }
  return mock;
}

/** Dados mock para desenvolvimento da UI (sem backend) */
function getMockKpiFunnel(): AliceKpiFunnelResponse {
  return {
    total_base: 1250,
    validos: 980,
    contatados: 420,
    engajados: 89,
  };
}

function getMockTimeline(): AliceTimelineActivityResponse {
  const hoje = new Date();
  const passado = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() - (13 - i));
    return {
      date: d.toISOString().slice(0, 10),
      count: Math.floor(Math.random() * 40) + 5,
    };
  });
  const futuro = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() + i + 1);
    return {
      date: d.toISOString().slice(0, 10),
      count: Math.floor(Math.random() * 25) + 3,
    };
  });
  return { passado, futuro };
}

function getMockLeadList(): AliceLeadListResponse {
  const nomes = ['Ana Silva', 'Bruno Costa', 'Carla Mendes', 'Diego Lima', 'Elena Souza', 'Fábio Rocha', 'Giovana Alves', 'Henrique Dias', 'Ivana Oliveira', 'João Pedro'];
  const veiculos = ['Argo', 'Toro', 'Cronos', 'Compass', 'Renegade', 'Strada'];
  return nomes.map((nome, i) => ({
    nome,
    whatsapp: `(11) 9${8000 + i}${1000 + i}-${1000 + i}`,
    veiculo_interesse: veiculos[i % veiculos.length],
    ultima_resposta: i < 4 ? new Date(Date.now() - i * 86400000 * 2).toISOString() : null,
    sessionId: `sess-${i + 1}`,
    data_proximo_contato: i % 3 === 0 ? new Date(Date.now() + 86400000 * (i + 1)).toISOString() : null,
    precisa_intervencao: i === 1 || i === 5,
  }));
}

function getMockVehicleHeatmap(): AliceVehicleHeatmapResponse {
  return [
    { veiculo_interesse: 'Argo', total_leads: 320, total_respostas: 64 },
    { veiculo_interesse: 'Toro', total_leads: 280, total_respostas: 14 },
    { veiculo_interesse: 'Cronos', total_leads: 180, total_respostas: 36 },
    { veiculo_interesse: 'Compass', total_leads: 150, total_respostas: 23 },
    { veiculo_interesse: 'Renegade', total_leads: 95, total_respostas: 19 },
    { veiculo_interesse: 'Strada', total_leads: 85, total_respostas: 12 },
  ];
}

function getMockGovernance(): AliceGovernanceAlertsResponse {
  return {
    buffer_represado: 12,
    total_intervencoes: 8,
    total_contatados: 420,
    taxa_intervencao: 1.9,
    ultimos_erros: [
      { created_at: new Date(Date.now() - 3600000).toISOString(), curadoria: 'Lead perguntou sobre garantia estendida; IA não tinha contexto.' },
      { created_at: new Date(Date.now() - 7200000).toISOString(), curadoria: 'Cliente pediu para falar com humano; fluxo não transferiu.' },
      { created_at: new Date(Date.now() - 10800000).toISOString(), curadoria: 'Resposta genérica sobre financiamento; lead queria simulação.' },
    ],
  };
}

/** GET /api/alice/kpi-funnel */
export async function fetchAliceKpiFunnel(): Promise<AliceKpiFunnelResponse> {
  return get('/kpi-funnel', getMockKpiFunnel());
}

/** GET /api/alice/timeline-activity */
export async function fetchAliceTimelineActivity(): Promise<AliceTimelineActivityResponse> {
  return get('/timeline-activity', getMockTimeline());
}

/** GET /api/alice/lead-list */
export async function fetchAliceLeadList(): Promise<AliceLeadListResponse> {
  return get('/lead-list', getMockLeadList());
}

/** GET /api/alice/vehicle-heatmap */
export async function fetchAliceVehicleHeatmap(): Promise<AliceVehicleHeatmapResponse> {
  return get('/vehicle-heatmap', getMockVehicleHeatmap());
}

/** GET /api/alice/governance-alerts */
export async function fetchAliceGovernanceAlerts(): Promise<AliceGovernanceAlertsResponse> {
  return get('/governance-alerts', getMockGovernance());
}

/** Carrega todos os dados do dashboard Alice de uma vez (para uma única tela) */
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
