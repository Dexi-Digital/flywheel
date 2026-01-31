'use client';

import { Card } from '@/components/ui/card';

interface Comprovante {
  id: string;
  data_envio: string;
  link_conprovante: string;
  id_client: string;
}

interface PIX {
  id: string;
  nome_CNPJ: string;
  cnpj: string;
  relacao_loteamento?: string;
}

interface PaymentProofWidgetProps {
  comprovantes: Comprovante[];
  pix: PIX[];
}

export function PaymentProofWidget({ comprovantes, pix }: PaymentProofWidgetProps) {
  return (
    <div className="space-y-4">
      {/* Comprovantes */}
      {comprovantes.length > 0 && (
        <Card className="p-4">
          <div className="mb-4">
            <h3 className="font-semibold">✅ Comprovantes Recebidos</h3>
            <p className="text-sm text-gray-600 mt-1">{comprovantes.length} comprovantes</p>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {comprovantes.map((comprovante) => (
              <a
                key={comprovante.id}
                href={comprovante.link_conprovante}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 border rounded bg-green-50 border-green-200 hover:bg-green-100 transition-colors block"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm text-green-900">Cliente: {comprovante.id_client}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(comprovante.data_envio).toLocaleDateString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <span className="text-xs text-green-700 font-semibold">🔗 Ver</span>
                </div>
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* PIX / Dados Bancários */}
      {pix.length > 0 && (
        <Card className="p-4">
          <div className="mb-4">
            <h3 className="font-semibold">🏦 Dados PIX/Bancários</h3>
            <p className="text-sm text-gray-600 mt-1">{pix.length} receptores configurados</p>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {pix.map((receptor) => (
              <div key={receptor.id} className="p-3 border rounded bg-blue-50 border-blue-200">
                <div className="font-medium text-sm text-blue-900 mb-1">{receptor.nome_CNPJ}</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>
                    <span className="font-semibold">CNPJ:</span> {receptor.cnpj}
                  </div>
                  {receptor.relacao_loteamento && (
                    <div>
                      <span className="font-semibold">Loteamento:</span> {receptor.relacao_loteamento}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
