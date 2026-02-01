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

// Endpoint: RPC do projeto TGV/Vitor (get_kanban_status)
const KANBAN_ENDPOINT = 'https://wwiwuorpmltzutzisgin.supabase.co/rest/v1/rpc/get_kanban_status';

/**
 * Chave anon do projeto do Vitor (TGV). O Kanban usa esse projeto.
 * Fallback para NEXT_PUBLIC_SUPABASE_ANON_KEY se não houver variável específica.
 */
function getKanbanAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_VITOR ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  return key;
}

/**
 * Busca dados do Kanban via RPC do Supabase (projeto Vitor/TGV)
 * Com cache de 60s e retry em caso de erro 5xx
 */
export async function fetchKanbanData(forceRefresh = false): Promise<KanbanApiResponse> {
  // Verificar cache
  const now = Date.now();
  if (!forceRefresh && cachedData && (now - cacheTimestamp) < CACHE_TTL_MS) {
    console.log('[KanbanAPI] Retornando dados do cache');
    return cachedData;
  }

  const anonKey = getKanbanAnonKey();
  if (!anonKey) {
    console.error('[KanbanAPI] NEXT_PUBLIC_SUPABASE_ANON_KEY_VITOR (ou NEXT_PUBLIC_SUPABASE_ANON_KEY) não definida.');
  }

  const doFetch = async (): Promise<Response> => {
    return fetch(KANBAN_ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
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
    throw new Error(
      'Erro de autenticação no Kanban. Verifique se NEXT_PUBLIC_SUPABASE_ANON_KEY_VITOR está definida no ambiente (ex.: Vercel).'
    );
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    console.error('[KanbanAPI] Erro HTTP:', response.status, errorBody);
    throw new Error(`Erro ao carregar dados do Kanban (HTTP ${response.status})`);
  }

  let data: KanbanApiResponse;
  try {
    // A RPC retorna uma lista de clientes com campos: id_cliente, nome_cliente, status_kanban, motivos
    const raw = await response.json();

    // Agrupar por status
    const stages: Record<string, any[]> = {
      'Recuperado': [],
      'Promessa de Pagamento': [],
      'Em Negociacao': [],
      'Em Aberto': [],
    };

    (raw || []).forEach((row: any) => {
      const status = row.status_kanban || 'Em Aberto';
      const key = status === 'Em Aberto' ? 'Em Aberto' : (status === 'Promessa de Pagamento' ? 'Promessa de Pagamento' : (status === 'Recuperado' ? 'Recuperado' : 'Em Negociacao'));
      stages[key] = stages[key] || [];
      stages[key].push({
        id_cliente: row.id_cliente,
        nome_cliente: row.nome_cliente,
        valor_recuperado: Number(row.valor_recuperado) || 0,
        motivos: Array.isArray(row.motivos) ? row.motivos : [],
      });
    });

    // Montar meta com contagens e total recuperado (somando valor_recuperado se presente)
    const meta = Object.keys(stages).reduce((acc: any, k: string) => {
      const list = stages[k] || [];
      acc[k] = {
        count: list.length,
        total_recuperado: list.reduce((s: number, it: any) => s + (Number(it.valor_recuperado) || 0), 0),
      };
      return acc;
    }, {} as any);

    data = {
      kanban: {
        'Recuperado': stages['Recuperado'] as any[],
        'Promessa de Pagamento': stages['Promessa de Pagamento'] as any[],
        'Em Negociacao': stages['Em Negociacao'] as any[],
        'Em Aberto': stages['Em Aberto'] as any[],
      },
      meta,
    };
  } catch (err) {
    console.error('[KanbanAPI] Resposta inválida/parsing error:', err);
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

