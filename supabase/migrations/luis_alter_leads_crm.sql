-- =====================================================
-- ADICIONAR COLUNAS FALTANTES NA TABELA "Leads CRM"
-- Projeto Supabase: hmlupclplkwlsnedpayi
-- Execute no SQL Editor do Supabase
-- =====================================================
-- Cada comando usa IF NOT EXISTS (via DO block) para ser idempotente

DO $$
BEGIN
  -- telefone
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Leads CRM' AND column_name = 'telefone') THEN
    ALTER TABLE "Leads CRM" ADD COLUMN telefone text;
  END IF;

  -- Nome (maiúsculo)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Leads CRM' AND column_name = 'Nome') THEN
    ALTER TABLE "Leads CRM" ADD COLUMN "Nome" text;
  END IF;

  -- email
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Leads CRM' AND column_name = 'email') THEN
    ALTER TABLE "Leads CRM" ADD COLUMN email text;
  END IF;

  -- origem
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Leads CRM' AND column_name = 'origem') THEN
    ALTER TABLE "Leads CRM" ADD COLUMN origem text DEFAULT 'Inbound';
  END IF;

  -- status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Leads CRM' AND column_name = 'status') THEN
    ALTER TABLE "Leads CRM" ADD COLUMN status text DEFAULT 'NOVO';
  END IF;

  -- ultima_interacao
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Leads CRM' AND column_name = 'ultima_interacao') THEN
    ALTER TABLE "Leads CRM" ADD COLUMN ultima_interacao timestamptz;
  END IF;

  -- valor_potencial
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Leads CRM' AND column_name = 'valor_potencial') THEN
    ALTER TABLE "Leads CRM" ADD COLUMN valor_potencial numeric DEFAULT 0;
  END IF;

  -- Tipo de Atendimento (com espaço, precisa de aspas)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Leads CRM' AND column_name = 'Tipo de Atendimento') THEN
    ALTER TABLE "Leads CRM" ADD COLUMN "Tipo de Atendimento" text;
  END IF;

  -- message
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Leads CRM' AND column_name = 'message') THEN
    ALTER TABLE "Leads CRM" ADD COLUMN message text;
  END IF;

  -- contato_realizado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Leads CRM' AND column_name = 'contato_realizado') THEN
    ALTER TABLE "Leads CRM" ADD COLUMN contato_realizado boolean DEFAULT false;
  END IF;

  -- Colunas de veículo
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Leads CRM' AND column_name = 'id_veiculo') THEN
    ALTER TABLE "Leads CRM" ADD COLUMN id_veiculo text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Leads CRM' AND column_name = 'url_veiculo') THEN
    ALTER TABLE "Leads CRM" ADD COLUMN url_veiculo text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Leads CRM' AND column_name = 'marca_veiculo') THEN
    ALTER TABLE "Leads CRM" ADD COLUMN marca_veiculo text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Leads CRM' AND column_name = 'modelo_veiculo') THEN
    ALTER TABLE "Leads CRM" ADD COLUMN modelo_veiculo text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Leads CRM' AND column_name = 'versao_veiculo') THEN
    ALTER TABLE "Leads CRM" ADD COLUMN versao_veiculo text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Leads CRM' AND column_name = 'ano_veiculo') THEN
    ALTER TABLE "Leads CRM" ADD COLUMN ano_veiculo text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Leads CRM' AND column_name = 'cor_veiculo') THEN
    ALTER TABLE "Leads CRM" ADD COLUMN cor_veiculo text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Leads CRM' AND column_name = 'condicao_veiculo') THEN
    ALTER TABLE "Leads CRM" ADD COLUMN condicao_veiculo text;
  END IF;
END $$;

-- Verificação: listar colunas atuais
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Leads CRM'
ORDER BY ordinal_position;

