'use client';

import { useEffect, useState } from 'react';
import { BrainDrawer } from '@/components/shared';
import { useBrainDrawerData } from '@/hooks/use-brain-drawer-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AliceAgent {
  id: string;
  nome: string;
  leads_ativos: number;
  conversoes: number;
  receita_total: number;
}

interface CampaignData {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  status?: string;
  created_at: string;
}

export default function AlicePage() {
  const [agent, setAgent] = useState<AliceAgent | null>(null);
  const [leads, setLeads] = useState<CampaignData[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [chamadas, setChamadas] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    const fetchAliceData = async () => {
      try {
        const res = await fetch('/api/agents/alice');
        const json = await res.json();

        if (json && json.leads_ativos !== undefined) {
          setAgent({
            id: 'alice',
            nome: 'Alice',
            leads_ativos: json.leads_ativos,
            conversoes: json.conversoes,
            receita_total: json.receita_total,
          });
        }
      } catch (error) {
        console.error('Error fetching Alice data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAliceData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">Carregando dados de Alice...</div>
      </div>
    );
  }

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
          <div className="text-sm text-gray-600 mb-1">Campanhas</div>
          <div className="text-3xl font-bold text-indigo-600">{campaigns.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Chamadas</div>
          <div className="text-3xl font-bold text-green-600">{chamadas.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Taxa de Sucesso</div>
          <div className="text-3xl font-bold text-purple-600">
            {leads.length > 0 ? Math.round((agent?.conversoes || 0) / leads.length * 100) : 0}%
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

          {/* Chamadas */}
          {chamadas.length > 0 && (
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">📞 Histórico de Chamadas</h2>
              <div className="space-y-2">
                {chamadas.slice(0, 10).map((chamada, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                    <div className="font-semibold">{chamada.nome || 'Contato'}</div>
                    <div className="text-xs text-gray-600">
                      {new Date(chamada.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* Campanhas */}
          {campaigns.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3">📢 Campanhas Ativas</h3>
              <div className="space-y-2">
                {campaigns.slice(0, 5).map((campaign, idx) => (
                  <Badge key={idx} className="bg-indigo-100 text-indigo-800 block mb-2 p-2">
                    {campaign.nome || campaign.name || `Campanha ${idx + 1}`}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Chat History */}
          {chats.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3">💬 Mensagens Recentes</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {chats.slice(0, 5).map((chat, idx) => (
                  <div key={idx} className="p-2 bg-gray-100 rounded text-xs">
                    <div className="text-gray-700 line-clamp-2">{chat.message || chat.content}</div>
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
