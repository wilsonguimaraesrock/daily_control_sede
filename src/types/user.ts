// ================================
// MULTI-TENANT USER TYPES
// ================================

export interface Organization {
  id: string;
  name: string;
  code: string;
  type: 'SCHOOL' | 'DEPARTMENT';
  settings: {
    canEditDueDates?: boolean;
    allowPrivateTasks?: boolean;
    branding?: {
      title?: string;
      logo?: string;
    };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  user_id: string;
  organization_id: string;
  name: string;
  email: string;
  role: UserRole;
  custom_permissions?: Record<string, any>;
  is_active: boolean;
  password_hash?: string;
  created_at: Date;
  last_login?: Date;
  first_login_completed?: boolean;
  
  // Relacionamentos
  organization?: Organization;
}

export interface AuthUser {
  id: string;
  email: string;
  organization_id: string;
  role: UserRole;
  organization?: Organization;
}

// ================================
// ROLES SYSTEM
// ================================

export type UserRole = 
  // Global roles
  | 'super_admin'
  | 'franchise_admin' 
  | 'franchise_analyst'
  
  // School roles
  | 'admin'
  | 'franqueado'
  | 'gerente_comercial'  // Nova função
  | 'coordenador'
  | 'supervisor_adm'
  | 'assessora_adm'
  | 'vendedor'
  | 'professor'
  
  // Department roles
  | 'departamento_head'
  | 'departamento_manager'
  | 'departamento_analyst'
  | 'departamento_assistant';

// ================================
// PERMISSIONS SYSTEM
// ================================

export interface UserPermissions {
  tasks: {
    create: boolean;
    edit: boolean;
    delete: boolean;
    editDueDate: boolean;
    viewAll: boolean;
    viewPrivate: boolean;
  };
  users: {
    create: boolean;
    edit: boolean;
    delete: boolean;
    viewAll: boolean;
    resetPassword: boolean;
  };
  reports: {
    view: boolean;
    export: boolean;
    viewAllOrganizations: boolean;
  };
  organization: {
    manage: boolean;
    viewSettings: boolean;
    switchOrganization: boolean;
  };
}

// ================================
// PASSWORD MANAGEMENT
// ================================

export interface PasswordReset {
  id: string;
  userId: string;
  newPassword: string;
  createdBy: string;
  createdAt: Date;
  isUsed: boolean;
}

// ================================
// LEGACY COMPATIBILITY
// ================================

// Manter compatibilidade temporária
export type LegacyRole = 'admin' | 'franqueado' | 'vendedor' | 'professor' | 'coordenador' | 'assessora_adm' | 'supervisor_adm';
