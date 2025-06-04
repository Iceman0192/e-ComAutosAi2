import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

// User roles for tier-based access
export enum UserRole {
  FREEMIUM = 'freemium',
  BASIC = 'basic',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  ADMIN = 'admin'
}

// Feature permissions mapping
export const PERMISSIONS = {
  BASIC_SEARCH: [UserRole.FREEMIUM, UserRole.BASIC, UserRole.GOLD, UserRole.PLATINUM, UserRole.ADMIN],
  ADVANCED_FILTERS: [UserRole.BASIC, UserRole.GOLD, UserRole.PLATINUM, UserRole.ADMIN],
  UNLIMITED_RESULTS: [UserRole.PLATINUM, UserRole.ADMIN],
  FULL_ANALYTICS: [UserRole.GOLD, UserRole.PLATINUM, UserRole.ADMIN],
  EXPORT_DATA: [UserRole.PLATINUM, UserRole.ADMIN],
  ADMIN_TOOLS: [UserRole.ADMIN],
  MULTIPLE_DAMAGE_TYPES: [UserRole.GOLD, UserRole.PLATINUM, UserRole.ADMIN],
  CROSS_PLATFORM_SEARCH: [UserRole.PLATINUM, UserRole.ADMIN],
  AI_ANALYSIS: [UserRole.GOLD, UserRole.PLATINUM, UserRole.ADMIN]
} as const;

export type Permission = keyof typeof PERMISSIONS;

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  joinDate: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  hasPermission: (permission: Permission) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return PERMISSIONS[permission].includes(user.role);
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success && data.data?.user) {
        setUser({
          id: data.data.user.id.toString(),
          email: data.data.user.email,
          name: data.data.user.name,
          role: data.data.user.role as UserRole,
          subscriptionStatus: 'active',
          joinDate: data.data.user.createdAt || new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (data.success) {
      await fetchCurrentUser();
    } else {
      throw new Error(data.message || 'Login failed');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const updateUserRole = (role: UserRole): void => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isLoggedIn: !!user,
    hasPermission,
    login,
    logout,
    updateUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}