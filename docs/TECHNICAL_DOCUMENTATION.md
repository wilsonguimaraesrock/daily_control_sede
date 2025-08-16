# 🔧 Documentação Técnica - Daily Control Multi-Tenant

## 🎯 Visão Geral do Sistema

**Daily Control** é um sistema avançado de gerenciamento de tarefas multi-tenant desenvolvido para a **Rede Rockfeller**, suportando **105 escolas independentes** e departamentos da franqueadora. O sistema utiliza arquitetura moderna cloud-native com **Digital Ocean MySQL** e **Vercel** para máxima performance e escalabilidade.

---

## 🏗️ Arquitetura Técnica

### 🌐 **Stack Tecnológico**

#### **Frontend (Vercel)**
- **React 18.2+** - Biblioteca principal para UI
- **TypeScript 5.0+** - Tipagem estática completa
- **Vite 4.0+** - Build tool otimizado para desenvolvimento
- **Tailwind CSS 3.3+** - Framework CSS utility-first
- **Shadcn/UI** - Biblioteca de componentes modernos
- **React Hook Form** - Gerenciamento avançado de formulários
- **Lucide React** - Iconografia consistente
- **React Router DOM** - Roteamento client-side

#### **Backend (Node.js)**
- **Node.js 18+** - Runtime JavaScript server-side
- **Express.js 4.18+** - Framework web minimalista
- **Prisma ORM 5.0+** - Database abstraction layer
- **bcrypt.js** - Hashing seguro de senhas
- **jsonwebtoken** - Autenticação JWT stateless
- **crypto** - Geração segura de UUIDs e senhas
- **cors** - Cross-Origin Resource Sharing
- **helmet** - Security headers HTTP

#### **Database (Digital Ocean)**
- **MySQL 8.0+** - Database relacional principal
- **Digital Ocean Managed Database** - Infraestrutura gerenciada
- **Connection Pooling** - Otimização de conexões
- **SSL/TLS** - Criptografia obrigatória
- **Automated Backups** - Backup diário automático

### 🔄 **Arquitetura Multi-Tenant**

```mermaid
graph TB
    subgraph "Frontend (Vercel)"
        A[React App] --> B[Auth Context]
        A --> C[Organization Context]
        A --> D[API Hooks]
    end
    
    subgraph "Backend (Node.js)"
        E[Express Server] --> F[Auth Middleware]
        F --> G[Organization Middleware]
        G --> H[API Routes]
    end
    
    subgraph "Database (Digital Ocean)"
        I[Organizations Table]
        J[User Profiles Table]
        K[Tasks Table]
        L[Password Resets Table]
    end
    
    D --> E
    H --> I
    H --> J
    H --> K
    H --> L
```

---

## 📊 Estrutura do Banco de Dados

### 🏢 **organizations**
Tabela central do sistema multi-tenant que define cada escola ou departamento.

```sql
CREATE TABLE `organizations` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `type` ENUM('DEPARTMENT', 'SCHOOL') NOT NULL,
  `settings` JSON DEFAULT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `organizations_code_key` (`code`)
) ENGINE=InnoDB;
```

**Configurações Específicas por Organização:**
```json
{
  "branding": {
    "logo": "/assets/rockfeller-logo.png",
    "title": "Daily Control - Escola Norte"
  },
  "canEditDueDates": true,
  "allowPrivateTasks": true,
  "maxUsers": 50,
  "features": ["task_management", "user_management", "reports"]
}
```

### 👤 **user_profiles**
Tabela de usuários com isolamento por organização e sistema de roles completo.

```sql
CREATE TABLE `user_profiles` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `role` ENUM(
    'super_admin', 'franchise_admin',
    'coordenador_pdi', 'analista_pdi',
    'coordenador_comercial', 'analista_comercial', 
    'coordenador_mkt', 'analista_mkt',
    'coordenador_pedagogico', 'analista_pedagogico',
    'franqueado', 'gerente', 'gerente_comercial',
    'coordenador', 'supervisor', 'professor', 'assessor'
  ) NOT NULL,
  `organizationId` VARCHAR(191) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `firstLoginCompleted` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_profiles_email_key` (`email`),
  KEY `user_profiles_organizationId_fkey` (`organizationId`),
  CONSTRAINT `user_profiles_organizationId_fkey` 
    FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
