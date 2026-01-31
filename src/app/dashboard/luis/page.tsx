'use client';

import { useEffect, useState } from 'react';
import { KPICards, LeadsGrid, AISessionsWidget, InteractionAnalysisWidget, RemindersWidget, WhatsAppStatusCard } from '@/components/luis';

interface LuisAgent {
  id: string;
  nome: string;
  agente_atual_id: string;
  leads_ativos: number;
  conversoes: number;
  receita_total: number;
}

interface LeadData {
  id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  'Tipo de Atendimento'?: string | null;
  message?: string | null;
  marca_veiculo?: string | null;
  modelo_veiculo?: string | null;
  ano_veiculo?: number | null;
  contato_realizado: boolean;
  origem?: string | null;
  ultima_interacao?: string;
  valor_potencial?: number | null;
  id_veiculo?: string;
  url_veiculo?: string;
  versao_veiculo?: string;
  cor_veiculo?: string;
  condicao_veiculo?: string;
}

interface SessionData {
  id: string;
  session_id: string;
  lead_id?: string;
  platform?: string;
  status?: string;
  last_message_at?: string;
  created_at: string;
}

interface AnalisisData {
  id: string;
  nome?: string;
  whatsapp?: string;
  loja?: string;
  interesse?: string;
  solicitou_retorno?: boolean;
  respondeu?: boolean;
  problema?: boolean;
  alerta?: boolean;
  analise_sentimento?: string;
  created_at: string;
}

interface ReminderData {
  id: string;
  reminder_type: string;
  scheduled_for: string;
  sent_at?: string;
  status: string;
  content: string;
  lead_id?: string;
}

interface EvolutionConfig {
  instance_name: string;
  phone_number: string;
  qr_code?: string;
  status: string;
  is_active: boolean;
}

export default function LuisPage() {
  const [agent, setAgent] = useState<LuisAgent | null>(null);
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [analises, setAnalises] = useState<AnalisisData[]>([]);
  const [reminders, setReminders] = useState<ReminderData[]>([]);
  const [evolutionConfig, setEvolutionConfig] = useState<EvolutionConfig | undefined>();
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);

  useEffect(() => {
    const fetchLuisData = async () => {
      try {
        const res = await fetch('/api/agents/agent-luis');
        const json = await res.json();

        if (json.ok && json.agent) {
          setAgent(json.agent);
          // Note: The service provides normalized agent data
          // In a real scenario, you'd want to return raw data for the UI components
          // For now, we're extracting what we can from the agent structure
        }
      } catch (error) {
        console.error('Error fetching Luis data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLuisData();
  }, []);

  const calculateKPIs = () => {
    const contactedCount = leads.filter(l => l.contato_realizado).length;
    const attendanceTypes: Record<string, number> = {};
    const origins: Record<string, number> = {};

    leads.forEach(lead => {
      if (lead['Tipo de Atendimento']) {
        attendanceTypes[lead['Tipo de Atendimento']] =
          (attendanceTypes[lead['Tipo de Atendimento']] || 0) + 1;
      }
      if (lead.origem) {
        origins[lead.origem] = (origins[lead.origem] || 0) + 1;
      }
    });

    return {
      totalLeads: leads.length,
      contactedLeads: contactedCount,
      attendanceTypes,
      origins,
    };
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">Carregando dados de Luis...</div>
      </div>
    );
  }

  const kpiData = calculateKPIs();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🤖 Luis — Atendimento Receptivo</h1>
        <p className="text-gray-600 mt-2">Cockpit de CRM + IA para acompanhamento de leads em tempo real</p>
      </div>

      {/* KPI Cards */}
      <KPICards data={kpiData} />

      {/* Main Grid and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leads Grid */}
          <LeadsGrid leads={leads} onLeadClick={setSelectedLead} />

          {/* Interaction Analysis */}
          {analises.length > 0 && (
            <InteractionAnalysisWidget analises={analises} />
          )}
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* AI Sessions */}
          {sessions.length > 0 && (
            <AISessionsWidget sessions={sessions} />
          )}

          {/* Reminders */}
          {reminders.length > 0 && (
            <RemindersWidget reminders={reminders} title="Próximos Lembretes" />
          )}

          {/* WhatsApp Status */}
          <WhatsAppStatusCard config={evolutionConfig} />
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
