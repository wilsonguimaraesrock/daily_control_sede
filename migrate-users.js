require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

// Supabase connection (origem)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// MySQL connection (destino)
const prisma = new PrismaClient();

async function migrateUsers() {
  try {
    console.log('🔄 Iniciando migração de usuários...');
    
    // 1. Buscar usuários do Supabase
    console.log('📥 Buscando usuários do Supabase...');
    const { data: supabaseUsers, error } = await supabase
      .from('user_profiles')
      .select('*');

    if (error) {
      throw new Error(`Erro ao buscar usuários: ${error.message}`);
    }

    console.log(`✅ Encontrados ${supabaseUsers.length} usuários no Supabase`);

    // 2. Verificar usuários existentes no MySQL
    const existingUsers = await prisma.userProfile.findMany({
      select: { email: true }
    });
    const existingEmails = new Set(existingUsers.map(u => u.email));

    // 3. Migrar usuários que não existem
    let migrated = 0;
    let skipped = 0;

    for (const user of supabaseUsers) {
      if (existingEmails.has(user.email)) {
        console.log(`⏭️  Pulando ${user.email} (já existe)`);
        skipped++;
        continue;
      }

      try {
        // Converter campos do Supabase para MySQL
        const mysqlUser = {
          id: user.id,
          userId: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.is_active ?? true,
          passwordHash: user.password_hash,
          createdAt: user.created_at ? new Date(user.created_at) : new Date(),
          lastLogin: user.last_login ? new Date(user.last_login) : null
        };

        await prisma.userProfile.create({
          data: mysqlUser
        });

        console.log(`✅ Migrado: ${user.name} (${user.email})`);
        migrated++;

      } catch (userError) {
        console.error(`❌ Erro ao migrar ${user.email}:`, userError.message);
      }
    }

    console.log('\n🎉 Migração concluída!');
    console.log(`📊 Resultado:`);
    console.log(`   • Migrados: ${migrated} usuários`);
    console.log(`   • Pulados: ${skipped} usuários`);
    console.log(`   • Total: ${supabaseUsers.length} usuários`);

  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateUsers();