import { Agent, AgentType, AgentStatus } from '@/types/database.types';

export const AGENTS_DATA: Agent[] = [
  {
    id: 'agent-luis',
    nome: 'Luís',
    tipo: 'SDR' as AgentType,
    status: 'ATIVO' as AgentStatus,
    avatar_url: '/avatars/luis.png',
    metricas_agregadas: {
      leads_ativos: 47,
      conversoes: 156,
      tempo_medio_resposta: 23,
      taxa_sucesso: 0.72,
      receita_gerada: 892000,
    },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'agent-alice',
    nome: 'Alice',
    tipo: 'BDR' as AgentType,
    status: 'ATIVO' as AgentStatus,
    avatar_url: '/avatars/alice.png',
    metricas_agregadas: {
      leads_ativos: 63,
      conversoes: 89,
      tempo_medio_resposta: 45,
      taxa_sucesso: 0.34,
      receita_gerada: 567000,
    },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'agent-iza',
    nome: 'Iza',
    tipo: 'CSM' as AgentType,
    status: 'ATIVO' as AgentStatus,
    avatar_url: '/avatars/iza.png',
    metricas_agregadas: {
      leads_ativos: 124,
      conversoes: 0,
      tempo_medio_resposta: 120,
      taxa_sucesso: 0.91,
      receita_gerada: 0,
      receita_recuperada: 234000,
    },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'agent-fernanda',
    nome: 'Fernanda',
    tipo: 'WINBACK' as AgentType,
    status: 'ATIVO' as AgentStatus,
    avatar_url: '/avatars/fernanda.png',
    metricas_agregadas: {
      leads_ativos: 38,
      conversoes: 67,
      tempo_medio_resposta: 180,
      taxa_sucesso: 0.45,
      receita_recuperada: 456000,
    },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'agent-angela',
    nome: 'Ângela',
    tipo: 'SUPORTE' as AgentType,
    status: 'ATIVO' as AgentStatus,
    avatar_url: '/avatars/angela.png',
    metricas_agregadas: {
      leads_ativos: 89,
      conversoes: 0,
      tempo_medio_resposta: 35,
      taxa_sucesso: 0.94,
      tickets_resolvidos: 1234,
    },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'agent-victor',
    nome: 'Victor',
    tipo: 'FINANCEIRO' as AgentType,
    status: 'ATIVO' as AgentStatus,
    avatar_url: '/avatars/victor.png',
    metricas_agregadas: {
      leads_ativos: 52,
      inadimplencias_resolvidas: 189,
      tempo_medio_resolucao: 72,
      taxa_sucesso: 0.78,
      receita_recuperada: 678000,
    },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'agent-sales-pilot',
    nome: 'Sales Pilot',
    tipo: 'PILOT' as AgentType,
    status: 'ATIVO' as AgentStatus,
    avatar_url: '/avatars/sales-pilot.png',
    metricas_agregadas: {
      leads_ativos: 15,
      conversoes: 12,
      tempo_medio_resposta: 28,
      taxa_sucesso: 0.80,
      receita_gerada: 345000,
    },
    created_at: '2024-02-01T10:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'agent-otto',
    nome: 'OTTO',
    tipo: 'GOVERNANCA' as AgentType,
    status: 'ATIVO' as AgentStatus,
    avatar_url: '/avatars/otto.png',
    metricas_agregadas: {
      leads_salvos: 234,
      intervencoes: 567,
      taxa_sucesso_pos_transbordo: 0.82,
      receita_salva: 1890000,
      tempo_medio_intervencao: 45,
    },
    created_at: '2024-01-01T10:00:00Z',
    updated_at: new Date().toISOString(),
  },
];

export function getAgentById(id: string): Agent | undefined {
  return AGENTS_DATA.find((agent) => agent.id === id);
}

export function getAgentsByType(type: AgentType): Agent[] {
  return AGENTS_DATA.filter((agent) => agent.tipo === type);
}

