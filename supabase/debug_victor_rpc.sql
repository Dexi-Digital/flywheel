-- =====================================================
-- DEBUG: Testar Funções RPC do Victor
-- Execute cada query separadamente no Supabase SQL Editor
-- =====================================================

-- TESTE 1: Receita Recuperada Total
-- Deve retornar um número (ex: 769548)
SELECT * FROM get_receita_recuperada_total();

-- TESTE 2: Receita por Dia (últimos 30 dias)
-- Deve retornar múltiplas linhas com dia e receita_dia
SELECT * FROM get_receita_recuperada_30_dias();

-- TESTE 3: Tempo Médio de Resolução
-- Deve retornar um número em horas (ex: 48.5) ou 0
SELECT * FROM get_tempo_medio_resolucao();

-- TESTE 4: Kanban Status
-- Deve retornar 4 linhas (Recuperado, Promessa, Em Negociacao, Em Aberto)
SELECT * FROM get_kanban_status();

-- TESTE 5: Atividade Recente
-- Deve retornar até 100 eventos
SELECT * FROM get_atividade_recente() LIMIT 10;

-- =====================================================
-- DEBUG: Verificar Dados Brutos nas Tabelas
-- =====================================================

-- VERIFICAR 1: Parcelas RENEGOCIADO (para receita recuperada)
SELECT 
  COUNT(*) as total_parcelas_renegociadas,
  SUM((regexp_replace(replace(valor_parcela, ',', '.'), '[^0-9.\-]', '', 'g'))::numeric) as receita_total
FROM tgv_parcela 
WHERE status_renegociacao = 'RENEGOCIADO';

-- VERIFICAR 2: Dados para Tempo Médio de Resolução
-- Verificar se há interações (disparos)
SELECT COUNT(*) as total_disparos, MIN(created_at) as primeiro_disparo, MAX(created_at) as ultimo_disparo
FROM controle_disparo 
WHERE created_at IS NOT NULL;

-- Verificar se há renegociações
SELECT COUNT(*) as total_renegociacoes, MIN(created_at) as primeira_renegociacao, MAX(created_at) as ultima_renegociacao
FROM tgv_renegociacao 
WHERE created_at IS NOT NULL;

-- Verificar se há parcelas com data_hora_importacao
SELECT COUNT(*) as total_parcelas_com_data, MIN(data_hora_importacao) as primeira_data, MAX(data_hora_importacao) as ultima_data
FROM tgv_parcela 
WHERE status_renegociacao = 'RENEGOCIADO' 
  AND data_hora_importacao IS NOT NULL;

-- VERIFICAR 3: Clientes com dados completos para tempo médio
WITH primeira_interacao AS (
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
  SELECT
    id_cliente,
    MIN(data_hora_importacao) AS primeira_renegociacao_em
  FROM tgv_parcela
  WHERE status_renegociacao = 'RENEGOCIADO'
    AND data_hora_importacao IS NOT NULL
  GROUP BY id_cliente
)
SELECT 
  COUNT(*) as clientes_com_dados_completos,
  AVG(EXTRACT(EPOCH FROM (pr.primeira_renegociacao_em - pi.primeira_acao)) / 3600) as tempo_medio_horas_raw,
  MIN(EXTRACT(EPOCH FROM (pr.primeira_renegociacao_em - pi.primeira_acao)) / 3600) as tempo_minimo_horas,
  MAX(EXTRACT(EPOCH FROM (pr.primeira_renegociacao_em - pi.primeira_acao)) / 3600) as tempo_maximo_horas
FROM primeira_interacao pi
JOIN primeira_renegociacao pr ON pi.id_cliente = pr.id_cliente
WHERE pr.primeira_renegociacao_em > pi.primeira_acao;

-- VERIFICAR 4: Kanban - Distribuição de clientes
SELECT 
  'Recuperado' as status,
  COUNT(DISTINCT id_cliente) as quantidade
FROM tgv_parcela 
WHERE status_renegociacao = 'RENEGOCIADO'
UNION ALL
SELECT 
  'Promessa de Pagamento',
  COUNT(DISTINCT id_cliente)
FROM tgv_parcela 
WHERE status_parcela ILIKE '%PROMESSA%'
UNION ALL
SELECT 
  'Em Negociacao',
  COUNT(DISTINCT id_cliente)
FROM controle_disparo 
WHERE disparo_realizado = true
UNION ALL
SELECT 
  'Em Aberto',
  COUNT(DISTINCT id_cliente)
FROM tgv_renegociacao;

-- VERIFICAR 5: Atividade Recente - Contagem por tipo
SELECT 'mensagens' as tipo, COUNT(*) as total FROM tgv_mensagem WHERE created_at IS NOT NULL
UNION ALL
SELECT 'disparos', COUNT(*) FROM controle_disparo WHERE created_at IS NOT NULL
UNION ALL
SELECT 'leads', COUNT(*) FROM acompanhamento_leads WHERE created_at IS NOT NULL;

