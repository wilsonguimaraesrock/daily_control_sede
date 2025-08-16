const { PrismaClient } = require('@prisma/client');

async function testDigitalOceanMySQL() {
  console.log('🔌 Testando conexão com seu MySQL Digital Ocean...\n');
  
  // Configurar DATABASE_URL temporariamente
  process.env.DATABASE_URL = "mysql://doadmin:ljvyOpSKsbXnyf90@db-mysql-nyc3-39437-do-user-7944312-0.b.db.ondigitalocean.com:25060/daily_control?sslmode=require";
  
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Tentando conectar...');
    await prisma.$connect();
    console.log('✅ CONEXÃO ESTABELECIDA COM SUCESSO!\n');
    
    // Verificar se há dados existentes
    try {
      console.log('📊 Verificando estrutura atual...');
      
      // Tentar listar tabelas
      const tables = await prisma.$queryRaw`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = 'daily_control'
        ORDER BY TABLE_NAME
      `;
      
      console.log('📋 Tabelas encontradas:');
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.TABLE_NAME}`);
      });
      
      // Verificar se há dados
      try {
        const orgCount = await prisma.organization.count();
        const userCount = await prisma.userProfile.count();
        const taskCount = await prisma.task.count();
        
        console.log('\n📊 DADOS EXISTENTES:');
        console.log(`   🏢 Organizações: ${orgCount}`);
        console.log(`   👤 Usuários: ${userCount}`);
        console.log(`   📋 Tarefas: ${taskCount}`);
        
        if (orgCount > 0) {
          console.log('\n🏢 Organizações encontradas:');
          const orgs = await prisma.organization.findMany();
          orgs.forEach(org => {
            console.log(`   - ${org.name} (${org.code})`);
          });
        }
        
      } catch (dataError) {
        console.log('\n⚠️ Estrutura multi-tenant não encontrada no banco atual');
        console.log('   (Isso é normal se ainda não foi configurado)');
      }
      
    } catch (structureError) {
      console.log('⚠️ Erro ao verificar estrutura:', structureError.message);
    }
    
    console.log('\n✅ SEU MYSQL DIGITAL OCEAN ESTÁ FUNCIONANDO!');
    console.log('🎯 Podemos usar este banco para a migração.\n');
    
    return { success: true, hasData: true };
    
  } catch (error) {
    console.error('❌ ERRO DE CONEXÃO:', error.message);
    console.log('\n🔍 Possíveis causas:');
    console.log('   - Firewall/IP não autorizado');
    console.log('   - Credenciais incorretas');
    console.log('   - Banco temporariamente indisponível\n');
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  try {
    await testDigitalOceanMySQL();
  } catch (error) {
    console.error('💥 ERRO:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = testDigitalOceanMySQL;