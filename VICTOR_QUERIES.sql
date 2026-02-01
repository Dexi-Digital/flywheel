-- ============================================================================
-- QUERIES PARA CONSULTAR DADOS DO VICTOR (AGENTE FINANCEIRO - TGV)
-- ============================================================================
-- Todas as queries usadas para calcular as métricas reais do Victor
-- Data: 31/01/2026
-- ============================================================================

-- ============================================================================
-- 1. ACOMPANHAMENTO DE LEADS (Base Principal)
-- ============================================================================
SELECT 
  id,
  created_at,
  nome_cliente,
  id_cliente,
  numero_cliente,
  id_divida
FROM acompanhamento_leads
ORDER BY created_at DESC
LIMIT 50;

-- ============================================================================
-- 2. PARCELAS (Dívidas e Status Financeiro)
-- ============================================================================
SELECT 
  id,
  id_divida,
  id_cliente,
  numero_contrato,
  numero_parcela,
  total_parcelas,
  quantidade_parcelas_restantes,
  tipo_parcela,
  descricao_referencia,
  valor_parcela,
  data_vencimento,
  descricao_vencimento,
  status_parcela,
  status_renegociacao,
  dias_em_atraso,
  loteamento,
  descricao_unidade,
  telefone,
  telefone_nono_digito,
  whatsapp_existe
FROM tgv_parcela
ORDER BY data_vencimento ASC
LIMIT 100;

-- ============================================================================
-- 3. RENEGOCIAÇÕES ATIVAS
-- ============================================================================
SELECT 
  id,
  id_cliente,
  id_divida,
  loteamento,
  descricao_contrato,
  aberta_em,
  vencimento,
  atraso,
  dias_em_debito,
  ativo
FROM tgv_renegociacao
WHERE ativo = true
ORDER BY created_at DESC
LIMIT 50;

-- ============================================================================
-- 4. CONTROLE DE DISPARO (Comunicações Realizadas)
-- ============================================================================
SELECT 
  id,
  created_at,
  nome_cliente,
  telefone_cliente,
  id_cliente,
  id_divida,
  disparo_realizado,
  dateTime_disparo,
  vencimento,
  dias_atraso
FROM controle_disparo
ORDER BY created_at DESC
LIMIT 50;

-- ============================================================================
-- 5. MENSAGENS TGV (Enviadas/Recebidas)
-- ============================================================================
SELECT 
  id,
  created_at,
  direcao,  -- 'ENVIADA' ou 'RECEBIDA'
  mensagem,
  telefone_nono_digito,
  wa_mensagem_id,
  wa_resposta_msg_id
FROM tgv_mensagem
ORDER BY created_at DESC
LIMIT 100;

-- ============================================================================
-- 6. BUFFER DE MENSAGENS (Fila de Processamento)
-- ============================================================================
SELECT 
  id,
  created_at,
  chat_id,
  message,
  message_id,
  timestamp
FROM buffer_message
ORDER BY created_at DESC
LIMIT 50;

-- ============================================================================
-- 7. OPT-OUT WHATSAPP (Clientes que Pediram para Parar)
-- ============================================================================
SELECT 
  id,
  telefone_nono_digito,
  solicitado_em
FROM tgv_opt_out
ORDER BY solicitado_em DESC
LIMIT 30;

-- ============================================================================
-- 8. WHATSAPP INVÁLIDOS (Números que Não Existem)
-- ============================================================================
SELECT 
  id,
  nome_cliente,
  id_cliente,
  numero_cliente
FROM whatsapp_inexistente
ORDER BY created_at DESC
LIMIT 30;

-- ============================================================================
-- 9. MEMÓRIA DE SESSÕES (Contexto de Conversas)
-- ============================================================================
SELECT 
  session_id,
  created_at,
  last_message_ia,
  last_message_user,
  last_time_message_ai,
  last_time_message_user
FROM memoria
ORDER BY created_at DESC
LIMIT 30;

-- ============================================================================
-- 10. HISTÓRICOS N8N (Automações)
-- ============================================================================
SELECT 
  id,
  session_id,
  created_at,
  message
FROM n8n_chat_histories
ORDER BY created_at DESC
LIMIT 100;

