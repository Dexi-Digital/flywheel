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
    'Em Negociacao': KanbanClient[];
    'Em Aberto': KanbanClient[];
  };
  meta: {
    'Recuperado': KanbanMeta;
    'Em Negociacao': KanbanMeta;
    'Em Aberto': KanbanMeta;
  };
}

export type KanbanStage = 'Recuperado' | 'Em Negociacao' | 'Em Aberto';

// Cache em memória
let cachedData: KanbanApiResponse | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 segundos

// Endpoint: RPC do projeto TGV/Vitor (get_kanban_status_json_with_meta)
const KANBAN_ENDPOINT = 'https://wwiwuorpmltzutzisgin.supabase.co/rest/v1/rpc/get_kanban_status_json_with_meta';

// Status garantidos (mesmo se vazios) - Removido "Promessa de Pagamento"
const STATUSES: KanbanStage[] = ['Recuperado', 'Em Negociacao', 'Em Aberto'];

/**
 * Chave anon do projeto do Vitor (TGV). O Kanban usa esse projeto.
 * Fallback para NEXT_PUBLIC_SUPABASE_ANON_KEY se não houver variável específica.
 */
function getKanbanAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_VITOR ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  );
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
    console.error(
      '[KanbanAPI] NEXT_PUBLIC_SUPABASE_ANON_KEY_VITOR não definida. Defina na Vercel e faça redeploy (NEXT_PUBLIC_* é embutida no build).'
    );
  }

  const doFetch = async (): Promise<Response> => {
    return fetch(KANBAN_ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey, // Supabase Edge Functions também requerem apikey header
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
      'Erro de autenticação no Kanban. Verifique se NEXT_PUBLIC_SUPABASE_ANON_KEY_VITOR está definida na Vercel e faça redeploy.'
    );
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    console.error('[KanbanAPI] Erro HTTP:', response.status, errorBody);
    throw new Error(`Erro ao carregar dados do Kanban (HTTP ${response.status})`);
  }

  let data: KanbanApiResponse;
  try {
    // Supabase RPC pode retornar diferentes formatos:
    // 1. { kanban: {...}, meta: {...} } direto
    // 2. { kanban_json: { kanban: {...}, meta: {...} } }
    // 3. [{ kanban_json: {...} }] (array)
    const rawResponse = await response.json();

    // Normalizar resposta para extrair o objeto principal
    let raw: any;
    if (Array.isArray(rawResponse) && rawResponse[0]?.kanban_json) {
      raw = rawResponse[0].kanban_json;
    } else if (rawResponse?.kanban_json) {
      raw = rawResponse.kanban_json;
    } else {
      raw = rawResponse;
    }

    console.log('[KanbanAPI] Raw data keys:', Object.keys(raw || {}));

    // Função para mapear f1/f2/f3 para id_cliente/nome_cliente/valor_recuperado
    const mapItems = (items: Array<{ f1: string; f2: string | null; f3: number }> | undefined): KanbanClient[] => {
      if (!items || !Array.isArray(items)) return [];
      return items.map((it) => ({
        id_cliente: it.f1 || '',
        nome_cliente: it.f2 ?? null,
        valor_recuperado: Number(it.f3) || 0,
      }));
    };

    // Extrair meta de cada status
    const getMeta = (status: string): KanbanMeta => {
      const m = raw?.meta?.[status];
      return {
        count: Number(m?.count ?? 0),
        total_recuperado: Number(m?.total_recuperado ?? 0),
      };
    };

    // Construir resposta garantindo todas as colunas
    const kanban: Record<string, KanbanClient[]> = {};
    const meta: Record<string, KanbanMeta> = {};

    for (const status of STATUSES) {
      kanban[status] = mapItems(raw?.kanban?.[status]);
      meta[status] = getMeta(status);
    }

    // Incluir outros status que possam vir do banco
    if (raw?.kanban) {
      for (const status of Object.keys(raw.kanban)) {
        if (!STATUSES.includes(status as KanbanStage)) {
          kanban[status] = mapItems(raw.kanban[status]);
          meta[status] = getMeta(status);
        }
      }
    }

    data = {
      kanban: kanban as KanbanApiResponse['kanban'],
      meta: meta as KanbanApiResponse['meta'],
    };

    console.log('[KanbanAPI] Parsed counts:', Object.entries(meta).map(([k, v]) => `${k}: ${v.count}`).join(', '));
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
      'Em Negociacao': [],
      'Em Aberto': [],
    },
    meta: {
      'Recuperado': { count: 0, total_recuperado: 0 },
      'Em Negociacao': { count: 0, total_recuperado: 0 },
      'Em Aberto': { count: 0, total_recuperado: 0 },
    },
  };
}

/**
 * Calcula totais globais a partir dos metadados
 */
export function calculateTotals(meta: KanbanApiResponse['meta']) {
  const stages: KanbanStage[] = ['Recuperado', 'Em Negociacao', 'Em Aberto'];

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

