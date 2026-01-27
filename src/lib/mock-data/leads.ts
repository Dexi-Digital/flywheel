import { faker } from '@faker-js/faker/locale/pt_BR';
import { Lead, LeadStatus, LeadOrigin } from '@/types/database.types';
import { AGENTS_DATA } from './agents';

const LEAD_STATUSES: LeadStatus[] = [
  'NOVO', 'EM_CONTATO', 'QUALIFICADO', 'NEGOCIACAO', 'GANHO', 'PERDIDO', 'ESTAGNADO'
];

const LEAD_ORIGINS: LeadOrigin[] = [
  'Inbound', 'Outbound', 'Indicação', 'Parceiro', 'Evento', 'Reativação'
];

// Seed for consistent data across page reloads in demo mode
faker.seed(12345);

function generateLead(index: number): Lead {
  const status = faker.helpers.arrayElement(LEAD_STATUSES);
  const origin = faker.helpers.arrayElement(LEAD_ORIGINS);
  const agent = faker.helpers.arrayElement(AGENTS_DATA.filter(a => a.tipo !== 'GOVERNANCA'));
  
  const createdAt = faker.date.between({ 
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), 
    to: new Date() 
  });
  
  const lastInteraction = faker.date.between({ 
    from: createdAt, 
    to: new Date() 
  });

  // Calculate tempo_parado for stagnant leads
  let tempoParado: string | undefined;
  if (status === 'ESTAGNADO' || status === 'EM_CONTATO') {
    const hoursSinceInteraction = Math.floor((Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60));
    if (hoursSinceInteraction > 24) {
      tempoParado = `${Math.floor(hoursSinceInteraction / 24)} dias`;
    } else {
      tempoParado = `${hoursSinceInteraction} horas`;
    }
  }

  return {
    id: `lead-${index.toString().padStart(4, '0')}`,
    nome: faker.person.fullName(),
    email: faker.internet.email(),
    telefone: faker.phone.number(),
    empresa: faker.company.name(),
    origem: origin,
    status: status,
    agente_atual_id: agent.id,
    tempo_parado: tempoParado,
    valor_potencial: faker.number.int({ min: 5000, max: 150000 }),
    ultima_interacao: lastInteraction.toISOString(),
    created_at: createdAt.toISOString(),
    updated_at: lastInteraction.toISOString(),
  };
}

// Generate 200 leads for demo
export const LEADS_DATA: Lead[] = Array.from({ length: 200 }, (_, i) => generateLead(i));

export function getLeadsByStatus(status: LeadStatus): Lead[] {
  return LEADS_DATA.filter((lead) => lead.status === status);
}

export function getLeadsByAgent(agentId: string): Lead[] {
  return LEADS_DATA.filter((lead) => lead.agente_atual_id === agentId);
}

export function getStagnantLeads(): Lead[] {
  return LEADS_DATA.filter((lead) => 
    lead.status === 'ESTAGNADO' || 
    (lead.tempo_parado && lead.tempo_parado.includes('dias'))
  );
}

export function getPipelineValue(): number {
  return LEADS_DATA
    .filter((lead) => ['QUALIFICADO', 'NEGOCIACAO'].includes(lead.status))
    .reduce((sum, lead) => sum + lead.valor_potencial, 0);
}

export function getActiveLeadsCount(): number {
  return LEADS_DATA.filter((lead) => 
    !['GANHO', 'PERDIDO'].includes(lead.status)
  ).length;
}