```

### 📋 **tasks**
Sistema de tarefas com isolamento por organização e controle granular de permissões.

```sql
CREATE TABLE `tasks` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') 
    NOT NULL DEFAULT 'PENDING',
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') 
    NOT NULL DEFAULT 'MEDIUM',
  `dueDate` DATETIME(3) NOT NULL,
  `organizationId` VARCHAR(191) NOT NULL,
  `assigneeId` VARCHAR(191) DEFAULT NULL,
  `createdById` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  KEY `tasks_organizationId_fkey` (`organizationId`),
  KEY `tasks_assigneeId_fkey` (`assigneeId`),
  KEY `tasks_createdById_fkey` (`createdById`),
  
  CONSTRAINT `tasks_organizationId_fkey` 
    FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tasks_assigneeId_fkey` 
    FOREIGN KEY (`assigneeId`) REFERENCES `user_profiles` (`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `tasks_createdById_fkey` 
    FOREIGN KEY (`createdById`) REFERENCES `user_profiles` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;
```

### 🔑 **password_resets**
Sistema de gestão de senhas temporárias com isolamento por organização.

```sql
CREATE TABLE `password_resets` (
  `id` VARCHAR(191) NOT NULL,
  `organizationId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `temporaryPassword` VARCHAR(191) NOT NULL,
  `isUsed` BOOLEAN NOT NULL DEFAULT false,
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  KEY `password_resets_organizationId_fkey` (`organizationId`),
  KEY `password_resets_userId_fkey` (`userId`),
  
  CONSTRAINT `password_resets_organizationId_fkey` 
    FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `password_resets_userId_fkey` 
    FOREIGN KEY (`userId`) REFERENCES `user_profiles` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
```

---

## 🔐 Sistema de Autenticação e Autorização

### 🏛️ **Hierarquia de Papéis**

#### **Globais (Franqueadora)**
```typescript
type GlobalRoles = 
  | 'super_admin'      // Acesso total ao sistema
  | 'franchise_admin'  // Gestão da franqueadora

// Permissões:
// - Acesso a todas as organizações
// - Criação/edição/exclusão de escolas
// - Dashboards consolidados
// - Configurações globais do sistema
```

#### **Departamentos (Franqueadora)**
```typescript
type DepartmentRoles = 
  | 'coordenador_pdi' | 'analista_pdi'
  | 'coordenador_comercial' | 'analista_comercial'
  | 'coordenador_mkt' | 'analista_mkt'
  | 'coordenador_pedagogico' | 'analista_pedagogico'

// Permissões:
// - Acesso apenas ao próprio departamento
// - Gestão de tarefas departamentais
// - Relatórios específicos do departamento
```

#### **Escolas**
```typescript
type SchoolRoles = 
  | 'franqueado'         // Dono da franquia
  | 'gerente'           // Gerente geral
  | 'gerente_comercial' // Gerente comercial específico
  | 'coordenador'       // Coordenação acadêmica
  | 'supervisor'        // Supervisão operacional
  | 'professor'         // Corpo docente
  | 'assessor'          // Suporte administrativo

// Permissões hierárquicas:
// franqueado > gerente > coordenador > supervisor > professor > assessor
```

### 🛡️ **Middleware de Segurança**

#### **Autenticação JWT**
```javascript
// api-server.cjs
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};
```

#### **Isolamento de Organização**
```javascript
const checkOrganizationAccess = async (req, res, next) => {
  const { organizationId } = req.params;
  const userRole = req.user.role;
  const userOrgId = req.user.organization_id;
  
  // Super admins podem acessar qualquer organização
  if (userRole === 'super_admin' || userRole === 'franchise_admin') {
    return next();
  }
  
  // Usuários só podem acessar sua própria organização
  if (userOrgId !== organizationId) {
    return res.status(403).json({ error: 'Organization access denied' });
  }
  
  next();
};
```

### 🔑 **Sistema de Senhas Temporárias**

```javascript
// Geração de senha temporária segura
const generateTemporaryPassword = () => {
  return crypto.randomInt(100000, 999999).toString(); // 6 dígitos
};

// Criação de reset de senha
const createPasswordReset = async (userId, organizationId) => {
  const temporaryPassword = generateTemporaryPassword();
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
  
  const reset = await prisma.passwordReset.create({
    data: {
      id: crypto.randomUUID(),
      organizationId,
      userId,
      temporaryPassword: hashedPassword,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    }
  });
  
  return { resetId: reset.id, plainPassword: temporaryPassword };
};
```

---

## 🎨 Componentes Frontend

### 🏠 **Estrutura de Componentes**

```
src/
├── components/
│   ├── ui/                          # Componentes base (Shadcn/UI)
│   │   ├── Logo.tsx                # Logo responsivo multi-variant
│   │   ├── button.tsx              # Botões padronizados
│   │   ├── card.tsx               # Cards de conteúdo
│   │   ├── dialog.tsx             # Modais e diálogos
│   │   └── ...
│   ├── task/                       # Componentes específicos de tarefas
│   │   ├── TaskCard.tsx           # Card individual de tarefa
│   │   ├── CreateTaskDialog.tsx   # Modal de criação
│   │   ├── EditTaskDialog.tsx     # Modal de edição
│   │   ├── TaskFilters.tsx        # Filtros avançados
│   │   └── AdvancedTaskFilters.tsx
│   ├── LoginForm.tsx              # Formulário de login
│   ├── FirstTimePasswordChange.tsx # Troca de senha inicial
│   ├── UserHeader.tsx             # Header principal
│   ├── UserManagement.tsx         # Gestão de usuários
│   ├── TaskManager.tsx            # Gerenciador principal
│   ├── FranchiseAdminDashboard.tsx # Dashboard franqueadora
│   ├── SchoolManagement.tsx       # Gestão de escolas
│   ├── OrganizationSelector.tsx   # Seletor de organização
│   └── PasswordManagement.tsx     # Gestão de senhas
```

### 🎯 **Componentes Principais**

#### **Logo.tsx - Sistema de Logo Responsivo**
```typescript
interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'full';
  className?: string;
}

export function Logo({ size = 'md', variant = 'full', className }: LogoProps) {
  // Renderização condicional baseada em variant e size
  // - variant="icon" + size="xl": Logo para tela de login
  // - variant="icon" + outros sizes: Logo para header
  // - variant="full": Logo completo com texto
}
```

#### **SchoolManagement.tsx - Gestão Avançada de Escolas**
```typescript
interface SchoolWithAdmin {
  id: string;
  name: string;
  code: string;
  type: OrganizationType;
  admin?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  stats?: {
    totalUsers: number;
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
  };
}

// Funcionalidades implementadas:
// - Cards colapsáveis ordenados alfabeticamente
// - Exibição de credenciais admin seguras
// - Botões de visualizar/configurar/excluir
// - Geração e reset de senhas temporárias
// - Estatísticas em tempo real por escola
```

#### **FranchiseAdminDashboard.tsx - Dashboard Executivo**
```typescript
interface OrganizationStats {
  totalOrganizations: number;
  totalUsers: number;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  recentActivity: ActivityLog[];
}

// Funcionalidades:
// - Indicadores consolidados globais
// - Gráficos de performance por escola
// - Lista de atividades recentes
// - Acesso rápido a gestão de escolas
```

### 🔄 **Contextos React**

#### **AuthContext**
```typescript
interface AuthContextType {
  currentUser: AuthUser | null;
  currentOrganization: Organization | null;
  userPermissions: UserPermissions;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getOrganizations: () => Promise<Organization[]>;
  createOrganization: (data: CreateOrgData) => Promise<Organization>;
  deleteOrganization: (orgId: string) => Promise<void>;
  canSwitchOrganization: () => boolean;
  isSuperAdmin: () => boolean;
}
```

#### **OrganizationContext**
```typescript
interface OrganizationContextType {
  currentOrganization: Organization | null;
  switchOrganization: (orgId: string) => Promise<void>;
  canAccessOrganization: (orgId: string) => boolean;
}
```

---

## 🚀 API Endpoints

### 🔐 **Autenticação**

```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: AuthUser;
  organization: Organization;
  token: string;
}

// POST /api/auth/change-password
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
```

### 🏢 **Organizações**

```typescript
// GET /api/organizations
// Retorna organizações baseado no papel do usuário

// POST /api/organizations
interface CreateOrganizationRequest {
  name: string;
  code: string;
  type: 'DEPARTMENT' | 'SCHOOL';
  adminName: string;
  adminEmail: string;
}

// DELETE /api/organizations/:orgId
// Exclusão com validações de segurança

// GET /api/organizations/:orgId/admin-password
// Recupera senha temporária do admin da escola
```

### 👤 **Usuários**

```typescript
// GET /api/organizations/:orgId/users
// Lista usuários da organização específica

// POST /api/users
interface CreateUserRequest {
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
}

// POST /api/users/:userId/reset-password
// Gera nova senha temporária para usuário
```

### 📊 **Estatísticas**

```typescript
// GET /api/stats/organizations
interface GlobalStats {
  totalOrganizations: number;
  totalUsers: number;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  organizationBreakdown: {
    [orgId: string]: {
      name: string;
      users: number;
      tasks: number;
    };
  };
}

// GET /api/stats/tasks
// Estatísticas de tarefas para organização atual
```

---

## 🎨 Melhorias de UI/UX Implementadas

### 🎯 **Refinamentos Visuais**

#### **Tela de Login**
- ✅ Logo "Daily Control" substituindo "RF" no quadrado azul
- ✅ Texto aumentado em 250% e bold
- ✅ Logo Rockfeller pequena abaixo do texto
- ✅ Remoção de subtítulos desnecessários
- ✅ Layout otimizado para mobile e desktop

#### **Header Principal**
- ✅ Apenas logo Rockfeller (sem texto "Daily Control")
- ✅ Título dinâmico baseado na organização
- ✅ Seletor de organização movido para card separado

#### **Sistema de Tabs**
- ✅ Background alterado para branco/cinza claro
- ✅ Seleção azul restaurada para contraste
- ✅ Spacing otimizado para mobile

#### **Cards de Escola**
- ✅ Colapsáveis por padrão
- ✅ Ordenação alfabética automática
- ✅ Indicadores visuais de status
- ✅ Botões de ação organizados

### 🔧 **Otimizações de Performance**

```typescript
// Memoização de componentes pesados
const SchoolCard = memo(({ school, onUpdate }: SchoolCardProps) => {
  // Evita re-renders desnecessários
});

// Debounce em filtros
const debouncedFilter = useMemo(
  () => debounce((filter: string) => {
    // Filtragem otimizada
  }, 300),
  []
);

// Lazy loading de componentes
const FranchiseAdminDashboard = lazy(() => 
  import('./components/FranchiseAdminDashboard')
);
```

---

## 📈 Monitoramento e Performance

### 🔍 **Logging Sistema**

```javascript
// api-server.cjs - Sistema de logs estruturado
console.log('🚀 Daily Control Multi-Tenant API Server running on port', PORT);
console.log('📊 Health check: http://localhost:' + PORT + '/api/health');
console.log('💾 Database: Connected to MySQL (Digital Ocean)');
console.log('🔐 JWT Secret: Configured');
console.log('🏢 Multi-Tenant: Enabled');
console.log('🔑 Password Management: Active');

// Logs de atividade
console.log('✅ Login successful:', email, `(${role})`);
console.log('🗑️ Organization deleted:', orgName, `(${orgCode}) by ${userEmail}`);
console.log('👤 User created:', userName, `(${userRole}) in ${orgName}`);
```

### 📊 **Métricas de Performance**

```typescript
// Frontend - Métricas de componentes
interface PerformanceMetrics {
  renderTime: number;
  apiResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
}

// Backend - Métricas de API
interface APIMetrics {
  requestsPerSecond: number;
  averageResponseTime: number;
  databaseQueryTime: number;
  errorCount: number;
}
```

### 🛠️ **Health Checks**

```javascript
// GET /api/health - Endpoint de saúde
app.get('/api/health', async (req, res) => {
  try {
    // Testa conexão com database
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'OK',
      database: 'connected',
      timestamp: new Date().toISOString(),
      multiTenant: true,
      version: '2.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'disconnected',
      error: error.message
    });
  }
});
```

---

## 🔄 Deployment Pipeline

### 🌊 **Digital Ocean MySQL**

```yaml
# Configuração do banco
Instance Type: Managed Database
Engine: MySQL 8.0+
Region: NYC3 (New York)
Storage: SSD (auto-scaling)
Backup: Daily automated
SSL: Required
Connection Pooling: Enabled
```

### ⚡ **Vercel Frontend**

```typescript
// vercel.json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 🔐 **Environment Variables**

```bash
# Produção (Vercel)
DATABASE_URL=mysql://user:pass@host:port/db?sslmode=require
JWT_SECRET=production-secret-key-32-chars
NODE_ENV=production
SUPER_ADMIN_EMAIL=admin@rockfeller.com.br
ENABLE_ORGANIZATION_ISOLATION=true
TEMP_PASSWORD_LENGTH=6

# Desenvolvimento (Local)
DATABASE_URL=mysql://localhost:3306/daily_control_dev
JWT_SECRET=dev-secret-key
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3001
```

---

## 🧪 Testes e Qualidade

### 🔬 **Testes Implementados**

```javascript
// Teste de conexão com Digital Ocean
node scripts/test-digital-ocean-mysql.cjs

// Verificação de integridade dos dados
node scripts/verify-data-integrity.cjs

// Teste de endpoints críticos
curl -X GET http://localhost:3001/api/health
curl -X POST http://localhost:3001/api/auth/login
```

### 📋 **Code Quality**

```typescript
// ESLint configurado para TypeScript
{
  "extends": [
    "@typescript-eslint/recommended",
    "react-hooks/recommended"
  ],
  "rules": {
    "no-unused-vars": "error",
    "prefer-const": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}

// Prettier para formatação consistente
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2
}
```

---

## 🚀 Roadmap Técnico

### 📅 **Próximas Implementações**

#### **Performance (Q1 2025)**
- [ ] Redis cache layer para consultas frequentes
- [ ] Database indexing otimizado
- [ ] CDN para assets estáticos
- [ ] Service workers para cache offline

#### **Funcionalidades (Q2 2025)**
- [ ] Sistema de notificações push
- [ ] Comentários em tarefas
- [ ] Upload de anexos
- [ ] Relatórios avançados em PDF
- [ ] API webhooks para integrações

#### **Segurança (Q3 2025)**
- [ ] Two-factor authentication (2FA)
- [ ] Audit logs completos
- [ ] Rate limiting avançado
- [ ] Penetration testing automatizado

#### **Escalabilidade (Q4 2025)**
- [ ] Microservices architecture
- [ ] Kubernetes deployment
- [ ] Multi-region deployment
- [ ] Auto-scaling configurado

---

## 📚 Referências e Links

### 🔗 **Documentação Externa**
- [React Documentation](https://react.dev/)
- [Prisma ORM Docs](https://www.prisma.io/docs)
- [Digital Ocean Databases](https://www.digitalocean.com/products/managed-databases)
- [Vercel Deployment](https://vercel.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### 📖 **Documentação Interna**
- [README Principal](../README.md)
- [Guia Setup Digital Ocean](../DIGITAL_OCEAN_SETUP_GUIDE.md)
- [Configuração Vercel](../VERCEL_ENVIRONMENT_VARIABLES.md)
- [Manual do Usuário](./USER_MANUAL.md)

---

**🎯 Esta documentação técnica reflete o estado atual do sistema após a migração completa para Digital Ocean MySQL e implementação do sistema multi-tenant robusto.**

*Última atualização: Agosto 2024*