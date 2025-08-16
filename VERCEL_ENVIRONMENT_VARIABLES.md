# 🚀 CONFIGURAÇÃO VERCEL - VARIÁVEIS DE AMBIENTE

## 🎯 CONFIGURAÇÃO DO DIGITAL OCEAN MYSQL EM PRODUÇÃO

### 📋 CONFIGURAR VARIÁVEIS NA VERCEL:

1. **Vá para:** [Vercel Dashboard](https://vercel.com/dashboard) > Seu Projeto > Settings > Environment Variables

2. **Adicione estas variáveis uma por uma:**

#### 🔗 **DATABASE_URL**
- **Name:** `DATABASE_URL`
- **Value:** `mysql://doadmin:ljvyOpSKsbXnyf90@db-mysql-nyc3-39437-do-user-7944312-0.b.db.ondigitalocean.com:25060/daily_control?sslmode=require`
- **Environment:** All (Production, Preview, Development)

#### 🔐 **JWT_SECRET**
- **Name:** `JWT_SECRET`
- **Value:** `daily-control-super-secret-key-production-2024`
- **Environment:** All (Production, Preview, Development)

#### 🌍 **NODE_ENV**
- **Name:** `NODE_ENV`
- **Value:** `production`
- **Environment:** Production

#### 👤 **SUPER_ADMIN_EMAIL**
- **Name:** `SUPER_ADMIN_EMAIL`
- **Value:** `wadevenga@hotmail.com`
- **Environment:** All (Production, Preview, Development)

#### 🏢 **ENABLE_ORGANIZATION_ISOLATION**
- **Name:** `ENABLE_ORGANIZATION_ISOLATION`
- **Value:** `true`
- **Environment:** All (Production, Preview, Development)

#### 🔑 **TEMP_PASSWORD_LENGTH**
- **Name:** `TEMP_PASSWORD_LENGTH`
- **Value:** `6`
- **Environment:** All (Production, Preview, Development)

---

## 🚀 DEPLOY AUTOMÁTICO:

### ✅ **APÓS CONFIGURAR:**
1. **Vercel redeploys automaticamente** quando você altera variáveis
2. **OU** force um redeploy: Dashboard > Deployments > Redeploy

### 🔄 **TRIGGER MANUAL (SE NECESSÁRIO):**
```bash
# Se precisar forçar redeploy
git commit --allow-empty -m "trigger vercel redeploy"
git push origin main
```

---

## ✅ VERIFICAÇÃO PÓS-DEPLOY:

### 🧪 **TESTE EM PRODUÇÃO:**
1. **Acesse:** https://seu-dominio.vercel.app
2. **Login:** wadevenga@hotmail.com / S@lmos2714
3. **Verifique:** Aba "Franqueadora" aparecendo
4. **Teste:** Criação de escola funcionando

---

## 🎯 VANTAGENS VERCEL + DIGITAL OCEAN:

### ⚡ **PERFORMANCE:**
- **Edge Functions** da Vercel
- **MySQL SSD** do Digital Ocean
- **CDN global** automático

### 🔒 **SEGURANÇA:**
- **HTTPS automático** (Vercel)
- **SSL obrigatório** (Digital Ocean)
- **Environment Variables** criptografadas

### 🚀 **DEPLOY:**
- **Git push** → Deploy automático
- **Preview branches** para testes
- **Rollback instantâneo** se necessário

---

## 🆘 TROUBLESHOOTING:

### ❌ **SE DER ERRO 500:**
1. Verifique variables no Vercel Dashboard
2. Check Vercel Functions logs
3. Confirme IP da Vercel autorizado no Digital Ocean

### 🔍 **LOGS DA VERCEL:**
- Dashboard > Functions > View Logs
- Procure por erros de conexão de banco

---

🎉 **APÓS CONFIGURAÇÃO: SEU DAILY CONTROL RODARÁ 100% NA NUVEM!**