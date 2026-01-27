'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { KPICard } from '@/components/metrics/kpi-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { getAgentById, getLeadsByAgent, getEventsByAgent } from '@/lib/mock-data';
import { getAgentTypeLabel, formatCurrency, getStatusLabel, getStatusColor } from '@/lib/utils';
import { Clock, Users, TrendingUp, DollarSign, Zap, RefreshCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AgentPage({ params }: PageProps) {
  const { id } = use(params);
  const agent = getAgentById(id);

  if (!agent) {
    notFound();
  }

  const leads = getLeadsByAgent(id);
  const events = getEventsByAgent(id).slice(0, 10);
  const conversoes = leads.filter((l) => l.status === 'GANHO').length;
  const taxaConversao = leads.length > 0 ? (conversoes / leads.length) * 100 : 0;
  const receitaTotal = leads
    .filter((l) => l.status === 'GANHO')
    .reduce((sum, l) => sum + l.valor_potencial, 0);

  // Agent-specific metrics
  const getAgentMetrics = () => {
    switch (agent.tipo) {
      case 'SDR':
        return [
          { title: 'Speed to Lead', value: `${agent.metricas_agregadas.tempo_medio_resposta || 23}s`, icon: <Clock className="h-5 w-5" /> },
          { title: 'Leads Ativos', value: agent.metricas_agregadas.leads_ativos || leads.length, icon: <Users className="h-5 w-5" /> },
          { title: 'Taxa de Resposta < 60s', value: '87%', icon: <Zap className="h-5 w-5" /> },
          { title: 'Agendamentos', value: agent.metricas_agregadas.conversoes || conversoes, icon: <TrendingUp className="h-5 w-5" /> },
        ];
      case 'BDR':
        return [
          { title: 'Prospecções/Dia', value: '45', icon: <Users className="h-5 w-5" /> },
          { title: 'Taxa de Conexão', value: '34%', icon: <TrendingUp className="h-5 w-5" /> },
          { title: 'Reuniões Agendadas', value: agent.metricas_agregadas.conversoes || 89, icon: <Zap className="h-5 w-5" /> },
          { title: 'Receita Gerada', value: formatCurrency(receitaTotal), icon: <DollarSign className="h-5 w-5" /> },
        ];
      case 'WINBACK':
        return [
          { title: 'Leads Reativados', value: agent.metricas_agregadas.conversoes || 67, icon: <RefreshCcw className="h-5 w-5" /> },
          { title: 'Taxa de Sucesso', value: `${((agent.metricas_agregadas.taxa_sucesso || 0.45) * 100).toFixed(0)}%`, icon: <TrendingUp className="h-5 w-5" /> },
          { title: 'Receita Recuperada', value: formatCurrency(agent.metricas_agregadas.receita_recuperada || 0), icon: <DollarSign className="h-5 w-5" /> },
          { title: 'CAC Evitado', value: formatCurrency((agent.metricas_agregadas.conversoes || 67) * 1500), icon: <Zap className="h-5 w-5" /> },
        ];
      case 'FINANCEIRO':
        return [
          { title: 'Inadimplências Resolvidas', value: agent.metricas_agregadas.inadimplencias_resolvidas || 189, icon: <RefreshCcw className="h-5 w-5" /> },
          { title: 'Tempo Médio Resolução', value: `${agent.metricas_agregadas.tempo_medio_resolucao || 72}h`, icon: <Clock className="h-5 w-5" /> },
          { title: 'Taxa de Recuperação', value: `${((agent.metricas_agregadas.taxa_sucesso || 0.78) * 100).toFixed(0)}%`, icon: <TrendingUp className="h-5 w-5" /> },
          { title: 'Receita Recuperada', value: formatCurrency(agent.metricas_agregadas.receita_recuperada || 0), icon: <DollarSign className="h-5 w-5" /> },
        ];
      default:
        return [
          { title: 'Leads Ativos', value: leads.length, icon: <Users className="h-5 w-5" /> },
          { title: 'Conversões', value: conversoes, icon: <TrendingUp className="h-5 w-5" /> },
          { title: 'Taxa de Conversão', value: `${taxaConversao.toFixed(1)}%`, icon: <Zap className="h-5 w-5" /> },
          { title: 'Receita Total', value: formatCurrency(receitaTotal), icon: <DollarSign className="h-5 w-5" /> },
        ];
    }
  };

  const agentMetrics = getAgentMetrics();

  return (
    <div className="space-y-6">
      {/* Agent Header */}
      <div className="flex items-center gap-4">
        <Avatar name={agent.nome} size="xl" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {agent.nome}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {getAgentTypeLabel(agent.tipo)}
          </p>
          <Badge variant={agent.status === 'ATIVO' ? 'success' : 'warning'} className="mt-2">
            {agent.status}
          </Badge>
        </div>
      </div>

      {/* Agent KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {agentMetrics.map((metric, index) => (
          <KPICard
            key={index}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Leads Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leads.slice(0, 8).map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {lead.nome}
                    </p>
                    <p className="text-xs text-gray-500">{lead.empresa}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(lead.status)}`}>
                      {getStatusLabel(lead.status)}
                    </span>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatCurrency(lead.valor_potencial)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.tipo.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(event.timestamp), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

