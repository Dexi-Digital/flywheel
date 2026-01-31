'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface OptOut {
  id: string;
  telefone_nono_digito: string;
  solicitado_em: string;
}

interface WhatsAppInexistente {
  id: string;
  nome_cliente: string;
  id_cliente: string;
  numero_cliente: string;
}

interface OptOutWidgetProps {
  optOuts: OptOut[];
  whatsappInexistentes: WhatsAppInexistente[];
}

export function OptOutWidget({ optOuts, whatsappInexistentes }: OptOutWidgetProps) {
  return (
    <div className="space-y-4">
      {/* Opt-outs */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">🚫 Opt-out WhatsApp</h3>
          <Badge className="bg-red-100 text-red-800">{optOuts.length}</Badge>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {optOuts.length > 0 ? (
            optOuts.map((optOut) => (
              <div key={optOut.id} className="p-3 border rounded bg-red-50 border-red-200 text-sm">
                <div className="font-mono text-sm mb-1">{optOut.telefone_nono_digito}</div>
                <div className="text-xs text-gray-600">
                  Solicitado em: {new Date(optOut.solicitado_em).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-gray-500">Nenhum opt-out registrado</div>
          )}
        </div>
      </Card>

      {/* WhatsApp Inexistentes */}
      {whatsappInexistentes.length > 0 && (
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">⚠️ Números Inválidos</h3>
            <Badge className="bg-orange-100 text-orange-800">{whatsappInexistentes.length}</Badge>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {whatsappInexistentes.map((item) => (
              <div key={item.id} className="p-3 border rounded bg-orange-50 border-orange-200 text-sm">
                <div className="font-medium text-orange-900 mb-1">{item.nome_cliente}</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Cliente: {item.id_cliente}</div>
                  <div>Número: {item.numero_cliente}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
