-- =====================================================
-- FUNÇÕES RPC PARA O AGENTE VICTOR (TGV)
-- =====================================================

-- 1) Receita Recuperada Total
CREATE OR REPLACE FUNCTION get_receita_recuperada_total()
RETURNS TABLE (receita_recuperada_total numeric) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM((regexp_replace(replace(tp.valor_parcela, ',', '.'), '[^0-9.\-]', '', 'g'))::numeric), 0) AS receita_recuperada_total
  FROM tgv_parcela tp
  WHERE tp.status_renegociacao = 'RENEGOCIADO';
END;
$$ LANGUAGE plpgsql;

-- 2) Receita Recuperada Últimos 30 Dias
CREATE OR REPLACE FUNCTION get_receita_recuperada_30_dias()
RETURNS TABLE (dia date, receita_dia numeric) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(tp.data_hora_importacao) AS dia,
    SUM((regexp_replace(replace(tp.valor_parcela, ',', '.'), '[^0-9.\-]', '', 'g'))::numeric) AS receita_dia
  FROM tgv_parcela tp
  WHERE tp.status_renegociacao = 'RENEGOCIADO'
    AND tp.data_hora_importacao >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(tp.data_hora_importacao)
  ORDER BY dia;
END;
$$ LANGUAGE plpgsql;

-- 3) Tempo Médio de Resolução (em horas)
-- Calcula o tempo entre a primeira interação (disparo/mensagem) e a primeira renegociação
CREATE OR REPLACE FUNCTION get_tempo_medio_resolucao()
RETURNS TABLE (tempo_medio_horas numeric) AS $$
BEGIN
  RETURN QUERY
  WITH primeira_interacao AS (
    -- Pega a primeira interação (disparo ou mensagem) por cliente
    SELECT
      id_cliente,
      MIN(created_at) AS primeira_acao
    FROM (
      SELECT id_cliente, created_at FROM controle_disparo WHERE created_at IS NOT NULL
      UNION ALL
      SELECT id_cliente, created_at FROM tgv_renegociacao WHERE created_at IS NOT NULL
    ) interacoes
    GROUP BY id_cliente
  ),
  primeira_renegociacao AS (
    -- Pega a primeira parcela renegociada por cliente
    SELECT
      id_cliente,
      MIN(data_hora_importacao) AS primeira_renegociacao_em
    FROM tgv_parcela
    WHERE status_renegociacao = 'RENEGOCIADO'
      AND data_hora_importacao IS NOT NULL
    GROUP BY id_cliente
  )
  SELECT
    COALESCE(
      ROUND(
        AVG(
          ABS(EXTRACT(EPOCH FROM (pr.primeira_renegociacao_em - pi.primeira_acao)) / 3600)
        )::numeric,
        2
      ),
      0
    ) AS tempo_medio_horas
  FROM primeira_interacao pi
  JOIN primeira_renegociacao pr ON pi.id_cliente = pr.id_cliente
  WHERE pr.primeira_renegociacao_em > pi.primeira_acao  -- Apenas casos válidos
    AND EXTRACT(EPOCH FROM (pr.primeira_renegociacao_em - pi.primeira_acao)) / 3600 BETWEEN 0 AND 720;  -- Entre 0 e 30 dias
END;
$$ LANGUAGE plpgsql;

-- 4) Fluxo de Trabalho (Kanban - contagem por status)
CREATE OR REPLACE FUNCTION get_kanban_status()
RETURNS TABLE (status text, quantidade bigint) AS $$
BEGIN
  RETURN QUERY
  WITH clientes_recuperado AS (
    SELECT DISTINCT id_cliente FROM tgv_parcela WHERE status_renegociacao = 'RENEGOCIADO'
  ),
  clientes_promessa AS (
    SELECT DISTINCT id_cliente FROM tgv_parcela WHERE status_parcela ILIKE '%PROMESSA%'
  ),
  clientes_disparo AS (
    SELECT DISTINCT id_cliente FROM controle_disparo WHERE disparo_realizado = true
  )
  SELECT 'Recuperado'::text AS status, COUNT(*)::bigint AS quantidade FROM clientes_recuperado
  UNION ALL
  SELECT 'Promessa de Pagamento'::text, COUNT(*)::bigint FROM clientes_promessa
  UNION ALL
  SELECT 'Em Negociacao'::text, COUNT(*)::bigint FROM (
    SELECT DISTINCT d.id_cliente FROM clientes_disparo d
    WHERE d.id_cliente NOT IN (SELECT id_cliente FROM clientes_recuperado)
  ) x
  UNION ALL
  SELECT 'Em Aberto'::text, COUNT(*)::bigint FROM (
    SELECT DISTINCT r.id_cliente FROM tgv_renegociacao r
    WHERE r.id_cliente NOT IN (SELECT id_cliente FROM clientes_recuperado)
      AND r.id_cliente NOT IN (SELECT id_cliente FROM clientes_disparo)
  ) y;
END;
$$ LANGUAGE plpgsql;

-- 5) Atividade Recente (últimos 100 eventos combinados)
CREATE OR REPLACE FUNCTION get_atividade_recente()
RETURNS TABLE (
  tipo text,
  evento_id text,
  id_cliente text,
  conteudo text,
  data_hora timestamp with time zone,
  meta text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'mensagem'::text AS tipo,
    id::text AS evento_id,
    NULL::text AS id_cliente,
    mensagem::text AS conteudo,
    created_at AS data_hora,
    direcao AS meta
  FROM tgv_mensagem
  WHERE created_at IS NOT NULL
  UNION ALL
  SELECT
    'disparo'::text AS tipo,
    id::text AS evento_id,
    id_cliente,
    NULL::text AS conteudo,
    created_at AS data_hora,
    (CASE WHEN disparo_realizado THEN 'REALIZADO' ELSE 'NAO_REALIZADO' END) AS meta
  FROM controle_disparo
  WHERE created_at IS NOT NULL
  UNION ALL
  SELECT
    'lead'::text AS tipo,
    id::text AS evento_id,
    id_cliente,
    nome_cliente AS conteudo,
    created_at AS data_hora,
    NULL::text AS meta
  FROM acompanhamento_leads
  WHERE created_at IS NOT NULL
  ORDER BY data_hora DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;

