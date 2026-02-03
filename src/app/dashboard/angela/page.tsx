'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrainDrawer } from '@/components/shared';
import { useBrainDrawerData } from '@/hooks/use-brain-drawer-data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  HeartHandshake,
  AlertOctagon,
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
  Flame,
  Brain,
  Server,
  MessageCircle,
  Building2,
  Calendar
} from 'lucide-react';

// Serviços RPC da Angela
import {
  getAngelaUrgentList,
  getAngelaGovernance,
} from '@/services/angela.service';

// Mapa de códigos de emoji para emojis reais
const EMOJI_MAP: Record<string, string> = {
  ':warning:': '⚠️',
  ':alarm_clock:': '⏰',
  ':bust_in_silhouette:': '👤',
  ':iphone:': '📱',
  ':round_pushpin:': '📍',
  ':oncoming_automobile:': '🚗',
  ':car:': '🚗',
  ':phone:': '📞',
  ':email:': '📧',
  ':calendar:': '📅',
  ':clock:': '🕐',
  ':check:': '✅',
  ':x:': '❌',
  ':star:': '⭐',
  ':fire:': '🔥',
  ':heart:': '❤️',
  ':thumbsup:': '👍',
  ':thumbsdown:': '👎',
  ':money:': '💰',
  ':dollar:': '💵',
  ':speech_balloon:': '💬',
  ':exclamation:': '❗',
  ':question:': '❓',
  ':bell:': '🔔',
  ':rotating_light:': '🚨',
  ':white_check_mark:': '✅',
  ':heavy_check_mark:': '✔️',
  ':red_circle:': '🔴',
  ':green_circle:': '🟢',
  ':yellow_circle:': '🟡',
  ':blue_circle:': '🔵',
};

/**
 * Converte códigos de emoji no formato :nome: para emojis reais
 */
function parseEmojis(text: string): string {
  if (!text) return text;
  let result = text;
  for (const [code, emoji] of Object.entries(EMOJI_MAP)) {
    result = result.replaceAll(code, emoji);
  }
  // Também trata &amp; -> &
  result = result.replaceAll('&amp;', '&');
  return result;
}

