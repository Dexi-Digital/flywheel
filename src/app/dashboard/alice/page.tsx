'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrainDrawer } from '@/components/shared';
import { useBrainDrawerData } from '@/hooks/use-brain-drawer-data';
import { fetchAliceDashboard } from '@/services/alice-api.service';
import { formatNumber } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import {
  MessageSquare,
  Users,
  Target,
  AlertTriangle,
  RefreshCw,
  Car,
  Calendar,
  ShieldAlert,
  Inbox,
} from 'lucide-react';
import type { FunnelData } from '@/types/database.types';
import type {
  AliceKpiFunnelResponse,
  AliceTimelineActivityResponse,
  AliceLeadListItem,
  AliceVehicleHeatmapResponse,
  AliceGovernanceAlertsResponse,
} from '@/types/alice-api.types';

export default function AlicePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [kpiFunnel, setKpiFunnel] = useState<AliceKpiFunnelResponse | null>(null);
  const [timelineActivity, setTimelineActivity] = useState<AliceTimelineActivityResponse | null>(null);
  const [leadList, setLeadList] = useState<AliceLeadListItem[]>([]);
  const [vehicleHeatmap, setVehicleHeatmap] = useState<AliceVehicleHeatmapResponse>([]);
  const [governanceAlerts, setGovernanceAlerts] = useState<AliceGovernanceAlertsResponse | null>(null);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLeadName, setSelectedLeadName] = useState('');
  const [isBrainDrawerOpen, setIsBrainDrawerOpen] = useState(false);

  // Paginação do heatmap de veículos
  const [vehicleLimit, setVehicleLimit] = useState(15);
  const [leadLimit, setLeadLimit] = useState(10);

  const { data: brainData, fetchBrainData } = useBrainDrawerData({
    agentId: 'alice',
    leadId: selectedLeadId || '',
  });

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchAliceDashboard();
      setKpiFunnel(data.kpiFunnel);
      setTimelineActivity(data.timelineActivity);
      setLeadList(data.leadList);
      setVehicleHeatmap(data.vehicleHeatmap);
      setGovernanceAlerts(data.governanceAlerts);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-gray-500 dark:text-gray-400">Carregando dashboard Alice...</p>
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

  // Funil: Total Base → Válidos → Contatados → Engajados (Responderam)
  const funnelData: FunnelData[] = kpiFunnel
    ? [
      { stage: 'Total Base', value: kpiFunnel.total_base, fill: '#94a3b8' },
      { stage: 'Contatados', value: kpiFunnel.contatados, fill: '#3b82f6' },
      { stage: 'Engajados (Responderam)', value: kpiFunnel.engajados, fill: '#10b981' },
    ]
    : [];
  const maxFunnelValue = funnelData.length ? Math.max(...funnelData.map((d) => d.value), 1) : 1;

  // Timeline: merge passado + futuro por data para o gráfico combinado
  const timelineMerged: { date: string; label: string; disparos: number; previsao: number }[] = [];
  const dateSet = new Set<string>();
  timelineActivity?.passado?.forEach((p) => dateSet.add(p.date));
  timelineActivity?.futuro?.forEach((f) => dateSet.add(f.date));
  const sortedDates = Array.from(dateSet).sort();
  sortedDates.forEach((date) => {
    const passadoItem = timelineActivity?.passado?.find((p) => p.date === date);
    const futuroItem = timelineActivity?.futuro?.find((f) => f.date === date);

    // Validar se a data é válida antes de formatar
    let label = date;
    try {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        label = format(parsedDate, 'dd/MM', { locale: ptBR });
      }
    } catch {
      // Se falhar, usa a string original
      console.warn('[Alice Timeline] Data inválida:', date);
    }

    timelineMerged.push({
      date,
      label,
      disparos: passadoItem?.count ?? 0,
      previsao: futuroItem?.count ?? 0,
    });
  });

  const taxaIntervencao =
    governanceAlerts && governanceAlerts.total_contatados > 0
      ? (governanceAlerts.total_intervencoes / governanceAlerts.total_contatados) * 100
      : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📞 Alice — BDR Outbound</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Funil de conversão, disparos e follow-ups. Prioridade: quem respondeu e recência.
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

      {/* 1. Funil de Conversão (KPI Funnel) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Funil de Conversão
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Base → Contatados → Engajados (Responderam)
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelData.map((item, index) => {
              const widthPercentage = (item.value / maxFunnelValue) * 100;
              const conversionRate =
                index > 0 && funnelData[index - 1].value > 0
                  ? ((item.value / funnelData[index - 1].value) * 100).toFixed(1)
                  : '100';
              return (
                <div key={item.stage}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{item.stage}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 dark:text-gray-400">{formatNumber(item.value)}</span>
                      {index > 0 && (
                        <span className="text-xs text-gray-400">({conversionRate}%)</span>
                      )}
                    </div>
                  </div>
                  <div className="relative h-8 w-full overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
                    <div
                      className="absolute inset-y-0 left-0 rounded transition-all duration-500"
                      style={{ width: `${widthPercentage}%`, backgroundColor: item.fill || '#0f62fe' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {funnelData.length >= 2 && funnelData[0].value > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Taxa Base → Engajados</span>
              <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                {((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Timeline: Disparos (passado) + Previsão (futuro) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Atividade — Disparos e Previsão
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Barras sólidas: contatos realizados.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h4 className="text-sm font-medium text-gray-500 mb-4">Histórico de Disparos (Realizado)</h4>
              {timelineMerged.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={timelineMerged} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
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
                      labelFormatter={(_, payload) => {
                        const dateStr = payload?.[0]?.payload?.date;
                        if (!dateStr) return '';
                        try {
                          const parsedDate = new Date(dateStr);
                          if (!isNaN(parsedDate.getTime())) {
                            return format(parsedDate, "dd/MM/yyyy", { locale: ptBR });
                          }
                          return dateStr;
                        } catch {
                          return dateStr;
                        }
                      }}
                      formatter={(value, name) => [
                        formatNumber(Number(value) || 0),
                        name === 'disparos' ? 'Disparos (realizado)' : 'Previsão',
                      ]}
                    />
                    <Legend />
                    <ReferenceLine x={format(new Date(), 'dd/MM', { locale: ptBR })} stroke="#94a3b8" strokeDasharray="3 3" />
                    <Bar dataKey="disparos" name="Disparos (realizado)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
                  Sem dados de disparos
                </div>
              )}
            </div>

            {/* KPI CARD: PREVISÃO FOLLOW-UPS (Extraído do gráfico) */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Previsão de Follow-ups</h3>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-black text-amber-500 block">
                  {(timelineActivity?.futuro?.reduce((acc, item) => acc + item.count, 0) || 0).toLocaleString('pt-BR')}
                </span>
                <span className="text-sm text-gray-500">agendados para os próximos dias</span>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold text-gray-400 tracking-wider">Próximos Picos</h4>
                {timelineActivity?.futuro?.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 pb-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {(() => {
                        try {
                          if (!item.date) return 'Data não disponível';
                          return format(new Date(item.date), "dd/MM (EEEE)", { locale: ptBR });
                        }
                        catch { return item.date || 'Data inválida'; }
                      })()}
                    </span>
                    <Badge variant="warning" className="bg-amber-50 text-amber-700 border-amber-200">
                      {item.count} leads
                    </Badge>
                  </div>
                ))}
                {(!timelineActivity?.futuro || timelineActivity.futuro.length === 0) && (
                  <p className="text-sm text-gray-400 italic">Sem agendamentos futuros.</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Lista principal de leads (matadora) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Lista Principal — Prioridade: Engajados e Recência
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ordenação: quem respondeu no topo
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            última resposta (mais recente)
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            lead mais novo.
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
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Última resposta</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Próximo contato</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Status IA</th>
                </tr>
              </thead>
              <tbody>
                {leadList.slice(0, leadLimit).map((lead) => {
                  // Lógica visual: destacar leads engajados (que responderam)
                  const isEngajado = lead.ultima_resposta !== null;
                  const precisaIntervencao = lead.precisa_intervencao;

                  // Classes dinâmicas baseadas no status do lead
                  const rowClasses = [
                    'border-b cursor-pointer transition-colors',
                    // Destaque para leads engajados (responderam)
                    isEngajado
                      ? 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100/70 dark:hover:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                    // Borda de alerta para intervenção
                    precisaIntervencao ? 'border-l-4 border-l-amber-500' : '',
                  ].filter(Boolean).join(' ');

                  return (
                    <tr
                      key={lead.sessionId}
                      className={rowClasses}
                      onClick={() => handleLeadClick(lead.sessionId, lead.nome)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {/* Ícone de engajamento para leads que responderam */}
                          {isEngajado && (
                            <span title="Lead respondeu" className="text-blue-500">💬</span>
                          )}
                          {lead.nome}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{lead.whatsapp}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{lead.veiculo_interesse || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {lead.ultima_resposta
                          ? formatDistanceToNow(new Date(lead.ultima_resposta), { addSuffix: true, locale: ptBR })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {lead.data_proximo_contato
                          ? format(new Date(lead.data_proximo_contato), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {precisaIntervencao ? (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                            ⚠️ Intervenção
                          </Badge>
                        ) : isEngajado ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                            Engajado
                          </Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {leadList.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">Nenhum lead contatado na base.</div>
          )}
          {leadList.length > leadLimit && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setLeadLimit((prev) => prev + 15)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Carregar mais ({leadList.length - leadLimit} restantes)
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Heatmap por veículo (interesse) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-orange-600" />
            Taxa de Resposta por Veículo
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total de leads vs. quem respondeu. Taxa = respostas / total. Ordenado por maior taxa.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Veículo</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Total leads</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Respostas</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Taxa</th>
                </tr>
              </thead>
              <tbody>
                {vehicleHeatmap.slice(0, vehicleLimit).map((row) => {
                  const taxa = row.total_leads > 0 ? (row.total_respostas / row.total_leads) * 100 : 0;
                  return (
                    <tr key={row.veiculo_interesse} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.veiculo_interesse}</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                        {formatNumber(row.total_leads)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                        {formatNumber(row.total_respostas)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            taxa >= 15
                              ? 'font-semibold text-green-600 dark:text-green-400'
                              : taxa >= 5
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-gray-600 dark:text-gray-400'
                          }
                        >
                          {taxa.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {vehicleHeatmap.length === 0 && (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">Sem dados de veículos.</div>
          )}
          {vehicleHeatmap.length > vehicleLimit && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setVehicleLimit((prev) => prev + 15)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Carregar mais ({vehicleHeatmap.length - vehicleLimit} restantes)
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Governança e alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            Governança e Qualidade
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Fila de envio, taxa de intervenção humana e últimos erros (curadoria).
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Alertas visuais baseados nas regras de negócio */}
          {(() => {
            const bufferQueue = governanceAlerts?.buffer_represado ?? 0;
            const isTaxaCritica = taxaIntervencao > 10;
            const hasGargalo = bufferQueue > 0;

            if (hasGargalo || isTaxaCritica) {
              return (
                <div className="flex flex-wrap gap-3">
                  {hasGargalo && (
                    <div className="flex items-center gap-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 px-4 py-2 text-amber-800 dark:text-amber-200">
                      <Inbox className="h-5 w-5" />
                      <span className="font-medium">⚠️ Gargalo de Envio: {bufferQueue} mensagens na fila</span>
                    </div>
                  )}
                  {isTaxaCritica && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-100 dark:bg-red-900/30 px-4 py-2 text-red-800 dark:text-red-200">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">🚨 Status Crítico: Taxa de intervenção {taxaIntervencao.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card Fila - com destaque se > 0 */}
            <div className={`rounded-lg border p-4 ${(governanceAlerts?.buffer_represado ?? 0) > 0
              ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10'
              : 'border-gray-200 dark:border-gray-700'
              }`}>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                <Inbox className={`h-4 w-4 ${(governanceAlerts?.buffer_represado ?? 0) > 0 ? 'text-amber-600' : ''}`} />
                Fila represada (buffer_message_bdr)
              </div>
              <p className={`mt-2 text-2xl font-semibold ${(governanceAlerts?.buffer_represado ?? 0) > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-gray-900 dark:text-white'
                }`}>
                {governanceAlerts?.buffer_represado ?? 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">mensagens na fila</p>
            </div>

            {/* Card Taxa de Intervenção - com destaque se > 10% */}
            <div className={`rounded-lg border p-4 ${taxaIntervencao > 10
              ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
              : 'border-gray-200 dark:border-gray-700'
              }`}>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                <MessageSquare className={`h-4 w-4 ${taxaIntervencao > 10 ? 'text-red-600' : ''}`} />
                Taxa de intervenção
              </div>
              <p className={`mt-2 text-2xl font-semibold ${taxaIntervencao > 10
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-900 dark:text-white'
                }`}>
                {taxaIntervencao.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {governanceAlerts?.total_intervencoes ?? 0} sessões / {governanceAlerts?.total_contatados ?? 0} contatados
              </p>
            </div>

            {/* Card Erros */}
            <div className={`rounded-lg border p-4 ${(governanceAlerts?.ultimos_erros?.length ?? 0) > 0
              ? 'border-amber-200 dark:border-amber-800'
              : 'border-gray-200 dark:border-gray-700'
              }`}>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                <AlertTriangle className={`h-4 w-4 ${(governanceAlerts?.ultimos_erros?.length ?? 0) > 0 ? 'text-amber-600' : ''}`} />
                Últimos erros (curadoria)
              </div>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {governanceAlerts?.ultimos_erros?.length ?? 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">registros listados abaixo</p>
            </div>
          </div>
          {governanceAlerts?.ultimos_erros && governanceAlerts.ultimos_erros.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Onde a IA errou recentemente</h4>
              <ul className="space-y-2">
                {governanceAlerts.ultimos_erros.slice(0, 5).map((item, idx) => (
                  <li
                    key={idx}
                    className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-3 text-sm text-amber-900 dark:text-amber-200"
                  >
                    <div className="font-medium">{item.curadoria}</div>
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

      <BrainDrawer
        isOpen={isBrainDrawerOpen}
        onClose={() => setIsBrainDrawerOpen(false)}
        leadId={selectedLeadId || ''}
        leadName={selectedLeadName}
        agentType="alice"
        chatMessages={brainData.chatMessages}
        chatSessions={brainData.chatSessions}
        internalReasoning={brainData.internalReasoning}
        memoryData={brainData.memoryData}
      />
    </div>
  );
}
