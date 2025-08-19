const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 🕒 DEBUG TIME LOSS - Investigar perda de horário
 */

async function debugTimeLoss() {
  console.log('🕒 DEBUG TIME LOSS - Verificando como horários são salvos...\n');
  
  try {
    // Buscar a tarefa mais recente
    const latestTask = await prisma.task.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        dueDate: true,
        createdAt: true
      }
    });
    
    if (!latestTask) {
      console.log('❌ Nenhuma tarefa encontrada');
      return;
    }
    
    console.log('📝 Tarefa mais recente:', latestTask.title);
    console.log('📅 DueDate no banco (raw):', latestTask.dueDate);
    console.log('📅 DueDate toString():', latestTask.dueDate?.toString());
    console.log('📅 DueDate ISO:', latestTask.dueDate?.toISOString());
    
    if (latestTask.dueDate) {
      const date = latestTask.dueDate;
      console.log('\n🕐 ANÁLISE DE HORÁRIO:');
      console.log('  - Ano:', date.getFullYear());
      console.log('  - Mês:', date.getMonth() + 1);
      console.log('  - Dia:', date.getDate());
      console.log('  - Hora:', date.getHours());
      console.log('  - Minuto:', date.getMinutes());
      console.log('  - Segundo:', date.getSeconds());
      
      console.log('\n📊 ANÁLISE DETALHADA:');
      console.log('  - UTC Hours:', date.getUTCHours());
      console.log('  - UTC Minutes:', date.getUTCMinutes());
      console.log('  - Local Hours:', date.getHours());
      console.log('  - Local Minutes:', date.getMinutes());
      
      // Testar diferentes interpretações
      console.log('\n🧪 TESTE INTERPRETAÇÕES:');
      const isoString = date.toISOString();
      console.log('  - ISO String:', isoString);
      
      // Como nosso frontend está interpretando
      const withoutZ = isoString.slice(0, -1);
      const frontendDate = new Date(withoutZ);
      console.log('  - Frontend (sem Z):', frontendDate.toString());
      console.log('  - Frontend formatado:', frontendDate.toLocaleString('pt-BR'));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTimeLoss();