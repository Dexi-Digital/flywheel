'use client';

import { useEffect, useState } from 'react';
import { BrainDrawer } from '@/components/shared';
import { useBrainDrawerData } from '@/hooks/use-brain-drawer-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buildService } from '@/services/factory';
import type { Agent } from '@/types/database.types';

export default function AngelaPage() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [isBrainDrawerOpen, setIsBrainDrawerOpen] = useState(false);
  const [selectedLeadName, setSelectedLeadName] = useState('');

  const { data: brainData, fetchBrainData } = useBrainDrawerData({
    agentId: 'angela',
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
        const service = buildService('angela');
        const data = await service.getAgent('angela');
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
        <div className="text-gray-500">Carregando dados de Angela...</div>
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

  const customers = agent.leads || [];
  const satisfiedCount = customers.filter((c) => (c as any).satisfacao === 'Satisfeito' || (c as any).score >= 4).length;
  const satisfactionRate = customers.length > 0 ? Math.round((satisfiedCount / customers.length) * 100) : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">⭐ Angela — Pós-venda</h1>
        <p className="text-gray-600 mt-2">
          Acompanhamento de clientes, satisfação e retenção após compra
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Clientes Ativos</div>
          <div className="text-3xl font-bold text-blue-600">{customers.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Taxa de Satisfação</div>
          <div className="text-3xl font-bold text-green-600">{satisfactionRate}%</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Conversões</div>
          <div className="text-3xl font-bold text-purple-600">{agent.metricas_agregadas.conversoes}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Receita Retida</div>
          <div className="text-3xl font-bold text-orange-600">R$ {(agent.metricas_agregadas.receita_total || 0).toLocaleString('pt-BR')}</div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Customers Grid */}
        <div className="lg:col-span-2 space-y-6">
          {customers.length > 0 ? (
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">Clientes em Acompanhamento</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">Cliente</th>
                      <th className="px-4 py-2 text-left font-semibold">Email</th>
                      <th className="px-4 py-2 text-left font-semibold">Telefone</th>
                      <th className="px-4 py-2 text-left font-semibold">Satisfação</th>
                      <th className="px-4 py-2 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleLeadClick(customer.id, customer.nome)}
                      >
                        <td className="px-4 py-3 font-medium">{customer.nome}</td>
                        <td className="px-4 py-3 text-sm">{customer.email || '-'}</td>
                        <td className="px-4 py-3 text-sm">{customer.telefone || '-'}</td>
                        <td className="px-4 py-3">
                          <Badge className={(customer as any).satisfacao === 'Satisfeito' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {(customer as any).satisfacao || 'Pendente'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">{customer.status || 'Ativo'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center text-gray-500">
              <p>Nenhum cliente em acompanhamento</p>
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
                  <div key={idx} className="p-2 bg-green-50 rounded text-xs border border-green-200">
                    <div className="text-green-900 font-medium">
                      {(event as any).tipo || 'Evento'}
                    </div>
                    <div className="text-green-700 text-xs line-clamp-2">
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
        agentType="angela"
        chatMessages={brainData.chatMessages}
        chatSessions={brainData.chatSessions}
        sentimento={brainData.sentimento}
        problema={brainData.problema}
        memoryData={brainData.memoryData}
      />
    </div>
  );
}
