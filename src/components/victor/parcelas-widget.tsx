'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Parcela {
  id: string;
  id_cliente: string;
  numero_contrato: string;
  numero_parcela: number;
  total_parcelas: number;
  valor_parcela: number;
  data_vencimento: string;
  status_parcela: string;
  dias_em_atraso: number;
  telefone_nono_digito?: string;
  whatsapp_existe: boolean;
}

interface ParcelasWidgetProps {
  parcelas: Parcela[];
}

export function ParcelasWidget({ parcelas }: ParcelasWidgetProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'aberto': 'bg-red-100 text-red-800',
      'pago': 'bg-green-100 text-green-800',
      'em_aberto': 'bg-red-100 text-red-800',
      'liquidado': 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-yellow-100 text-yellow-800';
  };

  const overdueParcelas = parcelas.filter(p => p.dias_em_atraso > 0);
  const totalDebt = parcelas.reduce((sum, p) => sum + p.valor_parcela, 0);

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="font-semibold">Parcelas em Aberto</h3>
        <div className="flex gap-2 mt-2 text-sm">
          <div className="bg-blue-50 px-3 py-1 rounded">
            <span className="font-bold text-blue-600">{parcelas.length}</span> parcelas
          </div>
          <div className="bg-red-50 px-3 py-1 rounded">
            <span className="font-bold text-red-600">R$ {(totalDebt / 1000).toFixed(1)}k</span> total
          </div>
          <div className="bg-orange-50 px-3 py-1 rounded">
            <span className="font-bold text-orange-600">{overdueParcelas.length}</span> atrasadas
          </div>
        </div>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {parcelas.length > 0 ? (
          parcelas.map((parcela) => (
            <div key={parcela.id} className="p-3 border rounded hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-sm">
                  Cont {parcela.numero_contrato} - Parc {parcela.numero_parcela}/{parcela.total_parcelas}
                </div>
                <Badge className={getStatusColor(parcela.status_parcela)}>
                  {parcela.status_parcela}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div>
                  <span className="text-gray-600">Valor:</span> R$ {parcela.valor_parcela.toLocaleString('pt-BR')}
                </div>
                <div>
                  <span className="text-gray-600">Venc:</span> {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
                </div>
              </div>
              {parcela.dias_em_atraso > 0 && (
                <div className="text-xs font-semibold text-red-600">
                  ⚠️ {parcela.dias_em_atraso} dias em atraso
                </div>
              )}
              {parcela.whatsapp_existe && (
                <div className="text-xs text-gray-500 mt-1">
                  📱 {parcela.telefone_nono_digito}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">Nenhuma parcela encontrada</div>
        )}
      </div>
    </Card>
  );
}
