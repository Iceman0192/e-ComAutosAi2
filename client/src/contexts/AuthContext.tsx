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
  isLoggedIn: boolean;
  hasPermission: (permission: Permission) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
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
      const response = await apiRequest('GET', '/api/auth/me');
      const data = await response.json();
      if (data.success && data.user) {
        setUser({
          id: data.user.id.toString(),
          email: data.user.email,
          name: data.user.name,
          role: data.user.role as UserRole,
          subscriptionStatus: 'active',
          joinDate: data.user.createdAt
        });
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    const response = await apiRequest('POST', '/api/auth/login', { email, password });
    const data = await response.json();
    if (data.success) {
      await fetchCurrentUser();
    } else {
      throw new Error(data.message || 'Login failed');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiRequest('POST', '/api/auth/logout');
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