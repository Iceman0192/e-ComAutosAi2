export interface TierLimits {
  dailySearches: number;
  monthlySearches: number;
  aiAnalysisLimit: number;
  vinSearchLimit: number;
  exportLimit: number;
  crossPlatformAccess: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
  bulkExport: boolean;
}

export const TIER_LIMITS: Record<string, TierLimits> = {
  freemium: {
    dailySearches: 10,
    monthlySearches: 100,
    aiAnalysisLimit: 0,
    vinSearchLimit: 5,
    exportLimit: 10,
    crossPlatformAccess: false,
    prioritySupport: false,
    apiAccess: false,
    bulkExport: false,
  },
  basic: {
    dailySearches: 50,
    monthlySearches: 1000,
    aiAnalysisLimit: 0,
    vinSearchLimit: 25,
    exportLimit: 100,
    crossPlatformAccess: false,
    prioritySupport: false,
    apiAccess: false,
    bulkExport: false,
  },
  gold: {
    dailySearches: 200,
    monthlySearches: 5000,
    aiAnalysisLimit: 0,
    vinSearchLimit: 100,
    exportLimit: 500,
    crossPlatformAccess: true,
    prioritySupport: true,
    apiAccess: false,
    bulkExport: true,
  },
  platinum: {
    dailySearches: -1, // unlimited
    monthlySearches: -1, // unlimited
    aiAnalysisLimit: -1, // unlimited
    vinSearchLimit: -1, // unlimited
    exportLimit: -1, // unlimited
    crossPlatformAccess: true,
    prioritySupport: true,
    apiAccess: true,
    bulkExport: true,
  },
  admin: {
    dailySearches: -1,
    monthlySearches: -1,
    aiAnalysisLimit: -1,
    vinSearchLimit: -1,
    exportLimit: -1,
    crossPlatformAccess: true,
    prioritySupport: true,
    apiAccess: true,
    bulkExport: true,
  },
};

export interface UsageStats {
  userId: number;
  period: 'daily' | 'monthly';
  searches: number;
  aiAnalyses: number;
  vinSearches: number;
  exports: number;
  lastReset: Date;
}

export function checkUsageLimit(
  currentUsage: number,
  limit: number,
  action: string
): { allowed: boolean; message?: string } {
  if (limit === -1) return { allowed: true }; // unlimited
  
  if (currentUsage >= limit) {
    return {
      allowed: false,
      message: `${action} limit reached (${limit}). Upgrade your plan for more access.`
    };
  }
  
  return { allowed: true };
}

export function getRemainingUsage(currentUsage: number, limit: number): number {
  if (limit === -1) return -1; // unlimited
  return Math.max(0, limit - currentUsage);
}