/**
 * Tipos para a API do Dashboard Agente Alice (BDR).
 * Banco: tecnologia.attraveiculos (leads_frios, follow-ups, intervencao_humana).
 */

/** Resposta do endpoint /api/alice/kpi-funnel */
export interface AliceKpiFunnelResponse {
  total_base: number;
  validos: number;
  contatados: number;
  engajados: number;
}

/** Um dia no gráfico de timeline: passado (disparos) e/ou futuro (previsão) */
export interface AliceTimelineDay {
  date: string;       // ISO date ou "YYYY-MM-DD"
  disparos: number;   // contato_realizado = 'Sim' (barras sólidas)
  previsao: number;   // follow-ups com shot_fired = false (barras tracejadas)
}

/** Resposta do endpoint /api/alice/timeline-activity */
export interface AliceTimelineActivityResponse {
  passado: { date: string; count: number }[];
  futuro: { date: string; count: number }[];
}

/** Item da lista principal de leads (endpoint /api/alice/lead-list) */
export interface AliceLeadListItem {
  nome: string;
  whatsapp: string;
  veiculo_interesse: string;
  ultima_resposta: string | null;  // last_message_lead (ISO)
  sessionId: string;
  data_proximo_contato: string | null;  // próximo follow-up não disparado
  precisa_intervencao: boolean;
}

/** Resposta do endpoint /api/alice/lead-list */
export type AliceLeadListResponse = AliceLeadListItem[];

/** Item do heatmap por veículo (endpoint /api/alice/vehicle-heatmap) */
export interface AliceVehicleHeatmapItem {
  veiculo_interesse: string;
  total_leads: number;
  total_respostas: number;
}

/** Resposta do endpoint /api/alice/vehicle-heatmap */
export type AliceVehicleHeatmapResponse = AliceVehicleHeatmapItem[];

/** Item de curadoria (últimos erros) */
export interface AliceCuradoriaItem {
  id?: string;
  created_at: string;
  curadoria: string;  // texto do erro/onde a IA errou
  sessionId?: string;
}

/** Resposta do endpoint /api/alice/governance-alerts */
export interface AliceGovernanceAlertsResponse {
  buffer_represado: number;           // COUNT buffer_message_bdr
  total_intervencoes: number;          // sessões únicas em intervencao_humana
  total_contatados: number;           // para calcular taxa
  taxa_intervencao: number;           // opcional, pode ser calculada no front
  ultimos_erros: AliceCuradoriaItem[];
}
