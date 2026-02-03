'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { Agent } from '@/types/database.types';
import { fetchKanbanData, getEmptyKanbanResponse } from '@/services/kanban-api.service';
import { Users, DollarSign, ChevronRight, RefreshCw, Target, Moon, MessageSquare, ThumbsUp, AlertTriangle, Phone, TrendingUp, CheckCircle2, Activity, Clock, Zap, X } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { SystemicMatrix, MatrixMode } from '@/components/dashboard/SystemicMatrix';
import { AgentProcessMap } from '@/components/dashboard/AgentProcessMap';

// Serviços e Tipos
import { getLuisKpiPulse } from '@/services/luis.service';
import { getAngelaKpiPulse } from '@/services/angela.service';
import { getAliceFunnelMetrics } from '@/services/alice.service';
import { getFernandaFunnelMetrics } from '@/services/fernanda.service';
import type { LuisKpiPulse } from '@/types/luis-api.types';
import type { AngelaKpiPulse } from '@/types/angela-api.types';
import type { AliceFunnelKPI } from '@/services/alice.service';
import type { FernandaFunnelKPI } from '@/types/fernanda-api.types';

interface AgentKpiData {
  luis?: LuisKpiPulse | null;
  angela?: AngelaKpiPulse | null;
  alice?: AliceFunnelKPI | null;
  fernanda?: FernandaFunnelKPI | null;
  vitor?: { clientes_recuperados: number; receita_recuperada: number; em_negociacao: number; } | null;
}

// ORDER: Alice -> Luis -> Fernanda -> Angela -> Vitor
const AGENT_IDS = ['agent-alice', 'agent-luis', 'agent-fernanda', 'agent-angela', 'agent-vitor'] as const;

