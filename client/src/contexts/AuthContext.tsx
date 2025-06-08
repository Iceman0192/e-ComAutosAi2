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
    dailyFreshApiCalls: 0, // No fresh API access
    monthlyAiReports: 0, // No AI access
    searchResultsPerPage: 25,
    hasAccessTo: ['cached_sales_history', 'basic_active_lots'] // No similar vehicles, no AI analysis
  },
  [UserRole.BASIC]: {
    dailyFreshApiCalls: 100, // ~3k/month (30% of 100k monthly cap for all users)
    monthlyAiReports: 0, // No AI access
    searchResultsPerPage: 50,
    hasAccessTo: ['cached_sales_history', 'fresh_sales_history', 'similar_vehicles', 'import_calculator', 'basic_active_lots']
  },
  [UserRole.GOLD]: {
    dailyFreshApiCalls: 200, // ~6k/month 
    monthlyAiReports: 0, // No AI access yet
    searchResultsPerPage: 100,
    hasAccessTo: ['cached_sales_history', 'fresh_sales_history', 'similar_vehicles', 'import_calculator', 'advanced_filters', 'bulk_export', 'active_lots_advanced']
  },
  [UserRole.PLATINUM]: {
    dailyFreshApiCalls: 500, // ~15k/month
    monthlyAiReports: 10, // Limited AI reports ($2-3 per report estimated)
    searchResultsPerPage: 200,
    hasAccessTo: ['cached_sales_history', 'fresh_sales_history', 'similar_vehicles', 'import_calculator', 'advanced_filters', 'bulk_export', 'ai_analysis', 'market_intelligence', 'active_lots_pro']
  },
  [UserRole.ENTERPRISE]: {
    dailyFreshApiCalls: 1000, // ~30k/month
    monthlyAiReports: 50, // More AI reports for enterprise
    searchResultsPerPage: 500,
    hasAccessTo: ['cached_sales_history', 'fresh_sales_history', 'similar_vehicles', 'import_calculator', 'advanced_filters', 'bulk_export', 'ai_analysis', 'market_intelligence', 'team_collaboration', 'priority_processing', 'active_lots_enterprise']
  },
  [UserRole.ADMIN]: {
    dailyFreshApiCalls: -1, // Unlimited
    monthlyAiReports: -1, // Unlimited
    searchResultsPerPage: 1000,
    hasAccessTo: ['all_features', 'admin_tools', 'data_collection_management', 'user_management', 'system_monitoring', 'god_level_access']
  }
} as const;

// Feature permissions mapping based on actual platform features
export const PERMISSIONS = {
  // Free tier - cached data only
  CACHED_SALES_HISTORY: [UserRole.FREE, UserRole.BASIC, UserRole.GOLD, UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  BASIC_ACTIVE_LOTS: [UserRole.FREE, UserRole.BASIC, UserRole.GOLD, UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  
  // Basic tier - fresh API access
  FRESH_SALES_HISTORY: [UserRole.BASIC, UserRole.GOLD, UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  SIMILAR_VEHICLES: [UserRole.BASIC, UserRole.GOLD, UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  IMPORT_CALCULATOR: [UserRole.BASIC, UserRole.GOLD, UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  
  // Gold tier - advanced features
  ADVANCED_FILTERS: [UserRole.GOLD, UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  BULK_EXPORT: [UserRole.GOLD, UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  ACTIVE_LOTS_ADVANCED: [UserRole.GOLD, UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  
  // Platinum tier - AI and intelligence
  AI_ANALYSIS: [UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  MARKET_INTELLIGENCE: [UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  ACTIVE_LOTS_PRO: [UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  CUSTOM_REPORTS: [UserRole.PLATINUM, UserRole.ENTERPRISE, UserRole.ADMIN],
  
  // Enterprise tier - collaboration and priority
  TEAM_COLLABORATION: [UserRole.ENTERPRISE, UserRole.ADMIN],
  PRIORITY_PROCESSING: [UserRole.ENTERPRISE, UserRole.ADMIN],
  ACTIVE_LOTS_ENTERPRISE: [UserRole.ENTERPRISE, UserRole.ADMIN],
  ENTERPRISE_SECURITY: [UserRole.ENTERPRISE, UserRole.ADMIN],
  
  // Admin only - God Level
  ADMIN_TOOLS: [UserRole.ADMIN],
  DATA_COLLECTION_MANAGEMENT: [UserRole.ADMIN],
  USER_MANAGEMENT: [UserRole.ADMIN],
  SYSTEM_MONITORING: [UserRole.ADMIN],
  GOD_LEVEL_ACCESS: [UserRole.ADMIN]
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
    dailyFreshApiCalls: number;
    monthlyAiReports: number;
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
  getRemainingUsage: () => { freshApiCalls: number; aiReports: number; exports: number } | null;
  checkUsageLimit: (type: 'fresh_api' | 'ai_report' | 'export') => boolean;
  incrementUsage: (type: 'fresh_api' | 'ai_report' | 'export') => Promise<void>;
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
                dailyFreshApiCalls: 0,
                monthlyAiReports: 0,
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

  const getRemainingUsage = () => {
    if (!user) return null;
    
    const limits = PLAN_LIMITS[user.role];
    const usage = user.usage;
    
    return {
      freshApiCalls: limits.dailyFreshApiCalls === -1 ? -1 : Math.max(0, limits.dailyFreshApiCalls - usage.dailyFreshApiCalls),
      aiReports: limits.monthlyAiReports === -1 ? -1 : Math.max(0, limits.monthlyAiReports - usage.monthlyAiReports),
      exports: limits.monthlyAiReports === -1 ? -1 : Math.max(0, limits.monthlyAiReports - usage.monthlyExports)
    };
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
    getRemainingUsage,
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