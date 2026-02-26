-- =====================================================
-- FUNÇÕES RPC PARA O AGENTE LUÍS (SDR Híbrido / Plantão)
-- Projeto Supabase: hmlupclplkwlsnedpayi
-- Execute este script inteiro no SQL Editor do Supabase
-- =====================================================

-- 1) KPI Pulse — Pulso Geral da Operação
CREATE OR REPLACE FUNCTION get_luis_kpi_pulse()
RETURNS json AS $$
DECLARE
  v_total_leads_hoje integer;
  v_atendimentos_ia integer;
  v_leads_fora_horario integer;
  v_taxa_engajamento numeric;
BEGIN
  SELECT COUNT(*) INTO v_total_leads_hoje
  FROM "Leads CRM" WHERE created_at::date = CURRENT_DATE;

  SELECT COUNT(*) INTO v_atendimentos_ia
  FROM ai_chat_sessions WHERE created_at::date = CURRENT_DATE;

  SELECT COUNT(*) INTO v_leads_fora_horario
  FROM "Leads CRM"
  WHERE created_at::date = CURRENT_DATE
    AND (EXTRACT(HOUR FROM created_at AT TIME ZONE 'America/Sao_Paulo') < 8
         OR EXTRACT(HOUR FROM created_at AT TIME ZONE 'America/Sao_Paulo') >= 18);

  v_taxa_engajamento := CASE
    WHEN v_total_leads_hoje > 0
      THEN ROUND((v_atendimentos_ia::numeric / v_total_leads_hoje) * 100, 1)
    ELSE 0
  END;

  RETURN json_build_object(
    'total_leads_hoje', v_total_leads_hoje,
    'atendimentos_ia', v_atendimentos_ia,
    'leads_fora_horario', v_leads_fora_horario,
    'taxa_engajamento', v_taxa_engajamento
  );
END;
$$ LANGUAGE plpgsql;

-- 2) Qualification List — Top 20 leads quentes do plantão
CREATE OR REPLACE FUNCTION get_luis_qualification_list()
RETURNS TABLE (
  nome text, whatsapp text, interesse_veiculo text,
  horario_entrada timestamptz, resumo_ia text, solicitou_humano boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.nome::text, a.whatsapp::text, a.interesse_veiculo::text,
    a.created_at AS horario_entrada,
    a.resumo_interacao::text AS resumo_ia,
    COALESCE(a.solicitou_retorno, false) AS solicitou_humano
  FROM analise_interacoes_ia a
  WHERE a.interesse IN ('Alto', 'Médio')
  ORDER BY COALESCE(a.solicitou_retorno, false) DESC, a.created_at DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- 3) Traffic Heatmap — Distribuição de leads por hora (0-23h)
CREATE OR REPLACE FUNCTION get_luis_traffic_heatmap()
RETURNS TABLE (hora integer, volume bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(HOUR FROM l.created_at AT TIME ZONE 'America/Sao_Paulo')::integer AS hora,
    COUNT(*)::bigint AS volume
  FROM "Leads CRM" l
  GROUP BY EXTRACT(HOUR FROM l.created_at AT TIME ZONE 'America/Sao_Paulo')
  ORDER BY hora;
END;
$$ LANGUAGE plpgsql;

-- 4) Vehicle Interest — Top 10 veículos mais procurados
CREATE OR REPLACE FUNCTION get_luis_vehicle_interest()
RETURNS TABLE (veiculo text, total bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(UPPER(TRIM(l.modelo_veiculo)), 'NÃO ESPECIFICADO')::text AS veiculo,
    COUNT(*)::bigint AS total
  FROM "Leads CRM" l
  WHERE l.modelo_veiculo IS NOT NULL AND TRIM(l.modelo_veiculo) != ''
  GROUP BY UPPER(TRIM(l.modelo_veiculo))
  ORDER BY total DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- 5) Governance — Saúde técnica e operacional
CREATE OR REPLACE FUNCTION get_luis_governance()
RETURNS json AS $$
DECLARE
  v_status_whatsapp text;
  v_fila_envio integer;
  v_leads_sem_atendimento integer;
BEGIN
  SELECT COALESCE(e.status, 'unknown') INTO v_status_whatsapp
  FROM evolution_api_config e
  WHERE e.is_active = true ORDER BY e.updated_at DESC LIMIT 1;

  IF v_status_whatsapp IS NULL THEN v_status_whatsapp := 'unknown'; END IF;

  SELECT COUNT(*) INTO v_fila_envio FROM buffer_message;

  SELECT COUNT(*) INTO v_leads_sem_atendimento
  FROM "Leads CRM" l
  WHERE l.created_at::date = CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM ai_chat_sessions s WHERE s.lead_id::text = l.id::text
    );

  RETURN json_build_object(
    'status_whatsapp', v_status_whatsapp,
    'fila_envio', v_fila_envio,
    'leads_sem_atendimento', v_leads_sem_atendimento
  );
END;
$$ LANGUAGE plpgsql;

-- 6) Current User Loja — Loja associada ao usuário logado
-- NOTA: Ajuste se houver tabela de relação usuário↔loja
CREATE OR REPLACE FUNCTION get_current_user_loja()
RETURNS json AS $$
BEGIN
  RETURN json_build_object('id', 'default', 'nome', 'Loja Principal');
END;
$$ LANGUAGE plpgsql;

-- 7) Current User Role — Papel do usuário logado
-- NOTA: Ajuste se houver tabela de perfis/roles
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS json AS $$
BEGIN
  RETURN json_build_object('role', 'admin');
END;
$$ LANGUAGE plpgsql;

-- 8) Count Leads Outside Business Hours — Usada pela Edge Function rpc-metrics
CREATE OR REPLACE FUNCTION count_leads_outside_hours(
  p_date text,
  p_start_hour integer,
  p_end_hour integer,
  p_tz text
)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM "Leads CRM"
  WHERE created_at >= p_date::timestamptz
    AND (
      EXTRACT(HOUR FROM created_at AT TIME ZONE p_tz) < p_start_hour
      OR EXTRACT(HOUR FROM created_at AT TIME ZONE p_tz) >= p_end_hour
    );
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
