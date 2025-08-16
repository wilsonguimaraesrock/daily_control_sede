const fs = require('fs');
const path = require('path');

// Função para gerar senha aleatória de 6 dígitos
function generateRandomPassword() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Função para migrar dados do backup MySQL para PostgreSQL
function migrateToPostgreSQL() {
  console.log('🔄 Iniciando migração MySQL → PostgreSQL...');
  
  // Ler o backup do MySQL
  const backupFiles = fs.readdirSync(__dirname).filter(f => f.startsWith('database_backup_') && f.endsWith('.json'));
  if (backupFiles.length === 0) {
    throw new Error('❌ Nenhum arquivo de backup encontrado!');
  }
  
  const latestBackup = backupFiles.sort().reverse()[0];
  const backupPath = path.join(__dirname, latestBackup);
  const mysqlData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  
  console.log(`📂 Usando backup: ${latestBackup}`);
  console.log(`📊 Dados encontrados:`, {
    users: mysqlData.tables.userProfiles?.length || 0,
    tasks: mysqlData.tables.tasks?.length || 0,
    assignments: mysqlData.tables.taskAssignments?.length || 0
  });
  
  // Criar estrutura PostgreSQL
  const postgresData = {
    timestamp: new Date().toISOString(),
    version: '2.0.0-multitenant',
    database: 'postgresql',
    tables: {
      organizations: [],
      userProfiles: [],
      tasks: [],
      taskAssignments: [],
      taskEditHistory: [],
      availableMonths: [],
      passwordResets: []
    }
  };
  
  // ========================================
  // 1. CRIAR ORGANIZAÇÃO "PD&I TECH"
  // ========================================
  
  const pdiOrgId = 'org_pdi_tech_' + Date.now();
  postgresData.tables.organizations.push({
    id: pdiOrgId,
    name: 'PD&I Tech',
    code: 'PDI001',
    type: 'DEPARTMENT',
    settings: {
      canEditDueDates: true,
      allowPrivateTasks: true,
      branding: {
        title: 'Daily Control - PD&I Tech',
        logo: '/assets/rockfeller-logo.png'
      }
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  console.log('🏢 Organização "PD&I Tech" criada');
  
  // ========================================
  // 2. MIGRAR USUÁRIOS
  // ========================================
  
  if (mysqlData.tables.userProfiles) {
    for (const user of mysqlData.tables.userProfiles) {
      // Mapear roles antigos para novos
      let newRole = user.role;
      if (user.role === 'admin' && user.email === 'wadevenga@hotmail.com') {
        newRole = 'super_admin'; // Você vira super admin
      }
      
      postgresData.tables.userProfiles.push({
        id: user.id,
        userId: user.userId || user.user_id,
        organizationId: pdiOrgId, // Todos os usuários atuais vão para PD&I Tech
        name: user.name,
        email: user.email,
        role: newRole,
        customPermissions: {},
        isActive: user.isActive ?? user.is_active ?? true,
        passwordHash: user.passwordHash || user.password_hash,
        createdAt: user.createdAt || user.created_at || new Date().toISOString(),
        lastLogin: user.lastLogin || user.last_login,
        firstLoginCompleted: true
      });
    }
    console.log(`👥 ${mysqlData.tables.userProfiles.length} usuários migrados`);
  }
  
  // ========================================
  // 3. MIGRAR TAREFAS
  // ========================================
  
  if (mysqlData.tables.tasks) {
    for (const task of mysqlData.tables.tasks) {
      postgresData.tables.tasks.push({
        id: task.id,
        organizationId: pdiOrgId, // Todas as tarefas atuais vão para PD&I Tech
        title: task.title,
        description: task.description,
        status: task.status || 'PENDENTE',
        priority: task.priority || 'MEDIA',
        dueDate: task.dueDate || task.due_date,
        createdBy: task.createdBy || task.created_by,
        createdAt: task.createdAt || task.created_at || new Date().toISOString(),
        updatedAt: task.updatedAt || task.updated_at || new Date().toISOString(),
        completedAt: task.completedAt || task.completed_at,
        isPrivate: task.isPrivate ?? task.is_private ?? false
      });
    }
    console.log(`📋 ${mysqlData.tables.tasks.length} tarefas migradas`);
  }
  
  // ========================================
  // 4. MIGRAR ATRIBUIÇÕES E HISTÓRICO
  // ========================================
  
  if (mysqlData.tables.taskAssignments) {
    postgresData.tables.taskAssignments = mysqlData.tables.taskAssignments.map(assignment => ({
      id: assignment.id,
      taskId: assignment.taskId || assignment.task_id,
      userId: assignment.userId || assignment.user_id
    }));
    console.log(`🔗 ${mysqlData.tables.taskAssignments.length} atribuições migradas`);
  }
  
  if (mysqlData.tables.taskEditHistory) {
    postgresData.tables.taskEditHistory = mysqlData.tables.taskEditHistory.map(history => ({
      id: history.id,
      taskId: history.taskId || history.task_id,
      editedBy: history.editedBy || history.edited_by,
      editedAt: history.editedAt || history.edited_at || new Date().toISOString(),
      changes: history.changes || {}
    }));
    console.log(`📝 ${mysqlData.tables.taskEditHistory.length} históricos migrados`);
  }
  
  if (mysqlData.tables.availableMonths) {
    postgresData.tables.availableMonths = mysqlData.tables.availableMonths.map(month => ({
      id: month.id,
      monthValue: month.monthValue || month.month_value,
      displayName: month.displayName || month.display_name,
      isActive: month.isActive ?? month.is_active ?? true,
      createdAt: month.createdAt || month.created_at || new Date().toISOString()
    }));
    console.log(`📅 ${mysqlData.tables.availableMonths.length} meses migrados`);
  }
  
  // ========================================
  // 5. CRIAR ESCOLAS DE EXEMPLO
  // ========================================
  
  console.log('🏫 Criando 3 escolas de exemplo...');
  
  const exampleSchools = [
    { name: 'Rockfeller Centro', code: 'RFC001' },
    { name: 'Rockfeller Norte', code: 'RFC002' },
    { name: 'Rockfeller Sul', code: 'RFC003' }
  ];
  
  for (const school of exampleSchools) {
    const schoolId = 'org_school_' + school.code.toLowerCase();
    const adminUserId = 'user_admin_' + school.code.toLowerCase();
    const randomPassword = generateRandomPassword();
    
    // Criar organização escola
    postgresData.tables.organizations.push({
      id: schoolId,
      name: school.name,
      code: school.code,
      type: 'SCHOOL',
      settings: {
        canEditDueDates: true,
        allowPrivateTasks: false,
        branding: {
          title: `Daily Control - ${school.name}`,
          logo: '/assets/rockfeller-logo.png'
        }
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Criar usuário admin da escola
    postgresData.tables.userProfiles.push({
      id: adminUserId,
      userId: adminUserId,
      organizationId: schoolId,
      name: `Admin ${school.name}`,
      email: `admin.${school.code.toLowerCase()}@rockfeller.edu.br`,
      role: 'admin',
      customPermissions: {},
      isActive: true,
      passwordHash: null, // Será definido no primeiro login
      createdAt: new Date().toISOString(),
      lastLogin: null,
      firstLoginCompleted: false
    });
    
    // Registrar senha temporária
    postgresData.tables.passwordResets.push({
      id: 'reset_' + adminUserId,
      userId: adminUserId,
      newPassword: randomPassword,
      createdBy: 'system_migration',
      createdAt: new Date().toISOString(),
      isUsed: false
    });
    
    console.log(`   ✅ ${school.name} - Admin: admin.${school.code.toLowerCase()}@rockfeller.edu.br - Senha: ${randomPassword}`);
  }
  
  // ========================================
  // 6. SALVAR MIGRAÇÃO
  // ========================================
  
  const migrationFile = path.join(__dirname, `postgresql_migration_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(migrationFile, JSON.stringify(postgresData, null, 2));
  
  // Salvar senhas das escolas separadamente
  const passwordsFile = path.join(__dirname, `school_passwords_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`);
  const passwordsList = exampleSchools.map((school, index) => {
    const reset = postgresData.tables.passwordResets[index];
    return `${school.name} (${school.code}): admin.${school.code.toLowerCase()}@rockfeller.edu.br - Senha: ${reset.newPassword}`;
  }).join('\n');
  fs.writeFileSync(passwordsFile, passwordsList);
  
  console.log('\n🎉 MIGRAÇÃO CONCLUÍDA!');
  console.log(`📁 Dados PostgreSQL: ${migrationFile}`);
  console.log(`🔐 Senhas das escolas: ${passwordsFile}`);
  console.log('\n📊 Resumo da migração:');
  console.log(`   - Organizações: ${postgresData.tables.organizations.length} (1 departamento + 3 escolas)`);
  console.log(`   - Usuários: ${postgresData.tables.userProfiles.length} (${mysqlData.tables.userProfiles?.length || 0} existentes + 3 admins de escola)`);
  console.log(`   - Tarefas: ${postgresData.tables.tasks.length}`);
  console.log(`   - Senhas temporárias: ${postgresData.tables.passwordResets.length}`);
  
  return {
    migrationFile,
    passwordsFile,
    data: postgresData
  };
}

// Executar migração se chamado diretamente
if (require.main === module) {
  try {
    migrateToPostgreSQL();
  } catch (error) {
    console.error('💥 Erro na migração:', error);
    process.exit(1);
  }
}

module.exports = migrateToPostgreSQL;