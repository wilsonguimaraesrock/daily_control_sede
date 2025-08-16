// Script para testar se o carregamento de usuários está funcionando
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZWQwN2dwaTAwMDA5a21zaDZlMzNtamgiLCJ1c2VySWQiOiJ1c2VyXzE3NTUyNzI5NzEzNDIiLCJlbWFpbCI6ImFkbWluQHRlc3RlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NTI3MzA4OSwiZXhwIjoxNzU1MzU5NDg5fQ.mkrvuyW_LB2QxKFBK9Y9Edydmp1vMqZCWGUjp_MKWz0';

async function testUserLoading() {
  try {
    const response = await fetch('http://localhost:3001/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const users = await response.json();
      console.log('✅ Usuários carregados com sucesso:');
      console.log(`📊 Total: ${users.length} usuários`);
      
      users.forEach((user, index) => {
        console.log(`\n👤 Usuário ${index + 1}:`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👨‍💼 Nome: ${user.name}`);
        console.log(`   🎭 Papel: ${user.role}`);
        console.log(`   ✅ Ativo: ${user.isActive ? 'Sim' : 'Não'}`);
      });

      console.log('\n🔧 Formato para AdvancedTaskFilters:');
      console.log('Array format:', JSON.stringify(users.slice(0, 2), null, 2));
      
    } else {
      console.error('❌ Erro na resposta:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Erro ao carregar usuários:', error);
  }
}

testUserLoading();