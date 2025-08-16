const { PrismaClient } = require('@prisma/client');

// ================================
// CRIAR TABELAS MULTI-TENANT NO MYSQL
// ================================

async function createMultiTenantTables() {
  console.log('🔄 Criando tabelas multi-tenant no MySQL...');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Criar tabela organizations
    console.log('📋 Criando tabela organizations...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS organizations (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(20) UNIQUE NOT NULL,
        type ENUM('SCHOOL', 'DEPARTMENT') NOT NULL,
        settings JSON DEFAULT ('{}'),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Tabela organizations criada');

    // 2. Adicionar colunas se não existirem
    console.log('📋 Adicionando colunas organization_id...');
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE user_profiles 
        ADD COLUMN organization_id VARCHAR(36) DEFAULT NULL
      `;
      console.log('✅ Coluna organization_id adicionada em user_profiles');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('⚠️  Coluna organization_id já existe em user_profiles');
      } else {
        throw error;
      }
    }
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE tasks 
        ADD COLUMN organization_id VARCHAR(36) DEFAULT NULL
      `;
      console.log('✅ Coluna organization_id adicionada em tasks');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('⚠️  Coluna organization_id já existe em tasks');
      } else {
        throw error;
      }
    }

    // Adicionar coluna first_login_completed se não existir
    try {
      await prisma.$executeRaw`
        ALTER TABLE user_profiles 
        ADD COLUMN first_login_completed BOOLEAN DEFAULT FALSE
      `;
      console.log('✅ Coluna first_login_completed adicionada em user_profiles');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('⚠️  Coluna first_login_completed já existe em user_profiles');
      } else {
        throw error;
      }
    }

    // 3. Atualizar enum de roles
    console.log('📋 Atualizando roles...');
    await prisma.$executeRaw`
      ALTER TABLE user_profiles 
      MODIFY COLUMN role ENUM(
        'super_admin',
        'franchise_admin', 
        'franchise_analyst',
        'admin',
        'franqueado',
        'gerente_comercial',
        'coordenador',
        'supervisor_adm',
        'assessora_adm',
        'vendedor',
        'professor',
        'departamento_head',
        'departamento_manager',
        'departamento_analyst',
        'departamento_assistant'
      ) NOT NULL DEFAULT 'vendedor'
    `;
    console.log('✅ Roles atualizados');

    // 4. Criar tabela password_resets
    console.log('📋 Criando tabela password_resets...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS password_resets (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        new_password VARCHAR(255) NOT NULL,
        created_by VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_used BOOLEAN DEFAULT FALSE
      )
    `;
    console.log('✅ Tabela password_resets criada');

    // 5. Inserir organização PD&I Tech
    console.log('📋 Criando organizações...');
    
    const pdiOrg = await prisma.$queryRaw`SELECT id FROM organizations WHERE code = 'PDI001'`;
    if (pdiOrg.length === 0) {
      await prisma.$executeRaw`
        INSERT INTO organizations (id, name, code, type, settings) VALUES 
        ('pdi-tech-001', 'PD&I Tech', 'PDI001', 'DEPARTMENT', 
         JSON_OBJECT(
           'canEditDueDates', TRUE,
           'allowPrivateTasks', TRUE,
           'branding', JSON_OBJECT(
             'title', 'Daily Control - PD&I Tech',
             'logo', '/assets/rockfeller-logo.png'
           )
         )
        )
      `;
      console.log('✅ Organização PD&I Tech criada');
    } else {
      console.log('⚠️  Organização PD&I Tech já existe');
    }

    // 6. Inserir escolas de exemplo
    const schools = [
      ['rockfeller-centro-001', 'Rockfeller Centro', 'RFC001'],
      ['rockfeller-norte-002', 'Rockfeller Norte', 'RFC002'],
      ['rockfeller-sul-003', 'Rockfeller Sul', 'RFC003']
    ];

    for (const [id, name, code] of schools) {
      const existing = await prisma.$queryRaw`SELECT id FROM organizations WHERE code = ${code}`;
      if (existing.length === 0) {
        await prisma.$executeRaw`
          INSERT INTO organizations (id, name, code, type, settings) VALUES 
          (${id}, ${name}, ${code}, 'SCHOOL',
           JSON_OBJECT(
             'canEditDueDates', TRUE,
             'allowPrivateTasks', FALSE,
             'branding', JSON_OBJECT(
               'title', CONCAT('Daily Control - ', ${name}),
               'logo', '/assets/rockfeller-logo.png'
             )
           )
          )
        `;
        console.log(`✅ Escola ${name} criada`);
      } else {
        console.log(`⚠️  Escola ${name} já existe`);
      }
    }

    // 7. Atualizar usuários existentes para PD&I Tech
    console.log('📋 Atualizando usuários existentes...');
    const updateResult = await prisma.$executeRaw`
      UPDATE user_profiles 
      SET organization_id = 'pdi-tech-001'
      WHERE organization_id IS NULL
    `;
    console.log(`✅ ${updateResult} usuários atualizados para PD&I Tech`);

    // 8. Atualizar role do admin principal
    console.log('📋 Atualizando admin principal...');
    const adminResult = await prisma.$executeRaw`
      UPDATE user_profiles 
      SET role = 'super_admin' 
      WHERE email = 'wadevenga@hotmail.com'
    `;
    console.log(`✅ Admin principal atualizado (${adminResult} registros)`);

    // 9. Criar admins das escolas
    console.log('📋 Criando admins das escolas...');
    const schoolAdmins = [
      ['admin-rfc001', 'Admin Rockfeller Centro', 'admin.rfc001@rockfeller.edu.br', 'rockfeller-centro-001', '170834'],
      ['admin-rfc002', 'Admin Rockfeller Norte', 'admin.rfc002@rockfeller.edu.br', 'rockfeller-norte-002', '700192'],
      ['admin-rfc003', 'Admin Rockfeller Sul', 'admin.rfc003@rockfeller.edu.br', 'rockfeller-sul-003', '846934']
    ];

    for (const [userId, name, email, orgId, password] of schoolAdmins) {
      // Verificar se já existe
      const existing = await prisma.$queryRaw`SELECT user_id FROM user_profiles WHERE email = ${email}`;
      
      if (existing.length === 0) {
        await prisma.$executeRaw`
          INSERT INTO user_profiles (
            id, user_id, name, email, role, password_hash, 
            is_active, first_login_completed, organization_id, created_at
          ) VALUES (
            UUID(), ${userId}, ${name}, ${email}, 'admin', 
            CONCAT('$2b$10$examplehash', ${password}), 
            TRUE, FALSE, ${orgId}, NOW()
          )
        `;
        
        // Criar senha temporária
        await prisma.$executeRaw`
          INSERT INTO password_resets (user_id, new_password, created_by, is_used) 
          SELECT ${userId}, ${password}, user_id, FALSE
          FROM user_profiles 
          WHERE email = 'wadevenga@hotmail.com' 
          LIMIT 1
        `;
        
        console.log(`✅ Admin ${name} criado com senha ${password}`);
      } else {
        console.log(`⚠️  Admin ${name} já existe`);
      }
    }

    // 10. Atualizar tarefas existentes
    console.log('📋 Atualizando tarefas existentes...');
    const taskResult = await prisma.$executeRaw`
      UPDATE tasks 
      SET organization_id = 'pdi-tech-001' 
      WHERE organization_id IS NULL
    `;
    console.log(`✅ ${taskResult} tarefas atualizadas para PD&I Tech`);

    // Verificação final
    console.log('\n🔍 Verificação final...');
    
    const orgs = await prisma.$queryRaw`SELECT name, code, type FROM organizations`;
    console.log(`📊 Organizações: ${orgs.length}`);
    orgs.forEach(org => {
      console.log(`   - ${org.name} (${org.code}) - ${org.type}`);
    });

    const users = await prisma.$queryRaw`
      SELECT up.name, up.email, up.role, o.name as org_name 
      FROM user_profiles up 
      LEFT JOIN organizations o ON up.organization_id = o.id
    `;
    console.log(`\n👥 Usuários: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.role}) → ${user.org_name || 'Sem organização'}`);
    });

    const passwords = await prisma.$queryRaw`SELECT user_id, new_password FROM password_resets WHERE is_used = FALSE`;
    console.log(`\n🔐 Senhas temporárias: ${passwords.length}`);
    passwords.forEach(pwd => {
      console.log(`   - ${pwd.user_id} → ${pwd.new_password}`);
    });

    console.log('\n🎉 ESTRUTURA MULTI-TENANT CRIADA COM SUCESSO!');
    
  } catch (error) {
    console.error('\n💥 Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createMultiTenantTables()
    .then(() => {
      console.log('\n✨ MySQL preparado para multi-tenant!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro na criação:', error);
      process.exit(1);
    });
}

module.exports = createMultiTenantTables;