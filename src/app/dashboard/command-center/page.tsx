'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { CommandCenterKPIs } from '@/components/command-center/kpis';

interface AgentStatus {
  agentId: string;
  agentName: string;
  activeLeads: number;
  conversions: number;
  totalRevenue: number;
  contactRate: number;
  status: 'active' | 'warning' | 'inactive';
}

export default function CommandCenterPage() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const AGENT_NAMES: Record<string, string> = {
    luis: '👨 Luis - SDR',
    iza: '📣 Iza - Marketing',
    victor: '💰 Victor - Cobrança',
    fernanda: '♻️ Fernanda - Reativação',
    alice: '📞 Alice - Outbound',
    angela: '⭐ Angela - Pós-venda',
  };

  useEffect(() => {
    const fetchAgentStatus = async () => {
      try {
        setLoading(true);
        const agentIds = ['luis', 'iza', 'victor', 'fernanda', 'alice', 'angela'];

        const responses = await Promise.all(
          agentIds.map((agentId) =>
            fetch(`/api/agents/${agentId}`).then((res) => {
              if (res.ok) return res.json();
              throw new Error(`Failed to fetch ${agentId}`);
            }).catch((err) => {
              console.warn(`Failed to fetch ${agentId}:`, err);
              return null;
            })
          )
        );

        const agentStatuses: AgentStatus[] = responses
          .map((data, idx) => {
            const agentId = agentIds[idx];
            if (!data) {
              return {
                agentId,
                agentName: AGENT_NAMES[agentId],
                activeLeads: 0,
                conversions: 0,
                totalRevenue: 0,
                contactRate: 0,
                status: 'inactive' as const,
              };
            }

            const conversions = data.conversoes || 0;
            const activeLeads = data.leads_ativos || 0;
            const contactRate = activeLeads > 0 ? (conversions / activeLeads) * 100 : 0;
            const totalRevenue = data.receita_total || 0;

            const status: 'active' | 'warning' | 'inactive' = activeLeads > 0 ? 'active' : 'inactive';
            return {
              agentId,
              agentName: AGENT_NAMES[agentId],
              activeLeads,
              conversions,
              totalRevenue,
              contactRate,
              status,
            };
          })
          .filter((agent) => agent !== null) as AgentStatus[];

        setAgents(agentStatuses);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Failed to fetch agent statuses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentStatus();

    // Refresh every 30 seconds
    const interval = setInterval(fetchAgentStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalActiveLeads = agents.reduce((sum, a) => sum + a.activeLeads, 0);
  const totalConversions = agents.reduce((sum, a) => sum + a.conversions, 0);
  const totalRevenue = agents.reduce((sum, a) => sum + a.totalRevenue, 0);

  return (
    <div className="flex-1 overflow-hidden">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <h1 className="text-3xl font-bold">🎯 Central de Comando</h1>
        <p className="text-sm text-gray-600 mt-1">
          Visão consolidada de todos os agentes • {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>

      {/* Content */}
      <div className="overflow-y-auto">
        {/* Global KPIs */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Pulso Operacional</h2>
          <CommandCenterKPIs
            data={{
              totalLeads: totalActiveLeads,
              activeLeads: totalActiveLeads,
              conversions: totalConversions,
              totalRevenue: totalRevenue,
              contactRate: totalActiveLeads > 0 ? (totalConversions / totalActiveLeads) * 100 : 0,
              aiAutonomy: 0,
              humanInterventions: 0,
              returnRequests: 0,
            }}
          />
        </div>

        {/* Agent Status Grid */}
        <div className="px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-900">
              <p className="font-semibold">Erro ao carregar status dos agentes</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhum agente disponível</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <Card
                  key={agent.agentId}
                  className={`p-4 border-l-4 transition-all hover:shadow-lg cursor-pointer ${
                    agent.status === 'active'
                      ? 'border-l-green-500 bg-white'
                      : agent.status === 'warning'
                        ? 'border-l-yellow-500 bg-yellow-50'
                        : 'border-l-red-500 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900">{agent.agentName}</h3>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        agent.status === 'active'
                          ? 'bg-green-500'
                          : agent.status === 'warning'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                    ></div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {/* Active Leads */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">👥 Leads Ativos</span>
                      <span className="font-semibold text-gray-900">{agent.activeLeads}</span>
                    </div>

                    {/* Conversions */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">✅ Conversões</span>
                      <span className="font-semibold text-green-600">{agent.conversions}</span>
                    </div>

                    {/* Contact Rate */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">📞 Taxa de Contato</span>
                      <span className="font-semibold text-blue-600">{agent.contactRate.toFixed(1)}%</span>
                    </div>

                    {/* Revenue */}
                    {agent.totalRevenue > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">💰 Receita</span>
                        <span className="font-semibold text-purple-600">
                          R$ {(agent.totalRevenue / 1000).toFixed(1)}k
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 pt-3 border-t">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (agent.activeLeads / Math.max(...agents.map((a) => a.activeLeads), 1)) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Alerts Section */}
        <div className="px-6 py-6 border-t bg-gray-50">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">⚠️ Alertas e Intervenções</h2>
          <Card className="p-4 bg-yellow-50 border-yellow-200 text-yellow-900">
            <p className="text-sm">Seção de alertas em desenvolvimento - agregará intervencao_humana de todos os agentes</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
