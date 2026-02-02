'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getFernandaGovernance } from '@/services/fernanda.service';
import type { FernandaGovernanceData } from '@/types/fernanda-api.types';

/** Thresholds para alertas de governança */
export const GOVERNANCE_THRESHOLDS = {
  /** Fila pendente acima deste valor = Alerta Amarelo */
  QUEUE_WARNING: 10,
  /** Taxa de intervenção acima deste valor = Alerta Vermelho */
  INTERVENTION_CRITICAL: 5,
} as const;

/** Status de saúde do sistema */
export type HealthStatus = 'healthy' | 'warning' | 'critical';

interface UseFernandaGovernanceOptions {
  /** Se true, busca os dados automaticamente ao montar (default: true) */
  autoFetch?: boolean;
  /** Intervalo em ms para refresh automático */
  refreshInterval?: number;
}

interface UseFernandaGovernanceReturn {
  /** Dados de governança */
  data: FernandaGovernanceData | null;
  /** Indica se está carregando */
  loading: boolean;
  /** Indica se está fazendo refresh */
  refreshing: boolean;
  /** Mensagem de erro, se houver */
  error: string | null;
  /** Função para buscar/atualizar os dados */
  refresh: () => Promise<void>;
  /** Status geral de saúde do sistema */
  healthStatus: HealthStatus;
  /** Se há alerta de fila represada */
  hasQueueWarning: boolean;
  /** Se há alerta crítico de intervenção */
  hasInterventionAlert: boolean;
  /** Contagem de erros recentes */
  errorCount: number;
}

/**
 * Hook para consumir os dados de governança da Fernanda.
 *
 * Fornece estados derivados para facilitar a exibição de alertas na UI.
 *
 * @param options - Opções de configuração
 * @returns Dados, estados e indicadores de saúde
 *
 * @example
 * const { data, healthStatus, hasQueueWarning } = useFernandaGovernance();
 *
 * if (healthStatus === 'critical') {
 *   showCriticalBanner();
 * }
 */
export function useFernandaGovernance(
  options: UseFernandaGovernanceOptions = {}
): UseFernandaGovernanceReturn {
  const { autoFetch = true, refreshInterval } = options;

  const [data, setData] = useState<FernandaGovernanceData | null>(null);
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

      const result = await getFernandaGovernance();

      if (result !== null) {
        setData(result);
      } else {
        setError('Não foi possível carregar os dados de governança');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      console.error('[useFernandaGovernance] Erro ao buscar dados:', err);
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

  // Indicadores derivados
  const hasQueueWarning = useMemo(() => {
    return (data?.fila_pendente ?? 0) > GOVERNANCE_THRESHOLDS.QUEUE_WARNING;
  }, [data]);

  const hasInterventionAlert = useMemo(() => {
    return (data?.taxa_intervencao ?? 0) > GOVERNANCE_THRESHOLDS.INTERVENTION_CRITICAL;
  }, [data]);

  const errorCount = useMemo(() => {
    return data?.ultimos_erros?.length ?? 0;
  }, [data]);

  const healthStatus: HealthStatus = useMemo(() => {
    if (hasInterventionAlert) return 'critical';
    if (hasQueueWarning || errorCount > 0) return 'warning';
    return 'healthy';
  }, [hasInterventionAlert, hasQueueWarning, errorCount]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh,
    healthStatus,
    hasQueueWarning,
    hasInterventionAlert,
    errorCount,
  };
}

