'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LEADS_DATA, AGENTS_DATA } from '@/lib/mock-data';
import { formatCurrency, getStatusLabel, getStatusColor } from '@/lib/utils';
import { Users, Filter, Search } from 'lucide-react';
import { LeadStatus } from '@/types/database.types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_FILTERS: { value: LeadStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'NOVO', label: 'Novos' },
  { value: 'EM_CONTATO', label: 'Em Contato' },
  { value: 'QUALIFICADO', label: 'Qualificados' },
  { value: 'NEGOCIACAO', label: 'Negociação' },
  { value: 'GANHO', label: 'Ganhos' },
  { value: 'PERDIDO', label: 'Perdidos' },
  { value: 'ESTAGNADO', label: 'Estagnados' },
];

export default function LeadsPage() {
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeads = LEADS_DATA.filter((lead) => {
    const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      lead.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.empresa?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getAgentName = (agentId: string) => {
    const agent = AGENTS_DATA.find((a) => a.id === agentId);
    return agent?.nome || 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Leads
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerenciamento e acompanhamento de leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">
            {filteredLeads.length} leads
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, empresa ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((filter) => (
                <Button
                  key={filter.value}
                  variant={statusFilter === filter.value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Valor Potencial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Agente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Última Interação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLeads.slice(0, 20).map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={lead.nome} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {lead.nome}
                          </p>
                          <p className="text-xs text-gray-500">{lead.empresa}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {getStatusLabel(lead.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {formatCurrency(lead.valor_potencial)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {getAgentName(lead.agente_atual_id)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDistanceToNow(new Date(lead.ultima_interacao), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

