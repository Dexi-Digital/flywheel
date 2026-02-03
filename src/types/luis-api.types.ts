/**
 * Tipos para a API do Dashboard Agente Luís (SDR Híbrido/Plantão).
 * Banco: devforaiagents (Leads CRM, ai_chat_sessions, analise_interacoes_ia).
 * 
 * O Luís é o agente de plantão que atende leads fora do horário comercial,
 * garantindo resposta imediata 24/7 para leads digitais.
 */

// ============================================================================
// KPI PULSE - PULSO GERAL DA OPERAÇÃO LUÍS
// ============================================================================

/**
 * Interface para o "pulso" geral da operação Luís
 *
 * Representa as métricas agregadas de alto nível que indicam
 * a saúde e cobertura do atendimento IA, especialmente fora do horário comercial.
 *
 * @example
 * const pulse = await getLuisKpiPulse();
 * if (pulse) {
 *   // Calcular a taxa de engajamento
 *   const taxaEngajamento = pulse.total_leads_hoje > 0
 *     ? (pulse.atendimentos_ia / pulse.total_leads_hoje) * 100
 *     : 0;
 * }
 *
 * @ui_hints
 * - `leads_fora_horario` é a MÉTRICA PRINCIPAL DE VALOR do Luís
 *   → Deve ter DESTAQUE VISUAL (card maior, cor diferenciada, ou ícone especial)
 *   → Representa leads que seriam perdidos sem atendimento automático
 *   → Sugestão: cor dourada/amarela ou badge "Plantão IA"
 * 
 * - `taxa_engajamento` indica % de cobertura da IA sobre leads novos
 *   → Verde se > 80%, Amarelo se 50-80%, Vermelho se < 50%
 */
export interface LuisKpiPulse {
  /**
   * Total de leads que entraram no CRM hoje
   * Base para calcular taxa de cobertura
   */
  total_leads_hoje: number;

  /**
   * Quantos leads a IA atendeu (Sessões ativas iniciadas)
   * Indica proatividade do sistema
   */
  atendimentos_ia: number;

  /**
   * KPI CRÍTICO: Leads que chegaram à noite/madrugada (fora do horário comercial)
   * 
   * Este é o principal indicador de valor do Luís:
   * - Representa leads que seriam "perdidos" ou esperariam até o próximo dia útil
   * - Sem a IA, esses leads teriam tempo de resposta de 8-12+ horas
   * - Com o Luís, têm resposta em segundos, 24/7
   * 
   * @important Esta métrica deve ter DESTAQUE VISUAL máximo no dashboard
   */
  leads_fora_horario: number;

  /**
   * Percentual de cobertura da IA sobre os leads novos
   * Fórmula: (atendimentos_ia / total_leads_hoje) * 100
   *
   * Indica eficiência do sistema em capturar e engajar leads automaticamente
   */
  taxa_engajamento: number;
}

// ============================================================================
// QUALIFICATION LIST - LISTA DE LEADS QUENTES (PLANTÃO)
// ============================================================================

/**
 * Interface para um lead qualificado na lista de "Leads Quentes" do Luís
 *
 * Representa leads que chegaram no plantão (fora do horário comercial)
 * e foram pré-qualificados pela IA, prontos para atendimento humano.
 *
 * @example
 * const leads = await getLuisQualificationList();
 * if (leads) {
 *   const urgentes = leads.filter(lead => lead.solicitou_humano);
 *   const comVeiculo = leads.filter(lead => lead.interesse_veiculo);
 * }
 *
 * @ui_hints
 * - Se `solicitou_humano === true`:
 *   → Badge vermelho/laranja "Solicitou Agente" com prioridade MÁXIMA
 *   → Linha destacada (bg-amber-50 ou bg-red-50)
 *   → Ícone de alerta ou sino
 *
 * - `resumo_ia`:
 *   → Exibir truncado (max 80-100 chars) com tooltip para texto completo
 *   → Ou em linha secundária com fonte menor e cor mais suave
 *   → Pode usar ícone de "cérebro" ou "IA" para indicar origem
 *
 * - `horario_entrada`:
 *   → Formatar como "HH:mm" ou "Ontem às HH:mm" para contexto rápido
 *   → Destacar se foi madrugada (00:00-06:00) com ícone de lua
 *
 * - `interesse_veiculo`:
 *   → Exibir como chip/tag se disponível
 *   → Se null, mostrar "Não especificado" em cinza
 */
