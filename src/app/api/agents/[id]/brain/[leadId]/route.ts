import { NextRequest, NextResponse } from 'next/server';
import { getBrowserTenantClient } from '@/lib/supabase/agentClients';
import { getTenantConfig } from '@/lib/supabase/agents';

interface BrainDrawerResponse {
  chatMessages: any[];
  chatSessions: any[];
  internalReasoning?: any;
  sentimento?: string;
  problema?: string;
  renegociacao?: any;
  memoryData?: any;
}

export async function GET(
  request: NextRequest,
  context: { params: any }
) {
  const params = await context.params;
  const agentId: string = params?.id;
  const leadId: string = params?.leadId;

  try {
    const config = getTenantConfig(`agent-${agentId}`);

    if (!config || !config.supabaseUrl || !config.anonKey) {
      return NextResponse.json(
        { error: `Supabase configuration not found for agent: ${agentId}` },
        { status: 404 }
      );
    }

    const client = getBrowserTenantClient(agentId, config);
    const response: BrainDrawerResponse = {
      chatMessages: [],
      chatSessions: [],
    };

    // Fetch common data for all agents
    const errors: string[] = [];

    // Fetch chat histories (dynamic table names: chat_histories_*, ai_chat_sessions)
    try {
      const chatTablesQuery = await client
        .from('information_schema.tables')
        .select('table_name')
        .like('table_name', 'chat_histories_%');

      if (chatTablesQuery.data) {
        for (const table of chatTablesQuery.data) {
          const { data, error } = await client
            .from(table.table_name)
            .select('*')
            .eq('session_id', leadId)
            .limit(50);

          if (data && data.length > 0) {
            response.chatMessages.push(...data);
          }
          if (error) {
            errors.push(`Failed to fetch from ${table.table_name}: ${error.message}`);
          }
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch chat histories for ${leadId}:`, err);
    }

    // Fetch AI chat sessions
    try {
      const { data, error } = await client
        .from('ai_chat_sessions')
        .select('*')
        .eq('session_id', leadId)
        .limit(10);

      if (data) {
        response.chatSessions = data;
      }
      if (error) {
        errors.push(`Failed to fetch ai_chat_sessions: ${error.message}`);
      }
    } catch (err) {
      console.warn('Failed to fetch ai_chat_sessions:', err);
    }

    // Fetch memoria (Memory)
    try {
      const { data, error } = await client
        .from('memoria')
        .select('*')
        .eq('session_id', leadId)
        .single();

      if (data) {
        response.memoryData = data.memoria_lead;
      }
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is expected
        errors.push(`Failed to fetch memoria: ${error.message}`);
      }
    } catch (err) {
      console.warn('Failed to fetch memoria:', err);
    }

    // Agent-specific data
    if (agentId === 'angela') {
      // Fetch sentimento + problema
      try {
        const { data, error } = await client
          .from('angela_ai_analysis')
          .select('sentimento,problema')
          .eq('session_id', leadId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          response.sentimento = data.sentimento;
          response.problema = data.problema;
        }
        if (error && error.code !== 'PGRST116') {
          errors.push(`Failed to fetch angela analysis: ${error.message}`);
        }
      } catch (err) {
        console.warn('Failed to fetch angela analysis:', err);
      }
    } else if (agentId === 'victor') {
      // Fetch tgv_renegociacao
      try {
        const { data, error } = await client
          .from('tgv_renegociacao')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          response.renegociacao = data;
        }
        if (error && error.code !== 'PGRST116') {
          errors.push(`Failed to fetch renegociacao: ${error.message}`);
        }
      } catch (err) {
        console.warn('Failed to fetch renegociacao:', err);
      }
    } else if (['fernanda', 'alice', 'iza'].includes(agentId)) {
      // Fetch internal_reasoning
      try {
        const { data, error } = await client
          .from('internal_reasoning')
          .select('*')
          .eq('session_id', leadId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          response.internalReasoning = data.reasoning_data || data;
        }
        if (error && error.code !== 'PGRST116') {
          errors.push(`Failed to fetch internal_reasoning: ${error.message}`);
        }
      } catch (err) {
        console.warn('Failed to fetch internal_reasoning:', err);
      }
    }

    // Log non-critical errors as warnings
    if (errors.length > 0) {
      console.warn(`[BrainDrawer] Non-critical errors for ${agentId}/${leadId}:`, errors);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error(`[BrainDrawer API Error] ${agentId}/${leadId}:`, error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch brain data',
        chatMessages: [],
        chatSessions: [],
      },
      { status: 500 }
    );
  }
}
