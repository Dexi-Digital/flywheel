import { AgentService } from "@/types/service.type";
import { angelaService } from "./angela.service";

export const buildService = (agentId: string): AgentService => {
    switch (agentId) {
        case "agent-angela":
            return angelaService;
        default:
            throw new Error(`Unknown agentId: ${agentId}`);
    }
}