-- ============================================================================
-- 11. COMPROVANTES DE PAGAMENTO ⭐ (CRUCIAL PARA INADIMPLÊNCIAS RESOLVIDAS)
-- ============================================================================
SELECT 
  id,
  data_envio,
  link_conprovante,
  id_client
FROM comprovantes
ORDER BY data_envio DESC
LIMIT 50;

-- ============================================================================
-- 12. DADOS PIX (Dados Bancários)
-- ============================================================================
SELECT 
  id,
  nome_CNPJ,
  cnpj,
  relacao_loteamento
FROM pix
LIMIT 20;

-- ============================================================================
-- QUERIES CALCULADAS PARA AS MÉTRICAS
-- ============================================================================

-- ============================================================================
-- MÉTRICA 1: CONTRATOS ATIVOS
-- ============================================================================
SELECT COUNT(*) as contratos_ativos
FROM tgv_renegociacao
WHERE ativo = true;

-- ============================================================================
-- MÉTRICA 2: PARCELAS EM ATRASO
-- ============================================================================
SELECT COUNT(*) as parcelas_em_atraso
FROM tgv_parcela
WHERE dias_em_atraso > 0;

-- ============================================================================
-- MÉTRICA 3: PARCELAS CRÍTICAS (>= 90 dias)
-- ============================================================================
SELECT COUNT(*) as parcelas_criticas
FROM tgv_parcela
WHERE dias_em_atraso >= 90;

-- ============================================================================
-- MÉTRICA 4: VALOR EM RISCO (Soma das parcelas atrasadas)
-- ============================================================================
SELECT 
  SUM(valor_parcela) as valor_em_risco
FROM tgv_parcela
WHERE dias_em_atraso > 0;

-- ============================================================================
-- MÉTRICA 5: TAXA DE RESPOSTA (Mensagens Enviadas vs Recebidas)
-- ============================================================================
SELECT 
  SUM(CASE WHEN direcao = 'ENVIADA' THEN 1 ELSE 0 END) as mensagens_enviadas,
  SUM(CASE WHEN direcao = 'RECEBIDA' THEN 1 ELSE 0 END) as mensagens_recebidas,
  ROUND(
    (SUM(CASE WHEN direcao = 'RECEBIDA' THEN 1 ELSE 0 END)::float / 
     NULLIF(SUM(CASE WHEN direcao = 'ENVIADA' THEN 1 ELSE 0 END), 0)) * 100,
    2
  ) as taxa_resposta_percentual
FROM tgv_mensagem;

-- ============================================================================
-- MÉTRICA 6: RENEGOCIAÇÕES ATIVAS
-- ============================================================================
SELECT COUNT(*) as renegociacoes_ativas
FROM tgv_renegociacao
WHERE ativo = true;

-- ============================================================================
-- MÉTRICA 7: COMPROVANTES RECEBIDOS ⭐ (= INADIMPLÊNCIAS RESOLVIDAS)
-- ============================================================================
SELECT COUNT(*) as comprovantes_recebidos
FROM comprovantes
ORDER BY data_envio DESC;

-- ============================================================================
-- MÉTRICA 8: OPT-OUTS
-- ============================================================================
SELECT COUNT(*) as opt_outs
FROM tgv_opt_out;

-- ============================================================================
-- MÉTRICA 9: WHATSAPP INVÁLIDOS
-- ============================================================================
SELECT COUNT(*) as whatsapp_invalidos
FROM whatsapp_inexistente;

-- ============================================================================
-- MÉTRICA 10: DISPAROS HOJE
-- ============================================================================
SELECT COUNT(*) as disparos_hoje
FROM controle_disparo
WHERE DATE(dateTime_disparo) = CURRENT_DATE;

-- ============================================================================
-- MÉTRICA 11: CONVERSAS ATIVAS
-- ============================================================================
SELECT COUNT(*) as conversas_ativas
FROM memoria;

