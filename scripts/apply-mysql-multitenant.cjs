const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// ================================
// APLICAR EXTENSÕES MULTI-TENANT AO MYSQL
// ================================

async function applyMultiTenantExtensions() {
  console.log('🔄 Aplicando extensões multi-tenant ao MySQL atual...');
  
  const prisma = new PrismaClient();
  
  try {
    // Ler arquivo SQL
    const sqlFile = path.join(__dirname, 'extend-mysql-multitenant.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Dividir em comandos individuais
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Executando ${sqlCommands.length} comandos SQL...`);
    
    // Executar cada comando
    let executed = 0;
    for (const command of sqlCommands) {
      try {
        await prisma.$executeRawUnsafe(command);
        executed++;
        
        if (command.includes('CREATE TABLE')) {
          const tableName = command.match(/CREATE TABLE.*?(\w+)/i)?.[1];
          console.log(`  ✅ Tabela criada: ${tableName}`);
        } else if (command.includes('ALTER TABLE')) {
          const tableName = command.match(/ALTER TABLE.*?(\w+)/i)?.[1]; 
          console.log(`  ✅ Tabela alterada: ${tableName}`);
        } else if (command.includes('INSERT INTO')) {
          const tableName = command.match(/INSERT INTO.*?(\w+)/i)?.[1];
          console.log(`  ✅ Dados inseridos: ${tableName}`);
        } else if (command.includes('UPDATE')) {
          const tableName = command.match(/UPDATE.*?(\w+)/i)?.[1];
          console.log(`  ✅ Dados atualizados: ${tableName}`);
        }
        
      } catch (error) {
        // Ignorar erros de "já existe" e similares
        if (error.message.includes('already exists') || 
            error.message.includes('Duplicate entry') ||
            error.message.includes('duplicate key')) {
          console.log(`  ⚠️  Já existe: ignorado`);
        } else {
          console.error(`  ❌ Erro: ${error.message}`);
        }
      }
    }
    
    console.log(`\n✅ ${executed}/${sqlCommands.length} comandos executados com sucesso!`);
    
    // Verificar se funcionou
    console.log('\n🔍 Verificando mudanças...');
    
    try {
      const orgs = await prisma.$queryRaw`SELECT * FROM organizations`;
      console.log(`📊 Organizações encontradas: ${orgs.length}`);
      orgs.forEach(org => {
        console.log(`   - ${org.name} (${org.code}) - ${org.type}`);
      });
    } catch (error) {
      console.log('❌ Erro ao verificar organizações:', error.message);
    }
    
    try {
      const users = await prisma.$queryRaw`
        SELECT up.name, up.email, up.role, o.name as org_name 
        FROM user_profiles up 
        LEFT JOIN organizations o ON up.organization_id = o.id
      `;
      console.log(`\n👥 Usuários atualizados: ${users.length}`);
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.role}) → ${user.org_name || 'Sem organização'}`);
      });
    } catch (error) {
      console.log('❌ Erro ao verificar usuários:', error.message);
    }
    
    try {
      const passwords = await prisma.$queryRaw`SELECT * FROM password_resets WHERE is_used = FALSE`;
      console.log(`\n🔐 Senhas temporárias: ${passwords.length}`);
      passwords.forEach(pwd => {
        console.log(`   - User ID: ${pwd.user_id} → Senha: ${pwd.new_password}`);
      });
    } catch (error) {
      console.log('❌ Erro ao verificar senhas:', error.message);
    }
    
    console.log('\n🎉 EXTENSÃO MULTI-TENANT APLICADA COM SUCESSO!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Atualizar schema Prisma');
    console.log('2. Regenerar cliente Prisma');
    console.log('3. Atualizar APIs do backend');
    console.log('4. Remover dados mock do frontend');
    
  } catch (error) {
    console.error('\n💥 Erro na extensão:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  applyMultiTenantExtensions()
    .then(() => {
      console.log('\n✨ MySQL estendido para multi-tenant!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro na extensão:', error);
      process.exit(1);
    });
}

module.exports = applyMultiTenantExtensions;