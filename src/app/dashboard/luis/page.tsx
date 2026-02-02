'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrainDrawer } from '@/components/shared';
import { useBrainDrawerData } from '@/hooks/use-brain-drawer-data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Moon,
  CarFront,
  Signal,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Users,
  Zap,
  Clock,
  Phone,
  User,
  Wifi,
  WifiOff,
  AlertOctagon,
} from 'lucide-react';

// Serviços RPC do Luís
import {
  getLuisKpiPulse,
  getLuisQualificationList,
  getLuisTrafficHeatmap,
  getLuisVehicleInterest,
  getLuisGovernance,
} from '@/services/luis.service';

// Tipos da API Luís
import type {
  LuisKpiPulse,
  LuisQualificationLead,
  LuisTrafficData,
  LuisVehicleStat,
  LuisGovernanceData,
} from '@/types/luis-api.types';

// Thresholds de governança
const GOVERNANCE_THRESHOLDS = {
  QUEUE_WARNING: 20,
  QUEUE_CRITICAL: 50,
} as const;

// Cores para o gráfico de pizza de veículos
const VEHICLE_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e',
];

// Helper para verificar se é horário do plantão (19h-08h)
const isNightShiftHour = (hour: number): boolean => hour >= 19 || hour < 8;

export default function LuisPage() {
  // Estados granulares para cada seção
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Estados dos dados reais via RPC
  const [kpiPulse, setKpiPulse] = useState<LuisKpiPulse | null>(null);
  const [qualificationList, setQualificationList] = useState<LuisQualificationLead[]>([]);
  const [trafficData, setTrafficData] = useState<LuisTrafficData[]>([]);
  const [vehicleStats, setVehicleStats] = useState<LuisVehicleStat[]>([]);
  const [governanceData, setGovernanceData] = useState<LuisGovernanceData | null>(null);

  // Estados do BrainDrawer
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLeadName, setSelectedLeadName] = useState('');
  const [isBrainDrawerOpen, setIsBrainDrawerOpen] = useState(false);

  const { data: brainData, fetchBrainData } = useBrainDrawerData({
    agentId: 'luis',
    leadId: selectedLeadId || '',
  });

  // Carrega todos os dados do dashboard em paralelo
  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const [pulse, qualification, traffic, vehicles, governance] = await Promise.all([
        getLuisKpiPulse(),
        getLuisQualificationList(),
        getLuisTrafficHeatmap(),
        getLuisVehicleInterest(),
        getLuisGovernance(),
      ]);
      setKpiPulse(pulse);
      setQualificationList(qualification || []);
      setTrafficData(traffic || []);
      setVehicleStats(vehicles || []);
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

  const handleLeadClick = (nome: string, whatsapp: string) => {
    // Usa o whatsapp como ID único do lead
    setSelectedLeadId(whatsapp);
    setSelectedLeadName(nome);
    setIsBrainDrawerOpen(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-gray-500 dark:text-gray-400">Carregando dashboard Luís...</p>
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
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
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

  // Cálculos derivados de governança
  const filaEnvio = governanceData?.fila_envio ?? 0;
  const leadsSemAtendimento = governanceData?.leads_sem_atendimento ?? 0;
  const statusWhatsapp = governanceData?.status_whatsapp ?? 'unknown';
  const isWhatsappConnected = statusWhatsapp === 'connected';
  const hasQueueWarning = filaEnvio > GOVERNANCE_THRESHOLDS.QUEUE_WARNING;
  const hasQueueCritical = filaEnvio > GOVERNANCE_THRESHOLDS.QUEUE_CRITICAL;
  const hasLeadsLost = leadsSemAtendimento > 0;

  // Contadores para métricas
  const leadsQueQuereHumano = qualificationList.filter(l => l.solicitou_humano).length;

  // Formata hora para exibição no gráfico
  const formatHour = (hora: number) => `${hora.toString().padStart(2, '0')}h`;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            <Moon className="inline-block h-8 w-8 mr-2 text-indigo-600" />
            Luís — SDR Plantão 24/7
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Captura de leads, atendimento noturno e qualificação automática
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

      {/* SEÇÃO 1: KPIs de Plantão */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads Hoje */}
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Leads Hoje</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {kpiPulse?.total_leads_hoje?.toLocaleString('pt-BR') ?? 0}
              </p>
            </div>
            <Users className="h-10 w-10 text-blue-500 opacity-50" />
          </div>
        </Card>

        {/* Atendimentos IA */}
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Atendimentos IA</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {kpiPulse?.atendimentos_ia?.toLocaleString('pt-BR') ?? 0}
              </p>
            </div>
            <MessageSquare className="h-10 w-10 text-green-500 opacity-50" />
          </div>
        </Card>

        {/* 🌙 DESTAQUE: Leads Fora de Horário - KPI Principal do Luís */}
        <Card className="p-4 border-l-4 border-l-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                <Moon className="h-4 w-4" />
                Leads Fora de Horário
              </p>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {kpiPulse?.leads_fora_horario?.toLocaleString('pt-BR') ?? 0}
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                🌙 Plantão IA - Salvos pela automação
              </p>
            </div>
            <div className="relative">
              <Moon className="h-12 w-12 text-indigo-500" />
              <Zap className="h-5 w-5 text-yellow-500 absolute -bottom-1 -right-1" />
            </div>
          </div>
        </Card>

        {/* Taxa de Engajamento */}
        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taxa de Engajamento</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {(kpiPulse?.taxa_engajamento ?? 0).toFixed(1)}%
              </p>
              {kpiPulse && (
                <p className={`text-xs ${(kpiPulse.taxa_engajamento ?? 0) >= 80 ? 'text-green-600' : (kpiPulse.taxa_engajamento ?? 0) >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {(kpiPulse.taxa_engajamento ?? 0) >= 80 ? '✅ Excelente' : (kpiPulse.taxa_engajamento ?? 0) >= 50 ? '⚠️ Atenção' : '🚨 Crítico'}
                </p>
              )}
            </div>
            <Signal className="h-10 w-10 text-amber-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* SEÇÃO 2: Inteligência de Tráfego (Split View) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Esquerda: Horários de Pico (BarChart) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-indigo-600" />
              Distribuição de Tráfego por Hora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trafficData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="hora"
                    tickFormatter={formatHour}
                    tick={{ fontSize: 10 }}
                    interval={2}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => [`${value} leads`, 'Volume']}
                    labelFormatter={(hora) => `${formatHour(Number(hora))} ${isNightShiftHour(Number(hora)) ? '🌙 Plantão' : '☀️ Comercial'}`}
                  />
                  <Bar
                    dataKey="volume"
                    radius={[4, 4, 0, 0]}
                  >
                    {trafficData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={isNightShiftHour(entry.hora) ? '#6366f1' : '#94a3b8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-indigo-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Plantão Luís (19h-08h)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-slate-400"></div>
                <span className="text-gray-600 dark:text-gray-400">Horário Comercial</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Direita: Veículos Mais Buscados (PieChart) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CarFront className="h-5 w-5 text-purple-600" />
              Top 10 Veículos Mais Procurados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehicleStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="total"
                    nameKey="veiculo"
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  >
                    {vehicleStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={VEHICLE_COLORS[index % VEHICLE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} interessados`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 3: Lista de Qualificação (Tabela Handover) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-blue-600" />
              Leads Qualificados - Handover para SDR
            </span>
            {leadsQueQuereHumano > 0 && (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 animate-pulse">
                {leadsQueQuereHumano} solicitaram agente
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {qualificationList.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
              <p>Nenhum lead pendente de qualificação</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">Nome</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">WhatsApp</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">Veículo</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">Entrada</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">Resumo IA</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {qualificationList.map((lead, index) => (
                    <tr
                      key={`${lead.whatsapp}-${index}`}
                      onClick={() => handleLeadClick(lead.nome, lead.whatsapp)}
                      className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        lead.solicitou_humano ? 'bg-amber-50 dark:bg-amber-900/10' : ''
                      }`}
                    >
                      <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">
                        {lead.nome}
                      </td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400">
                        <a
                          href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-green-600 hover:text-green-700"
                        >
                          <Phone className="h-3 w-3" />
                          {lead.whatsapp}
                        </a>
                      </td>
                      <td className="py-3 px-2">
                        {lead.interesse_veiculo ? (
                          <Badge variant="default" className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {lead.interesse_veiculo}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">Não especificado</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400 text-xs">
                        {(() => {
                          try {
                            const date = new Date(lead.horario_entrada);
                            return format(date, "dd/MM HH:mm", { locale: ptBR });
                          } catch {
                            return lead.horario_entrada;
                          }
                        })()}
                      </td>
                      <td className="py-3 px-2 max-w-[200px]">
                        {lead.resumo_ia ? (
                          <span
                            className="text-xs text-gray-600 dark:text-gray-400 truncate block"
                            title={lead.resumo_ia}
                          >
                            {lead.resumo_ia.length > 60
                              ? `${lead.resumo_ia.substring(0, 60)}...`
                              : lead.resumo_ia}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {lead.solicitou_humano ? (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 text-xs">
                            Solicitou Agente
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            Qualificado
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEÇÃO 4: Infraestrutura e Governança */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status WhatsApp */}
        <Card className={`p-4 ${isWhatsappConnected ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/10'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status WhatsApp</p>
              <p className={`text-xl font-bold ${isWhatsappConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isWhatsappConnected ? 'Conectado' : 'Desconectado'}
              </p>
              {!isWhatsappConnected && (
                <p className="text-xs text-red-600 mt-1">🚨 Sistema OFFLINE!</p>
              )}
            </div>
            {isWhatsappConnected ? (
              <Wifi className="h-10 w-10 text-green-500" />
            ) : (
              <WifiOff className="h-10 w-10 text-red-500 animate-pulse" />
            )}
          </div>
        </Card>

        {/* Fila de Envio */}
        <Card className={`p-4 ${hasQueueCritical ? 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/10' : hasQueueWarning ? 'border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'border-l-4 border-l-gray-300'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fila de Envio</p>
              <p className={`text-xl font-bold ${hasQueueCritical ? 'text-red-600' : hasQueueWarning ? 'text-amber-600' : 'text-gray-900 dark:text-white'}`}>
                {filaEnvio} mensagens
              </p>
              {hasQueueCritical && <p className="text-xs text-red-600 mt-1">🚨 Sistema sobrecarregado</p>}
              {hasQueueWarning && !hasQueueCritical && <p className="text-xs text-amber-600 mt-1">⚠️ Lentidão detectada</p>}
            </div>
            <MessageSquare className={`h-10 w-10 ${hasQueueCritical ? 'text-red-500' : hasQueueWarning ? 'text-amber-500' : 'text-gray-400'}`} />
          </div>
        </Card>

        {/* Leads sem Atendimento - CRÍTICO */}
        <Card className={`p-4 ${hasLeadsLost ? 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/10' : 'border-l-4 border-l-green-500'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Leads sem Atendimento</p>
              <p className={`text-xl font-bold ${hasLeadsLost ? 'text-red-600 animate-pulse' : 'text-green-600'}`}>
                {leadsSemAtendimento}
              </p>
              {hasLeadsLost ? (
                <p className="text-xs text-red-600 mt-1">🚨 Potencial perda de vendas!</p>
              ) : (
                <p className="text-xs text-green-600 mt-1">✅ Todos atendidos</p>
              )}
            </div>
            {hasLeadsLost ? (
              <AlertOctagon className="h-10 w-10 text-red-500 animate-pulse" />
            ) : (
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            )}
          </div>
        </Card>
      </div>

      {/* Brain Drawer */}
      <BrainDrawer
        isOpen={isBrainDrawerOpen}
        onClose={() => setIsBrainDrawerOpen(false)}
        leadId={selectedLeadId || ''}
        leadName={selectedLeadName}
        agentType="luis"
        chatMessages={brainData.chatMessages}
        chatSessions={brainData.chatSessions}
        memoryData={brainData.memoryData}
      />
    </div>
  );
}
