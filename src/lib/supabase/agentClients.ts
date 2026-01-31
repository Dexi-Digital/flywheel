import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AgentsConfig } from "./agents";

const browserClients = new Map<string, SupabaseClient>();

export function getBrowserTenantClient(agentId: string, cfg: AgentsConfig) {
  const cached = browserClients.get(agentId);
  if (cached) return cached;

  if (!cfg.supabaseUrl || !cfg.anonKey) {
    console.error(`❌ Erro de configuração para o agente ${agentId}: supabaseUrl ou anonKey ausentes.`);
    throw new Error(`Configuração do Supabase ausente para o agente ${agentId}. Verifique as variáveis de ambiente.`);
  }

  console.log(`🔌 Conectando ao contexto: ${cfg.context || 'default'} para o agente ${agentId}`);
  
  const client = createClient(cfg.supabaseUrl, cfg.anonKey, {
    auth: {
      persistSession: true,
      storageKey: `sb-${agentId}-auth`,
    },
  });

  browserClients.set(agentId, client);
  return client;
}
