'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ChatMessage {
  created_at: string;
  message: string;
  sender?: string;
}

interface ChatSession {
  id: string;
  session_id: string;
  platform?: string;
  status?: string;
  last_message_at?: string;
}

interface BrainDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  agentType: 'fernanda' | 'alice' | 'iza' | 'luis' | 'victor' | 'angela';
  
  // Chat Tab Data
  chatMessages?: ChatMessage[];
  chatSessions?: ChatSession[];
  
  // Reasoning Tab Data
  internalReasoning?: Record<string, any>;
  sentimento?: string;
  problema?: string;
  renegociacao?: Record<string, any>;
  
  // Memory Tab Data
  memoryData?: Record<string, any>;
}

export function BrainDrawer({
  isOpen,
  onClose,
  leadId,
  leadName,
  agentType,
  chatMessages = [],
  chatSessions = [],
  internalReasoning,
  sentimento,
  problema,
  renegociacao,
  memoryData,
}: BrainDrawerProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'reasoning' | 'memory'>('chat');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">🧠 O Cérebro</h2>
            <p className="text-sm text-gray-600">{leadName} • {leadId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50 px-6">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'chat'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setActiveTab('reasoning')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'reasoning'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🧠 Raciocínio
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'memory'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            💾 Memória
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              {chatSessions.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-sm mb-3 text-gray-700">Sessões Ativas</h3>
                  <div className="space-y-2">
                    {chatSessions.map((session) => (
                      <Card key={session.id} className="p-3 bg-blue-50 border-blue-200">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-mono text-xs text-gray-600">{session.session_id.slice(0, 16)}...</span>
                          {session.platform && <Badge className="bg-blue-100 text-blue-800 text-xs">{session.platform}</Badge>}
                        </div>
                        {session.status && (
                          <div className="text-xs text-gray-600">Status: {session.status}</div>
                        )}
                        {session.last_message_at && (
                          <div className="text-xs text-gray-500 mt-1">
                            Última: {new Date(session.last_message_at).toLocaleDateString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-3 text-gray-700">Histórico de Chat</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded ${
                          msg.sender === 'user' || msg.sender === 'client'
                            ? 'bg-gray-100 border-l-4 border-blue-500'
                            : 'bg-blue-50 border-l-4 border-green-500'
                        }`}
                      >
                        <div className="text-xs text-gray-600 mb-1">
                          {msg.sender === 'user' || msg.sender === 'client' ? '👤 Cliente' : '🤖 IA'}
                          {' • '}
                          {new Date(msg.created_at).toLocaleDateString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-sm text-gray-900">{msg.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.length === 0 && chatSessions.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  <p>Nenhum chat encontrado</p>
                </div>
              )}
            </div>
          )}

          {/* Reasoning Tab */}
          {activeTab === 'reasoning' && (
            <div className="space-y-4">
              {/* For Angela: sentimento + problema */}
              {agentType === 'angela' && (
                <>
                  {sentimento && (
                    <Card className="p-4 border-purple-200 bg-purple-50">
                      <h4 className="font-semibold text-sm mb-2 text-purple-900">😊 Sentimento do Cliente</h4>
                      <p className="text-sm text-gray-700">{sentimento}</p>
                    </Card>
                  )}
                  {problema && (
                    <Card className="p-4 border-red-200 bg-red-50">
                      <h4 className="font-semibold text-sm mb-2 text-red-900">⚠️ Problema Identificado</h4>
                      <p className="text-sm text-gray-700">{problema}</p>
                    </Card>
                  )}
                </>
              )}

              {/* For Victor: tgv_renegociacao */}
              {agentType === 'victor' && renegociacao && (
                <Card className="p-4 border-orange-200 bg-orange-50">
                  <h4 className="font-semibold text-sm mb-3 text-orange-900">🔄 Status de Renegociação</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(renegociacao).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-700 font-medium">{key}:</span>
                        <span className="text-gray-600">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* For Fernanda / Alice / Iza: internal_reasoning */}
              {['fernanda', 'alice', 'iza'].includes(agentType) && internalReasoning && (
                <Card className="p-4 border-indigo-200 bg-indigo-50">
                  <h4 className="font-semibold text-sm mb-3 text-indigo-900">🧠 Raciocínio Interno</h4>
                  <div className="space-y-2">
                    {Array.isArray(internalReasoning) ? (
                      internalReasoning.map((item, idx) => (
                        <Badge key={idx} className="bg-indigo-100 text-indigo-800 mr-2">
                          {typeof item === 'string' ? item : JSON.stringify(item)}
                        </Badge>
                      ))
                    ) : typeof internalReasoning === 'object' ? (
                      <pre className="text-xs bg-white p-2 rounded border border-indigo-200 overflow-x-auto">
                        {JSON.stringify(internalReasoning, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-gray-700">{String(internalReasoning)}</p>
                    )}
                  </div>
                </Card>
              )}

              {!sentimento && !problema && !renegociacao && !internalReasoning && (
                <div className="py-12 text-center text-gray-500">
                  <p>Nenhum raciocínio registrado</p>
                </div>
              )}
            </div>
          )}

          {/* Memory Tab */}
          {activeTab === 'memory' && (
            <div className="space-y-4">
              {memoryData ? (
                <>
                  <Card className="p-4 bg-green-50 border-green-200">
                    <h4 className="font-semibold text-sm mb-3 text-green-900">📝 Memória do Lead</h4>
                    {typeof memoryData === 'object' ? (
                      <pre className="text-xs bg-white p-3 rounded border border-green-200 overflow-x-auto max-h-96 overflow-y-auto">
                        {JSON.stringify(memoryData, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{String(memoryData)}</p>
                    )}
                  </Card>
                </>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <p>Nenhuma memória registrada</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
