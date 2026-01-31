'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AISession {
  id: string;
  session_id: string;
  lead_id?: string;
  platform?: string;
  status?: string;
  last_message_at?: string;
  created_at: string;
}

interface AISessionsWidgetProps {
  sessions: AISession[];
  onSessionClick?: (sessionId: string) => void;
}

export function AISessionsWidget({ sessions, onSessionClick }: AISessionsWidgetProps) {
  const getPlatformColor = (platform?: string) => {
    const colors: Record<string, string> = {
      'WhatsApp': 'bg-green-100 text-green-800',
      'site': 'bg-blue-100 text-blue-800',
      'email': 'bg-purple-100 text-purple-800',
    };
    return colors[platform || ''] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-blue-100 text-blue-800',
      'closed': 'bg-gray-100 text-gray-800',
      'pending': 'bg-yellow-100 text-yellow-800',
    };
    return colors[status || ''] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Sessões de Chat IA</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <div
              key={session.id}
              className="p-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onSessionClick?.(session.session_id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-mono text-xs text-gray-600">{session.session_id.slice(0, 12)}...</div>
                <div className="flex gap-2">
                  {session.platform && (
                    <Badge className={getPlatformColor(session.platform)}>{session.platform}</Badge>
                  )}
                  {session.status && (
                    <Badge className={getStatusColor(session.status)}>{session.status}</Badge>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                {session.lead_id && <div>Lead: {session.lead_id}</div>}
                {session.last_message_at && (
                  <div>
                    Última msg:{' '}
                    {new Date(session.last_message_at).toLocaleDateString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">Nenhuma sessão encontrada</div>
        )}
      </div>
    </Card>
  );
}
