'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LeadRow {
  id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  'Tipo de Atendimento'?: string | null;
  message?: string | null;
  marca_veiculo?: string | null;
  modelo_veiculo?: string | null;
  ano_veiculo?: number | null;
  contato_realizado: boolean;
  origem?: string | null;
  ultima_interacao?: string;
  valor_potencial?: number | null;
}

interface LeadsGridProps {
  leads: LeadRow[];
  onLeadClick?: (leadId: string) => void;
}

export function LeadsGrid({ leads, onLeadClick }: LeadsGridProps) {
  const getStatusColor = (contacted: boolean) => {
    return contacted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getStatusLabel = (contacted: boolean) => {
    return contacted ? 'Contactado' : 'Não contactado';
  };

  return (
    <Card className="p-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Lead</th>
              <th className="px-4 py-2 text-left font-semibold">Veículo</th>
              <th className="px-4 py-2 text-left font-semibold">Tipo</th>
              <th className="px-4 py-2 text-left font-semibold">Status</th>
              <th className="px-4 py-2 text-left font-semibold">Contato</th>
              <th className="px-4 py-2 text-left font-semibold">Valor Potencial</th>
              <th className="px-4 py-2 text-left font-semibold">Última Interação</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onLeadClick?.(lead.id)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{lead.nome}</div>
                  <div className="text-xs text-gray-500">{lead.telefone || lead.email || '-'}</div>
                </td>
                <td className="px-4 py-3">
                  {lead.marca_veiculo && lead.modelo_veiculo ? (
                    <div className="text-sm">
                      {lead.marca_veiculo} {lead.modelo_veiculo}
                      {lead.ano_veiculo && <div className="text-xs text-gray-500">{lead.ano_veiculo}</div>}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {lead['Tipo de Atendimento'] ? (
                    <Badge>{lead['Tipo de Atendimento']}</Badge>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge className={getStatusColor(lead.contato_realizado)}>
                    {getStatusLabel(lead.contato_realizado)}
                  </Badge>
                </td>
                <td className="px-4 py-3">{lead.origem || '-'}</td>
                <td className="px-4 py-3 font-semibold">
                  {lead.valor_potencial ? `R$ ${lead.valor_potencial.toLocaleString('pt-BR')}` : '-'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {lead.ultima_interacao
                    ? new Date(lead.ultima_interacao).toLocaleDateString('pt-BR')
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {leads.length === 0 && (
        <div className="py-8 text-center text-gray-500">Nenhum lead encontrado</div>
      )}
    </Card>
  );
}
