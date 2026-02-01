'use client';

import { useMemo } from 'react';
import { formatCurrency, maskCpf, maskNameForPrivacy } from '@/lib/utils';
import type { KanbanApiResponse, KanbanClient, KanbanStage } from '@/services/kanban-api.service';

interface VictorKanbanProps {
  data: KanbanApiResponse;
}

const STAGES: { key: KanbanStage; label: string; color: string; bgColor: string }[] = [
  { key: 'Em Aberto', label: 'Em Aberto', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-800' },
  { key: 'Em Negociacao', label: 'Em Negociação', color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { key: 'Promessa de Pagamento', label: 'Promessa de Pagamento', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  { key: 'Recuperado', label: 'Recuperado', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
];

function ClientCard({ client }: { client: KanbanClient }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400" title="CPF mascarado por privacidade">
          {maskCpf(client.id_cliente)}
        </span>
        <span className="text-sm font-medium text-gray-900 dark:text-white truncate" title="Nome mascarado por privacidade">
          {maskNameForPrivacy(client.nome_cliente)}
        </span>
        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
          {formatCurrency(client.valor_recuperado || 0)}
        </span>
      </div>
    </div>
  );
}

function MetaFooter({ count, total }: { count: number; total: number }) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
      <span>{count} cliente{count !== 1 ? 's' : ''}</span>
      <span className="font-medium">{formatCurrency(total)}</span>
    </div>
  );
}

export function VictorKanban({ data }: VictorKanbanProps) {
  const { kanban, meta } = data;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const clients = kanban[stage.key] || [];
        const stageMeta = meta[stage.key] || { count: 0, total_recuperado: 0 };

        return (
          <div
            key={stage.key}
            className={`flex-shrink-0 w-72 ${stage.bgColor} rounded-lg p-4`}
          >
            {/* Header da coluna */}
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-semibold ${stage.color}`}>
                {stage.label}
              </h3>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stage.bgColor} ${stage.color}`}>
                {stageMeta.count}
              </span>
            </div>

            {/* Lista de clientes */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {clients.length > 0 ? (
                clients.map((client) => (
                  <ClientCard key={client.id_cliente} client={client} />
                ))
              ) : (
                <div className="text-center text-sm text-gray-400 py-8">
                  Nenhum cliente nesta etapa
                </div>
              )}
            </div>

            {/* Meta-rodapé */}
            <MetaFooter count={stageMeta.count} total={stageMeta.total_recuperado} />
          </div>
        );
      })}
    </div>
  );
}

