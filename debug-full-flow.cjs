/**
 * 🔍 DEBUG FULL FLOW - Rastrear onde horário está sendo perdido
 * 
 * Vamos simular exatamente o que acontece:
 * 1. Frontend constrói string
 * 2. API recebe e processa
 * 3. Banco armazena
 */

console.log('🔍 DEBUG FULL FLOW - Simulando perda de horário...\n');

// Simular dados do frontend
const userInput = {
  date: '2025-08-19',
  time: '11:00'
};

console.log('👤 USER INPUT:');
console.log('  - date:', userInput.date);
console.log('  - time:', userInput.time);

// 1. Como o frontend constrói a string
const frontendString = `${userInput.date} ${userInput.time}:00`;
console.log('\n🖥️  FRONTEND BUILDS:');
console.log('  - localDateTime:', frontendString);

// 2. Como o useTaskManager/API recebe
const apiReceives = frontendString;
console.log('\n📡 API RECEIVES:');
console.log('  - dueDate:', apiReceives);

// 3. Como a API processa (diferentes cenários)
console.log('\n🔧 API PROCESSING SCENARIOS:');

// Cenário 1: task-operations/index.js (com nossa correção)
const scenario1 = apiReceives.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
if (scenario1) {
  const processedDate1 = new Date(apiReceives.replace(' ', 'T'));
  console.log('  - Scenario 1 (task-operations): new Date("' + apiReceives.replace(' ', 'T') + '")');
  console.log('    Result:', processedDate1.toISOString());
  console.log('    Hours:', processedDate1.getUTCHours());
  console.log('    Minutes:', processedDate1.getUTCMinutes());
}

// Cenário 2: Outros endpoints (sem correção)
const processedDate2 = new Date(apiReceives);
console.log('  - Scenario 2 (outros endpoints): new Date("' + apiReceives + '")');
console.log('    Result:', processedDate2.toISOString());
console.log('    Hours:', processedDate2.getUTCHours());
console.log('    Minutes:', processedDate2.getUTCMinutes());

// 4. Como fica no banco
console.log('\n💾 DATABASE STORAGE:');
console.log('  - Scenario 1 saves:', processedDate1.toISOString());
console.log('  - Scenario 2 saves:', processedDate2.toISOString());

// 5. Como o frontend lê de volta
console.log('\n📖 FRONTEND READS BACK:');
const fromDb1 = processedDate1.toISOString();
const fromDb2 = processedDate2.toISOString();

// Com nossa correção de display
const display1 = new Date(fromDb1.slice(0, -1)).toLocaleString('pt-BR');
const display2 = new Date(fromDb2.slice(0, -1)).toLocaleString('pt-BR');

console.log('  - Scenario 1 displays:', display1);
console.log('  - Scenario 2 displays:', display2);

// 6. Teste específico: que endpoint está sendo usado?
console.log('\n🎯 QUAL ENDPOINT ESTÁ SENDO USADO?');
console.log('Se a tarefa salva com 00:00, provavelmente está usando um endpoint SEM correção.');
console.log('Endpoints COM correção: task-operations/index.js');
console.log('Endpoints SEM correção: tasks/[id].js, tasks/index.js, tasks/main.js, tasks/create.js');

// 7. Teste de diferentes formatos
console.log('\n🧪 TESTE FORMATOS:');
const formats = [
  '2025-08-19 11:00:00',
  '2025-08-19T11:00:00',
  '2025-08-19T11:00:00Z',
  '2025-08-19T11:00:00.000Z'
];

formats.forEach(format => {
  const date = new Date(format);
  console.log(`  - "${format}" → ${date.toISOString()} (${date.getUTCHours()}:${date.getUTCMinutes()})`);
});