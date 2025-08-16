// ================================
// MULTI-TENANT TASK TYPES
// ================================

export interface Task {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  assigned_users: string[];
  is_private: boolean;
  edited_by?: string;
  edited_at?: Date;
  
  // Relacionamentos multi-tenant
  organization?: {
    id: string;
    name: string;
    code: string;
    type: 'SCHOOL' | 'DEPARTMENT';
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export type TaskStatus = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';

export type TaskPriority = 'baixa' | 'media' | 'alta' | 'urgente';

// Manter compatibilidade com interfaces existentes
export interface NewTask {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  due_time: string;
  assigned_users: string[];
  is_private: boolean;
  organization_id?: string; // Novo: será inferido automaticamente
}

export interface EditTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  due_time: string;
  assigned_users: string[];
  is_private: boolean;
}

// ================================
// NOVOS TIPOS MULTI-TENANT
// ================================

export interface CreateTaskData {
  title: string;
  description?: string;
  priority: TaskPriority;
  due_date?: string;
  assigned_users?: string[];
  is_private?: boolean;
  organization_id?: string; // Opcional - será inferido do usuário logado
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  assigned_users?: string[];
  is_private?: boolean;
}

// ================================
// TASK FILTERS FOR MULTI-TENANT
// ================================

export interface TaskFilters {
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  assigned_user?: string | 'all';
  organization_id?: string | 'all'; // Para super_admin filtrar por organização
  access_level?: string | 'all';
  date_range?: {
    start?: string;
    end?: string;
  };
  search?: string;
}

// ================================
// TASK ASSIGNMENT
// ================================

export interface TaskAssignment {
  id: string;
  task_id: string;
  user_id: string;
  assigned_at: string;
  assigned_by: string;
}

// ================================
// TASK EDIT HISTORY
// ================================

export interface TaskEditHistory {
  id: string;
  task_id: string;
  edited_by: string;
  edited_at: string;
  changes: Record<string, {
    old_value: any;
    new_value: any;
  }>;
  editor?: {
    name: string;
    email: string;
  };
}

// ================================
// TASK STATISTICS FOR ORGANIZATIONS
// ================================

export interface TaskStatistics {
  organization_id: string;
  organization_name: string;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  avg_completion_time: number; // em dias
  by_priority: {
    baixa: number;
    media: number;
    alta: number;
    urgente: number;
  };
  by_status: {
    pendente: number;
    em_andamento: number;
    concluida: number;
    cancelada: number;
  };
}