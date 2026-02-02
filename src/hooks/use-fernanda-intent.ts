'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getFernandaIntentDistribution } from '@/services/fernanda.service';
import type { FernandaIntentStat } from '@/types/fernanda-api.types';

/** Mapeamento de cores por tipo de intenção */
export const INTENT_COLORS: Record<string, string> = {
  // Quentes (Verde/Azul)
  'Compra Imediata': '#22c55e',
  'Negociando': '#3b82f6',
  'Fechamento': '#10b981',
  // Mornas (Amarelo/Laranja)
  'Pesquisando': '#eab308',
  'Interessado': '#f97316',
  'Avaliando': '#f59e0b',
  // Frias (Cinza)
  'Sem Interesse': '#6b7280',
  'Indefinido': '#9ca3af',
  'Desistiu': '#71717a',
};

/** Cor padrão para intenções não mapeadas */
export const DEFAULT_INTENT_COLOR = '#a1a1aa';

interface UseFernandaIntentOptions {
  /** Se true, busca os dados automaticamente ao montar (default: true) */
  autoFetch?: boolean;
  /** Intervalo em ms para refresh automático */
  refreshInterval?: number;
  /** Se true, ordena por total decrescente (default: true) */
  sortByTotal?: boolean;
}

interface UseFernandaIntentReturn {
  /** Dados da distribuição de intenções */
  data: FernandaIntentStat[];
  /** Dados com cores para uso direto em gráficos */
  dataWithColors: Array<FernandaIntentStat & { fill: string }>;
  /** Indica se está carregando */
  loading: boolean;
  /** Indica se está fazendo refresh */
  refreshing: boolean;
  /** Mensagem de erro, se houver */
  error: string | null;
  /** Função para buscar/atualizar os dados */
  refresh: () => Promise<void>;
  /** Total de leads na distribuição */
  totalLeads: number;
  /** Intenção mais comum */
  topIntent: string | null;
}

/**
 * Hook para consumir a distribuição de intenções da Fernanda.
 *
 * @param options - Opções de configuração
 * @returns Dados, estados e métricas calculadas
 *
 * @example
 * const { dataWithColors, topIntent } = useFernandaIntent();
 *
 * <PieChart>
 *   <Pie data={dataWithColors} dataKey="total" nameKey="intencao" />
 * </PieChart>
 */
export function useFernandaIntent(
  options: UseFernandaIntentOptions = {}
): UseFernandaIntentReturn {
  const { autoFetch = true, refreshInterval, sortByTotal = true } = options;

  const [rawData, setRawData] = useState<FernandaIntentStat[]>([]);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = await getFernandaIntentDistribution();

      if (result !== null) {
        setRawData(result);
      } else {
        setError('Não foi possível carregar a distribuição de intenções');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      console.error('[useFernandaIntent] Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchData(false);
    }
  }, [autoFetch, fetchData]);

  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;
    const intervalId = setInterval(() => fetchData(true), refreshInterval);
    return () => clearInterval(intervalId);
  }, [refreshInterval, fetchData]);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Dados ordenados
  const data = useMemo(() => {
    if (!sortByTotal) return rawData;
    return [...rawData].sort((a, b) => b.total - a.total);
  }, [rawData, sortByTotal]);

  // Dados com cores para gráficos
  const dataWithColors = useMemo(() => {
    return data.map((item) => ({
      ...item,
      fill: INTENT_COLORS[item.intencao] ?? DEFAULT_INTENT_COLOR,
    }));
  }, [data]);

  // Métricas
  const totalLeads = useMemo(() => {
    return data.reduce((sum, item) => sum + item.total, 0);
  }, [data]);

  const topIntent = useMemo(() => {
    if (data.length === 0) return null;
    return data[0].intencao;
  }, [data]);

  return {
    data,
    dataWithColors,
    loading,
    refreshing,
    error,
    refresh,
    totalLeads,
    topIntent,
  };
}

