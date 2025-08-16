const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createDatabaseBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(__dirname, `database_backup_${timestamp}.json`);
    
    console.log('🔄 Iniciando backup do banco de dados...');
    
    try {
        // Backup de todas as tabelas
        const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            database: 'mysql',
            tables: {}
        };
        
        // UserProfiles
        console.log('📊 Fazendo backup dos usuários...');
        backup.tables.userProfiles = await prisma.userProfile.findMany();
        
        // Tasks
        console.log('📋 Fazendo backup das tarefas...');
        backup.tables.tasks = await prisma.task.findMany();
        
        // TaskAssignments
        console.log('🔗 Fazendo backup das atribuições...');
        backup.tables.taskAssignments = await prisma.taskAssignment.findMany();
        
        // TaskEditHistory
        console.log('📝 Fazendo backup do histórico de edições...');
        backup.tables.taskEditHistory = await prisma.taskEditHistory.findMany();
        
        // AvailableMonths
        console.log('📅 Fazendo backup dos meses disponíveis...');
        backup.tables.availableMonths = await prisma.availableMonth.findMany();
        
        // Salvar backup
        fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
        
        console.log('✅ Backup concluído com sucesso!');
        console.log(`📁 Arquivo: ${backupFile}`);
        console.log(`📊 Estatísticas:`);
        console.log(`   - Usuários: ${backup.tables.userProfiles.length}`);
        console.log(`   - Tarefas: ${backup.tables.tasks.length}`);
        console.log(`   - Atribuições: ${backup.tables.taskAssignments.length}`);
        console.log(`   - Histórico: ${backup.tables.taskEditHistory.length}`);
        console.log(`   - Meses: ${backup.tables.availableMonths.length}`);
        
        return backupFile;
        
    } catch (error) {
        console.error('❌ Erro durante o backup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Executar backup se chamado diretamente
if (require.main === module) {
    createDatabaseBackup()
        .then((file) => {
            console.log(`\n🎉 Backup salvo em: ${file}`);
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Falha no backup:', error);
            process.exit(1);
        });
}

module.exports = createDatabaseBackup;