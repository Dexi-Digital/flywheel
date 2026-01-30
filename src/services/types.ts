export type InteracaoRow = {
    id: string | number;
    created_at?: string | null;

    nome?: string | null;
    whatsapp?: string | null;
    telefone?: string | null;

    loja?: string | null;
    empresa?: string | null;

    valor_potencial?: number | string | null;

    respondeu?: boolean | null;
    alerta?: boolean | null;
};

export type DisparoRow = {
    id: string | number;
    created_at?: string | null;

    nome?: string | null;
    telefone?: string | null;

    session_id?: string | null;
    id_lead?: string | null;
};
