import { faker } from '@faker-js/faker/locale/pt_BR';
import { Event, EventType, EventMetadata } from '@/types/database.types';
import { AGENTS_DATA } from './agents';
import { LEADS_DATA } from './leads';

const EVENT_TYPES: EventType[] = [
  'LEAD_CAPTURADO',
  'LEAD_RESPONDIDO',
  'LEAD_ESTAGNADO',
  'LEAD_TRANSBORDADO',
  'CONVERSAO',
  'RECUPERACAO',
  'INADIMPLENCIA_RESOLVIDA',
  'INTERVENCAO_OTTO',
];

faker.seed(54321);

function generateEvent(index: number): Event {
  const tipo = faker.helpers.arrayElement(EVENT_TYPES);
  const lead = faker.helpers.arrayElement(LEADS_DATA);
  const agent = faker.helpers.arrayElement(AGENTS_DATA);
  
  const timestamp = faker.date.between({ 
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
    to: new Date() 
  });

  let metadata: EventMetadata = {};
  
  switch (tipo) {
    case 'LEAD_RESPONDIDO':
      metadata = {
        tempo_resposta_segundos: faker.number.int({ min: 5, max: 300 }),
        resultado: 'sucesso',
      };
      break;
    case 'LEAD_TRANSBORDADO':
      metadata = {
        motivo: faker.helpers.arrayElement([
          'Tempo de resposta excedido',
          'Lead estagnado por mais de 48h',
          'Vendedor indisponível',
          'Solicitação de escalação',
        ]),
        agente_anterior_id: faker.helpers.arrayElement(AGENTS_DATA).id,
      };
      break;
    case 'INTERVENCAO_OTTO':
      metadata = {
        motivo: faker.helpers.arrayElement([
          'Lead sem contato há 72h',
          'Taxa de resposta crítica',
          'Oportunidade em risco',
          'Detecção de insatisfação',
        ]),
        resultado: faker.helpers.arrayElement(['sucesso', 'falha', 'pendente']),
        valor: lead.valor_potencial,
      };
      break;
    case 'CONVERSAO':
    case 'RECUPERACAO':
      metadata = {
        valor: lead.valor_potencial,
        resultado: 'sucesso',
      };
      break;
    case 'INADIMPLENCIA_RESOLVIDA':
      metadata = {
        valor: faker.number.int({ min: 1000, max: 50000 }),
        resultado: 'sucesso',
      };
      break;
    default:
      metadata = {};
  }

  return {
    id: `event-${index.toString().padStart(5, '0')}`,
    tipo,
    lead_id: lead.id,
    agente_id: tipo === 'INTERVENCAO_OTTO' ? 'agent-otto' : agent.id,
    metadata,
    timestamp: timestamp.toISOString(),
  };
}

// Generate 500 events for demo
export const EVENTS_DATA: Event[] = Array.from({ length: 500 }, (_, i) => generateEvent(i));

export function getEventsByType(tipo: EventType): Event[] {
  return EVENTS_DATA.filter((event) => event.tipo === tipo);
}

export function getEventsByAgent(agentId: string): Event[] {
  return EVENTS_DATA.filter((event) => event.agente_id === agentId);
}

export function getOttoInterventions(): Event[] {
  return EVENTS_DATA.filter((event) => event.tipo === 'INTERVENCAO_OTTO');
}

export function getSuccessfulOttoInterventions(): Event[] {
  return getOttoInterventions().filter(
    (event) => event.metadata.resultado === 'sucesso'
  );
}

export function getRecoveryEvents(): Event[] {
  return EVENTS_DATA.filter((event) => 
    ['RECUPERACAO', 'INADIMPLENCIA_RESOLVIDA'].includes(event.tipo)
  );
}

export function getTotalRecoveredRevenue(): number {
  return getRecoveryEvents().reduce(
    (sum, event) => sum + (event.metadata.valor || 0), 
    0
  );
}

