import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';

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
  EXPORT_DATA: [UserRole.BASIC, UserRole.GOLD, UserRole.PLATINUM, UserRole.ADMIN],
  ADMIN_TOOLS: [UserRole.ADMIN],
  MULTIPLE_DAMAGE_TYPES: [UserRole.GOLD, UserRole.PLATINUM, UserRole.ADMIN],
  CROSS_PLATFORM_SEARCH: [UserRole.GOLD, UserRole.PLATINUM, UserRole.ADMIN],
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
  isLoading: boolean;
  hasPermission: (permission: Permission) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Demo user for development - replace with real auth later
const DEMO_USER: User = {
  id: 'demo-admin-1',
  email: 'admin@ecomautos.com',
  name: 'God Level Admin',
  role: UserRole.ADMIN,
  subscriptionStatus: 'active',
  joinDate: '2025-01-01'
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            // Map backend user data to frontend User interface
            setUser({
              id: data.user.id.toString(),
              email: data.user.email,
              name: data.user.name || data.user.username,
              role: mapBackendRoleToUserRole(data.user.role),
              subscriptionStatus: 'active', // Default for now
              joinDate: new Date().toISOString()
            });
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const mapBackendRoleToUserRole = (backendRole: string): UserRole => {
    switch (backendRole) {
      case 'admin':
        return UserRole.ADMIN;
      case 'gold':
        return UserRole.GOLD;
      case 'platinum':
        return UserRole.PLATINUM;
      case 'basic':
        return UserRole.BASIC;
      case 'freemium':
      default:
        return UserRole.FREEMIUM;
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return (PERMISSIONS[permission] as UserRole[]).includes(user.role);
  };

  const login = async (email: string, password: string): Promise<void> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Login failed');
    }

    // Update user state with logged in user
    setUser({
      id: data.user.id.toString(),
      email: data.user.email,
      name: data.user.name || data.user.username,
      role: mapBackendRoleToUserRole(data.user.role),
      subscriptionStatus: 'active',
      joinDate: new Date().toISOString()
    });
  };

  // Add refresh function to re-fetch user data
  const refreshUser = async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser({
            id: data.user.id.toString(),
            email: data.user.email,
            name: data.user.name || data.user.username,
            role: mapBackendRoleToUserRole(data.user.role),
            subscriptionStatus: 'active',
            joinDate: new Date().toISOString()
          });
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Refresh user failed:', error);
      setUser(null);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear user state
      setUser(null);
      
      // Redirect to auth page
      setLocation('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear user state even if logout fails
      setUser(null);
      setLocation('/auth');
    }
  };

  const updateUserRole = (role: UserRole): void => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    isLoading,
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