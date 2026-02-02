'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { Agent } from '@/types/database.types';
import {
  fetchKanbanData,
  getEmptyKanbanResponse,
  type KanbanApiResponse,
} from '@/services/kanban-api.service';
import {
  Clock,
  Users,
  DollarSign,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Bot,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';

const AGENT_IDS = [
  'agent-luis',
  'agent-angela',
  'agent-alice',
  'agent-fernanda',
  'agent-iza',
  'agent-vitor',
] as const;

function getAgentHref(agentId: string): string {
  if (agentId === 'agent-vitor') return '/dashboard/vitor';
  if (agentId === 'agent-alice') return '/dashboard/alice';
  if (agentId === 'agent-angela') return '/dashboard/angela';
  if (agentId === 'agent-fernanda') return '/dashboard/fernanda';
  if (agentId === 'agent-luis') return '/dashboard/luis';

  return `/dashboard/agentes/${agentId}`;
}

function formatTempoMedio(horas: number, minutos?: number): string {
  if (minutos != null && minutos > 0 && minutos < 60) return `${minutos} min`;
  if (horas >= 24) {
    const dias = Math.round(horas / 24);
    return `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  }
  return `${Math.round(horas)}h`;
}

export default function DashboardPage() {
  const [agents, setAgents] = useState<Record<string, Agent | null>>({});
  const [kanban, setKanban] = useState<KanbanApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);

    const agentPromises = AGENT_IDS.map(async (id) => {
      try {
        const res = await fetch(`/api/agents/${id}`);
        const json = await res.json();
        return { id, agent: json.ok ? json.agent : null };
      } catch {
        return { id, agent: null };
      }
    });

    let kanbanData: KanbanApiResponse = getEmptyKanbanResponse();
    try {
      kanbanData = await fetchKanbanData(true);
    } catch (e) {
      console.warn('Kanban indisponível:', e);
    }

    const results = await Promise.all(agentPromises);
    const byId: Record<string, Agent | null> = {};
    results.forEach(({ id, agent }) => {
      byId[id] = agent;
    });

    setAgents(byId);
    setKanban(kanbanData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">
          Carregando visão dos agentes...
        </p>
      </div>
    );
  }

  const hasAnyAgent = Object.values(agents).some((a) => a !== null);
  if (!hasAnyAgent) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              Nenhum agente disponível
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Verifique as variáveis de ambiente e a conexão com as fontes de dados.
            </p>
            <button
              type="button"
              onClick={loadData}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Visão do Círculo
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Resumo de todos os agentes em um só lugar
        </p>
      </div>

      {/* Grid em formato de “círculo”: cards dos agentes */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {AGENT_IDS.map((agentId) => {
          const agent = agents[agentId] ?? null;
          const nome = agent?.nome ?? agentId.replace('agent-', '');
          const href = getAgentHref(agentId);
          const isVitor = agentId === 'agent-vitor';

          if (!agent) {
            return (
              <Card key={agentId} className="border-dashed opacity-80">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={nome} size="md" />
                      <span className="font-semibold capitalize text-gray-700 dark:text-gray-300">
                        {nome}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Dados indisponíveis
                  </p>
                  <Link
                    href={href}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Abrir agente
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            );
          }

          const metrics = (agent.metricas_agregadas || {}) as Record<string, unknown>;
          const tempoMedioHorasRaw = Number(metrics.tempo_medio_horas) || 0;
          const tempoMedioMinutos = Number(metrics.tempo_medio_minutos) || 0;
          const tempoMedioHoras =
            tempoMedioHorasRaw > 0 && tempoMedioHorasRaw <= 720
              ? tempoMedioHorasRaw
              : 0;
          const tempoMedioValido =
            tempoMedioHoras > 0 || tempoMedioMinutos > 0;

          // Pipeline de Recuperação (Vitor: Kanban + metricas; outros: só leads se aplicável)
          let emAberto = Number(metrics.clientes_em_aberto) || 0;
          let emNegociacao = Number(metrics.clientes_em_negociacao) || 0;
          let recuperado = Number(metrics.clientes_recuperados) || 0;

          if (isVitor && kanban) {
            emAberto = kanban.meta['Em Aberto']?.count ?? emAberto;
            emNegociacao = kanban.meta['Em Negociacao']?.count ?? emNegociacao;
            recuperado = kanban.meta['Recuperado']?.count ?? recuperado;
          }

          const totalPipeline = emAberto + emNegociacao + recuperado;
          const pctNegociacao =
            totalPipeline > 0 ? (emNegociacao / totalPipeline) * 100 : 0;
          const pctRecuperado =
            totalPipeline > 0 ? (recuperado / totalPipeline) * 100 : 0;

          const leads = agent.leads || [];
          const leadsAtivos = leads.filter(
            (l) => l.status !== 'PERDIDO' && l.status !== 'GANHO'
          ).length;
          const conversoes = leads.filter((l) => l.status === 'GANHO').length;
          const receita =
            Number(metrics.receita_gerada) ||
            Number(metrics.receita_recuperada) ||
            leads
              .filter((l) => l.status === 'GANHO')
              .reduce((s, l) => s + (l.valor_potencial ?? 0), 0);

          return (
            <Card
              key={agentId}
              className="transition-shadow hover:shadow-md dark:border-gray-700"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={nome} size="md" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {nome}
                    </span>
                  </div>
                  <Link
                    href={href}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:text-gray-300 dark:hover:bg-gray-800"
                    aria-label={`Abrir ${nome}`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tempo Médio de Resolução (quando existir) */}
                {(tempoMedioValido || isVitor) && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      Tempo Médio de Resolução
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {tempoMedioValido
                        ? formatTempoMedio(tempoMedioHoras, tempoMedioMinutos)
                        : 'N/A'}
                    </span>
                  </div>
                )}

                {/* Pipeline de Recuperação (Vitor e qualquer agente com pipeline) */}
                {(isVitor || totalPipeline > 0) && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/30">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Pipeline de Recuperação
                    </p>
                    <ul className="space-y-1.5 text-sm">
                      <li className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Em Aberto
                        </span>
                        <span className="font-medium">{emAberto}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Em Negociação
                        </span>
                        <span className="font-medium">
                          {emNegociacao}
                          {totalPipeline > 0 && (
                            <span className="ml-1 text-gray-500">
                              ({pctNegociacao.toFixed(1)}%)
                            </span>
                          )}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Recuperado
                        </span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {recuperado}
                          {totalPipeline > 0 && (
                            <span className="ml-1 text-gray-500">
                              ({pctRecuperado.toFixed(1)}%)
                            </span>
                          )}
                        </span>
                      </li>
                    </ul>
                  </div>
                )}

                {/* Resumo genérico (leads, conversões, receita) quando não for só pipeline */}
                {!isVitor && (
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {leadsAtivos} ativos
                      </span>
                    </div>
                    {conversoes > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Bot className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {conversoes} conversões
                        </span>
                      </div>
                    )}
                    {receita > 0 && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(receita)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {isVitor && kanban?.meta['Recuperado']?.total_recuperado != null && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-700 dark:text-green-400">
                      {formatCurrency(
                        kanban.meta['Recuperado']?.total_recuperado ?? 0
                      )}{' '}
                      recuperado
                    </span>
                  </div>
                )}

                <Link
                  href={href}
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Ver detalhes
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
