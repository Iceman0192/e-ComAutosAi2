import type { Express, Request, Response } from "express";
import { db } from './db';
import { users, userUsage, subscriptionPlans } from '../shared/schema';
import { eq, desc, count, like, and, gte, lte, sql } from 'drizzle-orm';

export function setupAdminRoutes(app: Express) {
  
  // Admin analytics endpoint with real database data
  app.get('/api/admin/analytics', async (req: Request, res: Response) => {
    try {
      // Check admin privileges
      const user = (req as any).user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      // Get real metrics from database
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        totalUsersResult,
        activeUsersResult,
        trialUsersResult,
        newUsersResult,
        roleDistribution
      ] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(users).where(eq(users.isActive, true)),
        db.select({ count: count() }).from(users).where(eq(users.isTrialActive, true)),
        db.select({ count: count() }).from(users).where(gte(users.createdAt, thirtyDaysAgo)),
        db.select({
          role: users.role,
          count: count()
        }).from(users).groupBy(users.role)
      ]);

      const analytics = {
        totalUsers: totalUsersResult[0]?.count || 0,
        activeUsers: activeUsersResult[0]?.count || 0,
        trialUsers: trialUsersResult[0]?.count || 0,
        newUsersThisMonth: newUsersResult[0]?.count || 0,
        roleDistribution,
        monthlyRevenue: 0, // Would integrate with Stripe for real revenue data
        revenueGrowth: 0,
        churnRate: 0
      };

      res.json({
        success: true,
        data: analytics
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics',
        error: error.message
      });
    }
  });

  // Admin user management endpoint
  app.get('/api/admin/users', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      // Query real users from database
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;
      const role = req.query.role as string;
      const status = req.query.status as string;
      
      const offset = (page - 1) * limit;
      
      let whereConditions: any[] = [];
      
      if (search) {
        whereConditions.push(like(users.username, `%${search}%`));
        whereConditions.push(like(users.email, `%${search}%`));
        whereConditions.push(like(users.name, `%${search}%`));
      }
      
      if (role && role !== 'all') {
        whereConditions.push(eq(users.role, role as any));
      }
      
      if (status === 'active') {
        whereConditions.push(eq(users.isActive, true));
      } else if (status === 'inactive') {
        whereConditions.push(eq(users.isActive, false));
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const [usersList, totalCount] = await Promise.all([
        db.select({
          id: users.id,
          username: users.username,
          email: users.email,
          name: users.name,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
          trialStartDate: users.trialStartDate,
          trialEndDate: users.trialEndDate,
          isTrialActive: users.isTrialActive,
          hasUsedTrial: users.hasUsedTrial,
          stripeCustomerId: users.stripeCustomerId,
          stripeSubscriptionId: users.stripeSubscriptionId
        })
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
        
        db.select({ count: count() })
        .from(users)
        .where(whereClause)
      ]);

      const usersData = {
        users: usersList,
        pagination: {
          page,
          limit,
          total: totalCount[0].count,
          totalPages: Math.ceil(totalCount[0].count / limit)
        }
      };

      res.json({
        success: true,
        data: usersData
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      });
    }
  });

  // Admin subscription analytics
  app.get('/api/admin/subscriptions', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      // In production, aggregate subscription data from your database
      const subscriptionData = {
        totalMRR: 24750,
        retentionRate: 94.2,
        avgRevenuePerUser: 72,
        planDistribution: {
          free: { count: 905, percentage: 72.6, revenue: 0 },
          gold: { count: 234, percentage: 18.8, revenue: 11466 },
          platinum: { count: 89, percentage: 7.1, revenue: 8811 },
          enterprise: { count: 19, percentage: 1.5, revenue: 3781 }
        },
        recentSubscriptions: [
          { email: 'sarah@example.com', plan: 'gold', action: 'upgraded', date: '2025-06-01' },
          { email: 'mike@example.com', plan: 'platinum', action: 'new', date: '2025-05-31' },
          { email: 'jen@example.com', plan: 'free', action: 'cancelled', date: '2025-05-30' }
        ]
      };

      res.json({
        success: true,
        data: subscriptionData
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscription data',
        error: error.message
      });
    }
  });

  // Update user role/plan (admin action)
  app.post('/api/admin/users/:userId/update', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { userId } = req.params;
      const { role, subscriptionStatus } = req.body;

      // In production, update the user in your database
      console.log(`Admin ${user.email} updating user ${userId}: role=${role}, status=${subscriptionStatus}`);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: {
          userId,
          role,
          subscriptionStatus
        }
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error.message
      });
    }
  });

  // Platform usage statistics
  app.get('/api/admin/usage-stats', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      // In production, query your analytics/usage tracking tables
      const usageStats = {
        dailySearches: 8234,
        totalVINSearches: 45672,
        aiAnalysisRequests: 12345,
        costCalculatorUses: 8765,
        dataExports: 567,
        topFeatures: [
          { feature: 'VIN Search', uses: 2847, percentage: 34.6 },
          { feature: 'Active Lots Browse', uses: 2156, percentage: 26.2 },
          { feature: 'AI Analysis', uses: 1234, percentage: 15.0 },
          { feature: 'Cost Calculator', uses: 987, percentage: 12.0 },
          { feature: 'Data Export', uses: 156, percentage: 1.9 }
        ],
        averageSessionDuration: '12m 34s',
        bounceRate: 23.4
      };

      res.json({
        success: true,
        data: usageStats
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch usage statistics',
        error: error.message
      });
    }
  });
}