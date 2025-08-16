# 🌍 CONFIGURAÇÃO NETLIFY - VARIÁVEIS DE AMBIENTE

## 🎯 CONFIGURAÇÃO DO DIGITAL OCEAN MYSQL EM PRODUÇÃO

### 📋 VARIÁVEIS A CONFIGURAR NO NETLIFY:

1. **Vá para:** [Netlify Dashboard](https://app.netlify.com/) > Seu Site > Site Settings > Environment Variables

2. **Configure estas variáveis exatamente assim:**

```env
DATABASE_URL=mysql://doadmin:ljvyOpSKsbXnyf90@db-mysql-nyc3-39437-do-user-7944312-0.b.db.ondigitalocean.com:25060/daily_control?sslmode=require

JWT_SECRET=daily-control-super-secret-key-production-2024

NODE_ENV=production

SUPER_ADMIN_EMAIL=wadevenga@hotmail.com

ENABLE_ORGANIZATION_ISOLATION=true

TEMP_PASSWORD_LENGTH=6
```

---

## 🔐 IMPORTANTE - SECURITY:

### 🚨 PARA PRODUÇÃO, ALTERE:
1. **JWT_SECRET**: Gere um secret mais forte (32+ caracteres aleatórios)
2. **DATABASE_URL**: Verifique se IP do Netlify está autorizado no Digital Ocean

### 🛡️ RECOMENDAÇÕES:
- Nunca exponha credenciais nos logs
- Use HTTPS apenas em produção  
- Configure IP whitelist no Digital Ocean

---

## ✅ VERIFICAÇÃO:

Após configurar, seu site funcionará:
- ✅ **Login** com wadevenga@hotmail.com
- ✅ **Aba Franqueadora** visível
- ✅ **Dados do PD&I Tech** carregando
- ✅ **Criação de escolas** funcionando

---

## 🚀 DEPLOY AUTOMÁTICO:

Após configurar as variáveis:
1. Netlify redeploys automaticamente
2. Nova build utilizará Digital Ocean
3. Sistema 100% na nuvem!

---

**🎉 PARABÉNS! SEU DAILY CONTROL AGORA RODA 100% NO DIGITAL OCEAN!**