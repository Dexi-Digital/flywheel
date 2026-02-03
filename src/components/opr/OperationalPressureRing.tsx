'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FunctionMetrics, computeSegments, describeArc, THEMES, getSegmentStyle, RevenueFunction } from './utils';
import { AlertTriangle, Zap, Trophy, ShieldCheck, Users, Phone, Target, MessageSquare, HandCoins, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// Agent Avatars / Icons Mapping
// We can use generic icons or specific initials
const AGENT_CONFIG: Record<RevenueFunction, { icon: React.ElementType, name: string, description: string }> = {
  'INBOUND': { icon: Users, name: 'Luís', description: 'SDR / Qualificação' },
  'OUTBOUND': { icon: Phone, name: 'Alice', description: 'BDR / Prospecção' },
  'COLLECTION': { icon: HandCoins, name: 'Vítor', description: 'Cobrança / Financeiro' },
  'CONVERSION': { icon: HandCoins, name: 'Vítor', description: 'Fechamento' }, // Fallback
  'RETENTION': { icon: MessageSquare, name: 'Ângela', description: 'CS / Retenção' },
  'RECOVERY': { icon: RefreshCw, name: 'Fernanda', description: 'Winback / Recuperação' },
};

interface OPRProps {
  data: FunctionMetrics[];
  totalPipeline: number;
  totalRevenueAtRisk: number; // For Risk Mode
  totalRevenueRecovered: number; // For Impact Mode
  onSegmentClick: (agentId: string) => void;
}

type ViewMode = 'RISK' | 'IMPACT';

export function OperationalPressureRing({
  data,
  totalPipeline,
  totalRevenueAtRisk,
  totalRevenueRecovered,
  onSegmentClick
}: OPRProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>('IMPACT');

  const segments = useMemo(() => {
    return computeSegments(data, mode === 'RISK' ? totalRevenueAtRisk : totalRevenueRecovered);
  }, [data, totalRevenueAtRisk, totalRevenueRecovered, mode]);

  const centerData = mode === 'RISK'
    ? {
      value: totalRevenueAtRisk,
      label: 'Risco Sistêmico',
      subLabel: 'Leads Parados',
      color: THEMES.RISK.CRITICAL,
      icon: <AlertTriangle className="w-4 h-4 text-rose-500" />
    }
    : {
      value: totalRevenueRecovered,
      label: 'Receita Preservada',
      subLabel: 'Leads Recuperados',
      color: THEMES.IMPACT.EXCEPTIONAL,
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />
    };

  return (
    <div className="flex flex-col items-center gap-8">

      {/* 1. SWITCH */}
      <div className="flex bg-slate-900/50 p-1 rounded-full border border-slate-800 backdrop-blur-sm z-30">
        <button
          onClick={() => setMode('RISK')}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all uppercase tracking-wider",
            mode === 'RISK' ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20" : "text-slate-500 hover:text-rose-400"
          )}
        >
          <Zap className="w-3 h-3" /> Pressão
        </button>
        <button
          onClick={() => setMode('IMPACT')}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all uppercase tracking-wider",
            mode === 'IMPACT' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" : "text-slate-500 hover:text-emerald-400"
          )}
        >
          <Trophy className="w-3 h-3" /> Impacto
        </button>
      </div>

      <div className="flex flex-col xl:flex-row items-center gap-12">
        {/* 2. O ANEL */}
        <div className="relative w-[400px] h-[400px] flex items-center justify-center select-none">
          <svg width="400" height="400" viewBox="0 0 500 500" className="absolute inset-0 drop-shadow-2xl">
            <g transform="translate(250, 250)">
              {segments.map((seg) => {
                const color = getSegmentStyle(seg.metric, mode);
                const isHovered = hoveredSegment === seg.id;
                const isDistorted = mode === 'RISK' && seg.metric.overflowActive;

                return (
                  <motion.path
                    key={seg.id}
                    d={describeArc(0, 0, seg.innerRadius, seg.outerRadius, seg.startAngle, seg.endAngle)}
                    animate={{
                      fill: color,
                      scale: isHovered ? 1.05 : 1,
                      filter: isDistorted ? "url(#warp-filter)" : "none",
                      opacity: hoveredSegment && !isHovered ? 0.3 : 1
                    }}
                    transition={{ duration: 0.3 }}
                    stroke="white"
                    strokeWidth={isHovered ? 2 : 0}
                    strokeOpacity={0.2}

                    onMouseEnter={() => setHoveredSegment(seg.id)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    onClick={() => onSegmentClick(seg.metric.agentId)}
                    className="cursor-pointer"
                  />
                );
              })}
            </g>
            <defs>
              <filter id="warp-filter">
                <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="warp" />
                <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="10" in="SourceGraphic" in2="warp" />
              </filter>
            </defs>
          </svg>

          {/* CENTRO */}
          <motion.div
            className="absolute z-20 flex flex-col items-center justify-center rounded-full border-4 backdrop-blur-md transition-colors duration-500"
            style={{ width: 180, height: 180 }}
            animate={{
              backgroundColor: mode === 'RISK' ? THEMES.RISK.CENTER_BG : THEMES.IMPACT.CENTER_BG,
              borderColor: centerData.color,
              boxShadow: `0 0 40px ${centerData.color}30`
            }}
          >
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center gap-2 mb-1">
                {centerData.icon}
                <span className="text-[9px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                  {centerData.label}
                </span>
              </div>

              <div className="text-3xl font-black tabular-nums tracking-tighter" style={{ color: centerData.color }}>
                R$ {(centerData.value / 1000).toFixed(0)}k
              </div>

              <div className="text-[10px] text-slate-500 font-medium mt-2">
                {mode === 'RISK'
                  ? `${data.reduce((acc, c) => acc + c.stalledLeads, 0)} ${centerData.subLabel}`
                  : `${data.reduce((acc, c) => acc + c.leadsEngaged, 0)} ${centerData.subLabel}`
                }
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* 3. HEATMAP LEGEND (Interactive) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3 w-full max-w-sm">
          {segments.map((seg) => {
            const config = AGENT_CONFIG[seg.metric.function] || AGENT_CONFIG['INBOUND'];
            const color = getSegmentStyle(seg.metric, mode);
            const isHovered = hoveredSegment === seg.id;
            const value = mode === 'RISK' ? seg.metric.revenueAtRisk : seg.metric.revenueRecovered;
            const label = mode === 'RISK' ? 'Em Risco' : 'Recuperado';

            return (
              <div
                key={seg.id}
                onMouseEnter={() => setHoveredSegment(seg.id)}
                onMouseLeave={() => setHoveredSegment(null)}
                onClick={() => onSegmentClick(seg.metric.agentId)}
                className={cn(
                  "group flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer",
                  isHovered
                    ? "bg-slate-800/80 border-slate-700 shadow-lg scale-105"
                    : "bg-slate-900/40 border-slate-800/50 hover:bg-slate-800/60"
                )}
                style={{ borderColor: isHovered ? color : undefined }}
              >
                {/* Status Indicator / Avatar */}
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-[0_0_15px_rgba(0,0,0,0.3)] transition-colors duration-500"
                    style={{ backgroundColor: color, borderColor: color }}
                  >
                    <config.icon className="w-5 h-5 text-white mix-blend-screen" />
                  </div>
                  {seg.metric.overflowActive && mode === 'RISK' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center animate-pulse border border-slate-900">
                      <AlertTriangle className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className={cn("font-bold text-sm", isHovered ? "text-white" : "text-slate-200")}>
                      {config.name}
                    </span>
                    <span className={cn("font-mono font-bold text-xs", mode === 'RISK' ? "text-rose-400" : "text-emerald-400")}>
                      R$ {(value / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium truncate pr-2">
                      {config.description}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {label}
                    </span>
                  </div>

                  {/* Mini Progress Bar for context */}
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(value / (mode === 'RISK' ? totalRevenueAtRisk : totalRevenueRecovered)) * 100}%` }}
                      className="h-full rounded-full transition-colors duration-500"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>

      <AnimatePresence>
        {hoveredSegment && (
          <div /> // Tooltip removed in favor of side panel interaction, or keep simplified floating one? 
          // Let's keep the tooltip logic minimal if needed, but side panel is better.
          // For now, removing floating tooltip to reduce noise as requested "cleaner".
        )}
      </AnimatePresence>
    </div>
  );
}
