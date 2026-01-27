'use client';

import { useMemo } from 'react';
import { LeadWithAgent, LeadStatus } from '@/types/database.types';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';

interface KanbanBoardProps {
  leads: LeadWithAgent[];
}

const KANBAN_COLUMNS: { status: LeadStatus; label: string; color: string }[] = [
  { status: 'NOVO', label: 'Novo', color: 'bg-blue-100 dark:bg-blue-900/20' },
  { status: 'EM_CONTATO', label: 'Em Contato', color: 'bg-yellow-100 dark:bg-yellow-900/20' },
  { status: 'QUALIFICADO', label: 'Qualificado', color: 'bg-purple-100 dark:bg-purple-900/20' },
  { status: 'NEGOCIACAO', label: 'Negociação', color: 'bg-orange-100 dark:bg-orange-900/20' },
  { status: 'GANHO', label: 'Ganho', color: 'bg-green-100 dark:bg-green-900/20' },
  { status: 'PERDIDO', label: 'Perdido', color: 'bg-red-100 dark:bg-red-900/20' },
  { status: 'ESTAGNADO', label: 'Estagnado', color: 'bg-gray-100 dark:bg-gray-900/20' },
];

export function KanbanBoard({ leads }: KanbanBoardProps) {
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
      {KANBAN_COLUMNS.map((column) => (
        <KanbanColumn
          key={column.status}
          title={column.label}
          count={leadsByStatus[column.status].length}
          color={column.color}
        >
          {leadsByStatus[column.status].map((lead) => (
            <KanbanCard key={lead.id} lead={lead} />
          ))}
        </KanbanColumn>
      ))}
    </div>
  );
}

