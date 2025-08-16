import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Users, LogOut, Bell, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import UserManagement from '@/components/UserManagement';
import TaskManager from '@/components/TaskManager';
import UserHeader from '@/components/UserHeader';
import NotificationTestPanel from '@/components/NotificationTestPanel';
import { FranchiseAdminDashboard } from '@/components/FranchiseAdminDashboard';

const Index = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const { currentUser, logout, canAccessUserManagement, isSuperAdmin } = useAuth();
  
  // Check if user can access franchise dashboard
  // Temporary: Use admin role + specific email until PostgreSQL migration
  const canAccessFranchise = (
    currentUser?.role === 'admin' && 
    currentUser?.email === 'wadevenga@hotmail.com'
  ) || isSuperAdmin() || currentUser?.role === 'franchise_admin';

  const handleLogout = async () => {
    await logout();
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="h-screen w-full bg-background text-foreground overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <UserHeader />
        
        <div className="mb-6" />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${
            canAccessFranchise && canAccessUserManagement() ? 'grid-cols-4' :
            canAccessFranchise || canAccessUserManagement() ? 'grid-cols-3' : 'grid-cols-2'
          } bg-muted border border-border`}>
            <TabsTrigger 
              value="tasks" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Calendar className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Tarefas</span>
              <span className="sm:hidden">Tarefas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Bell className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Notificações</span>
              <span className="sm:hidden">Notific.</span>
            </TabsTrigger>
            {canAccessUserManagement() && (
              <TabsTrigger 
                value="users" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Usuários</span>
                <span className="sm:hidden">Usuários</span>
              </TabsTrigger>
            )}
            {canAccessFranchise && (
              <TabsTrigger 
                value="franchise" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Building2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Franqueadora</span>
                <span className="sm:hidden">Franq.</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="tasks" className="space-y-6">
            <TaskManager />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationTestPanel />
          </TabsContent>

          {canAccessUserManagement() && (
            <TabsContent value="users" className="space-y-6">
              <Card className="bg-card backdrop-blur-sm border border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Gerenciar Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserManagement />
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          {canAccessFranchise && (
            <TabsContent value="franchise" className="space-y-6">
              <FranchiseAdminDashboard />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
