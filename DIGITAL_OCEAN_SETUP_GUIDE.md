# 🌊 GUIA DE CONFIGURAÇÃO DIGITAL OCEAN - DAILY CONTROL

## 🎯 MIGRAÇÃO COMPLETA PARA DIGITAL OCEAN POSTGRESQL

### 📋 STATUS ATUAL:
- ✅ **Backup criado** - Dados exportados
- ✅ **Schema PostgreSQL** - Pronto para Digital Ocean
- ✅ **Scripts de importação** - Configurados
- 🔄 **Aguardando configuração** do Digital Ocean Database

---

## 🚀 PASSO 1: CONFIGURAR DIGITAL OCEAN DATABASE

### 1.1 Criar PostgreSQL Database
1. Acesse [Digital Ocean Dashboard](https://cloud.digitalocean.com/)
2. Vá para **Databases** > **Create Database**
3. Selecione:
   - **PostgreSQL** (versão 15+)
   - **Região**: Escolha mais próxima
   - **Tamanho**: Básico ($15/mês) ou Professional
   - **Nome**: `daily-control-multitenant`

### 1.2 Obter Connection String
1. Após criar, vá para **Connection Details**
2. Copie a **Connection String** no formato:
   ```
   postgresql://username:password@host:port/database?sslmode=require
   ```

### 1.3 Configurar Segurança
1. Em **Settings** > **Trusted Sources**
2. Adicione seu IP atual para testes
3. Para produção, configure IPs do Netlify

---

## 🔧 PASSO 2: CONFIGURAR VARIÁVEIS DE AMBIENTE

### 2.1 Editar Configuração Local
```bash
# Edite o arquivo .env.digital-ocean com suas credenciais:
nano .env.digital-ocean
```

### 2.2 Substitua os Valores:
```env
# 🚀 DIGITAL OCEAN DATABASE (SUBSTITUA)
DATABASE_URL="postgresql://sua-connection-string-aqui"

# 🔐 GERE UM JWT SECRET FORTE
JWT_SECRET="cole-aqui-um-secret-de-32+-caracteres"

# 🌍 CONFIGURE SEU DOMÍNIO
VITE_API_BASE_URL="https://seu-app.netlify.app"
```

### 2.3 Ativar Nova Configuração:
```bash
# Fazer backup do .env atual
cp .env .env.old-mysql

# Usar configuração do Digital Ocean
cp .env.digital-ocean .env

# Usar schema PostgreSQL
cp prisma/schema-digital-ocean.prisma prisma/schema.prisma
```

---

## 📊 PASSO 3: MIGRAR DADOS

### 3.1 Aplicar Schema no Digital Ocean:
```bash
# Gerar cliente Prisma para PostgreSQL
npx prisma generate

# Aplicar schema no Digital Ocean
npx prisma db push
```

### 3.2 Importar Dados:
```bash
# Importar todos os dados (organizações, usuários, tarefas)
node scripts/import-to-digital-ocean.cjs
```

### 3.3 Testar Conexão:
```bash
# Reiniciar servidor com nova configuração
npm run dev:full
```

---

## 🚀 PASSO 4: CONFIGURAR PRODUÇÃO

### 4.1 Netlify Environment Variables:
```env
DATABASE_URL=sua-digital-ocean-connection-string
JWT_SECRET=seu-jwt-secret-forte
NODE_ENV=production
SUPER_ADMIN_EMAIL=wadevenga@hotmail.com
ENABLE_ORGANIZATION_ISOLATION=true
TEMP_PASSWORD_LENGTH=6
```

### 4.2 Deploy:
```bash
# Commit e push das mudanças
git add .
git commit -m "feat: migrate to Digital Ocean PostgreSQL"
git push origin main

# Netlify fará deploy automático
```

---

## 🔍 VERIFICAÇÕES PÓS-MIGRAÇÃO

### ✅ Checklist:
- [ ] Login funcionando
- [ ] Dados da organização PD&I Tech carregando
- [ ] Usuários wadevenga@hotmail.com com role super_admin
- [ ] Aba "Franqueadora" funcionando
- [ ] Criação de escolas funcionando
- [ ] Performance adequada

### 🐛 Troubleshooting:
- **Erro de conexão**: Verificar IP na trusted sources do Digital Ocean
- **Dados não carregando**: Verificar importação com `node scripts/import-to-digital-ocean.cjs`
- **Login falhando**: Verificar JWT_SECRET nas variáveis de ambiente

---

## 📈 BENEFÍCIOS DA MIGRAÇÃO

### 🚀 Performance:
- **Database otimizado** para produção
- **SSD storage** de alta velocidade
- **Backup automático** diário

### 🔒 Segurança:
- **SSL/TLS obrigatório**
- **IP whitelisting**
- **Monitoramento 24/7**

### 💰 Escalabilidade:
- **CPU/RAM** ajustáveis
- **Storage** expansível
- **Connection pooling**

---

## 🆘 SUPORTE

Se encontrar problemas:
1. Verifique logs do Digital Ocean Database
2. Teste conexão local primeiro
3. Confirme variáveis de ambiente
4. Verifique estrutura do banco com `npx prisma studio`

---

🎉 **Após a migração, seu Daily Control estará rodando 100% na nuvem com PostgreSQL otimizado!**