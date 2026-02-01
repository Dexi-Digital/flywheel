/**
 * Script para verificar a estrutura das tabelas do Supabase
 * 
 * Uso: npx tsx scripts/verify-supabase-tables.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface TableCheck {
  context: string;
  table: string;
  columns: string[];
  required: boolean;
}

const TABLES_TO_CHECK: TableCheck[] = [
  // Contexto: devforaiagents (Luis, Angela)
  {
    context: 'devforaiagents',
    table: 'Leads CRM',
    columns: ['id', 'created_at', 'Nome', 'email', 'telefone'],
    required: true,
  },
  {
    context: 'devforaiagents',
    table: 'contatos',
    columns: ['id', 'nome', 'whatsapp', 'email', 'created_at'],
    required: false,
  },
  {
    context: 'devforaiagents',
    table: 'documents',
    columns: ['id', 'content', 'metadata', 'embedding', 'created_at'],
    required: false,
  },
  // Contexto: tecnologia.attraveiculos (Alice, Fernanda)
  {
    context: 'tecnologia',
    table: 'leads_frios',
    columns: ['id', 'nome', 'priority_score', 'created_at'],
    required: true,
  },
  // Contexto: tgvempreendimentos (Victor)
  {
    context: 'tgvempreendimentos',
    table: 'pix',
    columns: ['id', 'nome_CNPJ', 'cnpj', 'relacao_loteamento', 'created_at'],
    required: false,
  },
];

async function checkTable(
  client: any,
  context: string,
  tableName: string,
  expectedColumns: string[]
) {
  console.log(`\n🔍 Verificando tabela: ${tableName} (${context})`);

  try {
    // Tentar fazer uma query simples
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.error(`  ❌ Erro ao acessar tabela: ${error.message}`);
      return false;
    }

    console.log(`  ✅ Tabela acessível`);

    // Verificar colunas
    if (data && data.length > 0) {
      const actualColumns = Object.keys(data[0]);
      console.log(`  📋 Colunas encontradas: ${actualColumns.join(', ')}`);

      const missingColumns = expectedColumns.filter(
        (col) => !actualColumns.includes(col)
      );

      if (missingColumns.length > 0) {
        console.warn(`  ⚠️  Colunas faltantes: ${missingColumns.join(', ')}`);
        return false;
      } else {
        console.log(`  ✅ Todas as colunas esperadas estão presentes`);
        return true;
      }
    } else {
      console.log(`  ℹ️  Tabela vazia - não é possível verificar colunas`);
      
      // Tentar verificar colunas fazendo uma query com select específico
      for (const col of expectedColumns) {
        const { error: colError } = await client
          .from(tableName)
          .select(col)
          .limit(1);

        if (colError) {
          console.error(`  ❌ Coluna "${col}" não existe: ${colError.message}`);
          return false;
        }
      }
      
      console.log(`  ✅ Todas as colunas esperadas existem (verificação individual)`);
      return true;
    }
  } catch (err: any) {
    console.error(`  ❌ Erro inesperado: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando verificação das tabelas do Supabase...\n');

  const contexts = {
    devforaiagents: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_LUIS,
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_LUIS,
    },
    tecnologia: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_ALICE,
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_ALICE,
    },
    tgvempreendimentos: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_VICTOR,
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_VICTOR,
    },
  };

  const results: Record<string, boolean> = {};

  for (const check of TABLES_TO_CHECK) {
    const contextConfig = contexts[check.context as keyof typeof contexts];

    if (!contextConfig || !contextConfig.url || !contextConfig.key) {
      console.warn(`⚠️  Configuração não encontrada para contexto: ${check.context}`);
      continue;
    }

    const client = createClient(contextConfig.url, contextConfig.key);
    const key = `${check.context}.${check.table}`;
    results[key] = await checkTable(
      client,
      check.context,
      check.table,
      check.columns
    );
  }

  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA VERIFICAÇÃO');
  console.log('='.repeat(60));

  const passed = Object.values(results).filter((r) => r).length;
  const total = Object.keys(results).length;

  console.log(`\n✅ Tabelas OK: ${passed}/${total}`);
  console.log(`❌ Tabelas com problemas: ${total - passed}/${total}\n`);

  if (passed === total) {
    console.log('🎉 Todas as tabelas estão configuradas corretamente!');
  } else {
    console.log('⚠️  Algumas tabelas precisam de correção.');
    console.log('📝 Execute a migration: supabase/migrations/003_fix_missing_columns.sql');
  }
}

main().catch(console.error);

