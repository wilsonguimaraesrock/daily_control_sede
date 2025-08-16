import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthUser, UserRole, Organization, UserPermissions, PasswordReset } from '../types/user';
import { generatePermissions, canEditTaskDueDate as canEditDueDate, canManageUsers, isSuperAdmin as checkSuperAdmin, generateRandomPassword } from '../utils/permissions';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  needsPasswordChange: boolean;
  
  // ===== LEGACY COMPATIBILITY =====
  canAccessUserManagement: () => boolean;
  changePassword: (newPassword: string) => Promise<void>;
  firstTimePasswordChange: (newPassword: string) => Promise<void>;
  createUser: (userData: any) => Promise<void>;
  updateUser: (userId: string, userData: any) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getVisibleUsers: () => Promise<User[]>;
  resendTemporaryPassword: (email: string) => Promise<void>;
  canEditTaskDueDate: () => boolean;
  
  // ===== MULTI-TENANT FEATURES =====
  currentOrganization: Organization | null;
  userPermissions: UserPermissions | null;
  isSuperAdmin: () => boolean;
  canSwitchOrganization: () => boolean;
  
  // Password Management
  generateTemporaryPassword: (userId: string) => Promise<PasswordReset>;
  resetUserPassword: (userId: string) => Promise<PasswordReset>;
  
  // Organization Management  
  getOrganizations: () => Promise<Organization[]>;
  createOrganization: (orgData: Partial<Organization>) => Promise<Organization>;
  updateOrganization: (orgId: string, orgData: Partial<Organization>) => Promise<Organization>;
  deleteOrganization: (orgId: string) => Promise<{ message: string; deletedOrganization: any }>;
  
  // Enhanced User Management
  createUserInOrganization: (userData: Partial<User>, organizationId?: string) => Promise<User>;
  getUsersInOrganization: (organizationId?: string) => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Auth Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  
  // ===== MULTI-TENANT STATE =====
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);

  // Initialize auth state
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Update permissions when user changes
  useEffect(() => {
    if (currentUser) {
      const permissions = generatePermissions(currentUser);
      setUserPermissions(permissions);
      
      // Load user's organization if not loaded
      if (currentUser.organization_id && !currentOrganization) {
        loadUserOrganization(currentUser.organization_id);
      }
    } else {
      setUserPermissions(null);
      setCurrentOrganization(null);
    }
  }, [currentUser]);

  // ========================================
  // CORE AUTH FUNCTIONS
  // ========================================

  const fetchCurrentUser = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const user = await response.json();
        setCurrentUser(user);
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const loadUserOrganization = async (organizationId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/organizations/${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const organization = await response.json();
        setCurrentOrganization(organization);
        
        // Update page title
        if (organization.settings?.branding?.title) {
          document.title = organization.settings.branding.title;
        }
      }
    } catch (error) {
      console.error('Error loading organization:', error);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const { user, token, organization } = await response.json();
    localStorage.setItem('auth_token', token);
    setCurrentUser(user);
    
    if (organization) {
      setCurrentOrganization(organization);
    }
  };

  const logout = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_organization_id');
    setCurrentUser(null);
    setCurrentOrganization(null);
    setUserPermissions(null);
    setNeedsPasswordChange(false);
  };

  // ========================================
  // PASSWORD MANAGEMENT
  // ========================================

  const changePassword = async (newPassword: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ newPassword })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Password change failed');
    }

    setNeedsPasswordChange(false);
  };

  const firstTimePasswordChange = async (newPassword: string) => {
    await changePassword(newPassword);
  };

  const generateTemporaryPassword = async (userId: string): Promise<PasswordReset> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const tempPassword = generateRandomPassword();
    
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/reset-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ temporaryPassword: tempPassword })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Password reset failed');
    }

    return response.json();
  };

  const resetUserPassword = async (userId: string): Promise<PasswordReset> => {
    return generateTemporaryPassword(userId);
  };

  // ========================================
  // USER MANAGEMENT
  // ========================================

  const createUser = async (userData: any) => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    // Add current organization if not specified and user is not super admin
    if (!userData.organization_id && currentUser && !checkSuperAdmin(currentUser)) {
      userData.organization_id = currentUser.organization_id;
    }

    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'User creation failed');
    }

    return response.json();
  };

  const createUserInOrganization = async (userData: Partial<User>, organizationId?: string): Promise<User> => {
    const orgId = organizationId || currentUser?.organization_id;
    if (!orgId) throw new Error('Organization ID required');

    return createUser({ ...userData, organization_id: orgId });
  };

  const updateUser = async (userId: string, userData: any) => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'User update failed');
    }

    return response.json();
  };

  const deleteUser = async (userId: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'User deletion failed');
    }

    return true;
  };

  const getVisibleUsers = async (): Promise<User[]> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch users');
    }

    return response.json();
  };

  const getUsersInOrganization = async (organizationId?: string): Promise<User[]> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const orgId = organizationId || currentUser?.organization_id;
    const url = orgId ? 
      `${API_BASE_URL}/api/organizations/${orgId}/users` : 
      `${API_BASE_URL}/api/users`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch users');
    }

    return response.json();
  };

  // ========================================
  // ORGANIZATION MANAGEMENT
  // ========================================

  const getOrganizations = async (): Promise<Organization[]> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/api/organizations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch organizations');
    }

    return response.json();
  };

  const createOrganization = async (orgData: Partial<Organization>): Promise<Organization> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/api/organizations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orgData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Organization creation failed');
    }

    return response.json();
  };

  const updateOrganization = async (orgId: string, orgData: Partial<Organization>): Promise<Organization> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/api/organizations/${orgId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orgData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Organization update failed');
    }

    return response.json();
  };

  const deleteOrganization = async (orgId: string): Promise<{ message: string; deletedOrganization: any }> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/api/organizations/${orgId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Organization deletion failed');
    }

    return response.json();
  };

  // ========================================
  // PERMISSION HELPERS
  // ========================================

  const canAccessUserManagement = () => {
    return currentUser ? canManageUsers(currentUser) : false;
  };

  const canEditTaskDueDate = () => {
    return currentUser ? canEditDueDate(currentUser) : false;
  };

  const isSuperAdmin = () => {
    return currentUser ? checkSuperAdmin(currentUser) : false;
  };

  const canSwitchOrganization = () => {
    return currentUser?.role === 'super_admin' || currentUser?.role === 'franchise_admin';
  };

  // ========================================
  // LEGACY COMPATIBILITY
  // ========================================

  const resendTemporaryPassword = async (email: string) => {
    console.log('Resend temporary password for:', email);
    // TODO: Implement if needed
  };

  // ========================================
  // CONTEXT VALUE
  // ========================================

  const value: AuthContextType = {
    currentUser,
    login,
    logout,
    loading,
    needsPasswordChange,
    
    // Legacy compatibility
    canAccessUserManagement,
    changePassword,
    firstTimePasswordChange,
    createUser,
    updateUser,
    deleteUser,
    getVisibleUsers,
    resendTemporaryPassword,
    canEditTaskDueDate,
    
    // Multi-tenant features
    currentOrganization,
    userPermissions,
    isSuperAdmin,
    canSwitchOrganization,
    
    // Password management
    generateTemporaryPassword,
    resetUserPassword,
    
    // Organization management
    getOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    
    // Enhanced user management
    createUserInOrganization,
    getUsersInOrganization
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};