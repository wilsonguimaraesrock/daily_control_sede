require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupUsers() {
  try {
    console.log('🔄 Iniciando limpeza de usuários...');
    
    // Usuários que devem permanecer
    const keepUsers = [
      'wadevenga@hotmail.com', // Administrador
      'wadepvenga@gmail.com',  // Wade Venga (franqueado)
      'tatiana.direito@hotmail.com', // Tatiana Venga (franqueada)
      'nathalyribeiroalves@hotmail.com' // Nathaly Ribeiro Alves (supervisora)
    ];

    // 1. Buscar todos os usuários
    const allUsers = await prisma.userProfile.findMany({
      select: { id: true, name: true, email: true, role: true }
    });

    console.log(`📊 Total de usuários no banco: ${allUsers.length}`);

    // 2. Identificar usuários para exclusão
    const usersToDelete = allUsers.filter(user => !keepUsers.includes(user.email));
    const usersToKeep = allUsers.filter(user => keepUsers.includes(user.email));

    console.log('\n✅ Usuários que serão mantidos:');
    usersToKeep.forEach(user => {
      console.log(`   • ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log('\n❌ Usuários que serão excluídos:');
    usersToDelete.forEach(user => {
      console.log(`   • ${user.name} (${user.email}) - ${user.role}`);
    });

    if (usersToDelete.length === 0) {
      console.log('\n✅ Nenhum usuário para excluir!');
      return;
    }

    // 3. Confirmar e excluir
    console.log(`\n🗑️  Excluindo ${usersToDelete.length} usuários...`);
    
    for (const user of usersToDelete) {
      try {
        await prisma.userProfile.delete({
          where: { id: user.id }
        });
        console.log(`✅ Excluído: ${user.name} (${user.email})`);
      } catch (error) {
        console.error(`❌ Erro ao excluir ${user.email}:`, error.message);
      }
    }

    // 4. Atualizar roles dos usuários mantidos
    console.log('\n🔄 Atualizando roles dos usuários mantidos...');
    
    // Administrador
    await prisma.userProfile.update({
      where: { email: 'wadevenga@hotmail.com' },
      data: { role: 'admin' }
    });
    console.log('✅ Administrador -> admin');

    // Wade Venga -> franqueado
    await prisma.userProfile.update({
      where: { email: 'wadepvenga@gmail.com' },
      data: { role: 'franqueado' }
    });
    console.log('✅ Wade Venga -> franqueado');

    // Tatiana Venga -> franqueado
    await prisma.userProfile.update({
      where: { email: 'tatiana.direito@hotmail.com' },
      data: { role: 'franqueado' }
    });
    console.log('✅ Tatiana Venga -> franqueado');

    // Nathaly -> supervisor_adm
    await prisma.userProfile.update({
      where: { email: 'nathalyribeiroalves@hotmail.com' },
      data: { role: 'supervisor_adm' }
    });
    console.log('✅ Nathaly Ribeiro Alves -> supervisor_adm');

    // 5. Verificar resultado final
    const finalUsers = await prisma.userProfile.findMany({
      select: { name: true, email: true, role: true }
    });

    console.log('\n🎉 Limpeza concluída!');
    console.log(`📊 Usuários finais (${finalUsers.length}):`);
    finalUsers.forEach(user => {
      console.log(`   • ${user.name} (${user.email}) - ${user.role}`);
    });

  } catch (error) {
    console.error('❌ Erro na limpeza:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar limpeza
cleanupUsers();