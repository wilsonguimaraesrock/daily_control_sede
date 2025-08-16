// ================================
// SELETOR DE ORGANIZAÇÃO PARA SUPER ADMIN
// ================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Organization } from '../types/user';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Building2, School, Users, Settings } from 'lucide-react';
import { useToast } from './ui/use-toast';

interface OrganizationSelectorProps {
  className?: string;
  showCreateButton?: boolean;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({ 
  className = "",
  showCreateButton = false 
}) => {
  const { 
    currentUser, 
    currentOrganization, 
    canSwitchOrganization, 
    getOrganizations,
    isSuperAdmin
  } = useAuth();
  
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  // Load organizations
  useEffect(() => {
    if (canSwitchOrganization()) {
      loadOrganizations();
    }
  }, []);

  // Update selected when current organization changes
  useEffect(() => {
    if (currentOrganization) {
      setSelectedOrgId(currentOrganization.id);
    }
  }, [currentOrganization]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const orgs = await getOrganizations();
      setOrganizations(orgs);
    } catch (error) {
      console.error('Error loading organizations:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar organizações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationChange = async (orgId: string) => {
    try {
      setLoading(true);
      
      // Switch organization logic here (would need to be implemented)
      // For now, just update the selected value and show success
      setSelectedOrgId(orgId);
      
      const org = organizations.find(o => o.id === orgId);
      
      toast({
        title: "Organização alterada",
        description: `Agora visualizando: ${org?.name}`,
      });
      
      // Reload page to update context
      window.location.reload();
      
    } catch (error) {
      console.error('Error switching organization:', error);
      toast({
        title: "Erro",
        description: "Erro ao trocar organização",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getOrganizationIcon = (type: string) => {
    switch (type) {
      case 'SCHOOL':
        return <School className="h-4 w-4" />;
      case 'DEPARTMENT':
        return <Building2 className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getOrganizationBadgeColor = (type: string) => {
    switch (type) {
      case 'SCHOOL':
        return 'bg-blue-100 text-blue-800';
      case 'DEPARTMENT':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Only show for users who can switch organizations
  if (!canSwitchOrganization()) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Current Organization Info */}
      {currentOrganization && (
        <div className="hidden md:flex items-center gap-2">
          {getOrganizationIcon(currentOrganization.type)}
          <span className="text-sm font-medium text-muted-foreground">
            {currentOrganization.name}
          </span>
          <Badge 
            variant="secondary" 
            className={getOrganizationBadgeColor(currentOrganization.type)}
          >
            {currentOrganization.type === 'SCHOOL' ? 'Escola' : 'Departamento'}
          </Badge>
        </div>
      )}

      {/* Organization Selector */}
      <Select 
        value={selectedOrgId} 
        onValueChange={handleOrganizationChange}
        disabled={loading}
      >
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Selecionar organização..." />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              <div className="flex items-center gap-2">
                {getOrganizationIcon(org.type)}
                <span>{org.name}</span>
                <Badge 
                  variant="outline" 
                  className={`ml-auto ${getOrganizationBadgeColor(org.type)}`}
                >
                  {org.code}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Create Organization Button (for super admin) */}
      {showCreateButton && isSuperAdmin() && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            // TODO: Open create organization modal
            toast({
              title: "Criar Organização",
              description: "Funcionalidade em desenvolvimento",
            });
          }}
        >
          <Settings className="h-4 w-4 mr-2" />
          Nova Organização
        </Button>
      )}

      {/* Stats */}
      {isSuperAdmin() && organizations.length > 0 && (
        <div className="hidden lg:flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {organizations.filter(o => o.type === 'SCHOOL').length} escolas
          </span>
          <span>
            {organizations.filter(o => o.type === 'DEPARTMENT').length} departamentos
          </span>
        </div>
      )}
    </div>
  );
};

// ================================
// ORGANIZATION STATS WIDGET
// ================================

interface OrganizationStatsProps {
  className?: string;
}

export const OrganizationStats: React.FC<OrganizationStatsProps> = ({ 
  className = "" 
}) => {
  const { currentOrganization, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (currentOrganization) {
      // TODO: Load organization stats
      setStats({
        totalUsers: 12,
        activeTasks: 8,
        completedTasks: 45,
        pendingTasks: 3
      });
    }
  }, [currentOrganization]);

  if (!currentOrganization || !stats) {
    return null;
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      <div className="bg-card rounded-lg p-4 border">
        <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
        <div className="text-sm text-muted-foreground">Usuários</div>
      </div>
      
      <div className="bg-card rounded-lg p-4 border">
        <div className="text-2xl font-bold text-orange-600">{stats.activeTasks}</div>
        <div className="text-sm text-muted-foreground">Tarefas Ativas</div>
      </div>
      
      <div className="bg-card rounded-lg p-4 border">
        <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
        <div className="text-sm text-muted-foreground">Concluídas</div>
      </div>
      
      <div className="bg-card rounded-lg p-4 border">
        <div className="text-2xl font-bold text-red-600">{stats.pendingTasks}</div>
        <div className="text-sm text-muted-foreground">Pendentes</div>
      </div>
    </div>
  );
};