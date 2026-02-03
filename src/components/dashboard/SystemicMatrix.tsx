'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Users, AlertTriangle, Trophy, Zap, Clock, DollarSign, Activity } from 'lucide-react';

export type MatrixMode = 'IMPACT' | 'RISK';

// Definição dos Dados da Matriz
export interface AgentMetric {
    agentId: string;
    agentName: string;
    value: number | string; // O valor exibido (ex: "R$ 50k" ou "15%")
    score: number; // 0 a 100 (Para a intensidade da cor)
    hint?: string; // NOVO CAMPO
}

export interface MatrixRow {
    id: string;
    label: string;
    icon: React.ReactNode;
    data: AgentMetric[]; // Um dado para cada agente nesta métrica
}

interface SystemicMatrixProps {
    mode: MatrixMode; // Controlado pelo pai (Dashboard)
    impactData: MatrixRow[];
    riskData: MatrixRow[];
}

export function SystemicMatrix({ mode, impactData, riskData }: SystemicMatrixProps) {
    const [hoveredCell, setHoveredCell] = useState<{ row: string, agent: string } | null>(null);

    const activeRows = mode === 'IMPACT' ? impactData : riskData;

    // Configuração de Cores Dinâmica
    const theme = mode === 'IMPACT'
        ? {
            bgHeader: 'bg-emerald-950/30',
            textHeader: 'text-emerald-400',
            cellBase: 'bg-emerald-500',
            glow: 'shadow-emerald-500/20'
        }
        : {
            bgHeader: 'bg-rose-950/30',
            textHeader: 'text-rose-400',
            cellBase: 'bg-rose-500',
            glow: 'shadow-rose-500/20'
        };

    return (
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", mode === 'IMPACT' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
                        {mode === 'IMPACT' ? <Activity className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">
                            {mode === 'IMPACT' ? 'Matriz de Eficiência' : 'Matriz de Gargalos'}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                            Comparativo sistêmico entre agentes
                        </p>
                    </div>
                </div>

                {/* Legenda de Intensidade */}
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase">
                    <span>Min</span>
                    <div className={cn("w-24 h-1.5 rounded-full bg-gradient-to-r from-slate-800", mode === 'IMPACT' ? "to-emerald-500" : "to-rose-500")} />
                    <span>Max</span>
                </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-slate-800/50">
                {/* GRID STRUCTURE */}
                <div className="grid grid-cols-[180px_repeat(5,1fr)]">

                    {/* HEADER ROW (Agents) */}
                    <div className="bg-slate-900/50 p-4 border-b border-r border-slate-800 flex items-center">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">KPIs / Agentes</span>
                    </div>
                    {activeRows[0]?.data.map((agent) => (
                        <div key={agent.agentId} className={cn("p-3 border-b border-slate-800 flex flex-col items-center justify-center transition-colors", theme.bgHeader)}>
                            <span className={cn("text-xs font-black uppercase tracking-wider", theme.textHeader)}>
                                {agent.agentName}
                            </span>
                        </div>
                    ))}

                    {/* DATA ROWS */}
                    <AnimatePresence mode='wait'>
                        {activeRows.map((row) => (
                            <React.Fragment key={`${mode}-${row.id}`}>
                                {/* Row Label (Metric) */}
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-4 border-b border-r border-slate-800 bg-slate-900/30 flex items-center gap-3"
                                >
                                    <div className="text-slate-500">{row.icon}</div>
                                    <span className="text-xs font-bold text-slate-300 uppercase">{row.label}</span>
                                </motion.div>

                                {/* Agent Cells */}
                                {row.data.map((metric) => {
                                    // Cálculo da opacidade baseada no score (0-100)
                                    const opacity = Math.max(metric.score / 100, 0.05);
                                    const isHovered = hoveredCell?.row === row.id && hoveredCell?.agent === metric.agentId;

                                    return (
                                        <div
                                            key={metric.agentId}
                                            className="relative border-b border-slate-800/50 h-16 group cursor-pointer"
                                            onMouseEnter={() => setHoveredCell({ row: row.id, agent: metric.agentId })}
                                            onMouseLeave={() => setHoveredCell(null)}
                                        >
                                            {/* Background Color Block */}
                                            <motion.div
                                                className={cn("absolute inset-1 rounded-md transition-all duration-300", theme.cellBase)}
                                                style={{ opacity: opacity }}
                                                animate={{
                                                    scale: isHovered ? 0.95 : 1,
                                                    opacity: isHovered ? opacity + 0.2 : opacity
                                                }}
                                            />

                                            {/* Value Content */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                                <span className={cn(
                                                    "text-xs font-bold drop-shadow-md",
                                                    metric.score > 50 ? "text-white" : "text-slate-300"
                                                )}>
                                                    {metric.value}
                                                </span>
                                            </div>

                                            {/* Tooltip Simplificado (Opcional) */}
                                            {isHovered && metric.score > 0 && (
                                                <motion.div
                                                    layoutId="matrix-glow"
                                                    className={cn("absolute inset-0 rounded-md border-2 border-white/20 z-20", theme.glow)}
                                                />
                                            )}

                                            {/* TOOLTIP CONTEXTUAL */}
                                            <AnimatePresence>
                                                {isHovered && metric.hint && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: -45, scale: 1 }} // Sobe para cima da célula
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="absolute left-1/2 -translate-x-1/2 z-50 w-48 pointer-events-none"
                                                    >
                                                        <div className="bg-slate-950 border border-slate-700 text-slate-200 text-[10px] p-2 rounded-lg shadow-xl leading-tight text-center relative">
                                                            {/* Seta do tooltip */}
                                                            <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-950 border-r border-b border-slate-700 rotate-45" />

                                                            {/* Conteúdo */}
                                                            <span className="font-bold block mb-0.5 text-white uppercase tracking-wider">O que é isso?</span>
                                                            {metric.hint}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