// Tipos da API Angela
import type {
  AngelaUrgentLead,
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

  const [urgentList, setUrgentList] = useState<AngelaUrgentLead[]>([]);
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
      const [urgent, governance] = await Promise.all([
        getAngelaUrgentList(),
        getAngelaGovernance(),
      ]);
      setUrgentList(urgent || []);
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

      {/* SEÇÃO PRINCIPAL: Lista de Incêndios (Urgent List) */}
      <Card className="border-red-100 dark:border-red-900/30 shadow-md">
        <CardHeader className="bg-red-50/50 dark:bg-red-900/10 pb-4 border-b border-red-50 dark:border-red-900/20">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <Flame className="h-6 w-6 text-red-600" />
              Lista de Incêndios (Prioridade Alta)
              {criticosCount > 0 && (
                <Badge variant="danger" className="ml-2 animate-pulse">
                  {criticosCount} crítico{criticosCount > 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                {urgentList.length} cliente{urgentList.length !== 1 ? 's' : ''} na fila de atenção
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {urgentList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider font-semibold border-b dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left">Cliente / Contato</th>
                    <th className="px-6 py-4 text-left">Loja</th>
                    <th className="px-6 py-4 text-left">Status / Sentimento</th>
                    <th className="px-6 py-4 text-left">Resumo / Contexto</th>
                    <th className="px-6 py-4 text-left">Última Interação</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {urgentList.map((lead) => {
                    const isNegativo = lead.sentimento?.toLowerCase().includes('negativo');
                    const isCritico = lead.precisa_verificacao;

                    // Destaque suave para linhas críticas
                    const rowClass = isCritico
                      ? 'bg-red-50/40 dark:bg-red-900/10 hover:bg-red-50/80 dark:hover:bg-red-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50';

                    return (
                      <tr
                        key={lead.id}
                        className={`transition-colors cursor-pointer ${rowClass}`}
                        onClick={() => handleLeadClick(lead.id, lead.nome)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              {lead.nome}
                              {isCritico && (
                                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                              )}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                              <MessageCircle className="h-3 w-3" />
                              {lead.whatsapp}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 opacity-50" />
                            {lead.loja || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {lead.sentimento ? (
                            <div className="flex flex-col gap-1 items-start">
                              <Badge variant={
                                isNegativo ? "danger" :
                                  lead.sentimento.toLowerCase().includes('positivo') ? "success" : "default"
                              }>
                                {lead.sentimento}
                              </Badge>
                              {isCritico && (
                                <Badge variant="warning" className="text-[10px] px-1.5 py-0 h-4 mt-1">
                                  Verificar Follow-up
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-[300px]">
                          <p className="line-clamp-2 text-xs leading-relaxed" title={lead.resumo || ''}>
                            {lead.resumo || 'Sem resumo disponível.'}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Calendar className="h-3.5 w-3.5 opacity-70" />
                            {(() => {
                              try {
                                return format(new Date(lead.data_interacao), "dd/MM HH:mm", { locale: ptBR });
                              } catch {
                                return '-';
                              }
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLeadClick(lead.id, lead.nome);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 dark:bg-pink-900/30 px-3 py-1 text-xs font-semibold text-pink-700 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors"
                          >
                            <Brain className="h-3.5 w-3.5" />
                            Analisar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-full mb-4">
                <HeartHandshake className="h-10 w-10 text-green-500" />
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">Nenhum incêndio no momento!</p>
              <p className="text-sm max-w-sm text-center mt-2">
                Todos os clientes prioritários foram atendidos ou estão satisfeitos. Acompanhe a governança abaixo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEÇÃO 2: Governança e Saúde Técnica */}
      <Card className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-lg">
            <ShieldAlert className="h-5 w-5" />
            Saúde Operacional (Governança)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Cards de Métricas */}
            <div className="space-y-4">
              {/* Fila Técnica */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${hasQueueCritical
                ? 'bg-red-50 border-red-200 dark:bg-red-900/10'
                : hasQueueWarning
                  ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10'
                  : 'bg-white border-slate-200 dark:bg-slate-800'
                }`}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Fila de Mensagens</p>
                  <p className={`text-2xl font-black ${hasQueueCritical ? 'text-red-600' : hasQueueWarning ? 'text-amber-600' : 'text-slate-700 dark:text-white'
                    }`}>
                    {filaTecnica}
                  </p>
                </div>
                <Server className={`h-8 w-8 opacity-20 ${hasQueueCritical ? 'text-red-600' : 'text-slate-600'
                  }`} />
              </div>

              {/* Perda de Contexto */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${hasContextLoss
                ? 'bg-red-50 border-red-200 dark:bg-red-900/10'
                : 'bg-white border-slate-200 dark:bg-slate-800'
                }`}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Perda de Contexto</p>
                  <p className={`text-2xl font-black ${hasContextLoss ? 'text-red-600' : 'text-slate-700 dark:text-white'}`}>
                    {perdaContexto}
                  </p>
                </div>
                <Brain className={`h-8 w-8 opacity-20 ${hasContextLoss ? 'text-red-600' : 'text-slate-600'}`} />
              </div>
            </div>

            {/* Log de Alertas */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Log de Alertas Recentes
                  <Badge variant="default" className="ml-2 font-normal bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200">
                    {governanceData?.ultimos_alertas?.length ?? 0}
                  </Badge>
                </h4>
              </div>

              {governanceData?.ultimos_alertas && governanceData.ultimos_alertas.length > 0 ? (
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {governanceData.ultimos_alertas.slice(0, 50).map((alerta, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 items-start p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700"
                    >
                      <div className="mt-0.5">
                        <AlertOctagon className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                          {parseEmojis(alerta.alerta)}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                          <span>
                            {(() => {
                              try {
                                return format(new Date(alerta.created_at), "dd 'de' MMM • HH:mm", { locale: ptBR });
                              } catch {
                                return alerta.created_at;
                              }
                            })()}
                          </span>
                          {alerta.sessionId && (
                            <span className="bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                              ID: {alerta.sessionId.slice(0, 8)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[180px] text-slate-400">
                  <ShieldAlert className="h-8 w-8 opacity-20 mb-2" />
                  <p className="text-sm">Sistema estável. Nenhum alerta recente.</p>
                </div>
              )}
            </div>

          </div>
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
