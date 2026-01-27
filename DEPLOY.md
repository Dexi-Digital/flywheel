# Guia de Deploy - Command Center

## 🚀 Deploy no Vercel

### Pré-requisitos
- Conta no [Vercel](https://vercel.com)
- Repositório Git conectado

### Passos para Deploy

1. **Conectar Repositório**
   - Acesse [Vercel Dashboard](https://vercel.com/dashboard)
   - Clique em "Add New Project"
   - Importe o repositório do GitHub

2. **Configurar Projeto**
   - **Framework Preset**: Next.js (detectado automaticamente)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

3. **Variáveis de Ambiente**
   
   Configure as seguintes variáveis no Vercel:
   
   ```env
   NEXT_PUBLIC_DEMO_MODE=true
   NEXT_PUBLIC_DEMO_EMAIL=lorrayne@dexidigital.com.br
   NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder
   ```

4. **Deploy**
   - Clique em "Deploy"
   - Aguarde o build completar
   - Acesse a URL gerada

### Deploy com Supabase Real (Produção)

Para usar o Supabase em produção:

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute as migrations em `supabase/migrations/`
3. Execute o seed em `supabase/seed.sql`
4. Atualize as variáveis de ambiente no Vercel:

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=sua-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-supabase
```

## 🏠 Rodando Localmente

### Modo Desenvolvimento

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

### Modo Produção (Local)

```bash
npm install
npm run build
npm start
```

Acesse: http://localhost:3000

## 📋 Checklist de Deploy

- [x] Build sem erros
- [x] TypeScript sem erros
- [x] Variáveis de ambiente configuradas
- [x] Modo demo funcionando
- [x] Configuração Vercel otimizada
- [x] Middleware configurado
- [x] Imagens otimizadas
- [x] React Strict Mode ativado

## 🔧 Troubleshooting

### Erro de Build
- Verifique se todas as dependências estão instaladas
- Confirme que o Node.js está na versão 18+
- Limpe o cache: `rm -rf .next node_modules && npm install`

### Erro de Variáveis de Ambiente
- Certifique-se de que todas as variáveis começam com `NEXT_PUBLIC_`
- Reinicie o servidor após alterar variáveis

### Erro de Middleware
- O aviso sobre middleware deprecado é normal e não afeta a funcionalidade
- Será atualizado em versões futuras do Next.js

## 📊 Performance

- Build time: ~2-3 segundos
- Cold start: ~200ms
- Tamanho do bundle: Otimizado com Turbopack
- Páginas estáticas: 5/7 rotas

## 🔐 Segurança

- Headers de segurança configurados
- CORS configurado para Supabase
- RLS (Row Level Security) no Supabase
- Autenticação via Supabase Auth

