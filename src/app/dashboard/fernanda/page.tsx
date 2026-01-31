'use client';

import { useEffect, useState } from 'react';
import { BrainDrawer } from '@/components/shared';
import { useBrainDrawerData } from '@/hooks/use-brain-drawer-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FernandaAgent {
  id: string;
  nome: string;
  leads_ativos: number;
  conversoes: number;
  receita_total: number;
}

interface LeadData {
  id: string;
  nome: string;
  veiculo?: string;
  intencao?: string;
  whatsapp?: string;
  email?: string;
  sessionid?: string;
  contatado: boolean;
  created_at: string;
}

export default function FernandaPage() {
  const [agent, setAgent] = useState<FernandaAgent | null>(null);
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [memoria, setMemoria] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [intervencoes, setIntervencoes] = useState<any[]>([]);
  const [curadoria, setCuradoria] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    const fetchFernandaData = async () => {
      try {
        const res = await fetch('/api/agents/fernanda');
        const json = await res.json();

        if (json && json.leads_ativos !== undefined) {
          setAgent({
            id: 'fernanda',
            nome: 'Fernanda',
            leads_ativos: json.leads_ativos,
            conversoes: json.conversoes,
            receita_total: json.receita_total,
          });
        }
      } catch (error) {
        console.error('Error fetching Fernanda data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFernandaData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">Carregando dados de Fernanda...</div>
      </div>
    );
  }

  const contactedCount = leads.filter((l) => l.contatado).length;

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
          <div className="text-sm text-gray-600 mb-1">Taxa de Contato</div>
          <div className="text-3xl font-bold text-green-600">
            {leads.length > 0 ? Math.round((contactedCount / leads.length) * 100) : 0}%
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Conversões</div>
          <div className="text-3xl font-bold text-purple-600">{agent?.conversoes || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Receita Gerada</div>
          <div className="text-3xl font-bold text-orange-600">R$ {(agent?.receita_total || 0).toLocaleString('pt-BR')}</div>
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
                      <th className="px-4 py-2 text-left font-semibold">Veículo</th>
                      <th className="px-4 py-2 text-left font-semibold">Intenção</th>
                      <th className="px-4 py-2 text-left font-semibold">Contato</th>
                      <th className="px-4 py-2 text-left font-semibold">Última Interação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleLeadClick(lead.id, lead.nome)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{lead.nome}</div>
                          <div className="text-xs text-gray-500">{lead.whatsapp || lead.email || '-'}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">{lead.veiculo || '-'}</td>
                        <td className="px-4 py-3 text-sm">{lead.intencao || '-'}</td>
                        <td className="px-4 py-3">
                          <Badge className={lead.contatado ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {lead.contatado ? '✓ Contactado' : 'Não contactado'}
                          </Badge>
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
              <p>Nenhum lead para reativar</p>
            </Card>
          )}

          {/* Intervenções */}
          {intervencoes.length > 0 && (
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">⚠️ Intervenções Humanas</h2>
              <div className="space-y-2">
                {intervencoes.slice(0, 10).map((intervencao, idx) => (
                  <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                    <div className="font-mono text-xs text-red-700">{intervencao.sessionid}</div>
                    <div className="text-red-900 mt-1">{intervencao.block}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* Memória */}
          {memoria.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3">💾 Memória</h3>
              <div className="space-y-2">
                {memoria.slice(0, 5).map((mem, idx) => (
                  <div key={idx} className="p-2 bg-gray-100 rounded text-xs">
                    <div className="text-gray-700 line-clamp-2">{mem.last_message_ia}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Curadoria */}
          {curadoria.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3">🔍 Erros Detectados</h3>
              <div className="space-y-2">
                {curadoria.slice(0, 5).map((item, idx) => (
                  <Badge key={idx} className="bg-orange-100 text-orange-800 block mb-2 p-2">
                    {item.name}
                  </Badge>
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
        agentType="fernanda"
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
