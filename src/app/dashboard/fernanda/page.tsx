'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrainDrawer } from '@/components/shared';
import { useBrainDrawerData } from '@/hooks/use-brain-drawer-data';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Users,
  Target,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Clock,
  MessageSquare,
  TrendingUp,
  Inbox,
  ShieldAlert,
  PhoneOff,
} from 'lucide-react';

// Serviços RPC da Fernanda
import {
  getFernandaFunnelMetrics,
  getFernandaLeadList,
  getFernandaActivityTimeline,
  getFernandaIntentDistribution,
  getFernandaGovernance,
} from '@/services/fernanda.service';

// Tipos da API Fernanda
import type {
  FernandaFunnelKPI,
  FernandaLead,
  FernandaTimelineItem,
  FernandaIntentStat,
  FernandaGovernanceData,
} from '@/types/fernanda-api.types';

// Mapeamento de cores para intenções
const INTENT_COLORS: Record<string, string> = {
  'Compra Imediata': '#22c55e',
  'Negociando': '#3b82f6',
  'Pesquisando': '#eab308',
  'Interessado': '#f97316',
  'Sem Interesse': '#6b7280',
  'Indefinido': '#9ca3af',
};
const DEFAULT_INTENT_COLOR = '#9ca3af';

// Thresholds de governança
const GOVERNANCE_THRESHOLDS = {
  QUEUE_WARNING: 10,
  INTERVENTION_CRITICAL: 5,
} as const;

// Mapeamento de classes Tailwind para badges de intenção
const INTENT_BADGE_CLASSES: Record<string, string> = {
  'Compra Imediata': 'bg-green-500 text-white hover:bg-green-600',
  'Negociando': 'bg-blue-500 text-white hover:bg-blue-600',
  'Pesquisando': 'bg-yellow-500 text-white hover:bg-yellow-600',
  'Interessado': 'bg-orange-500 text-white hover:bg-orange-600',
  'Sem Interesse': 'bg-gray-500 text-white hover:bg-gray-600',
  'Indefinido': 'bg-gray-400 text-white hover:bg-gray-500',
};
const DEFAULT_INTENT_BADGE_CLASS = 'bg-gray-400 text-white';

function getIntentBadgeClass(intencao: string): string {
  return INTENT_BADGE_CLASSES[intencao] || DEFAULT_INTENT_BADGE_CLASS;
}

