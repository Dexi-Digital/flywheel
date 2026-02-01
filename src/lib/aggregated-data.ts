// Funções para agregar dados de todos os agentes
import { Agent, Lead, Event, FunnelData } from '@/types/database.types';

export interface DashboardMetrics {
  total_leads: number;
  leads_ativos: number;
  conversoes: number;
  receita_total: number;
  taxa_conversao: number;
  disparos_hoje: number;
  economia_gerada: number;
  economia_gerada_variacao: number;
  receita_variacao: number;
  leads_ativos_variacao: number;
  receita_pipeline: number;
  receita_pipeline_variacao: number;
  receita_recuperada: number;
  receita_recuperada_variacao: number;
  leads_salvos_otto: number;
  leads_salvos_otto_variacao: number;
}

export interface LeadsOverTimeDataPoint {
  date: string;
  novos: number;
  qualificados: number;
  ganhos: number;
  [key: string]: string | number; // Index signature para compatibilidade
}

export interface ConversionFunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  leads_ativos: number;
  conversoes: number;
  receita: number;
  taxa_conversao: number;
}

export interface OttoMetrics {
  leads_estagnados: number;
  intervencoes_hoje: number;
  taxa_sucesso: number;
  receita_salva: number;
}

// Cache para evitar múltiplas chamadas
let agentsCache: Agent[] | null = null;
let agentsCacheTime = 0;
const CACHE_TTL = 30000; // 30 segundos

