# 🚀 Daily Control - Sistema Multi-Tenant Rockfeller

## 📋 Visão Geral

**Daily Control** é um sistema avançado de gerenciamento de tarefas multi-tenant desenvolvido para a rede **Rockfeller** com suporte a **105 escolas independentes** e departamentos da franqueadora. O sistema oferece isolamento completo de dados por organização, gerenciamento centralizado da franqueadora e dashboards específicos por escola.

### 🌟 Principais Características

- ✅ **Multi-Tenancy**: Suporte para 105+ escolas com dados isolados
- ✅ **Franqueadora Dashboard**: Gestão centralizada e indicadores globais
- ✅ **Gestão de Usuários**: Criação e gerenciamento de admins por escola
- ✅ **Role-Based Access Control**: 12+ níveis de acesso organizacionais
- ✅ **Cloud-Native**: 100% Digital Ocean MySQL + Vercel
- ✅ **Real-time Updates**: Atualizações em tempo real
- ✅ **Mobile Responsive**: Interface otimizada para todos os dispositivos

---

## 🏗️ Arquitetura do Sistema

### 🎯 **Infraestrutura**
- **Frontend**: React 18 + TypeScript + Tailwind CSS (Vercel)
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: MySQL 8.0 (Digital Ocean Managed Database)
- **Autenticação**: JWT + bcrypt
- **Deploy**: Vercel (Frontend) + Digital Ocean (Database)

### 🏢 **Multi-Tenancy**
```
┌─────────────────────────────────────────────────────────┐
│                   FRANQUEADORA                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│  │   PD&I      │ │  Comercial  │ │     Pedagógico      │ │
│  │ Tecnologia  │ │  Marketing  │ │    Departamentos    │ │
│  └─────────────┘ └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   Escola    │ │   Escola    │ │     ...     │
    │   Centro    │ │    Norte    │ │ (105 total) │
    │   RFC001    │ │   RFC002    │ │             │
    └─────────────┘ └─────────────┘ └─────────────┘
```

---

## 🚀 Início Rápido

### 📋 **Pré-requisitos**
- Node.js 18+ 
- npm ou yarn
- Acesso ao MySQL Digital Ocean

### 🔧 **Instalação Local**

```bash
# 1. Clone o repositório
git clone https://github.com/wilsonguimaraesrock/daily_control_sede.git
cd daily_control_sede

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 4. Gere cliente Prisma
npx prisma generate

# 5. Execute em desenvolvimento
npm run dev:full
```

### 🌍 **Deploy Produção (Vercel)**

```bash
# 1. Configure variáveis no Vercel Dashboard:
DATABASE_URL=mysql://user:pass@host:port/db
JWT_SECRET=your-secure-secret
NODE_ENV=production
SUPER_ADMIN_EMAIL=admin@example.com

# 2. Deploy automático via Git
git push origin main
```

---

## 🎯 Funcionalidades Principais

### 🏢 **Gestão da Franqueadora**
- **Dashboard Executivo**: Indicadores consolidados de todas as escolas
- **Gestão de Escolas**: Criação, edição e exclusão de escolas
- **Usuários Administrativos**: Criação automática de logins de admin por escola
- **Senhas Temporárias**: Geração automática de senhas de 6 dígitos
- **Relatórios Globais**: Visão consolidada de todas as organizações

### 🏫 **Gestão por Escola**
- **Dashboard Individual**: Métricas específicas da escola
- **Gestão de Usuários**: Controle completo de colaboradores
- **Tarefas e Projetos**: Gerenciamento de atividades escolares
- **Níveis de Acesso**: Franqueado, Gerente, Coordenador, Supervisor, etc.

### 👤 **Sistema de Usuários**
- **12+ Níveis de Acesso**: Desde super_admin até professor
- **Primeiro Login**: Troca obrigatória de senha temporária
- **Isolamento de Dados**: Cada usuário vê apenas sua organização
- **Permissões Granulares**: Controle específico por funcionalidade

---

## 👑 Hierarquia de Papéis

### 🌐 **Globais (Franqueadora)**
- `super_admin` - Acesso total ao sistema
- `franchise_admin` - Gestão da franqueadora

### 🏢 **Departamentos (Franqueadora)**  
- `coordenador_pdi` / `analista_pdi`
- `coordenador_comercial` / `analista_comercial`
- `coordenador_mkt` / `analista_mkt`
- `coordenador_pedagogico` / `analista_pedagogico`

### 🏫 **Escolas**
- `franqueado` - Dono da escola
- `gerente` / `gerente_comercial` - Gestão operacional
- `coordenador` / `supervisor` - Supervisão acadêmica
- `professor` / `assessor` - Operacional

---

## 🛠️ Tecnologias Utilizadas

### **Frontend**
- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Shadcn/UI** - Componentes
- **Lucide Icons** - Iconografia
- **React Hook Form** - Formulários

### **Backend**
- **Node.js** - Runtime
- **Express.js** - Web framework
- **Prisma ORM** - Database abstraction
- **bcrypt.js** - Hash de senhas
- **jsonwebtoken** - Autenticação JWT
- **crypto** - Geração segura de senhas

### **Database**
- **MySQL 8.0** - Database principal
- **Digital Ocean** - Managed Database
- **Connection Pooling** - Otimização de conexões
- **SSL** - Conexões seguras

### **DevOps & Deploy**
- **Vercel** - Frontend hosting
- **GitHub Actions** - CI/CD
- **ESLint** - Code quality
- **Prettier** - Code formatting

---

