export type AgentsConfig = {
    supabaseUrl: string;
    anonKey: string;
  };
  
  const AGENTS_ACCESS: Record<string, AgentsConfig> = {
    'agent-luis': {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_LUIS ?? '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_LUIS ?? '',
    },
    'agent-alice': {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_ALICE ?? '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_ALICE ?? '',
    },
    'agent-iza': {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_IZA ?? '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_IZA ?? '',
    },
    'agent-fernanda': {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_FERNANDA ?? '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_FERNANDA ?? '',
    },
    'agent-angela': {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_ANGELA ?? '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_ANGELA ?? '',
    },
    'agent-victor': {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_VICTOR ?? '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_VICTOR ?? '',
    },
  };

  export function getTenantConfig(agentId: string): AgentsConfig {
    const cfg = AGENTS_ACCESS[agentId];
    if (!cfg) throw new Error(`Unknown agentId: ${agentId}`);
    return cfg;
  }
  