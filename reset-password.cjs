const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetUserPassword() {
  try {
    console.log('🔧 Resetando senha do usuário...');
    
    // Vamos resetar a senha do Wade (admin)
    const email = 'wadevenga@hotmail.com';
    const newPassword = 'wade123';

    // Verificar se usuário existe
    const user = await prisma.userProfile.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      console.log(`❌ Usuário ${email} não encontrado!`);
      return;
    }

    console.log(`✅ Usuário encontrado: ${user.name} (${user.role})`);
    
    // Gerar hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Atualizar senha no banco
    await prisma.userProfile.update({
      where: { email: email.toLowerCase() },
      data: { passwordHash: hashedPassword }
    });
    
    console.log('✅ Senha resetada com sucesso!');
    console.log('\n🔐 NOVAS CREDENCIAIS:');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Senha: ${newPassword}`);
    console.log(`👨‍💼 Nome: ${user.name}`);
    console.log(`🎭 Papel: ${user.role}`);
    console.log('\n🚀 Agora você pode fazer login!');

  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetUserPassword();