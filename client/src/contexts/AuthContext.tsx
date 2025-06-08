import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';

// User roles for tier-based access
export enum UserRole {
  FREE = 'free',
  BASIC = 'basic',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  ENTERPRISE = 'enterprise',
  ADMIN = 'admin'
}

// Plan limits and permissions
export const PLAN_LIMITS = {
  [UserRole.FREE]: {
    dailySearches: 10,
    monthlyVinLookups: 5,
    monthlyExports: 10,
    searchResultsPerPage: 25,
    features: ['basic_search', 'basic_filters', 'community_support']
  },
  [UserRole.BASIC]: {
    dailySearches: 100,
    monthlyVinLookups: 25,
    monthlyExports: 100,
    searchResultsPerPage: 50,
    features: ['basic_search', 'basic_filters', 'email_support', 'mobile_app', 'basic_analytics']
  },
  [UserRole.GOLD]: {
    dailySearches: 200,
    monthlyVinLookups: 100,
    monthlyExports: 500,
    searchResultsPerPage: 100,
    features: ['basic_search', 'advanced_filters', 'cross_platform_search', 'advanced_analytics', 'priority_support', 'bulk_export', 'real_time_alerts']
  },
  [UserRole.PLATINUM]: {
    dailySearches: -1,
    monthlyVinLookups: -1,
    monthlyExports: -1,
    searchResultsPerPage: 200,
    features: ['all_features', 'auction_mind_pro', 'market_intelligence', 'custom_reports', 'premium_support']
  },
  [UserRole.ENTERPRISE]: {
    dailySearches: -1,
    monthlyVinLookups: -1,
    monthlyExports: -1,
    searchResultsPerPage: 500,
    features: ['all_features', 'team_collaboration', 'enterprise_security', 'dedicated_support', 'team_management', 'priority_processing']
  },
  [UserRole.ADMIN]: {
    dailySearches: -1,
    monthlyVinLookups: -1,
    monthlyExports: -1,
    searchResultsPerPage: 1000,
    features: ['all_features', 'admin_tools', 'data_collection_management', 'user_management', 'system_monitoring']
  }
} as const;

