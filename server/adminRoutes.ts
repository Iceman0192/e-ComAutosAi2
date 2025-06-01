import type { Express, Request, Response } from "express";

export function setupAdminRoutes(app: Express) {
  
  // Admin analytics endpoint
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

      // In production, this would query your database for real metrics
      const analytics = {
        totalUsers: 1247,
        monthlyRevenue: 24750,
        activeSubscriptions: 342,
        dailySearches: 8234,
        newUsersThisMonth: 89,
        revenueGrowth: 8.2,
        churnRate: 2.1,
        avgRevenuePerUser: 72
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

      // In production, query your users table
      const users = [
        {
          id: 'demo-user',
          email: 'demo@example.com',
          username: 'demo',
          role: 'free',
          subscriptionStatus: 'active',
          searchesUsed: 45,
          searchLimit: 50,
          joinDate: '2024-01-15',
          lastActive: '2025-06-01'
        },
        {
          id: 'user-2',
          email: 'john@example.com',
          username: 'john',
          role: 'gold',
          subscriptionStatus: 'active',
          searchesUsed: 234,
          searchLimit: 500,
          joinDate: '2024-02-20',
          lastActive: '2025-05-31'
        },
        {
          id: 'user-3',
          email: 'sarah@example.com',
          username: 'sarah',
          role: 'platinum',
          subscriptionStatus: 'active',
          searchesUsed: 567,
          searchLimit: -1, // unlimited
          joinDate: '2024-01-10',
          lastActive: '2025-06-01'
        }
      ];

      res.json({
        success: true,
        data: users
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