export interface LuisQualificationLead {
  /** Nome do lead/cliente */
  nome: string;

  /** Número de WhatsApp do lead */
  whatsapp: string;

  /**
   * Veículo de interesse identificado pela IA
   * Pode ser null se o lead não especificou ou a IA não identificou
   */
  interesse_veiculo: string | null;

  /**
   * Horário de entrada do lead (formato ISO, já ajustado para BRT no banco)
   * Indica quando o lead chegou no sistema durante o plantão
   */
  horario_entrada: string;

  /**
   * Resumo da conversa gerado pela IA
   * Contém os principais pontos da interação para contexto rápido
   */
  resumo_ia: string | null;

  /**
   * PRIORIDADE MÁXIMA: Se true, o lead solicitou falar com um humano
   *
   * Indica que a IA identificou que o lead quer atendimento humano,
   * seja por solicitação explícita ou por complexidade da demanda.
   *
   * @important Leads com este flag devem ter destaque visual máximo
   */
  solicitou_humano: boolean;
}

// ============================================================================
// TRAFFIC HEATMAP - DISTRIBUIÇÃO DE TRÁFEGO POR HORA
// ============================================================================

/**
 * Interface para dados de tráfego por hora do Luís
 *
 * Representa o volume de leads acumulado por hora do dia (0-23h),
 * permitindo identificar picos de atendimento, especialmente os noturnos.
 *
 * @example
 * const traffic = await getLuisTrafficHeatmap();
 * if (traffic) {
 *   const picoNoturno = traffic
 *     .filter(t => t.hora >= 19 || t.hora < 8)
 *     .reduce((sum, t) => sum + t.volume, 0);
 *   console.log(`Volume noturno: ${picoNoturno} leads`);
 * }
 *
 * @ui_hints (Recharts BarChart)
 * - Tipo de gráfico: BarChart vertical
 * - Eixo X: hora (formatar 0 -> "00h", 13 -> "13h")
 * - Eixo Y: volume de leads
 * - Tooltip: "X leads às Yh" (ex: "15 leads às 22h")
 *
 * - DESTAQUE VISUAL para "Turno do Luís" (19h-08h):
 *   → Barras entre 19h e 23h: cor diferenciada (ex: azul escuro ou roxo)
 *   → Barras entre 00h e 07h: mesma cor do turno noturno
 *   → Barras entre 08h e 18h: cor padrão/neutra (cinza ou azul claro)
 *   → Considerar adicionar área sombreada ou label "Plantão IA"
 *
 * - Cores sugeridas:
 *   → Horário comercial (08h-18h): #94a3b8 (slate-400)
 *   → Turno Luís (19h-07h): #6366f1 (indigo-500) ou #8b5cf6 (violet-500)
 */
export interface LuisTrafficData {
  /**
   * Hora do dia (0 a 23)
   * 0 = meia-noite, 12 = meio-dia, 23 = 23h
   */
  hora: number;

  /**
   * Quantidade de leads que entraram nesta hora
   * Acumulado histórico ou do período selecionado
   */
  volume: number;
}

// ============================================================================
// VEHICLE INTEREST - PREFERÊNCIA DE VEÍCULOS (TOP 10)
// ============================================================================

/**
 * Interface para estatística de interesse por veículo do Luís
 *
 * Representa o ranking dos modelos mais solicitados pelos leads,
 * já limpos e padronizados, ideal para entender o perfil da demanda noturna.
 *
 * @example
 * const vehicles = await getLuisVehicleInterest();
 * if (vehicles) {
 *   const topVeiculo = vehicles[0];
 *   const totalInteresse = vehicles.reduce((sum, v) => sum + v.total, 0);
 *   const percentTop = (topVeiculo.total / totalInteresse) * 100;
 *   console.log(`${topVeiculo.veiculo}: ${percentTop.toFixed(1)}% da demanda`);
 * }
 *
 * @ui_hints (Recharts PieChart ou Lista Classificada)
 * - Tipo de gráfico sugerido: PieChart ou Donut Chart
 *   → Mostra claramente a "fatia" de cada modelo na demanda
 *   → Cores distintas para cada modelo (palette categórica)
 *   → Label: nome do veículo + percentual
 *   → Tooltip: "X interessados (Y%)"
 *
 * - Alternativa: Lista/Ranking com barras de progresso
 *   → Ordenado do maior para menor (já vem ordenado do backend)
 *   → Barra de progresso proporcional ao total
 *   → Ícone de carro ou badge com posição (#1, #2, etc)
 *
 * - Cores sugeridas (palette categórica):
 *   → ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
 *      "#f43f5e", "#f97316", "#eab308", "#84cc16", "#22c55e"]
 */
