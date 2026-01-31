import { DashboardMetrics, ChartDataPoint, FunnelData, AgentPerformance } from '@/types/database.types';
import { LEADS_DATA, getActiveLeadsCount, getPipelineValue } from './leads';
import { EVENTS_DATA, getTotalRecoveredRevenue, getSuccessfulOttoInterventions } from './events';
import { AGENTS_DATA } from './agents';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function getDashboardMetrics(): DashboardMetrics {
  const leadsAtivos = getActiveLeadsCount();
  const receitaPipeline = getPipelineValue();
  const receitaRecuperada = getTotalRecoveredRevenue();
  const leadsSalvosOtto = getSuccessfulOttoInterventions().length;
  
  // Calculate LTV from conversions
  const conversoes = LEADS_DATA.filter(l => l.status === 'GANHO');
  const ltvMedio = conversoes.length > 0 
    ? conversoes.reduce((sum, l) => sum + l.valor_potencial, 0) / conversoes.length 
    : 0;

  const capitalSobGestao = receitaRecuperada + (LEADS_DATA.filter(l => l.status === 'QUALIFICADO').length * 120000);
  const economiaGerada = (leadsAtivos * 10 * 1.5); // 10 min por lead * R$ 1.50/min

  return {
    leads_ativos: leadsAtivos,
    leads_ativos_variacao: 12.5,
    receita_pipeline: receitaPipeline,
    receita_pipeline_variacao: 8.3,
    receita_recuperada: receitaRecuperada,
    receita_recuperada_variacao: 23.7,
    ltv_medio: Math.round(ltvMedio),
    ltv_medio_variacao: 5.2,
    leads_salvos_otto: leadsSalvosOtto,
    leads_salvos_otto_variacao: 15.8,
    capital_sob_gestao: capitalSobGestao,
    capital_sob_gestao_variacao: 14.2,
    economia_gerada: economiaGerada,
    economia_gerada_variacao: 9.5,
  };
}

export function getLeadsOverTimeData(): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  
  for (let i = 29; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, 'dd/MM', { locale: ptBR });
    
    // Simulate realistic variations
    const baseNovos = 8 + Math.floor(Math.random() * 6);
    const baseQualificados = 5 + Math.floor(Math.random() * 4);
    const baseGanhos = 2 + Math.floor(Math.random() * 3);
    
    data.push({
      date: dateStr,
      novos: baseNovos,
      qualificados: baseQualificados,
      ganhos: baseGanhos,
      perdidos: Math.floor(Math.random() * 2),
    });
  }
  
  return data;
}

export function getConversionFunnelData(): FunnelData[] {
  const statusCounts = {
    'Capturados': LEADS_DATA.length,
    'Em Contato': LEADS_DATA.filter(l => l.status !== 'NOVO').length,
    'Qualificados': LEADS_DATA.filter(l => ['QUALIFICADO', 'NEGOCIACAO', 'GANHO'].includes(l.status)).length,
    'Negociação': LEADS_DATA.filter(l => ['NEGOCIACAO', 'GANHO'].includes(l.status)).length,
    'Convertidos': LEADS_DATA.filter(l => l.status === 'GANHO').length,
  };

  const colors = ['#0f62fe', '#4589ff', '#78a9ff', '#a6c8ff', '#d0e2ff'];
  
  return Object.entries(statusCounts).map(([stage, value], index) => ({
    stage,
    value,
    fill: colors[index],
  }));
}

export function getAgentPerformanceData(): AgentPerformance[] {
  return AGENTS_DATA
    .filter(agent => agent.tipo !== 'GOVERNANCA')
    .map(agent => {
      const agentLeads = LEADS_DATA.filter(l => l.agente_atual_id === agent.id);
      const conversoes = agentLeads.filter(l => l.status === 'GANHO').length;
      const processados = agentLeads.length;
      
      return {
        agent_id: agent.id,
        agent_name: agent.nome,
        leads_processados: processados,
        conversoes: conversoes,
        taxa_conversao: processados > 0 ? (conversoes / processados) * 100 : 0,
        receita: agentLeads
          .filter(l => l.status === 'GANHO')
          .reduce((sum, l) => sum + l.valor_potencial, 0),
      };
    })
    .sort((a, b) => b.receita - a.receita);
}

export function getOttoMetrics() {
  const interventions = EVENTS_DATA.filter(e => e.tipo === 'INTERVENCAO_OTTO');
  const transbordos = EVENTS_DATA.filter(e => e.tipo === 'LEAD_TRANSBORDADO');
  const successfulInterventions = interventions.filter(e => e.metadata.resultado === 'sucesso');
  
  const stagnantLeads = LEADS_DATA.filter(l => 
    l.status === 'ESTAGNADO' || 
    (l.tempo_parado && l.tempo_parado.includes('dias'))
  );

  return {
    total_intervencoes: interventions.length,
    intervencoes_sucesso: successfulInterventions.length,
    taxa_sucesso: interventions.length > 0 
      ? (successfulInterventions.length / interventions.length) * 100 
      : 0,
    leads_estagnados: stagnantLeads.length,
    transbordos_total: transbordos.length,
    receita_salva: successfulInterventions.reduce(
      (sum, e) => sum + (e.metadata.valor || 0), 
      0
    ),
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

