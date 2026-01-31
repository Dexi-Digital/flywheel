-- Tabelas para o Contexto: tecnologia.attraveiculos
CREATE TABLE IF NOT EXISTS leads_nao_convertidos_fase02 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT,
    whatsapp TEXT,
    last_message_ia TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads_frios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT,
    priority_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabelas para o Contexto: devforaiagents
CREATE TABLE IF NOT EXISTS analise_interacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT,
    sentimento TEXT, -- Badge Sentimento
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabelas para o Contexto: tgvempreendimentos
CREATE TABLE IF NOT EXISTS acompanhamento_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT,
    valor_divida DECIMAL,
    dias_atraso INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tgv_parcela (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    valor_parcela DECIMAL,
    status TEXT, -- 'em aberto', 'pago'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela Global de Governança
CREATE TABLE IF NOT EXISTS intervencao_humana (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id TEXT,
    agente_id TEXT,
    motivo TEXT,
    solicitou_retorno BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memoria_lead (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id TEXT,
    dados_estruturados JSONB,
    sincronizado_crm BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
