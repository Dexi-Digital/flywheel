'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Curadoria {
  id: string;
  name?: string;
  sessionId: string;
  message_user?: string;
  message_ai?: string;
  internal_reasoning?: Record<string, any>;
  created_at: string;
}

interface Alerta {
  id: string;
  sessionId: string;
  alerta: string;
  created_at: string;
}

interface Intervencao {
  id: string;
  whatsapp?: string;
  date_time?: string;
  motivo?: string;
  create_date: string;
}

interface AlertsAndInterventionWidgetProps {
  curadoria: Curadoria[];
  alertas: Alerta[];
  intervencao: Intervencao[];
}

export function AlertsAndInterventionWidget({
  curadoria,
  alertas,
  intervencao,
}: AlertsAndInterventionWidgetProps) {
  const totalAlerts = curadoria.length + alertas.length;
  const totalInterventions = intervencao.length;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">⚠️ Alertas & Curadoria</h3>
          <Badge className="bg-red-100 text-red-800">{totalAlerts} alertas</Badge>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {curadoria.length > 0 || alertas.length > 0 ? (
            <>
              {curadoria.map((item) => (
                <div key={item.id} className="p-3 border border-red-100 rounded bg-red-50">
                  <div className="font-medium text-sm text-red-900 mb-1">
                    {item.name || 'Interação problemática'}
                  </div>
                  {item.message_user && (
                    <div className="text-xs text-red-800 mb-1">👤: {item.message_user.substring(0, 50)}...</div>
                  )}
                  {item.internal_reasoning && (
                    <div className="text-xs text-red-700 mt-1">
                      🏷️ Tags: {JSON.stringify(item.internal_reasoning).substring(0, 40)}...
                    </div>
                  )}
                </div>
              ))}
              {alertas.map((item) => (
                <div key={item.id} className="p-3 border border-yellow-100 rounded bg-yellow-50">
                  <div className="font-medium text-sm text-yellow-900">{item.alerta}</div>
                  <div className="text-xs text-yellow-700 mt-1">
                    Session: {item.sessionId.slice(0, 12)}...
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="py-6 text-center text-gray-500">Nenhum alerta</div>
          )}
        </div>
      </Card>

      {intervencao.length > 0 && (
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">🚨 Intervenção Humana</h3>
            <Badge className="bg-orange-100 text-orange-800">{totalInterventions} casos</Badge>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {intervencao.map((item) => (
              <div key={item.id} className="p-3 border border-orange-100 rounded bg-orange-50">
                <div className="flex justify-between items-start mb-1">
                  <div className="font-mono text-xs text-orange-700">{item.whatsapp || 'N/A'}</div>
                  <div className="text-xs text-orange-600">
                    {item.date_time ? new Date(item.date_time).toLocaleDateString('pt-BR') : '-'}
                  </div>
                </div>
                {item.motivo && (
                  <div className="text-sm text-orange-900 font-medium">{item.motivo}</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
