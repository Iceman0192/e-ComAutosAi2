import type { Express, Request, Response } from "express";
import { db } from './db';
import { users, userUsage, subscriptionPlans, userSubscriptions } from '@shared/schema';
import { eq, desc, count, like, and, gte, lte, sql } from 'drizzle-orm';
import { requireAuth, requireAdmin } from './simpleAuth';
import { adminAnalyticsService } from './adminAnalyticsService';
import { userManagementService } from './userManagementService';

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

  // User management endpoint with comprehensive data
  app.get('/api/admin/users', requireAdmin, async (req: Request, res: Response) => {
    try {
      const userData = await userManagementService.getUserManagementData();
      res.json(userData);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  });

  // Update user role
  app.put('/api/admin/users/:userId/role', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      await userManagementService.updateUserRole(parseInt(userId), role);
      res.json({ success: true, message: 'User role updated successfully' });
    } catch (error) {
      console.error('Failed to update user role:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  });

  // Toggle user status
  app.put('/api/admin/users/:userId/status', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      
      await userManagementService.toggleUserStatus(parseInt(userId), isActive);
      res.json({ success: true, message: 'User status updated successfully' });
    } catch (error) {
      console.error('Failed to update user status:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }
  });

  // Reset user trial
  app.post('/api/admin/users/:userId/reset-trial', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      await userManagementService.resetUserTrial(parseInt(userId));
      res.json({ success: true, message: 'User trial reset successfully' });
    } catch (error) {
      console.error('Failed to reset user trial:', error);
      res.status(500).json({ error: 'Failed to reset user trial' });
    }
  });

  // Extend user trial
  app.post('/api/admin/users/:userId/extend-trial', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { days } = req.body;
      
      await userManagementService.extendUserTrial(parseInt(userId), days);
      res.json({ success: true, message: 'User trial extended successfully' });
    } catch (error) {
      console.error('Failed to extend user trial:', error);
      res.status(500).json({ error: 'Failed to extend user trial' });
    }
  });

  // Check user limits
  app.get('/api/admin/users/:userId/limits', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      const limitStatus = await userManagementService.checkUserLimits(parseInt(userId));
      res.json(limitStatus);
    } catch (error) {
      console.error('Failed to check user limits:', error);
      res.status(500).json({ error: 'Failed to check user limits' });
    }
  });

  // Get user activity history
  app.get('/api/admin/users/:userId/activity', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const activities = await userManagementService.getUserActivityHistory(parseInt(userId), limit);
      res.json(activities);
    } catch (error) {
      console.error('Failed to fetch user activity:', error);
      res.status(500).json({ error: 'Failed to fetch user activity' });
    }
  });

  // Bulk user operations
  app.post('/api/admin/users/bulk-update', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userIds, updates } = req.body;
      
      await userManagementService.bulkUpdateUsers(userIds, updates);
      res.json({ success: true, message: 'Users updated successfully' });
    } catch (error) {
      console.error('Failed to bulk update users:', error);
      res.status(500).json({ error: 'Failed to bulk update users' });
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