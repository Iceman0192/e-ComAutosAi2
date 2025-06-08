import { Express, Request, Response } from 'express';
import { db } from './db';
import { userUsageStats } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireAuth } from './authRoutes';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    username: string;
    email: string;
    name: string;
    role: 'freemium' | 'basic' | 'gold' | 'platinum' | 'admin';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
}

export function setupUsageRoutes(app: Express) {
  // Get user usage stats
  app.get('/api/usage', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().substring(0, 7);

      // Get or create usage stats for today
      let dailyStats = await db.select()
        .from(userUsageStats)
        .where(and(
          eq(userUsageStats.userId, userId),
          eq(userUsageStats.date, today),
          eq(userUsageStats.period, 'daily')
        ))
        .limit(1);

      // Get or create usage stats for this month
      let monthlyStats = await db.select()
        .from(userUsageStats)
        .where(and(
          eq(userUsageStats.userId, userId),
          eq(userUsageStats.date, thisMonth),
          eq(userUsageStats.period, 'monthly')
        ))
        .limit(1);

      // Initialize if not exists
      if (dailyStats.length === 0) {
        await db.insert(userUsageStats).values({
          userId,
          date: today,
          period: 'daily',
          searches: 0,
          vinSearches: 0,
          exports: 0,
          aiAnalyses: 0
        });
        dailyStats = [{ searches: 0, vinSearches: 0, exports: 0, aiAnalyses: 0 }] as any;
      }

      if (monthlyStats.length === 0) {
        await db.insert(userUsageStats).values({
          userId,
          date: thisMonth,
          period: 'monthly',
          searches: 0,
          vinSearches: 0,
          exports: 0,
          aiAnalyses: 0
        });
        monthlyStats = [{ searches: 0, vinSearches: 0, exports: 0, aiAnalyses: 0 }] as any;
      }

      res.json({
        success: true,
        data: {
          searches: dailyStats[0].searches,
          vinSearches: monthlyStats[0].vinSearches,
          exports: monthlyStats[0].exports,
          aiAnalyses: monthlyStats[0].aiAnalyses
        }
      });
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch usage statistics'
      });
    }
  });

  // Increment usage count
  app.post('/api/increment-usage', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { type } = req.body;
      
      if (!['search', 'vin', 'export', 'ai'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid usage type'
        });
      }

      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().substring(0, 7);

      // Update daily stats for searches
      if (type === 'search') {
        await db.insert(userUsageStats).values({
          userId,
          date: today,
          period: 'daily',
          searches: 1,
          vinSearches: 0,
          exports: 0,
          aiAnalyses: 0
        })
        .onConflictDoUpdate({
          target: [userUsageStats.userId, userUsageStats.date, userUsageStats.period],
          set: {
            searches: sql`${userUsageStats.searches} + 1`,
            updatedAt: sql`now()`
          }
        });
      }

      // Update monthly stats for other types
      if (['vin', 'export', 'ai'].includes(type)) {
        const field = type === 'vin' ? 'vinSearches' : 
                     type === 'export' ? 'exports' : 'aiAnalyses';
        
        await db.insert(userUsageStats).values({
          userId,
          date: thisMonth,
          period: 'monthly',
          searches: 0,
          vinSearches: type === 'vin' ? 1 : 0,
          exports: type === 'export' ? 1 : 0,
          aiAnalyses: type === 'ai' ? 1 : 0
        })
        .onConflictDoUpdate({
          target: [userUsageStats.userId, userUsageStats.date, userUsageStats.period],
          set: {
            [field]: sql`${userUsageStats[field as keyof typeof userUsageStats]} + 1`,
            updatedAt: sql`now()`
          }
        });
      }

      res.json({
        success: true,
        message: 'Usage tracked successfully'
      });
    } catch (error) {
      console.error('Error tracking usage:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track usage'
      });
    }
  });

  // Reset usage (admin only)
  app.post('/api/admin/reset-usage', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { userId, period } = req.body;
      
      if (!userId || !['daily', 'monthly'].includes(period)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parameters'
        });
      }

      const date = period === 'daily' 
        ? new Date().toISOString().split('T')[0]
        : new Date().toISOString().substring(0, 7);

      await db.delete(userUsageStats)
        .where(and(
          eq(userUsageStats.userId, userId),
          eq(userUsageStats.date, date),
          eq(userUsageStats.period, period)
        ));

      res.json({
        success: true,
        message: 'Usage reset successfully'
      });
    } catch (error) {
      console.error('Error resetting usage:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset usage'
      });
    }
  });
}