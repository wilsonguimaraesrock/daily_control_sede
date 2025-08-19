const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debugNavegantesLogin() {
  try {
    console.log('🔍 DEBUG - Verificando login da Navegantes...');
    
    const email = 'navegantes@rockfellerbrasil.com.br';
    const testPasswords = ['145430', '123456', 'navegantes123'];

    // 1. Buscar usuário no banco
    const user = await prisma.userProfile.findUnique({
      where: { email },
      include: {
        organization: true
      }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado!');
      return;
    }

    console.log('✅ Usuário encontrado:');
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Nome: ${user.name}`);
    console.log(`🎭 Role: ${user.role}`);
    console.log(`🔹 Ativo: ${user.isActive}`);
    console.log(`🏢 Org ID: ${user.organizationId}`);
    console.log(`🏫 Organização: ${user.organization?.name || 'N/A'}`);
    console.log(`🔐 Password Hash: ${user.passwordHash ? 'EXISTS' : 'MISSING'}`);

    // 2. Testar senhas
    console.log('\n🔐 Testando senhas...');
    for (const password of testPasswords) {
      try {
        const isValid = await bcrypt.compare(password, user.passwordHash || '');
        console.log(`Senha "${password}": ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
      } catch (error) {
        console.log(`Senha "${password}": ❌ ERRO - ${error.message}`);
      }
    }

    // 3. Verificar organização
    if (user.organization) {
      console.log('\n🏢 Organização:');
      console.log(`ID: ${user.organization.id}`);
      console.log(`Nome: ${user.organization.name}`);
      console.log(`Código: ${user.organization.code}`);
      console.log(`Tipo: ${user.organization.type}`);
      console.log(`Ativa: ${user.organization.isActive}`);
    } else {
      console.log('\n❌ Organização não encontrada!');
    }

    // 4. Atualizar senha para garantir que está correta
    console.log('\n🔄 Atualizando senha para "145430"...');
    const newHashedPassword = await bcrypt.hash('145430', 12);
    
    await prisma.userProfile.update({
      where: { email },
      data: { 
        passwordHash: newHashedPassword,
        isActive: true
      }
    });

    // 5. Testar nova senha
    const finalTest = await bcrypt.compare('145430', newHashedPassword);
    console.log(`✅ Nova senha "145430": ${finalTest ? 'VÁLIDA' : 'INVÁLIDA'}`);
    
    console.log('\n🎯 CREDENCIAIS FINAIS:');
    console.log('📧 Email: navegantes@rockfellerbrasil.com.br');
    console.log('🔑 Senha: 145430');

  } catch (error) {
    console.error('❌ Erro no debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  debugNavegantesLogin()
    .then(() => {
      console.log('🎉 Debug concluído!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Erro no debug:', error);
      process.exit(1);
    });
}

module.exports = { debugNavegantesLogin };