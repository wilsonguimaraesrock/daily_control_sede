// ================================
// CONTEXTO DE ORGANIZAÇÃO MULTI-TENANT
// ================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Organization, User } from '../types/user';

// API Base URL - Auto-detection for Vercel production
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return window.location.origin;
  }
  return 'http://localhost:3001';
};
const API_BASE_URL = getApiBaseUrl();

interface OrganizationContextType {
  currentOrganization: Organization | null;
  availableOrganizations: Organization[];
  switchOrganization: (organizationId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
  loading: boolean;
  canSwitchOrganization: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

interface OrganizationProviderProps {
  children: ReactNode;
  currentUser: User | null;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ 
  children, 
  currentUser 
}) => {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [availableOrganizations, setAvailableOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);

  // Verifica se o usuário pode trocar de organização
  const canSwitchOrganization = currentUser?.role === 'super_admin' || 
                                currentUser?.role === 'franchise_admin';

  // Carrega organizações disponíveis
  const loadOrganizations = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/organizations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const orgs = await response.json();
        setAvailableOrganizations(orgs);
        
        // Se o usuário tem uma organização definida e ainda não temos uma atual
        if (currentUser.organization_id && !currentOrganization) {
          const userOrg = orgs.find((org: Organization) => org.id === currentUser.organization_id);
          if (userOrg) {
            setCurrentOrganization(userOrg);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar organizações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Trocar organização (apenas para super_admin e franchise_admin)
  const switchOrganization = async (organizationId: string) => {
    if (!canSwitchOrganization) {
      throw new Error('Usuário não tem permissão para trocar de organização');
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/organizations/switch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ organizationId })
      });

      if (response.ok) {
        const org = availableOrganizations.find(o => o.id === organizationId);
        if (org) {
          setCurrentOrganization(org);
          
          // Atualizar título da página
          document.title = org.settings?.branding?.title || `Daily Control - ${org.name}`;
          
          // Salvar no localStorage para persistir
          localStorage.setItem('current_organization_id', organizationId);
        }
      } else {
        throw new Error('Erro ao trocar organização');
      }
    } catch (error) {
      console.error('Erro ao trocar organização:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar organizações
  const refreshOrganizations = async () => {
    await loadOrganizations();
  };

  // Carregar organizações quando o usuário mudar
  useEffect(() => {
    if (currentUser) {
      loadOrganizations();
    } else {
      setCurrentOrganization(null);
      setAvailableOrganizations([]);
    }
  }, [currentUser]);

  // Restaurar organização do localStorage
  useEffect(() => {
    if (currentUser && canSwitchOrganization) {
      const savedOrgId = localStorage.getItem('current_organization_id');
      if (savedOrgId && availableOrganizations.length > 0) {
        const savedOrg = availableOrganizations.find(org => org.id === savedOrgId);
        if (savedOrg && (!currentOrganization || currentOrganization.id !== savedOrgId)) {
          setCurrentOrganization(savedOrg);
        }
      }
    }
  }, [availableOrganizations, canSwitchOrganization]);

  const value: OrganizationContextType = {
    currentOrganization,
    availableOrganizations,
    switchOrganization,
    refreshOrganizations,
    loading,
    canSwitchOrganization
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};