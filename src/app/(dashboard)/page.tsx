'use client';

import { KPICard } from '@/components/metrics/kpi-card';
import { LineChart } from '@/components/charts/line-chart';
import { BarChart } from '@/components/charts/bar-chart';
import { FunnelChart } from '@/components/charts/funnel-chart';
import {
  getDashboardMetrics,
  getLeadsOverTimeData,
  getConversionFunnelData,
  getAgentPerformanceData,
  formatCurrency,
} from '@/lib/mock-data';
import { Users, DollarSign, RefreshCcw, TrendingUp, Bot } from 'lucide-react';

export default function DashboardPage() {
  const metrics = getDashboardMetrics();
  const leadsTimeData = getLeadsOverTimeData();
  const funnelData = getConversionFunnelData();
  const agentPerformance = getAgentPerformanceData();

  const performanceChartData = agentPerformance.map((a) => ({
    name: a.agent_name,
    receita: a.receita,
    conversoes: a.conversoes,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Visão Executiva
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Monitoramento em tempo real do ecossistema de agentes
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="Leads Ativos"
          value={metrics.leads_ativos}
          change={metrics.leads_ativos_variacao}
          changeLabel="vs. mês anterior"
          icon={<Users className="h-5 w-5" />}
        />
        <KPICard
          title="Receita em Pipeline"
          value={formatCurrency(metrics.receita_pipeline)}
          change={metrics.receita_pipeline_variacao}
          changeLabel="vs. mês anterior"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KPICard
          title="Receita Recuperada"
          value={formatCurrency(metrics.receita_recuperada)}
          change={metrics.receita_recuperada_variacao}
          changeLabel="vs. mês anterior"
          icon={<RefreshCcw className="h-5 w-5" />}
        />
        <KPICard
          title="LTV Médio"
          value={formatCurrency(metrics.ltv_medio)}
          change={metrics.ltv_medio_variacao}
          changeLabel="vs. mês anterior"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <KPICard
          title="Leads Salvos pelo OTTO"
          value={metrics.leads_salvos_otto}
          change={metrics.leads_salvos_otto_variacao}
          changeLabel="vs. mês anterior"
          icon={<Bot className="h-5 w-5" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LineChart
          title="Evolução de Leads (30 dias)"
          data={leadsTimeData}
          xAxisKey="date"
          lines={[
            { dataKey: 'novos', name: 'Novos', color: '#0f62fe' },
            { dataKey: 'qualificados', name: 'Qualificados', color: '#8a3ffc' },
            { dataKey: 'ganhos', name: 'Convertidos', color: '#198038' },
          ]}
        />
        <FunnelChart title="Funil de Conversão" data={funnelData} />
      </div>

      {/* Agent Performance Chart */}
      <div className="grid grid-cols-1">
        <BarChart
          title="Performance por Agente"
          data={performanceChartData}
          xAxisKey="name"
          bars={[{ dataKey: 'receita', name: 'Receita Gerada', color: '#0f62fe' }]}
          formatAsCurrency
          height={350}
        />
      </div>
    </div>
  );
}

