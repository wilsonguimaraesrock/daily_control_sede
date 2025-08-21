
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  user_id: string;
  name: string;
  role: string;
}

interface AdvancedTaskFiltersProps {
  selectedUser: string;
  onUserChange: (userId: string) => void;
  selectedAccessLevel: string;
  onAccessLevelChange: (level: string) => void;
  selectedPriority: 'all' | 'baixa' | 'media' | 'urgente';
  onPriorityChange: (priority: 'all' | 'baixa' | 'media' | 'urgente') => void;
  userProfiles: any[];
  onClearFilters: () => void;
}

const AdvancedTaskFilters: React.FC<AdvancedTaskFiltersProps> = ({
  selectedUser,
  onUserChange,
  selectedAccessLevel,
  onAccessLevelChange,
  selectedPriority,
  onPriorityChange,
  userProfiles,
  onClearFilters
}) => {
  const { currentUser } = useAuth();

  // 🔍 TESTE BÁSICO - Este log deve aparecer SEMPRE
  console.log('🚀 AdvancedTaskFilters RENDERIZOU!', new Date().toLocaleTimeString());

  // Todos os usuários autenticados podem usar os filtros avançados
  const canUseAdvancedFilters = currentUser && currentUser.role;

  // 🔍 DEBUG: Log filter states for debugging
  console.log('🔍 AdvancedTaskFilters DEBUG:');
  console.log('  👤 Current User:', currentUser?.name, '| Role:', currentUser?.role);
  console.log('  ✅ Can Use Advanced Filters:', canUseAdvancedFilters);
  console.log('  🎯 Selected User:', selectedUser, typeof selectedUser);
  console.log('  📊 Selected Access Level:', selectedAccessLevel, typeof selectedAccessLevel);  
  console.log('  🔥 Selected Priority:', selectedPriority, typeof selectedPriority);
  console.log('  👥 User Profiles Count:', userProfiles?.length || 0);
  if (userProfiles?.length > 0) {
    console.log('  👥 User Profiles:', userProfiles.map(u => `${u.name} (${u.role})`));
    console.log('  🆔 User IDs:', userProfiles.map(u => u.user_id || u.userId || u.id));
  }

  if (!canUseAdvancedFilters) {
    console.log('❌ AdvancedTaskFilters: Cannot use advanced filters');
    return null;
  }

  const accessLevels = [
    { value: 'all', label: 'Todos os Níveis' },
    { value: 'admin', label: 'Administrador' },
    { value: 'franqueado', label: 'Franqueado' },
    { value: 'coordenador', label: 'Coordenador' },
    { value: 'supervisor_adm', label: 'Supervisor ADM' },
    { value: 'assessora_adm', label: 'Assessora ADM' },
    { value: 'assessora', label: 'Assessora' },
    { value: 'estagiario', label: 'Estagiário' },
    { value: 'professor', label: 'Professor' },
    { value: 'vendedor', label: 'Vendedor' }
  ];

  const priorities = [
    { value: 'all', label: 'Todas as Prioridades' },
    { value: 'baixa', label: 'Baixa' },
    { value: 'media', label: 'Média' },
    { value: 'urgente', label: 'Urgente' }
  ];

  const userList = Array.isArray(userProfiles) ? userProfiles.sort((a, b) => a.name.localeCompare(b.name)) : [];

  const hasActiveFilters = selectedUser !== 'all' || selectedAccessLevel !== 'all' || selectedPriority !== 'all';

  return (
    <Card className="mb-4 bg-muted/40 border border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground/80 text-sm font-medium">Filtros Avançados</span>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-muted-foreground text-sm mb-2 block">Filtrar por Usuário Atribuído</Label>
            <Select value={selectedUser || 'all'} onValueChange={onUserChange}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue placeholder="Selecionar usuário atribuído..." />
              </SelectTrigger>
              <SelectContent className="bg-background border-border text-foreground shadow-lg">
                <SelectItem value="all" className="text-foreground hover:bg-accent hover:text-accent-foreground">Todos os usuários</SelectItem>
                {userList.map((user) => (
                  <SelectItem key={user.user_id || user.userId || user.id} value={user.user_id || user.userId || user.id} className="text-foreground hover:bg-accent hover:text-accent-foreground">
                    {user.name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm mb-2 block">Filtrar por Nível de Acesso</Label>
            <Select value={selectedAccessLevel || 'all'} onValueChange={onAccessLevelChange}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue placeholder="Selecionar nível de acesso..." />
              </SelectTrigger>
              <SelectContent className="bg-background border-border text-foreground shadow-lg">
                {accessLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value} className="text-foreground hover:bg-accent hover:text-accent-foreground">
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm mb-2 block">Filtrar por Prioridade</Label>
            <Select value={selectedPriority || 'all'} onValueChange={onPriorityChange}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue placeholder="Selecionar prioridade..." />
              </SelectTrigger>
              <SelectContent className="bg-background border-border text-foreground shadow-lg">
                {priorities.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value} className="text-foreground hover:bg-accent hover:text-accent-foreground">
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedTaskFilters;
