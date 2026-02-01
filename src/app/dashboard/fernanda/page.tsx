'use client';

import { useEffect, useState } from 'react';
import { BrainDrawer } from '@/components/shared';
import { useBrainDrawerData } from '@/hooks/use-brain-drawer-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buildService } from '@/services/factory';
import type { Agent } from '@/types/database.types';

export default function FernandaPage() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [isBrainDrawerOpen, setIsBrainDrawerOpen] = useState(false);
  const [selectedLeadName, setSelectedLeadName] = useState('');

  const { data: brainData, fetchBrainData } = useBrainDrawerData({
    agentId: 'fernanda',
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
        const service = buildService('fernanda');
        const data = await service.getAgent('fernanda');
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
        <div className="text-gray-500">Carregando dados de Fernanda...</div>
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
        <h1 className="text-3xl font-bold text-gray-900">♻️ Fernanda — Reativação</h1>
        <p className="text-gray-600 mt-2">
          Reconversão de leads não convertidos com histórico de interações e memória de contexto
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Leads para Reativar</div>
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
          <div className="text-sm text-gray-600 mb-1">Receita Recuperada</div>
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
              <h2 className="text-lg font-semibold mb-4">Leads para Reativar</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">Lead</th>
                      <th className="px-4 py-2 text-left font-semibold">Status</th>
                      <th className="px-4 py-2 text-left font-semibold">Valor Potencial</th>
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
                        <td className="px-4 py-3">
                          <Badge className={lead.status === 'GANHO' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {lead.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">R$ {(lead.valor_potencial || 0).toLocaleString('pt-BR')}</td>
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
              <p>Nenhum lead para reativar</p>
            </Card>
          )}

          {/* Eventos Recentes */}
          {agent.events && agent.events.length > 0 && (
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">📅 Atividade Recente</h2>
              <div className="space-y-2">
                {agent.events.slice(0, 10).map((event, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                    <div className="font-semibold text-blue-900">{(event as any).titulo || 'Evento'}</div>
                    <div className="text-xs text-blue-700 mt-1">{(event as any).descricao}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3">📊 Resumo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Leads Ativos:</span>
                <span className="font-semibold">{agent.metricas_agregadas.leads_ativos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxa Conversão:</span>
                <span className="font-semibold">{taxaConversao.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Disparos Hoje:</span>
                <span className="font-semibold">{agent.metricas_agregadas.disparos_hoje || 0}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Brain Drawer */}
      <BrainDrawer
        isOpen={isBrainDrawerOpen}
        onClose={() => setIsBrainDrawerOpen(false)}
        leadId={selectedLead || ''}
        leadName={selectedLeadName}
        agentType="fernanda"
        chatMessages={brainData.chatMessages}
        chatSessions={brainData.chatSessions}
        internalReasoning={brainData.internalReasoning}
        memoryData={brainData.memoryData}
      />
    </div>
  );
}
