'use client';

import { LeadWithAgent } from '@/types/database.types';
import { Avatar } from '@/components/ui/avatar';
import { Building2, Mail, Phone, DollarSign, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/aggregated-data';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KanbanCardProps {
  lead: LeadWithAgent;
}

export function KanbanCard({ lead }: KanbanCardProps) {
  return (
    <div className="group cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
      {/* Lead Name */}
      <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">{lead.nome}</h4>

      {/* Company */}
      {lead.empresa && (
        <div className="mb-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Building2 className="h-4 w-4" />
          <span className="truncate">{lead.empresa}</span>
        </div>
      )}

      {/* Contact Info */}
      <div className="mb-3 space-y-1">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
          <Mail className="h-3 w-3" />
          <span className="truncate">{lead.email}</span>
        </div>
        {lead.telefone && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
            <Phone className="h-3 w-3" />
            <span>{lead.telefone}</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
        <DollarSign className="h-4 w-4" />
        <span>{formatCurrency(lead.valor_potencial)}</span>
      </div>

      {/* Agent */}
      <div className="mb-3 flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
        <Avatar name={lead.agente.nome} size="sm" />
        <span className="text-xs text-gray-600 dark:text-gray-400">{lead.agente.nome}</span>
      </div>

      {/* Last Interaction */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
        <Clock className="h-3 w-3" />
        <span>
          {formatDistanceToNow(new Date(lead.ultima_interacao), {
            addSuffix: true,
            locale: ptBR,
          })}
        </span>
      </div>

      {/* Stagnant Warning */}
      {lead.tempo_parado && (
        <div className="mt-2 rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
          ⚠️ Parado há {lead.tempo_parado}
        </div>
      )}
    </div>
  );
}