export interface LuisVehicleStat {
  /**
   * Nome do modelo do veículo (já padronizado)
   * Ex: "911", "HURACAN", "CAYENNE", "URUS"
   */
  veiculo: string;

  /**
   * Quantidade de leads interessados neste modelo
   */
  total: number;
}

// ============================================================================
// GOVERNANCE - GOVERNANÇA E SAÚDE TÉCNICA
// ============================================================================

/**
 * Interface para dados de governança e saúde técnica do Luís
 *
 * Monitora se a infraestrutura (WhatsApp) está operacional e se o agente
 * está deixando passar leads (falha crítica de negócio).
 *
 * @example
 * const governance = await getLuisGovernance();
 * if (governance) {
 *   if (governance.status_whatsapp !== 'connected') {
 *     showCriticalAlert('WhatsApp OFFLINE! Sistema parado.');
 *   }
 *   if (governance.leads_sem_atendimento > 0) {
 *     showCriticalAlert(`${governance.leads_sem_atendimento} leads sem atendimento!`);
 *   }
 * }
 *
 * @ui_hints (Alertas e Status)
 * - `status_whatsapp !== 'connected'`:
 *   → ALERTA VERMELHO CRÍTICO (Sistema Offline)
 *   → Ícone de WhatsApp com X vermelho
 *   → Banner de emergência no topo do dashboard
 *   → Notificação push se possível
 *
 * - `leads_sem_atendimento > 0`:
 *   → ALERTA VERMELHO CRÍTICO (Perda de Vendas)
 *   → Badge vermelho pulsante com contador
 *   → Texto: "X leads aguardando!" ou "Leads perdidos hoje"
 *   → Este é o KPI mais crítico de falha operacional
 *
 * - `fila_envio > 20`:
 *   → ALERTA AMARELO (Lentidão no sistema)
 *   → Ícone de relógio ou fila
 *   → Texto: "Fila de envio alta: X mensagens"
 *
 * - `fila_envio > 50`:
 *   → Escalar para ALERTA VERMELHO (Sistema sobrecarregado)
 *
 * - Tudo OK (connected, fila < 20, sem leads perdidos):
 *   → Badge verde "Sistema Operacional"
 *   → Ícone de check ou coração verde
 */
export interface LuisGovernanceData {
  /**
   * Status da conexão do WhatsApp
   * Valores possíveis: 'connected', 'disconnected', 'unknown'
   *
   * @critical Se !== 'connected', o sistema está OFFLINE e não responde leads
   */
  status_whatsapp: string;

  /**
   * Quantidade de mensagens aguardando envio no buffer
   * Indica saúde da fila de processamento
   *
   * @warning Se > 20: sistema lento
   * @critical Se > 50: sistema sobrecarregado
   */
  fila_envio: number;

  /**
   * CRÍTICO: Leads de hoje que não têm sessão de chat iniciada
   *
   * Representa leads que entraram no CRM mas a IA não iniciou conversa.
   * Cada lead aqui é uma potencial venda perdida.
   *
   * @critical Se > 0: falha operacional grave, requer ação imediata
   */
  leads_sem_atendimento: number;
}

// ============================================================================
// NOVAS MÉTRICAS E RPCS (ATUALIZAÇÃO)
// ============================================================================

/** Resposta de engajamento da rpc-metrics */
export interface LuisEngagementRate {
  engaged_count: number;
  total_leads_today: number;
  engagement_percentage: number;
}

/** Resposta de leads em atendimento da rpc-metrics */
export interface LuisLeadsInAttendance {
  leads_in_attendance: number;
}

/** Resposta de leads fora do horário da rpc-metrics */
export interface LuisLeadsOutsideBusinessHours {
  leads_outside_business_hours: number;
}

/** Resposta de total de leads hoje da rpc-metrics */
export interface LuisTotalLeadsToday {
  total_leads_today: number;
}

/** Detalhes da loja do usuário atual */
export interface LuisUserLoja {
  id: string;
  nome: string;
}

/** Papel do usuário atual */
export interface LuisUserRole {
  role: string;
}

/** Resultado de correspondência de documentos */
export interface LuisDocumentMatch {
  id: string;
  content: string;
  score: number;
  metadata?: any;
}

