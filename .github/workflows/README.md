# GitHub Actions - Deploy Automático

Este workflow faz deploy automático na Vercel quando há push na branch `main`.

## 🔧 Configuração

### 1. Obter credenciais da Vercel

**VERCEL_TOKEN (Token de Autenticação):**
1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique no seu **perfil** (canto superior direito) → **Settings**
3. Vá em **Tokens** (no menu lateral)
4. Clique em **Create Token**
5. Dê um nome (ex: "GitHub Actions")
6. Copie o token gerado (você só verá ele uma vez!)

**VERCEL_ORG_ID (Team/Organization ID):**
1. No projeto Vercel, clique em **Settings** (ícone de engrenagem)
2. Vá em **General** (primeira opção no menu lateral)
3. Role até encontrar **Team ID** ou **Organization ID**
4. Copie o valor

**VERCEL_PROJECT_ID:**
1. No mesmo lugar (Settings → General)
2. Procure por **Project ID**
3. Copie o valor

### 2. Configurar Secrets no GitHub

1. Acesse o repositório no GitHub
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione os 3 secrets:

| Secret Name | Valor | Onde encontrar |
|------------|-------|----------------|
| `VERCEL_TOKEN` | Token criado acima | Vercel → Perfil → Settings → Tokens |
| `VERCEL_ORG_ID` | Team ID | Vercel → Projeto → Settings → General |
| `VERCEL_PROJECT_ID` | Project ID | Vercel → Projeto → Settings → General |

**Dica:** Se você não vê o Team ID, pode estar usando uma conta pessoal. Nesse caso, o Org ID pode ser o mesmo que seu User ID (encontrado na URL do dashboard).

### 4. Variáveis de Ambiente (Opcional)

Se quiser passar variáveis de ambiente no build, adicione também:

- `NEXT_PUBLIC_DEMO_MODE` (opcional, padrão: `true`)

**Nota**: As variáveis de ambiente devem ser configuradas diretamente no Vercel para produção.

## 🚀 Como Funciona

1. **Push na main**: Quando você faz push na branch `main`, o workflow é acionado
2. **Build**: Instala dependências, roda linter e faz build
3. **Deploy**: Faz deploy na Vercel em modo produção
4. **Notificação**: O workflow mostra a URL do deploy

## 📝 Execução Manual

Você também pode executar o workflow manualmente:

1. Vá em **Actions** no GitHub
2. Selecione **Deploy to Vercel**
3. Clique em **Run workflow**

## 🔍 Verificar Status

- Acesse a aba **Actions** no GitHub para ver o status dos deploys
- Logs completos estão disponíveis em cada execução

## ⚠️ Troubleshooting

### Erro: "Vercel authentication failed"
- Verifique se o `VERCEL_TOKEN` está correto
- Certifique-se de que o token não expirou

### Erro: "Project not found"
- Verifique se `VERCEL_PROJECT_ID` está correto
- Confirme que o projeto existe na organização

### Erro: "Organization not found"
- Verifique se `VERCEL_ORG_ID` está correto
- Confirme que você tem acesso à organização
