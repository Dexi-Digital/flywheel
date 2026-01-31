'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AgentPrompt {
  id: string;
  tipo: string;
  prompt_analise_interacao?: string;
  prompt_agente_conhecimento?: string;
  modelo_saida_estruturada_analise?: Record<string, any>;
  modelo_saida_estruturada_conhecimento?: Record<string, any>;
}

interface AgentPromptsConfigProps {
  prompts: AgentPrompt[];
}

export function AgentPromptsConfig({ prompts }: AgentPromptsConfigProps) {
  const getPromptPreview = (text?: string) => {
    if (!text) return '-';
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">⚙️ Configuração da Iza (Prompts)</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {prompts.length > 0 ? (
          prompts.map((prompt) => (
            <div key={prompt.id} className="p-3 border rounded hover:bg-gray-50 transition-colors">
              <div className="font-medium text-sm mb-2">
                <Badge className="bg-indigo-100 text-indigo-800">{prompt.tipo}</Badge>
              </div>
              <div className="space-y-2 text-xs">
                {prompt.prompt_analise_interacao && (
                  <div>
                    <div className="font-semibold text-gray-700">📊 Análise de Interação:</div>
                    <div className="text-gray-600 bg-gray-50 p-2 rounded mt-1">
                      {getPromptPreview(prompt.prompt_analise_interacao)}
                    </div>
                  </div>
                )}
                {prompt.prompt_agente_conhecimento && (
                  <div>
                    <div className="font-semibold text-gray-700">🧠 Conhecimento Agente:</div>
                    <div className="text-gray-600 bg-gray-50 p-2 rounded mt-1">
                      {getPromptPreview(prompt.prompt_agente_conhecimento)}
                    </div>
                  </div>
                )}
                {(prompt.modelo_saida_estruturada_analise || prompt.modelo_saida_estruturada_conhecimento) && (
                  <div>
                    <div className="font-semibold text-gray-700">📋 Modelos Estruturados:</div>
                    <div className="text-gray-600 bg-gray-50 p-2 rounded mt-1 font-mono text-xs">
                      {prompt.modelo_saida_estruturada_analise &&
                        `Análise: ${JSON.stringify(prompt.modelo_saida_estruturada_analise).substring(0, 60)}...`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">Nenhum prompt configurado</div>
        )}
      </div>
    </Card>
  );
}
