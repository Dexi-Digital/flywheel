export type AgentsConfig = {
    supabaseUrl: string;
    anonKey: string;
    context?: 'tecnologia' | 'devforaiagents' | 'corretoraagente' | 'tgvempreendimentos';
  };
  
  const AGENTS_ACCESS: Record<string, AgentsConfig> = {
    'agent-luis': {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_LUIS ?? '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_LUIS ?? '',
      context: 'devforaiagents',
    },
    'agent-alice': {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_ALICE ?? '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_ALICE ?? '',
      context: 'tecnologia',
    },
    'agent-iza': {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_IZA ?? '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_IZA ?? '',
      context: 'corretoraagente',
    },
    'agent-fernanda': {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_FERNANDA ?? '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_FERNANDA ?? '',
      context: 'tecnologia',
    },
    'agent-angela': {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_ANGELA ?? '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_ANGELA ?? '',
      context: 'devforaiagents',
    },
    'agent-vitor': {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_VICTOR ?? '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_VICTOR ?? '',
      context: 'tgvempreendimentos',
    },
  };

  export function getTenantConfig(agentId: string): AgentsConfig {
    const cfg = AGENTS_ACCESS[agentId];
    if (!cfg) throw new Error(`Unknown agentId: ${agentId}`);

    // Validar se as variáveis de ambiente estão configuradas
    if (!cfg.supabaseUrl || cfg.supabaseUrl === '') {
      throw new Error(`Missing SUPABASE_URL for ${agentId}. Please configure environment variables in Vercel.`);
    }
    if (!cfg.anonKey || cfg.anonKey === '') {
      throw new Error(`Missing SUPABASE_ANON_KEY for ${agentId}. Please configure environment variables in Vercel.`);
    }

    return cfg;
  }
  