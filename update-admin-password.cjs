const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    console.log('🔧 Alterando senha do administrador...');
    
    const email = 'wadevenga@hotmail.com';
    const newPassword = 'S@lmos2714';

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
    
    console.log('✅ Senha alterada com sucesso!');
    console.log('\n🔐 SUAS CREDENCIAIS ATUALIZADAS:');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Senha: ${newPassword}`);
    console.log(`👨‍💼 Nome: ${user.name}`);
    console.log(`🎭 Papel: ${user.role}`);
    console.log('\n🚀 Agora você pode fazer login com sua senha preferida!');

  } catch (error) {
    console.error('❌ Erro ao alterar senha:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();