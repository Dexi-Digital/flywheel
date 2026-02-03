// components/opr/utils.ts

export type RevenueFunction = 'INBOUND' | 'OUTBOUND' | 'CONVERSION' | 'RETENTION' | 'RECOVERY' | 'COLLECTION';
export type PressureLevel = 'STABLE' | 'ATTENTION' | 'RISK' | 'CRITICAL';

export interface FunctionMetrics {
  function: RevenueFunction;
  agentId: string;
  label: string;

  // Dados de Pressão (Negativo)
  activeLeads: number;
  stalledLeads: number;
  avgIdleTimeMinutes: number;
  slaMinutes: number;
  pipelineValue: number;
  revenueAtRisk: number;
  ottoInterventionsLast24h: number;
  overflowActive: boolean;

  // Dados de Impacto (Positivo - NOVO)
  revenueRecovered: number; // R$ Já salvo
  leadsEngaged: number; // Leads que responderam/avançaram
  conversionRate: number; // %
}

export interface ComputedSegment {
  id: string;
  metric: FunctionMetrics;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  color: string;
  pressureScore: number;
  isDistorted: boolean;
}

const BASE_RADIUS = 120;
const MAX_THICKNESS = 60;
const MIN_THICKNESS = 20;

const COLORS = {
  STABLE: '#10b981',
  ATTENTION: '#f59e0b',
  RISK: '#f43f5e',
  CRITICAL: '#be123c',
};

// Configuração de Cores DUAL
export const THEMES = {
  RISK: {
    STABLE: '#3b82f6',    // Blue (Neutro)
    ATTENTION: '#f59e0b', // Amber
    RISK: '#f43f5e',      // Rose
    CRITICAL: '#be123c',  // Red Dark
    CENTER_BG: '#0f172a', // Slate 900
    GLOW: 'rgba(244, 63, 94, 0.4)'
  },
  IMPACT: {
    LOW: '#64748b',       // Slate (Baixo impacto ainda)
    GOOD: '#10b981',      // Emerald
    HIGH: '#0ea5e9',      // Sky Blue
    EXCEPTIONAL: '#eab308', // Gold
    CENTER_BG: '#022c22', // Emerald 950 (Fundo rico)
    GLOW: 'rgba(16, 185, 129, 0.4)'
  }
};

export function calculatePressure(m: FunctionMetrics): number {
  const timePressure = m.slaMinutes > 0 ? m.avgIdleTimeMinutes / m.slaMinutes : 0;
  const operationalScore =
    ((m.stalledLeads / (m.activeLeads || 1)) * 0.4) +
    (timePressure * 0.4) +
    (m.ottoInterventionsLast24h > 0 ? 0.2 : 0);
  return Math.min(operationalScore, 1.5);
}

export function getPressureLevel(score: number): PressureLevel {
  if (score < 0.4) return 'STABLE';
  if (score < 0.7) return 'ATTENTION';
  if (score < 1.0) return 'RISK';
  return 'CRITICAL';
}

export function getSegmentColor(level: PressureLevel): string {
  return COLORS[level];
}

// Nova função para calcular cor baseada no MODO
export function getSegmentStyle(m: FunctionMetrics, mode: 'RISK' | 'IMPACT') {
  if (mode === 'RISK') {
    // Lógica antiga de pressão
    const pressure = calculatePressure(m); // sua função existente
    if (pressure > 1.0) return THEMES.RISK.CRITICAL;
    if (pressure > 0.7) return THEMES.RISK.RISK;
    if (pressure > 0.4) return THEMES.RISK.ATTENTION;
    return THEMES.RISK.STABLE;
  } else {
    // Lógica nova de IMPACTO
    // Exemplo: Se recuperou muito dinheiro, fica Dourado/Verde
    if (m.revenueRecovered > 100000) return THEMES.IMPACT.EXCEPTIONAL;
    if (m.revenueRecovered > 50000) return THEMES.IMPACT.HIGH;
    if (m.revenueRecovered > 0) return THEMES.IMPACT.GOOD;
    return THEMES.IMPACT.LOW;
  }
}

export function calculateWeight(m: FunctionMetrics): number {
  return (m.revenueAtRisk * 0.6) + (m.pipelineValue * 0.4);
}

export function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

export function describeArc(x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, outerRadius, endAngle);
  const end = polarToCartesian(x, y, outerRadius, startAngle);
  const start2 = polarToCartesian(x, y, innerRadius, endAngle);
  const end2 = polarToCartesian(x, y, innerRadius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", start.x, start.y,
    "A", outerRadius, outerRadius, 0, largeArcFlag, 0, end.x, end.y,
    "L", end2.x, end2.y,
    "A", innerRadius, innerRadius, 0, largeArcFlag, 1, start2.x, start2.y,
    "Z"
  ].join(" ");
}

export function computeSegments(metrics: FunctionMetrics[], totalRevenueAtRisk: number): ComputedSegment[] {
  const totalWeight = metrics.reduce((acc, m) => acc + calculateWeight(m), 0) || 1;
  let currentAngle = 0;

  return metrics.map(m => {
    const weight = calculateWeight(m);
    const pressure = calculatePressure(m);
    const angleSize = (weight / totalWeight) * 360;
    const riskFactor = totalRevenueAtRisk > 0 ? (m.revenueAtRisk / totalRevenueAtRisk) : 0;
    const addedThickness = MIN_THICKNESS + (riskFactor * (MAX_THICKNESS - MIN_THICKNESS));

    const segment: ComputedSegment = {
      id: m.function,
      metric: m,
      startAngle: currentAngle,
      endAngle: currentAngle + angleSize,
      innerRadius: BASE_RADIUS,
      outerRadius: BASE_RADIUS + addedThickness,
      color: getSegmentColor(getPressureLevel(pressure)), // Pode ser ignorada no modo IMPACT
      pressureScore: pressure,
      isDistorted: m.overflowActive
    };

    currentAngle += angleSize;
    return segment;
  });
}
