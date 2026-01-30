import { EventType, LeadOrigin } from "@/types/database.types";

export type InteracaoRow = {
    id: string | number;
    created_at?: string | null;
    
    nome?: string | null;
    whatsapp?: string | null;
    loja?: string | null;
    
    // Campos da tabela analise_interacoes (são TEXT, não boolean)
    respondeu?: string | null; // TEXT na tabela
    alerta?: string | null; // TEXT na tabela
    
    // Campos opcionais que podem ser úteis
    interesse?: string | null;
    interesse_compra_futura?: string | null;
    veiculo?: string | null;
    valor_potencial?: number | string | null; // Não existe na tabela, mas pode ser calculado
};

export type DisparoRow = {
    id: string | number;
    created_at?: string | null;
    
    nome?: string | null;
    telefone?: string | null;
    session_id?: string | null;
};
