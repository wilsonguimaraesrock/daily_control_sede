const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuários no banco de dados...');
    
    const users = await prisma.userProfile.findMany({
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      }
    });

    console.log(`\n📊 Total de usuários encontrados: ${users.length}\n`);

    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco de dados');
      console.log('💡 Será necessário criar um usuário admin para começar');
    } else {
      console.log('✅ Usuários encontrados:');
      users.forEach((user, index) => {
        console.log(`\n👤 Usuário ${index + 1}:`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👨‍💼 Nome: ${user.name}`);
        console.log(`   🎭 Papel: ${user.role}`);
        console.log(`   ✅ Ativo: ${user.isActive ? 'Sim' : 'Não'}`);
        console.log(`   📅 Criado: ${user.createdAt.toLocaleDateString('pt-BR')}`);
        console.log(`   🔐 Último login: ${user.lastLogin ? user.lastLogin.toLocaleDateString('pt-BR') : 'Nunca'}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();