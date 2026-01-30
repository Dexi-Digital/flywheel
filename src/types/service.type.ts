import { Agent, Event, Lead } from "./database.types";

export type AgentService = {
    id: string;
  
    getAgent: (agentId: string, init?: RequestInit) => Promise<Agent>;
  };