// Feature permissions mapping
export const PERMISSIONS = {
  BASIC_SEARCH: [UserRole.FREE, UserRole.BASIC, UserRole.GOLD, UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  BASIC_FILTERS: [UserRole.FREE, UserRole.BASIC, UserRole.GOLD, UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  ADVANCED_FILTERS: [UserRole.GOLD, UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  BASIC_ANALYTICS: [UserRole.BASIC, UserRole.GOLD, UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  EMAIL_SUPPORT: [UserRole.BASIC, UserRole.GOLD, UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  CROSS_PLATFORM_SEARCH: [UserRole.GOLD, UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  ADVANCED_ANALYTICS: [UserRole.GOLD, UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  BULK_EXPORT: [UserRole.GOLD, UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  REAL_TIME_ALERTS: [UserRole.GOLD, UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  PRIORITY_SUPPORT: [UserRole.GOLD, UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  UNLIMITED_SEARCHES: [UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  AUCTION_MIND_PRO: [UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  MARKET_INTELLIGENCE: [UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  API_ACCESS: [UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  CUSTOM_REPORTS: [UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  WHITE_GLOVE_SUPPORT: [UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  TEAM_COLLABORATION: [UserRole.ENTERPRISE, UserRole.ADMIN],
  ENTERPRISE_SECURITY: [UserRole.ENTERPRISE, UserRole.ADMIN],
  TEAM_MANAGEMENT: [UserRole.ENTERPRISE, UserRole.ADMIN],
  PRIORITY_PROCESSING: [UserRole.ENTERPRISE, UserRole.ADMIN],
  ADMIN_TOOLS: [UserRole.ADMIN],
  DATA_COLLECTION_MANAGEMENT: [UserRole.ADMIN],
  USER_MANAGEMENT: [UserRole.ADMIN],
  SYSTEM_MONITORING: [UserRole.ADMIN]
};

export type Permission = keyof typeof PERMISSIONS;

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  joinDate: string;
  usage: {
    dailySearches: number;
    monthlyVinLookups: number;
    monthlyExports: number;
    lastResetDate: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  hasPermission: (permission: Permission) => boolean;
  getPlanLimits: () => typeof PLAN_LIMITS[UserRole] | null;
  checkUsageLimit: (type: 'search' | 'vin' | 'export') => boolean;
  incrementUsage: (type: 'search' | 'vin' | 'export') => Promise<void>;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

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
            setUser({
              id: data.user.id.toString(),
              email: data.user.email,
              name: data.user.name || data.user.username,
              role: mapBackendRoleToUserRole(data.user.role),
              subscriptionStatus: 'active',
              joinDate: new Date().toISOString(),
              usage: {
                dailySearches: 0,
                monthlyVinLookups: 0,
                monthlyExports: 0,
                lastResetDate: new Date().toISOString()
              }
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
      case 'enterprise':
        return UserRole.ENTERPRISE;
      case 'platinum':
        return UserRole.PLATINUM;
      case 'gold':
        return UserRole.GOLD;
      case 'basic':
        return UserRole.BASIC;
      case 'free':
      default:
        return UserRole.FREE;
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) return false;
    return allowedRoles.includes(user.role);
  };

  const getPlanLimits = () => {
    if (!user) return null;
    const limits = PLAN_LIMITS[user.role];
    return limits || PLAN_LIMITS[UserRole.FREE];
  };

  const checkUsageLimit = (type: 'search' | 'vin' | 'export'): boolean => {
    if (!user) return false;
    
    const limits = PLAN_LIMITS[user.role];
    const usage = user.usage;
    
    // Check if limits are unlimited (-1)
    switch (type) {
      case 'search':
        return limits.dailySearches === -1 || usage.dailySearches < limits.dailySearches;
      case 'vin':
        return limits.monthlyVinLookups === -1 || usage.monthlyVinLookups < limits.monthlyVinLookups;
      case 'export':
        return limits.monthlyExports === -1 || usage.monthlyExports < limits.monthlyExports;
      default:
        return false;
    }
  };

  const incrementUsage = async (type: 'search' | 'vin' | 'export'): Promise<void> => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/usage/increment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const updatedUsage = {
          dailySearches: user.usage.dailySearches,
          monthlyVinLookups: user.usage.monthlyVinLookups,
          monthlyExports: user.usage.monthlyExports,
          lastResetDate: user.usage.lastResetDate
        };
        
        switch (type) {
          case 'search':
            updatedUsage.dailySearches += 1;
            break;
          case 'vin':
            updatedUsage.monthlyVinLookups += 1;
            break;
          case 'export':
            updatedUsage.monthlyExports += 1;
            break;
        }
        
        setUser(prev => prev ? { ...prev, usage: updatedUsage } : null);
      }
    } catch (error) {
      console.error('Failed to increment usage:', error);
    }
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

    setUser({
      id: data.user.id.toString(),
      email: data.user.email,
      name: data.user.name || data.user.username,
      role: mapBackendRoleToUserRole(data.user.role),
      subscriptionStatus: 'active',
      joinDate: new Date().toISOString(),
      usage: {
        dailySearches: 0,
        monthlyVinLookups: 0,
        monthlyExports: 0,
        lastResetDate: new Date().toISOString()
      }
    });
  };

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
            joinDate: new Date().toISOString(),
            usage: {
              dailySearches: 0,
              monthlyVinLookups: 0,
              monthlyExports: 0,
              lastResetDate: new Date().toISOString()
            }
          });
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const logout = () => {
    setUser(null);
    window.location.href = '/api/auth/logout';
  };

  const updateUserRole = (role: UserRole) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    isLoading,
    hasPermission,
    getPlanLimits,
    checkUsageLimit,
    incrementUsage,
    refreshUser,
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