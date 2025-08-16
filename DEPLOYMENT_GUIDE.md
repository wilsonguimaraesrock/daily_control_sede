# 🚀 Guia Completo de Deploy - Daily Control Multi-Tenant

## 📋 Visão Geral do Deploy

Este guia documenta o processo completo de deploy do **Daily Control** utilizando a arquitetura **Vercel + Digital Ocean MySQL**. O sistema está configurado para máxima performance e escalabilidade, suportando **105+ escolas Rockfeller**.

---

## 🏗️ Arquitetura de Deploy

```mermaid
graph TB
    subgraph "Cliente"
        A[Navegador/Mobile]
    end
    
    subgraph "Vercel Edge Network"
        B[CDN Global]
        C[Frontend React]
        D[Edge Functions]
    end
    
    subgraph "Digital Ocean"
        E[MySQL Database]
        F[Connection Pool]
        G[Backup Storage]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G
```

---

## 🎯 Pré-requisitos

### 📋 **Contas Necessárias**
- [x] **GitHub** - Repositório de código
- [x] **Vercel** - Deploy de frontend 
- [x] **Digital Ocean** - Managed MySQL Database

### 🔧 **Ferramentas Locais**
- [x] **Node.js 18+** 
- [x] **npm/yarn**
- [x] **Git**
- [x] **Prisma CLI** (npx prisma)

---

## 🌊 Configuração Digital Ocean MySQL

### **1. Criar Database**

```bash
# No Digital Ocean Dashboard:
1. Products > Databases > Create Database
2. Escolher MySQL 8.0+
3. Região: NYC3 (New York)
4. Tamanho: Basic ($15/mês) ou Professional
5. Nome: daily-control-production
```

### **2. Configurações de Segurança**

```bash
# Trusted Sources (Firewall):
1. Adicionar IP da Vercel
2. Adicionar IPs de desenvolvimento (seu IP atual)
3. Configurar SSL como obrigatório
```

### **3. Obter Connection String**

```env
# Formato da connection string:
mysql://username:password@host:port/database?sslmode=require

# Exemplo:
mysql://doadmin:SENHA123@db-mysql-nyc3-xxxxx-do-user-xxxx-0.b.db.ondigitalocean.com:25060/daily_control?sslmode=require
```

---

## ⚡ Deploy Vercel Frontend

### **1. Conectar Repositório GitHub**

```bash
# No Vercel Dashboard:
1. New Project > Import Git Repository
2. Selecionar: daily_control_sede
3. Framework Preset: Vite
4. Root Directory: ./
```

### **2. Configurar Build Settings**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

### **3. Environment Variables**

```env
# Configurar no Vercel Dashboard > Project > Settings > Environment Variables

# DATABASE (OBRIGATÓRIO)
DATABASE_URL=mysql://sua-connection-string-digital-ocean

# SEGURANÇA (OBRIGATÓRIO)
JWT_SECRET=production-secret-32-characters-minimum

# CONFIGURAÇÕES (OBRIGATÓRIO)
NODE_ENV=production
SUPER_ADMIN_EMAIL=wadevenga@hotmail.com

# MULTI-TENANT (OBRIGATÓRIO)
ENABLE_ORGANIZATION_ISOLATION=true
TEMP_PASSWORD_LENGTH=6

# OPCIONAL
VITE_API_BASE_URL=https://seu-dominio.vercel.app
```

### **4. Deploy Automático**

```bash
# Após configurar variáveis:
1. Git push para main → Deploy automático
2. Vercel detecta mudanças e rebuilds
3. Disponível em: https://seu-projeto.vercel.app
```

---

## 🔄 Processo de Database Setup

### **1. Aplicar Schema**

```bash
# Local ou Vercel CLI:
npx prisma generate
npx prisma db push
```

### **2. Verificar Conexão**

```bash
# Testar endpoint de saúde:
curl https://seu-dominio.vercel.app/api/health

# Resposta esperada:
{
  "status": "OK",
  "database": "connected", 
  "timestamp": "2024-08-16T22:30:00.000Z",
  "multiTenant": true
}
```

### **3. Criar Super Admin Inicial**

