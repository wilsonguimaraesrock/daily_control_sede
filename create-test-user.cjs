const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 Criando usuário de teste...');
    
    const email = 'admin@teste.com';
    const password = '123456';
    const name = 'Admin Teste';
    const role = 'admin';

    // Verificar se usuário já existe
    const existingUser = await prisma.userProfile.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      console.log('⚠️  Usuário admin@teste.com já existe!');
      console.log('🔄 Atualizando senha para "123456"...');
      
      // Atualizar senha do usuário existente
      const hashedPassword = await bcrypt.hash(password, 12);
      
      await prisma.userProfile.update({
        where: { email: email.toLowerCase() },
        data: { passwordHash: hashedPassword }
      });
      
      console.log('✅ Senha atualizada com sucesso!');
    } else {
      console.log('➕ Criando novo usuário de teste...');
      
      // Gerar hash da senha
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Criar usuário
      const newUser = await prisma.userProfile.create({
        data: {
          userId: `user_${Date.now()}`,
          name,
          email: email.toLowerCase(),
          role,
          passwordHash: hashedPassword,
          isActive: true
        }
      });
      
      console.log('✅ Usuário criado com sucesso!');
      console.log(`📧 Email: ${newUser.email}`);
      console.log(`👨‍💼 Nome: ${newUser.name}`);
      console.log(`🎭 Papel: ${newUser.role}`);
    }
    
    console.log('\n🔐 CREDENCIAIS DE TESTE:');
    console.log('📧 Email: admin@teste.com');
    console.log('🔑 Senha: 123456');
    console.log('\n🚀 Agora você pode fazer login!');

  } catch (error) {
    console.error('❌ Erro ao criar usuário de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();