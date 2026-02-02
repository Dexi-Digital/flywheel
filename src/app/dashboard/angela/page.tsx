'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrainDrawer } from '@/components/shared';
import { useBrainDrawerData } from '@/hooks/use-brain-drawer-data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  HeartHandshake,
  AlertOctagon,
  TrendingUp,
  ShieldAlert,
  MessageCircleWarning,
  RefreshCw,
  AlertTriangle,
  Users,
  ThumbsUp,
  ThumbsDown,
  Flame,
  Activity,
  Server,
  Brain,
} from 'lucide-react';

// Serviços RPC da Angela
import {
  getAngelaKpiPulse,
  getAngelaUrgentList,
  getAngelaSentimentTimeline,
  getAngelaProblemStats,
  getAngelaGovernance,
} from '@/services/angela.service';

// Tipos da API Angela
import type {
  AngelaKpiPulse,
  AngelaUrgentLead,
  AngelaSentimentPoint,
  AngelaProblemStat,
  AngelaGovernanceData,
} from '@/types/angela-api.types';

// Thresholds de governança
const GOVERNANCE_THRESHOLDS = {
  QUEUE_WARNING: 20,
  QUEUE_CRITICAL: 50,
  CONTEXT_LOSS_CRITICAL: 0, // Qualquer perda de contexto é crítica
} as const;

