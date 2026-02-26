-- =====================================================
-- SCHEMA DO AGENTE LUÍS (SDR Híbrido / Plantão)
-- Projeto Supabase: hmlupclplkwlsnedpayi
-- Execute ANTES do luis_rpc_functions.sql
-- =====================================================

-- Extensão pgvector (necessária para a tabela documents)
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 1) Leads CRM — Tabela principal de leads
CREATE TABLE IF NOT EXISTS "Leads CRM" (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at    timestamptz DEFAULT now(),
  "Nome"        text,
  telefone      text,
  email         text,
  origem        text DEFAULT 'Inbound',
  status        text DEFAULT 'NOVO',
  ultima_interacao timestamptz,
  valor_potencial numeric DEFAULT 0,
  "Tipo de Atendimento" text,
  message       text,
  contato_realizado boolean DEFAULT false,
  id_veiculo    text,
  url_veiculo   text,
  marca_veiculo text,
  modelo_veiculo text,
  versao_veiculo text,
  ano_veiculo   text,
  cor_veiculo   text,
  condicao_veiculo text
);

-- 2) AI Chat Sessions — Sessões de chat com IA
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_id       bigint,
  session_id    text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  status        text DEFAULT 'active',
  last_message_at timestamptz,
  vendedor_id   text,
  loja_id       text,
  platform      text,
  session_data  jsonb
);

-- 3) Análise de Interações IA — Cérebro analítico
CREATE TABLE IF NOT EXISTS analise_interacoes_ia (
  id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at            timestamptz DEFAULT now(),
  nome                  text,
  whatsapp              text,
  loja                  text,
  interesse             text,
  interesse_veiculo     text,
  veiculo               text,
  interesse_compra_futura text,
  solicitou_retorno     boolean DEFAULT false,
  data_retorno          timestamptz,
  respondeu             boolean DEFAULT false,
  alerta                boolean DEFAULT false,
  justificativa_alerta  text,
  problema              boolean DEFAULT false,
  relato_problema       text,
  feedback              text,
  analise_sentimento    text,
  resumo_interacao      text,
  reanalise             boolean DEFAULT false
);

-- 4) Chat Histories BDR — Históricos de conversa
CREATE TABLE IF NOT EXISTS chat_histories_bdr (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id    text,
  message       text,
  created_at    timestamptz DEFAULT now()
);

-- 5) Automated Reminders — Lembretes automáticos
CREATE TABLE IF NOT EXISTS automated_reminders (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reminder_type   text,
  scheduled_for   timestamptz,
  sent_at         timestamptz,
  status          text DEFAULT 'pending',
  content         text,
  lead_id         bigint
);

-- 6) Follow-up Config — Configuração de follow-up
CREATE TABLE IF NOT EXISTS followup_config (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ia_nome         text,
  tipo_followup   text,
  tempo_minuto    integer
);

-- 7) Buffer Message — Buffer de mensagens pendentes
CREATE TABLE IF NOT EXISTS buffer_message (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at    timestamptz DEFAULT now(),
  message       text,
  "chatId"      text,
  "idMessage"   text,
  timestamp     bigint
);

-- 8) Evolution API Config — Status do WhatsApp
CREATE TABLE IF NOT EXISTS evolution_api_config (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  instance_name   text,
  api_url         text,
  phone_number    text,
  qr_code         text,
  status          text DEFAULT 'unknown',
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 9) Contatos — Lista de contatos
CREATE TABLE IF NOT EXISTS contatos (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome          text,
  whatsapp      text
);

-- 10) Documents — Base de conhecimento (vetorial)
CREATE TABLE IF NOT EXISTS documents (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content       text,
  metadata      jsonb,
  embedding     vector(1536)
);

