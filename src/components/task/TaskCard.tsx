
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, User, Edit, History, Users, UserPlus } from 'lucide-react';
import { Task } from '@/types/task';

interface TaskCardProps {
  task: Task;
  actionButtons: React.ReactNode;
  getStatusColor: (status: string, task?: { due_date?: string; status: string }) => string;
  getPriorityColor: (priority: string) => string;
  getStatusLabel: (status: string, task?: { due_date?: string; status: string }) => string;
  getPriorityLabel: (priority: string) => string;
  getUserName: (userId: string) => string;
  canEditTask?: (() => boolean) | boolean;
  onEditTask?: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  actionButtons,
  getStatusColor,
  getPriorityColor,
  getStatusLabel,
  getPriorityLabel,
  getUserName,
  canEditTask,
  onEditTask
}) => {
  const handleEditClick = () => {
    if (onEditTask) {
      onEditTask(task);
    }
  };

  // Verifica se pode editar - pode ser uma função ou um boolean
  const canEdit = typeof canEditTask === 'function' ? canEditTask() : canEditTask;

  // Extrair horário da data de vencimento
  const getTimeFromDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      // 🐛 FIX: Remove 'Z' from ISO strings to prevent UTC conversion
      const cleanDateString = dateString.endsWith('Z') ? dateString.slice(0, -1) : dateString;
      const date = new Date(cleanDateString);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-muted border-2 border-border rounded-lg p-3 transition-all duration-200 shadow-sm hover:shadow-md dark:bg-slate-700/80 dark:border dark:border-slate-600/50 dark:hover:bg-slate-700/90">
      <div className="space-y-2">
        {/* Título e horário */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-foreground font-medium text-sm leading-tight dark:text-white">{task.title}</h3>
              {canEdit && (
                <button
                  onClick={handleEditClick}
                  className="p-0.5 text-slate-400 hover:text-blue-400 transition-colors opacity-60 hover:opacity-100"
                  title="Editar tarefa"
                >
                  <Edit className="w-3 h-3" />
                </button>
              )}
            </div>
            
            {((task as any).dueDate || task.due_date) && (
              <div className="text-muted-foreground text-xs font-medium dark:text-slate-300">
                {getTimeFromDate((task as any).dueDate || task.due_date)}
              </div>
            )}
          </div>
        </div>

        {/* Description se existir */}
        {task.description && (
          <p className="text-muted-foreground text-xs leading-relaxed dark:text-slate-400">{task.description}</p>
        )}

        {/* Badges de status e prioridade */}
        <div className="flex flex-wrap gap-1.5">
          <Badge className={`${getStatusColor(task.status, task)} text-xs px-2 py-0.5 font-medium`}>
            {getStatusLabel(task.status, task)}
          </Badge>
          <Badge className={`${getPriorityColor(task.priority)} text-xs px-2 py-0.5 font-medium`}>
            {getPriorityLabel(task.priority)}
          </Badge>
        </div>

        {/* Informações do criador e atribuição */}
        <div className="space-y-1">
          {/* Criador da tarefa - suporte para ambos formatos: createdBy (API) e created_by (frontend) */}
          {((task as any).createdBy || task.created_by) && (
            <div className="flex items-center gap-1 text-muted-foreground dark:text-slate-400">
              <UserPlus className="w-3 h-3" />
              <span className="text-xs">Criado por: <span className="text-blue-600 font-medium dark:text-blue-400">{getUserName((task as any).createdBy || task.created_by)}</span></span>
            </div>
          )}
          
          {/* Usuários atribuídos - suporte para assignments (API) e assigned_users (frontend) */}
          {(() => {
            // Tentar assignments (formato da API) primeiro, depois assigned_users (formato frontend)
            const assignedUserIds = (task as any).assignments?.map((assignment: any) => assignment.user?.userId || assignment.user?.id) || task.assigned_users || [];
            
            return assignedUserIds.length > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground dark:text-slate-400">
                <Users className="w-3 h-3" />
                <span className="text-xs">Atribuído: {assignedUserIds.map((userId: string) => getUserName(userId)).join(', ')}</span>
              </div>
            );
          })()}
        </div>

        {/* Histórico de edição - suporte para ambos formatos */}
        {(((task as any).editedBy || task.edited_by) && ((task as any).editedAt || task.edited_at)) && (
          <div className="pt-2 border-t border-border dark:border-slate-600/50">
            <div className="flex items-center gap-1 text-muted-foreground dark:text-slate-400">
              <History className="w-3 h-3" />
              <span className="text-xs">
                Editado por <span className="text-amber-600 font-medium dark:text-amber-400">{getUserName((task as any).editedBy || task.edited_by)}</span> em{' '}
                <span className="text-foreground/80 dark:text-slate-300">
                  {((task as any).editedAt || task.edited_at)?.toLocaleDateString('pt-BR')} às {((task as any).editedAt || task.edited_at)?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Action buttons if any */}
        {actionButtons && (
          <div className="pt-1">
            {actionButtons}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
