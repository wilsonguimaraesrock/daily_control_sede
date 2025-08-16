import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types/task';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
  // 🎯 ESTADOS PRINCIPAIS
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  
  // 🎯 FILTROS
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { currentUser } = useAuth();
  const { toast } = useToast();

  // 🔄 CARREGAR TAREFAS
  const loadTasks = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedPriority !== 'all') params.append('priority', selectedPriority);
      if (selectedUser !== 'all') params.append('assignedTo', selectedUser);

      const response = await fetch(`${API_BASE_URL}/api/tasks?${params}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
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
  }, [currentUser, selectedStatus, selectedPriority, selectedUser, toast]);

  // 🔄 CARREGAR USUÁRIOS
  const loadUserProfiles = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const users = await response.json();
        setUserProfiles(users);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  }, []);

  // ✅ CRIAR TAREFA
  const addTask = async (taskData: Partial<Task>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const newTask = await response.json();
      setTasks(prev => [newTask, ...prev]);
      
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
    return tasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < today && 
      task.status !== 'concluida'
    );
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
    setSelectedUser,
    setSelectedPriority,
    setSelectedStatus,
    
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