'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type HeatmapDataPoint = {
    x: string; // Ex: "08:00", "SEG"
    y: string; // Ex: "SEG", "Alice"
    value: number;
    label?: string; // Texto customizado para tooltip
};

interface EfficiencyHeatmapProps {
    title: string;
    data: HeatmapDataPoint[];
    xLabels: string[]; // Ordem das colunas
    yLabels: string[]; // Ordem das linhas
    variant?: 'success' | 'danger' | 'warning' | 'info'; // Tema de cor
    metricLabel?: string; // Ex: "Leads", "Vendas"
}

// Configuração de Cores (Base colors do Tailwind)
const VARIANTS = {
    success: { base: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500/20' }, // Bom (Vendas)
    danger: { base: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500/20' },     // Ruim (Erros)
    warning: { base: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500/20' },   // Atenção (Latência)
    info: { base: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500/20' },       // Neutro (Volume)
};

export function EfficiencyHeatmap({
    title,
    data,
    xLabels,
    yLabels,
    variant = 'info',
    metricLabel = 'Valor'
}: EfficiencyHeatmapProps) {
    const [hoveredCell, setHoveredCell] = useState<{ x: string, y: string, value: number } | null>(null);

    // 1. Calcular Max Value para normalizar a opacidade (0 a 1)
    const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);

    // 2. Helper para pegar o valor de uma célula específica
    const getValue = (x: string, y: string) => data.find(d => d.x === x && d.y === y)?.value || 0;

    const theme = VARIANTS[variant];

    return (
        <div className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">{title}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Menos</span>
                    <div className={`w-16 h-2 rounded-full bg-gradient-to-r from-slate-800 to-${theme.base.replace('bg-', '')}`} />
                    <span>Mais</span>
                </div>
            </div>

            <div className="relative overflow-x-auto">
                {/* Container da Grid */}
                <div
                    className="grid gap-1 min-w-[600px]"
                    style={{
                        gridTemplateColumns: `auto repeat(${xLabels.length}, 1fr)`
                    }}
                >
                    {/* Header das Colunas (X-Axis) */}
                    <div className="h-6" /> {/* Célula vazia no canto superior esquerdo */}
                    {xLabels.map(label => (
                        <div key={label} className="text-[10px] font-mono text-slate-500 text-center uppercase">
                            {label}
                        </div>
                    ))}

                    {/* Linhas (Y-Axis + Células) */}
                    {yLabels.map(yLabel => (
                        <React.Fragment key={yLabel}>
                            {/* Label da Linha */}
                            <div className="text-[10px] font-bold text-slate-400 flex items-center pr-2 h-8">
                                {yLabel}
                            </div>

                            {/* Células */}
                            {xLabels.map(xLabel => {
                                const value = getValue(xLabel, yLabel);
                                const intensity = value / maxValue; // 0.0 a 1.0
                                const isZero = value === 0;

                                return (
                                    <div
                                        key={`${xLabel}-${yLabel}`}
                                        className="relative h-8 w-full group"
                                        onMouseEnter={() => setHoveredCell({ x: xLabel, y: yLabel, value })}
                                        onMouseLeave={() => setHoveredCell(null)}
                                    >
                                        <motion.div
                                            initial={false}
                                            className={cn(
                                                "w-full h-full rounded-sm transition-colors duration-300 border border-transparent",
                                                isZero ? "bg-slate-800/50" : theme.base
                                            )}
                                            style={{ opacity: isZero ? 1 : Math.max(intensity, 0.1) }}
                                            whileHover={{ scale: 1.1, zIndex: 10, borderColor: '#fff' }}
                                        />
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>

                {/* Tooltip Fixo no Rodapé da Grid (Mais limpo para Dashboards densos) */}
                <div className="h-8 mt-2 flex items-center justify-end text-xs font-mono">
                    {hoveredCell ? (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 bg-slate-800 px-3 py-1 rounded-full border border-slate-700"
                        >
                            <span className="text-slate-400">{hoveredCell.y} • {hoveredCell.x}</span>
                            <span className={`font-bold ${theme.text}`}>
                                {hoveredCell.value} {metricLabel}
                            </span>
                        </motion.div>
                    ) : (
                        <span className="text-slate-600">Passe o mouse para detalhar</span>
                    )}
                </div>
            </div>
        </div>
    );
}