export default function DashboardPage() {
  const [agents, setAgents] = useState<Record<string, Agent | null>>({});
  const [agentKpis, setAgentKpis] = useState<AgentKpiData>({});
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<MatrixMode>('IMPACT');

  const loadData = useCallback(async () => {
    setLoading(true);
    const agentPromises = AGENT_IDS.map(async (id) => {
      try {
        const res = await fetch(`/api/agents/${id}`);
        const json = await res.json();
        return { id, agent: json.ok ? json.agent : null };
      } catch { return { id, agent: null }; }
    });

    const [luisKpi, angelaKpi, aliceKpi, fernandaKpi, kanbanData] = await Promise.all([
      getLuisKpiPulse().catch(() => null),
      getAngelaKpiPulse().catch(() => null),
      getAliceFunnelMetrics().catch(() => null),
      getFernandaFunnelMetrics().catch(() => null),
      fetchKanbanData(true).catch(() => getEmptyKanbanResponse()),
    ]);

    const results = await Promise.all(agentPromises);
    const byId: Record<string, Agent | null> = {};
    results.forEach(({ id, agent }) => { byId[id] = agent; });

    setAgents(byId);
    setAgentKpis({
      luis: luisKpi, angela: angelaKpi, alice: aliceKpi, fernanda: fernandaKpi,
      vitor: kanbanData ? {
        clientes_recuperados: kanbanData.meta['Recuperado']?.count ?? 0,
        receita_recuperada: kanbanData.meta['Recuperado']?.total_recuperado ?? 0,
        em_negociacao: kanbanData.meta['Em Negociacao']?.count ?? 0,
      } : null,
    });
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAgentClick = (agentId: string) => {
    setSelectedAgentId(agentId);
  };

  const selectedAgent = selectedAgentId ? agents[selectedAgentId] : null;

  // Helper de Normalização
  const normalize = (val: number, max: number) => {
    if (!val) return 0;
    return Math.min((val / max) * 100, 100);
  };

  // SYSTEMIC MATRIX DATA PREPARATION
  const matrixData = useMemo(() => {
    const { alice, luis, fernanda, angela, vitor } = agentKpis;

    // Adaptação dos dados de Fernanda
    const fernandaData = fernanda ? {
      base_total: fernanda.base_total,
      receita_recuperada: (fernanda.com_intencao || 0) * 800, // Derivado
      taxa_recuperacao: fernanda.base_total > 0 ? ((fernanda.com_intencao || 0) / fernanda.base_total * 100).toFixed(1) : 0,
      intervencoes: fernanda.intervencoes,
      validos: fernanda.com_intencao || 0,
    } : null;

    // DATA ORDER: Alice -> Luis -> Fernanda -> Angela -> Vitor

    // -- DADOS DE IMPACTO (Sucesso/Receita) --
    const impactRows = [
      {
        id: 'revenue',
        label: 'Receita / Valor',
        icon: <DollarSign className="w-4 h-4" />,
        data: [
          {
            agentId: 'agent-alice', agentName: 'Alice', value: '-', score: 0,
            hint: 'Geração de Pipeline (Potencial)'
          },
          {
            agentId: 'agent-luis', agentName: 'Luís', value: '-', score: 0,
            hint: 'Qualificação de Receita'
          },
          {
            agentId: 'agent-fernanda', agentName: 'Fernanda', value: `R$ ${(fernandaData?.receita_recuperada || 0).toLocaleString('pt-BR', { notation: 'compact' })}`, score: normalize(fernandaData?.receita_recuperada || 0, 200000),
            hint: 'Receita Salva (Winback)'
          },
          {
            agentId: 'agent-angela', agentName: 'Ângela', value: '-', score: 0,
            hint: 'Preservação de LTV'
          },
          {
            agentId: 'agent-vitor', agentName: 'Vitor', value: `R$ ${(vitor?.receita_recuperada || 0).toLocaleString('pt-BR', { notation: 'compact' })}`, score: normalize(vitor?.receita_recuperada || 0, 500000),
            hint: 'Receita Confirmada (Fechamento)'
          },
        ]
      },
      {
        id: 'volume',
        label: 'Volumetria Ativa',
        icon: <Users className="w-4 h-4" />,
        data: [
          {
            agentId: 'agent-alice', agentName: 'Alice', value: alice?.base_total || 0, score: normalize(alice?.base_total || 0, 5000),
            hint: 'Prospects em Cadência Ativa'
          },
          {
            agentId: 'agent-luis', agentName: 'Luís', value: luis?.total_leads_hoje || 0, score: normalize(luis?.total_leads_hoje || 0, 100),
            hint: 'Atendimentos Realizados (24h)'
          },
          {
            agentId: 'agent-fernanda', agentName: 'Fernanda', value: fernandaData?.base_total || 0, score: normalize(fernandaData?.base_total || 0, 1000),
            hint: 'Oportunidades Perdidas Processadas'
          },
          {
            agentId: 'agent-angela', agentName: 'Ângela', value: angela?.total_atendimentos || 0, score: normalize(angela?.total_atendimentos || 0, 200),
            hint: 'Clientes em Carteira Atendidos'
          },
          {
            agentId: 'agent-vitor', agentName: 'Vitor', value: vitor?.em_negociacao || 0, score: normalize(vitor?.em_negociacao || 0, 50),
            hint: 'Deals em Negociação Ativa'
          },
        ]
      },
      {
        id: 'conversion',
        label: 'Conversão / Engaj.',
        icon: <Zap className="w-4 h-4" />,
        data: [
          {
            agentId: 'agent-alice', agentName: 'Alice',
            value: alice?.contatados ? `${Math.round((alice.engajados / alice.contatados) * 100)}%` : '0%',
            score: alice?.contatados ? normalize((alice.engajados / alice.contatados) * 100, 30) : 0,
            hint: 'Eficiência de Resposta (Prospecção)'
          },
          {
            agentId: 'agent-luis', agentName: 'Luís',
            value: `${(luis?.taxa_engajamento || 0).toFixed(0)}%`, score: normalize(luis?.taxa_engajamento || 0, 80),
            hint: 'Retenção Automática (Sem Transbordo)'
          },
          {
            agentId: 'agent-fernanda', agentName: 'Fernanda',
            value: `${fernandaData?.taxa_recuperacao || 0}%`, score: normalize(Number(fernandaData?.taxa_recuperacao || 0), 15),
            hint: 'Taxa de Reversão de Churn'
          },
          {
            agentId: 'agent-angela', agentName: 'Ângela',
            value: angela?.total_atendimentos ? `${Math.round((angela.sentimento_positivo / angela.total_atendimentos) * 100)}%` : '0%',
            score: angela?.total_atendimentos ? normalize((angela.sentimento_positivo / angela.total_atendimentos) * 100, 90) : 0,
            hint: 'Satisfação Detectada (Sentimento)'
          },
          {
            agentId: 'agent-vitor', agentName: 'Vitor', value: '-', score: 0,
            hint: 'Win-Rate Semanal'
          },
        ]
      }
    ];

    // -- DADOS DE RISCO (Gargalos) --
    // ORDER: Alice -> Luis -> Fernanda -> Angela -> Vitor
    const riskRows = [
      {
        id: 'stalled',
        label: 'Backlog / Parados',
        icon: <Clock className="w-4 h-4" />,
        data: [
          {
            agentId: 'agent-alice', agentName: 'Alice', value: (alice?.base_total || 0) - (alice?.contatados || 0),
            score: normalize((alice?.base_total || 0) - (alice?.contatados || 0), 1000),
            hint: 'Fila de Envio Pendente'
          },
          {
            agentId: 'agent-luis', agentName: 'Luís', value: luis?.leads_fora_horario || 0, score: normalize(luis?.leads_fora_horario || 0, 20),
            hint: 'Fila de Espera Noturna'
          },
          { agentId: 'agent-fernanda', agentName: 'Fernanda', value: (fernandaData?.base_total || 0) - (fernandaData?.validos || 0), score: normalize((fernandaData?.base_total || 0) - (fernandaData?.validos || 0), 200), hint: 'Leads Descartados (Sem Contato)' },
          { agentId: 'agent-angela', agentName: 'Ângela', value: 0, score: 0, hint: 'Fila Pós-Venda' },
          { agentId: 'agent-vitor', agentName: 'Vitor', value: 0, score: 0, hint: 'Deals Estagnados' },
        ]
      },
      {
        id: 'critical',
        label: 'Intervenções / Erros',
        icon: <AlertTriangle className="w-4 h-4" />,
        data: [
          { agentId: 'agent-alice', agentName: 'Alice', value: 0, score: 0, hint: 'Erros de API / Bloqueio' },
          { agentId: 'agent-luis', agentName: 'Luís', value: 0, score: 0, hint: 'Alucinações / Falha de Contexto' },
          { agentId: 'agent-fernanda', agentName: 'Fernanda', value: fernandaData?.intervencoes || 0, score: normalize(fernandaData?.intervencoes || 0, 10), hint: 'Intervenções Manuais Críticas' },
          { agentId: 'agent-angela', agentName: 'Ângela', value: angela?.problemas_detectados || 0, score: normalize(angela?.problemas_detectados || 0, 15), hint: 'Detratores Críticos' },
          { agentId: 'agent-vitor', agentName: 'Vitor', value: 0, score: 0, hint: 'Deals em Risco de Perda' },
        ]
      }
    ];

    return { impactRows, riskRows };

  }, [agentKpis]);

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
        <RefreshCw className="h-10 w-10 text-blue-500" />
      </motion.div>
    </div>
  );

  return (
    <div className="flex flex-col items-center space-y-12 pb-20">
      <div className="text-center">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
          Centro de Comando
        </h1>
      </div>

      {/* TOGGLE MODO DE VISÃO */}
      <div className="flex bg-slate-900/50 p-1 rounded-full border border-slate-800 backdrop-blur-sm z-30">
        <button
          onClick={() => setViewMode('IMPACT')}
          className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${viewMode === 'IMPACT' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" : "text-slate-500 hover:text-emerald-400"
            }`}
        >
          <Activity className="w-3 h-3" /> Impacto (Eficiência)
        </button>
        <button
          onClick={() => setViewMode('RISK')}
          className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${viewMode === 'RISK' ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20" : "text-slate-500 hover:text-rose-400"
            }`}
        >
          <AlertTriangle className="w-3 h-3" /> Risco (Gargalos)
        </button>
      </div>

      {/* SYSTEMIC MATRIX */}
      <div className="w-full max-w-5xl px-4">
        <SystemicMatrix
          mode={viewMode}
          impactData={matrixData.impactRows}
          riskData={matrixData.riskRows}
        />
      </div>

      {/* PAINEL DE DETALHES OU MAPA DE PROCESSO */}
      <div className="w-full max-w-6xl px-4">
        <AnimatePresence mode="wait">
          {selectedAgent ? (
            <motion.div key={selectedAgentId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur relative">
                {/* BACK BUTTON */}
                <button
                  onClick={() => setSelectedAgentId(null)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>

                <CardHeader className="flex flex-row items-center justify-between pb-6 border-b pr-16 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-4">
                    <Avatar name={selectedAgent.nome || ''} size="lg" className="ring-4 ring-blue-500/20" />
                    <div>
                      <h2 className="text-2xl font-black">{selectedAgent.nome}</h2>
                      <div className="flex gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">Online</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase italic">Shadow IA Ativa</span>
                      </div>
                    </div>
                  </div>
                  <Link href={getAgentHref(selectedAgentId!)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-bold hover:scale-105 transition-all">
                    Painel Completo <ChevronRight className="w-4 h-4" />
                  </Link>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">

                  {/* --- LUÍS (SDR / Plantão) --- */}
                  {selectedAgentId === 'agent-luis' && agentKpis.luis && (
                    <>
                      <MetricItem
                        label="Total Leads Hoje"
                        value={agentKpis.luis.total_leads_hoje}
                        icon={<Users className="w-5 h-5 text-blue-500" />}
                      />
                      <MetricItem
                        label="Leads Fora de Horário"
                        value={agentKpis.luis.leads_fora_horario}
                        icon={<Moon className="w-5 h-5 text-indigo-500" />}
                        highlight
                      />
                      <MetricItem
                        label="Taxa de Engajamento"
                        value={`${agentKpis.luis.taxa_engajamento.toFixed(1)}%`}
                        icon={<TrendingUp className="w-5 h-5 text-green-500" />}
                      />
                    </>
                  )}

                  {/* --- ALICE (BDR / Prospecção) --- */}
                  {selectedAgentId === 'agent-alice' && agentKpis.alice && (
                    <>
                      <MetricItem
                        label="Base Total"
                        value={agentKpis.alice.base_total}
                        icon={<Users className="w-5 h-5 text-blue-500" />}
                      />
                      <MetricItem
                        label="Contatados"
                        value={agentKpis.alice.contatados}
                        icon={<Phone className="w-5 h-5 text-purple-500" />}
                      />
                      <MetricItem
                        label="Engajados"
                        value={agentKpis.alice.engajados}
                        icon={<MessageSquare className="w-5 h-5 text-green-500" />}
                        highlight
                      />
                    </>
                  )}

                  {/* --- FERNANDA (Recuperação de Vendas) --- */}
                  {selectedAgentId === 'agent-fernanda' && agentKpis.fernanda && (
                    <>
                      <MetricItem
                        label="Base para Reativar"
                        value={agentKpis.fernanda.base_total}
                        icon={<RefreshCw className="w-5 h-5 text-slate-500" />}
                      />
                      <MetricItem
                        label="Com Intenção Real"
                        value={agentKpis.fernanda.com_intencao || 0}
                        icon={<Target className="w-5 h-5 text-green-600" />}
                        highlight
                      />
                      <MetricItem
                        label="Intervenções Humanas"
                        value={agentKpis.fernanda.intervencoes}
                        icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
                      />
                    </>
                  )}

                  {/* --- ÂNGELA (Pós-Venda / CS) --- */}
                  {selectedAgentId === 'agent-angela' && agentKpis.angela && (
                    <>
                      <MetricItem
                        label="Total Atendimentos"
                        value={agentKpis.angela.total_atendimentos}
                        icon={<MessageSquare className="w-5 h-5 text-blue-500" />}
                      />
                      <MetricItem
                        label="Clientes Satisfeitos"
                        value={agentKpis.angela.sentimento_positivo}
                        icon={<ThumbsUp className="w-5 h-5 text-green-500" />}
                        highlight
                      />
                      <MetricItem
                        label="Problemas Detectados"
                        value={agentKpis.angela.problemas_detectados}
                        icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
                      />
                    </>
                  )}

                  {/* --- VITOR (Fechamento / Kanban) --- */}
                  {selectedAgentId === 'agent-vitor' && agentKpis.vitor && (
                    <>
                      <MetricItem
                        label="Em Negociação"
                        value={agentKpis.vitor.em_negociacao}
                        icon={<Users className="w-5 h-5 text-blue-500" />}
                      />
                      <MetricItem
                        label="Recuperados (Kanban)"
                        value={agentKpis.vitor.clientes_recuperados}
                        icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
                        highlight
                      />
                      <MetricItem
                        label="Receita Recuperada"
                        value={formatCurrency(agentKpis.vitor.receita_recuperada)}
                        icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
                      />
                    </>
                  )}

                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="w-full pb-6">
              {/* Agent Process Flow Map */}
              <AgentProcessMap
                agents={agents}
                kpis={agentKpis}
                onSelectAgent={handleAgentClick}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MetricItem({ label, value, icon, highlight }: any) {
  return (
    <div className={`p-4 rounded-2xl border ${highlight ? 'bg-green-50 border-green-200 dark:bg-green-900/20' : 'bg-slate-50 border-slate-100'}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className={`text-[10px] font-bold uppercase tracking-wider ${highlight ? 'text-green-700' : 'text-slate-500'}`}>{label}</span>
      </div>
      <div className={`text-2xl font-black ${highlight ? 'text-green-700' : 'text-slate-900'}`}>{value}</div>
    </div>
  );
}

function getAgentHref(agentId: string): string {
  switch (agentId) {
    case 'agent-luis': return '/luis';
    case 'agent-alice': return '/alice';
    case 'agent-fernanda': return '/fernanda';
    case 'agent-angela': return '/angela';
    case 'agent-vitor': return '/kanban'; // Vitor geralmente cuida do Kanban/Fechamento
    default: return '/dashboard';
  }
}