-- ============================================================================
-- MÉTRICA 12: TAXA DE SUCESSO (Comprovantes / Contratos Ativos)
-- ============================================================================
SELECT 
  ROUND(
    (SELECT COUNT(*) FROM comprovantes)::float / 
    NULLIF((SELECT COUNT(*) FROM tgv_renegociacao WHERE ativo = true), 0),
    4
  ) as taxa_sucesso_decimal,
  ROUND(
    (SELECT COUNT(*) FROM comprovantes)::float / 
    NULLIF((SELECT COUNT(*) FROM tgv_renegociacao WHERE ativo = true), 0) * 100,
    2
  ) as taxa_sucesso_percentual;

-- ============================================================================
-- MÉTRICA 13: RECEITA RECUPERADA (Valor Médio × Comprovantes)
-- ============================================================================
SELECT 
  (SELECT COUNT(*) FROM comprovantes) as comprovantes_recebidos,
  ROUND((SELECT AVG(valor_parcela) FROM tgv_parcela), 2) as valor_medio_parcela,
  ROUND(
    (SELECT COUNT(*) FROM comprovantes) * 
    (SELECT AVG(valor_parcela) FROM tgv_parcela),
    2
  ) as receita_recuperada;

-- ============================================================================
-- MÉTRICA 14: TEMPO MÉDIO DE RESOLUÇÃO (em horas)
-- ============================================================================
SELECT 
  ROUND(
    EXTRACT(EPOCH FROM (
      MAX(dateTime_disparo) - MIN(dateTime_disparo)
    )) / 3600.0,
    0
  )::INTEGER as tempo_medio_resolucao_horas
FROM controle_disparo;

-- ============================================================================
-- DASHBOARD CONSOLIDADO - TODAS AS MÉTRICAS DE VICTOR
-- ============================================================================
WITH metrics AS (
  SELECT
    (SELECT COUNT(*) FROM tgv_renegociacao WHERE ativo = true) as contratos_ativos,
    (SELECT COUNT(*) FROM tgv_parcela WHERE dias_em_atraso > 0) as parcelas_em_atraso,
    (SELECT COUNT(*) FROM tgv_parcela WHERE dias_em_atraso >= 90) as parcelas_criticas,
    COALESCE((SELECT SUM(valor_parcela) FROM tgv_parcela WHERE dias_em_atraso > 0), 0) as valor_em_risco,
    (SELECT COUNT(*) FROM comprovantes) as inadimplencias_resolvidas,
    (SELECT COUNT(*) FROM tgv_opt_out) as opt_outs,
    (SELECT COUNT(*) FROM whatsapp_inexistente) as whatsapp_invalidos,
    (SELECT COUNT(*) FROM memoria) as conversas_ativas,
    (SELECT COUNT(*) FROM controle_disparo WHERE DATE(dateTime_disparo) = CURRENT_DATE) as disparos_hoje,
    ROUND(
      EXTRACT(EPOCH FROM (
        (SELECT MAX(dateTime_disparo) FROM controle_disparo) - 
        (SELECT MIN(dateTime_disparo) FROM controle_disparo)
      )) / 3600.0,
      0
    )::INTEGER as tempo_medio_resolucao_horas
)
SELECT
  *,
  ROUND(
    (SELECT COUNT(*) FROM comprovantes)::float / 
    NULLIF((SELECT COUNT(*) FROM tgv_renegociacao WHERE ativo = true), 0) * 100,
    2
  ) as taxa_sucesso_percentual,
  ROUND(
    (SELECT COUNT(*) FROM comprovantes) * 
    (SELECT AVG(valor_parcela) FROM tgv_parcela),
    2
  ) as receita_recuperada
FROM metrics;

-- ============================================================================
-- QUERIES PARA DEBUG / VALIDAÇÃO
-- ============================================================================

-- Verificar se há dados em comprovantes
SELECT COUNT(*) as total_comprovantes, MAX(data_envio) as ultimo_comprovante
FROM comprovantes;

-- Verificar se há dados em controle_disparo
SELECT COUNT(*) as total_disparos, MAX(dateTime_disparo) as ultimo_disparo
FROM controle_disparo;

-- Verificar se há parcelas com status_parcela = 'PAGA'
SELECT 
  status_parcela,
  COUNT(*) as quantidade
FROM tgv_parcela
GROUP BY status_parcela;

-- Verificar distribuição de renegociações (ativas vs inativas)
SELECT 
  ativo,
  COUNT(*) as quantidade
FROM tgv_renegociacao
GROUP BY ativo;
