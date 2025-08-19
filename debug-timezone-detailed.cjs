const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 🔍 DEBUG TIMEZONE - Script para testar conversões de data
 * 
 * Este script vai:
 * 1. Buscar uma tarefa recente do banco
 * 2. Mostrar como ela está armazenada no banco
 * 3. Mostrar como ela fica após conversões JavaScript
 * 4. Identificar onde está o problema de timezone
 */

async function debugTimezone() {
  console.log('🔍 DEBUG TIMEZONE - Iniciando análise...\n');
  
  try {
    // 1. Buscar tarefas recentes
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        dueDate: true,
        createdAt: true
      }
    });
    
    console.log('📋 Tarefas encontradas:', tasks.length);
    
    for (const task of tasks) {
      console.log('\n' + '='.repeat(50));
      console.log(`📝 Tarefa: ${task.title}`);
      console.log('📅 DADOS DO BANCO:');
      console.log('  - dueDate (raw):', task.dueDate);
      console.log('  - dueDate.toString():', task.dueDate?.toString());
      console.log('  - dueDate.toISOString():', task.dueDate?.toISOString());
      
      if (task.dueDate) {
        console.log('\n🔄 CONVERSÕES JAVASCRIPT:');
        
        // Como JavaScript interpreta a data
        const jsDate = new Date(task.dueDate);
        console.log('  - new Date(dueDate):', jsDate);
        console.log('  - .toISOString():', jsDate.toISOString());
        console.log('  - .toLocaleString("pt-BR"):', jsDate.toLocaleString('pt-BR'));
        console.log('  - .toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }):', 
          jsDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
        
        // Testando diferentes formatos
        console.log('\n🧪 TESTE CONVERSÕES:');
        const isoString = task.dueDate.toISOString();
        const testDate1 = new Date(isoString);
        const testDate2 = new Date(isoString.replace('Z', ''));
        
        console.log('  - ISO com Z:', testDate1.toLocaleString('pt-BR'));
        console.log('  - ISO sem Z:', testDate2.toLocaleString('pt-BR'));
        
        // Offset de timezone
        console.log('\n⏰ TIMEZONE INFO:');
        console.log('  - Offset local (minutos):', jsDate.getTimezoneOffset());
        console.log('  - Offset local (horas):', jsDate.getTimezoneOffset() / 60);
        console.log('  - Data/hora local:', {
          year: jsDate.getFullYear(),
          month: jsDate.getMonth() + 1,
          date: jsDate.getDate(),
          hours: jsDate.getHours(),
          minutes: jsDate.getMinutes()
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTimezone();