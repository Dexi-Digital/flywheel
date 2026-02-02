'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { Agent } from '@/types/database.types';
import {
  fetchKanbanData,
  getEmptyKanbanResponse,
  type KanbanApiResponse,
} from '@/services/kanban-api.service';
import {
  Users,
  DollarSign,
  ChevronRight,
  RefreshCw,
  Target,
  Moon,
  MessageSquare,
  ThumbsUp,
  AlertTriangle,
  Phone,
  TrendingUp,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';

// Serviços de KPI de cada agente
import { getLuisKpiPulse } from '@/services/luis.service';
import { getAngelaKpiPulse } from '@/services/angela.service';
import { getAliceFunnelMetrics } from '@/services/alice.service';
import { getFernandaFunnelMetrics } from '@/services/fernanda.service';

// Tipos de KPI
import type { LuisKpiPulse } from '@/types/luis-api.types';
import type { AngelaKpiPulse } from '@/types/angela-api.types';
import type { AliceFunnelKPI } from '@/services/alice.service';
import type { FernandaFunnelKPI } from '@/types/fernanda-api.types';

// Tipo unificado para KPIs de agentes
interface AgentKpiData {
  luis?: LuisKpiPulse | null;
  angela?: AngelaKpiPulse | null;
  alice?: AliceFunnelKPI | null;
  fernanda?: FernandaFunnelKPI | null;
  vitor?: {
    clientes_recuperados: number;
    receita_recuperada: number;
    em_negociacao: number;
  } | null;
}

const AGENT_IDS = [
  'agent-luis',
  'agent-angela',
  'agent-alice',
  'agent-fernanda',
  'agent-vitor',
] as const;

// Mapeamento de ângulos para rotacionar o motor (em graus)
const PHASE_ANGLES = {
  'ATRAIR': 60,   // Alice
  'ENGAJAR': -60,  // Luis
  'ENCANTAR': 180, // Angela & Vitor
};

function getAgentHref(agentId: string): string {
  const map: Record<string, string> = {
    'agent-vitor': '/dashboard/vitor',
    'agent-alice': '/dashboard/alice',
    'agent-angela': '/dashboard/angela',
    'agent-fernanda': '/dashboard/fernanda',
    'agent-luis': '/dashboard/luis',
  };
  return map[agentId] || `/dashboard/agentes/${agentId}`;
}

export default function DashboardPage() {
  const [agents, setAgents] = useState<Record<string, Agent | null>>({});
  const [, setKanban] = useState<KanbanApiResponse | null>(null);
  const [agentKpis, setAgentKpis] = useState<AgentKpiData>({});
  const [loading, setLoading] = useState(true);

  // Estados de Interação
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);

    // Buscar dados básicos dos agentes
    const agentPromises = AGENT_IDS.map(async (id) => {
      try {
        const res = await fetch(`/api/agents/${id}`);
        const json = await res.json();
        return { id, agent: json.ok ? json.agent : null };
      } catch {
        return { id, agent: null };
      }
    });

    // Buscar KPIs específicos de cada agente em paralelo
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

    // Montar KPIs do Vitor a partir do Kanban
    const vitorKpi = kanbanData ? {
      clientes_recuperados: kanbanData.meta['Recuperado']?.count ?? 0,
      receita_recuperada: kanbanData.meta['Recuperado']?.total_recuperado ?? 0,
      em_negociacao: kanbanData.meta['Em Negociacao']?.count ?? 0,
    } : null;

    setAgents(byId);
    setKanban(kanbanData);
    setAgentKpis({
      luis: luisKpi,
      angela: angelaKpi,
      alice: aliceKpi,
      fernanda: fernandaKpi,
      vitor: vitorKpi,
    });
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Função para selecionar agente e girar motor
  const handleAgentClick = (agentId: string, phase?: keyof typeof PHASE_ANGLES) => {
    setSelectedAgentId(agentId);
    if (phase) {
      setRotation(PHASE_ANGLES[phase]);
    }
  };

  const selectedAgent = selectedAgentId ? agents[selectedAgentId] : null;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          <RefreshCw className="h-10 w-10 text-blue-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-12 pb-20">
      <div className="text-center">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
          Centro de Comando: Motor de Receita
        </h1>
        <p className="text-slate-500">Selecione um agente para focar na operação</p>
      </div>

      {/* MOTOR DE RECEITA INTERATIVO */}
      <div className="relative w-[500px] h-[500px] flex items-center justify-center">
        
        {/* Camada de Rotação (Setores e Agentes Internos) */}
        <motion.div 
          className="relative w-full h-full"
          animate={{ rotate: rotation }}
          transition={{ type: "spring", stiffness: 40, damping: 15 }}
        >
          {/* SVG do Motor */}
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
            {/* Atrair */}
            <path d="M 50 50 L 50 5 A 45 45 0 0 1 89 27.5 Z" fill="#5D7A93" className="opacity-90 transition-opacity hover:opacity-100 cursor-pointer" />
            {/* Engajar */}
            <path d="M 50 50 L 11 27.5 A 45 45 0 0 1 50 5 Z" fill="#E5E7EB" className="cursor-pointer" />
            {/* Encantar */}
            <path d="M 50 50 L 89 27.5 A 45 45 0 0 1 11 27.5 Z" fill="#71717A" className="cursor-pointer" />
          </svg>

          {/* Agentes Posicionados no Motor (Eles giram junto) */}
          <AgentNode 
            id="agent-alice" 
            name="Alice" 
            top="15%" left="65%" 
            isActive={selectedAgentId === 'agent-alice'}
            onClick={() => handleAgentClick('agent-alice', 'ATRAIR')}
            rotationCorrection={-rotation}
          />
          <AgentNode 
            id="agent-luis" 
            name="Luís" 
            top="15%" left="35%" 
            isActive={selectedAgentId === 'agent-luis'}
            onClick={() => handleAgentClick('agent-luis', 'ENGAJAR')}
            rotationCorrection={-rotation}
          />
          <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 flex gap-8">
            <AgentNode 
              id="agent-angela" 
              name="Ângela" 
              isActive={selectedAgentId === 'agent-angela'}
              onClick={() => handleAgentClick('agent-angela', 'ENCANTAR')}
              rotationCorrection={-rotation}
              staticPos
            />
            <AgentNode 
              id="agent-vitor" 
              name="Vitor" 
              isActive={selectedAgentId === 'agent-vitor'}
              onClick={() => handleAgentClick('agent-vitor', 'ENCANTAR')}
              rotationCorrection={-rotation}
              staticPos
            />
          </div>
        </motion.div>

        {/* NÚCLEO CENTRAL (Estatico) */}
        <div className="absolute z-50 w-36 h-36 rounded-full bg-gradient-to-b from-slate-100 to-slate-300 border-[6px] border-slate-200 shadow-xl flex flex-col items-center justify-center text-center p-4">
          <span className="text-[10px] font-bold text-slate-400 tracking-widest leading-none">OTTO</span>
          <div className="w-10 h-[1px] bg-slate-300 my-1.5" />
          <span className="text-xs font-black text-slate-700 uppercase italic leading-tight">Sales Pilot</span>
        </div>

        {/* FERNANDA (Externa - Re-engajar) */}
        <div className="absolute -right-20 top-1/2 -translate-y-1/2">
            <AgentNode 
              id="agent-fernanda" 
              name="Fernanda" 
              isActive={selectedAgentId === 'agent-fernanda'}
              onClick={() => handleAgentClick('agent-fernanda')}
              rotationCorrection={0}
              isExternal
            />
        </div>
      </div>

      {/* PAINEL DE DETALHES (Framer Motion Slide-up) */}
      <div className="w-full max-w-4xl px-4">
        <AnimatePresence mode="wait">
          {selectedAgent ? (
            <motion.div
              key={selectedAgentId}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b">
                  <div className="flex items-center gap-4">
                    <Avatar name={selectedAgent.nome || 'Agente'} size="lg" className="ring-4 ring-blue-500/20" />
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 dark:text-white">{selectedAgent.nome}</h2>
                      <div className="flex gap-2 mt-1">
                         <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">Online</span>
                         <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase italic">Shadow IA Ativa</span>
                      </div>
                    </div>
                  </div>
                  <Link 
                    href={getAgentHref(selectedAgentId!)}
                    className="flex items-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 rounded-full text-sm font-bold hover:scale-105 transition-transform"
                  >
                    Painel Completo <ChevronRight className="w-4 h-4" />
                  </Link>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                  {/* LUÍS - SDR Plantão */}
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

                  {/* ÂNGELA - Pós-Venda */}
                  {selectedAgentId === 'agent-angela' && agentKpis.angela && (
                    <>
                      <MetricItem
                        label="Total Atendimentos"
                        value={agentKpis.angela.total_atendimentos}
                        icon={<Users className="w-5 h-5 text-pink-500" />}
                      />
                      <MetricItem
                        label="Sentimento Positivo"
                        value={agentKpis.angela.sentimento_positivo}
                        icon={<ThumbsUp className="w-5 h-5 text-green-500" />}
                      />
                      <MetricItem
                        label="Problemas Detectados"
                        value={agentKpis.angela.problemas_detectados}
                        icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
                      />
                    </>
                  )}

                  {/* ALICE - BDR Outbound */}
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

                  {/* FERNANDA - Win-back */}
                  {selectedAgentId === 'agent-fernanda' && agentKpis.fernanda && (
                    <>
                      <MetricItem
                        label="Base Total"
                        value={agentKpis.fernanda.base_total}
                        icon={<Users className="w-5 h-5 text-orange-500" />}
                      />
                      <MetricItem
                        label="Com Intenção"
                        value={agentKpis.fernanda.com_intencao}
                        icon={<Target className="w-5 h-5 text-green-500" />}
                        highlight
                      />
                      <MetricItem
                        label="Intervenções"
                        value={agentKpis.fernanda.intervencoes}
                        icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
                      />
                    </>
                  )}

                  {/* VITOR - Cobrança */}
                  {selectedAgentId === 'agent-vitor' && agentKpis.vitor && (
                    <>
                      <MetricItem
                        label="Em Negociação"
                        value={agentKpis.vitor.em_negociacao}
                        icon={<Users className="w-5 h-5 text-blue-500" />}
                      />
                      <MetricItem
                        label="Clientes Recuperados"
                        value={agentKpis.vitor.clientes_recuperados}
                        icon={<Target className="w-5 h-5 text-green-500" />}
                        highlight
                      />
                      <MetricItem
                        label="Receita Recuperada"
                        value={formatCurrency(agentKpis.vitor.receita_recuperada)}
                        icon={<DollarSign className="w-5 h-5 text-green-600" />}
                      />
                    </>
                  )}

                  {/* Fallback genérico se não tiver KPIs específicos */}
                  {!agentKpis[selectedAgentId?.replace('agent-', '') as keyof AgentKpiData] && (
                    <>
                      <MetricItem
                        label="Leads em Gestão"
                        value={selectedAgent.leads?.length || 0}
                        icon={<Users className="w-5 h-5 text-blue-500" />}
                      />
                      <MetricItem
                        label="Receita Gerada"
                        value={formatCurrency(Number(selectedAgent.metricas_agregadas?.receita_gerada || 0))}
                        icon={<DollarSign className="w-5 h-5 text-green-500" />}
                      />
                      <MetricItem
                        label="Eficiência de Conversão"
                        value={`${((selectedAgent.leads?.filter((l: any) => l.status === 'GANHO').length || 0) / (selectedAgent.leads?.length || 1) * 100).toFixed(1)}%`}
                        icon={<Target className="w-5 h-5 text-purple-500" />}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-3xl">
              <MousePointer2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-slate-400 font-medium">Selecione um agente no motor para ver as métricas</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Sub-componente para os Nodes dos Agentes
function AgentNode({ name, top, left, isActive, onClick, rotationCorrection, staticPos, isExternal }: any) {
  return (
    <motion.div 
      className="absolute z-40 cursor-pointer"
      style={!staticPos ? { top, left } : { position: 'relative' }}
      animate={{ rotate: rotationCorrection }} // Corrige a rotação do texto/avatar para ficarem sempre "de pé"
      whileHover={{ scale: 1.1 }}
      onClick={onClick}
    >
      <div className="flex flex-col items-center">
        <div className={`relative p-1 rounded-full transition-all duration-300 ${isActive ? 'ring-4 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'hover:ring-2 hover:ring-slate-300'}`}>
          <Avatar name={name} size={isActive ? "lg" : "md"} className="bg-white" />
          {isActive && (
            <motion.div 
              layoutId="active-glow" 
              className="absolute inset-0 rounded-full border-2 border-blue-500" 
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
        </div>
        <span className={`mt-2 text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${isActive ? 'bg-blue-600 text-white' : 'bg-white/90 text-slate-600 shadow-sm'}`}>
          {name}
        </span>
        {isExternal && <span className="text-[8px] font-bold text-slate-400 mt-1 italic tracking-tighter">Re-engajar</span>}
      </div>
    </motion.div>
  );
}

function MetricItem({ label, value, icon, highlight }: { label: string, value: string | number, icon: React.ReactNode, highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border ${highlight
      ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className={`text-[10px] font-bold uppercase tracking-wider ${highlight ? 'text-green-700 dark:text-green-400' : 'text-slate-500'}`}>{label}</span>
      </div>
      <div className={`text-2xl font-black ${highlight ? 'text-green-700 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>{value}</div>
    </div>
  );
}

function MousePointer2(props: any) {
    return (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l7.07 17 2.51-7.39L21 11.07z"/><path d="M13 13l6 6"/></svg>
    )
}