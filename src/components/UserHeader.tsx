import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Crown, Shield, User, GraduationCap, UserCheck, FileText, UserCog, Building2, School, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { OrganizationSelector } from './OrganizationSelector';
import NotificationCenter from './NotificationCenter';
import UserProfile from './UserProfile';
import Logo from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { getRoleIcon, getRoleColor, getRoleLabel, getOrganizationTitle } from '@/utils/permissions';

const UserHeader: React.FC = () => {
  const { currentUser, currentOrganization, isSuperAdmin, canSwitchOrganization, logout } = useAuth();

  if (!currentUser) return null;

  // Dynamic title based on organization
  const pageTitle = getOrganizationTitle(currentOrganization);
  
  // Show franchise dashboard link only for PD&I organization
  const showFranchiseAccess = (
    currentUser.organization_id === 'pdi-tech-001' && 
    (currentUser.role === 'super_admin' || currentUser.role === 'franchise_admin' || currentUser.role === 'admin')
  ) || isSuperAdmin();

  return (
    <Card className="mb-6 border bg-primary text-primary-foreground border-primary/20">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Main Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="h-12">
                <Logo size="xs" variant="icon" className="w-24 h-12" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary-foreground dark:text-white">
                  {pageTitle}
                </h1>
                {currentOrganization && (
                  <div className="flex items-center gap-2 mt-1">
                    {currentOrganization.type === 'SCHOOL' ? 
                      <School className="h-4 w-4" /> : 
                      <Building2 className="h-4 w-4" />
                    }
                    <span className="text-sm opacity-80 text-primary-foreground dark:text-white">
                      {currentOrganization.name} ({currentOrganization.code})
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* User Profile - TESTE */}
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-primary-foreground hover:bg-white/10 dark:text-white dark:hover:bg-slate-700/50"
                onClick={() => alert('Teste: Perfil clicado!')}
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{currentUser.name}</span>
              </Button>
              
              <ThemeToggle />
              <NotificationCenter />
              
              {/* Franchise Access */}
              {showFranchiseAccess && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-orange-500/10 border-orange-500/20 text-orange-100 hover:bg-orange-500/20"
                  onClick={() => {
                    // TODO: Navigate to franchise dashboard
                    alert('Painel da Franqueadora em desenvolvimento');
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Franqueadora
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20 dark:bg-slate-700/50 dark:border-slate-600 dark:hover:bg-slate-600/50 dark:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
          

        </div>
      </CardContent>
    </Card>
  );
};

export default UserHeader;
