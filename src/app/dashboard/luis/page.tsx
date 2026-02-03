'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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
  ChevronRight,
} from 'lucide-react';

// Serviços e Tipos
import {
  getLuisKpiPulse,
  getLuisQualificationList,
  getLuisTrafficHeatmap,
  getLuisVehicleInterest,
  getLuisGovernance,
  getLuisMetrics,
  getCurrentUserLoja,
  getCurrentUserRole,
} from '@/services/luis.service';

import type {
  LuisKpiPulse,
  LuisQualificationLead,
  LuisTrafficData,
  LuisVehicleStat,
  LuisGovernanceData,
  LuisEngagementRate,
  LuisLeadsInAttendance,
  LuisLeadsOutsideBusinessHours,
  LuisTotalLeadsToday,
  LuisUserLoja,
  LuisUserRole,
} from '@/types/luis-api.types';

const GOVERNANCE_THRESHOLDS = { QUEUE_WARNING: 20, QUEUE_CRITICAL: 50 } as const;
const VEHICLE_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e'];
const isNightShiftHour = (hour: number): boolean => hour >= 19 || hour < 8;

export default function LuisPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Estados de Dados
  const [kpiPulse, setKpiPulse] = useState<LuisKpiPulse | null>(null);
  const [qualificationList, setQualificationList] = useState<LuisQualificationLead[]>([]);
  const [trafficData, setTrafficData] = useState<LuisTrafficData[]>([]);
  const [vehicleStats, setVehicleStats] = useState<LuisVehicleStat[]>([]);
  const [governanceData, setGovernanceData] = useState<LuisGovernanceData | null>(null);
  const [engagementRate, setEngagementRate] = useState<LuisEngagementRate | null>(null);
  const [leadsInAttendance, setLeadsInAttendance] = useState<LuisLeadsInAttendance | null>(null);
  const [leadsOutsideHours, setLeadsOutsideHours] = useState<LuisLeadsOutsideBusinessHours | null>(null);
  const [totalLeadsTodayMetrics, setTotalLeadsTodayMetrics] = useState<LuisTotalLeadsToday | null>(null);
  const [userLoja, setUserLoja] = useState<LuisUserLoja | null>(null);
  const [userRole, setUserRole] = useState<LuisUserRole | null>(null);

  // BrainDrawer
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLeadName, setSelectedLeadName] = useState('');
  const [isBrainDrawerOpen, setIsBrainDrawerOpen] = useState(false);

  const { data: brainData, fetchBrainData } = useBrainDrawerData({
    agentId: 'luis',
    leadId: selectedLeadId || '',
  });

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const [pulse, qualification, traffic, vehicles, governance, engagement, attendance, outsideHours, totalToday, loja, role] =
        await Promise.all([
          getLuisKpiPulse(),
          getLuisQualificationList(),
          getLuisTrafficHeatmap(),
          getLuisVehicleInterest(),
          getLuisGovernance(),
          getLuisMetrics<LuisEngagementRate>('engagement_rate', { tz: 'America/Sao_Paulo' }),
          getLuisMetrics<LuisLeadsInAttendance>('leads_in_attendance'),
          getLuisMetrics<LuisLeadsOutsideBusinessHours>('leads_outside_business_hours', { tz: 'America/Sao_Paulo' }),
          getLuisMetrics<LuisTotalLeadsToday>('total_leads_today', { tz: 'America/Sao_Paulo' }),
          getCurrentUserLoja(),
          getCurrentUserRole(),
        ]);

      setKpiPulse(pulse);
      setQualificationList(qualification || []);
      setTrafficData(traffic || []);
      setVehicleStats(vehicles || []);
      setGovernanceData(governance);
      setEngagementRate(engagement);
      setLeadsInAttendance(attendance);
      setLeadsOutsideHours(outsideHours);
      setTotalLeadsTodayMetrics(totalToday);
      setUserLoja(loja);
      setUserRole(role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (isBrainDrawerOpen && selectedLeadId) fetchBrainData();
  }, [isBrainDrawerOpen, selectedLeadId, fetchBrainData]);

  // Cálculos de Governança
  const gov = useMemo(() => {
    const fila = governanceData?.fila_envio ?? 0;
    const semAtendimento = governanceData?.leads_sem_atendimento ?? 0;
    return {
      fila,
      semAtendimento,
      isConnected: governanceData?.status_whatsapp === 'connected',
      isCritical: fila > GOVERNANCE_THRESHOLDS.QUEUE_CRITICAL || semAtendimento > 0,
      isWarning: fila > GOVERNANCE_THRESHOLDS.QUEUE_WARNING
    };
  }, [governanceData]);

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <RefreshCw className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="animate-pulse font-medium text-slate-500">Sincronizando dados do Luís...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-6 pb-20">

      {/* HEADER DINÂMICO */}
      <header className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-600 p-2 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <Moon className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Luís</h1>
            <Badge variant="outline" className="h-6 border-indigo-200 bg-indigo-50 text-indigo-700">SDR Plantão 24/7</Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            {userLoja && <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">🏪 {userLoja.nome}</span>}
            <span className="h-4 w-px bg-slate-300" />
            <span>Gestão de Leads e Qualificação Noturna</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className={`px-3 py-1 text-xs font-semibold ${gov.isConnected ? 'bg-emerald-100 text-emerald-700' : 'animate-bounce bg-red-100 text-red-700'}`}>
            {gov.isConnected ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
            {gov.isConnected ? 'WhatsApp Ativo' : 'WhatsApp Desconectado'}
          </Badge>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </header>

      {/* ZONA DE ALERTA CRÍTICO (Apenas se houver erro ou fila alta) */}
      {gov.isCritical && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm dark:bg-red-950/20 dark:text-red-400">
          <div className="flex items-center gap-3">
            <AlertOctagon className="h-6 w-6 animate-pulse" />
            <div>
              <p className="font-bold">Ação Necessária na Governança</p>
              <p className="text-sm opacity-90">
                {gov.semAtendimento > 0 && `${gov.semAtendimento} leads sem atendimento IA.`}
                {gov.fila > GOVERNANCE_THRESHOLDS.QUEUE_WARNING && ` Fila de envio sobrecarregada (${gov.fila} msgs).`}
              </p>
            </div>
          </div>
          <button className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition-hover hover:bg-red-700">Resolver Agora</button>
        </div>
      )}

      {/* BLOCO 1: KPIs DE OPERAÇÃO */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Leads Hoje"
          value={totalLeadsTodayMetrics?.total_leads_today ?? kpiPulse?.total_leads_hoje ?? 0}
          icon={<Users className="h-5 w-5" />}
          color="blue"
        />
        <KpiCard
          title="Atendimento IA Ativo"
          value={leadsInAttendance?.leads_in_attendance ?? kpiPulse?.atendimentos_ia ?? 0}
          subtitle="Sessões em tempo real"
          icon={<MessageSquare className="h-5 w-5" />}
          color="green"
        />
        <KpiCard
          title="Resgatados no Plantão"
          value={leadsOutsideHours?.leads_outside_business_hours ?? kpiPulse?.leads_fora_horario ?? 0}
          subtitle="Salvos fora do comercial"
          icon={<Moon className="h-5 w-5" />}
          color="indigo"
          highlight
        />
        <KpiCard
          title="Taxa Engajamento"
          value={`${(engagementRate?.engagement_percentage ?? kpiPulse?.taxa_engajamento ?? 0).toFixed(1)}%`}
          subtitle={engagementRate?.engagement_percentage && engagementRate.engagement_percentage > 80 ? '✅ Desempenho excelente' : '⚠️ Verifique o script'}
          icon={<Signal className="h-5 w-5" />}
          color="amber"
        />
      </div>

      {/* BLOCO 2: INTELIGÊNCIA E GRÁFICOS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-indigo-600" />
              Concentração por Horário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-30" />
                  <XAxis dataKey="hora" tickFormatter={(h) => `${h}h`} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload?.[0]) {
                        const h = payload[0].payload.hora;
                        return (
                          <div className="rounded-lg border bg-white p-2 shadow-xl dark:bg-slate-900">
                            <p className="text-xs font-bold">{h}h - {isNightShiftHour(h) ? '🌙 Plantão' : '☀️ Comercial'}</p>
                            <p className="text-sm text-indigo-600">{payload[0].value} leads</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                    {trafficData.map((entry, i) => (
                      <Cell key={i} fill={isNightShiftHour(entry.hora) ? '#6366f1' : '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CarFront className="h-5 w-5 text-purple-600" />
              Ranking de Interesse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehicleStats}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="total"
                    nameKey="veiculo"
                  >
                    {vehicleStats.map((_, i) => <Cell key={i} fill={VEHICLE_COLORS[i % VEHICLE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BLOCO 3: LISTA OPERACIONAL (HANDOVER) */}
      <Card className="overflow-hidden shadow-md">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-blue-600 rounded-full" />
              <CardTitle className="text-xl">Fila de Qualificação</CardTitle>
            </div>
            {qualificationList.filter(l => l.solicitou_humano).length > 0 && (
              <Badge className="animate-pulse bg-amber-500 text-white">Urgente: Solicitação de Agente</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-900">
                  <th className="px-6 py-4">Lead</th>
                  <th className="px-6 py-4">Veículo</th>
                  <th className="px-6 py-4">Chegada</th>
                  <th className="px-6 py-4">Análise IA</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {qualificationList.map((lead, i) => (
                  <tr
                    key={i}
                    onClick={() => handleLeadClick(lead.nome, lead.whatsapp)}
                    className="group cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{lead.nome}</div>
                      <div className="text-xs text-emerald-600 flex items-center gap-1 font-medium">{lead.whatsapp}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="rounded-md font-medium">
                        {lead.interesse_veiculo || 'Geral'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {format(new Date(lead.horario_entrada), "HH:mm '•' dd/MM", { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="max-w-[250px] truncate text-xs text-slate-600 dark:text-slate-400" title={lead.resumo_ia}>
                        {lead.resumo_ia || 'Aguardando interação...'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {lead.solicitou_humano && (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40">SDR 🙋‍♂️</Badge>
                        )}
                        <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* BRAIN DRAWER */}
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

// Sub-componente para cards de KPI
function KpiCard({ title, value, subtitle, icon, color, highlight = false }: any) {
  const colors = {
    blue: 'border-l-blue-500 text-blue-600 bg-blue-50/30',
    green: 'border-l-emerald-500 text-emerald-600 bg-emerald-50/30',
    indigo: 'border-l-indigo-600 text-indigo-600 bg-indigo-50/30',
    amber: 'border-l-amber-500 text-amber-600 bg-amber-50/30',
  };

  return (
    <Card className={`relative overflow-hidden border-l-4 shadow-sm transition-all hover:shadow-md ${colors[color as keyof typeof colors]}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
            <p className="text-3xl font-black">{value}</p>
            {subtitle && <p className="text-[10px] font-medium text-slate-400">{subtitle}</p>}
          </div>
          <div className={`rounded-full p-2 opacity-20 ${colors[color as keyof typeof colors]}`}>
            {icon}
          </div>
        </div>
        {highlight && (
          <div className="absolute bottom-0 right-0 p-1">
            <Zap className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}