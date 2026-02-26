// supabase/functions/rpc-metrics/index.ts
// Edge Function para métricas do agente Luís
// Deploy: supabase functions deploy rpc-metrics --project-ref hmlupclplkwlsnedpayi

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, params = {} } = await req.json()
    const tz = params.tz || 'America/Sao_Paulo'

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const sb = createClient(supabaseUrl, supabaseKey)

    let result: Record<string, unknown>

    switch (action) {
      case 'total_leads_today': {
        const { count, error } = await sb
          .from('Leads CRM')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart(tz))
        if (error) throw error
        result = { total_leads_today: count ?? 0 }
        break
      }

      case 'engagement_rate': {
        // Total leads today
        const { count: totalLeads, error: e1 } = await sb
          .from('Leads CRM')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart(tz))
        if (e1) throw e1

        // Leads with AI sessions today
        const { count: engaged, error: e2 } = await sb
          .from('ai_chat_sessions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart(tz))
        if (e2) throw e2

        const total = totalLeads ?? 0
        const eng = engaged ?? 0
        result = {
          engaged_count: eng,
          total_leads_today: total,
          engagement_percentage: total > 0 ? Math.round((eng / total) * 1000) / 10 : 0,
        }
        break
      }

      case 'leads_in_attendance': {
        const { count, error } = await sb
          .from('ai_chat_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
        if (error) throw error
        result = { leads_in_attendance: count ?? 0 }
        break
      }

      case 'leads_outside_business_hours': {
        const startHour = params.business_start_hour ?? 8
        const endHour = params.business_end_hour ?? 18

        // Query leads created today outside business hours
        // We use RPC to leverage timezone-aware hour extraction
        const { data, error } = await sb.rpc('count_leads_outside_hours', {
          p_date: todayStart(tz),
          p_start_hour: startHour,
          p_end_hour: endHour,
          p_tz: tz,
        })
        if (error) {
          // Fallback: count all leads today if RPC doesn't exist
          const { count, error: e2 } = await sb
            .from('Leads CRM')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', todayStart(tz))
          if (e2) throw e2
          result = { leads_outside_business_hours: count ?? 0 }
        } else {
          result = { leads_outside_business_hours: data ?? 0 }
        }
        break
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('rpc-metrics error:', err)
    return new Response(
      JSON.stringify({ error: err.message ?? 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

/** Returns ISO string for start of today in the given timezone */
function todayStart(tz: string): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
  const dateStr = formatter.format(now) // "2026-02-18"
  return `${dateStr}T00:00:00`
}

