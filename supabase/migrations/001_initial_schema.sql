-- Command Center Database Schema
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE agent_type AS ENUM ('SDR', 'BDR', 'CSM', 'FINANCEIRO', 'SUPORTE', 'WINBACK', 'GOVERNANCA', 'PILOT');
CREATE TYPE agent_status AS ENUM ('ATIVO', 'INATIVO', 'MANUTENCAO');
CREATE TYPE lead_status AS ENUM ('NOVO', 'EM_CONTATO', 'QUALIFICADO', 'NEGOCIACAO', 'GANHO', 'PERDIDO', 'ESTAGNADO');
CREATE TYPE lead_origin AS ENUM ('Inbound', 'Outbound', 'Indicação', 'Parceiro', 'Evento', 'Reativação');
CREATE TYPE event_type AS ENUM (
  'LEAD_CAPTURADO',
  'LEAD_RESPONDIDO',
  'LEAD_ESTAGNADO',
  'LEAD_TRANSBORDADO',
  'CONVERSAO',
  'RECUPERACAO',
  'INADIMPLENCIA_RESOLVIDA',
  'INTERVENCAO_OTTO'
);
CREATE TYPE user_role AS ENUM ('admin', 'operacional', 'viewer');

-- Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  tipo agent_type NOT NULL,
  status agent_status NOT NULL DEFAULT 'ATIVO',
  avatar_url TEXT,
  metricas_agregadas JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  empresa VARCHAR(200),
  origem lead_origin NOT NULL,
  status lead_status NOT NULL DEFAULT 'NOVO',
  agente_atual_id UUID REFERENCES agents(id),
  tempo_parado INTERVAL,
  valor_potencial DECIMAL(15, 2) NOT NULL DEFAULT 0,
  ultima_interacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo event_type NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  agente_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  nome VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_agente ON leads(agente_atual_id);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_events_tipo ON events(tipo);
CREATE INDEX idx_events_lead ON events(lead_id);
CREATE INDEX idx_events_agente ON events(agente_id);
CREATE INDEX idx_events_timestamp ON events(timestamp DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- All authenticated users can read
CREATE POLICY "Anyone can read agents" ON agents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read leads" ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read events" ON events FOR SELECT TO authenticated USING (true);

-- Only admins can write
CREATE POLICY "Admins can insert agents" ON agents FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update agents" ON agents FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins or operacional can insert leads" ON leads FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'operacional')));

CREATE POLICY "Admins or operacional can update leads" ON leads FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'operacional')));

CREATE POLICY "Anyone can insert events" ON events FOR INSERT TO authenticated WITH CHECK (true);

-- User profile policies
CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

