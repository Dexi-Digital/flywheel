import { Agent, AgentType, AgentStatus, Event, Lead } from '@/types/database.types';

function nowIso() {
  return new Date().toISOString();
}

export function buildAgentCommon(
  agentId: string,
  agentName: string,
  leads: Lead[],
  events: Event[],
  overrides?: Partial<Agent>
) : Agent {
  const leadsAtivos = leads.length;
  const conversoes = leads.filter((l) => l.status === 'GANHO').length;

  const receitaTotal = leads
    .filter((l) => l.status === 'GANHO')
    .reduce((sum, l) => sum + (l.valor_potencial ?? 0), 0);

  // Tipo padrão é SDR, mas pode ser sobrescrito via overrides
  const tipo: AgentType = overrides?.tipo || 'SDR';

  return {
    id: agentId,
    nome: agentName,
    tipo,
    status: 'ATIVO' as AgentStatus,
    avatar_url: undefined,
    metricas_agregadas: {
      leads_ativos: leadsAtivos,
      conversoes,
      receita_total: receitaTotal,
      disparos_hoje: events.length,
    },
    created_at: nowIso(),
    updated_at: nowIso(),
    leads,
    events,
    ...overrides,
  };
}
