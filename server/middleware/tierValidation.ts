import type { Request, Response, NextFunction } from 'express';
import { TIER_LIMITS, type TierLimits } from '@shared/usage-limits';
import { db } from '../db';
import { usageStats, users } from '@shared/schema';
import { eq, and, gte } from 'drizzle-orm';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
    subscriptionStatus?: string;
  };
}

export async function validateTierAccess(requiredFeature: keyof TierLimits) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const userTier = req.user.role || 'freemium';
      const tierLimits = TIER_LIMITS[userTier];

      if (!tierLimits) {
        return res.status(403).json({ 
          success: false, 
          message: 'Invalid subscription tier' 
        });
      }

      // Check if feature is available for this tier
      const featureLimit = tierLimits[requiredFeature];
      
      if (featureLimit === false) {
        return res.status(403).json({
          success: false,
          message: `Feature not available in ${userTier} tier`,
          upgrade: true,
          tier: userTier
        });
      }

      next();
    } catch (error) {
      console.error('Tier validation error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
}

export async function validateUsageLimit(action: 'search' | 'vinAnalysis' | 'export' | 'aiAnalysis') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const userId = parseInt(req.user.id);
      const userTier = req.user.role || 'freemium';
      const tierLimits = TIER_LIMITS[userTier];

      if (!tierLimits) {
        return res.status(403).json({ 
          success: false, 
          message: 'Invalid subscription tier' 
        });
      }

      // Get current usage stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const [dailyUsage] = await db
        .select()
        .from(usageStats)
        .where(
          and(
            eq(usageStats.userId, userId),
            eq(usageStats.period, 'daily'),
            gte(usageStats.lastReset, today)
          )
        );

      const [monthlyUsage] = await db
        .select()
        .from(usageStats)
        .where(
          and(
            eq(usageStats.userId, userId),
            eq(usageStats.period, 'monthly'),
            gte(usageStats.lastReset, currentMonth)
          )
        );

      // Check limits based on action
      let limitExceeded = false;
      let limitType = '';
      let currentCount = 0;
      let maxAllowed = 0;

      switch (action) {
        case 'search':
          if (tierLimits.dailySearches !== -1) {
            currentCount = dailyUsage?.searches || 0;
            maxAllowed = tierLimits.dailySearches;
            if (currentCount >= tierLimits.dailySearches) {
              limitExceeded = true;
              limitType = 'daily searches';
            }
          }
          break;

        case 'vinAnalysis':
          if (tierLimits.vinSearchLimit !== -1) {
            currentCount = monthlyUsage?.vinSearches || 0;
            maxAllowed = tierLimits.vinSearchLimit;
            if (currentCount >= tierLimits.vinSearchLimit) {
              limitExceeded = true;
              limitType = 'monthly VIN analyses';
            }
          }
          break;

        case 'export':
          if (tierLimits.exportLimit !== -1) {
            currentCount = monthlyUsage?.exports || 0;
            maxAllowed = tierLimits.exportLimit;
            if (currentCount >= tierLimits.exportLimit) {
              limitExceeded = true;
              limitType = 'monthly exports';
            }
          }
          break;

        case 'aiAnalysis':
          if (tierLimits.aiAnalysisLimit !== -1) {
            currentCount = monthlyUsage?.aiAnalyses || 0;
            maxAllowed = tierLimits.aiAnalysisLimit;
            if (currentCount >= tierLimits.aiAnalysisLimit) {
              limitExceeded = true;
              limitType = 'monthly AI analyses';
            }
          }
          break;
      }

      if (limitExceeded) {
        return res.status(429).json({
          success: false,
          message: `Usage limit exceeded for ${limitType}`,
          usage: {
            current: currentCount,
            limit: maxAllowed,
            type: limitType,
            tier: userTier
          },
          upgrade: true
        });
      }

      next();
    } catch (error) {
      console.error('Usage validation error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
}