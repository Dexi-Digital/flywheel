'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Mensagem {
  id: string;
  direcao: 'INBOUND' | 'OUTBOUND';
  mensagem: string;
  telefone_nono_digito?: string;
  wa_mensagem_id?: string;
  created_at: string;
}

interface BufferMessage {
  id: string;
  chat_id: string;
  message: string;
  message_id?: string;
  created_at: string;
}

interface MessagesWidgetProps {
  mensagens: Mensagem[];
  bufferMessages: BufferMessage[];
}

export function MessagesWidget({ mensagens, bufferMessages }: MessagesWidgetProps) {
  const inbound = mensagens.filter(m => m.direcao === 'INBOUND').length;
  const outbound = mensagens.filter(m => m.direcao === 'OUTBOUND').length;

  return (
    <div className="space-y-4">
      {/* Mensagens Enviadas/Recebidas */}
      <Card className="p-4">
        <div className="mb-4">
          <h3 className="font-semibold">Histórico de Mensagens</h3>
          <div className="flex gap-2 mt-2 text-sm">
            <Badge className="bg-blue-100 text-blue-800">{inbound} recebidas</Badge>
            <Badge className="bg-green-100 text-green-800">{outbound} enviadas</Badge>
          </div>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {mensagens.length > 0 ? (
            mensagens.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 border rounded text-sm ${
                  msg.direcao === 'INBOUND' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <Badge className={msg.direcao === 'INBOUND' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                    {msg.direcao === 'INBOUND' ? '👤 Recebida' : '🤖 Enviada'}
                  </Badge>
                  <span className="text-xs text-gray-600">
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="text-xs text-gray-700 mb-1 line-clamp-2">{msg.mensagem}</div>
                {msg.telefone_nono_digito && (
                  <div className="text-xs text-gray-500">{msg.telefone_nono_digito}</div>
                )}
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-gray-500">Nenhuma mensagem</div>
          )}
        </div>
      </Card>

      {/* Buffer de Mensagens */}
      {bufferMessages.length > 0 && (
        <Card className="p-4">
          <div className="mb-4">
            <h3 className="font-semibold">⏳ Fila de Mensagens</h3>
            <p className="text-sm text-gray-600 mt-1">{bufferMessages.length} mensagens aguardando processamento</p>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {bufferMessages.map((msg) => (
              <div key={msg.id} className="p-3 border rounded bg-yellow-50 border-yellow-200 text-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-yellow-900">Chat: {msg.chat_id}</span>
                  <span className="text-xs text-gray-600">
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
                <div className="text-xs text-gray-700 line-clamp-2">{msg.message}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
