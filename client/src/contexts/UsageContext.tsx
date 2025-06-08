import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Complete usage limits per tier matching the subscription plans
const USAGE_LIMITS = {
  freemium: {
    dailySearches: 10,
    monthlyVinLookups: 5,
    monthlyExports: 10,
    monthlyAiAnalyses: 2,
    features: {
      basicSearch: true,
      advancedFilters: false,
      priceAlerts: false,
      bulkExport: false,
      apiAccess: false,
      prioritySupport: false,
      customReports: false
    }
  },
  basic: {
    dailySearches: 33, // ~1000 monthly
    monthlyVinLookups: 25,
    monthlyExports: 100,
    monthlyAiAnalyses: 10,
    features: {
      basicSearch: true,
      advancedFilters: true,
      priceAlerts: true,
      bulkExport: false,
      apiAccess: false,
      prioritySupport: true,
      customReports: false
    }
  },
  gold: {
    dailySearches: 167, // ~5000 monthly
    monthlyVinLookups: 100,
    monthlyExports: 500,
    monthlyAiAnalyses: 50,
    features: {
      basicSearch: true,
      advancedFilters: true,
      priceAlerts: true,
      bulkExport: true,
      apiAccess: true,
      prioritySupport: true,
      customReports: true
    }
  },
  platinum: {
    dailySearches: -1, // unlimited
    monthlyVinLookups: -1,
    monthlyExports: -1,
    monthlyAiAnalyses: -1,
    features: {
      basicSearch: true,
      advancedFilters: true,
      priceAlerts: true,
      bulkExport: true,
      apiAccess: true,
      prioritySupport: true,
      customReports: true
    }
  },
  enterprise: {
    dailySearches: -1,
    monthlyVinLookups: -1,
    monthlyExports: -1,
    monthlyAiAnalyses: -1,
    features: {
      basicSearch: true,
      advancedFilters: true,
      priceAlerts: true,
      bulkExport: true,
      apiAccess: true,
      prioritySupport: true,
      customReports: true
    }
  },
  admin: {
    dailySearches: -1,
    monthlyVinLookups: -1,
    monthlyExports: -1,
    monthlyAiAnalyses: -1,
    features: {
      basicSearch: true,
      advancedFilters: true,
      priceAlerts: true,
      bulkExport: true,
      apiAccess: true,
      prioritySupport: true,
      customReports: true
    }
  }
} as const;

interface UsageStats {
  dailySearches: number;
  monthlyVinLookups: number;
  monthlyExports: number;
  monthlyAiAnalyses: number;
  lastDailyReset: string;
  lastMonthlyReset: string;
}

interface UsageContextType {
  usageStats: UsageStats;
  limits: typeof USAGE_LIMITS[keyof typeof USAGE_LIMITS];
  features: typeof USAGE_LIMITS[keyof typeof USAGE_LIMITS]['features'];
  canPerformAction: (action: 'search' | 'vin' | 'export' | 'ai') => boolean;
  getRemainingUsage: () => {
    dailySearches: number;
    monthlyVinLookups: number;
    monthlyExports: number;
    monthlyAiAnalyses: number;
  };
  trackUsage: (action: 'search' | 'vin' | 'export' | 'ai') => Promise<void>;
  hasFeature: (feature: keyof typeof USAGE_LIMITS[keyof typeof USAGE_LIMITS]['features']) => boolean;
  refreshUsage: () => Promise<void>;
}

const UsageContext = createContext<UsageContextType | null>(null);

