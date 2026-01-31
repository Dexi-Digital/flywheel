'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Lead {
  id: string;
  nome: string;
  whatsapp?: string;
  sessionId?: string;
  interesse: boolean;
  etapa?: string;
  ultima_mensagem_user?: string;
  ultima_mensagem_ia?: string;
  contato_realizado: boolean;
  veiculo?: string;
  origem?: string;
  evento?: string;
  followup_01_sent?: boolean;
  followup_02_sent?: boolean;
  followup_03_sent?: boolean;
  followup_04_sent?: boolean;
}

interface CampaignLeadsGridProps {
  leads: Lead[];
  onLeadClick?: (leadId: string) => void;
}

export function CampaignLeadsGrid({ leads, onLeadClick }: CampaignLeadsGridProps) {
  const getEtapaColor = (etapa?: string) => {
    const colors: Record<string, string> = {
      'Novo': 'bg-blue-100 text-blue-800',
      'Em contato': 'bg-yellow-100 text-yellow-800',
      'Qualificado': 'bg-green-100 text-green-800',
      'Encerrado': 'bg-gray-100 text-gray-800',
    };
    return colors[etapa || ''] || 'bg-blue-100 text-blue-800';
  };

  const countFollowups = (lead: Lead) => {
    let count = 0;
    if (lead.followup_01_sent) count++;
    if (lead.followup_02_sent) count++;
    if (lead.followup_03_sent) count++;
    if (lead.followup_04_sent) count++;
    return count;
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Leads de Campanhas</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Lead</th>
              <th className="px-4 py-2 text-left font-semibold">Campanha</th>
              <th className="px-4 py-2 text-left font-semibold">Estágio</th>
              <th className="px-4 py-2 text-left font-semibold">Interesse</th>
              <th className="px-4 py-2 text-left font-semibold">Follow-ups</th>
              <th className="px-4 py-2 text-left font-semibold">Status</th>
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
                  {lead.whatsapp && <div className="text-xs text-gray-500">{lead.whatsapp}</div>}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">{lead.origem || '-'}</div>
                  {lead.evento && <div className="text-xs text-gray-500">{lead.evento}</div>}
                </td>
                <td className="px-4 py-3">
                  <Badge className={getEtapaColor(lead.etapa)}>{lead.etapa || 'Novo'}</Badge>
                </td>
                <td className="px-4 py-3">
                  {lead.interesse ? (
                    <Badge className="bg-green-100 text-green-800">🔥 Quente</Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-800">❄️ Frio</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(4, countFollowups(lead)) }).map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-blue-600" title={`FU ${i + 1}`} />
                    ))}
                    {countFollowups(lead) === 0 && <span className="text-gray-400">-</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge className={lead.contato_realizado ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {lead.contato_realizado ? '✓ Contactado' : 'Pendente'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {leads.length === 0 && (
        <div className="py-8 text-center text-gray-500">Nenhum lead de campanha</div>
      )}
    </Card>
  );
}
