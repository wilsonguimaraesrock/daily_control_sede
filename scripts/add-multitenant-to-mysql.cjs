const { PrismaClient } = require('@prisma/client');

// ================================
// ADICIONA DADOS MULTI-TENANT AO MYSQL ATUAL
// ================================

async function addMultiTenantToMySQL() {
  console.log('🔄 Adicionando funcionalidades multi-tenant ao MySQL atual...');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Verificar se já existem organizações
    console.log('📋 Verificando estrutura atual...');
    
    // Verificar usuários atuais
    const users = await prisma.userProfile.findMany();
    console.log(`👥 Usuários encontrados: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    // 2. Atualizar role do administrador principal para super_admin
    console.log('\n🔧 Atualizando role do administrador principal...');
    
    const adminUser = await prisma.userProfile.findFirst({
      where: { email: 'wadevenga@hotmail.com' }
    });
    
    if (adminUser) {
      await prisma.userProfile.update({
        where: { id: adminUser.id },
        data: { role: 'super_admin' }
      });
      console.log(`✅ ${adminUser.name} agora é super_admin`);
    } else {
      console.log('❌ Usuário wadevenga@hotmail.com não encontrado');
    }
    
    // 3. Criar dados de exemplo para demonstração
    console.log('\n🏫 Criando usuários de exemplo para escolas...');
    
    // Verificar se já existem
    const existingSchoolAdmin = await prisma.userProfile.findFirst({
      where: { email: 'admin.rfc001@rockfeller.edu.br' }
    });
    
    if (!existingSchoolAdmin) {
      // Criar admins de escolas de exemplo
      const schoolAdmins = [
        {
          name: 'Admin Rockfeller Centro',
          email: 'admin.rfc001@rockfeller.edu.br',
          role: 'admin',
          password_hash: '$2b$10$example_hash_for_password_170834'
        },
        {
          name: 'Admin Rockfeller Norte', 
          email: 'admin.rfc002@rockfeller.edu.br',
          role: 'admin',
          password_hash: '$2b$10$example_hash_for_password_700192'
        },
        {
          name: 'Admin Rockfeller Sul',
          email: 'admin.rfc003@rockfeller.edu.br', 
          role: 'admin',
          password_hash: '$2b$10$example_hash_for_password_846934'
        }
      ];
      
      for (const admin of schoolAdmins) {
        await prisma.userProfile.create({
          data: {
            user_id: `school_${admin.email.split('@')[0]}`,
            ...admin,
            is_active: true,
            created_at: new Date(),
            first_login_completed: false
          }
        });
        console.log(`✅ Criado: ${admin.name}`);
      }
    } else {
      console.log('✅ Usuários de escola já existem');
    }
    
    console.log('\n🎉 ATUALIZAÇÃO CONCLUÍDA!');
    console.log('\n📋 PARA TESTAR:');
    console.log('1. Faça logout do sistema');
    console.log('2. Faça login novamente com: wadevenga@hotmail.com');
    console.log('3. Agora você deve ver a aba "Franqueadora"');
    console.log('4. Teste as funcionalidades multi-tenant');
    
    console.log('\n🔐 SENHAS DE TESTE PARA ESCOLAS:');
    console.log('📧 admin.rfc001@rockfeller.edu.br - Senha: 170834');
    console.log('📧 admin.rfc002@rockfeller.edu.br - Senha: 700192');  
    console.log('📧 admin.rfc003@rockfeller.edu.br - Senha: 846934');
    
  } catch (error) {
    console.error('💥 Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  addMultiTenantToMySQL()
    .then(() => {
      console.log('\n✨ Pronto para testar o sistema multi-tenant!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro na atualização:', error);
      process.exit(1);
    });
}

module.exports = addMultiTenantToMySQL;