export function UsageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [usageStats, setUsageStats] = useState<UsageStats>({
    dailySearches: 0,
    monthlyVinLookups: 0,
    monthlyExports: 0,
    monthlyAiAnalyses: 0,
    lastDailyReset: new Date().toISOString().split('T')[0],
    lastMonthlyReset: new Date().toISOString().substring(0, 7)
  });

  const userRole = user?.role || 'freemium';
  const limits = USAGE_LIMITS[userRole as keyof typeof USAGE_LIMITS] || USAGE_LIMITS.freemium;
  const features = limits.features;

  // Fetch usage data from server
  const refreshUsage = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/usage', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.usage) {
          const today = new Date().toISOString().split('T')[0];
          const thisMonth = new Date().toISOString().substring(0, 7);
          
          setUsageStats({
            dailySearches: data.usage.daily?.searches || 0,
            monthlyVinLookups: data.usage.monthly?.vinSearches || 0,
            monthlyExports: data.usage.monthly?.exports || 0,
            monthlyAiAnalyses: data.usage.monthly?.aiAnalyses || 0,
            lastDailyReset: today,
            lastMonthlyReset: thisMonth
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    }
  };

  useEffect(() => {
    if (user) {
      refreshUsage();
    }
  }, [user]);

  // Check if user can perform specific actions
  const canPerformAction = (action: 'search' | 'vin' | 'export' | 'ai'): boolean => {
    if (!user) return false;
    
    switch (action) {
      case 'search':
        return limits.dailySearches === -1 || usageStats.dailySearches < limits.dailySearches;
      case 'vin':
        return limits.monthlyVinLookups === -1 || usageStats.monthlyVinLookups < limits.monthlyVinLookups;
      case 'export':
        return limits.monthlyExports === -1 || usageStats.monthlyExports < limits.monthlyExports;
      case 'ai':
        return limits.monthlyAiAnalyses === -1 || usageStats.monthlyAiAnalyses < limits.monthlyAiAnalyses;
      default:
        return false;
    }
  };

  // Get remaining usage counts
  const getRemainingUsage = () => ({
    dailySearches: limits.dailySearches === -1 ? -1 : Math.max(0, limits.dailySearches - usageStats.dailySearches),
    monthlyVinLookups: limits.monthlyVinLookups === -1 ? -1 : Math.max(0, limits.monthlyVinLookups - usageStats.monthlyVinLookups),
    monthlyExports: limits.monthlyExports === -1 ? -1 : Math.max(0, limits.monthlyExports - usageStats.monthlyExports),
    monthlyAiAnalyses: limits.monthlyAiAnalyses === -1 ? -1 : Math.max(0, limits.monthlyAiAnalyses - usageStats.monthlyAiAnalyses)
  });

  // Track usage and update server
  const trackUsage = async (action: 'search' | 'vin' | 'export' | 'ai') => {
    if (!user) return;

    try {
      const eventTypeMap = {
        'search': 'search',
        'vin': 'vin_lookup',
        'export': 'export',
        'ai': 'ai_analysis'
      };

      const response = await fetch('/api/usage/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          eventType: eventTypeMap[action],
          metadata: { action, timestamp: new Date().toISOString() }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.usage) {
          // Update local state with server response
          setUsageStats(prev => ({
            ...prev,
            dailySearches: data.usage.daily?.searches || prev.dailySearches,
            monthlyVinLookups: data.usage.monthly?.vinSearches || prev.monthlyVinLookups,
            monthlyExports: data.usage.monthly?.exports || prev.monthlyExports,
            monthlyAiAnalyses: data.usage.monthly?.aiAnalyses || prev.monthlyAiAnalyses
          }));
        }
      } else {
        const errorData = await response.json();
        console.warn('Usage limit reached:', errorData.message);
        return { limitReached: true, message: errorData.message };
      }
    } catch (error) {
      console.error('Failed to track usage:', error);
    }
    
    return { limitReached: false };
  };

  // Check if user has specific feature
  const hasFeature = (feature: keyof typeof features): boolean => {
    return features[feature];
  };

  const value: UsageContextType = {
    usageStats,
    limits,
    features,
    canPerformAction,
    getRemainingUsage,
    trackUsage,
    hasFeature,
    refreshUsage
  };

  return (
    <UsageContext.Provider value={value}>
      {children}
    </UsageContext.Provider>
  );
}

export function useUsage(): UsageContextType {
  const context = useContext(UsageContext);
  if (!context) {
    throw new Error('useUsage must be used within a UsageProvider');
  }
  return context;
}