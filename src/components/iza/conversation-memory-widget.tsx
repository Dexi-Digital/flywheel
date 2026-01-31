'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ConversationMemory {
  session_id: string;
  last_message_user?: string;
  last_message_ia?: string;
  memoria_lead?: Record<string, any>;
  created_at: string;
}

interface ConversationMemoryWidgetProps {
  memories: ConversationMemory[];
  onSessionClick?: (sessionId: string) => void;
}

export function ConversationMemoryWidget({
  memories,
  onSessionClick,
}: ConversationMemoryWidgetProps) {
  const getLastMessagePreview = (msg?: string) => {
    if (!msg) return '-';
    return msg.length > 60 ? msg.substring(0, 60) + '...' : msg;
  };

  const extractIntent = (memoria?: Record<string, any>) => {
    if (!memoria) return null;
    return memoria.intencao || memoria.intenção || null;
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Memória da Conversa</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {memories.length > 0 ? (
          memories.map((memory) => (
            <div
              key={memory.session_id}
              className="p-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onSessionClick?.(memory.session_id)}
            >
              <div className="font-mono text-xs text-gray-600 mb-2">
                {memory.session_id.slice(0, 16)}...
              </div>
              {extractIntent(memory.memoria_lead) && (
                <Badge className="mb-2 bg-purple-100 text-purple-800">
                  {extractIntent(memory.memoria_lead)}
                </Badge>
              )}
              <div className="text-xs space-y-1">
                {memory.last_message_user && (
                  <div className="bg-blue-50 p-2 rounded">
                    <span className="font-semibold text-blue-700">👤:</span> {getLastMessagePreview(memory.last_message_user)}
                  </div>
                )}
                {memory.last_message_ia && (
                  <div className="bg-green-50 p-2 rounded">
                    <span className="font-semibold text-green-700">🤖:</span> {getLastMessagePreview(memory.last_message_ia)}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">Nenhuma memória encontrada</div>
        )}
      </div>
    </Card>
  );
}
