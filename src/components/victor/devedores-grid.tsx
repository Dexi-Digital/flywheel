'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Devedor {
  id: string;
  nome_cliente: string;
  id_cliente: string;
  numero_cliente: string;
  id_divida: string;
  created_at: string;
  totalDue?: number;
  maxDaysOverdue?: number;
  lastContact?: string;
}

interface DevedoresGridProps {
  devedores: Devedor[];
  parcelas?: Record<string, any[]>;
  onDevedorClick?: (id: string) => void;
}

export function DevedoresGrid({ devedores, parcelas = {}, onDevedorClick }: DevedoresGridProps) {
  const getStatusColor = (daysOverdue?: number) => {
    if (!daysOverdue) return 'bg-yellow-100 text-yellow-800';
    if (daysOverdue > 90) return 'bg-red-100 text-red-800';
    if (daysOverdue > 30) return 'bg-orange-100 text-orange-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusLabel = (daysOverdue?: number) => {
    if (!daysOverdue) return 'Em dia';
    if (daysOverdue > 90) return `${daysOverdue}+ dias`;
    return `${daysOverdue}d`;
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Devedores em Acompanhamento</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Devedor</th>
              <th className="px-4 py-2 text-left font-semibold">ID Cliente</th>
              <th className="px-4 py-2 text-left font-semibold">Total Devido</th>
              <th className="px-4 py-2 text-left font-semibold">Status Atraso</th>
              <th className="px-4 py-2 text-left font-semibold">Data Entrada</th>
            </tr>
          </thead>
          <tbody>
            {devedores.map((dev) => {
              const devParcelas = parcelas[dev.id_cliente] || [];
              const totalDue = devParcelas.reduce((sum, p) => sum + (p.valor_parcela || 0), 0);
              const maxOverdue = Math.max(...devParcelas.map(p => p.dias_em_atraso || 0), 0);

              return (
                <tr
                  key={dev.id}
                  className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onDevedorClick?.(dev.id)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{dev.nome_cliente}</div>
                    <div className="text-xs text-gray-500">{dev.numero_cliente}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{dev.id_cliente}</td>
                  <td className="px-4 py-3 font-semibold">
                    R$ {totalDue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={getStatusColor(maxOverdue)}>
                      {getStatusLabel(maxOverdue)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(dev.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {devedores.length === 0 && (
        <div className="py-8 text-center text-gray-500">Nenhum devedor encontrado</div>
      )}
    </Card>
  );
}
