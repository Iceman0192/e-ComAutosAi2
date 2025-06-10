import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { userUsage, users } from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { TIER_LIMITS, checkUsageLimit } from '@shared/usage-limits';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export async function trackUsage(action: 'search' | 'aiAnalysis' | 'vinSearch' | 'export') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userId = req.user.id;
    const userRole = req.user.role;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // ADMIN USERS BYPASS ALL USAGE LIMITS
      if (userRole === 'admin') {
        req.trackUsage = async () => {
          // Track usage for admin users without limits
          const [todayUsage] = await db
            .select()
            .from(userUsage)
            .where(
              and(
                eq(userUsage.userId, userId),
                gte(userUsage.date, today)
              )
            )
            .limit(1);

          if (todayUsage) {
            const updateData: any = {};
            updateData[action === 'search' ? 'searches' : 
                       action === 'aiAnalysis' ? 'aiAnalyses' :
                       action === 'vinSearch' ? 'vinSearches' : 'exports'] = 
                       todayUsage[action === 'search' ? 'searches' : 
                                 action === 'aiAnalysis' ? 'aiAnalyses' :
                                 action === 'vinSearch' ? 'vinSearches' : 'exports'] + 1;

            await db
              .update(userUsage)
              .set(updateData)
              .where(eq(userUsage.id, todayUsage.id));
          } else {
            const newUsageData: any = {
              userId,
              date: today,
              searches: 0,
              aiAnalyses: 0,
              vinSearches: 0,
              exports: 0,
            };
            newUsageData[action === 'search' ? 'searches' : 
                        action === 'aiAnalysis' ? 'aiAnalyses' :
                        action === 'vinSearch' ? 'vinSearches' : 'exports'] = 1;

            await db.insert(userUsage).values(newUsageData);
          }
        };
        return next();
      }

      // Get today's usage for non-admin users
      const [todayUsage] = await db
        .select()
        .from(userUsage)
        .where(
          and(
            eq(userUsage.userId, userId),
            gte(userUsage.date, today)
          )
        )
        .limit(1);

      const currentUsage = todayUsage || {
        searches: 0,
        aiAnalyses: 0,
        vinSearches: 0,
        exports: 0,
      };

      // Check limits based on action
      const limits = TIER_LIMITS[userRole] || TIER_LIMITS.freemium;
      let currentCount = 0;
      let dailyLimit = 0;

      switch (action) {
        case 'search':
          currentCount = currentUsage.searches;
          dailyLimit = limits.dailySearches;
          break;
        case 'aiAnalysis':
          currentCount = currentUsage.aiAnalyses;
          dailyLimit = limits.aiAnalysisLimit;
          break;
        case 'vinSearch':
          currentCount = currentUsage.vinSearches;
          dailyLimit = limits.vinSearchLimit;
          break;
        case 'export':
          currentCount = currentUsage.exports;
          dailyLimit = limits.exportLimit;
          break;
      }

      // Check if user has exceeded limit
      const limitCheck = checkUsageLimit(currentCount, dailyLimit, action);
      if (!limitCheck.allowed) {
        return res.status(429).json({
          success: false,
          message: limitCheck.message,
          usageLimit: true,
          currentTier: userRole,
          upgradeRequired: true
        });
      }

      // Store usage tracking function in request for later use
      req.trackUsage = async () => {
        if (todayUsage) {
          // Update existing record
          const updateData: any = {};
          updateData[action === 'search' ? 'searches' : 
                     action === 'aiAnalysis' ? 'aiAnalyses' :
                     action === 'vinSearch' ? 'vinSearches' : 'exports'] = currentCount + 1;

          await db
            .update(userUsage)
            .set(updateData)
            .where(eq(userUsage.id, todayUsage.id));
        } else {
          // Create new record
          const newUsageData: any = {
            userId,
            date: today,
            searches: 0,
            aiAnalyses: 0,
            vinSearches: 0,
            exports: 0,
          };
          newUsageData[action === 'search' ? 'searches' : 
                      action === 'aiAnalysis' ? 'aiAnalyses' :
                      action === 'vinSearch' ? 'vinSearches' : 'exports'] = 1;

          await db.insert(userUsage).values(newUsageData);
        }
      };

      next();
    } catch (error) {
      console.error('Usage tracking error:', error);
      next(); // Continue even if tracking fails
    }
  };
}

export async function getUserUsageStats(userId: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Get daily usage
  const [dailyUsage] = await db
    .select()
    .from(userUsage)
    .where(
      and(
        eq(userUsage.userId, userId),
        gte(userUsage.date, today)
      )
    )
    .limit(1);

  // Get monthly usage
  const monthlyUsage = await db
    .select()
    .from(userUsage)
    .where(
      and(
        eq(userUsage.userId, userId),
        gte(userUsage.date, monthStart)
      )
    );

  const monthlyTotals = monthlyUsage.reduce(
    (acc, usage) => ({
      searches: acc.searches + usage.searches,
      aiAnalyses: acc.aiAnalyses + usage.aiAnalyses,
      vinSearches: acc.vinSearches + usage.vinSearches,
      exports: acc.exports + usage.exports,
    }),
    { searches: 0, aiAnalyses: 0, vinSearches: 0, exports: 0 }
  );

  return {
    daily: dailyUsage || { searches: 0, aiAnalyses: 0, vinSearches: 0, exports: 0 },
    monthly: monthlyTotals,
  };
}

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      trackUsage?: () => Promise<void>;
    }
  }
}