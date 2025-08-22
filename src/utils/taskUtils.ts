
// Função utilitária para determinar se uma tarefa está atrasada
export const isTaskOverdue = (task: { due_date?: string; dueDate?: string; status: string }) => {
  // 🔧 FIX: Support both API formats (dueDate/due_date)
  const taskDueDate = (task as any).dueDate || task.due_date;
  if (!taskDueDate) return false;
  if (task.status === 'concluida' || task.status === 'cancelada') return false;
  
  const now = new Date();
  const taskDate = new Date(taskDueDate);
  
  // 🐛 DEBUG: Log para verificar comparação de datas
  if (process.env.NODE_ENV === 'development') {
    console.log('🕒 isTaskOverdue Debug:', {
      taskDueDate,
      taskDate: taskDate.toISOString(),
      now: now.toISOString(),
      nowLocal: now.toLocaleString('pt-BR'),
      taskLocal: taskDate.toLocaleString('pt-BR'),
      isOverdue: taskDate < now,
      timeDiff: (now.getTime() - taskDate.getTime()) / (1000 * 60), // em minutos
    });
  }
  
  return taskDate < now;
};

export const getStatusColor = (status: string, task?: { due_date?: string; status: string }) => {
  // Se a tarefa está atrasada, sempre mostrar em laranja (como no card de indicadores)
  if (task && isTaskOverdue(task)) {
    return 'dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30 bg-orange-500 text-white border-orange-600';
  }

  // 🔧 FIX: Normalize status to lowercase for comparison
  const normalizedStatus = status?.toLowerCase();

  switch (normalizedStatus) {
    case 'pendente': return 'dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30 bg-yellow-500 text-white border-yellow-600';
    case 'em_andamento': return 'dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30 bg-blue-600 text-white border-blue-700';
    case 'concluida': return 'dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30 bg-green-500 text-white border-green-600';
    case 'cancelada': return 'dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30 bg-red-500 text-white border-red-600';
    default: return 'dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30 bg-gray-400 text-black border-gray-500';
  }
};

export const getPriorityColor = (priority: string) => {
  // 🔧 FIX: Normalize priority to lowercase for comparison
  const normalizedPriority = priority?.toLowerCase();
  
  // 🎨 DEBUG: Cores atualizadas - Prioridade Média agora é ROXA
  // 🐛 DEBUG TEMPORÁRIO: Log para verificar se função está sendo chamada
  if (process.env.NODE_ENV === 'development') {
    console.log('🎨 getPriorityColor Debug:', {
      priority,
      normalizedPriority,
      result: normalizedPriority === 'media' ? 'ROXA' : 'OUTRA_COR'
    });
  }
  
  switch (normalizedPriority) {
    case 'baixa': return 'dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30 bg-sky-400 text-white border-sky-500';
    case 'media': return 'dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30 bg-purple-500 text-white border-purple-600';
    case 'urgente': return 'dark:bg-red-600/20 dark:text-red-500 dark:border-red-600/30 bg-red-600 text-white border-red-700';
    default: return 'dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30 bg-gray-400 text-black border-gray-500';
  }
};

export const getStatusLabel = (status: string, task?: { due_date?: string; status: string }) => {
  // Se a tarefa está atrasada, sempre mostrar "Atrasada"
  if (task && isTaskOverdue(task)) {
    return 'Atrasada';
  }

  // 🔧 FIX: Normalize status to lowercase for comparison
  const normalizedStatus = status?.toLowerCase();

  switch (normalizedStatus) {
    case 'pendente': return 'Pendente';
    case 'em_andamento': return 'Em Andamento';
    case 'concluida': return 'Concluída';
    case 'cancelada': return 'Cancelada';
    default: return status;
  }
};

export const getPriorityLabel = (priority: string) => {
  // 🔧 FIX: Normalize priority to lowercase for comparison
  const normalizedPriority = priority?.toLowerCase();
  
  switch (normalizedPriority) {
    case 'baixa': return 'Baixa';
    case 'media': return 'Média';
    case 'urgente': return 'Urgente';
    default: return priority;
  }
};
