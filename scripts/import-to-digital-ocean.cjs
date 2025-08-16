const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ================================
// IMPORTAÇÃO PARA DIGITAL OCEAN POSTGRESQL
// ================================

async function importToDigitalOcean() {
  console.log('📤 IMPORTANDO DADOS PARA DIGITAL OCEAN POSTGRESQL...\n');
  
  // Encontrar o arquivo de backup mais recente
  const backupFiles = fs.readdirSync(__dirname)
    .filter(file => file.startsWith('digital_ocean_backup_') && file.endsWith('.json'))
    .sort()
    .reverse();
  
  if (backupFiles.length === 0) {
    throw new Error('❌ Nenhum arquivo de backup encontrado! Execute migrate-to-digital-ocean.cjs primeiro.');
  }
  
  const backupFile = path.join(__dirname, backupFiles[0]);
  console.log(`📁 Usando backup: ${backupFiles[0]}`);
  
  const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  console.log(`📊 Dados encontrados: ${backupData.metadata.totalOrganizations} orgs, ${backupData.metadata.totalUsers} usuários, ${backupData.metadata.totalTasks} tarefas\n`);
  
  const prisma = new PrismaClient();
  
  try {
    // Teste de conexão
    console.log('🔌 Testando conexão com Digital Ocean PostgreSQL...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');
    
    // Limpar dados existentes (se houver)
    console.log('🧹 Limpando dados existentes...');
    await prisma.passwordReset.deleteMany();
    await prisma.task.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.organization.deleteMany();
    console.log('✅ Dados limpos.\n');
    
    // Importar organizações
    console.log('🏢 Importando organizações...');
    for (const org of backupData.organizations) {
      await prisma.organization.create({
        data: {
          id: org.id,
          name: org.name,
          code: org.code,
          type: org.type,
          createdAt: new Date(org.createdAt),
          updatedAt: new Date(org.updatedAt)
        }
      });
      console.log(`   ✅ ${org.name} (${org.code})`);
    }
    
    // Importar usuários
    console.log('\n👤 Importando usuários...');
    for (const org of backupData.organizations) {
      for (const user of org.users) {
        await prisma.userProfile.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            organizationId: org.id,
            firstLoginCompleted: user.firstLoginCompleted || false,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          }
        });
        console.log(`   ✅ ${user.name} (${user.email}) - ${user.role}`);
      }
    }
    
    // Importar tarefas
    console.log('\n📋 Importando tarefas...');
    for (const org of backupData.organizations) {
      for (const task of org.tasks) {
        await prisma.task.create({
          data: {
            id: task.id,
            title: task.title,
            description: task.description,
            dueDate: new Date(task.dueDate),
            status: task.status,
            priority: task.priority,
            organizationId: org.id,
            assigneeId: task.assigneeId,
            createdById: task.createdById,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt)
          }
        });
        console.log(`   ✅ ${task.title}`);
      }
    }
    
    // Importar password resets (se existirem)
    if (backupData.passwordResets && backupData.passwordResets.length > 0) {
      console.log('\n🔑 Importando password resets...');
      for (const reset of backupData.passwordResets) {
        // Encontrar organização do usuário
        const user = await prisma.userProfile.findUnique({
          where: { id: reset.userId }
        });
        
        if (user) {
          await prisma.passwordReset.create({
            data: {
              id: reset.id,
              organizationId: user.organizationId,
              userId: reset.userId,
              temporaryPassword: reset.temporaryPassword,
              isUsed: reset.isUsed,
              expiresAt: new Date(reset.expiresAt),
              createdAt: new Date(reset.createdAt)
            }
          });
          console.log(`   ✅ Password reset para ${user.email}`);
        }
      }
    }
    
    // Verificação final
    console.log('\n🔍 VERIFICAÇÃO FINAL:');
    const orgCount = await prisma.organization.count();
    const userCount = await prisma.userProfile.count();
    const taskCount = await prisma.task.count();
    const resetCount = await prisma.passwordReset.count();
    
    console.log(`   📊 Organizações: ${orgCount}`);
    console.log(`   👤 Usuários: ${userCount}`);
    console.log(`   📋 Tarefas: ${taskCount}`);
    console.log(`   🔑 Password Resets: ${resetCount}`);
    
    // Criar usuário admin se não existir
    console.log('\n👑 Verificando super admin...');
    const superAdmin = await prisma.userProfile.findUnique({
      where: { email: 'wadevenga@hotmail.com' }
    });
    
    if (superAdmin) {
      console.log(`✅ Super admin encontrado: ${superAdmin.name}`);
      
      // Atualizar role para super_admin se necessário
      if (superAdmin.role !== 'super_admin') {
        await prisma.userProfile.update({
          where: { id: superAdmin.id },
          data: { role: 'super_admin' }
        });
        console.log(`🔄 Role atualizado para super_admin`);
      }
    } else {
      console.log('⚠️ Super admin não encontrado nos dados importados');
    }
    
    console.log('\n✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('🚀 Seu Daily Control Multi-Tenant está pronto no Digital Ocean!\n');
    
    return {
      success: true,
      stats: { orgCount, userCount, taskCount, resetCount }
    };
    
  } catch (error) {
    console.error('❌ ERRO NA IMPORTAÇÃO:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ================================
// MAIN EXECUTION
// ================================

async function main() {
  try {
    await importToDigitalOcean();
  } catch (error) {
    console.error('💥 FALHA NA IMPORTAÇÃO:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = importToDigitalOcean;