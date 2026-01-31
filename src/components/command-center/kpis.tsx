'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GlobalKPIData {
  totalLeads: number;
  activeLeads: number;
  conversions: number;
  totalRevenue: number;
  contactRate: number;
  aiAutonomy: number;
  humanInterventions: number;
  returnRequests: number;
}

interface CommandCenterKPIsProps {
  data: GlobalKPIData;
}

export function CommandCenterKPIs({ data }: CommandCenterKPIsProps) {
  const economyGenerated = Math.round(data.totalRevenue * 0.15); // Estimate 15% economy from AI

  return (
    <div className="space-y-6">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Leads Totais</div>
          <div className="text-3xl font-bold text-blue-600">{data.totalLeads}</div>
          <div className="text-xs text-gray-500 mt-2">{data.activeLeads} ativos</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Conversões</div>
          <div className="text-3xl font-bold text-green-600">{data.conversions}</div>
          <div className="text-xs text-gray-500 mt-2">
            {data.totalLeads > 0 ? Math.round((data.conversions / data.totalLeads) * 100) : 0}% de taxa
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Receita Total</div>
          <div className="text-2xl font-bold text-purple-600">R$ {(data.totalRevenue / 1000000).toFixed(1)}M</div>
          <div className="text-xs text-gray-500 mt-2">valor agregado</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">💡 Economia Gerada</div>
          <div className="text-2xl font-bold text-orange-600">R$ {(economyGenerated / 1000).toFixed(0)}k</div>
          <div className="text-xs text-gray-500 mt-2">por otimização IA</div>
        </Card>
      </div>

      {/* AI Autonomy & Intervention Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3">🤖 Autonomia da IA</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Taxa de Autonomia</span>
                <span className="font-bold text-blue-600">{data.aiAutonomy}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${data.aiAutonomy}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3">👤 Intervenção Humana</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 text-sm">Casos escalados</span>
              <Badge className="bg-red-100 text-red-800">{data.humanInterventions}</Badge>
            </div>
            <div className="text-xs text-gray-600">
              Taxa: {data.totalLeads > 0 ? Math.round((data.humanInterventions / data.totalLeads) * 100) : 0}%
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3">📞 Retornos Solicitados</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 text-sm">Pedidos pendentes</span>
              <Badge className="bg-yellow-100 text-yellow-800">{data.returnRequests}</Badge>
            </div>
            <div className="text-xs text-gray-600">
              Acompanhamento necessário
            </div>
          </div>
        </Card>
      </div>

      {/* Contact Rate Overview */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">📊 Taxa de Contato por Agente</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Taxa Geral de Contato</span>
              <span className="font-bold">{data.contactRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${data.contactRate}%` }}
              />
            </div>
          </div>
          <div className="text-xs text-gray-600 mt-3 pt-3 border-t">
            ✓ {Math.round((data.contactRate / 100) * data.activeLeads)} de {data.activeLeads} leads contatados
          </div>
        </div>
      </Card>
    </div>
  );
}
