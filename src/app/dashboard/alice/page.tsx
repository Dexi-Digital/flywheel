'use client';

import { useEffect, useState } from 'react';
import { BrainDrawer } from '@/components/shared';
import { useBrainDrawerData } from '@/hooks/use-brain-drawer-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buildService } from '@/services/factory';
import type { Agent } from '@/types/database.types';

export default function AlicePage() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [isBrainDrawerOpen, setIsBrainDrawerOpen] = useState(false);
  const [selectedLeadName, setSelectedLeadName] = useState('');

  const { data: brainData, fetchBrainData } = useBrainDrawerData({
    agentId: 'alice',
    leadId: selectedLead || '',
  });

  const handleLeadClick = (leadId: string, leadName?: string) => {
    setSelectedLead(leadId);
    setSelectedLeadName(leadName || '');
    setIsBrainDrawerOpen(true);
  };

  useEffect(() => {
    if (isBrainDrawerOpen && selectedLead) {
      fetchBrainData();
    }
  }, [isBrainDrawerOpen, selectedLead, fetchBrainData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const service = buildService('alice');
        const data = await service.getAgent('alice');
        setAgent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">Carregando dados de Alice...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="text-red-900">Erro: {error}</div>
        </Card>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">Agente não encontrado</div>
      </div>
    );
  }

  const leads = agent.leads || [];
  const taxaConversao = leads.length > 0 ? ((agent.metricas_agregadas.conversoes || 0) / leads.length) * 100 : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">📞 Alice — Outbound</h1>
        <p className="text-gray-600 mt-2">
          Campanhas telefônicas e contatos ativos com histórico de chamadas e interações
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Leads Ativos</div>
          <div className="text-3xl font-bold text-blue-600">{leads.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Taxa de Sucesso</div>
          <div className="text-3xl font-bold text-green-600">{taxaConversao.toFixed(1)}%</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Conversões</div>
          <div className="text-3xl font-bold text-purple-600">{agent.metricas_agregadas.conversoes}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Receita Total</div>
          <div className="text-3xl font-bold text-orange-600">
            R$ {(agent.metricas_agregadas.receita_total || 0).toLocaleString('pt-BR')}
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Leads Grid */}
        <div className="lg:col-span-2 space-y-6">
          {leads.length > 0 ? (
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">Contatos para Outbound</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">Contato</th>
                      <th className="px-4 py-2 text-left font-semibold">Telefone</th>
                      <th className="px-4 py-2 text-left font-semibold">Email</th>
                      <th className="px-4 py-2 text-left font-semibold">Status</th>
                      <th className="px-4 py-2 text-left font-semibold">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleLeadClick(lead.id, lead.nome)}
                      >
                        <td className="px-4 py-3 font-medium">{lead.nome}</td>
                        <td className="px-4 py-3 text-sm">{lead.telefone || '-'}</td>
                        <td className="px-4 py-3 text-sm">{lead.email || '-'}</td>
                        <td className="px-4 py-3">
                          <Badge className="bg-blue-100 text-blue-800">{lead.status || 'Ativo'}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center text-gray-500">
              <p>Nenhum contato disponível</p>
            </Card>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* Recent Events */}
          {agent.events && agent.events.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3">📅 Atividades Recentes</h3>
              <div className="space-y-2">
                {agent.events.slice(0, 5).map((event, idx) => (
                  <div key={idx} className="p-2 bg-blue-50 rounded text-xs border border-blue-200">
                    <div className="text-blue-900 font-medium">
                      {(event as any).tipo || 'Evento'}
                    </div>
                    <div className="text-blue-700 text-xs line-clamp-2">
                      {(event as any).descricao || (event as any).message}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Brain Drawer */}
      <BrainDrawer
        isOpen={isBrainDrawerOpen}
        onClose={() => setIsBrainDrawerOpen(false)}
        leadId={selectedLead || ''}
        leadName={selectedLeadName}
        agentType="alice"
        chatMessages={brainData.chatMessages}
        chatSessions={brainData.chatSessions}
        internalReasoning={brainData.internalReasoning}
        memoryData={brainData.memoryData}
      />
    </div>
  );
}
