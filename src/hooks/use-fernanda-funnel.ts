'use client';

import { useCallback, useEffect, useState } from 'react';
import { getFernandaFunnelMetrics } from '@/services/fernanda.service';
import type { FernandaFunnelKPI } from '@/types/fernanda-api.types';

interface UseFernandaFunnelOptions {
  /** Se true, busca os dados automaticamente ao montar o componente (default: true) */
  autoFetch?: boolean;
  /** Intervalo em ms para refresh automático. Se não definido, não faz refresh automático */
  refreshInterval?: number;
}

interface UseFernandaFunnelReturn {
  /** Dados do funil de conversão */
  data: FernandaFunnelKPI | null;
  /** Indica se está carregando os dados */
  loading: boolean;
  /** Indica se está fazendo refresh (após o carregamento inicial) */
  refreshing: boolean;
  /** Mensagem de erro, se houver */
  error: string | null;
  /** Função para buscar/atualizar os dados manualmente */
  refresh: () => Promise<void>;
}

/**
 * Hook para consumir as métricas do Funil de Conversão da Fernanda.
 *
 * @param options - Opções de configuração do hook
 * @returns Objeto com dados, estados de loading/error e função de refresh
 *
 * @example
 * // Uso básico (auto-fetch habilitado)
 * const { data, loading, error } = useFernandaFunnel();
 *
 * @example
 * // Com refresh automático a cada 30 segundos
 * const { data, loading, refresh } = useFernandaFunnel({
 *   refreshInterval: 30000,
 * });
 *
 * @example
 * // Sem auto-fetch (fetch manual)
 * const { data, loading, refresh } = useFernandaFunnel({ autoFetch: false });
 * // Chamar refresh() quando necessário
 */
export function useFernandaFunnel(
  options: UseFernandaFunnelOptions = {}
): UseFernandaFunnelReturn {
  const { autoFetch = true, refreshInterval } = options;

  const [data, setData] = useState<FernandaFunnelKPI | null>(null);
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

      const result = await getFernandaFunnelMetrics();

      if (result) {
        setData(result);
      } else {
        setError('Não foi possível carregar as métricas do funil');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      console.error('[useFernandaFunnel] Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto-fetch ao montar o componente
  useEffect(() => {
    if (autoFetch) {
      fetchData(false);
    }
  }, [autoFetch, fetchData]);

  // Refresh automático (se configurado)
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      fetchData(true);
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, fetchData]);

  // Função de refresh exposta para o componente
  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh,
  };
}