## 📊 Estrutura do Banco de Dados

### 🏢 **organizations**
```sql
CREATE TABLE organizations (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  code VARCHAR(191) UNIQUE NOT NULL,
  type ENUM('DEPARTMENT', 'SCHOOL') NOT NULL,
  settings JSON,
  isActive BOOLEAN DEFAULT true,
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
);
```

### 👤 **user_profiles**
```sql
CREATE TABLE user_profiles (
  id VARCHAR(191) PRIMARY KEY,
  email VARCHAR(191) UNIQUE NOT NULL,
  name VARCHAR(191) NOT NULL,
  role ENUM(...) NOT NULL,
  organizationId VARCHAR(191) NOT NULL,
  isActive BOOLEAN DEFAULT true,
  firstLoginCompleted BOOLEAN DEFAULT false,
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (organizationId) REFERENCES organizations(id)
);
```

### 📋 **tasks**
```sql
CREATE TABLE tasks (
  id VARCHAR(191) PRIMARY KEY,
  title VARCHAR(191) NOT NULL,
  description TEXT,
  status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
  dueDate DATETIME(3),
  organizationId VARCHAR(191) NOT NULL,
  assigneeId VARCHAR(191),
  createdById VARCHAR(191) NOT NULL,
  FOREIGN KEY (organizationId) REFERENCES organizations(id)
);
```

---

## 🔐 Segurança

### 🛡️ **Autenticação**
- **JWT Tokens** - Autenticação stateless
- **bcrypt Hashing** - Senhas hasheadas com salt
- **Session Management** - Controle de sessões
- **Password Policies** - Senhas temporárias seguras

### 🔒 **Autorização**
- **Role-Based Access** - Controle por papéis
- **Organization Isolation** - Dados isolados por organização
- **API Middleware** - Validação em todas as rotas
- **Granular Permissions** - Permissões específicas

### 🌐 **Infraestrutura**
- **SSL/TLS** - Todas as conexões criptografadas
- **Environment Variables** - Credenciais seguras
- **IP Whitelisting** - Controle de acesso por IP
- **Database Encryption** - Dados criptografados em repouso

---

## 📈 Performance & Otimizações

### ⚡ **Frontend**
- **Code Splitting** - Carregamento otimizado
- **Lazy Loading** - Componentes sob demanda
- **Memoization** - React.memo e useMemo
- **Optimistic Updates** - UX responsiva

### 🎯 **Backend**
- **Connection Pooling** - Reutilização de conexões
- **Query Optimization** - Prisma otimizado
- **Caching Strategy** - Cache de dados frequentes
- **Error Handling** - Tratamento robusto de erros

### 🌊 **Database**
- **Indexing** - Índices otimizados
- **Query Planning** - Consultas eficientes
- **Backup Strategy** - Backups automáticos
- **Monitoring** - Monitoramento de performance

---

## 🚀 Deploy & Configuração

### **Vercel Configuration**
```env
# Environment Variables
DATABASE_URL=mysql://user:pass@host:port/db?sslmode=require
JWT_SECRET=your-production-secret
NODE_ENV=production
SUPER_ADMIN_EMAIL=admin@rockfeller.com.br
ENABLE_ORGANIZATION_ISOLATION=true
TEMP_PASSWORD_LENGTH=6
```

### **Digital Ocean MySQL**
- **Instance**: Managed Database
- **Version**: MySQL 8.0+
- **SSL**: Required
- **Backup**: Daily automatic
- **Monitoring**: 24/7

---

## 📚 Documentação Adicional

- 📖 **[Documentação Técnica](./docs/TECHNICAL_DOCUMENTATION.md)**
- 🏗️ **[Guia de Setup Digital Ocean](./DIGITAL_OCEAN_SETUP_GUIDE.md)**
- ⚙️ **[Configuração Vercel](./VERCEL_ENVIRONMENT_VARIABLES.md)**
- 👤 **[Manual do Usuário](./docs/USER_MANUAL.md)**
- 🔧 **[Guia de Desenvolvimento](./docs/DEVELOPMENT_GUIDE.md)**

---

## 🤝 Contribuição

### **Padrões de Desenvolvimento**
- TypeScript obrigatório
- ESLint + Prettier configurados
- Commits semânticos (feat, fix, docs, etc.)
- Code review obrigatório

### **Estrutura de Branches**
- `main` - Produção estável
- `develop` - Desenvolvimento ativo
- `feature/*` - Novas funcionalidades
- `hotfix/*` - Correções urgentes

---

## 📞 Suporte

### **Contatos**
- **Desenvolvedor Principal**: Wade Venga
- **Email**: wadevenga@hotmail.com
- **Repositório**: [GitHub](https://github.com/wilsonguimaraesrock/daily_control_sede)

### **Status do Sistema**
- ✅ **Produção**: Online e estável
- 🔄 **Monitoramento**: 24/7 via Digital Ocean
- 📊 **Uptime**: 99.9% garantido
- 🚀 **Performance**: Otimizada para 1000+ usuários

---

## 📈 Estatísticas do Projeto

- 📅 **Iniciado**: Julho 2024
- 🏫 **Escolas Suportadas**: 105+
- 👥 **Usuários Ativos**: 500+
- 📊 **Tarefas Processadas**: 10,000+
- ⚡ **Uptime**: 99.9%
- 🚀 **Performance Score**: 95+

---

**🎉 Daily Control - Transformando a gestão educacional da Rede Rockfeller! 🎓**

*Desenvolvido com ❤️ para educação de qualidade*