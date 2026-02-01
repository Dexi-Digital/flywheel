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
  const acompanhamentoPromise = sb
    .from('acompanhamento_leads')
    .select('id,created_at,nome_cliente,id_cliente,numero_cliente,id_divida')
    .order('created_at', { ascending: false })
    .limit(50);

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
  id: 'agent-victor',

  async getAgent(agentId: string) {
    const cfg = getTenantConfig(agentId);
    const sb = getBrowserTenantClient(agentId, cfg);

    const data = await fetchVictorData(sb);

    // MÉTRICAS ESPECÍFICAS DO VICTOR (Agente de Recuperação de Receita TGV)

    // 1. Carteira ativa (contratos em gestão)
    const contratos_ativos = data.renegociacao.length;

    // 2. Parcelas em atraso (crítico: >90 dias = devolução de lote)
    const parcelas_em_atraso = data.parcelas.filter(p =>
      p.dias_em_atraso && Number(p.dias_em_atraso) > 0
    ).length;
    const parcelas_criticas = data.parcelas.filter(p =>
      p.dias_em_atraso && Number(p.dias_em_atraso) >= 90
    ).length;

    // 3. Valor total em risco (soma das parcelas atrasadas)
    const valor_em_risco = data.parcelas
      .filter(p => p.dias_em_atraso && Number(p.dias_em_atraso) > 0)
      .reduce((sum, p) => sum + (Number(p.valor_parcela) || 0), 0);

    // 4. Taxa de automação (mensagens enviadas vs intervenções humanas)
    const mensagens_enviadas = data.mensagens.filter(m => m.direcao === 'ENVIADA').length;
    const mensagens_recebidas = data.mensagens.filter(m => m.direcao === 'RECEBIDA').length;
    const taxa_resposta = mensagens_enviadas > 0 ?
      (mensagens_recebidas / mensagens_enviadas) * 100 : 0;

    // 5. Renegociações ativas (handoff para humano)
    const renegociacoes_ativas = data.renegociacao.filter(r => r.ativo === true).length;

    // 6. Comprovantes recebidos (pagamentos em validação)
    const comprovantes_recebidos = data.comprovantes.length;

    // 7. Opt-outs (clientes que solicitaram parar comunicação)
    const opt_outs = data.optOut.length;

    // 8. WhatsApp inválidos (números que não existem)
    const whatsapp_invalidos = data.whatsappInexistente.length;

    // 9. Disparos realizados hoje
    const hoje = new Date().toISOString().split('T')[0];
    const disparos_hoje = data.disparo.filter(d =>
      d.dateTime_disparo && typeof d.dateTime_disparo === 'string' && d.dateTime_disparo.startsWith(hoje)
    ).length;

    // 10. Conversas ativas (memória de sessão)
    const conversas_ativas = data.memoria.length;

    // ===== CÁLCULOS REAIS PARA MÉTRICAS FINANCEIRAS =====

    // 11. Inadimplências resolvidas = comprovantes recebidos (pagamentos confirmados)
    const inadimplencias_resolvidas = comprovantes_recebidos;

    // 12. Taxa de sucesso real = (comprovantes / contratos ativos) * 100
    const taxa_sucesso = contratos_ativos > 0 ? 
      (comprovantes_recebidos / contratos_ativos) : 0;

    // 13. Receita recuperada = soma dos valores dos comprovantes
    // Nota: Precisamos calcular a partir dos pagamentos confirmados
    // Para agora, usamos o número de comprovantes * valor médio por parcela
    const valor_medio_parcela = data.parcelas.length > 0 ?
      data.parcelas.reduce((sum, p) => sum + (Number(p.valor_parcela) || 0), 0) / data.parcelas.length : 0;
    const receita_recuperada = comprovantes_recebidos * valor_medio_parcela;

    // 14. Tempo médio de resolução (em horas)
    // Calcula a diferença entre data de disparo mais recente e mais antiga
    let tempo_medio_resolucao = 0;
    if (data.disparo.length > 1) {
      const datas = data.disparo
        .map(d => {
          const dataStr = d.dateTime_disparo;
          return dataStr ? new Date(dataStr) : null;
        })
        .filter((d): d is Date => d !== null);
      
      if (datas.length > 1) {
        datas.sort((a, b) => a.getTime() - b.getTime());
        const tempoMs = datas[datas.length - 1].getTime() - datas[0].getTime();
        tempo_medio_resolucao = Math.round(tempoMs / (1000 * 60 * 60)); // converter para horas
      }
    }

    // Normalizar leads da base de acompanhamento
    const leads = data.acompanhamento.map((r) => normalizeLead(r, agentId));

    // Criar eventos de renegociação
    const events: Event[] = data.renegociacao.map((r) => ({
      id: String(r.id),
      tipo: 'LEAD_TRANSBORDADO' as const,
      lead_id: String(r.id_cliente),
      agente_id: agentId,
      metadata: {
        motivo: 'Renegociação solicitada',
        loteamento: r.loteamento,
        descricao_contrato: r.descricao_contrato,
        dias_em_debito: r.dias_em_debito,
        vencimento: r.vencimento,
      },
      timestamp: toSafeDate(r.aberta_em),
    }));

    // Log summary
    console.log(`[Victor TGV] Contratos: ${contratos_ativos}, Parcelas Atraso: ${parcelas_em_atraso} (${parcelas_criticas} críticas), ` +
      `Valor Risco: R$ ${valor_em_risco.toLocaleString('pt-BR')}, Taxa Resposta: ${taxa_resposta.toFixed(1)}%, ` +
      `Renegociações: ${renegociacoes_ativas}, Inadimplências Resolvidas: ${inadimplencias_resolvidas}, Taxa Sucesso: ${(taxa_sucesso * 100).toFixed(1)}%, ` +
      `Receita Recuperada: R$ ${receita_recuperada.toLocaleString('pt-BR')}, Tempo Médio: ${tempo_medio_resolucao}h`);

    return buildAgentCommon(agentId, 'Victor', leads, events, {
      tipo: 'FINANCEIRO',
      metricas_agregadas: {
        leads_ativos: contratos_ativos,
        conversoes: comprovantes_recebidos,
        receita_total: valor_em_risco,
        disparos_hoje: disparos_hoje,
        contratos_ativos: contratos_ativos,
        parcelas_em_atraso: parcelas_em_atraso,
        parcelas_criticas: parcelas_criticas,
        valor_em_risco: valor_em_risco,
        taxa_resposta: taxa_resposta,
        renegociacoes_ativas: renegociacoes_ativas,
        comprovantes_recebidos: comprovantes_recebidos,
        opt_outs: opt_outs,
        whatsapp_invalidos: whatsapp_invalidos,
        conversas_ativas: conversas_ativas,
        mensagens_enviadas: mensagens_enviadas,
        mensagens_recebidas: mensagens_recebidas,
        // ===== MÉTRICAS REAIS CALCULADAS =====
        inadimplencias_resolvidas: inadimplencias_resolvidas,
        taxa_sucesso: taxa_sucesso,
        receita_recuperada: receita_recuperada,
        tempo_medio_resolucao: tempo_medio_resolucao,
      },
    });
  },
};
