'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FollowupControl {
  id: string;
  sessionId: string;
  decisao_IA: string;
  tipo_followUp?: string;
  sucess: boolean;
  created_at: string;
}

interface FollowupDecisionsWidgetProps {
  decisions: FollowupControl[];
}

export function FollowupDecisionsWidget({ decisions }: FollowupDecisionsWidgetProps) {
  const decisionColors: Record<string, string> = {
    'fazer follow-up': 'bg-blue-100 text-blue-800',
    'encerrar': 'bg-red-100 text-red-800',
    'reativar': 'bg-yellow-100 text-yellow-800',
    'aguardar': 'bg-gray-100 text-gray-800',
  };

  const successRate = decisions.length > 0 ? Math.round((decisions.filter(d => d.sucess).length / decisions.length) * 100) : 0;

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Decisões de Follow-up</h3>
        <div className="text-sm text-gray-600">Taxa sucesso: <span className="font-bold text-green-600">{successRate}%</span></div>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {decisions.length > 0 ? (
          decisions.map((decision) => (
            <div key={decision.id} className="p-3 border rounded hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-sm">{decision.tipo_followUp || 'Sem tipo'}</div>
                <Badge className={decisionColors[decision.decisao_IA] || 'bg-blue-100 text-blue-800'}>
                  {decision.decisao_IA}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Session: {decision.sessionId.slice(0, 12)}...</span>
                <span className={decision.sucess ? 'text-green-600 font-semibold' : 'text-red-600'}>
                  {decision.sucess ? '✓ Sucesso' : '✗ Falhou'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">Nenhuma decisão encontrada</div>
        )}
      </div>
    </Card>
  );
}
