'use client';

import { useEffect, useState } from 'react';
import { BrainDrawer } from '@/components/shared';
import { useBrainDrawerData } from '@/hooks/use-brain-drawer-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AngelaAgent {
  id: string;
  nome: string;
  leads_ativos: number;
  conversoes: number;
  receita_total: number;
}

interface CustomerData {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  status?: string;
  satisfacao?: string;
  created_at: string;
}

export default function AngelaPage() {
  const [agent, setAgent] = useState<AngelaAgent | null>(null);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [satisfacao, setSatisfacao] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    const fetchAngelaData = async () => {
      try {
        const res = await fetch('/api/agents/angela');
        const json = await res.json();

        if (json && json.leads_ativos !== undefined) {
          setAgent({
            id: 'angela',
            nome: 'Angela',
            leads_ativos: json.leads_ativos,
            conversoes: json.conversoes,
            receita_total: json.receita_total,
          });
        }
      } catch (error) {
        console.error('Error fetching Angela data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAngelaData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">Carregando dados de Angela...</div>
      </div>
    );
  }

  const satisfiedCount = satisfacao.filter((s) => s.sentimento === 'Satisfeito' || s.score >= 4).length;
  const satisfactionRate = satisfacao.length > 0 ? Math.round((satisfiedCount / satisfacao.length) * 100) : 0;

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
          <div className="text-sm text-gray-600 mb-1">Pedidos</div>
          <div className="text-3xl font-bold text-purple-600">{pedidos.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Receita Retida</div>
          <div className="text-3xl font-bold text-orange-600">R$ {(agent?.receita_total || 0).toLocaleString('pt-BR')}</div>
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
                          <Badge className={customer.satisfacao === 'Satisfeito' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {customer.satisfacao || 'Pendente'}
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

          {/* Pedidos */}
          {pedidos.length > 0 && (
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">📦 Pedidos Acompanhados</h2>
              <div className="space-y-2">
                {pedidos.slice(0, 10).map((pedido, idx) => (
                  <div key={idx} className="p-3 bg-purple-50 border border-purple-200 rounded text-sm">
                    <div className="font-semibold">{pedido.order_id || `Pedido ${idx + 1}`}</div>
                    <div className="text-xs text-gray-600">
                      Status: {pedido.status || 'Processando'}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* Satisfação */}
          {satisfacao.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3">😊 Feedback Recente</h3>
              <div className="space-y-2">
                {satisfacao.slice(0, 5).map((feedback, idx) => (
                  <div key={idx} className="p-2 bg-green-50 rounded text-xs border border-green-200">
                    <div className="text-green-900 font-medium">
                      {feedback.sentimento || 'Positivo'}
                    </div>
                    <div className="text-green-700 text-xs line-clamp-2">
                      {feedback.feedback || feedback.message}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Chat History */}
          {chats.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3">💬 Interações</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {chats.slice(0, 5).map((chat, idx) => (
                  <div key={idx} className="p-2 bg-blue-100 rounded text-xs">
                    <div className="text-blue-900 line-clamp-2">{chat.message || chat.content}</div>
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

      {/* Debug info */}
      {agent && (
        <div className="mt-8 p-4 bg-blue-50 rounded border border-blue-200 text-sm text-blue-900">
          <strong>Agent Data:</strong> Clientes ativos: {agent.leads_ativos}, Retenções:{' '}
          {agent.conversoes}, Receita Retida: R$ {agent.receita_total.toLocaleString('pt-BR')}
        </div>
      )}
    </div>
  );
}
