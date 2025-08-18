# 🚨 CONFIGURAÇÃO URGENTE - VERCEL ENVIRONMENT VARIABLES

## ❌ PROBLEMA ATUAL:
```
Environment variable not found: DATABASE_URL
```

O sistema está falhando porque as **variáveis de ambiente não estão configuradas no painel do Vercel**.

---

## 🚀 SOLUÇÃO IMEDIATA:

### 1️⃣ **ACESSE O PAINEL VERCEL:**
1. Vá para: https://vercel.com/dashboard
2. Encontre o projeto: `daily-control-sede`
3. Clique em **Settings** → **Environment Variables**

### 2️⃣ **ADICIONE ESTAS VARIÁVEIS (UMA POR UMA):**

#### 🔗 DATABASE_URL
- **Name:** `DATABASE_URL`
- **Value:** `mysql://doadmin:ljvyOpSKsbXnyf90@db-mysql-nyc3-39437-do-user-7944312-0.b.db.ondigitalocean.com:25060/daily_control?sslmode=require`
- **Environment:** ✅ Production ✅ Preview ✅ Development

#### 🔐 JWT_SECRET
- **Name:** `JWT_SECRET`
- **Value:** `daily-control-super-secret-key-production-2024`
- **Environment:** ✅ Production ✅ Preview ✅ Development

#### 🌍 NODE_ENV
- **Name:** `NODE_ENV`
- **Value:** `production`
- **Environment:** ✅ Production

#### 👤 SUPER_ADMIN_EMAIL
- **Name:** `SUPER_ADMIN_EMAIL`
- **Value:** `wadevenga@hotmail.com`
- **Environment:** ✅ Production ✅ Preview ✅ Development

#### 🏢 ENABLE_ORGANIZATION_ISOLATION
- **Name:** `ENABLE_ORGANIZATION_ISOLATION`
- **Value:** `true`
- **Environment:** ✅ Production ✅ Preview ✅ Development

#### 🔑 TEMP_PASSWORD_LENGTH
- **Name:** `TEMP_PASSWORD_LENGTH`
- **Value:** `6`
- **Environment:** ✅ Production ✅ Preview ✅ Development

### 3️⃣ **FORCE REDEPLOY:**
Após adicionar as variáveis:
1. Vá para **Deployments**
2. Clique nos 3 pontos do último deploy
3. Selecione **Redeploy**

---

## ⏱️ TEMPO ESTIMADO:
- **Configuração:** 3-5 minutos
- **Redeploy:** 1-2 minutos
- **Sistema funcionando:** ~5 minutos total

---

## ✅ VERIFICAÇÃO:
Após redeploy, teste:
1. Login: https://daily-control-sede.vercel.app
2. Credenciais: wadevenga@hotmail.com / S@lmos2714
3. ✅ Login deve funcionar sem erro 500
4. ✅ Criação de tarefas deve funcionar

---

## 🆘 SE CONTINUAR COM PROBLEMA:
1. Verifique se TODAS as 6 variáveis foram adicionadas
2. Confirme que marcou todos os environments
3. Force novo redeploy
4. Aguarde 2-3 minutos para propagação

---

🎯 **ESSA É A CAUSA RAIZ DO PROBLEMA!**