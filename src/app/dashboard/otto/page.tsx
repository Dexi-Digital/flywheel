'use client';

import { KPICard } from '@/components/metrics/kpi-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { getOttoMetrics, formatCurrency } from '@/lib/mock-data';
import { getStagnantLeads, getLeadsByAgent, AGENTS_DATA } from '@/lib/mock-data';
import { getEventsByType } from '@/lib/mock-data/events';
import { TrainingModal } from '@/components/layout/training-modal';
import { useState } from 'react';
import { Bot, AlertTriangle, CheckCircle, ArrowRightLeft, DollarSign, GraduationCap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function OttoPage() {
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);
  const metrics = getOttoMetrics();
  const stagnantLeads = getStagnantLeads().slice(0, 10);
  const interventions = getEventsByType('INTERVENCAO_OTTO')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
  const transbordos = getEventsByType('LEAD_TRANSBORDADO').slice(0, 5);

  // Calcular tooltip da receita salva
  const ottoAgent = AGENTS_DATA.find(a => a.id === 'agent-otto');
  const leadsSalvos = ottoAgent?.metricas_agregadas.leads_salvos || 0;
  const ticketMedio = ottoAgent?.metricas_agregadas.ticket_medio_resgate || 0;
  const receitaSalvaTooltip = `${leadsSalvos} leads resgatados × ${formatCurrency(ticketMedio)} (ticket médio) = Projeção baseada em LTV médio`;

  return (
    <div className="space-y-6">
      <TrainingModal isOpen={isTrainingOpen} onClose={() => setIsTrainingOpen(false)} />
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Bot className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            OTTO Governance
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monitoramento de intervenções e recuperação de leads
          </p>
        </div>
        <button 
          onClick={() => setIsTrainingOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <GraduationCap className="h-4 w-4" />
          Ação Treinar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total de Intervenções"
          value={metrics.total_intervencoes}
          icon={<Bot className="h-5 w-5" />}
        />
        <KPICard
          title="Taxa de Sucesso"
          value={`${metrics.taxa_sucesso.toFixed(1)}%`}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <KPICard
          title="Leads Estagnados"
          value={metrics.leads_estagnados}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <KPICard
          title="Receita Salva"
          value={formatCurrency(metrics.receita_salva)}
          icon={<DollarSign className="h-5 w-5" />}
          tooltip={receitaSalvaTooltip}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stagnant Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Leads Estagnados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stagnantLeads.map((lead) => {
                const agent = AGENTS_DATA.find((a) => a.id === lead.agente_atual_id);
                return (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={lead.nome} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {lead.nome}
                        </p>
                        <p className="text-xs text-gray-500">{lead.empresa}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="warning">{lead.tempo_parado}</Badge>
                      <p className="mt-1 text-xs text-gray-500">
                        {agent?.nome}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Interventions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-500" />
              Intervenções Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {interventions.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.metadata.motivo}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(event.timestamp), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <Badge
                    variant={
                      event.metadata.resultado === 'sucesso'
                        ? 'success'
                        : event.metadata.resultado === 'falha'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {event.metadata.resultado}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

