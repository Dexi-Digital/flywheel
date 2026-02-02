'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getFernandaActivityTimeline } from '@/services/fernanda.service';
import type { FernandaTimelineItem } from '@/types/fernanda-api.types';

interface UseFernandaTimelineOptions {
  /** Se true, busca os dados automaticamente ao montar o componente (default: true) */
  autoFetch?: boolean;
  /** Intervalo em ms para refresh automático */
  refreshInterval?: number;
  /** Se true, preenche gaps de datas com total_conversas = 0 (default: false) */
  fillGaps?: boolean;
}

interface UseFernandaTimelineReturn {
  /** Dados da timeline (ordenados por data) */
  data: FernandaTimelineItem[];
  /** Indica se está carregando os dados */
  loading: boolean;
  /** Indica se está fazendo refresh */
  refreshing: boolean;
  /** Mensagem de erro, se houver */
  error: string | null;
  /** Função para buscar/atualizar os dados manualmente */
  refresh: () => Promise<void>;
  /** Total de conversas no período */
  totalConversas: number;
  /** Média diária de conversas */
  mediaDiaria: number;
}

/**
 * Preenche gaps de datas entre o primeiro e último item da timeline.
 * Útil para gráficos contínuos onde dias sem atividade devem aparecer como zero.
 */
function fillDateGaps(items: FernandaTimelineItem[]): FernandaTimelineItem[] {
  if (items.length < 2) return items;

  const sorted = [...items].sort((a, b) => a.data.localeCompare(b.data));
  const result: FernandaTimelineItem[] = [];
  const dateMap = new Map(sorted.map((item) => [item.data, item.total_conversas]));

  const startDate = new Date(sorted[0].data);
  const endDate = new Date(sorted[sorted.length - 1].data);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    result.push({
      data: dateStr,
      total_conversas: dateMap.get(dateStr) ?? 0,
    });
  }

  return result;
}

/**
 * Hook para consumir a timeline de atividade da Fernanda.
 *
 * @param options - Opções de configuração do hook
 * @returns Objeto com dados, estados e métricas calculadas
 *
 * @example
 * // Uso básico para gráfico
 * const { data, loading } = useFernandaTimeline();
 *
 * @example
 * // Com preenchimento de gaps para gráfico contínuo
 * const { data } = useFernandaTimeline({ fillGaps: true });
 */
export function useFernandaTimeline(
  options: UseFernandaTimelineOptions = {}
): UseFernandaTimelineReturn {
  const { autoFetch = true, refreshInterval, fillGaps = false } = options;

  const [rawData, setRawData] = useState<FernandaTimelineItem[]>([]);
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

      const result = await getFernandaActivityTimeline();

      if (result !== null) {
        setRawData(result);
      } else {
        setError('Não foi possível carregar a timeline de atividade');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      console.error('[useFernandaTimeline] Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto-fetch ao montar
  useEffect(() => {
    if (autoFetch) {
      fetchData(false);
    }
  }, [autoFetch, fetchData]);

  // Refresh automático
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      fetchData(true);
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, fetchData]);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Dados processados (com ou sem gaps preenchidos)
  const data = useMemo(() => {
    return fillGaps ? fillDateGaps(rawData) : rawData;
  }, [rawData, fillGaps]);

  // Métricas calculadas
  const totalConversas = useMemo(() => {
    return data.reduce((sum, item) => sum + item.total_conversas, 0);
  }, [data]);

  const mediaDiaria = useMemo(() => {
    return data.length > 0 ? totalConversas / data.length : 0;
  }, [data, totalConversas]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh,
    totalConversas,
    mediaDiaria,
  };
}

