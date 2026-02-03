import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentService } from "@/types/service.type";
import { getBrowserTenantClient } from "@/lib/supabase/agentClients";
import { Lead, LeadOrigin, Event, EventType } from "@/types/database.types";
import { getTenantConfig } from "@/lib/supabase/agents";
import { buildAgentCommon } from "./common";
import type {
  AngelaKpiPulse,
  AngelaUrgentLead,
  AngelaSentimentPoint,
  AngelaProblemStat,
  AngelaGovernanceData,
  AngelaAlertLog,
} from "@/types/angela-api.types";

// Função auxiliar para fazer parse de strings no formato ROW do Postgres: (val1, "val 2", val3)
function parsePostgresRow(rowStr: string): string[] {
  if (!rowStr || rowStr.length < 2) return [];
  // Remover parênteses externos
  const cleanStr = rowStr.substring(1, rowStr.length - 1);

  const result: string[] = [''];
  let currentIdx = 0;
  let inQuotes = false;

  for (let i = 0; i < cleanStr.length; i++) {
    const char = cleanStr[i];

    if (char === '"') {
      // Se encontrar aspas duplas seguidas ("") dentro de aspas, é um escape para aspas literais
      if (inQuotes && cleanStr[i + 1] === '"') {
        result[currentIdx] += '"';
        i++; // Pular a próxima aspa
      } else {
        inQuotes = !inQuotes; // Inverter estado
      }
    } else if (char === ',' && !inQuotes) {
      // Vírgula fora de aspas separa campos
      result.push('');
      currentIdx++;
    } else {
      result[currentIdx] += char;
    }
  }

  return result;
}

// ============================================================================
// URGENT LIST - LISTA DE INCÊNDIOS
// ============================================================================

export async function getAngelaUrgentList(): Promise<AngelaUrgentLead[] | null> {
  try {
    const cfg = getTenantConfig('agent-angela');
    const sb = getBrowserTenantClient('agent-angela', cfg);

    const { data, error } = await sb.rpc('get_angela_urgent_list');

    if (error) {
      console.error('[Angela Urgent List] Erro:', error);
      return null;
    }

    if (!Array.isArray(data)) return [];

    // O retorno vem no formato [{ "get_angela_urgent_list": "(182,\"Rodolfo...\",...)" }]
    const urgentList = data.map((item: any): AngelaUrgentLead | null => {
      // Extrair a string do row. A chave é o nome da função.
      // Pode vir como get_angela_urgent_list ou diretamente se o driver já fizer unwrap (mas aqui parece que não)
      const rowString = item.get_angela_urgent_list;
      if (typeof rowString !== 'string') return null;

      const cols = parsePostgresRow(rowString);
      // Mapeamento baseado na ordem observada no SQL:
      // (id, nome, whatsapp, loja, sentimento/motivo, contatado, feedback_ia, created_at, ignored)
      // indices: 0, 1, 2, 3, 4, 5, 6, 7, 8

      return {
        id: Number(cols[0]) || 0,
        nome: cols[1] || 'Sem nome',
        whatsapp: cols[2] || '',
        loja: cols[3] || null,
        sentimento: cols[4] || null,
        // Lógica de "precisa verificação": se o campo boolean (índice 8) for 't', 'true' ou se o status (índice 5) for "Não"
        precisa_verificacao: cols[8] === 't' || cols[8] === 'true',
        resumo: cols[6] || cols[4] || '',
        problema_relatado: null,
        data_interacao: cols[7] || new Date().toISOString(),
      };
    }).filter((l): l is AngelaUrgentLead => l !== null);

    return urgentList;
  } catch (err) {
    console.error('[Angela Urgent List] Erro inesperado:', err);
    return null;
  }
}

// ============================================================================
// KPI PULSE (IGNORAR - APENAS MANTIDO PARA TIPO, MAS NÃO USADO NO DASH)
// ============================================================================
export async function getAngelaKpiPulse(): Promise<AngelaKpiPulse | null> {
  return null;
}

// ============================================================================
// SENTIMENT TIMELINE (IGNORAR)
// ============================================================================
export async function getAngelaSentimentTimeline(): Promise<AngelaSentimentPoint[] | null> {
  return [];
}

// ============================================================================
// PROBLEM STATS (IGNORAR)
// ============================================================================
export async function getAngelaProblemStats(): Promise<AngelaProblemStat[] | null> {
  return [];
}

// ============================================================================
// GOVERNANCE
// ============================================================================

export async function getAngelaGovernance(): Promise<AngelaGovernanceData | null> {
  try {
    const cfg = getTenantConfig('agent-angela');
    const sb = getBrowserTenantClient('agent-angela', cfg);

    const { data, error } = await sb.rpc('get_angela_governance');

    if (error) {
      console.error('[Angela Governance] Erro:', error);
      return null;
    }

    if (!data) return null;

    // O retorno vem envelopado: [{ "get_angela_governance": { ... } }]
    let result = data;
    if (Array.isArray(data) && data.length > 0 && data[0].get_angela_governance) {
      result = data[0].get_angela_governance;
    } else if (Array.isArray(data) && data.length > 0) {
      result = data[0];
    }

    const rawAlertas = Array.isArray(result.ultimos_alertas) ? result.ultimos_alertas : [];
    const normalizedAlertas: AngelaAlertLog[] = rawAlertas.map((a: any) => ({
      alerta: String(a.alerta || ''),
      created_at: String(a.created_at || new Date().toISOString()),
      sessionId: a.sessionId ? String(a.sessionId) : null,
    }));

    return {
      fila_tecnica: Number(result.fila_tecnica) || 0,
      perda_contexto: Number(result.perda_contexto) || 0,
      ultimos_alertas: normalizedAlertas,
    };
  } catch (err) {
    console.error('[Angela Governance] Erro inesperado:', err);
    return null;
  }
}

// ============================================================================
// SERVIÇO PRINCIPAL (COMPATIBILIDADE COM AGENTSERVICE/FACTORY)
// ============================================================================

export const angelaService: AgentService = {
  id: 'agent-angela',
  async getAgent(agentId: string) {
    // Retorna uma estrutura básica para satisfazer o contrato.
    // O dashboard novo da Angela usa os RPCs específicos acima,
    // mas a factory ainda precisa deste objeto para montar a rota ou menu.
    return buildAgentCommon(agentId, 'Angela', [], [], {
      tipo: 'GOVERNANCA',
      metricas_agregadas: {
        // Valores zerados pois a view nova busca via getAngelaGovernance
        leads_ativos: 0,
        conversoes: 0,
        receita_total: 0,
        disparos_hoje: 0,
      }
    });
  }
};