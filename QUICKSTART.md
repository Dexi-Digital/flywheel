# 🚀 Quick Start - Command Center

Guia rápido para começar a usar o Command Center.

## ⚡ Início Rápido

### 1. Instalar Dependências
```bash
npm install
```

### 2. Rodar em Desenvolvimento
```bash
npm run dev
# ou
./scripts/dev.sh
```

### 3. Acessar
Abra http://localhost:3000 no navegador

### 4. Login
- **Email:** lorrayne@dexidigital.com.br
- **Senha:** demo2024

## 🏗️ Build de Produção

### Opção 1: Comandos Manuais
```bash
npm run build
npm start
```

### Opção 2: Script Automatizado
```bash
./scripts/build.sh
```

## 📦 Deploy no Vercel

### Via Interface Web
1. Acesse https://vercel.com/new
2. Importe o repositório
3. Configure:
   - **Framework:** Next.js (detectado automaticamente)
4. Adicione variáveis de ambiente:
   ```
   NEXT_PUBLIC_DEMO_MODE=true
   NEXT_PUBLIC_DEMO_EMAIL=lorrayne@dexidigital.com.br
   ```
5. Clique em "Deploy"

### Via CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start

# Lint
npm run lint

# Limpar cache
rm -rf .next node_modules
npm install
```

## 🐛 Troubleshooting

### Porta 3000 em uso
```bash
# Matar processo na porta 3000
lsof -ti:3000 | xargs kill -9
```

### Erro de build
```bash
# Limpar e reinstalar
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Erro de TypeScript
```bash
# Verificar erros
npx tsc --noEmit
```

## 📊 Status da Aplicação

- ✅ Next.js 16.1.5
- ✅ React 19
- ✅ TypeScript
- ✅ Tailwind CSS 4
- ✅ Supabase
- ✅ Modo Demo ativo

## 📚 Documentação Completa

- [README.md](README.md) - Documentação completa
- [DEPLOY.md](DEPLOY.md) - Guia de deploy detalhado

## 🎯 Próximos Passos

1. ✅ Explorar o dashboard
2. ✅ Testar os 8 agentes
3. ✅ Verificar o painel OTTO
4. ✅ Fazer deploy no Vercel
5. 🔄 Configurar Supabase real (opcional)

---

**Dúvidas?** Consulte a documentação completa ou entre em contato com a equipe Dexi Digital.