async function fetchAllAgents(): Promise<Agent[]> {
  const now = Date.now();
  
  // Retornar cache se ainda válido
  if (agentsCache && (now - agentsCacheTime) < CACHE_TTL) {
    return agentsCache;
  }

  const agentIds = [
    'agent-angela',
    'agent-luis',
    'agent-alice',
    'agent-fernanda',
    'agent-vitor',
    'agent-iza',
  ];

  const promises = agentIds.map(async (id) => {
    try {
      const res = await fetch(`/api/agents/${id}`);
      const json = await res.json();
      return json.ok ? json.agent : null;
    } catch (error) {
      console.error(`Error fetching agent ${id}:`, error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  agentsCache = results.filter((a): a is Agent => a !== null);
  agentsCacheTime = now;
  
  return agentsCache;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const agents = await fetchAllAgents();
  
  const allLeads = agents.flatMap(a => a.leads || []);
  const allEvents = agents.flatMap(a => a.events || []);
  
  const leadsAtivos = allLeads.filter(l => 
    l.status !== 'PERDIDO' && l.status !== 'GANHO'
  ).length;
  
  const conversoes = allLeads.filter(l => l.status === 'GANHO').length;
  
  const receitaTotal = allLeads
    .filter(l => l.status === 'GANHO')
    .reduce((sum, l) => sum + (l.valor_potencial ?? 0), 0);
  
  const taxaConversao = allLeads.length > 0 ? conversoes / allLeads.length : 0;
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const disparosHoje = allEvents.filter(e => 
    new Date(e.timestamp) >= hoje
  ).length;

  // Cálculo de economia gerada (exemplo: 10 min por lead ativo × custo/min)
  const custoMinutoHumano = 2.5; // R$ 2,50 por minuto (exemplo)
  const minutosPorLead = 10;
  const economiaGerada = leadsAtivos * minutosPorLead * custoMinutoHumano;

  // Receita em pipeline (leads ativos)
  const receitaPipeline = allLeads
    .filter(l => l.status !== 'PERDIDO' && l.status !== 'GANHO')
    .reduce((sum, l) => sum + (l.valor_potencial ?? 0), 0);

  // Receita recuperada (leads que foram reativados)
  const receitaRecuperada = allEvents
    .filter(e => e.tipo === 'RECUPERACAO')
    .reduce((sum, e) => sum + (e.metadata?.valor ?? 0), 0);

  // Leads salvos pelo OTTO (intervenções)
  const leadsSalvosOtto = allEvents.filter(e =>
    e.tipo === 'INTERVENCAO_OTTO'
  ).length;

  return {
    total_leads: allLeads.length,
    leads_ativos: leadsAtivos,
    conversoes,
    receita_total: receitaTotal,
    taxa_conversao: taxaConversao,
    disparos_hoje: disparosHoje,
    economia_gerada: economiaGerada,
    economia_gerada_variacao: 12.5, // Exemplo: +12.5%
    receita_variacao: 8.3, // Exemplo: +8.3%
    leads_ativos_variacao: 5.2, // Exemplo: +5.2%
    receita_pipeline: receitaPipeline,
    receita_pipeline_variacao: 7.8, // Exemplo: +7.8%
    receita_recuperada: receitaRecuperada,
    receita_recuperada_variacao: 15.3, // Exemplo: +15.3%
    leads_salvos_otto: leadsSalvosOtto,
    leads_salvos_otto_variacao: 9.1, // Exemplo: +9.1%
  };
}

export async function getLeadsOverTimeData(): Promise<LeadsOverTimeDataPoint[]> {
  const agents = await fetchAllAgents();
  const allLeads = agents.flatMap(a => a.leads || []);

  // Agrupar leads por data de criação e status
  const leadsByDate = new Map<string, { novos: number; qualificados: number; ganhos: number }>();

  allLeads.forEach(lead => {
    const date = new Date(lead.created_at).toISOString().split('T')[0];
    const current = leadsByDate.get(date) || { novos: 0, qualificados: 0, ganhos: 0 };

    if (lead.status === 'NOVO') current.novos++;
    else if (lead.status === 'QUALIFICADO') current.qualificados++;
    else if (lead.status === 'GANHO') current.ganhos++;

    leadsByDate.set(date, current);
  });

  // Converter para array e ordenar
  const data = Array.from(leadsByDate.entries())
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30); // Últimos 30 dias

  return data;
}

export async function getConversionFunnelData(): Promise<FunnelData[]> {
  const agents = await fetchAllAgents();
  const allLeads = agents.flatMap(a => a.leads || []);

  const stages = [
    { stage: 'Novo', status: 'NOVO', fill: '#0f62fe' },
    { stage: 'Em Contato', status: 'EM_CONTATO', fill: '#8a3ffc' },
    { stage: 'Qualificado', status: 'QUALIFICADO', fill: '#198038' },
    { stage: 'Negociação', status: 'NEGOCIACAO', fill: '#fa4d56' },
    { stage: 'Ganho', status: 'GANHO', fill: '#24a148' },
  ];

  return stages.map(({ stage, status, fill }) => {
    const value = allLeads.filter(l => l.status === status).length;
    return {
      stage,
      value,
      fill,
    };
  });
}

export async function getAgentPerformanceData(): Promise<AgentPerformance[]> {
  const agents = await fetchAllAgents();

  return agents.map(agent => {
    const leads = agent.leads || [];
    const conversoes = leads.filter(l => l.status === 'GANHO').length;
    const receita = leads
      .filter(l => l.status === 'GANHO')
      .reduce((sum, l) => sum + (l.valor_potencial ?? 0), 0);

    return {
      agent_id: agent.id,
      agent_name: agent.nome,
      leads_ativos: leads.length,
      conversoes,
      receita,
      taxa_conversao: leads.length > 0 ? conversoes / leads.length : 0,
    };
  });
}

export async function getOttoMetrics(): Promise<OttoMetrics> {
  const agents = await fetchAllAgents();
  const allLeads = agents.flatMap(a => a.leads || []);
  const allEvents = agents.flatMap(a => a.events || []);

  // Leads estagnados: sem interação há mais de 7 dias
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

  const leadsEstagnados = allLeads.filter(lead => {
    const ultimaInteracao = new Date(lead.ultima_interacao);
    return ultimaInteracao < seteDiasAtras &&
           lead.status !== 'GANHO' &&
           lead.status !== 'PERDIDO';
  }).length;

  // Intervenções hoje
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const intervencoesHoje = allEvents.filter(e =>
    e.tipo === 'INTERVENCAO_OTTO' && new Date(e.timestamp) >= hoje
  ).length;

  // Taxa de sucesso: eventos de recuperação vs intervenções
  const intervencoes = allEvents.filter(e => e.tipo === 'INTERVENCAO_OTTO');
  const recuperacoes = allEvents.filter(e => e.tipo === 'RECUPERACAO');
  const taxaSucesso = intervencoes.length > 0
    ? (recuperacoes.length / intervencoes.length) * 100
    : 0;

  // Receita salva: soma dos valores de recuperação
  const receitaSalva = recuperacoes.reduce((sum, e) => {
    return sum + (e.metadata?.valor ?? 0);
  }, 0);

  return {
    leads_estagnados: leadsEstagnados,
    intervencoes_hoje: intervencoesHoje,
    taxa_sucesso: taxaSucesso,
    receita_salva: receitaSalva,
  };
}

export async function getStagnantLeads(): Promise<Lead[]> {
  const agents = await fetchAllAgents();
  const allLeads = agents.flatMap(a => a.leads || []);

  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

  return allLeads
    .filter(lead => {
      const ultimaInteracao = new Date(lead.ultima_interacao);
      return ultimaInteracao < seteDiasAtras &&
             lead.status !== 'GANHO' &&
             lead.status !== 'PERDIDO';
    })
    .sort((a, b) =>
      new Date(a.ultima_interacao).getTime() - new Date(b.ultima_interacao).getTime()
    );
}

export async function getLeadsByAgent(agentId: string): Promise<Lead[]> {
  const agents = await fetchAllAgents();
  const agent = agents.find(a => a.id === agentId);
  return agent?.leads || [];
}

export async function getAllLeads(): Promise<Lead[]> {
  const agents = await fetchAllAgents();
  return agents.flatMap(a => a.leads || []);
}

export async function getAllAgents(): Promise<Agent[]> {
  return fetchAllAgents();
}

export async function getEventsByType(eventType: string): Promise<Event[]> {
  const agents = await fetchAllAgents();
  const allEvents = agents.flatMap(a => a.events || []);

  return allEvents
    .filter(e => e.tipo === eventType)
    .sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

