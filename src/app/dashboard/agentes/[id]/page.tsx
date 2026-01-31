'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { KPICard } from '@/components/metrics/kpi-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { IntelligenceDrawer } from '@/components/layout/intelligence-drawer';
import { buildService } from '@/services/factory';
import { getAgentTypeLabel, formatCurrency, getStatusLabel, getStatusColor } from '@/lib/utils';
import { Clock, Users, TrendingUp, DollarSign, Zap, RefreshCcw, AlertCircle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Agent } from '@/types/database.types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AgentPage({ params }: PageProps) {
  const { id } = use(params);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const loadAgentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const service = buildService(id);
      
      const agentData = await service.getAgent(id);
      
      console.log('🔍 Agent carregado:', agentData);
      console.log('📊 Leads:', agentData.leads);
      console.log('📅 Events:', agentData.events);
      
      setAgent(agentData);
    } catch (err) {
      console.error('❌ Erro ao carregar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do agente');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAgentData();
  }, [loadAgentData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Erro ao carregar dados
              </h3>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                {error}
              </p>
              {error?.includes('Configuração do Supabase ausente') && (
                <div className="mb-6 rounded-md bg-blue-50 p-4 text-left text-xs text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                  <p className="font-semibold">Como resolver:</p>
                  <ul className="mt-1 list-inside list-disc space-y-1">
                    <li>Certifique-se de que o arquivo <code>.env.local</code> existe.</li>
                    <li>Adicione as chaves <code>NEXT_PUBLIC_SUPABASE_URL_{id.split('-')[1].toUpperCase()}</code>.</li>
                    <li>Reinicie o servidor de desenvolvimento.</li>
                  </ul>
                </div>
              )}
              <button
                onClick={loadAgentData}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Agente não encontrado
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Não foi possível encontrar o agente com ID: {id}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const eventsToShow = agent.events.slice(0, 10);
  const conversoes = agent.leads.filter((l) => l.status === 'GANHO').length;
  const taxaConversao = agent.leads.length > 0 ? (conversoes / agent.leads.length) * 100 : 0;
  const receitaTotal = agent.leads
    .filter((l) => l.status === 'GANHO')
    .reduce((sum, l) => sum + l.valor_potencial, 0);

  // Agent-specific metrics
  const getAgentMetrics = () => {
    switch (agent.tipo) {
      case 'SDR':
        return [
          { title: 'Speed to Lead', value: `${agent.metricas_agregadas.tempo_medio_resposta || 23}s`, icon: <Clock className="h-5 w-5" /> },
          { title: 'Leads Ativos', value: agent.metricas_agregadas.leads_ativos || agent.leads.length, icon: <Users className="h-5 w-5" /> },
          { title: 'Disparos Hoje', value: agent.metricas_agregadas.disparos_hoje || 0, icon: <Zap className="h-5 w-5" /> },
          { title: 'Taxa de Resposta', value: `${((agent.metricas_agregadas.taxa_resposta || 0) * 100).toFixed(0)}%`, icon: <TrendingUp className="h-5 w-5" /> },
        ];
      case 'BDR':
        return [
          { title: 'Disparos Hoje', value: agent.metricas_agregadas.disparos_hoje || 0, icon: <Users className="h-5 w-5" /> },
          { title: 'Taxa de Resposta', value: `${((agent.metricas_agregadas.taxa_resposta || 0) * 100).toFixed(0)}%`, icon: <TrendingUp className="h-5 w-5" /> },
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
          { title: 'Leads Ativos', value: agent.leads.length, icon: <Users className="h-5 w-5" /> },
          { title: 'Conversões', value: conversoes, icon: <TrendingUp className="h-5 w-5" /> },
          { title: 'Taxa de Conversão', value: `${taxaConversao.toFixed(1)}%`, icon: <Zap className="h-5 w-5" /> },
          { title: 'Receita Total', value: formatCurrency(receitaTotal), icon: <DollarSign className="h-5 w-5" /> },
        ];
    }
  };

  const agentMetrics = getAgentMetrics();

  // Dados mockados para Sales Pilot
  const topDuvidasTecnicas = [
    { tema: 'Autonomia', count: 45, percentual: 28.8 },
    { tema: 'Carregamento', count: 38, percentual: 24.4 },
    { tema: 'Segurança', count: 32, percentual: 20.5 },
    { tema: 'Manutenção', count: 24, percentual: 15.4 },
    { tema: 'Conectividade', count: 17, percentual: 10.9 },
  ];

  const lacunasIdentificadas = [
    {
      titulo: 'Falta de informação sobre garantia estendida',
      impacto: 'Alto',
      ocorrencias: 12,
      status: 'Em análise'
    },
    {
      titulo: 'Dúvidas sobre compatibilidade com frotas mistas',
      impacto: 'Médio',
      ocorrencias: 8,
      status: 'Documentação em criação'
    },
    {
      titulo: 'Processo de retrofit não está claro',
      impacto: 'Alto',
      ocorrencias: 15,
      status: 'Escalado para produto'
    },
  ];

  return (
    <div className="space-y-6">
      <IntelligenceDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        lead={selectedLead}
      />
      {/* Agent Header */}
      <div className="flex items-center justify-between">
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
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          <Zap className="h-4 w-4 fill-current" />
          Abrir Cérebro
        </button>
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

      {/* Métricas de Disparos e Engajamento */}
      {(agent.tipo === 'SDR' || agent.tipo === 'BDR' || agent.tipo === 'PILOT') && agent.metricas_agregadas.disparos_hoje !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Disparos e Engajamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Hoje</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {agent.metricas_agregadas.disparos_hoje || 0}
                </p>
                <p className="mt-1 text-xs text-gray-500">disparos</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Esta Semana</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {agent.metricas_agregadas.disparos_semana || 0}
                </p>
                <p className="mt-1 text-xs text-gray-500">disparos</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Este Mês</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {agent.metricas_agregadas.disparos_mes || 0}
                </p>
                <p className="mt-1 text-xs text-gray-500">disparos</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Taxa de Resposta</p>
                <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
                  {((agent.metricas_agregadas.taxa_resposta || 0) * 100).toFixed(0)}%
                </p>
                <p className="mt-1 text-xs text-gray-500">média geral</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Widgets Especializados para Sales Pilot */}
      {agent.tipo === 'PILOT' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Dúvidas Técnicas */}
          <Card>
            <CardHeader>
              <CardTitle>Top Dúvidas Técnicas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topDuvidasTecnicas.map((duvida, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {duvida.tema}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({duvida.count} consultas)
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{ width: `${duvida.percentual}%` }}
                        />
                      </div>
                    </div>
                    <span className="ml-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {duvida.percentual.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lacunas Identificadas */}
          <Card>
            <CardHeader>
              <CardTitle>Lacunas Identificadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lacunasIdentificadas.map((lacuna, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {lacuna.titulo}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              lacuna.impacto === 'Alto'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                            }`}
                          >
                            {lacuna.impacto}
                          </span>
                          <span className="text-xs text-gray-500">
                            {lacuna.ocorrencias} ocorrências
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Status: {lacuna.status}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  💡 <strong>{agent.metricas_agregadas.escalacoes_nivel2 || 0}</strong> interações escaladas para Nível 2 este mês
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Kanban Board */}
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Trabalho (Kanban)</CardTitle>
        </CardHeader>
        <CardContent>
          <KanbanBoard 
            leads={agent.leads.map(l => ({ ...l, agente: agent }))} 
            agentType={agent.tipo}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Leads Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agent.leads.slice(0, 8).map((lead) => (
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
              {eventsToShow.map((event) => (
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

