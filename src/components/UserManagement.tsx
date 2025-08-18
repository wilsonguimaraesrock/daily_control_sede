import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Crown, Shield, User as UserIcon, UserX, Mail, CheckCircle, Clock, RefreshCw, Trash2, UserMinus, Eye, EyeOff, GraduationCap, UserCheck, FileText, UserCog, Edit, UserPlus } from 'lucide-react';
import { User } from '@/types/user';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PasswordManagement } from './PasswordManagement';
import { getRoleColor, getRoleLabel } from '@/utils/permissions';

const UserManagement: React.FC = () => {
  const [confirmedUsers, setConfirmedUsers] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'vendedor' as const,
  });
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    role: 'vendedor' as User['role'],
  });

  const { 
    canAccessUserManagement, 
    createUser, 
    updateUser,
    getVisibleUsers, 
    deleteUser,
    currentUser
  } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // ✅ CARREGAR TODOS OS USUÁRIOS (ATIVOS E INATIVOS) para gerenciamento via API MySQL
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Auto-detect API URL para Vercel
      const getApiBaseUrl = () => {
        if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
        if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
          return window.location.origin;
        }
        return 'http://localhost:3001';
      };
      const API_BASE_URL = getApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar usuários');
      }

      const data = await response.json();

      const users = (data || []).map((user: any) => ({
        id: user.id as string,
        user_id: user.userId as string,
        name: user.name as string,
        email: user.email as string,
        role: user.role as User['role'],
        is_active: user.isActive as boolean,
        password_hash: '', // Não retornado pela API por segurança
        created_at: new Date(user.createdAt as string),
        last_login: user.lastLogin ? new Date(user.lastLogin as string) : undefined,
        first_login_completed: true // Assumindo que usuários existentes já fizeram primeiro login
      }));

      setConfirmedUsers(users);
      console.log('Usuários carregados no UserManagement:', users.length);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!canAccessUserManagement()) {
    return null;
  }

  // Helper to get role icon component
  const getRoleIconComponent = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />;
      case 'franqueado': return <Shield className="w-4 h-4" />;
      case 'vendedor': return <UserIcon className="w-4 h-4" />;
      case 'professor': return <GraduationCap className="w-4 h-4" />;
      case 'coordenador': return <UserCheck className="w-4 h-4" />;
      case 'assessora_adm': return <FileText className="w-4 h-4" />;
      case 'supervisor_adm': return <UserCog className="w-4 h-4" />;
      case 'super_admin': return <Crown className="w-4 h-4 text-red-600" />;
      case 'franchise_admin': return <Shield className="w-4 h-4 text-purple-600" />;
      case 'gerente_comercial': return <UserIcon className="w-4 h-4 text-orange-600" />;
      default: return <UserX className="w-4 h-4" />;
    }
  };





  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Validar email - regex mais robusta
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    console.log('🔍 Validating email:', newUser.email);
    console.log('✅ Email regex test result:', emailRegex.test(newUser.email));
    
    if (!emailRegex.test(newUser.email)) {
      console.error('❌ Email validation failed for:', newUser.email);
      toast({
        title: "Erro de validação",
        description: `Email "${newUser.email}" não é válido. Use o formato: usuario@dominio.com`,
        variant: "destructive"
      });
      return;
    }
    
    console.log('✅ Email validation passed for:', newUser.email);

    setIsCreating(true);
    try {
      const userData = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      };

      const result = await createUser(userData);
      console.log('✅ User creation result:', result);
      
      // Check if result has expected structure
      if (result && result.user && result.temporaryPassword) {
        // Show success message with temporary password
        toast({
          title: "Usuário criado com sucesso!",
          description: `${result.user.name} foi criado. Senha temporária: ${result.temporaryPassword}`,
        });
        
        setNewUser({
          name: '',
          email: '',
          role: 'vendedor',
        });
        setIsAddDialogOpen(false);
        await loadUsers();
      } else {
        // Handle unexpected response structure
        console.warn('⚠️ Unexpected response structure:', result);
        toast({
          title: "Usuário criado",
          description: "Usuário criado, mas estrutura de resposta inesperada. Verifique a lista.",
        });
        
        setNewUser({
          name: '',
          email: '',
          role: 'vendedor',
        });
        setIsAddDialogOpen(false);
        await loadUsers();
      }
    } catch (error) {
      console.error('Erro ao criar usuário no componente:', error);
      
      // Extract error message from API response
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao criar usuário';
      
      toast({
        title: "Erro ao criar usuário",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUser({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    if (!editUser.name || !editUser.email) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editUser.email)) {
      toast({
        title: "Erro",
        description: "Por favor, insira um email válido",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const userData = {
        name: editUser.name,
        email: editUser.email,
        role: editUser.role
      };

      const success = await updateUser(editingUser.id, userData);
      if (success) {
        setEditUser({
          name: '',
          email: '',
          role: 'vendedor',
        });
        setEditingUser(null);
        setIsEditDialogOpen(false);
        await loadUsers();
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar usuário",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      toast({
        title: "Erro",
        description: "Você não pode excluir sua própria conta",
        variant: "destructive"
      });
      return;
    }

    if (confirm(`Tem certeza que deseja excluir o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
      try {
        // Remover usuário da lista imediatamente (UI otimista)
        setConfirmedUsers(prev => prev.filter(user => user.id !== userId));
        
        // Fazer a exclusão no servidor
        await deleteUser(userId);
        
        // Exibir mensagem de sucesso
        toast({
          title: "Usuário Excluído",
          description: `${userName} foi excluído com sucesso`,
        });
        
        // Recarregar lista para garantir sincronização
        await loadUsers();
        
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        
        // Em caso de erro, recarregar a lista para restaurar o estado correto
        await loadUsers();
        
        toast({
          title: "Erro",
          description: "Erro ao excluir usuário. Tente novamente.",
          variant: "destructive"
        });
      }
    }
  };

  const handleToggleUserStatus = async (userId: string, userName: string, currentStatus: boolean) => {
    if (userId === currentUser?.id) {
      toast({
        title: "Erro",
        description: "Você não pode alterar o status da sua própria conta",
        variant: "destructive"
      });
      return;
    }

    const action = currentStatus ? 'desativar' : 'ativar';
    if (confirm(`Tem certeza que deseja ${action} o usuário "${userName}"?`)) {
      try {
        const success = await toggleUserStatus(userId);
        if (success) {
          toast({
            title: "Status Alterado",
            description: `${userName} foi ${action} com sucesso`,
          });
          await loadUsers();
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao alterar status do usuário",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card backdrop-blur-sm border border-border dark:bg-slate-800/50 dark:border-slate-700">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground dark:bg-gradient-to-r dark:from-purple-500 dark:to-pink-500">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-foreground text-lg dark:text-white">Usuários Ativos</CardTitle>
                <p className="text-muted-foreground text-sm dark:text-slate-400">Usuários confirmados no sistema</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={loadUsers}
                disabled={isLoading}
                variant="outline" 
                className="bg-muted border-border hover:bg-accent hover:text-accent-foreground w-full sm:w-auto dark:bg-slate-700/50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-600/50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </>
                )}
              </Button>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:opacity-90 dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 dark:hover:from-purple-700 dark:hover:to-pink-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-card text-foreground border border-border dark:bg-slate-800 dark:border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-foreground dark:text-white">Criar Novo Usuário</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="userName" className="text-muted-foreground dark:text-slate-300">Nome *</Label>
                      <Input
                        id="userName"
                        value={newUser.name}
                        onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-muted border-border text-foreground dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
                        placeholder="Nome completo do usuário"
                        disabled={isCreating}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="userEmail" className="text-muted-foreground dark:text-slate-300">Email *</Label>
                      <Input
                        id="userEmail"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-muted border-border text-foreground dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
                        placeholder="email@exemplo.com"
                        disabled={isCreating}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="userRole" className="text-muted-foreground dark:text-slate-300">Papel</Label>
                      <Select 
                        value={newUser.role} 
                        onValueChange={(value: any) => setNewUser(prev => ({ ...prev, role: value }))}
                        disabled={isCreating}
                      >
                        <SelectTrigger className="bg-muted border-border dark:bg-slate-700/50 dark:border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border dark:bg-slate-800 dark:border-slate-700">
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="franqueado">Franqueado</SelectItem>
                          <SelectItem value="vendedor">Vendedor</SelectItem>
                          <SelectItem value="professor">Professor</SelectItem>
                          <SelectItem value="coordenador">Coordenador</SelectItem>
                          <SelectItem value="assessora_adm">Assessora ADM</SelectItem>
                          <SelectItem value="supervisor_adm">Supervisor ADM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={handleCreateUser}
                      disabled={isCreating}
                      className="w-full bg-primary text-primary-foreground hover:opacity-90 dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 dark:hover:from-purple-700 dark:hover:to-pink-700"
                    >
                      {isCreating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Usuário
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {confirmedUsers.map(user => (
              <div key={user.id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border gap-4 ${
                user.is_active === false 
                  ? 'bg-red-500/10 border-red-500/30' 
                  : 'bg-muted/40 border-border dark:bg-slate-700/30 dark:border-slate-600'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    user.is_active === false ? 'bg-red-500/20' : 'bg-muted dark:bg-slate-600/50'
                  }`}>
                    {getRoleIconComponent(user.role)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-medium truncate ${
                        user.is_active === false ? 'text-red-300 line-through' : 'text-foreground dark:text-white'
                      }`}>
                        {user.name}
                      </h4>
                      {user.is_active === false && (
                        <Badge className="bg-red-500/20 text-red-400">Inativo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground dark:text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <Badge className={`${getRoleColor(user.role)} whitespace-nowrap`}>
                    {getRoleLabel(user.role)}
                  </Badge>
                  
                  {user.id !== currentUser?.id && (
                    <div className="flex flex-wrap gap-2">
                      <PasswordManagement user={user} onPasswordReset={loadUsers} />
                      
                      <Button
                        onClick={() => handleEditUser(user)}
                        variant="outline"
                        size="sm"
                        className="text-xs bg-blue-600 text-white hover:opacity-90 dark:bg-blue-500/20 dark:border-blue-500/30 dark:hover:bg-blue-500/30 dark:text-blue-400"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      
                      <Button
                        onClick={() => handleToggleUserStatus(user.id, user.name, user.is_active)}
                        variant="outline"
                        size="sm"
                        className={`text-xs ${user.is_active 
                          ? "bg-yellow-500 text-black hover:opacity-90 dark:bg-yellow-500/20 dark:border-yellow-500/30 dark:hover:bg-yellow-500/30 dark:text-yellow-400"
                          : "bg-green-600 text-white hover:opacity-90 dark:bg-green-500/20 dark:border-green-500/30 dark:hover:bg-green-500/30 dark:text-green-400"
                        }`}
                      >
                        {user.is_active ? (
                          <>
                            <UserMinus className="w-4 h-4 mr-2" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Ativar
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        variant="outline"
                        size="sm"
                        className="text-xs bg-red-600 text-white hover:opacity-90 dark:bg-red-500/20 dark:border-red-500/30 dark:hover:bg-red-500/30 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  )}
                  
                  {user.last_login && (
                    <span className="text-xs text-muted-foreground dark:text-slate-400">
                      Último acesso: {user.last_login.toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {confirmedUsers.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <UserX className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">Nenhum usuário ativo</p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-slate-400 mx-auto mb-4 animate-spin" />
                <p className="text-slate-400">Carregando usuários...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editUserName" className="text-slate-300">Nome *</Label>
              <Input
                id="editUserName"
                value={editUser.name}
                onChange={(e) => setEditUser(prev => ({ ...prev, name: e.target.value }))}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="Nome completo do usuário"
                disabled={isUpdating}
              />
            </div>
            
            <div>
              <Label htmlFor="editUserEmail" className="text-slate-300">Email *</Label>
              <Input
                id="editUserEmail"
                type="email"
                value={editUser.email}
                onChange={(e) => setEditUser(prev => ({ ...prev, email: e.target.value }))}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="email@exemplo.com"
                disabled={isUpdating}
              />
            </div>
            
            <div>
              <Label htmlFor="editUserRole" className="text-slate-300">Papel</Label>
              <Select 
                value={editUser.role} 
                onValueChange={(value: any) => setEditUser(prev => ({ ...prev, role: value }))}
                disabled={isUpdating}
              >
                <SelectTrigger className="bg-slate-700/50 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="franqueado">Franqueado</SelectItem>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                  <SelectItem value="coordenador">Coordenador</SelectItem>
                  <SelectItem value="assessora_adm">Assessora ADM</SelectItem>
                  <SelectItem value="supervisor_adm">Supervisor ADM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleUpdateUser}
                disabled={isUpdating}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
              
              <Button 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isUpdating}
                variant="outline"
                className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 text-white"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
