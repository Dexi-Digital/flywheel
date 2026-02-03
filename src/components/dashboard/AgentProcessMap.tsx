'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ArrowRight, Activity, Users, DollarSign, RefreshCw, Zap, MessageSquare, ShieldCheck, Clock } from 'lucide-react';
import type { Agent } from '@/types/database.types';

// Tipagem simplificada para os KPIs recebidos do pai
interface ProcessMapProps {
    agents: Record<string, Agent | null>;
    kpis: any; // Tipagem frouxa proposital para flexibilidade
    onSelectAgent: (id: string) => void;
}

const AGENT_SPECS = {
    'agent-alice': {
        role: 'BDR - Expansão & Hunter',
        color: 'bg-blue-500',
        border: 'border-blue-500/30',
        lightBg: 'bg-blue-500/5',
        icon: Zap,
        description: 'Prospecção Ativa & Cold Outreach',
        brain: ['Hiper-Personalização', 'Cadência Anti-Ban', 'Foco em ICP Corporativo'],
        kpi: 'Leads Contatados',
        kpiField: (data: any) => data.alice?.contatados || 0
    },
    'agent-luis': {
        role: 'SDR - Qualificação Inbound',
        color: 'bg-cyan-500',
        border: 'border-cyan-500/30',
        lightBg: 'bg-cyan-500/5',
        icon: Clock,
        description: 'Speed to Lead & Triagem',
        brain: ['Raciocínio Abdutivo', ' Qualificação BANT', 'Atendimento < 60s'],
        kpi: 'Leads Triados',
        kpiField: (data: any) => data.luis?.total_leads_hoje || 0
    },
    'agent-fernanda': {
        role: 'Win-back & Recuperação',
        color: 'bg-amber-500',
        border: 'border-amber-500/30',
        lightBg: 'bg-amber-500/5',
        icon: RefreshCw,
        description: 'Inteligência de Vendas Perdidas',
        brain: ['Análise de Causa Raiz', 'Memória Contextual', 'Reconversão'],
        kpi: 'Resgatados',
        kpiField: (data: any) => data.fernanda?.base_total || 0 // Usando base como proxy de volume
    },
    'agent-angela': {
        role: 'CSM - Retenção & Farming',
        color: 'bg-purple-500',
        border: 'border-purple-500/30',
        lightBg: 'bg-purple-500/5',
        icon: Users,
        description: 'Relacionamento & LTV',
        brain: ['Tom Profissional', 'Detecção de Upgrade', 'Resgate de Inativos'],
        kpi: 'Atendimentos',
        kpiField: (data: any) => data.angela?.total_atendimentos || 0
    },
    'agent-vitor': {
        role: 'Closer - Fechamento',
        color: 'bg-emerald-500',
        border: 'border-emerald-500/30',
        lightBg: 'bg-emerald-500/5',
        icon: DollarSign,
        description: 'Negociação & Contratos',
        brain: ['Matriz de Timing', 'Gestão de Funil', 'Transbordo Inteligente'],
        kpi: 'Em Negociação',
        kpiField: (data: any) => data.vitor?.em_negociacao || 0
    }
};

// Ordem visual do fluxo
const FLOW_ORDER = ['agent-alice', 'agent-luis', 'agent-vitor', 'agent-angela', 'agent-fernanda'];

export function AgentProcessMap({ agents, kpis, onSelectAgent }: ProcessMapProps) {
    return (
        <div className="w-full relative py-8 px-2 overflow-x-auto">
            {/* Background Connector Line */}
            <div className="absolute top-1/2 left-10 right-10 h-1 bg-slate-800 -z-10 hidden md:block" />

            <div className="flex flex-col md:flex-row items-stretch justify-between gap-6 min-w-[800px]">
                {FLOW_ORDER.map((id, index) => {
                    const spec = AGENT_SPECS[id as keyof typeof AGENT_SPECS];
                    const agent = agents[id];
                    const kpiValue = spec.kpiField(kpis);

                    if (!spec) return null;

                    return (
                        <div key={id} className="relative flex-1 group">
                            {/* Arrow Connector (Mobile/Vertical) */}
                            {index < FLOW_ORDER.length - 1 && (
                                <div className="absolute left-1/2 bottom-[-24px] -translate-x-1/2 md:hidden text-slate-600">
                                    <ArrowRight className="w-6 h-6 rotate-90" />
                                </div>
                            )}
                            {/* Arrow Connector (Desktop) */}
                            {index < FLOW_ORDER.length - 1 && (
                                <div className="hidden md:flex absolute top-1/2 -right-4 -translate-y-1/2 z-0 text-slate-600">
                                    <ArrowRight className="w-6 h-6" />
                                </div>
                            )}

                            <motion.div
                                whileHover={{ y: -5 }}
                                onClick={() => onSelectAgent(id)}
                                className={cn(
                                    "h-full relative flex flex-col bg-slate-900/80 backdrop-blur border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-2xl",
                                    spec.border,
                                    spec.lightBg
                                )}
                            >
                                {/* Header Color Strip */}
                                <div className={cn("h-1 w-full", spec.color)} />

                                <div className="p-5 flex flex-col h-full">
                                    {/* Header: Avatar & Name */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <Avatar name={agent?.nome || spec.role} className="ring-2 ring-white/10" />
                                        <div>
                                            <h4 className="text-sm font-black uppercase text-white tracking-widest leading-none mb-1">
                                                {agent?.nome || id.replace('agent-', '')}
                                            </h4>
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full text-white/90 w-fit block", spec.color)}>
                                                {spec.role.split(' - ')[0]}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-xs text-slate-400 font-medium mb-4 italic border-b border-white/5 pb-3">
                                        "{spec.description}"
                                    </p>

                                    {/* Brain Features (Bullet Points) */}
                                    <ul className="space-y-2 mb-6 flex-grow">
                                        {spec.brain.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2 text-[10px] text-slate-300">
                                                <ShieldCheck className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
                                                <span className="leading-tight">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Footer KPI */}
                                    <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[10px] uppercase font-bold text-slate-500">{spec.kpi}</span>
                                        <span className={cn("text-lg font-black", spec.color.replace('bg-', 'text-'))}>
                                            {kpiValue}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
