'use client';

import { useState } from 'react';
import { X, MessageSquare, Brain, Database, RefreshCw, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Lead } from '@/types/database.types';

interface IntelligenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead;
}

export function IntelligenceDrawer({ isOpen, onClose, lead }: IntelligenceDrawerProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'reasoning' | 'memory'>('chat');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-gray-200 bg-white shadow-2xl transition-transform dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">O Cérebro</h2>
          <p className="text-xs text-gray-500">{lead?.nome || 'Inteligência Agêntica'}</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('chat')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'chat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('reasoning')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'reasoning' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <Brain className="h-4 w-4" />
          Raciocínio
        </button>
        <button
          onClick={() => setActiveTab('memory')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'memory' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <Database className="h-4 w-4" />
          Memória
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 h-[calc(100vh-120px)]">
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="self-start max-w-[85%] rounded-2xl bg-gray-100 p-3 text-sm dark:bg-gray-800">
                Olá! Sou o agente responsável por este lead. Como posso ajudar?
              </div>
              <div className="self-end max-w-[85%] rounded-2xl bg-blue-600 p-3 text-sm text-white">
                Quais são as últimas interações?
              </div>
              <div className="self-start max-w-[85%] rounded-2xl bg-gray-100 p-3 text-sm dark:bg-gray-800">
                O lead demonstrou interesse no modelo X e solicitou uma cotação.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reasoning' && (
          <div className="rounded-lg bg-gray-900 p-4 font-mono text-xs text-green-400 overflow-auto">
            <pre>{JSON.stringify({
              intent: "purchase_intent",
              confidence: 0.92,
              next_step: "send_quote",
              reasoning: [
                "User mentioned specific model",
                "User asked about pricing",
                "Positive sentiment detected"
              ],
              internal_metadata: {
                model_version: "v4.2-stable",
                latency: "142ms"
              }
            }, null, 2)}</pre>
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-green-100 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-900/10">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-bold uppercase tracking-wider">Shadow CRM Sync</span>
              </div>
              <p className="mt-1 text-xs text-green-600 dark:text-green-500">
                Sincronizado com CRM Vende Aí
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">Dados Estruturados</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                  <p className="text-[10px] uppercase text-gray-500">Modelo Interesse</p>
                  <p className="text-sm font-medium">SUV Premium</p>
                </div>
                <div className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                  <p className="text-[10px] uppercase text-gray-500">Budget Estimado</p>
                  <p className="text-sm font-medium">R$ 250k+</p>
                </div>
                <div className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                  <p className="text-[10px] uppercase text-gray-500">Urgência</p>
                  <p className="text-sm font-medium">Alta</p>
                </div>
                <div className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                  <p className="text-[10px] uppercase text-gray-500">Decisor</p>
                  <p className="text-sm font-medium">Sim</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4 bg-white dark:border-gray-800 dark:bg-gray-900">
        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <RefreshCw className="h-4 w-4" />
          Forçar Re-Sincronização
        </button>
      </div>
    </div>
  );
}