```sql
-- No Digital Ocean Database Query Console:
INSERT INTO organizations (id, name, code, type, createdAt, updatedAt) 
VALUES ('pdi-tech-001', 'PD&I Tech', 'PDI001', 'DEPARTMENT', NOW(), NOW());

INSERT INTO user_profiles (id, email, name, role, organizationId, isActive, firstLoginCompleted, createdAt, updatedAt)
VALUES (UUID(), 'wadevenga@hotmail.com', 'Administrador', 'super_admin', 'pdi-tech-001', true, false, NOW(), NOW());
```

---

## 🔐 Configurações de Segurança

### **🛡️ JWT Security**

```bash
# Gerar JWT_SECRET forte:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Deve ter pelo menos 32 caracteres
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### **🌐 CORS Configuration**

```javascript
// api-server.cjs já configurado para:
const corsOrigins = [
  'https://seu-dominio.vercel.app',  // Produção
  'http://localhost:5173',           // Desenvolvimento
  'http://localhost:3000'            // Preview
];
```

### **🔒 Database Security**

```bash
# Digital Ocean configurado automaticamente:
- SSL/TLS obrigatório
- Firewall por IP
- Backups automáticos diários
- Monitoramento 24/7
```

---

## 📊 Monitoramento e Observabilidade

### **🔍 Health Checks**

```bash
# Endpoints de monitoramento:
GET /api/health                 # Status geral
GET /api/stats/organizations    # Métricas globais
GET /api/stats/tasks           # Métricas por escola
```

### **📈 Métricas Vercel**

```bash
# No Vercel Dashboard > Analytics:
- Page Views / Unique Visitors
- Core Web Vitals
- Error Rate
- Build Times
- Function Invocations
```

### **💾 Métricas Digital Ocean**

```bash
# No DO Dashboard > Database > Metrics:
- CPU Usage
- Memory Usage  
- Disk Usage
- Connection Count
- Query Performance
```

---

## 🚨 Troubleshooting

### **❌ Erro 500 - Internal Server Error**

```bash
# Verificar:
1. Environment variables configuradas
2. Database connection string correta
3. Logs do Vercel Functions
4. IP autorizado no Digital Ocean

# Debug:
curl -X GET https://seu-dominio.vercel.app/api/health
```

### **🔐 Erro 401 - Unauthorized**

```bash
# Verificar:
1. JWT_SECRET configurado
2. Token válido e não expirado
3. Headers de autorização corretos

# Teste de login:
curl -X POST https://seu-dominio.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"senha"}'
```

### **🌐 CORS Errors**

```bash
# Verificar:
1. Domain correto nas origins do CORS
2. Credentials: true configurado
3. Headers permitidos

# Temporário para debug:
curl -H "Origin: https://seu-dominio.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     https://seu-dominio.vercel.app/api/auth/login
```

### **💾 Database Connection Issues**

```bash
# Verificar:
1. Connection string format
2. SSL mode required
3. IP whitelist no Digital Ocean
4. Connection pooling limits

# Teste direto:
mysql -h seu-host -P 25060 -u usuario -p --ssl-mode=REQUIRED database_name
```

---

## 🔄 Pipeline de CI/CD

### **📤 Git Workflow**

```bash
# 1. Desenvolvimento local
git checkout -b feature/nova-funcionalidade
npm run dev:full  # Testar localmente

# 2. Commit e push
git add .
git commit -m "feat: nova funcionalidade xyz"
git push origin feature/nova-funcionalidade

# 3. Pull Request
# Review de código no GitHub

# 4. Merge para main
git checkout main
git merge feature/nova-funcionalidade
git push origin main

# 5. Deploy automático
# Vercel detecta e deploys automaticamente
```

### **🚀 Deploy Strategies**

```bash
# Preview Deployments:
# Cada PR gera preview URL automático
https://daily-control-git-feature-branch-user.vercel.app

# Production Deployment:
# Merge para main → Deploy production
https://daily-control.vercel.app

