import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Types
interface User {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
}

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  needsPasswordChange: boolean;
  canAccessUserManagement: () => boolean;
  changePassword: (newPassword: string) => Promise<void>;
  firstTimePasswordChange: (newPassword: string) => Promise<void>;
  createUser: (userData: any) => Promise<void>;
  updateUser: (userId: string, userData: any) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getVisibleUsers: () => Promise<User[]>;
  resendTemporaryPassword: (email: string) => Promise<void>;
  canEditTaskDueDate: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Auth Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Verify token and get user data
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, []);

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

    const { user, token } = await response.json();
    localStorage.setItem('auth_token', token);
    setCurrentUser(user);
  };

  const logout = async () => {
    localStorage.removeItem('auth_token');
    setCurrentUser(null);
    setNeedsPasswordChange(false);
  };

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
  };

  const firstTimePasswordChange = async (newPassword: string) => {
    await changePassword(newPassword);
    setNeedsPasswordChange(false);
  };

  const createUser = async (userData: any) => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
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

  const resendTemporaryPassword = async (email: string) => {
    // Implement if needed
    console.log('Resend temporary password for:', email);
  };

  const canAccessUserManagement = () => {
    return currentUser?.role === 'admin';
  };

  const canEditTaskDueDate = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'franqueado';
  };

  const value = {
    currentUser,
    login,
    logout,
    loading,
    needsPasswordChange,
    canAccessUserManagement,
    changePassword,
    firstTimePasswordChange,
    createUser,
    updateUser,
    deleteUser,
    getVisibleUsers,
    resendTemporaryPassword,
    canEditTaskDueDate
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