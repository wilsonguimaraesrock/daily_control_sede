import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types/task';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';

/**
 * 🎯 HOOK GERENCIADOR DE TAREFAS - SISTEMA SIMPLIFICADO
 * 
 * Gerencia o estado das tarefas usando API REST
 */

// API Base URL
// API Base URL - Auto-detection for Vercel production
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return window.location.origin;
  }
  return 'http://localhost:3001';
};
const API_BASE_URL = getApiBaseUrl();

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const useTaskManager = () => {
  // 🔍 TESTE BÁSICO - Hook inicializou
  console.log('🚀 useTaskManager INICIALIZADO!', new Date().toLocaleTimeString());

  // 🎯 ESTADOS PRINCIPAIS
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  
  // 🎯 FILTROS
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<string>('all');

  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { notifyTaskCompleted, notifyTaskAssigned, notifyTaskStarted } = useNotifications();

  // 🔄 CARREGAR TAREFAS
  const loadTasks = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      // 🔧 FIX: Validate filter values and prevent undefined/null
      const validStatus = selectedStatus && selectedStatus !== 'all' ? selectedStatus : null;
      const validPriority = selectedPriority && selectedPriority !== 'all' ? selectedPriority : null;
      const validUser = selectedUser && selectedUser !== 'all' && selectedUser !== 'undefined' ? selectedUser : null;
      const validAccessLevel = selectedAccessLevel && selectedAccessLevel !== 'all' ? selectedAccessLevel : null;
      
      if (validStatus) params.append('status', validStatus);
      if (validPriority) params.append('priority', validPriority);
      if (validUser) params.append('assignedTo', validUser);
      if (validAccessLevel) params.append('accessLevel', validAccessLevel);

      // 🔍 DEBUG: Log filter parameters
      console.log('🔍 useTaskManager loadTasks DEBUG:');
      console.log('  👤 Current User:', currentUser?.name, '| Role:', currentUser?.role);
      console.log('  🎯 Selected User:', selectedUser, '→ Valid:', validUser);
      console.log('  🔥 Selected Priority:', selectedPriority, '→ Valid:', validPriority);
      console.log('  📊 Selected Status:', selectedStatus, '→ Valid:', validStatus);
      console.log('  🏢 Selected Access Level:', selectedAccessLevel, '→ Valid:', validAccessLevel);
      console.log('  🌐 API URL:', `${API_BASE_URL}/api/task-operations?${params}`);
      console.log('  📝 Params String:', params.toString());

      const response = await fetch(`${API_BASE_URL}/api/task-operations?${params}`, {
        headers: getAuthHeaders()
      });

      console.log('🔍 Task API Response Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Task API Error:', response.status, errorText);
        throw new Error(`Failed to fetch tasks: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Tasks loaded:', data?.length || 0, 'tasks');
      setTasks(data.tasks || data);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      toast({
        title: "Erro ao carregar tarefas",
        description: "Não foi possível carregar as tarefas. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, selectedStatus, selectedPriority, selectedUser, selectedAccessLevel, toast]);

  // 🔄 CARREGAR USUÁRIOS
  const loadUserProfiles = useCallback(async () => {
    try {
      console.log('🔍 useTaskManager loadUserProfiles DEBUG: Starting...');
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const users = await response.json();
        console.log('🔍 useTaskManager loadUserProfiles DEBUG:');
        console.log('  👥 Users Count:', users?.length || 0);
        if (users?.length > 0) {
          console.log('  👥 Users List:', users.map(u => `${u.name} (${u.role})`));
        } else {
          console.log('  ❌ No users found!');
        }
        setUserProfiles(users);
      } else {
        console.error('❌ useTaskManager loadUserProfiles: Response not OK:', response.status);
        const errorText = await response.text();
        console.error('❌ Error details:', errorText);
      }
    } catch (error) {
      console.error('❌ useTaskManager loadUserProfiles error:', error);
    }
  }, []);

  // ✅ CRIAR TAREFA
  const addTask = async (taskData: Partial<Task>) => {
    try {
      console.log('🔄 UseTaskManager - Sending task data:', taskData);
      console.log('🔄 UseTaskManager - dueDate specifically:', taskData.dueDate);
      console.log('🔄 UseTaskManager - dueDate type:', typeof taskData.dueDate);
      if (taskData.dueDate) {
        console.log('🔄 UseTaskManager - dueDate length:', taskData.dueDate.length);
        console.log('🔄 UseTaskManager - dueDate includes ":":', taskData.dueDate.includes(':'));
      }
      
      const response = await fetch(`${API_BASE_URL}/api/task-operations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const newTask = await response.json();
      setTasks(prev => [newTask, ...prev]);
      
      // 🔔 NOTIFICAÇÃO: Tarefa atribuída
      // Verificar se a tarefa foi atribuída a outros usuários (não incluindo o criador)
      const assignedUserIds = (taskData as any).assignedUserIds || [];
      if (assignedUserIds.length > 0 && currentUser) {
        
        console.log('🔔 Verificando notificações de atribuição:', {
          taskTitle: newTask.title,
          assignedUserIds,
          creatorId: currentUser.id,
          creatorName: currentUser.name
        });
        
        // Enviar notificação para cada usuário atribuído (exceto o criador)
        assignedUserIds.forEach((userId: string) => {
          if (userId !== currentUser.id) {
            // Por enquanto, enviar notificação genérica
            // TODO: Implementar sistema de notificação por usuário específico
            console.log(`🔔 Notificação seria enviada para usuário ${userId} sobre tarefa "${newTask.title}"`);
            
            // Para agora, registrar que a notificação seria enviada
            // Em uma implementação completa, precisaríamos de WebSockets ou polling
            // para notificar usuários específicos quando eles estão online
          }
        });
      }
      
      toast({
        title: "Tarefa criada",
        description: "Tarefa criada com sucesso!",
        variant: "default"
      });
      
      return newTask;
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast({
        title: "Erro ao criar tarefa",
        description: "Não foi possível criar a tarefa. Tente novamente.",
        variant: "destructive"
      });
      throw error;
    }
  };

  // ✏️ ATUALIZAR TAREFA
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      // 🔍 Obter tarefa original para verificar notificações
      const originalTask = tasks.find(task => task.id === taskId);
      
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask = await response.json();
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      
      // 🔔 NOTIFICAÇÃO: Tarefa concluída
      if (updates.status && 
          (updates.status.toLowerCase() === 'concluida' || updates.status === 'CONCLUIDA') &&
          originalTask && 
          currentUser) {
        
        // Verificar se o usuário atual não é o criador da tarefa
        const creatorId = (originalTask as any).creator?.id || (originalTask as any).createdBy || originalTask.created_by;
        
        if (creatorId && creatorId !== currentUser.id) {
          console.log('🔔 Enviando notificação de conclusão:', {
            taskTitle: originalTask.title,
            creatorId,
            currentUserId: currentUser.id,
            currentUserName: currentUser.name
          });
          
          // Enviar notificação para o criador
          notifyTaskCompleted(originalTask.title, currentUser.name);
        }
      }

      // 🔔 NOTIFICAÇÃO: Tarefa iniciada/analisada
      if (updates.status && 
          (updates.status.toLowerCase() === 'em_andamento' || updates.status === 'EM_ANDAMENTO') &&
          originalTask && 
          currentUser) {
        
        // Verificar se o usuário atual não é o criador da tarefa
        const creatorId = (originalTask as any).creator?.id || (originalTask as any).createdBy || originalTask.created_by;
        
        if (creatorId && creatorId !== currentUser.id) {
          console.log('🔔 Enviando notificação de início:', {
            taskTitle: originalTask.title,
            creatorId,
            currentUserId: currentUser.id,
            currentUserName: currentUser.name
          });
          
          // Enviar notificação para o criador
          notifyTaskStarted(originalTask.title, currentUser.name);
        }
      }
      
      toast({
        title: "Tarefa atualizada",
        description: "Tarefa atualizada com sucesso!",
        variant: "default"
      });
      
      return updatedTask;
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast({
        title: "Erro ao atualizar tarefa",
        description: "Não foi possível atualizar a tarefa. Tente novamente.",
        variant: "destructive"
      });
      throw error;
    }
  };

  // 🗑️ DELETAR TAREFA
  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      toast({
        title: "Tarefa excluída",
        description: "Tarefa excluída com sucesso!",
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
      toast({
        title: "Erro ao excluir tarefa",
        description: "Não foi possível excluir a tarefa. Tente novamente.",
        variant: "destructive"
      });
      throw error;
    }
  };

  // 🔄 AUTO-LOAD ON MOUNT AND FILTER CHANGES
  useEffect(() => {
    if (currentUser) {
      loadTasks();
      loadUserProfiles();
    }
  }, [currentUser, loadTasks, loadUserProfiles]);

  // 📊 COMPUTED VALUES
  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const getOverdueTasks = () => {
    const today = new Date();
    return tasks.filter(task => {
      // 🔧 FIX: Support both API formats (dueDate/due_date)
      const taskDueDate = (task as any).dueDate || task.due_date;
      return taskDueDate && 
        new Date(taskDueDate) < today && 
        task.status !== 'concluida';
    });
  };

  const getTasksForUser = (userId: string) => {
    return tasks.filter(task => 
      task.assignments?.some((assignment: any) => assignment.user.userId === userId)
    );
  };

  return {
    // Estados
    tasks,
    isLoading,
    userProfiles,
    
    // Filtros
    selectedUser,
    selectedPriority,
    selectedStatus,
    selectedAccessLevel,
    setSelectedUser,
    setSelectedPriority,
    setSelectedStatus,
    setSelectedAccessLevel,
    
    // Ações
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    
    // Computed
    getTasksByStatus,
    getOverdueTasks,
    getTasksForUser,
    
    // Refresh
    refreshTasks: loadTasks
  };
};