// Types for the Command Center database schema

export type AgentType = 
  | 'SDR' 
  | 'BDR' 
  | 'CSM' 
  | 'FINANCEIRO' 
  | 'SUPORTE' 
  | 'WINBACK' 
  | 'GOVERNANCA'
  | 'PILOT';

export type AgentStatus = 'ATIVO' | 'INATIVO' | 'MANUTENCAO';

export type LeadStatus = 
  | 'NOVO' 
  | 'EM_CONTATO' 
  | 'QUALIFICADO' 
  | 'NEGOCIACAO' 
  | 'GANHO' 
  | 'PERDIDO' 
  | 'ESTAGNADO';

export type LeadOrigin = 
  | 'Inbound' 
  | 'Outbound' 
  | 'Indicação' 
  | 'Parceiro' 
  | 'Evento' 
  | 'Reativação';

export type EventType = 
  | 'LEAD_CAPTURADO'
  | 'LEAD_RESPONDIDO'
  | 'LEAD_ESTAGNADO'
  | 'LEAD_TRANSBORDADO'
  | 'CONVERSAO'
  | 'RECUPERACAO'
  | 'INADIMPLENCIA_RESOLVIDA'
  | 'INTERVENCAO_OTTO';

export type UserRole = 'admin' | 'operacional' | 'viewer';

export interface Agent {
  id: string;
  nome: string;
  tipo: AgentType;
  status: AgentStatus;
  avatar_url?: string;
  metricas_agregadas: AgentMetrics;
  created_at: string;
  updated_at: string;
}

export interface AgentMetrics {
  leads_ativos?: number;
  conversoes?: number;
  tempo_medio_resposta?: number;
  taxa_sucesso?: number;
  receita_gerada?: number;
  receita_recuperada?: number;
  // Métricas de disparos e engajamento
  disparos_hoje?: number;
  disparos_semana?: number;
  disparos_mes?: number;
  taxa_resposta?: number;
  // Métricas específicas do OTTO
  leads_salvos?: number;
  intervencoes?: number;
  taxa_sucesso_pos_transbordo?: number;
  receita_salva?: number;
  tempo_medio_intervencao?: number;
  ticket_medio_resgate?: number;
  // Métricas específicas do Sales Pilot
  duvidas_tecnicas_resolvidas?: number;
  escalacoes_nivel2?: number;
  lacunas_identificadas?: number;
  [key: string]: number | undefined;
}

export interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  origem: LeadOrigin;
  status: LeadStatus;
  agente_atual_id: string;
  tempo_parado?: string;
  valor_potencial: number;
  ultima_interacao: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  tipo: EventType;
  lead_id: string;
  agente_id: string;
  metadata: EventMetadata;
  timestamp: string;
}

export interface EventMetadata {
  motivo?: string;
  valor?: number;
  agente_anterior_id?: string;
  tempo_resposta_segundos?: number;
  resultado?: 'sucesso' | 'falha' | 'pendente';
  [key: string]: string | number | undefined;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  nome?: string;
  created_at: string;
}

// Extended types for UI
export interface AgentWithStats extends Agent {
  leads_count: number;
  conversao_rate: number;
  receita_total: number;
}

export interface LeadWithAgent extends Lead {
  agente: Agent;
}

export interface DashboardMetrics {
  leads_ativos: number;
  leads_ativos_variacao: number;
  receita_pipeline: number;
  receita_pipeline_variacao: number;
  receita_recuperada: number;
  receita_recuperada_variacao: number;
  ltv_medio: number;
  ltv_medio_variacao: number;
  leads_salvos_otto: number;
  leads_salvos_otto_variacao: number;
}

export interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface FunnelData {
  stage: string;
  value: number;
  fill?: string;
}

export interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  leads_processados: number;
  conversoes: number;
  taxa_conversao: number;
  receita: number;
}

