const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// ================================
// MIGRAÇÃO PARA DIGITAL OCEAN POSTGRESQL
// ================================

async function migrateToDigitalOcean() {
  console.log('🚀 Iniciando migração para Digital Ocean PostgreSQL...\n');
  
  const prisma = new PrismaClient();
  
  try {
    // STEP 1: Backup dos dados atuais
    console.log('📊 STEP 1: Criando backup dos dados atuais...');
    
    // Buscar organizações com relacionamentos que existem
    const organizations = await prisma.organization.findMany({
      include: {
        users: true,
        tasks: true
      }
    });
    
    // Buscar password resets separadamente (pode não existir organization_id)
    let allPasswordResets = [];
    try {
      allPasswordResets = await prisma.passwordReset.findMany();
    } catch (error) {
      console.log('⚠️ Password resets table structure differs, skipping...');
    }
    
    console.log(`✅ Encontradas ${organizations.length} organizações:`);
    organizations.forEach(org => {
      console.log(`   📁 ${org.name} (${org.code}): ${org.users.length} usuários, ${org.tasks.length} tarefas`);
    });
    
    // Criar backup completo
    const backupData = {
      timestamp: new Date().toISOString(),
      source: 'current_database',
      destination: 'digital_ocean_postgresql',
      organizations,
      passwordResets: allPasswordResets,
      metadata: {
        totalOrganizations: organizations.length,
        totalUsers: organizations.reduce((sum, org) => sum + org.users.length, 0),
        totalTasks: organizations.reduce((sum, org) => sum + org.tasks.length, 0),
        totalPasswordResets: allPasswordResets.length
      }
    };
    
    const backupFile = path.join(__dirname, `digital_ocean_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`💾 Backup salvo em: ${backupFile}`);
    console.log(`📊 Total de dados: ${backupData.metadata.totalUsers} usuários, ${backupData.metadata.totalTasks} tarefas\n`);
    
    return { backupFile, backupData };
    
  } catch (error) {
    console.error('❌ Erro durante backup:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ================================
// CONFIGURAÇÃO DIGITAL OCEAN
// ================================

function createDigitalOceanConfig() {
  console.log('🔧 STEP 2: Criando configuração para Digital Ocean...\n');
  
  const digitalOceanTemplate = `# ================================
# DIGITAL OCEAN POSTGRESQL CONFIG
# ================================

# 🚀 DIGITAL OCEAN DATABASE
# Substitua pelos valores reais do seu Digital Ocean Database
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# 🔐 CONFIGURAÇÕES DE SEGURANÇA
JWT_SECRET="your-super-secret-jwt-key-production"

# 🌍 AMBIENTE
NODE_ENV="production"
VITE_API_BASE_URL="https://your-app.netlify.app"

# 👤 ADMIN
SUPER_ADMIN_EMAIL="wadevenga@hotmail.com"

# 🏢 MULTI-TENANT
ENABLE_ORGANIZATION_ISOLATION="true"
TEMP_PASSWORD_LENGTH="6"

# ================================
# INSTRUÇÕES DE CONFIGURAÇÃO:
# ================================

# 1. DIGITAL OCEAN SETUP:
#    - Acesse Digital Ocean Dashboard
#    - Crie PostgreSQL Managed Database
#    - Copie a connection string
#    - Substitua DATABASE_URL acima

# 2. SECURITY:
#    - Gere JWT_SECRET forte (32+ caracteres)
#    - Use HTTPS em produção

# 3. DEPLOY:
#    - Configure estas variáveis no Netlify
#    - Teste conexão antes do deploy
`;

  const configFile = path.join(__dirname, '../.env.digital-ocean');
  fs.writeFileSync(configFile, digitalOceanTemplate);
  
  console.log(`⚙️ Template de configuração criado: .env.digital-ocean`);
  console.log('📝 Edite este arquivo com suas credenciais do Digital Ocean\n');
  
  return configFile;
}

// ================================
// SCHEMA POSTGRESQL
// ================================

function createPostgreSQLSchema() {
  console.log('🗄️ STEP 3: Preparando schema PostgreSQL...\n');
  
  const postgresSchema = `// Schema PostgreSQL para Digital Ocean - Daily Control Multi-Tenant
// Migração do MySQL para PostgreSQL

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ================================
// MULTI-TENANCY: ORGANIZAÇÕES
// ================================

model Organization {
  id        String   @id @default(cuid())
  name      String
  code      String   @unique
  type      OrganizationType
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relacionamentos
  users         UserProfile[]
  tasks         Task[]
  passwordResets PasswordReset[]

  @@map("organizations")
}

enum OrganizationType {
  DEPARTMENT  // Departamentos da franqueadora (PD&I, Comercial, etc.)
  SCHOOL      // Escolas Rockfeller

  @@map("organization_types")
}

// ================================
// USUÁRIOS MULTI-TENANT
// ================================

model UserProfile {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      Role
  isActive  Boolean  @default(true)
  
  // Multi-tenant
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Controle de primeiro login
  firstLoginCompleted Boolean @default(false)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relacionamentos
  assignedTasks Task[] @relation("TaskAssignee")
  createdTasks  Task[] @relation("TaskCreator")
  passwordResets PasswordReset[]

  @@map("user_profiles")
}

enum Role {
  // Roles Globais (Franqueadora)
  super_admin
  franchise_admin
  
  // Roles de Departamentos (Franqueadora)
  coordenador_pdi
  analista_pdi
  coordenador_comercial
  analista_comercial
  coordenador_mkt
  analista_mkt
  coordenador_pedagogico
  analista_pedagogico
  
  // Roles de Escolas
  franqueado
  gerente
  gerente_comercial
  coordenador
  supervisor
  professor
  assessor

  @@map("roles")
}

// ================================
// TAREFAS MULTI-TENANT
// ================================

model Task {
  id          String     @id @default(cuid())
  title       String
  description String?    @db.Text
  dueDate     DateTime
  status      TaskStatus @default(PENDING)
  priority    Priority   @default(MEDIUM)
  
  // Multi-tenant
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Relacionamentos
  assigneeId String?
  assignee   UserProfile? @relation("TaskAssignee", fields: [assigneeId], references: [id])
  
  createdById String
  createdBy   UserProfile @relation("TaskCreator", fields: [createdById], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("tasks")
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED

  @@map("task_statuses")
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT

  @@map("priorities")
}

// ================================
// GESTÃO DE SENHAS
// ================================

model PasswordReset {
  id        String   @id @default(cuid())
  
  // Multi-tenant
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  userId String
  user   UserProfile @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  temporaryPassword String
  isUsed            Boolean  @default(false)
  expiresAt         DateTime
  
  createdAt DateTime @default(now())

  @@map("password_resets")
}
`;

  const schemaFile = path.join(__dirname, '../prisma/schema-digital-ocean.prisma');
  fs.writeFileSync(schemaFile, postgresSchema);
  
  console.log(`📄 Schema PostgreSQL criado: prisma/schema-digital-ocean.prisma`);
  console.log('🔄 Este será usado para migração para Digital Ocean\n');
  
  return schemaFile;
}

// ================================
// MAIN EXECUTION
// ================================

async function main() {
  try {
    console.log('🌊 MIGRAÇÃO DIGITAL OCEAN - DAILY CONTROL MULTI-TENANT\n');
    console.log('=' * 60 + '\n');
    
    // Step 1: Backup
    const { backupFile, backupData } = await migrateToDigitalOcean();
    
    // Step 2: Config
    const configFile = createDigitalOceanConfig();
    
    // Step 3: Schema
    const schemaFile = createPostgreSQLSchema();
    
    // Final Summary
    console.log('✅ MIGRAÇÃO PREPARADA COM SUCESSO!\n');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('   1. 🏗️  Configure seu Digital Ocean PostgreSQL Database');
    console.log('   2. ✏️  Edite .env.digital-ocean com suas credenciais');
    console.log('   3. 🔄 Execute: cp .env.digital-ocean .env');
    console.log('   4. 📊 Execute: cp prisma/schema-digital-ocean.prisma prisma/schema.prisma');
    console.log('   5. 🚀 Execute: npx prisma db push');
    console.log('   6. 📤 Execute o script de importação de dados\n');
    
    console.log('📁 ARQUIVOS CRIADOS:');
    console.log(`   💾 Backup: ${backupFile}`);
    console.log(`   ⚙️  Config: ${configFile}`);
    console.log(`   📄 Schema: ${schemaFile}\n`);
    
    return {
      success: true,
      files: { backupFile, configFile, schemaFile },
      data: backupData
    };
    
  } catch (error) {
    console.error('❌ ERRO NA MIGRAÇÃO:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = main;