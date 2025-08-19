const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createNavegantesUser() {
  try {
    console.log('🔧 Criando/Atualizando usuário da escola Navegantes...');
    
    const email = 'navegantes@rockfellerbrasil.com.br';
    const password = '145430';
    const name = 'Tatiana Venga';
    const role = 'admin';
    const organizationId = 'nav001-1755538018930'; // ID da organização Navegantes

    // 1. Verificar se a organização Navegantes existe, se não, criar
    let organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      console.log('🏫 Criando organização Navegantes...');
      organization = await prisma.organization.create({
        data: {
          id: organizationId,
          name: 'Navegantes',
          code: 'NAV001',
          type: 'SCHOOL',
          settings: {
            branding: {
              logo: '/assets/rockfeller-logo.png',
              title: 'Daily Control - Navegantes'
            },
            canEditDueDates: true,
            allowPrivateTasks: false
          },
          isActive: true
        }
      });
      console.log('✅ Organização Navegantes criada!');
    } else {
      console.log('✅ Organização Navegantes já existe');
    }

    // 2. Verificar se usuário já existe
    let existingUser = await prisma.userProfile.findUnique({
      where: { email: email.toLowerCase() }
    });

    // 3. Gerar hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    if (existingUser) {
      console.log('⚠️  Usuário navegantes@rockfellerbrasil.com.br já existe!');
      console.log('🔄 Atualizando senha para "145430" e organizações...');
      
      // Atualizar senha e organização do usuário existente
      await prisma.userProfile.update({
        where: { email: email.toLowerCase() },
        data: { 
          passwordHash: hashedPassword,
          organizationId: organizationId,
          name: name,
          role: role,
          isActive: true
        }
      });
      
      console.log('✅ Usuário atualizado com sucesso!');
    } else {
      console.log('➕ Criando novo usuário da escola Navegantes...');
      
      // Criar usuário
      const newUser = await prisma.userProfile.create({
        data: {
          userId: `user_navegantes_${Date.now()}`,
          name,
          email: email.toLowerCase(),
          role,
          passwordHash: hashedPassword,
          organizationId: organizationId,
          isActive: true,
          firstLoginCompleted: false
        }
      });
      
      console.log('✅ Usuário criado com sucesso!');
      console.log(`📧 Email: ${newUser.email}`);
      console.log(`👨‍💼 Nome: ${newUser.name}`);
      console.log(`🎭 Papel: ${newUser.role}`);
      console.log(`🏫 Organização: ${organizationId}`);
    }
    
    console.log('\n🔐 CREDENCIAIS DA ESCOLA NAVEGANTES:');
    console.log('📧 Email: navegantes@rockfellerbrasil.com.br');
    console.log('🔑 Senha: 145430');
    console.log('🏫 Escola: Navegantes (NAV001)');
    console.log('\n🚀 Agora você pode fazer login!');

  } catch (error) {
    console.error('❌ Erro ao criar/atualizar usuário da escola Navegantes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createNavegantesUser()
    .then(() => {
      console.log('🎉 Script executado com sucesso!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Erro no script:', error);
      process.exit(1);
    });
}

module.exports = { createNavegantesUser };