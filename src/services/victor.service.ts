import type { SupabaseClient } from '@supabase/supabase-js';
import type { AgentService } from '@/types/service.type';
import { getBrowserTenantClient } from '@/lib/supabase/agentClients';
import { getTenantConfig } from '@/lib/supabase/agents';
import { Lead, Event } from '@/types/database.types';
import { buildAgentCommon } from './common';

function toStr(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  return String(v);
}

async function fetchVictorData(sb: SupabaseClient) {
  // Acompanhamento de leads (base principal)
  // Aumentar limite para mostrar todos os clientes no Kanban
  const acompanhamentoPromise = sb
    .from('acompanhamento_leads')
    .select('id,created_at,nome_cliente,id_cliente,numero_cliente,id_divida')
    .order('created_at', { ascending: false })
    .limit(500); // Aumentado para cobrir todos os clientes

  // Parcelas (informações da dívida / financeiro)
  const parcelasPromise = sb
    .from('tgv_parcela')
    .select(`
      id,id_divida,id_cliente,numero_contrato,numero_parcela,total_parcelas,
      quantidade_parcelas_restantes,tipo_parcela,descricao_referencia,valor_parcela,
      data_vencimento,descricao_vencimento,status_parcela,status_renegociacao,
      dias_em_atraso,loteamento,descricao_unidade,telefone,telefone_nono_digito,whatsapp_existe
    `)
    .order('data_vencimento', { ascending: true })
    .limit(100);

  // Parcelas RENEGOCIADAS (para coluna "Em Negociação" do Kanban)
  const parcelasRenegociadasPromise = sb
    .from('tgv_parcela')
    .select('id,id_cliente,valor_parcela,status_renegociacao')
    .eq('status_renegociacao', 'RENEGOCIADO')
    .limit(500);

  // Renegociações ativas
  const renegociacaoPromise = sb
    .from('tgv_renegociacao')
    .select('id,id_cliente,id_divida,loteamento,descricao_contrato,aberta_em,vencimento,atraso,dias_em_debito,ativo')
    .eq('ativo', true)
    .order('created_at', { ascending: false })
    .limit(50);

  // Controle de disparo (comunicação)
  const disparoPromise = sb
    .from('controle_disparo')
    .select(`
      id,created_at,nome_cliente,telefone_cliente,id_cliente,id_divida,
      disparo_realizado,dateTime_disparo,vencimento,dias_atraso
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  // Mensagens enviadas/recebidas
  const mensagensPromise = sb
    .from('tgv_mensagem')
    .select('id,created_at,direcao,mensagem,telefone_nono_digito,wa_mensagem_id,wa_resposta_msg_id')
    .order('created_at', { ascending: false })
    .limit(100);

  // Buffer de mensagens (fila)
  const bufferMessagePromise = sb
    .from('buffer_message')
    .select('id,created_at,chat_id,message,message_id,timestamp')
    .order('created_at', { ascending: false })
    .limit(50);

  // Opt-out de WhatsApp
  const optOutPromise = sb
    .from('tgv_opt_out')
    .select('id,telefone_nono_digito,solicitado_em')
    .order('solicitado_em', { ascending: false })
    .limit(30);

  // WhatsApp inválidos
  const whatsappInexistentePromise = sb
    .from('whatsapp_inexistente')
    .select('id,nome_cliente,id_cliente,numero_cliente')
    .order('created_at', { ascending: false })
    .limit(30);

  // Memória de sessão
  const memoriaPromise = sb
    .from('memoria')
    .select('session_id,created_at,last_message_ia,last_message_user,last_time_message_ai,last_time_message_user')
    .order('created_at', { ascending: false })
    .limit(30);

  // Históricos n8n
  const n8nHistoriesPromise = sb
    .from('n8n_chat_histories')
    .select('id,session_id,created_at,message')
    .order('created_at', { ascending: false })
    .limit(100);

  // Comprovantes de pagamento
  const comprovantesPromise = sb
    .from('comprovantes')
    .select('id,data_envio,link_conprovante,id_client')
    .order('data_envio', { ascending: false })
    .limit(50);

  // PIX - dados bancários
  // Nota: A tabela pix pode não ter a coluna created_at
  const pixPromise = sb
    .from('pix')
    .select('id,nome_CNPJ,cnpj,relacao_loteamento')
    .limit(20);

  // Aguardar todas em paralelo
  const [
    acompanhamentoRes,
    parcelasRes,
    parcelasRenegociadasRes,
    renegociacaoRes,
    disparoRes,
    mensagensRes,
    bufferMessageRes,
    optOutRes,
    whatsappInexistenteRes,
    memoriaRes,
    n8nHistoriesRes,
    comprovantesRes,
    pixRes,
  ] = await Promise.all([
    acompanhamentoPromise,
    parcelasPromise,
    parcelasRenegociadasPromise,
    renegociacaoPromise,
    disparoPromise,
    mensagensPromise,
    bufferMessagePromise,
    optOutPromise,
    whatsappInexistentePromise,
    memoriaPromise,
    n8nHistoriesPromise,
    comprovantesPromise,
    pixPromise,
  ]);

  if (acompanhamentoRes.error) throw new Error(`acompanhamento_leads: ${acompanhamentoRes.error.message}`);
  if (parcelasRes.error) console.warn(`tgv_parcela (non-critical): ${parcelasRes.error.message}`);
  if (parcelasRenegociadasRes.error) console.warn(`tgv_parcela RENEGOCIADO (non-critical): ${parcelasRenegociadasRes.error.message}`);
  if (renegociacaoRes.error) console.warn(`tgv_renegociacao (non-critical): ${renegociacaoRes.error.message}`);
  if (disparoRes.error) console.warn(`controle_disparo (non-critical): ${disparoRes.error.message}`);
  if (mensagensRes.error) console.warn(`tgv_mensagem (non-critical): ${mensagensRes.error.message}`);
  if (bufferMessageRes.error) console.warn(`buffer_message (non-critical): ${bufferMessageRes.error.message}`);
  if (optOutRes.error) console.warn(`tgv_opt_out (non-critical): ${optOutRes.error.message}`);
  if (whatsappInexistenteRes.error) console.warn(`whatsapp_inexistente (non-critical): ${whatsappInexistenteRes.error.message}`);
  if (memoriaRes.error) console.warn(`memoria (non-critical): ${memoriaRes.error.message}`);
  if (n8nHistoriesRes.error) console.warn(`n8n_chat_histories (non-critical): ${n8nHistoriesRes.error.message}`);
  if (comprovantesRes.error) console.warn(`comprovantes (non-critical): ${comprovantesRes.error.message}`);
  if (pixRes.error) console.warn(`pix (non-critical): ${pixRes.error.message}`);

  return {
    acompanhamento: (acompanhamentoRes.data ?? []) as Record<string, any>[],
    parcelas: (parcelasRes.data ?? []) as Record<string, any>[],
    parcelasRenegociadas: (parcelasRenegociadasRes.data ?? []) as Record<string, any>[],
    renegociacao: (renegociacaoRes.data ?? []) as Record<string, any>[],
    disparo: (disparoRes.data ?? []) as Record<string, any>[],
    mensagens: (mensagensRes.data ?? []) as Record<string, any>[],
    bufferMessage: (bufferMessageRes.data ?? []) as Record<string, any>[],
    optOut: (optOutRes.data ?? []) as Record<string, any>[],
    whatsappInexistente: (whatsappInexistenteRes.data ?? []) as Record<string, any>[],
    memoria: (memoriaRes.data ?? []) as Record<string, any>[],
    n8nHistories: (n8nHistoriesRes.data ?? []) as Record<string, any>[],
    comprovantes: (comprovantesRes.data ?? []) as Record<string, any>[],
    pix: (pixRes.data ?? []) as Record<string, any>[],
  };
}

// Função auxiliar para validar e converter datas
function toSafeDate(value: unknown): string {
  if (!value) return new Date().toISOString();
  const str = String(value);
  const date = new Date(str);
  return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

// Função auxiliar para normalizar valores monetários (texto com vírgula para número)
function parseValorMonetario(valor: unknown): number {
  if (!valor) return 0;
  const str = String(valor);
  // Remove tudo exceto números, ponto, vírgula e sinal de menos
  const normalized = str.replace(',', '.').replace(/[^0-9.\-]/g, '');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

function normalizeLead(row: Record<string, any>, agentId: string): Lead {
  const createdAt = toSafeDate(row.created_at);
  const ultimaInteracao = toSafeDate(row.ultima_interacao);

  return {
    id: String(row.id),
    nome: toStr(row.nome_cliente) ?? 'Sem nome',
    email: toStr(row.email) ?? '',
    whatsapp: undefined,
    telefone: toStr(row.telefone),
    empresa: undefined,
    origem: 'Inbound',
    status: 'EM_CONTATO',
    agente_atual_id: agentId,
    tempo_parado: undefined,
    valor_potencial: Number(row.valor_devido) || 0,
    ultima_interacao: ultimaInteracao,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

export const victorService: AgentService = {
  id: 'agent-vitor',

  async getAgent(agentId: string) {
    const cfg = getTenantConfig(agentId);
    const sb = getBrowserTenantClient(agentId, cfg);

    const data = await fetchVictorData(sb);

    // ========== QUERIES OTIMIZADAS VIA RPC ==========

    // 1. RECEITA RECUPERADA (total e últimos 30 dias)
    const receitaTotalRes = await sb.rpc('get_receita_recuperada_total');
    console.log('[VICTOR DEBUG] Receita Total RPC:', receitaTotalRes);
    const receita_recuperada_total = Number(receitaTotalRes.data?.[0]?.receita_recuperada_total) || 0;

    const receitaDiariaRes = await sb.rpc('get_receita_recuperada_30_dias');
    console.log('[VICTOR DEBUG] Receita Diária RPC:', receitaDiariaRes.data?.length, 'dias');
    const receita_por_dia = receitaDiariaRes.data || [];

    // 2. TEMPO MÉDIO DE RESOLUÇÃO (RPC retorna texto: "Tempo Médio de Resolução: X minutos" ou "sem dados")
    const tempoMedioRes = await sb.rpc('get_tempo_medio_resolucao', {});
    const tempoMedioText =
      typeof tempoMedioRes.data === 'string'
        ? tempoMedioRes.data
        : Array.isArray(tempoMedioRes.data) && tempoMedioRes.data[0] != null
          ? (typeof (tempoMedioRes.data[0] as any) === 'string'
            ? (tempoMedioRes.data[0] as string)
            : (tempoMedioRes.data[0] as any)?.get_tempo_medio_resolucao ?? '')
          : '';
    const minutosMatch = tempoMedioText.match(/(\d+)\s*minutos?/i);
    const tempo_medio_resolucao_minutos = minutosMatch ? Number(minutosMatch[1]) : 0;
    const tempo_medio_resolucao_horas = tempo_medio_resolucao_minutos / 60;
    console.log('[VICTOR DEBUG] Tempo Médio RPC (texto):', tempoMedioText, '→', tempo_medio_resolucao_horas.toFixed(2), 'h');

    // 3. FLUXO DE TRABALHO (Kanban - contagem por status)
    const kanbanRes = await sb.rpc('get_kanban_status');
    console.log('[VICTOR DEBUG] Kanban RPC:', kanbanRes);
    const kanbanRows = kanbanRes.data || [];
    // Suportar dois formatos: (1) agregado { status, quantidade } ou (2) lista de clientes { status_kanban, id_cliente, ... }
    const kanban_counts: Record<string, number> = {};
    if (kanbanRows.length > 0) {
      const first = kanbanRows[0];
      if (first != null && 'quantidade' in first && 'status' in first) {
        // Formato agregado (status, quantidade)
        kanbanRows.forEach((row: any) => {
          kanban_counts[String(row.status)] = Number(row.quantidade) || 0;
        });
      } else {
        // Formato lista de clientes (status_kanban, id_cliente, ...) — derivar contagens
        kanbanRows.forEach((row: any) => {
          const status = row.status_kanban || row.status || 'Em Aberto';
          kanban_counts[status] = (kanban_counts[status] || 0) + 1;
        });
      }
    }

    const clientes_recuperados = Number(kanban_counts['Recuperado'] || 0);
    // "Em Negociação" agora vem das parcelas com status_renegociacao = 'RENEGOCIADO'
    // Contar clientes únicos (um cliente pode ter várias parcelas renegociadas)
    const parcelasRenegociadas = data.parcelasRenegociadas || [];
    const clientesEmNegociacaoSet = new Set(
      parcelasRenegociadas.map((p: any) => String(p.id_cliente || '')).filter((id: string) => id !== '')
    );
    const clientes_em_negociacao = clientesEmNegociacaoSet.size;
    // Calcular valor total das parcelas renegociadas
    const valor_total_em_negociacao = parcelasRenegociadas.reduce(
      (sum: number, p: any) => sum + (Number(p.valor_parcela) || 0),
      0
    );
    console.log('[VICTOR DEBUG] Parcelas RENEGOCIADO:', parcelasRenegociadas.length,
      '| Clientes únicos:', clientes_em_negociacao,
      '| Valor total:', valor_total_em_negociacao);
    const clientes_em_aberto = Number(kanban_counts['Em Aberto'] || 0);

    // 4. ATIVIDADE RECENTE (últimos 100 eventos combinados)
    let atividades_recentes: any[] = [];
    try {
      // PostgREST exige body; função sem parâmetros usa {}.
      const atividadeRes = await sb.rpc('get_atividade_recente', {});
      if (atividadeRes.error) {
        console.warn('[VICTOR DEBUG] Atividade Recente RPC error:', atividadeRes.error);
      } else {
        atividades_recentes = atividadeRes.data || [];
      }
    } catch (e) {
      console.warn('[VICTOR DEBUG] Atividade Recente RPC exception:', e);
    }
    console.log('[VICTOR DEBUG] Atividade Recente RPC:', atividades_recentes.length, 'eventos');

    // ========== MÉTRICAS CALCULADAS LOCALMENTE ==========

    // Carteira ativa (contratos em gestão)
    const contratos_ativos = data.renegociacao.length;

    // Parcelas em atraso (crítico: >90 dias = devolução de lote)
    const parcelas_em_atraso = data.parcelas.filter(p =>
      p.dias_em_atraso && Number(p.dias_em_atraso) > 0
    ).length;
    const parcelas_criticas = data.parcelas.filter(p =>
      p.dias_em_atraso && Number(p.dias_em_atraso) >= 90
    ).length;

    // Valor total em risco (soma das parcelas atrasadas com parsing correto)
    const valor_em_risco = data.parcelas
      .filter(p => p.dias_em_atraso && Number(p.dias_em_atraso) > 0)
      .reduce((sum, p) => sum + parseValorMonetario(p.valor_parcela), 0);

    // Taxa de automação (mensagens enviadas vs recebidas)
    const mensagens_enviadas = data.mensagens.filter(m => m.direcao === 'ENVIADA').length;
    const mensagens_recebidas = data.mensagens.filter(m => m.direcao === 'RECEBIDA').length;
    const taxa_resposta = mensagens_enviadas > 0 ?
      (mensagens_recebidas / mensagens_enviadas) * 100 : 0;

    // Renegociações ativas (handoff para humano)
    const renegociacoes_ativas = data.renegociacao.filter(r => r.ativo === true).length;

    // Comprovantes recebidos (pagamentos em validação)
    const comprovantes_recebidos = data.comprovantes.length;

    // Opt-outs e WhatsApp inválidos
    const opt_outs = data.optOut.length;
    const whatsapp_invalidos = data.whatsappInexistente.length;

    // Disparos realizados hoje
    const hoje = new Date().toISOString().split('T')[0];
    const disparos_hoje = data.disparo.filter(d =>
      d.dateTime_disparo && typeof d.dateTime_disparo === 'string' && d.dateTime_disparo.startsWith(hoje)
    ).length;

    // Conversas ativas (memória de sessão)
    const conversas_ativas = data.memoria.length;

    // Taxa de sucesso = (clientes recuperados / contratos ativos) * 100
    const taxa_sucesso = contratos_ativos > 0 ?
      (clientes_recuperados / contratos_ativos) : 0;

    // ========== NORMALIZAR LEADS PARA KANBAN ==========

    // Criar sets de clientes por status para classificação rápida
    const clientesRecuperadosSet = new Set(
      data.parcelas.filter(p => p.status_renegociacao === 'RENEGOCIADO').map(p => p.id_cliente)
    );
    const clientesPromessaSet = new Set(
      data.parcelas.filter(p => p.status_parcela && String(p.status_parcela).toLowerCase().includes('promessa')).map(p => p.id_cliente)
    );
    const clientesDisparoSet = new Set(
      data.disparo.filter(d => d.disparo_realizado === true).map(d => d.id_cliente)
    );

    const leads: Lead[] = data.acompanhamento.map((r) => {
      const idCliente = r.id_cliente;
      let status: any = 'NOVO'; // Em Aberto
      let statusLabel = 'Em Aberto';

      // Classificar status baseado no Kanban (alinhado com COLLECTION_COLUMNS)
      // NOVO → Em Aberto
      // NEGOCIACAO → Em Negociação (clientes com disparo realizado)
      // QUALIFICADO → Promessa de Pagamento (clientes com status PROMESSA)
      // GANHO → Recuperado (clientes com parcelas RENEGOCIADO)

      if (clientesRecuperadosSet.has(idCliente)) {
        status = 'GANHO'; // Recuperado
        statusLabel = 'Recuperado';
      } else if (clientesPromessaSet.has(idCliente)) {
        status = 'QUALIFICADO'; // Promessa de Pagamento
        statusLabel = 'Promessa de Pagamento';
      } else if (clientesDisparoSet.has(idCliente)) {
        status = 'NEGOCIACAO'; // Em Negociação
        statusLabel = 'Em Negociação';
      }

      // Calcular valor devido (soma das parcelas em atraso do cliente)
      const parcelasCliente = data.parcelas.filter(p =>
        p.id_cliente === idCliente && p.dias_em_atraso && Number(p.dias_em_atraso) > 0
      );
      const valorDevido = parcelasCliente.reduce((sum, p) => sum + parseValorMonetario(p.valor_parcela), 0);

      // Pegar informações adicionais para o card
      const parcelasRenegociadas = data.parcelas.filter(p =>
        p.id_cliente === idCliente && p.status_renegociacao === 'RENEGOCIADO'
      ).length;

      const diasAtraso = parcelasCliente.length > 0
        ? Math.max(...parcelasCliente.map(p => Number(p.dias_em_atraso) || 0))
        : 0;

      const createdAt = toSafeDate(r.created_at);

      return {
        id: String(r.id),
        nome: toStr(r.nome_cliente) ?? 'Sem nome',
        email: '',
        whatsapp: undefined,
        telefone: toStr(r.numero_cliente),
        empresa: toStr(r.id_divida), // Usar id_divida como identificador do loteamento
        origem: 'Inbound',
        status: status,
        agente_atual_id: agentId,
        tempo_parado: diasAtraso > 0 ? `${diasAtraso} dias` : undefined,
        valor_potencial: Math.round(valorDevido),
        ultima_interacao: createdAt,
        created_at: createdAt,
        updated_at: createdAt,
        metadata: {
          id_cliente: idCliente,
          status_label: statusLabel,
          parcelas_em_atraso: parcelasCliente.length,
          parcelas_renegociadas: parcelasRenegociadas,
          dias_atraso_maximo: diasAtraso,
          valor_devido: valorDevido,
        },
      };
    });

    // Log da distribuição de leads no Kanban
    const leadsDistribution = {
      NOVO: leads.filter(l => l.status === 'NOVO').length,
      EM_CONTATO: leads.filter(l => l.status === 'EM_CONTATO').length,
      NEGOCIACAO: leads.filter(l => l.status === 'NEGOCIACAO').length,
      GANHO: leads.filter(l => l.status === 'GANHO').length,
    };
    console.log('[VICTOR DEBUG] Distribuição de leads no Kanban:', leadsDistribution);
    console.log('[VICTOR DEBUG] Total de leads:', leads.length);

    // ========== CRIAR EVENTOS DE ATIVIDADE RECENTE ==========

    const events: Event[] = atividades_recentes.slice(0, 50).map((ativ: any) => ({
      id: String(ativ.evento_id),
      tipo: ativ.tipo === 'mensagem' ? 'MENSAGEM_ENVIADA' :
            ativ.tipo === 'disparo' ? 'LEAD_TRANSBORDADO' : 'LEAD_CRIADO',
      lead_id: String(ativ.id_cliente || ativ.evento_id),
      agente_id: agentId,
      metadata: {
        tipo_atividade: ativ.tipo,
        conteudo: ativ.conteudo,
        meta: ativ.meta,
      },
      timestamp: toSafeDate(ativ.data_hora),
    }));

    // Log summary
    console.log(`[Vitor TGV] Receita Recuperada: R$ ${receita_recuperada_total.toLocaleString('pt-BR')}, ` +
      `Tempo Médio: ${tempo_medio_resolucao_horas.toFixed(1)}h, ` +
      `Kanban: ${clientes_recuperados} recuperados, ${clientes_em_negociacao} negociação (RENEGOCIADO), ${clientes_em_aberto} aberto, ` +
      `Parcelas Atraso: ${parcelas_em_atraso} (${parcelas_criticas} críticas), ` +
      `Valor Risco: R$ ${valor_em_risco.toLocaleString('pt-BR')}, Taxa Sucesso: ${(taxa_sucesso * 100).toFixed(1)}%`);

    const metricas = {
      leads_ativos: contratos_ativos,
      conversoes: clientes_recuperados,
      receita_total: receita_recuperada_total,
      disparos_hoje: disparos_hoje,

      // ===== MÉTRICAS PRINCIPAIS =====
      contratos_ativos: contratos_ativos,
      receita_recuperada_total: receita_recuperada_total,
      receita_recuperada_por_dia: receita_por_dia,
      tempo_medio_horas: tempo_medio_resolucao_horas,
      tempo_medio_minutos: tempo_medio_resolucao_minutos,
      taxa_sucesso: taxa_sucesso,
        // Chaves alinhadas com SQL/relatórios
        total_parcelas_renegociadas: data.parcelas.filter(p => p.status_renegociacao === 'RENEGOCIADO').length,
        clientes_com_renegociacao: clientesRecuperadosSet.size,
        inadimplencias_resolvidas: comprovantes_recebidos,

        // ===== KANBAN =====
        clientes_recuperados: clientes_recuperados,
        clientes_em_negociacao: clientes_em_negociacao, // Agora vem de tgv_parcela com status_renegociacao = 'RENEGOCIADO'
        valor_total_em_negociacao: valor_total_em_negociacao, // Valor total das parcelas renegociadas
        clientes_em_aberto: clientes_em_aberto,
        // Fornecer mapeamento direto para a UI consumir os counts do servidor
        summary_counts: kanban_counts,

        // ===== PARCELAS =====
        parcelas_em_atraso: parcelas_em_atraso,
        parcelas_criticas: parcelas_criticas,
        valor_em_risco: valor_em_risco,

        // ===== COMUNICAÇÃO =====
        taxa_resposta: taxa_resposta,
        mensagens_enviadas: mensagens_enviadas,
        mensagens_recebidas: mensagens_recebidas,

        // ===== GESTÃO =====
        renegociacoes_ativas: renegociacoes_ativas,
        comprovantes_recebidos: comprovantes_recebidos,
        opt_outs: opt_outs,
        whatsapp_invalidos: whatsapp_invalidos,
        conversas_ativas: conversas_ativas,
      };

    console.log('[VITOR DEBUG] Métricas finais sendo retornadas:', {
      tempo_medio_horas: metricas.tempo_medio_horas,
      receita_recuperada_total: metricas.receita_recuperada_total,
      clientes_recuperados: metricas.clientes_recuperados,
    });

    return buildAgentCommon(agentId, 'Vitor', leads, events, {
      tipo: 'FINANCEIRO',
      metricas_agregadas: metricas,
    });
  },
};
