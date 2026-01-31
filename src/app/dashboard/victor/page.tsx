'use client';

import { useEffect, useState } from 'react';
import {
  VictorKPICards,
  DevedoresGrid,
  ParcelasWidget,
  RenegociacoesWidget,
  DispatchControlWidget,
  MessagesWidget,
  OptOutWidget,
  PaymentProofWidget,
} from '@/components/victor';

interface VictorAgent {
  id: string;
  nome: string;
  leads_ativos: number;
  conversoes: number;
  receita_total: number;
}

export default function VictorPage() {
  const [agent, setAgent] = useState<VictorAgent | null>(null);
  const [devedores, setDevedores] = useState<any[]>([]);
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [renegociacoes, setRenegociacoes] = useState<any[]>([]);
  const [disparos, setDisparos] = useState<any[]>([]);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [bufferMessages, setBufferMessages] = useState<any[]>([]);
  const [optOuts, setOptOuts] = useState<any[]>([]);
  const [whatsappInexistentes, setWhatsappInexistentes] = useState<any[]>([]);
  const [comprovantes, setComprovantes] = useState<any[]>([]);
  const [pix, setPix] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVictorData = async () => {
      try {
        const res = await fetch('/api/agents/agent-victor');
        const json = await res.json();

        if (json.ok && json.agent) {
          setAgent(json.agent);
        }
      } catch (error) {
        console.error('Error fetching Victor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVictorData();
  }, []);

  const calculateKPIs = () => {
    const totalDebt = parcelas.reduce((sum, p) => sum + (p.valor_parcela || 0), 0);
    const contractsOverdue = parcelas.filter(p => p.dias_em_atraso > 0).length;
    const avgOverdue = parcelas.length > 0
      ? Math.round(
          parcelas.reduce((sum, p) => sum + (p.dias_em_atraso || 0), 0) / parcelas.length,
        )
      : 0;

    return {
      totalDebtors: devedores.length,
      totalDebt,
      contractsOverdue,
      averageDaysOverdue: avgOverdue,
    };
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">Carregando dados de Victor...</div>
      </div>
    );
  }

  const kpiData = calculateKPIs();
  const parcelasByClient: Record<string, any[]> = {};
  devedores.forEach(dev => {
    parcelasByClient[dev.id_cliente] = parcelas.filter(p => p.id_cliente === dev.id_cliente);
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">💰 Victor — Cobrança</h1>
        <p className="text-gray-600 mt-2">
          Acompanhamento de devedores, parcelas, renegociações e disparos de cobrança
        </p>
      </div>

      {/* KPI Cards */}
      <VictorKPICards data={kpiData} />

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Devedores Grid & Parcelas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Devedores */}
          {devedores.length > 0 && (
            <DevedoresGrid devedores={devedores} parcelas={parcelasByClient} />
          )}

          {/* Parcelas */}
          {parcelas.length > 0 && (
            <ParcelasWidget parcelas={parcelas} />
          )}

          {/* Renegociações */}
          {renegociacoes.length > 0 && (
            <RenegociacoesWidget renegociacoes={renegociacoes} />
          )}

          {/* Dispatch Control */}
          {disparos.length > 0 && (
            <DispatchControlWidget disparos={disparos} />
          )}
        </div>

        {/* Right: Sidebar Widgets */}
        <div className="space-y-6">
          {/* Messages & Buffer */}
          <MessagesWidget mensagens={mensagens} bufferMessages={bufferMessages} />

          {/* Opt-out & Invalid */}
          <OptOutWidget optOuts={optOuts} whatsappInexistentes={whatsappInexistentes} />

          {/* Payment Proof & PIX */}
          <PaymentProofWidget comprovantes={comprovantes} pix={pix} />
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
