'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface InteractionAnalysis {
  id: string;
  nome?: string;
  whatsapp?: string;
  loja?: string;
  interesse?: string;
  solicitou_retorno?: boolean;
  respondeu?: boolean;
  problema?: boolean;
  alerta?: boolean;
  analise_sentimento?: string;
  created_at: string;
}

interface InteractionAnalysisWidgetProps {
  analises: InteractionAnalysis[];
  onInteractionClick?: (id: string) => void;
}

export function InteractionAnalysisWidget({
  analises,
  onInteractionClick,
}: InteractionAnalysisWidgetProps) {
  const getSentimentColor = (sentiment?: string) => {
    const colors: Record<string, string> = {
      'positivo': 'bg-green-100 text-green-800',
      'neutro': 'bg-gray-100 text-gray-800',
      'negativo': 'bg-red-100 text-red-800',
      'insatisfeito': 'bg-red-100 text-red-800',
      'satisfeito': 'bg-green-100 text-green-800',
    };
    return colors[sentiment?.toLowerCase() || ''] || 'bg-blue-100 text-blue-800';
  };

  const getAlertColor = (hasAlert: boolean) => {
    return hasAlert ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Análise de Interações IA</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {analises.length > 0 ? (
          analises.map((analysis) => (
            <div
              key={analysis.id}
              className="p-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onInteractionClick?.(analysis.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium text-sm">{analysis.nome || 'Sem nome'}</div>
                  {analysis.whatsapp && (
                    <div className="text-xs text-gray-500">{analysis.whatsapp}</div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {analysis.analise_sentimento && (
                  <Badge className={getSentimentColor(analysis.analise_sentimento)}>
                    {analysis.analise_sentimento}
                  </Badge>
                )}
                {analysis.alerta && (
                  <Badge className="bg-red-100 text-red-800">⚠️ Alerta</Badge>
                )}
                {analysis.solicitou_retorno && (
                  <Badge className="bg-blue-100 text-blue-800">📞 Retorno</Badge>
                )}
                {analysis.respondeu && (
                  <Badge className="bg-green-100 text-green-800">✓ Respondeu</Badge>
                )}
              </div>
              {analysis.interesse && (
                <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded w-fit">
                  {analysis.interesse}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">Nenhuma interação encontrada</div>
        )}
      </div>
    </Card>
  );
}
