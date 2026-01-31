import { AgentService } from "@/types/service.type";
import { angelaService } from "./angela.service";
import { fernandaService } from "./fernanda.service";
import { aliceService } from "./alice.service";
import { izaService } from "./iza.service";
import { luisService } from "./luis.service";
import { victorService } from "./victor.service";

export const buildService = (agentId: string): AgentService => {
    switch (agentId) {
        case "agent-angela":
            return angelaService;
        case "agent-victor":
            return victorService;
        case "agent-fernanda":
            return fernandaService;
        case "agent-alice":
            return aliceService;
        case "agent-iza":
            return izaService;
        case "agent-luis":
            return luisService;
        default:
            throw new Error(`Agente não configurado ou ID inválido: ${agentId}`);
    }
}