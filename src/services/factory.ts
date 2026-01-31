import { AgentService } from "@/types/service.type";
import { angelaService } from "./angela.service";

export const buildService = (agentId: string): AgentService => {
    switch (agentId) {
        case "agent-angela":
        case "agent-victor": // Ambos usam angelaService por enquanto
            return angelaService;
        default:
            throw new Error(`Agente não configurado ou ID inválido: ${agentId}`);
    }
}