'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LeadEvento {
  id: string;
  nome: string;
  whatsapp?: string;
  cidade?: string;
  campanha: string;
  'e-mail'?: string;
  session_id?: string;
  lid?: string;
  created_at: string;
}

interface EventLeadsGridProps {
  leads: LeadEvento[];
  onLeadClick?: (leadId: string) => void;
}

export function EventLeadsGrid({ leads, onLeadClick }: EventLeadsGridProps) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Leads de Eventos/Campanhas</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Lead</th>
              <th className="px-4 py-2 text-left font-semibold">Campanha</th>
              <th className="px-4 py-2 text-left font-semibold">Cidade</th>
              <th className="px-4 py-2 text-left font-semibold">Contato</th>
              <th className="px-4 py-2 text-left font-semibold">Data</th>
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
                  {lead['e-mail'] && <div className="text-xs text-gray-500">{lead['e-mail']}</div>}
                </td>
                <td className="px-4 py-3">
                  <Badge>{lead.campanha}</Badge>
                </td>
                <td className="px-4 py-3">{lead.cidade || '-'}</td>
                <td className="px-4 py-3">
                  {lead.whatsapp ? (
                    <div className="text-sm font-mono">{lead.whatsapp}</div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {leads.length === 0 && (
        <div className="py-8 text-center text-gray-500">Nenhum lead de evento</div>
      )}
    </Card>
  );
}
