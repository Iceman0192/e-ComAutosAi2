import { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth, UserRole } from './AuthContext';

// Usage limits per tier
const USAGE_LIMITS = {
  [UserRole.FREE]: {
    monthlySearches: 5,
    apiCallsPerSearch: 10, // 10 pages max
    resultsPerPage: 25,
    cachedPageCredit: 2 // 2 cached pages = 1 API call credit
  },
  [UserRole.GOLD]: {
    monthlySearches: -1, // unlimited
    apiCallsPerSearch: -1, // unlimited
    resultsPerPage: 25,
    cachedPageCredit: 1 // better rate for paid users
  },
  [UserRole.PLATINUM]: {
    monthlySearches: -1, // unlimited
    apiCallsPerSearch: -1, // unlimited
    resultsPerPage: 25,
    cachedPageCredit: 1
  },
  [UserRole.ADMIN]: {
    monthlySearches: -1, // unlimited
    apiCallsPerSearch: -1, // unlimited
    resultsPerPage: 25,
    cachedPageCredit: 0 // no cost for admin
  }
};

interface UsageStats {
  searchesThisMonth: number;
  apiCallsThisMonth: number;
  cachedPagesViewed: number;
  lastResetDate: string;
}

interface UsageContextType {
  usageStats: UsageStats;
  limits: typeof USAGE_LIMITS[UserRole];
  canMakeSearch: boolean;
  canMakeAPICall: boolean;
  remainingSearches: number;
  remainingAPICalls: number;
  trackSearch: (isNewAPICall: boolean) => void;
  trackPageView: (isCached: boolean) => void;
  resetMonthlyUsage: () => void;
}

const UsageContext = createContext<UsageContextType | null>(null);

export function UsageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Demo usage stats - in production, this would come from your database
  const [usageStats, setUsageStats] = useState<UsageStats>({
    searchesThisMonth: 1, // User has done 1 search already
    apiCallsThisMonth: 10, // Used 10 API calls (1 complete search)
    cachedPagesViewed: 0,
    lastResetDate: new Date().toISOString().substring(0, 7) // current month
  });

  const limits = user ? USAGE_LIMITS[user.role] : USAGE_LIMITS[UserRole.FREE];
  
  // Calculate remaining usage
  const remainingSearches = limits.monthlySearches === -1 
    ? -1 
    : Math.max(0, limits.monthlySearches - usageStats.searchesThisMonth);
    
  const remainingAPICalls = limits.apiCallsPerSearch === -1 
    ? -1 
    : Math.max(0, (limits.monthlySearches * limits.apiCallsPerSearch) - usageStats.apiCallsThisMonth);

  // Check if user can perform actions
  const canMakeSearch = limits.monthlySearches === -1 || usageStats.searchesThisMonth < limits.monthlySearches;
  const canMakeAPICall = limits.apiCallsPerSearch === -1 || remainingAPICalls > 0;

  const trackSearch = (isNewAPICall: boolean) => {
    setUsageStats(prev => ({
      ...prev,
      searchesThisMonth: prev.searchesThisMonth + 1,
      apiCallsThisMonth: isNewAPICall ? prev.apiCallsThisMonth + 1 : prev.apiCallsThisMonth
    }));
  };

  const trackPageView = (isCached: boolean) => {
    if (isCached && limits.cachedPageCredit > 0) {
      setUsageStats(prev => {
        const newCachedViews = prev.cachedPagesViewed + 1;
        const creditEarned = Math.floor(newCachedViews / limits.cachedPageCredit);
        const previousCredit = Math.floor(prev.cachedPagesViewed / limits.cachedPageCredit);
        
        return {
          ...prev,
          cachedPagesViewed: newCachedViews,
          // If user earned a new credit, reduce API calls by 1
          apiCallsThisMonth: creditEarned > previousCredit 
            ? Math.max(0, prev.apiCallsThisMonth - 1)
            : prev.apiCallsThisMonth
        };
      });
    } else if (!isCached) {
      // Track API call
      setUsageStats(prev => ({
        ...prev,
        apiCallsThisMonth: prev.apiCallsThisMonth + 1
      }));
    }
  };

  const resetMonthlyUsage = () => {
    setUsageStats({
      searchesThisMonth: 0,
      apiCallsThisMonth: 0,
      cachedPagesViewed: 0,
      lastResetDate: new Date().toISOString().substring(0, 7)
    });
  };

  const value: UsageContextType = {
    usageStats,
    limits,
    canMakeSearch,
    canMakeAPICall,
    remainingSearches,
    remainingAPICalls,
    trackSearch,
    trackPageView,
    resetMonthlyUsage
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