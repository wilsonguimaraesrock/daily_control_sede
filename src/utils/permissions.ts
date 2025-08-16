// ================================
// SISTEMA DE PERMISSÕES MULTI-TENANT
// ================================

import { UserRole, UserPermissions, User, Organization } from '../types/user';

/**
 * Gera senha aleatória de 6 dígitos
 */
export function generateRandomPassword(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Verifica se o usuário é super admin
 */
export function isSuperAdmin(user: User | null): boolean {
  return user?.role === 'super_admin';
}

/**
 * Verifica se o usuário pode acessar múltiplas organizações
 */
export function canAccessMultipleOrganizations(user: User | null): boolean {
  return user?.role === 'super_admin' || user?.role === 'franchise_admin';
}

/**
 * Verifica se o usuário pode editar prazos de tarefas
 */
export function canEditTaskDueDate(user: User | null): boolean {
  if (!user) return false;
  
  const rolesWithDueDateAccess: UserRole[] = [
    'super_admin',
    'franchise_admin',
    'admin',
    'franqueado',
    'gerente_comercial',
    'coordenador',
    'supervisor_adm',
    'departamento_head',
    'departamento_manager'
  ];
  
  return rolesWithDueDateAccess.includes(user.role);
}

/**
 * Verifica se o usuário pode gerenciar outros usuários
 */
export function canManageUsers(user: User | null): boolean {
  if (!user) return false;
  
  const rolesWithUserManagement: UserRole[] = [
    'super_admin',
    'franchise_admin',
    'admin',
    'departamento_head'
  ];
  
  return rolesWithUserManagement.includes(user.role);
}

/**
 * Verifica se o usuário pode resetar senhas
 */
export function canResetPasswords(user: User | null): boolean {
  if (!user) return false;
  
  const rolesWithPasswordReset: UserRole[] = [
    'super_admin',
    'franchise_admin',
    'admin'
  ];
  
  return rolesWithPasswordReset.includes(user.role);
}

/**
 * Verifica se o usuário pode acessar relatórios de múltiplas organizações
 */
export function canViewCrossOrganizationReports(user: User | null): boolean {
  if (!user) return false;
  
  const rolesWithCrossOrgAccess: UserRole[] = [
    'super_admin',
    'franchise_admin',
    'franchise_analyst'
  ];
  
  return rolesWithCrossOrgAccess.includes(user.role);
}

/**
 * Gera permissões completas baseadas no role do usuário
 */
export function generatePermissions(user: User): UserPermissions {
  const role = user.role;
  
  // Super Admin - acesso total
  if (role === 'super_admin') {
    return {
      tasks: {
        create: true,
        edit: true,
        delete: true,
        editDueDate: true,
        viewAll: true,
        viewPrivate: true
      },
      users: {
        create: true,
        edit: true,
        delete: true,
        viewAll: true,
        resetPassword: true
      },
      reports: {
        view: true,
        export: true,
        viewAllOrganizations: true
      },
      organization: {
        manage: true,
        viewSettings: true,
        switchOrganization: true
      }
    };
  }
  
  // Franchise Admin - gerenciamento da franqueadora
  if (role === 'franchise_admin') {
    return {
      tasks: {
        create: true,
        edit: true,
        delete: true,
        editDueDate: true,
        viewAll: true,
        viewPrivate: false
      },
      users: {
        create: true,
        edit: true,
        delete: true,
        viewAll: true,
        resetPassword: true
      },
      reports: {
        view: true,
        export: true,
        viewAllOrganizations: true
      },
      organization: {
        manage: true,
        viewSettings: true,
        switchOrganization: true
      }
    };
  }
  
  // School Admin - administração da escola
  if (role === 'admin') {
    return {
      tasks: {
        create: true,
        edit: true,
        delete: true,
        editDueDate: true,
        viewAll: true,
        viewPrivate: true
      },
      users: {
        create: true,
        edit: true,
        delete: true,
        viewAll: true,
        resetPassword: true
      },
      reports: {
        view: true,
        export: true,
        viewAllOrganizations: false
      },
      organization: {
        manage: false,
        viewSettings: true,
        switchOrganization: false
      }
    };
  }
  
  // Franqueado - quase todos os poderes na escola
  if (role === 'franqueado') {
    return {
      tasks: {
        create: true,
        edit: true,
        delete: true,
        editDueDate: true,
        viewAll: true,
        viewPrivate: true
      },
      users: {
        create: false,
        edit: true,
        delete: false,
        viewAll: true,
        resetPassword: false
      },
      reports: {
        view: true,
        export: true,
        viewAllOrganizations: false
      },
      organization: {
        manage: false,
        viewSettings: true,
        switchOrganization: false
      }
    };
  }
  
  // Gerente Comercial - nova função específica
  if (role === 'gerente_comercial') {
    return {
      tasks: {
        create: true,
        edit: true,
        delete: false,
        editDueDate: true,
        viewAll: true,
        viewPrivate: false
      },
      users: {
        create: false,
        edit: false,
        delete: false,
        viewAll: true,
        resetPassword: false
      },
      reports: {
        view: true,
        export: false,
        viewAllOrganizations: false
      },
      organization: {
        manage: false,
        viewSettings: false,
        switchOrganization: false
      }
    };
  }
  
  // Coordenador - foco pedagógico
  if (role === 'coordenador') {
    return {
      tasks: {
        create: true,
        edit: true,
        delete: false,
        editDueDate: true,
        viewAll: true,
        viewPrivate: false
      },
      users: {
        create: false,
        edit: false,
        delete: false,
        viewAll: true,
        resetPassword: false
      },
      reports: {
        view: true,
        export: false,
        viewAllOrganizations: false
      },
      organization: {
        manage: false,
        viewSettings: false,
        switchOrganization: false
      }
    };
  }
  
  // Supervisor ADM - administração
  if (role === 'supervisor_adm') {
    return {
      tasks: {
        create: true,
        edit: true,
        delete: false,
        editDueDate: true,
        viewAll: true,
        viewPrivate: false
      },
      users: {
        create: false,
        edit: false,
        delete: false,
        viewAll: true,
        resetPassword: false
      },
      reports: {
        view: true,
        export: false,
        viewAllOrganizations: false
      },
      organization: {
        manage: false,
        viewSettings: false,
        switchOrganization: false
      }
    };
  }
  
  // Departamento Head - chefe de departamento
  if (role === 'departamento_head') {
    return {
      tasks: {
        create: true,
        edit: true,
        delete: true,
        editDueDate: true,
        viewAll: true,
        viewPrivate: true
      },
      users: {
        create: true,
        edit: true,
        delete: false,
        viewAll: true,
        resetPassword: false
      },
      reports: {
        view: true,
        export: true,
        viewAllOrganizations: false
      },
      organization: {
        manage: false,
        viewSettings: true,
        switchOrganization: false
      }
    };
  }
  
  // Demais roles - permissões básicas
  return {
    tasks: {
      create: true,
      edit: true,
      delete: false,
      editDueDate: false,
      viewAll: false,
      viewPrivate: false
    },
    users: {
      create: false,
      edit: false,
      delete: false,
      viewAll: false,
      resetPassword: false
    },
    reports: {
      view: false,
      export: false,
      viewAllOrganizations: false
    },
    organization: {
      manage: false,
      viewSettings: false,
      switchOrganization: false
    }
  };
}

/**
 * Obtém título dinâmico baseado na organização
 */
export function getOrganizationTitle(organization: Organization | undefined): string {
  if (!organization) {
    return 'Daily Control - Sistema de Gestão';
  }
  
  const settings = organization.settings;
  if (settings?.branding?.title) {
    return settings.branding.title;
  }
  
  return `Daily Control - ${organization.name}`;
}

/**
 * Obtém cor do role para UI
 */
export function getRoleColor(role: UserRole): string {
  const colorMap: Record<UserRole, string> = {
    'super_admin': 'bg-red-100 text-red-800',
    'franchise_admin': 'bg-purple-100 text-purple-800',
    'franchise_analyst': 'bg-indigo-100 text-indigo-800',
    'admin': 'bg-blue-100 text-blue-800',
    'franqueado': 'bg-green-100 text-green-800',
    'gerente_comercial': 'bg-orange-100 text-orange-800',
    'coordenador': 'bg-teal-100 text-teal-800',
    'supervisor_adm': 'bg-cyan-100 text-cyan-800',
    'assessora_adm': 'bg-pink-100 text-pink-800',
    'vendedor': 'bg-yellow-100 text-yellow-800',
    'professor': 'bg-gray-100 text-gray-800',
    'departamento_head': 'bg-emerald-100 text-emerald-800',
    'departamento_manager': 'bg-lime-100 text-lime-800',
    'departamento_analyst': 'bg-amber-100 text-amber-800',
    'departamento_assistant': 'bg-slate-100 text-slate-800'
  };
  
  return colorMap[role] || 'bg-gray-100 text-gray-800';
}

/**
 * Obtém ícone do role para UI
 */
export function getRoleIcon(role: UserRole): string {
  // Returns class names for lucide-react icons
  const iconMap: Record<UserRole, string> = {
    'super_admin': 'Crown',
    'franchise_admin': 'Shield',
    'franchise_analyst': 'BarChart3',
    'admin': 'Crown',
    'franqueado': 'Shield', 
    'gerente_comercial': 'Briefcase',
    'coordenador': 'UserCheck',
    'supervisor_adm': 'UserCog',
    'assessora_adm': 'FileText',
    'vendedor': 'User',
    'professor': 'GraduationCap',
    'departamento_head': 'Building2',
    'departamento_manager': 'Users',
    'departamento_analyst': 'TrendingUp',
    'departamento_assistant': 'User'
  };
  
  return iconMap[role] || 'User';
}

/**
 * Obtém label amigável do role
 */
export function getRoleLabel(role: UserRole): string {
  const labelMap: Record<UserRole, string> = {
    'super_admin': 'Super Administrador',
    'franchise_admin': 'Admin Franqueadora',
    'franchise_analyst': 'Analista Franqueadora',
    'admin': 'Administrador',
    'franqueado': 'Franqueado',
    'gerente_comercial': 'Gerente Comercial',
    'coordenador': 'Coordenador',
    'supervisor_adm': 'Supervisor ADM',
    'assessora_adm': 'Assessora ADM',
    'vendedor': 'Vendedor',
    'professor': 'Professor',
    'departamento_head': 'Chefe de Departamento',
    'departamento_manager': 'Gerente de Departamento',
    'departamento_analyst': 'Analista de Departamento',
    'departamento_assistant': 'Assistente de Departamento'
  };
  
  return labelMap[role] || role;
}