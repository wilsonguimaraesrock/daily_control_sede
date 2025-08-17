// ================================
// PAINEL DE ADMINISTRAÇÃO DA FRANQUEADORA
// ================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Organization, User } from '../types/user';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { OrganizationSelector } from './OrganizationSelector';
import { PasswordManagement } from './PasswordManagement';
import { SchoolManagement } from './SchoolManagement';
import { useToast } from './ui/use-toast';
import { 
  Building2, 
  School, 
  Users, 
  TrendingUp, 
  Activity, 
  AlertCircle,
  Plus,
  Settings,
  BarChart3,
  FileText,
  Shield
} from 'lucide-react';

// API Base URL - Auto-detection for Vercel production
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return window.location.origin;
  }
  return 'http://localhost:3001';
};
const API_BASE_URL = getApiBaseUrl();

interface FranchiseStats {
  totalSchools: number;
  totalUsers: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  schoolsWithIssues: number;
}

export const FranchiseAdminDashboard: React.FC = () => {
  const { 
    currentUser, 
    isSuperAdmin, 
    canSwitchOrganization,
    getOrganizations,
    getUsersInOrganization 
  } = useAuth();
  
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<FranchiseStats>({
    totalSchools: 0,
    totalUsers: 0,
    activeTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    schoolsWithIssues: 0
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);

  // Only show for PD&I organization users with proper roles
  const canAccessFranchise = (
    currentUser?.organization_id === 'pdi-tech-001' && 
    (currentUser?.role === 'super_admin' || currentUser?.role === 'franchise_admin' || currentUser?.role === 'admin')
  ) || isSuperAdmin();
  
  if (!canAccessFranchise) {
    return null;
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Loading real multi-tenant data...');
      
      // Load organizations from real API
      const orgs = await getOrganizations();
      setOrganizations(orgs);
      
      // Calculate stats
      const schools = orgs.filter(org => org.type === 'SCHOOL');
      const departments = orgs.filter(org => org.type === 'DEPARTMENT');
      
      // Load users from all organizations
      let totalUsers = 0;
      let allUsers: User[] = [];
      
      for (const org of orgs) {
        try {
          const orgUsers = await getUsersInOrganization(org.id);
          totalUsers += orgUsers.length;
          allUsers = [...allUsers, ...orgUsers];
        } catch (error) {
          console.error(`Error loading users for org ${org.name}:`, error);
        }
      }
      
      // Get recent users (last 10)
      const recentUsersList = allUsers
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
      
      setRecentUsers(recentUsersList);
      
      // Load real statistics from API
      const statsResponse = await fetch(`${API_BASE_URL}/api/stats/organizations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!statsResponse.ok) {
        throw new Error('Failed to load statistics');
      }

      const statsData = await statsResponse.json();
      
      const realStats: FranchiseStats = {
        totalSchools: statsData.global.totalSchools,
        totalUsers: statsData.global.totalUsers,
        activeTasks: statsData.global.activeTasks,
        completedTasks: statsData.global.completedTasks,
        overdueTasks: statsData.global.overdueTasks,
        completionRate: statsData.global.completionRate,
        schoolsWithIssues: statsData.global.schoolsWithIssues
      };
      
      setStats(realStats);
      
      console.log('✅ Real data loaded successfully');
      console.log(`📊 Organizations: ${orgs.length}, Users: ${totalUsers}`);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Administração Franqueadora
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <OrganizationSelector showCreateButton={true} />
          
          <Button
            onClick={loadDashboardData}
            disabled={loading}
            variant="outline"
          >
            <Activity className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escolas Ativas</CardTitle>
            <School className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSchools}</div>
            <p className="text-xs text-muted-foreground">
              +2 novas este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Ativos em todas as escolas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Média geral das escolas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="schools">
            <School className="h-4 w-4 mr-2" />
            Gerenciar Escolas
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="h-4 w-4 mr-2" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Organizations List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organizações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {organizations.map((org) => (
                    <div key={org.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {org.type === 'SCHOOL' ? 
                          <School className="h-5 w-5 text-blue-600" /> : 
                          <Building2 className="h-5 w-5 text-green-600" />
                        }
                        <div>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-muted-foreground">{org.code}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={org.type === 'SCHOOL' ? 'default' : 'secondary'}>
                          {org.type === 'SCHOOL' ? 'Escola' : 'Departamento'}
                        </Badge>
                        <Badge variant={org.isActive ? 'default' : 'destructive'}>
                          {org.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usuários Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentUsers.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Schools Management Tab */}
        <TabsContent value="schools">
          <SchoolManagement />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Usuários por Escola</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Funcionalidade em desenvolvimento
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios e Indicadores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Dashboard de relatórios em desenvolvimento
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};