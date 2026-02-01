/**
 * Serviço de integração com Edge Function Kanban (TGV)
 * Endpoint: GET https://wwiwuorpmltzutzisgin.supabase.co/functions/v1/kanban-endpoint
 */

// Tipos do payload da API
export interface KanbanClient {
  id_cliente: string;
  nome_cliente: string | null;
  valor_recuperado: number;
}

export interface KanbanMeta {
  count: number;
  total_recuperado: number;
}

export interface KanbanApiResponse {
  kanban: {
    'Recuperado': KanbanClient[];
    'Promessa de Pagamento': KanbanClient[];
    'Em Negociacao': KanbanClient[];
    'Em Aberto': KanbanClient[];
  };
  meta: {
    'Recuperado': KanbanMeta;
    'Promessa de Pagamento': KanbanMeta;
    'Em Negociacao': KanbanMeta;
    'Em Aberto': KanbanMeta;
  };
}

export type KanbanStage = 'Recuperado' | 'Promessa de Pagamento' | 'Em Negociacao' | 'Em Aberto';

// Cache em memória
let cachedData: KanbanApiResponse | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 segundos

const KANBAN_ENDPOINT = 'https://wwiwuorpmltzutzisgin.supabase.co/functions/v1/kanban-endpoint';

/**
 * Busca dados do Kanban via Edge Function
 * Com cache de 60s e retry em caso de erro 5xx
 */
export async function fetchKanbanData(forceRefresh = false): Promise<KanbanApiResponse> {
  // Verificar cache
  const now = Date.now();
  if (!forceRefresh && cachedData && (now - cacheTimestamp) < CACHE_TTL_MS) {
    console.log('[KanbanAPI] Retornando dados do cache');
    return cachedData;
  }

  const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  const doFetch = async (): Promise<Response> => {
    return fetch(KANBAN_ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Accept': 'application/json',
      },
    });
  };

  let response: Response;
  try {
    response = await doFetch();
    
    // Retry em caso de erro 5xx (1 tentativa com backoff de 1s)
    if (response.status >= 500) {
      console.warn('[KanbanAPI] Erro 5xx, tentando novamente em 1s...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      response = await doFetch();
    }
  } catch (err) {
    console.error('[KanbanAPI] Erro de rede:', err);
    throw new Error('Erro de conexão com o servidor. Verifique sua internet.');
  }

  // Tratar erros de autenticação
  if (response.status === 401 || response.status === 403) {
    throw new Error('Erro de autenticação. Verifique a configuração da SERVICE_ROLE_KEY.');
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    console.error('[KanbanAPI] Erro HTTP:', response.status, errorBody);
    throw new Error(`Erro ao carregar dados do Kanban (HTTP ${response.status})`);
  }

  let data: KanbanApiResponse;
  try {
    data = await response.json();
    
    // Validar estrutura da resposta
    if (!data.kanban || !data.meta) {
      throw new Error('Resposta malformada');
    }
  } catch (err) {
    console.error('[KanbanAPI] Resposta inválida:', err);
    // Fallback vazio
    data = getEmptyKanbanResponse();
  }

  // Atualizar cache
  cachedData = data;
  cacheTimestamp = now;
  console.log('[KanbanAPI] Dados atualizados e cacheados');

  return data;
}

/**
 * Retorna uma resposta vazia (fallback para erros)
 */
export function getEmptyKanbanResponse(): KanbanApiResponse {
  return {
    kanban: {
      'Recuperado': [],
      'Promessa de Pagamento': [],
      'Em Negociacao': [],
      'Em Aberto': [],
    },
    meta: {
      'Recuperado': { count: 0, total_recuperado: 0 },
      'Promessa de Pagamento': { count: 0, total_recuperado: 0 },
      'Em Negociacao': { count: 0, total_recuperado: 0 },
      'Em Aberto': { count: 0, total_recuperado: 0 },
    },
  };
}

/**
 * Calcula totais globais a partir dos metadados
 */
export function calculateTotals(meta: KanbanApiResponse['meta']) {
  const stages: KanbanStage[] = ['Recuperado', 'Promessa de Pagamento', 'Em Negociacao', 'Em Aberto'];
  
  let totalClients = 0;
  let totalRecovered = 0;

  stages.forEach(stage => {
    totalClients += meta[stage].count;
    totalRecovered += meta[stage].total_recuperado;
  });

  return { totalClients, totalRecovered };
}

/** Limpa o cache manualmente */
export function clearKanbanCache() {
  cachedData = null;
  cacheTimestamp = 0;
}

