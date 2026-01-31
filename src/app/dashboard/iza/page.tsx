'use client';

import { useEffect, useState } from 'react';
import {
  IzaKPICards,
  CampaignLeadsGrid,
  EventLeadsGrid,
  FollowupDecisionsWidget,
  FollowupLogsWidget,
  FollowupConfigPanel,
  ConversationMemoryWidget,
  AlertsAndInterventionWidget,
  AgentPromptsConfig,
} from '@/components/iza';

interface IzaAgent {
  id: string;
  nome: string;
  leads_ativos: number;
  conversoes: number;
  receita_total: number;
}

export default function IzaPage() {
  const [agent, setAgent] = useState<IzaAgent | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [leadsEvento, setLeadsEvento] = useState<any[]>([]);
  const [followupControl, setFollowupControl] = useState<any[]>([]);
  const [followupLogs, setFollowupLogs] = useState<any[]>([]);
  const [followupConfig, setFollowupConfig] = useState<any[]>([]);
  const [memoria, setMemoria] = useState<any[]>([]);
  const [curadoria, setCuradoria] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [intervencao, setIntervencao] = useState<any[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);

  useEffect(() => {
    const fetchIzaData = async () => {
      try {
        const res = await fetch('/api/agents/agent-iza');
        const json = await res.json();

        if (json.ok && json.agent) {
          setAgent(json.agent);
          // Note: In production, you'd want to return raw data from the service
          // for now we show the normalized agent structure
        }
      } catch (error) {
        console.error('Error fetching Iza data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIzaData();
  }, []);

  const calculateKPIs = () => {
    const today = new Date().toDateString();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toDateString();

    const newLeadsToday = leads.filter(
      l => new Date(l.created_at).toDateString() === today
    ).length;

    const newLeadsWeek = leads.filter(
      l => new Date(l.created_at) >= new Date(weekAgo)
    ).length;

    const contactedCount = leads.filter(l => l.contato_realizado).length;
    const qualifiedCount = leads.filter(l => l.interesse).length;

    const origins: Record<string, number> = {};
    leads.forEach(lead => {
      if (lead.origem) {
        origins[lead.origem] = (origins[lead.origem] || 0) + 1;
      }
    });

    return {
      totalLeads: leads.length,
      newLeadsToday,
      newLeadsWeek,
      contactPercentage: leads.length > 0 ? Math.round((contactedCount / leads.length) * 100) : 0,
      qualifiedPercentage: leads.length > 0 ? Math.round((qualifiedCount / leads.length) * 100) : 0,
      origins,
    };
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">Carregando dados de Iza...</div>
      </div>
    );
  }

  const kpiData = calculateKPIs();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🤖 Iza — Marketing & Campanhas</h1>
        <p className="text-gray-600 mt-2">
          Prospecção e reativação de leads de campanhas (Google/Facebook) com funil visual e
          follow-ups automáticos
        </p>
      </div>

      {/* KPI Cards */}
      <IzaKPICards data={kpiData} />

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Leads Grids */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Leads Grid */}
          {leads.length > 0 && (
            <CampaignLeadsGrid leads={leads} onLeadClick={setSelectedLead} />
          )}

          {/* Event Leads Grid */}
          {leadsEvento.length > 0 && (
            <EventLeadsGrid leads={leadsEvento} onLeadClick={setSelectedLead} />
          )}

          {/* Follow-up Decisions */}
          {followupControl.length > 0 && (
            <FollowupDecisionsWidget decisions={followupControl} />
          )}

          {/* Follow-up Logs */}
          {followupLogs.length > 0 && (
            <FollowupLogsWidget logs={followupLogs} />
          )}
        </div>

        {/* Right: Sidebar Widgets */}
        <div className="space-y-6">
          {/* Follow-up Config */}
          {followupConfig.length > 0 && (
            <FollowupConfigPanel configs={followupConfig} />
          )}

          {/* Conversation Memory */}
          {memoria.length > 0 && (
            <ConversationMemoryWidget memories={memoria} onSessionClick={(id) => console.log('Session:', id)} />
          )}

          {/* Alerts & Intervention */}
          <AlertsAndInterventionWidget
            curadoria={curadoria}
            alertas={alertas}
            intervencao={intervencao}
          />

          {/* Agent Prompts Config */}
          {prompts.length > 0 && (
            <AgentPromptsConfig prompts={prompts} />
          )}
        </div>
      </div>

      {/* Debug info */}
      {agent && (
        <div className="mt-8 p-4 bg-blue-50 rounded border border-blue-200 text-sm text-blue-900">
          <strong>Agent Data:</strong> Leads ativos: {agent.leads_ativos}, Conversões:{' '}
          {agent.conversoes}, Receita: R$ {agent.receita_total.toLocaleString('pt-BR')}
        </div>
      )}
    </div>
  );
}
