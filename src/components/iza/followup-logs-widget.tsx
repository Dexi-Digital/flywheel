'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FollowupLog {
  id: string;
  sessionId_lead: string;
  tipo_followup: string;
  message_followup: string;
  data_envio: string;
  status: string;
  response?: string;
  webhook_url?: string;
}

interface FollowupLogsWidgetProps {
  logs: FollowupLog[];
}

export function FollowupLogsWidget({ logs }: FollowupLogsWidgetProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'enviado': 'bg-blue-100 text-blue-800',
      'sucesso': 'bg-green-100 text-green-800',
      'falha': 'bg-red-100 text-red-800',
      'pendente': 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const sentToday = logs.filter(
    log => new Date(log.data_envio).toDateString() === new Date().toDateString()
  ).length;

  const successCount = logs.filter(log => log.status === 'sucesso').length;
  const failureCount = logs.filter(log => log.status === 'falha').length;

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="font-semibold mb-3">Follow-ups Enviados</h3>
        <div className="grid grid-cols-3 gap-2 text-sm mb-4">
          <div className="bg-blue-50 p-2 rounded text-center">
            <div className="font-bold text-blue-600">{sentToday}</div>
            <div className="text-xs text-gray-600">Hoje</div>
          </div>
          <div className="bg-green-50 p-2 rounded text-center">
            <div className="font-bold text-green-600">{successCount}</div>
            <div className="text-xs text-gray-600">Sucesso</div>
          </div>
          <div className="bg-red-50 p-2 rounded text-center">
            <div className="font-bold text-red-600">{failureCount}</div>
            <div className="text-xs text-gray-600">Falha</div>
          </div>
        </div>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {logs.length > 0 ? (
          logs.map((log) => (
            <div key={log.id} className="p-3 border rounded text-sm hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-xs">{log.tipo_followup}</div>
                <Badge className={getStatusColor(log.status)}>{log.status}</Badge>
              </div>
              <div className="text-xs text-gray-700 mb-2 line-clamp-2">{log.message_followup}</div>
              <div className="text-xs text-gray-500">
                {new Date(log.data_envio).toLocaleDateString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">Nenhum follow-up enviado</div>
        )}
      </div>
    </Card>
  );
}
