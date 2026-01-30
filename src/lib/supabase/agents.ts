export type AgentsConfig = {
    supabaseUrl: string;
    serviceRoleKey: string;
  };
  
  const AGENTS_ACCESS: Record<string, AgentsConfig> = {
    'agent-luis': {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_LUIS ?? '',
      serviceRoleKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_LUIS ?? '',
    },
    'agent-alice': {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_ALICE ?? '',
      serviceRoleKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_ALICE ?? '',
    },
    'agent-iza': {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_IZA ?? '',
      serviceRoleKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_IZA ?? '',
    },
    'agent-fernanda': {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_FERNANDA ?? '',
      serviceRoleKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_FERNANDA ?? '',
    },
    'agent-angela': {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_ANGELA ?? '',
      serviceRoleKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_ANGELA ?? '',
    },
    'agent-victor': {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_VICTOR ?? '',
      serviceRoleKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_VICTOR ?? '',
    },
  };

  export function getTenantConfig(agentId: string): AgentsConfig {
    const cfg = AGENTS_ACCESS[agentId];
    if (!cfg) throw new Error(`Unknown agentId: ${agentId}`);
    return cfg;
  }
  