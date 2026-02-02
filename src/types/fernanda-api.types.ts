/**
 * Tipos para a API do Dashboard Agente Fernanda (Recuperação de Vendas/Win-back).
 * Banco: tecnologia (leads_nao_convertidos_fase02, memoria, intervencao_humana, curadoria).
 */

/**
 * Resposta do endpoint RPC get_fernanda_kpi_funnel.
 * Representa as métricas do funil de conversão da Fernanda.
 */
export interface FernandaFunnelKPI {
  /** Total de leads na carteira da Fernanda */
  base_total: number;
  /** Leads com WhatsApp validado */
  validos: number;
  /** Leads onde a IA identificou intenção clara */
  com_intencao: number;
  /** Leads que exigiram intervenção humana */
  intervencoes: number;
}

/**
 * Item da lista de oportunidades da Fernanda.
 * Resposta do endpoint RPC get_fernanda_lead_list.
 *
 * NOTA DE ORDENAÇÃO (já aplicada pelo banco):
 * 1º: Leads que precisam de atenção (precisa_atencao = true) - Badge Vermelho
 * 2º: Leads com intenção preenchida - Badge Verde/Azul
 * 3º: Leads mais recentes (created_at DESC)
 */
export interface FernandaLead {
  /** ID único do lead */
  id: number;
  /** Nome do lead */
  nome: string;
  /** WhatsApp do lead */
  whatsapp: string;
  /** Veículo de interesse (pode ser null) */
  veiculo: string | null;
  /** Intenção identificada pela IA. Ex: "Compra Imediata", "Pesquisando" */
  intencao: string | null;
  /** ID da sessão - chave para buscar detalhes/memória */
  session_id: string;
  /** Data da última interação (ISO). Usar para mostrar "Há X horas" */
  ultima_interacao: string | null;
  /** Se TRUE: Exibir alerta vermelho (Erro de IA ou Intervenção Humana necessária) */
  precisa_atencao: boolean;
}

/** Resposta do endpoint get_fernanda_lead_list */
export type FernandaLeadListResponse = FernandaLead[];

/**
 * Item da timeline de atividade da Fernanda.
 * Resposta do endpoint RPC get_fernanda_activity_timeline.
 *
 * NOTA PARA UI (Recharts):
 * - Use `dataKey="data"` no eixo X para lidar com datas
 * - O banco pode não retornar dias sem atividade (dias zerados)
 * - Considere preencher gaps de datas no frontend se necessário para gráfico contínuo
 */
export interface FernandaTimelineItem {
  /** Data no formato YYYY-MM-DD */
  data: string;
  /** Volume de interações/conversas no dia */
  total_conversas: number;
}

/** Resposta do endpoint get_fernanda_activity_timeline */
export type FernandaTimelineResponse = FernandaTimelineItem[];

/**
 * Item da distribuição de intenções da Fernanda.
 * Resposta do endpoint RPC get_fernanda_intent_distribution.
 *
 * NOTA PARA UI (Cores sugeridas):
 * ┌────────────────────────────────────────────────────────────┐
 * │ INTENÇÕES QUENTES (cores vibrantes):                       │
 * │   • "Compra Imediata" → Verde (#22c55e) ou Azul (#3b82f6)  │
 * │   • "Negociando" → Azul claro (#60a5fa)                    │
 * │                                                            │
 * │ INTENÇÕES MORNAS:                                          │
 * │   • "Pesquisando" → Amarelo (#eab308)                      │
 * │   • "Interessado" → Laranja (#f97316)                      │
 * │                                                            │
 * │ INTENÇÕES FRIAS (cores neutras):                           │
 * │   • "Sem Interesse" → Cinza (#6b7280)                      │
 * │   • "Indefinido" / null → Cinza claro (#9ca3af)            │
 * └────────────────────────────────────────────────────────────┘
 */
export interface FernandaIntentStat {
  /** Tipo de intenção identificada. Ex: "Compra Imediata", "Pesquisando" */
  intencao: string;
  /** Quantidade de leads com essa intenção */
  total: number;
}

/** Resposta do endpoint get_fernanda_intent_distribution */
export type FernandaIntentDistributionResponse = FernandaIntentStat[];

/**
 * Log de erro da curadoria da Fernanda.
 * Representa um caso onde a IA errou e precisa de revisão.
 */
export interface FernandaErrorLog {
  /** ID único do registro de erro */
  id: number;
  /** Data/hora do erro (ISO Date) */
  created_at: string;
  /** O que a IA disse errado (mensagem enviada ao cliente) */
  message_ai: string | null;
  /** Raciocínio interno da IA que levou ao erro (JSON) */
  internal_reasoning: unknown;
}

/**
 * Dados de governança e saúde técnica da Fernanda.
 * Resposta do endpoint RPC get_fernanda_governance.
 *
 * REGRAS DE ALERTA PARA UI:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ fila_pendente > 10                                                      │
 * │   → ALERTA AMARELO (Warning)                                            │
 * │   → Mensagem: "Sistema lento - Fila de mensagens represada"             │
 * │   → Ação: Verificar Evolution API / n8n                                 │
 * │                                                                         │
 * │ taxa_intervencao > 5                                                    │
 * │   → ALERTA VERMELHO (Critical)                                          │
 * │   → Mensagem: "IA falhando muito com clientes da Fernanda"              │
 * │   → Ação: Revisar prompts / curadoria urgente                           │
 * │                                                                         │
 * │ ultimos_erros.length > 0                                                │
 * │   → Exibir badge com contagem de erros recentes                         │
 * │   → Permitir expandir para ver detalhes                                 │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
export interface FernandaGovernanceData {
  /** Buffer global de mensagens pendentes (gargalo técnico) */
  fila_pendente: number;
  /** Percentual de leads da Fernanda que precisaram de intervenção humana */
  taxa_intervencao: number;
  /** Lista dos últimos erros/falhas da IA filtrados para a Fernanda */
  ultimos_erros: FernandaErrorLog[];
}

/** Resposta do endpoint get_fernanda_governance */
export type FernandaGovernanceResponse = FernandaGovernanceData;