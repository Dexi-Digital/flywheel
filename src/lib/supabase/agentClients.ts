import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AgentsConfig } from "./agents";

const browserClients = new Map<string, SupabaseClient>();

export function getBrowserTenantClient(agentId: string, cfg: AgentsConfig) {
  const cached = browserClients.get(agentId);
  if (cached) return cached;

  const client = createClient(cfg.supabaseUrl, cfg.anonKey, {
    auth: {
      persistSession: true,
      storageKey: `sb-${agentId}-auth`,
    },
  });

  browserClients.set(agentId, client);
  return client;
}