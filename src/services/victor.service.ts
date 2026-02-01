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

function normalizeLead(row: Record<string, any>, agentId: string): Lead {
  const createdAt = toStr(row.created_at) ?? new Date().toISOString();
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
    ultima_interacao: toStr(row.ultima_interacao) ?? createdAt,
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

    const leads = data.acompanhamento.map((r) => normalizeLead(r, agentId));
    const events: Event[] = [];

    // Log summary
    console.log(`[Victor] Leads: ${leads.length}, Parcelas: ${data.parcelas.length}, Renegociacao: ${data.renegociacao.length}, ` +
      `Disparo: ${data.disparo.length}, Mensagens: ${data.mensagens.length}, BufferMsg: ${data.bufferMessage.length}, ` +
      `OptOut: ${data.optOut.length}, WhatsAppInex: ${data.whatsappInexistente.length}, ` +
      `Memoria: ${data.memoria.length}, N8N: ${data.n8nHistories.length}, Comprovantes: ${data.comprovantes.length}`);

    return buildAgentCommon(agentId, 'Victor', leads, events);
  },
};
