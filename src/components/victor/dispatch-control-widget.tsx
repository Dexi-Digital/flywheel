'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Disparo {
  id: string;
  nome_cliente: string;
  telefone_cliente?: string;
  id_cliente: string;
  id_divida: string;
  disparo_realizado: boolean;
  dateTime_disparo?: string;
  vencimento?: string;
  dias_atraso: number;
  created_at: string;
}

interface DispatchControlWidgetProps {
  disparos: Disparo[];
}

export function DispatchControlWidget({ disparos }: DispatchControlWidgetProps) {
  const today = new Date().toDateString();
  const sentToday = disparos.filter(
    d =>
      d.disparo_realizado &&
      d.dateTime_disparo &&
      new Date(d.dateTime_disparo).toDateString() === today,
  ).length;
  const failedDispatch = disparos.filter(d => !d.disparo_realizado).length;

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="font-semibold">Controle de Disparo</h3>
        <div className="flex gap-2 mt-2 text-sm">
          <div className="bg-green-50 px-3 py-1 rounded">
            <span className="font-bold text-green-600">{sentToday}</span> hoje
          </div>
          <div className="bg-red-50 px-3 py-1 rounded">
            <span className="font-bold text-red-600">{failedDispatch}</span> pendentes
          </div>
          <div className="bg-blue-50 px-3 py-1 rounded">
            <span className="font-bold text-blue-600">{disparos.length}</span> total
          </div>
        </div>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {disparos.length > 0 ? (
          disparos.map((disparo) => (
            <div
              key={disparo.id}
              className={`p-3 border rounded transition-colors ${
                disparo.disparo_realizado ? 'hover:bg-gray-50 bg-white' : 'bg-yellow-50'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="font-medium text-sm">{disparo.nome_cliente}</div>
                <Badge className={disparo.disparo_realizado ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {disparo.disparo_realizado ? '✓ Enviado' : '⏳ Pendente'}
                </Badge>
              </div>
              {disparo.telefone_cliente && (
                <div className="text-xs text-gray-600 mb-1">{disparo.telefone_cliente}</div>
              )}
              <div className="flex justify-between text-xs text-gray-600">
                <span>
                  {disparo.dateTime_disparo
                    ? new Date(disparo.dateTime_disparo).toLocaleDateString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Não enviado'}
                </span>
                {disparo.dias_atraso > 0 && (
                  <span className="text-red-600 font-semibold">{disparo.dias_atraso}d atraso</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">Nenhum disparo registrado</div>
        )}
      </div>
    </Card>
  );
}
