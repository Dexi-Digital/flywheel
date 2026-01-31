'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Renegociacao {
  id: string;
  id_cliente: string;
  id_divida: string;
  descricao_contrato: string;
  aberta_em: string;
  vencimento: string;
  atraso: number;
  dias_em_debito: number;
  ativo: boolean;
}

interface RenegociacoesWidgetProps {
  renegociacoes: Renegociacao[];
}

export function RenegociacoesWidget({ renegociacoes }: RenegociacoesWidgetProps) {
  const activeRenegociacoes = renegociacoes.filter(r => r.ativo);
  const closedRenegociacoes = renegociacoes.filter(r => !r.ativo);

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Renegociações</h3>
        <div className="flex gap-2 text-xs">
          <Badge className="bg-blue-100 text-blue-800">{activeRenegociacoes.length} ativas</Badge>
          <Badge className="bg-gray-100 text-gray-800">{closedRenegociacoes.length} encerradas</Badge>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {renegociacoes.length > 0 ? (
          renegociacoes.map((renegociacao) => (
            <div
              key={renegociacao.id}
              className={`p-3 border rounded ${renegociacao.ativo ? 'hover:bg-gray-50' : 'bg-gray-50'} transition-colors`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-sm">{renegociacao.descricao_contrato}</div>
                <Badge className={renegociacao.ativo ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                  {renegociacao.ativo ? '🔄 Ativa' : '✓ Encerrada'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-2 text-gray-600">
                <div>
                  <span className="font-semibold">Aberta em:</span> {new Date(renegociacao.aberta_em).toLocaleDateString('pt-BR')}
                </div>
                <div>
                  <span className="font-semibold">Vencimento:</span> {new Date(renegociacao.vencimento).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                {renegociacao.atraso > 0 && (
                  <div className="bg-red-50 px-2 py-1 rounded">
                    <span className="text-red-700 font-semibold">Atraso: R$ {renegociacao.atraso.toLocaleString('pt-BR')}</span>
                  </div>
                )}
                {renegociacao.dias_em_debito > 0 && (
                  <div className="bg-orange-50 px-2 py-1 rounded">
                    <span className="text-orange-700 font-semibold">{renegociacao.dias_em_debito} dias débito</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">Nenhuma renegociação encontrada</div>
        )}
      </div>
    </Card>
  );
}
