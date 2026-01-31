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

      {/* Top Highlights (New Specification) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <KPICard
          title="Capital sob Gestão Agêntica"
          value={formatCurrency(metrics.capital_sob_gestao)}
          change={metrics.capital_sob_gestao_variacao}
          changeLabel="Top-Line Impact"
          icon={<DollarSign className="h-6 w-6 text-blue-600" />}
          className="lg:col-span-2 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30"
          tooltip="Soma de Recuperação Ativa + Pipeline de Intenção de Compra"
        />
        <KPICard
          title="Economia Gerada"
          value={formatCurrency(metrics.economia_gerada)}
          change={metrics.economia_gerada_variacao}
          changeLabel="Bottom-Line Impact"
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
          tooltip="(Total Leads Ativos × 10 min) × Custo/Min Humano"
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Digital Workforce and Agent Performance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BarChart
          title="Força de Trabalho Digital (IA vs Humano)"
          data={performanceChartData.map(a => ({
            ...a,
            ia: Math.floor(a.conversoes * 0.8),
            humano: Math.floor(a.conversoes * 0.2)
          }))}
          xAxisKey="name"
          bars={[
            { dataKey: 'ia', name: 'Resolvido pela IA', color: '#0f62fe' },
            { dataKey: 'humano', name: 'Escalado para Humano', color: '#8a3ffc' }
          ]}
          height={350}
          layout="vertical"
        />
        <BarChart
          title="Receita por Agente"
          data={performanceChartData}
          xAxisKey="name"
          bars={[{ dataKey: 'receita', name: 'Receita Gerada', color: '#198038' }]}
          formatAsCurrency
          height={350}
        />
      </div>
    </div>
  );
}