# Rollback (se necessário):
# Vercel Dashboard > Deployments > Previous > Promote
```

---

## 📈 Performance Optimization

### **⚡ Frontend Optimization**

```bash
# Build otimizado com Vite:
npm run build  # Tree-shaking automático
npm run preview  # Testar build local

# Code splitting implementado:
- Lazy loading de componentes
- Dynamic imports para rotas
- Memoization com React.memo
```

### **🌊 Database Optimization**

```sql
-- Índices otimizados implementados:
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_org ON user_profiles(organizationId);
CREATE INDEX idx_tasks_org ON tasks(organizationId);
CREATE INDEX idx_tasks_assignee ON tasks(assigneeId);
CREATE INDEX idx_tasks_status ON tasks(status);
```

### **🔄 Connection Pooling**

```javascript
// Prisma configurado automaticamente:
{
  "connectionPool": {
    "maxConnections": 20,
    "timeoutSeconds": 30,
    "retries": 3
  }
}
```

---

## 🔒 Backup e Recovery

### **💾 Backup Strategy**

```bash
# Digital Ocean automático:
- Backup diário automático
- 7 dias de retenção
- Point-in-time recovery
- Backup sob demanda disponível

# Backup manual (se necessário):
mysqldump -h host -P port -u user -p --ssl-mode=REQUIRED database > backup.sql
```

### **🚨 Disaster Recovery**

```bash
# Cenário 1: Database corrupto
1. Restore do backup mais recente
2. Verificar integridade dos dados
3. Testar aplicação completamente

# Cenário 2: Vercel indisponível  
1. Deploy em plataforma alternativa
2. Manter mesmo database
3. Atualizar DNS se necessário

# Cenário 3: Perda de código
1. Clone do GitHub
2. Reconfigurar environment variables
3. Redeploy completo
```

---

## 📚 Documentação de APIs

### **🔐 Authentication**

```typescript
// POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "senha123"
}

// Response:
{
  "user": { "id": "...", "email": "...", "role": "super_admin" },
  "organization": { "id": "...", "name": "..." },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### **🏢 Organizations**

```typescript
// GET /api/organizations
// Headers: Authorization: Bearer <token>

// Response:
[
  {
    "id": "pdi-tech-001",
    "name": "PD&I Tech", 
    "code": "PDI001",
    "type": "DEPARTMENT"
  }
]
```

### **📊 Statistics**

```typescript
// GET /api/stats/organizations  
// Headers: Authorization: Bearer <token>
// Requires: super_admin or franchise_admin

// Response:
{
  "global": {
    "totalOrganizations": 25,
    "totalUsers": 150,
    "totalTasks": 1200,
    "completionRate": 85
  },
  "organizations": [...]
}
```

---

## 🎯 Checklist de Deploy

### **✅ Pré-Deploy**
- [ ] Tests locais passando
- [ ] Environment variables configuradas
- [ ] Database schema atualizado
- [ ] Build success local
- [ ] Lint/format checks ok

### **✅ Deploy**
- [ ] Vercel deploy success
- [ ] Health check responding
- [ ] Login funcionando
- [ ] Dashboard loading
- [ ] APIs responding

### **✅ Pós-Deploy**
- [ ] Monitoramento configurado
- [ ] Backup verificado
- [ ] Performance baseline
- [ ] Error tracking ativo
- [ ] Documentation atualizada

---

## 📞 Suporte e Contatos

### **🆘 Em caso de problemas:**

1. **Verificar Logs**:
   - Vercel Functions Logs
   - Digital Ocean Database Logs  
   - Browser Developer Console

2. **Contatos**:
   - **Desenvolvedor**: Wade Venga
   - **Email**: wadevenga@hotmail.com
   - **Repositório**: [GitHub](https://github.com/wilsonguimaraesrock/daily_control_sede)

3. **Documentação**:
   - [README Principal](./README.md)
   - [Documentação Técnica](./docs/TECHNICAL_DOCUMENTATION.md)
   - [Configuração Vercel](./VERCEL_ENVIRONMENT_VARIABLES.md)

---

**🎉 Com este guia, o Daily Control está pronto para rodar 100% na nuvem com máxima performance e confiabilidade!**

*Última atualização: Agosto 2024*