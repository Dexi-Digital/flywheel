-- Seed data for Command Center
-- Insert the 8 main agents

INSERT INTO agents (id, nome, tipo, status, metricas_agregadas) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Luís', 'SDR', 'ATIVO', 
   '{"leads_ativos": 47, "conversoes": 156, "tempo_medio_resposta": 23, "taxa_sucesso": 0.72, "receita_gerada": 892000}'),
  
  ('a0000001-0000-0000-0000-000000000002', 'Alice', 'BDR', 'ATIVO',
   '{"leads_ativos": 63, "conversoes": 89, "tempo_medio_resposta": 45, "taxa_sucesso": 0.34, "receita_gerada": 567000}'),
  
  ('a0000001-0000-0000-0000-000000000003', 'Iza', 'CSM', 'ATIVO',
   '{"leads_ativos": 124, "conversoes": 0, "tempo_medio_resposta": 120, "taxa_sucesso": 0.91, "receita_recuperada": 234000}'),
  
  ('a0000001-0000-0000-0000-000000000004', 'Fernanda', 'WINBACK', 'ATIVO',
   '{"leads_ativos": 38, "conversoes": 67, "tempo_medio_resposta": 180, "taxa_sucesso": 0.45, "receita_recuperada": 456000}'),
  
  ('a0000001-0000-0000-0000-000000000005', 'Ângela', 'SUPORTE', 'ATIVO',
   '{"leads_ativos": 89, "conversoes": 0, "tempo_medio_resposta": 35, "taxa_sucesso": 0.94, "tickets_resolvidos": 1234}'),
  
  ('a0000001-0000-0000-0000-000000000006', 'Victor', 'FINANCEIRO', 'ATIVO',
   '{"leads_ativos": 52, "inadimplencias_resolvidas": 189, "tempo_medio_resolucao": 72, "taxa_sucesso": 0.78, "receita_recuperada": 678000}'),
  
  ('a0000001-0000-0000-0000-000000000007', 'Sales Pilot', 'PILOT', 'ATIVO',
   '{"leads_ativos": 15, "conversoes": 12, "tempo_medio_resposta": 28, "taxa_sucesso": 0.80, "receita_gerada": 345000}'),
  
  ('a0000001-0000-0000-0000-000000000008', 'OTTO', 'GOVERNANCA', 'ATIVO',
   '{"leads_salvos": 234, "intervencoes": 567, "taxa_sucesso_pos_transbordo": 0.82, "receita_salva": 1890000, "tempo_medio_intervencao": 45}');

-- Sample leads (10 examples)
INSERT INTO leads (nome, email, telefone, empresa, origem, status, agente_atual_id, valor_potencial) VALUES
  ('João Silva', 'joao.silva@empresa.com.br', '11999998888', 'Tech Solutions LTDA', 'Inbound', 'QUALIFICADO', 
   'a0000001-0000-0000-0000-000000000001', 45000.00),
  ('Maria Santos', 'maria@corporacao.com', '21988887777', 'Corporação ABC', 'Outbound', 'NEGOCIACAO',
   'a0000001-0000-0000-0000-000000000002', 78000.00),
  ('Carlos Oliveira', 'carlos@startup.io', '11977776666', 'StartupXYZ', 'Indicação', 'EM_CONTATO',
   'a0000001-0000-0000-0000-000000000001', 25000.00),
  ('Ana Costa', 'ana.costa@bigcorp.com', '31966665555', 'BigCorp SA', 'Evento', 'NOVO',
   'a0000001-0000-0000-0000-000000000001', 120000.00),
  ('Pedro Almeida', 'pedro@industria.com.br', '41955554444', 'Indústria Nacional', 'Parceiro', 'GANHO',
   'a0000001-0000-0000-0000-000000000002', 95000.00),
  ('Lucia Ferreira', 'lucia@services.com', '51944443333', 'Services Plus', 'Reativação', 'ESTAGNADO',
   'a0000001-0000-0000-0000-000000000004', 35000.00),
  ('Roberto Mendes', 'roberto@tech.io', '61933332222', 'TechIO', 'Inbound', 'QUALIFICADO',
   'a0000001-0000-0000-0000-000000000001', 55000.00),
  ('Fernanda Lima', 'fernanda@solutions.com', '71922221111', 'Solutions Express', 'Outbound', 'PERDIDO',
   'a0000001-0000-0000-0000-000000000002', 42000.00),
  ('Ricardo Souza', 'ricardo@enterprise.com.br', '81911110000', 'Enterprise Corp', 'Inbound', 'NEGOCIACAO',
   'a0000001-0000-0000-0000-000000000001', 88000.00),
  ('Juliana Rocha', 'juliana@digital.com', '91900009999', 'Digital First', 'Indicação', 'QUALIFICADO',
   'a0000001-0000-0000-0000-000000000002', 67000.00);

-- Sample events
INSERT INTO events (tipo, lead_id, agente_id, metadata) 
SELECT 
  'LEAD_CAPTURADO',
  l.id,
  l.agente_atual_id,
  '{}'::jsonb
FROM leads l;

INSERT INTO events (tipo, lead_id, agente_id, metadata)
SELECT 
  'INTERVENCAO_OTTO',
  l.id,
  'a0000001-0000-0000-0000-000000000008',
  jsonb_build_object(
    'motivo', 'Lead sem contato há 72h',
    'resultado', 'sucesso',
    'valor', l.valor_potencial
  )
FROM leads l
WHERE l.status = 'ESTAGNADO';

