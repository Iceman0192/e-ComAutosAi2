import express from 'express';
import { db } from './db';
import { users, userUsage } from '../shared/schema';
import { eq, desc, count, like, and, gte, lte } from 'drizzle-orm';
import { requireAuth, requireAdmin } from './authRoutes';

const router = express.Router();

// Get all users with pagination and filtering
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const role = req.query.role as string;
    const status = req.query.status as string;
    
    const offset = (page - 1) * limit;
    
    let whereConditions: any[] = [];
    
    if (search) {
      whereConditions.push(
        like(users.username, `%${search}%`),
        like(users.email, `%${search}%`),
        like(users.name, `%${search}%`)
      );
    }
    
    if (role) {
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

    res.json({
      success: true,
      data: {
        users: usersList,
        pagination: {
          page,
          limit,
          total: totalCount[0].count,
          totalPages: Math.ceil(totalCount[0].count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Get user details with usage statistics
router.get('/users/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get usage statistics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usageStats = await db.select()
      .from(userUsage)
      .where(and(
        eq(userUsage.userId, userId),
        gte(userUsage.date, thirtyDaysAgo)
      ))
      .orderBy(desc(userUsage.date));

    res.json({
      success: true,
      data: {
        user,
        usageStats
      }
    });
  } catch (error) {
    console.error('Admin user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details'
    });
  }
});

// Update user role
router.put('/users/:userId/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { role } = req.body;
    
    if (!['freemium', 'basic', 'gold', 'platinum', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    await db.update(users)
      .set({ 
        role: role as any,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    res.json({
      success: true,
      message: `User role updated to ${role}`
    });
  } catch (error) {
    console.error('Admin role update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
});

// Activate/Deactivate user account
router.put('/users/:userId/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { isActive } = req.body;
    
    await db.update(users)
      .set({ 
        isActive: Boolean(isActive),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    res.json({
      success: true,
      message: `User account ${isActive ? 'activated' : 'deactivated'}`
    });
  } catch (error) {
    console.error('Admin status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

// Manually reset trial for a user
router.post('/users/:userId/reset-trial', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    await db.update(users)
      .set({
        trialStartDate: null,
        trialEndDate: null,
        isTrialActive: false,
        hasUsedTrial: false,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    res.json({
      success: true,
      message: 'Trial reset successfully. User can now start a new trial.'
    });
  } catch (error) {
    console.error('Admin trial reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset trial'
    });
  }
});

// Manually extend trial for a user
router.post('/users/:userId/extend-trial', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { days } = req.body;
    
    if (!days || days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        message: 'Days must be between 1 and 365'
      });
    }

    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const newTrialStart = new Date();
    const newTrialEnd = new Date();
    newTrialEnd.setDate(newTrialEnd.getDate() + days);

    await db.update(users)
      .set({
        trialStartDate: newTrialStart,
        trialEndDate: newTrialEnd,
        isTrialActive: true,
        role: 'gold',
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    res.json({
      success: true,
      message: `Trial extended for ${days} days`,
      trialEndDate: newTrialEnd
    });
  } catch (error) {
    console.error('Admin trial extend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extend trial'
    });
  }
});

// Get platform statistics
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      trialUsers,
      paidUsers,
      recentUsers
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(users).where(eq(users.isActive, true)),
      db.select({ count: count() }).from(users).where(eq(users.isTrialActive, true)),
      db.select({ count: count() }).from(users).where(eq(users.stripeSubscriptionId, '')),
      db.select({ count: count() }).from(users).where(gte(users.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
    ]);

    const roleDistribution = await db.select({
      role: users.role,
      count: count()
    })
    .from(users)
    .groupBy(users.role);

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers[0].count,
        activeUsers: activeUsers[0].count,
        trialUsers: trialUsers[0].count,
        paidUsers: paidUsers[0].count,
        recentUsers: recentUsers[0].count,
        roleDistribution
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform statistics'
    });
  }
});

// Bulk operations
router.post('/users/bulk-action', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userIds, action, value } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    let updateData: any = { updatedAt: new Date() };
    let message = '';

    switch (action) {
      case 'activate':
        updateData.isActive = true;
        message = 'Users activated successfully';
        break;
      case 'deactivate':
        updateData.isActive = false;
        message = 'Users deactivated successfully';
        break;
      case 'change_role':
        if (!['freemium', 'basic', 'gold', 'platinum', 'admin'].includes(value)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid role'
          });
        }
        updateData.role = value;
        message = `User roles updated to ${value}`;
        break;
      case 'reset_trial':
        updateData.trialStartDate = null;
        updateData.trialEndDate = null;
        updateData.isTrialActive = false;
        updateData.hasUsedTrial = false;
        message = 'Trials reset successfully';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    // Update users in batches to avoid database limits
    for (const userId of userIds) {
      await db.update(users)
        .set(updateData)
        .where(eq(users.id, parseInt(userId)));
    }

    res.json({
      success: true,
      message,
      affectedUsers: userIds.length
    });
  } catch (error) {
    console.error('Admin bulk action error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk action'
    });
  }
});

export default router;