export default function FernandaPage() {
  // Estados granulares para cada seção
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [funnelData, setFunnelData] = useState<FernandaFunnelKPI | null>(null);
  const [leadList, setLeadList] = useState<FernandaLead[]>([]);
  const [timelineData, setTimelineData] = useState<FernandaTimelineItem[]>([]);
  const [intentStats, setIntentStats] = useState<FernandaIntentStat[]>([]);
  const [governanceData, setGovernanceData] = useState<FernandaGovernanceData | null>(null);

  // Estados do BrainDrawer
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLeadName, setSelectedLeadName] = useState('');
  const [isBrainDrawerOpen, setIsBrainDrawerOpen] = useState(false);

  const { data: brainData, fetchBrainData } = useBrainDrawerData({
    agentId: 'fernanda',
    leadId: selectedLeadId || '',
  });

  // Carrega todos os dados do dashboard em paralelo
  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const [funnel, leads, timeline, intent, governance] = await Promise.all([
        getFernandaFunnelMetrics(),
        getFernandaLeadList(),
        getFernandaActivityTimeline(),
        getFernandaIntentDistribution(),
        getFernandaGovernance(),
      ]);
      setFunnelData(funnel);
      setLeadList(leads || []);
      setTimelineData(timeline || []);
      setIntentStats(intent || []);
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

  const handleLeadClick = (sessionId: string, nome: string) => {
    setSelectedLeadId(sessionId);
    setSelectedLeadName(nome);
    setIsBrainDrawerOpen(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-gray-500 dark:text-gray-400">Carregando dashboard Fernanda...</p>
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
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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

  // Cálculos derivados do funil
  const funnelStages = funnelData
    ? [
        { stage: 'Carteira (Base Total)', value: funnelData.base_total, fill: '#94a3b8', icon: Users },
        { stage: 'WhatsApp Válido', value: funnelData.validos, fill: '#3b82f6', icon: CheckCircle2 },
        { stage: 'Com Intenção Real', value: funnelData.com_intencao, fill: '#22c55e', icon: TrendingUp },
        { stage: 'Intervenção Humana', value: funnelData.intervencoes, fill: '#f97316', icon: PhoneOff },
      ]
    : [];
  const maxFunnelValue = funnelStages.length ? Math.max(...funnelStages.map((d) => d.value), 1) : 1;

  // Dados para PieChart de intenções
  const intentChartData = intentStats.map((item) => ({
    ...item,
    fill: INTENT_COLORS[item.intencao] || DEFAULT_INTENT_COLOR,
  }));

  // Thresholds de governança
  const filaPendente = governanceData?.fila_pendente ?? 0;
  const taxaIntervencao = governanceData?.taxa_intervencao ?? 0;
  const hasQueueWarning = filaPendente > GOVERNANCE_THRESHOLDS.QUEUE_WARNING;
  const hasInterventionAlert = taxaIntervencao > GOVERNANCE_THRESHOLDS.INTERVENTION_CRITICAL;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">♻️ Fernanda — Recuperação de Vendas</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Win-back de leads não convertidos. Foco: intenção de compra e intervenção inteligente.
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

      {/* SEÇÃO 1: Funil de Recuperação (KPIs) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Funil de Recuperação
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Carteira → WhatsApp OK → Intenção Real → Intervenção Humana
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelStages.map((item, index) => {
              const widthPercentage = (item.value / maxFunnelValue) * 100;
              const conversionRate =
                index > 0 && funnelStages[index - 1].value > 0
                  ? ((item.value / funnelStages[index - 1].value) * 100).toFixed(1)
                  : '100';
              const Icon = item.icon;
              return (
                <div key={item.stage}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
                      <Icon className="h-4 w-4" style={{ color: item.fill }} />
                      {item.stage}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 dark:text-gray-400">{item.value.toLocaleString('pt-BR')}</span>
                      {index > 0 && (
                        <span className="text-xs text-gray-400">({conversionRate}%)</span>
                      )}
                    </div>
                  </div>
                  <div className="relative h-8 w-full overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
                    <div
                      className="absolute inset-y-0 left-0 rounded transition-all duration-500"
                      style={{ width: `${widthPercentage}%`, backgroundColor: item.fill }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {funnelData && funnelData.base_total > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Taxa Base → Intenção</span>
              <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                {((funnelData.com_intencao / funnelData.base_total) * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEÇÃO 2: Atividade e Intenção (Grid 2 colunas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline de Atividade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Atividade Diária
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Volume de conversas por dia
            </p>
          </CardHeader>
          <CardContent>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={timelineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                    formatter={(value) => [`${value} conversas`, 'Total']}
                  />
                  <Bar dataKey="total_conversas" name="Conversas" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-gray-500 dark:text-gray-400">
                Sem dados de atividade
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição de Intenção */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Distribuição de Intenção
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Classificação da IA por intenção de compra
            </p>
          </CardHeader>
          <CardContent>
            {intentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={intentChartData}
                    dataKey="total"
                    nameKey="intencao"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(props: { name?: string; percent?: number }) =>
                      `${props.name || ''}: ${((props.percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {intentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} leads`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-gray-500 dark:text-gray-400">
                Sem dados de intenção
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 3: Lista de Oportunidades (Tabela Principal) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Lista de Oportunidades
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ordenado por: necessidade de atenção → intenção identificada → mais recentes
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Nome</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">WhatsApp</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Veículo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Intenção</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Última Interação</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {leadList.map((lead) => {
                  const rowClasses = [
                    'border-b cursor-pointer transition-colors',
                    lead.precisa_atencao
                      ? 'bg-red-50/50 dark:bg-red-900/10 border-l-4 border-l-red-500 hover:bg-red-100/70 dark:hover:bg-red-900/20'
                      : lead.intencao
                        ? 'bg-blue-50/30 dark:bg-blue-900/5 hover:bg-blue-100/50 dark:hover:bg-blue-900/10'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                  ].filter(Boolean).join(' ');

                  return (
                    <tr
                      key={lead.id}
                      className={rowClasses}
                      onClick={() => handleLeadClick(lead.session_id, lead.nome)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {lead.precisa_atencao && (
                            <span title="Precisa de atenção" className="text-red-500">🚨</span>
                          )}
                          {lead.nome}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{lead.whatsapp}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{lead.veiculo || '—'}</td>
                      <td className="px-4 py-3">
                        {lead.intencao ? (
                          <Badge className={getIntentBadgeClass(lead.intencao)}>
                            {lead.intencao}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {lead.ultima_interacao
                          ? formatDistanceToNow(new Date(lead.ultima_interacao), { addSuffix: true, locale: ptBR })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {lead.precisa_atencao ? (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                            ⚠️ Atenção
                          </Badge>
                        ) : lead.intencao ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                            Qualificado
                          </Badge>
                        ) : (
                          <span className="text-gray-400">Aguardando</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {leadList.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              Nenhum lead na carteira de recuperação.
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEÇÃO 4: Governança e Saúde Técnica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            Governança e Qualidade
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Fila de envio, taxa de intervenção humana e últimos erros.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Alertas visuais */}
          {(hasQueueWarning || hasInterventionAlert) && (
            <div className="flex flex-wrap gap-3">
              {hasQueueWarning && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 px-4 py-2 text-amber-800 dark:text-amber-200">
                  <Inbox className="h-5 w-5" />
                  <span className="font-medium">⚠️ Sistema Lento: {filaPendente} mensagens na fila</span>
                </div>
              )}
              {hasInterventionAlert && (
                <div className="flex items-center gap-2 rounded-lg bg-red-100 dark:bg-red-900/30 px-4 py-2 text-red-800 dark:text-red-200">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">🚨 IA Falhando: Taxa de intervenção {taxaIntervencao.toFixed(1)}%</span>
                </div>
              )}
            </div>
          )}

          {/* Cards de métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card Fila */}
            <div className={`rounded-lg border p-4 ${
              hasQueueWarning
                ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10'
                : 'border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                <Inbox className={`h-4 w-4 ${hasQueueWarning ? 'text-amber-600' : ''}`} />
                Fila Pendente
              </div>
              <p className={`mt-2 text-2xl font-semibold ${
                hasQueueWarning
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {filaPendente}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">mensagens aguardando envio</p>
            </div>

            {/* Card Taxa de Intervenção */}
            <div className={`rounded-lg border p-4 ${
              hasInterventionAlert
                ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
                : 'border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                <MessageSquare className={`h-4 w-4 ${hasInterventionAlert ? 'text-red-600' : ''}`} />
                Taxa de Intervenção
              </div>
              <p className={`mt-2 text-2xl font-semibold ${
                hasInterventionAlert
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {taxaIntervencao.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">leads que precisaram de humano</p>
            </div>

            {/* Card Erros */}
            <div className={`rounded-lg border p-4 ${
              (governanceData?.ultimos_erros?.length ?? 0) > 0
                ? 'border-amber-200 dark:border-amber-800'
                : 'border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                <AlertTriangle className={`h-4 w-4 ${(governanceData?.ultimos_erros?.length ?? 0) > 0 ? 'text-amber-600' : ''}`} />
                Erros Recentes
              </div>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {governanceData?.ultimos_erros?.length ?? 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">falhas de IA para revisar</p>
            </div>
          </div>

          {/* Lista de erros */}
          {governanceData?.ultimos_erros && governanceData.ultimos_erros.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Onde a IA errou recentemente
              </h4>
              <ul className="space-y-2">
                {governanceData.ultimos_erros.slice(0, 5).map((item) => (
                  <li
                    key={item.id}
                    className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-3 text-sm text-amber-900 dark:text-amber-200"
                  >
                    <div className="font-medium">{item.message_ai || 'Erro não identificado'}</div>
                    <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      {(() => {
                        try {
                          const parsedDate = new Date(item.created_at);
                          if (!isNaN(parsedDate.getTime())) {
                            return format(parsedDate, "dd/MM/yyyy HH:mm", { locale: ptBR });
                          }
                          return item.created_at;
                        } catch {
                          return item.created_at;
                        }
                      })()}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BrainDrawer */}
      <BrainDrawer
        isOpen={isBrainDrawerOpen}
        onClose={() => setIsBrainDrawerOpen(false)}
        leadId={selectedLeadId || ''}
        leadName={selectedLeadName}
        agentType="fernanda"
        chatMessages={brainData.chatMessages}
        chatSessions={brainData.chatSessions}
        internalReasoning={brainData.internalReasoning}
        memoryData={brainData.memoryData}
      />
    </div>
  );
}