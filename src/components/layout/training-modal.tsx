'use client';

import { X, Check, AlertCircle } from 'lucide-react';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrainingModal({ isOpen, onClose }: TrainingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ação Treinar: Monitor de Qualidade</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> O que a IA disse
              </label>
              <div className="rounded-lg border border-red-100 bg-red-50/50 p-4 text-sm text-gray-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-gray-300 min-h-[120px]">
                "Infelizmente não temos este modelo disponível para test-drive esta semana. Pode voltar na próxima?"
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-green-500 flex items-center gap-1">
                <Check className="h-3 w-3" /> O que deveria ter dito
              </label>
              <div className="rounded-lg border border-green-100 bg-green-50/50 p-4 text-sm text-gray-700 dark:border-green-900/30 dark:bg-green-900/10 dark:text-gray-300 min-h-[120px]">
                "No momento o modelo X está em manutenção, mas temos o modelo Y (similar) disponível hoje ou posso agendar o X para segunda-feira às 10h. Qual prefere?"
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-500">Nota de Reforço / Feedback</label>
            <textarea 
              className="w-full rounded-lg border border-gray-200 bg-transparent p-3 text-sm focus:ring-2 focus:ring-blue-500 dark:border-gray-700"
              placeholder="Descreva a correção técnica ou comportamental..."
              rows={3}
            ></textarea>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
            Cancelar
          </button>
          <button className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Aplicar Treinamento
          </button>
        </div>
      </div>
    </div>
  );
}