export default function AngelaPage() {
  // Estados granulares para cada seção
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [kpiPulse, setKpiPulse] = useState<AngelaKpiPulse | null>(null);
  const [urgentList, setUrgentList] = useState<AngelaUrgentLead[]>([]);
  const [sentimentTimeline, setSentimentTimeline] = useState<AngelaSentimentPoint[]>([]);
  const [problemStats, setProblemStats] = useState<AngelaProblemStat[]>([]);
  const [governanceData, setGovernanceData] = useState<AngelaGovernanceData | null>(null);

  // Estados do BrainDrawer
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLeadName, setSelectedLeadName] = useState('');
  const [isBrainDrawerOpen, setIsBrainDrawerOpen] = useState(false);

  const { data: brainData, fetchBrainData } = useBrainDrawerData({
    agentId: 'angela',
    leadId: selectedLeadId || '',
  });

  // Carrega todos os dados do dashboard em paralelo
  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const [pulse, urgent, timeline, problems, governance] = await Promise.all([
        getAngelaKpiPulse(),
        getAngelaUrgentList(),
        getAngelaSentimentTimeline(),
        getAngelaProblemStats(),
        getAngelaGovernance(),
      ]);
      setKpiPulse(pulse);
      setUrgentList(urgent || []);
      setSentimentTimeline(timeline || []);
      setProblemStats(problems || []);
      setGovernanceData(governance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (isBrainDrawerOpen && selectedLeadId) fetchBrainData();
  }, [isBrainDrawerOpen, selectedLeadId, fetchBrainData]);

  const handleLeadClick = (leadId: string | number, nome: string) => {
    setSelectedLeadId(String(leadId));
    setSelectedLeadName(nome);
    setIsBrainDrawerOpen(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-pink-600" />
          <p className="text-gray-500 dark:text-gray-400">Carregando dashboard Angela...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Erro ao carregar dados</h3>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">{error}</p>
              <button
                onClick={() => { setLoading(true); loadDashboard(); }}
                className="inline-flex items-center gap-2 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
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

  // Cálculos derivados
  const filaTecnica = governanceData?.fila_tecnica ?? 0;
  const perdaContexto = governanceData?.perda_contexto ?? 0;
  const hasQueueWarning = filaTecnica > GOVERNANCE_THRESHOLDS.QUEUE_WARNING;
  const hasQueueCritical = filaTecnica > GOVERNANCE_THRESHOLDS.QUEUE_CRITICAL;
  const hasContextLoss = perdaContexto > GOVERNANCE_THRESHOLDS.CONTEXT_LOSS_CRITICAL;

  // Contadores de urgência
  const criticosCount = urgentList.filter(l => l.precisa_verificacao).length;
  const negativosCount = urgentList.filter(l =>
    l.sentimento?.toLowerCase().includes('negativo')
  ).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            <HeartHandshake className="inline-block h-8 w-8 mr-2 text-pink-600" />
            Angela — Pós-Venda & Sucesso do Cliente
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Monitoramento de satisfação, resolução de problemas e retenção de clientes
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {/* SEÇÃO 1: Pulso do Atendimento (KPI Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Atendimentos */}
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Atendimentos</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {kpiPulse?.total_atendimentos.toLocaleString('pt-BR') ?? 0}
              </p>
            </div>
            <Users className="h-10 w-10 text-blue-500 opacity-50" />
          </div>
        </Card>

        {/* Sentimento Positivo */}
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sentimento Positivo</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {kpiPulse?.sentimento_positivo.toLocaleString('pt-BR') ?? 0}
              </p>
              {kpiPulse && kpiPulse.total_atendimentos > 0 && (
                <p className="text-xs text-green-600">
                  {((kpiPulse.sentimento_positivo / kpiPulse.total_atendimentos) * 100).toFixed(1)}% do total
                </p>
              )}
            </div>
            <ThumbsUp className="h-10 w-10 text-green-500 opacity-50" />
          </div>
        </Card>

        {/* Sentimento Negativo */}
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sentimento Negativo</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {kpiPulse?.sentimento_negativo.toLocaleString('pt-BR') ?? 0}
              </p>
              {kpiPulse && kpiPulse.total_atendimentos > 0 && (
                <p className="text-xs text-red-600">
                  {((kpiPulse.sentimento_negativo / kpiPulse.total_atendimentos) * 100).toFixed(1)}% do total
                </p>
              )}
            </div>
            <ThumbsDown className="h-10 w-10 text-red-500 opacity-50" />
          </div>
        </Card>

        {/* Problemas Detectados */}
        <Card className="p-4 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Problemas Detectados</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {kpiPulse?.problemas_detectados.toLocaleString('pt-BR') ?? 0}
              </p>
            </div>
            <AlertOctagon className="h-10 w-10 text-orange-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* SEÇÃO 2: Gráficos de Análise (Split View) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução de Sentimento (Timeline) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Evolução de Sentimento (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sentimentTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={sentimentTimeline} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorPositivos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorNegativos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="data"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickFormatter={(value) => {
                      try {
                        return format(new Date(value), 'dd/MM', { locale: ptBR });
                      } catch {
                        return value;
                      }
                    }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(value) => {
                      try {
                        return format(new Date(value), 'dd/MM/yyyy', { locale: ptBR });
                      } catch {
                        return String(value);
                      }
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="positivos"
                    name="Positivos"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorPositivos)"
                  />
                  <Area
                    type="monotone"
                    dataKey="negativos"
                    name="Negativos"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorNegativos)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-gray-500 dark:text-gray-400">
                <Activity className="h-8 w-8 mr-2 opacity-50" />
                Sem dados de timeline
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Ofensores (Problemas) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircleWarning className="h-5 w-5 text-orange-600" />
              Top Ofensores (Problemas Relatados)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {problemStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={problemStats.slice(0, 8)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis
                    dataKey="problema"
                    type="category"
                    width={100}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number | undefined) => {
                      if (value === undefined) return ['0', 'Ocorrências'];
                      const total = problemStats.reduce((sum, p) => sum + p.total, 0);
                      const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                      return [`${value} (${percent}%)`, 'Ocorrências'];
                    }}
                  />
                  <Bar dataKey="total" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-gray-500 dark:text-gray-400">
                <AlertOctagon className="h-8 w-8 mr-2 opacity-50" />
                Sem dados de problemas
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 3: Lista de Incêndios (Urgent List) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-red-600" />
              Lista de Incêndios
              {criticosCount > 0 && (
                <Badge className="bg-red-600 text-white animate-pulse ml-2">
                  {criticosCount} crítico{criticosCount > 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">
                {urgentList.length} cliente{urgentList.length !== 1 ? 's' : ''} na fila
              </span>
              {negativosCount > 0 && (
                <Badge className="border border-red-300 text-red-600 bg-transparent">
                  {negativosCount} insatisfeito{negativosCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {urgentList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Cliente</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Loja</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Sentimento</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Problema</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Resumo</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {urgentList.map((lead) => {
                    const isNegativo = lead.sentimento?.toLowerCase().includes('negativo');
                    const rowClass = isNegativo
                      ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800';

                    return (
                      <tr
                        key={lead.id}
                        className={`border-b cursor-pointer transition-colors ${rowClass}`}
                        onClick={() => handleLeadClick(lead.id, lead.nome)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">{lead.nome}</span>
                            {lead.precisa_verificacao && (
                              <Badge className="bg-red-600 text-white text-xs animate-pulse">
                                Verificar Follow-up
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{lead.whatsapp}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {lead.loja || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {lead.sentimento ? (
                            <Badge className={
                              isNegativo
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                : lead.sentimento.toLowerCase().includes('positivo')
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }>
                              {lead.sentimento}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
                          {lead.problema_relatado || '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[250px]">
                          <p className="line-clamp-2 text-xs">{lead.resumo || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLeadClick(lead.id, lead.nome);
                            }}
                            className="inline-flex items-center gap-1 rounded-md bg-pink-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-pink-700"
                          >
                            <Brain className="h-3 w-3" />
                            Ver Cérebro
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <HeartHandshake className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum incêndio no momento!</p>
              <p className="text-sm">Todos os clientes estão satisfeitos 🎉</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEÇÃO 4: Governança e Saúde Técnica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-slate-600" />
            Governança & Saúde do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Fila Técnica */}
            <div className={`p-4 rounded-lg border ${
              hasQueueCritical
                ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700'
                : hasQueueWarning
                  ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700'
                  : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Server className={`h-5 w-5 ${
                  hasQueueCritical ? 'text-red-600' : hasQueueWarning ? 'text-yellow-600' : 'text-gray-600'
                }`} />
                <span className="font-medium text-gray-700 dark:text-gray-300">Fila de Mensagens</span>
              </div>
              <p className={`text-3xl font-bold ${
                hasQueueCritical ? 'text-red-600' : hasQueueWarning ? 'text-yellow-600' : 'text-gray-900 dark:text-white'
              }`}>
                {filaTecnica}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {hasQueueCritical ? '⚠️ Sistema sobrecarregado!' : hasQueueWarning ? '⚡ Lentidão detectada' : '✓ Normal'}
              </p>
            </div>

            {/* Perda de Contexto */}
            <div className={`p-4 rounded-lg border ${
              hasContextLoss
                ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700'
                : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Brain className={`h-5 w-5 ${hasContextLoss ? 'text-red-600' : 'text-gray-600'}`} />
                <span className="font-medium text-gray-700 dark:text-gray-300">Perda de Contexto (IA)</span>
              </div>
              <p className={`text-3xl font-bold ${hasContextLoss ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                {perdaContexto}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {hasContextLoss ? '🚨 IA perdendo contexto em conversas!' : '✓ IA funcionando normalmente'}
              </p>
            </div>

            {/* Alertas Recentes */}
            <div className="p-4 rounded-lg border bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-700 dark:text-gray-300">Alertas Recentes</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {governanceData?.ultimos_alertas?.length ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">últimas 24h</p>
            </div>
          </div>

          {/* Lista de Alertas */}
          {governanceData?.ultimos_alertas && governanceData.ultimos_alertas.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Últimos Alertas do Sistema</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {governanceData.ultimos_alertas.slice(0, 10).map((alerta, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-2 rounded bg-gray-100 dark:bg-gray-700 text-sm"
                  >
                    <AlertOctagon className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 dark:text-gray-200 truncate">{alerta.alerta}</p>
                      <p className="text-xs text-gray-500">
                        {(() => {
                          try {
                            return format(new Date(alerta.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR });
                          } catch {
                            return alerta.created_at;
                          }
                        })()}
                        {alerta.sessionId && ` • Sessão: ${alerta.sessionId.slice(0, 8)}...`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brain Drawer */}
      <BrainDrawer
        isOpen={isBrainDrawerOpen}
        onClose={() => setIsBrainDrawerOpen(false)}
        leadId={selectedLeadId || ''}
        leadName={selectedLeadName}
        agentType="angela"
        chatMessages={brainData.chatMessages}
        chatSessions={brainData.chatSessions}
        sentimento={brainData.sentimento}
        problema={brainData.problema}
        memoryData={brainData.memoryData}
      />
    </div>
  );
}
