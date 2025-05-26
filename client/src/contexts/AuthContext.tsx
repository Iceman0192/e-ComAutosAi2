import { createContext, useContext, useState, ReactNode } from 'react';

// User roles for tier-based access
export enum UserRole {
  FREE = 'free',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  ADMIN = 'admin'
}

// Feature permissions mapping
export const PERMISSIONS = {
  BASIC_SEARCH: [UserRole.FREE, UserRole.GOLD, UserRole.PLATINUM, UserRole.ADMIN],
  ADVANCED_FILTERS: [UserRole.GOLD, UserRole.PLATINUM, UserRole.ADMIN],
  UNLIMITED_RESULTS: [UserRole.PLATINUM, UserRole.ADMIN],
  FULL_ANALYTICS: [UserRole.GOLD, UserRole.PLATINUM, UserRole.ADMIN],
  EXPORT_DATA: [UserRole.PLATINUM, UserRole.ADMIN],
  ADMIN_TOOLS: [UserRole.ADMIN],
  MULTIPLE_DAMAGE_TYPES: [UserRole.GOLD, UserRole.PLATINUM, UserRole.ADMIN],
  CROSS_PLATFORM_SEARCH: [UserRole.PLATINUM, UserRole.ADMIN]
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

// Demo user for development - replace with real auth later
const DEMO_USER: User = {
  id: 'demo-admin-1',
  email: 'admin@ecomautos.com',
  name: 'Admin User',
  role: UserRole.ADMIN,
  subscriptionStatus: 'active',
  joinDate: '2025-01-01'
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // For now, start with demo admin user - replace with real auth system later
  const [user, setUser] = useState<User | null>(DEMO_USER);

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return PERMISSIONS[permission].includes(user.role);
  };

  const login = async (email: string, password: string): Promise<void> => {
    // Placeholder for real authentication
    console.log('Login attempt:', email);
    setUser(DEMO_USER);
  };

  const logout = (): void => {
    setUser(null);
  };

  const updateUserRole = (role: UserRole): void => {
    if (user) {
      setUser({ ...user, role });
    }
  };

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