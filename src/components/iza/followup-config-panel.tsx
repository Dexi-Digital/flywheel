'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FollowupConfig {
  id: string;
  tipo_followup: string;
  tempo_minuto: number;
  ativo: boolean;
  message_1?: string;
  message_2?: string;
  message_3?: string;
  url_webhook?: string;
}

interface FollowupConfigPanelProps {
  configs: FollowupConfig[];
}

export function FollowupConfigPanel({ configs }: FollowupConfigPanelProps) {
  const activeCount = configs.filter(c => c.ativo).length;

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="font-semibold">Configuração de Cadências</h3>
        <p className="text-sm text-gray-600">
          {activeCount} de {configs.length} cadências ativas
        </p>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {configs.length > 0 ? (
          configs.map((config) => (
            <div
              key={config.id}
              className="p-3 border rounded hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-sm">{config.tipo_followup}</div>
                <Badge className={config.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {config.ativo ? '✓ Ativa' : 'Inativa'}
                </Badge>
              </div>
              <div className="text-xs text-gray-600 mb-2">
                ⏱️ Intervalo: {config.tempo_minuto} minutos
              </div>
              {config.message_1 && (
                <div className="text-xs bg-blue-50 p-2 rounded mb-2 text-gray-700">
                  <span className="font-semibold">Msg 1:</span> {config.message_1.substring(0, 60)}...
                </div>
              )}
              {config.url_webhook && (
                <div className="text-xs text-gray-500 font-mono truncate">
                  🔗 {config.url_webhook.substring(0, 50)}...
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">Nenhuma cadência configurada</div>
        )}
      </div>
    </Card>
  );
}
