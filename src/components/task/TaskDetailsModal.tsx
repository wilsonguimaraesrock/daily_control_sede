import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CheckCircle, User, Play, X, Trash2, Users, Edit } from 'lucide-react';
import { Task } from '@/types/task';
import { getStatusColor, getPriorityColor, getStatusLabel, getPriorityLabel } from '@/utils/taskUtils';
import { formatDateToBR, formatDateTimeToBR } from '@/utils/dateUtils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (taskId: string, status: Task['status']) => void;
  onDeleteTask?: (taskId: string) => void;
  onEditTask?: (task: Task) => void;
  canEdit: boolean;
  canDelete?: boolean;
  isUpdating: boolean;
  getUserName: (userId: string) => string;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateStatus,
  onDeleteTask,
  onEditTask,
  canEdit,
  canDelete = false,
  isUpdating,
  getUserName
}) => {

  if (!task) return null;

  const renderActionButtons = () => {
    if (!canEdit && !canDelete) return null;

    const statusButtons = [];
    
    // 🎯 BOTÃO DE EDITAR - Sempre visível se pode editar
    if (canEdit && onEditTask) {
      statusButtons.push(
        <Button
          key="edit"
          onClick={() => onEditTask(task)}
          variant="outline"
          className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
        >
          <Edit className="w-4 h-4 mr-2" />
          Editar Tarefa
        </Button>
      );
    }
    
    // Botões de status apenas se pode editar
    if (canEdit) {
      // 🔧 FIX: Normalize status to lowercase for comparison
      const normalizedStatus = task.status?.toLowerCase();
      switch (normalizedStatus) {
        case 'pendente':
          statusButtons.push(
            <Button
              key="start"
              onClick={() => onUpdateStatus(task.id, 'em_andamento')}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar
                </>
              )}
            </Button>
          );
          
          statusButtons.push(
            <AlertDialog key="cancel">
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isUpdating}
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-800 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Cancelar Tarefa</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    Tem certeza que deseja cancelar esta tarefa? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-700 text-white border-slate-600">
                    Voltar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onUpdateStatus(task.id, 'cancelada')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Cancelar Tarefa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          );
          break;

        case 'em_andamento':
          statusButtons.push(
            <AlertDialog key="complete">
              <AlertDialogTrigger asChild>
                <Button
                  disabled={isUpdating}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isUpdating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Concluir
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-800 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Concluir Tarefa</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    Tem certeza que deseja marcar esta tarefa como concluída?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-700 text-white border-slate-600">
                    Voltar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onUpdateStatus(task.id, 'concluida')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Concluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          );
          
          statusButtons.push(
            <AlertDialog key="cancel2">
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isUpdating}
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-800 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Cancelar Tarefa</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    Tem certeza que deseja cancelar esta tarefa? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-700 text-white border-slate-600">
                    Voltar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onUpdateStatus(task.id, 'cancelada')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Cancelar Tarefa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          );
          break;
      }
    }

    // Botão de exclusão se pode deletar
    const deleteButton = canDelete && onDeleteTask ? (
      <AlertDialog key="delete">
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            disabled={isUpdating}
            className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir Tarefa</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Tem certeza que deseja excluir esta tarefa permanentemente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-white border-slate-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDeleteTask(task.id);
                onClose();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir Tarefa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ) : null;

    const allButtons = [...statusButtons];
    if (deleteButton) allButtons.push(deleteButton);

    return allButtons.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {allButtons}
      </div>
    ) : null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card text-foreground border border-border dark:bg-slate-800 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-foreground dark:text-white text-lg sm:text-xl pr-8 break-words">{task.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`${getStatusColor(task.status, task)} border`}>
              {getStatusLabel(task.status, task)}
            </Badge>
            <Badge className={`${getPriorityColor(task.priority)} border`}>
              {getPriorityLabel(task.priority)}
            </Badge>
          </div>

          {task.description && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground dark:text-slate-300 mb-2">Descrição</h4>
              <p className="text-muted-foreground dark:text-slate-400 break-words">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground dark:text-slate-400">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>Criado em: {formatDateToBR((task as any).createdAt || task.created_at)}</span>
              </div>
              
              {((task as any).dueDate || task.due_date) && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground dark:text-slate-400">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>Vence em: {formatDateTimeToBR((task as any).dueDate || task.due_date)}</span>
                </div>
              )}
              
              {((task as any).completedAt || task.completed_at) && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground dark:text-slate-400">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Concluído em: {formatDateToBR((task as any).completedAt || task.completed_at)}</span>
                </div>
              )}
            </div>

            {(() => {
              // Suporte para assignments (API) e assigned_users (frontend)
              const assignedUserIds = (task as any).assignments?.map((assignment: any) => assignment.user?.userId || assignment.user?.id) || task.assigned_users || [];
              
              return assignedUserIds.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground dark:text-slate-300 mb-2">
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span>Atribuído a:</span>
                  </div>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">
                    {assignedUserIds.map((userId: string) => getUserName(userId)).join(', ')}
                  </p>
                </div>
              );
            })()}
            
            {((task as any).createdBy || task.created_by) && (
              <div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground dark:text-slate-300 mb-2">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span>Criado por:</span>
                </div>
                <p className="text-sm text-muted-foreground dark:text-slate-400">
                  {getUserName((task as any).createdBy || task.created_by)}
                </p>
              </div>
            )}
          </div>

          {renderActionButtons() && (
            <div className="pt-4 border-t border-border dark:border-slate-600">
              <h4 className="text-sm font-medium text-muted-foreground dark:text-slate-300 mb-3">Ações</h4>
              {renderActionButtons()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsModal;
