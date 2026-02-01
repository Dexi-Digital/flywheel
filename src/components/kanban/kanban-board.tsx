'use client';

import { useMemo } from 'react';
import { LeadWithAgent, LeadStatus } from '@/types/database.types';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';

import { AgentType } from '@/types/database.types';

interface KanbanBoardProps {
  leads: LeadWithAgent[];
  agentType?: AgentType;
  // optional server-provided summary counts: label -> count
  summaryCounts?: Record<string, number>;
}

const DEFAULT_COLUMNS: { status: LeadStatus; label: string; color: string }[] = [
  { status: 'NOVO', label: 'Novo', color: 'bg-blue-100 dark:bg-blue-900/20' },
  { status: 'EM_CONTATO', label: 'Em Contato', color: 'bg-yellow-100 dark:bg-yellow-900/20' },
  { status: 'QUALIFICADO', label: 'Qualificado', color: 'bg-purple-100 dark:bg-purple-900/20' },
  { status: 'NEGOCIACAO', label: 'Negociação', color: 'bg-orange-100 dark:bg-orange-900/20' },
  { status: 'GANHO', label: 'Ganho', color: 'bg-green-100 dark:bg-green-900/20' },
  { status: 'PERDIDO', label: 'Perdido', color: 'bg-red-100 dark:bg-red-900/20' },
  { status: 'ESTAGNADO', label: 'Estagnado', color: 'bg-gray-100 dark:bg-gray-900/20' },
];

const SALES_COLUMNS: { status: LeadStatus; label: string; color: string }[] = [
  { status: 'NOVO', label: 'Novo', color: 'bg-blue-100 dark:bg-blue-900/20' },
  { status: 'EM_CONTATO', label: 'Em Contato (Sessão Ativa)', color: 'bg-yellow-100 dark:bg-yellow-900/20' },
  { status: 'QUALIFICADO', label: 'Qualificado', color: 'bg-purple-100 dark:bg-purple-900/20' },
  { status: 'ESTAGNADO', label: 'Humano Acionado', color: 'bg-red-100 dark:bg-red-900/20' },
];

const COLLECTION_COLUMNS: { status: LeadStatus; label: string; color: string }[] = [
  { status: 'NOVO', label: 'Em Aberto', color: 'bg-blue-100 dark:bg-blue-900/20' },
  { status: 'NEGOCIACAO', label: 'Em Negociação', color: 'bg-yellow-100 dark:bg-yellow-900/20' },
  { status: 'QUALIFICADO', label: 'Promessa de Pagamento', color: 'bg-purple-100 dark:bg-purple-900/20' },
  { status: 'GANHO', label: 'Recuperado', color: 'bg-green-100 dark:bg-green-900/20' },
];

export function KanbanBoard({ leads, agentType, summaryCounts }: KanbanBoardProps) {
  const columns = useMemo(() => {
    if (agentType === 'SDR' || agentType === 'BDR') return SALES_COLUMNS;
    if (agentType === 'FINANCEIRO') return COLLECTION_COLUMNS;
    return DEFAULT_COLUMNS;
  }, [agentType]);
  const leadsByStatus = useMemo(() => {
    const grouped: Record<LeadStatus, LeadWithAgent[]> = {
      NOVO: [],
      EM_CONTATO: [],
      QUALIFICADO: [],
      NEGOCIACAO: [],
      GANHO: [],
      PERDIDO: [],
      ESTAGNADO: [],
    };

    leads.forEach((lead) => {
      grouped[lead.status].push(lead);
    });

    return grouped;
  }, [leads]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const label = column.label;
        const count = summaryCounts && typeof summaryCounts[label] === 'number'
          ? summaryCounts[label]
          : leadsByStatus[column.status].length;

        return (
          <KanbanColumn
            key={column.status}
            title={label}
            count={count}
            color={column.color}
          >
            {leadsByStatus[column.status].map((lead) => (
              <KanbanCard key={lead.id} lead={lead} />
            ))}
          </KanbanColumn>
        );
      })}
    </div>
  );
}

