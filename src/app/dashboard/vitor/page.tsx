'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VictorKanban } from '@/components/kanban/victor-kanban';
import { buildService } from '@/services/factory';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, Users, Clock, MessageSquare, Send, UserPlus, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Agent } from '@/types/database.types';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  fetchKanbanData,
  getEmptyKanbanResponse,
  type KanbanApiResponse
} from '@/services/kanban-api.service';

export default function VictorPage() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [kanbanData, setKanbanData] = useState<KanbanApiResponse>(getEmptyKanbanResponse());
  const [kanbanLoadFailed, setKanbanLoadFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAgentData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setKanbanLoadFailed(false);

    const [agentResult, kanbanResult] = await Promise.allSettled([
      buildService('agent-vitor').getAgent('agent-vitor'),
      fetchKanbanData(),
    ]);

    const agentData = agentResult.status === 'fulfilled' ? agentResult.value : null;
    const kanban = kanbanResult.status === 'fulfilled' ? kanbanResult.value : getEmptyKanbanResponse();

    // Mesclar dados de "Em Negociação" do agente (tgv_parcela RENEGOCIADO) com o Kanban
    if (agentData?.metricas_agregadas) {
      const metrics = agentData.metricas_agregadas as any;
      const clientesEmNegociacao = Number(metrics.clientes_em_negociacao) || 0;
      const valorEmNegociacao = Number(metrics.valor_total_em_negociacao) || 0;
      const listaClientes = metrics.clientes_em_negociacao_lista || [];

      // Sobrescrever "Em Negociação" com dados de tgv_parcela RENEGOCIADO
      kanban.meta['Em Negociacao'] = {
        count: clientesEmNegociacao,
        total_recuperado: valorEmNegociacao,
      };

      // Popular a lista de clientes para o Kanban visual
      kanban.kanban['Em Negociacao'] = listaClientes.map((c: { id_cliente: string; nome_cliente: string | null; valor_total: number }) => ({
        id_cliente: c.id_cliente,
        nome_cliente: c.nome_cliente,
        valor_recuperado: c.valor_total,
      }));

      console.log('[Vitor] Em Negociação atualizado com dados de tgv_parcela RENEGOCIADO:',
        clientesEmNegociacao, 'clientes, R$', valorEmNegociacao, '| Cards:', listaClientes.length);
    }

    setAgent(agentData);
    setKanbanData(kanban);
    setKanbanLoadFailed(kanbanResult.status === 'rejected');

    if (agentResult.status === 'rejected') {
      console.warn('❌ Falha ao carregar dados do agente:', agentResult.reason);
    }
    if (kanbanResult.status === 'rejected') {
      console.warn('❌ Falha ao carregar Kanban:', kanbanResult.reason);
    }

    // Erro de tela cheia só quando as duas fontes falharem
    if (agentResult.status === 'rejected' && kanbanResult.status === 'rejected') {
      const msg = agentResult.reason instanceof Error ? agentResult.reason.message : 'Erro ao carregar dados do agente';
      setError(msg);
    }

    setLoading(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const kanban = await fetchKanbanData(true);
      setKanbanData(kanban);
      setKanbanLoadFailed(false);
    } catch (err) {
      console.error('❌ Erro ao atualizar Kanban:', err);
      setKanbanLoadFailed(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAgentData();
  }, [loadAgentData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Carregando dados do Vitor...</p>
      </div>
    );
  }

  // Tela de erro só quando as duas fontes falharam
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
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">{error}</p>
              <button
                onClick={loadAgentData}
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

  const metrics = agent?.metricas_agregadas || {};

  // Extrair métricas do Kanban (fonte única de verdade para Recuperado)
  const receitaRecuperadaTotal = kanbanData.meta['Recuperado']?.total_recuperado || 0;
  const clientesRecuperadosKanban = kanbanData.meta['Recuperado']?.count || 0;
  const clientesRecuperados = Number(metrics.clientes_recuperados) || 0;
  const tempoMedioHorasRaw = Number(metrics.tempo_medio_horas) || 0;
  const tempoMedioMinutos = Number(metrics.tempo_medio_minutos) || 0;
  const receitaPorDia = metrics.receita_recuperada_por_dia || [];
  const clientesEmNegociacao = Number(metrics.clientes_em_negociacao) || 0;
  const clientesEmAberto = Number(metrics.clientes_em_aberto) || 0;
  const taxaSucesso = Number(metrics.taxa_sucesso) || 0;

  const tempoMedioHoras = (tempoMedioHorasRaw > 0 && tempoMedioHorasRaw <= 720) ? tempoMedioHorasRaw : 0;
  const tempoMedioValido = tempoMedioHoras > 0 || tempoMedioMinutos > 0;

  const funnelData = [
    { stage: 'Em Aberto', value: clientesEmAberto, fill: '#9ca3af' },
    { stage: 'Em Negociação', value: clientesEmNegociacao, fill: '#eab308' },
    { stage: 'Recuperado', value: clientesRecuperadosKanban, fill: '#10b981' },
  ];

  const chartData = Array.isArray(receitaPorDia) ? receitaPorDia.map((d: any) => ({
    date: format(new Date(d.dia), 'dd/MM'),
    receita: Number(d.receita_dia) || 0,
  })) : [];

  const maxFunnelValue = funnelData.length ? Math.max(...funnelData.map(d => d.value), 1) : 1;

  // Determinar cor do tempo médio
  const getTempoMedioColor = (horas: number) => {
    if (horas < 48) return 'text-green-600';
    if (horas < 96) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTempoMedio = (horas: number, minutos?: number) => {
    if (minutos != null && minutos > 0 && minutos < 60) return `${minutos} min`;
    if (horas >= 24) {
      const dias = Math.round(horas / 24);
      return `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
    }
    return `${Math.round(horas)}h`;
  };

  const events = agent?.events || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">💰 Vitor — TGV Recuperação de Receita</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gestão de cobrança e recuperação de inadimplência
        </p>
      </div>

      {!agent && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4 text-amber-800 dark:text-amber-200 text-sm">
          Dados do agente indisponíveis no momento. Exibindo apenas o Kanban.
        </div>
      )}

      {/* 1. SCORECARD - KPI Cards (só com agente) */}
      {agent && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-start justify-between p-6">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Receita Recuperada Total
              </p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(receitaRecuperadaTotal)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {clientesRecuperadosKanban} clientes recuperados
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/20">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between p-6">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Clientes Recuperados
              </p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                {clientesRecuperados}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Taxa de sucesso: {(taxaSucesso * 100).toFixed(1)}%
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between p-6">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Tempo Médio de Resolução
              </p>
              {tempoMedioValido ? (
                <>
                  <p className={`mt-2 text-3xl font-semibold ${getTempoMedioColor(tempoMedioHoras)}`}>
                    {formatTempoMedio(tempoMedioHoras, tempoMedioMinutos)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {tempoMedioHoras < 48 ? 'Excelente' : tempoMedioHoras < 96 ? 'Bom' : 'Atenção necessária'}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-2 text-3xl font-semibold text-gray-400">
                    N/A
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Dados insuficientes
                  </p>
                </>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>
      )}

      {/* 2. GRÁFICO DE EVOLUÇÃO + 3. FUNIL DE RECUPERAÇÃO (só com agente) */}
      {agent && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Evolução */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Receita Recuperada - Últimos 30 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [formatCurrency(Number(value)), 'Receita']}
                  />
                  <Line
                    type="monotone"
                    dataKey="receita"
                    name="Receita Diária"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                Sem dados de receita nos últimos 30 dias
              </div>
            )}
          </CardContent>
        </Card>

        {/* Funil de Recuperação */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline de Recuperação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelData.map((item, index) => {
                const widthPercentage = (item.value / maxFunnelValue) * 100;
                const conversionRate =
                  index > 0
                    ? ((item.value / funnelData[index - 1].value) * 100).toFixed(1)
                    : '100';

                return (
                  <div key={item.stage}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {item.stage}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 dark:text-gray-400">
                          {item.value}
                        </span>
                        {index > 0 && (
                          <span className="text-xs text-gray-400">
                            ({conversionRate}%)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative h-8 w-full overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
                      <div
                        className="absolute inset-y-0 left-0 rounded transition-all duration-500"
                        style={{
                          width: `${widthPercentage}%`,
                          backgroundColor: item.fill,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* 4. KANBAN BOARD */}
      <div className="mt-6">
        {kanbanLoadFailed && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4 flex items-center justify-between gap-4">
            <span className="text-amber-800 dark:text-amber-200 text-sm">
              Kanban indisponível (erro de autenticação ou rede). Os cards abaixo estão vazios.
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-800/40 rounded-md"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Tentar novamente
            </button>
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Fluxo de Trabalho</h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        {/* KPI Cards do Kanban */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {(['Em Aberto', 'Em Negociacao', 'Recuperado'] as const).map((stage) => {
            const stageMeta = kanbanData.meta[stage];
            const colors: Record<string, string> = {
              'Recuperado': 'text-green-600 bg-green-50 dark:bg-green-900/20',
              'Em Negociacao': 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
              'Em Aberto': 'text-gray-600 bg-gray-50 dark:bg-gray-800',
            };
            return (
              <Card key={stage} className={colors[stage]}>
                <div className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide opacity-75">
                    {stage === 'Em Negociacao' ? 'Em Negociação' : stage}
                  </p>
                  <p className="mt-1 text-2xl font-bold">{stageMeta.count}</p>
                  <p className="text-xs mt-1">{formatCurrency(stageMeta.total_recuperado)}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Kanban Visual */}
        <VictorKanban data={kanbanData} />
      </div>

      {/* 5. FEED DE ATIVIDADE RECENTE (só com agente) */}
      {agent && (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {events.slice(0, 10).map((event, idx) => {
                // Extrair tipo da atividade do metadata
                const meta = (event as any).metadata || {};
                const tipoAtividade = meta.tipo_atividade || 'lead';
                const conteudo = meta.conteudo;
                const metaInfo = meta.meta; // direção da mensagem ou status do disparo
                const leadId = event.lead_id;
                const eventDate = event.timestamp ? new Date(event.timestamp) : new Date();

                // Construir descrição baseada no tipo
                let eventContent = '';
                let eventIcon = <UserPlus className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />;
                let badgeColor = 'bg-green-100 text-green-700';

                if (tipoAtividade === 'mensagem') {
                  eventIcon = <MessageSquare className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />;
                  badgeColor = 'bg-blue-100 text-blue-700';
                  const direcao = metaInfo === 'entrada' ? '📥 Recebida' : '📤 Enviada';
                  eventContent = conteudo
                    ? `${direcao}: ${String(conteudo).substring(0, 80)}${String(conteudo).length > 80 ? '...' : ''}`
                    : `Mensagem ${direcao.toLowerCase()}`;
                } else if (tipoAtividade === 'disparo') {
                  eventIcon = <Send className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />;
                  badgeColor = 'bg-purple-100 text-purple-700';
                  const status = metaInfo === 'REALIZADO' ? '✅ Realizado' : '⏳ Pendente';
                  eventContent = `Disparo ${status} - Cliente ${leadId || 'N/A'}`;
                } else {
                  // lead
                  eventContent = conteudo
                    ? `Novo lead: ${conteudo}`
                    : `Lead cadastrado: ${leadId || 'N/A'}`;
                }

                return (
                  <div key={event.id || idx} className="flex items-start gap-3 p-3 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    {eventIcon}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${badgeColor}`}>
                          {tipoAtividade === 'mensagem' ? 'Mensagem' : tipoAtividade === 'disparo' ? 'Disparo' : 'Lead'}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {eventContent}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDistanceToNow(eventDate, { addSuffix: true, locale: ptBR })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Nenhuma atividade recente
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}
