import { Express } from 'express';
import { db } from './db';
import { userUsage, users } from '@shared/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { TIER_LIMITS, checkUsageLimit } from '@shared/usage-limits';
import type { Request, Response } from 'express';

export function registerUsageRoutes(app: Express) {
  // Get current user's usage stats
  app.get('/api/usage/stats', async (req: Request, res: Response) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's usage
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

      // Get user's plan limits
      const limits = TIER_LIMITS[userRole] || TIER_LIMITS.freemium;

      // Current usage
      const currentUsage = {
        searches: todayUsage?.searches || 0,
        aiAnalyses: todayUsage?.aiAnalyses || 0,
        vinSearches: todayUsage?.vinSearches || 0,
        exports: todayUsage?.exports || 0,
      };

      // Calculate remaining usage
      const remaining = {
        searches: limits.dailySearches === -1 ? -1 : Math.max(0, limits.dailySearches - currentUsage.searches),
        aiAnalyses: limits.aiAnalysisLimit === -1 ? -1 : Math.max(0, limits.aiAnalysisLimit - currentUsage.aiAnalyses),
        vinSearches: limits.vinSearchLimit === -1 ? -1 : Math.max(0, limits.vinSearchLimit - currentUsage.vinSearches),
        exports: limits.exportLimit === -1 ? -1 : Math.max(0, limits.exportLimit - currentUsage.exports),
      };

      res.json({
        success: true,
        data: {
          currentTier: userRole,
          currentUsage,
          limits: {
            dailySearches: limits.dailySearches,
            aiAnalysisLimit: limits.aiAnalysisLimit,
            vinSearchLimit: limits.vinSearchLimit,
            exportLimit: limits.exportLimit,
          },
          remaining,
          lastReset: today.toISOString(),
        }
      });
    } catch (error) {
      console.error('Usage stats error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch usage stats' });
    }
  });

  // Test endpoint to trigger usage tracking (for demonstration)
  app.post('/api/usage/test-limit', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { action = 'search' } = req.body;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's usage
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
          upgradeRequired: true,
          currentUsage: currentCount,
          limit: dailyLimit
        });
      }

      // Increment usage
      if (todayUsage) {
        // Update existing record
        const updateData: any = {};
        const field = action === 'search' ? 'searches' : 
                     action === 'aiAnalysis' ? 'aiAnalyses' :
                     action === 'vinSearch' ? 'vinSearches' : 'exports';
        updateData[field] = currentCount + 1;

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
        const field = action === 'search' ? 'searches' : 
                     action === 'aiAnalysis' ? 'aiAnalyses' :
                     action === 'vinSearch' ? 'vinSearches' : 'exports';
        newUsageData[field] = 1;

        await db.insert(userUsage).values(newUsageData);
      }

      res.json({
        success: true,
        message: `${action} completed successfully`,
        newUsage: currentCount + 1,
        remaining: dailyLimit === -1 ? -1 : Math.max(0, dailyLimit - (currentCount + 1))
      });

    } catch (error) {
      console.error('Usage test error:', error);
      res.status(500).json({ success: false, message: 'Failed to test usage limit' });
    }
  });

  // Get usage history
  app.get('/api/usage/history', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 30;

      const usageHistory = await db
        .select()
        .from(userUsage)
        .where(eq(userUsage.userId, userId))
        .orderBy(desc(userUsage.date))
        .limit(limit);

      res.json({
        success: true,
        data: usageHistory
      });
    } catch (error) {
      console.error('Usage history error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch usage history' });
    }
  });
}