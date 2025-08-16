const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// ================================
// SCRIPT PARA APLICAR DADOS MIGRADOS
// ================================

async function applyPostgreSQLData() {
  console.log('🔄 Aplicando dados migrados do PostgreSQL...');
  
  // Find the latest migration file
  const backupFiles = fs.readdirSync(__dirname).filter(f => f.startsWith('postgresql_migration_') && f.endsWith('.json'));
  if (backupFiles.length === 0) {
    throw new Error('❌ Nenhum arquivo de migração PostgreSQL encontrado!');
  }
  
  const latestMigration = backupFiles.sort().reverse()[0];
  const migrationPath = path.join(__dirname, latestMigration);
  const migrationData = JSON.parse(fs.readFileSync(migrationPath, 'utf8'));
  
  console.log(`📂 Usando migração: ${latestMigration}`);
  console.log(`📊 Dados encontrados:`, {
    organizations: migrationData.tables.organizations?.length || 0,
    users: migrationData.tables.userProfiles?.length || 0,
    tasks: migrationData.tables.tasks?.length || 0,
    passwordResets: migrationData.tables.passwordResets?.length || 0
  });
  
  // NOTA: Este script simula a aplicação dos dados para teste
  // Em produção, você precisaria configurar PostgreSQL e aplicar via Prisma
  
  console.log('\n🎯 RESUMO DOS DADOS MIGRADOS:');
  
  // ===== ORGANIZAÇÕES =====
  if (migrationData.tables.organizations) {
    console.log('\n🏢 ORGANIZAÇÕES:');
    migrationData.tables.organizations.forEach(org => {
      console.log(`  ✅ ${org.name} (${org.code}) - Tipo: ${org.type}`);
      if (org.settings?.branding?.title) {
        console.log(`     📱 Título: ${org.settings.branding.title}`);
      }
    });
  }
  
  // ===== USUÁRIOS =====
  if (migrationData.tables.userProfiles) {
    console.log('\n👥 USUÁRIOS:');
    migrationData.tables.userProfiles.forEach(user => {
      const orgName = migrationData.tables.organizations?.find(o => o.id === user.organizationId)?.name || 'Desconhecida';
      console.log(`  👤 ${user.name} (${user.email})`);
      console.log(`     🏷️  Role: ${user.role}`);
      console.log(`     🏢 Organização: ${orgName}`);
      console.log(`     ✅ Ativo: ${user.isActive ? 'Sim' : 'Não'}`);
    });
  }
  
  // ===== SENHAS TEMPORÁRIAS =====
  if (migrationData.tables.passwordResets) {
    console.log('\n🔐 SENHAS TEMPORÁRIAS GERADAS:');
    migrationData.tables.passwordResets.forEach(reset => {
      const user = migrationData.tables.userProfiles?.find(u => u.userId === reset.userId);
      if (user) {
        console.log(`  🔑 ${user.name}: ${reset.newPassword}`);
        console.log(`     📧 Email: ${user.email}`);
        console.log(`     👤 Criado por: ${reset.createdBy}`);
      }
    });
  }
  
  // ===== CONFIGURAÇÕES PARA PRODUÇÃO =====
  console.log('\n⚙️ PARA APLICAR EM PRODUÇÃO:');
  console.log('1. Configure PostgreSQL:');
  console.log('   brew install postgresql');
  console.log('   brew services start postgresql');
  console.log('   createdb daily_control_multitenant');
  console.log('');
  console.log('2. Atualize o .env:');
  console.log('   DATABASE_URL="postgresql://user:password@localhost:5432/daily_control_multitenant"');
  console.log('');
  console.log('3. Execute migrations:');
  console.log('   npx prisma db push');
  console.log('   npx prisma generate');
  console.log('');
  console.log('4. Importe os dados via script dedicado');
  
  console.log('\n✨ FUNCIONALIDADES DISPONÍVEIS NO SISTEMA MULTI-TENANT:');
  console.log('📋 • Isolamento de dados por organização');
  console.log('🔐 • Geração automática de senhas de 6 dígitos');
  console.log('🏢 • Painel de administração da franqueadora');
  console.log('👥 • Gestão de usuários por escola');
  console.log('📊 • Dashboard consolidado com métricas');
  console.log('🎨 • Título dinâmico por organização');
  console.log('⚡ • Seletor de organização para super admin');
  console.log('🛡️ • Permissões granulares por contexto');
  
  return migrationData;
}

// Execute se chamado diretamente
if (require.main === module) {
  applyPostgreSQLData()
    .then(() => {
      console.log('\n🎉 Revisão da migração concluída!');
      console.log('📝 Os dados estão prontos para serem aplicados em PostgreSQL.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro na revisão:', error);
      process.exit(1);
    });
}

module.exports = applyPostgreSQLData;