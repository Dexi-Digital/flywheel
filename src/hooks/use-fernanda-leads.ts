'use client';

import { useCallback, useEffect, useState } from 'react';
import { getFernandaLeadList } from '@/services/fernanda.service';
import type { FernandaLead } from '@/types/fernanda-api.types';

interface UseFernandaLeadsOptions {
  /** Se true, busca os dados automaticamente ao montar o componente (default: true) */
  autoFetch?: boolean;
  /** Intervalo em ms para refresh automático. Se não definido, não faz refresh automático */
  refreshInterval?: number;
}

interface UseFernandaLeadsReturn {
  /** Lista de leads ordenada por urgência */
  data: FernandaLead[];
  /** Indica se está carregando os dados */
  loading: boolean;
  /** Indica se está fazendo refresh (após o carregamento inicial) */
  refreshing: boolean;
  /** Mensagem de erro, se houver */
  error: string | null;
  /** Função para buscar/atualizar os dados manualmente */
  refresh: () => Promise<void>;
  /** Contagem de leads que precisam de atenção */
  countNeedingAttention: number;
  /** Contagem de leads com intenção identificada */
  countWithIntent: number;
}

/**
 * Hook para consumir a lista de oportunidades (leads) da Fernanda.
 *
 * NOTA: A ordenação já vem aplicada do banco:
 * 1º: Leads que precisam de atenção (badge vermelho)
 * 2º: Leads com intenção preenchida (badge verde/azul)
 * 3º: Leads mais recentes
 *
 * @param options - Opções de configuração do hook
 * @returns Objeto com dados, estados de loading/error, contadores e função de refresh
 *
 * @example
 * // Uso básico
 * const { data, loading, countNeedingAttention } = useFernandaLeads();
 *
 * @example
 * // Com refresh automático a cada 60 segundos
 * const { data, refreshing } = useFernandaLeads({
 *   refreshInterval: 60000,
 * });
 */
export function useFernandaLeads(
  options: UseFernandaLeadsOptions = {}
): UseFernandaLeadsReturn {
  const { autoFetch = true, refreshInterval } = options;

  const [data, setData] = useState<FernandaLead[]>([]);
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

      const result = await getFernandaLeadList();

      if (result !== null) {
        setData(result);
      } else {
        setError('Não foi possível carregar a lista de leads');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      console.error('[useFernandaLeads] Erro ao buscar dados:', err);
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

  // Contadores derivados
  const countNeedingAttention = data.filter((lead) => lead.precisa_atencao).length;
  const countWithIntent = data.filter((lead) => lead.intencao !== null && lead.intencao !== '').length;

  return {
    data,
    loading,
    refreshing,
    error,
    refresh,
    countNeedingAttention,
    countWithIntent,
  };
}

