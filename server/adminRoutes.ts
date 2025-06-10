import type { Express, Request, Response } from "express";
import { db } from './db';
import { users, userUsage, subscriptionPlans, userSubscriptions } from '@shared/schema';
import { eq, desc, count, like, and, gte, lte, sql } from 'drizzle-orm';
import { requireAuth, requireAdmin } from './simpleAuth';
import { adminAnalyticsService } from './adminAnalyticsService';

export function setupAdminRoutes(app: Express) {
  
  // Admin analytics endpoint with real database data
  app.get('/api/admin/analytics', requireAdmin, async (req: Request, res: Response) => {
    try {
      const metrics = await adminAnalyticsService.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
  });

  // User management endpoint
  app.get('/api/admin/users', requireAdmin, async (req: Request, res: Response) => {
    try {
      const userData = await adminAnalyticsService.getUserManagementData();
      res.json(userData);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  });

  // Subscription analytics endpoint
  app.get('/api/admin/subscriptions', requireAdmin, async (req: Request, res: Response) => {
    try {
      const subscriptionData = await adminAnalyticsService.getSubscriptionAnalytics();
      res.json(subscriptionData);
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
      res.status(500).json({ error: 'Failed to fetch subscription data' });
    }
  });

  // Usage analytics endpoint
  app.get('/api/admin/usage-stats', requireAdmin, async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const usageData = await adminAnalyticsService.getUsageAnalytics(days);
      res.json(usageData);
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
      res.status(500).json({ error: 'Failed to fetch usage data' });
    }
  });

  // Update user role and status
  app.post('/api/admin/users/:userId/update', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { role, isActive } = req.body;

      await db.update(users)
        .set({ role, isActive, updatedAt: new Date() })
        .where(eq(users.id, parseInt(userId)));

      res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
      console.error('Failed to update user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Get system statistics
  app.get('/api/admin/system-stats', requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = {
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version
        },
        database: {
          connected: true // Would implement actual health check
        }
      };

      res.json(stats);
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
      res.status(500).json({ error: 'Failed to fetch system stats' });
    }
  });
}