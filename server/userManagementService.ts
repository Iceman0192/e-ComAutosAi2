/**
 * User Management Service - Comprehensive Admin Controls
 * Handles user permissions, usage limits, rate limiting, and account management
 */

import { db } from './db';
import { users, userUsage, userActivity } from '../shared/schema';
import { eq, and, gte, lte, desc, count, sum, sql } from 'drizzle-orm';

export interface UserLimits {
  dailySearches: number;
  monthlySearches: number;
  aiAnalysesPerDay: number;
  vinSearchesPerDay: number;
  exportsPerDay: number;
  concurrentSessions: number;
}

export interface UserManagementData {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  isTrialActive: boolean;
  trialEndsAt: Date | null;
  usageStats: {
    totalSearches: number;
    searchesToday: number;
    aiAnalysesToday: number;
    vinSearchesToday: number;
    exportsToday: number;
    lastActivity: Date | null;
  };
  limits: UserLimits;
  subscriptionStatus: string | null;
}

export class UserManagementService {
  
  // Default limits by user tier
  private readonly defaultLimits: Record<string, UserLimits> = {
    freemium: {
      dailySearches: 10,
      monthlySearches: 100,
      aiAnalysesPerDay: 2,
      vinSearchesPerDay: 3,
      exportsPerDay: 1,
      concurrentSessions: 1
    },
    basic: {
      dailySearches: 50,
      monthlySearches: 1000,
      aiAnalysesPerDay: 10,
      vinSearchesPerDay: 15,
      exportsPerDay: 5,
      concurrentSessions: 2
    },
    gold: {
      dailySearches: 200,
      monthlySearches: 5000,
      aiAnalysesPerDay: 50,
      vinSearchesPerDay: 100,
      exportsPerDay: 20,
      concurrentSessions: 3
    },
    platinum: {
      dailySearches: 500,
      monthlySearches: 15000,
      aiAnalysesPerDay: 200,
      vinSearchesPerDay: 300,
      exportsPerDay: 100,
      concurrentSessions: 5
    },
    enterprise: {
      dailySearches: -1, // unlimited
      monthlySearches: -1,
      aiAnalysesPerDay: -1,
      vinSearchesPerDay: -1,
      exportsPerDay: -1,
      concurrentSessions: 10
    },
    admin: {
      dailySearches: -1, // unlimited
      monthlySearches: -1,
      aiAnalysesPerDay: -1,
      vinSearchesPerDay: -1,
      exportsPerDay: -1,
      concurrentSessions: -1
    }
  };

  /**
   * Get comprehensive user management data
   */
  async getUserManagementData(): Promise<UserManagementData[]> {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get all users
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
      isTrialActive: users.isTrialActive,
      trialEndsAt: users.trialEndsAt,
      subscriptionStatus: users.subscriptionStatus
    })
    .from(users)
    .orderBy(desc(users.createdAt));

    // Get usage stats for all users
    const usageData = await Promise.all(allUsers.map(async (user) => {
      const [todayUsage] = await db.select({
        searches: sql<number>`CAST(COALESCE(SUM(${userUsage.searches}), 0) AS INTEGER)`,
        aiAnalyses: sql<number>`CAST(COALESCE(SUM(${userUsage.aiAnalyses}), 0) AS INTEGER)`,
        vinSearches: sql<number>`CAST(COALESCE(SUM(${userUsage.vinSearches}), 0) AS INTEGER)`,
        exports: sql<number>`CAST(COALESCE(SUM(${userUsage.exports}), 0) AS INTEGER)`
      })
      .from(userUsage)
      .where(and(
        eq(userUsage.userId, user.id),
        gte(userUsage.date, startOfToday)
      ));

      const [totalUsage] = await db.select({
        totalSearches: sql<number>`CAST(COALESCE(SUM(${userUsage.searches}), 0) AS INTEGER)`
      })
      .from(userUsage)
      .where(eq(userUsage.userId, user.id));

      const [lastActivity] = await db.select({
        timestamp: userActivity.timestamp
      })
      .from(userActivity)
      .where(eq(userActivity.userId, user.id))
      .orderBy(desc(userActivity.timestamp))
      .limit(1);

      return {
        ...user,
        usageStats: {
          totalSearches: totalUsage?.totalSearches || 0,
          searchesToday: todayUsage?.searches || 0,
          aiAnalysesToday: todayUsage?.aiAnalyses || 0,
          vinSearchesToday: todayUsage?.vinSearches || 0,
          exportsToday: todayUsage?.exports || 0,
          lastActivity: lastActivity?.timestamp || null
        },
        limits: this.defaultLimits[user.role] || this.defaultLimits.freemium
      };
    }));

    return usageData;
  }

  /**
   * Update user role and permissions
   */
  async updateUserRole(userId: number, newRole: string): Promise<void> {
    await db.update(users)
      .set({ 
        role: newRole as any,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(userId: number, isActive: boolean): Promise<void> {
    await db.update(users)
      .set({ 
        isActive,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  /**
   * Reset user trial
   */
  async resetUserTrial(userId: number): Promise<void> {
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 days from now

    await db.update(users)
      .set({
        isTrialActive: true,
        trialStartDate: new Date(),
        trialEndDate: trialEndDate,
        trialEndsAt: trialEndDate,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  /**
   * Extend user trial
   */
  async extendUserTrial(userId: number, additionalDays: number): Promise<void> {
    const [user] = await db.select({ trialEndsAt: users.trialEndsAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user && user.trialEndsAt) {
      const newEndDate = new Date(user.trialEndsAt);
      newEndDate.setDate(newEndDate.getDate() + additionalDays);

      await db.update(users)
        .set({
          trialEndsAt: newEndDate,
          trialEndDate: newEndDate,
          isTrialActive: true,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    }
  }

  /**
   * Check if user has exceeded limits
   */
  async checkUserLimits(userId: number): Promise<{
    withinLimits: boolean;
    limitStatus: Record<string, { current: number; limit: number; exceeded: boolean }>;
  }> {
    const [user] = await db.select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    const limits = this.defaultLimits[user.role] || this.defaultLimits.freemium;
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get today's usage
    const [todayUsage] = await db.select({
      searches: sql<number>`CAST(COALESCE(SUM(${userUsage.searches}), 0) AS INTEGER)`,
      aiAnalyses: sql<number>`CAST(COALESCE(SUM(${userUsage.aiAnalyses}), 0) AS INTEGER)`,
      vinSearches: sql<number>`CAST(COALESCE(SUM(${userUsage.vinSearches}), 0) AS INTEGER)`,
      exports: sql<number>`CAST(COALESCE(SUM(${userUsage.exports}), 0) AS INTEGER)`
    })
    .from(userUsage)
    .where(and(
      eq(userUsage.userId, userId),
      gte(userUsage.date, startOfToday)
    ));

    // Get monthly usage
    const [monthlyUsage] = await db.select({
      searches: sql<number>`CAST(COALESCE(SUM(${userUsage.searches}), 0) AS INTEGER)`
    })
    .from(userUsage)
    .where(and(
      eq(userUsage.userId, userId),
      gte(userUsage.date, startOfMonth)
    ));

    const limitStatus = {
      dailySearches: {
        current: todayUsage?.searches || 0,
        limit: limits.dailySearches,
        exceeded: limits.dailySearches > 0 && (todayUsage?.searches || 0) >= limits.dailySearches
      },
      monthlySearches: {
        current: monthlyUsage?.searches || 0,
        limit: limits.monthlySearches,
        exceeded: limits.monthlySearches > 0 && (monthlyUsage?.searches || 0) >= limits.monthlySearches
      },
      aiAnalysesToday: {
        current: todayUsage?.aiAnalyses || 0,
        limit: limits.aiAnalysesPerDay,
        exceeded: limits.aiAnalysesPerDay > 0 && (todayUsage?.aiAnalyses || 0) >= limits.aiAnalysesPerDay
      },
      vinSearchesToday: {
        current: todayUsage?.vinSearches || 0,
        limit: limits.vinSearchesPerDay,
        exceeded: limits.vinSearchesPerDay > 0 && (todayUsage?.vinSearches || 0) >= limits.vinSearchesPerDay
      },
      exportsToday: {
        current: todayUsage?.exports || 0,
        limit: limits.exportsPerDay,
        exceeded: limits.exportsPerDay > 0 && (todayUsage?.exports || 0) >= limits.exportsPerDay
      }
    };

    const withinLimits = !Object.values(limitStatus).some(status => status.exceeded);

    return { withinLimits, limitStatus };
  }

  /**
   * Get user activity history
   */
  async getUserActivityHistory(userId: number, limit: number = 50): Promise<any[]> {
    const activities = await db.select({
      id: userActivity.id,
      activityType: userActivity.activityType,
      vehicleData: userActivity.vehicleData,
      searchParams: userActivity.searchParams,
      timestamp: userActivity.timestamp
    })
    .from(userActivity)
    .where(eq(userActivity.userId, userId))
    .orderBy(desc(userActivity.timestamp))
    .limit(limit);

    return activities;
  }

  /**
   * Bulk operations for multiple users
   */
  async bulkUpdateUsers(userIds: number[], updates: {
    role?: 'freemium' | 'basic' | 'gold' | 'platinum' | 'enterprise' | 'admin';
    isActive?: boolean;
  }): Promise<void> {
    for (const userId of userIds) {
      const updateData: any = { updatedAt: new Date() };
      if (updates.role) updateData.role = updates.role;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
      
      await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId));
    }
  }

  /**
   * Get usage analytics for specific user
   */
  async getUserUsageAnalytics(userId: number, days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await db.select({
      date: userUsage.date,
      searches: userUsage.searches,
      aiAnalyses: userUsage.aiAnalyses,
      vinSearches: userUsage.vinSearches,
      exports: userUsage.exports
    })
    .from(userUsage)
    .where(and(
      eq(userUsage.userId, userId),
      gte(userUsage.date, startDate)
    ))
    .orderBy(userUsage.date);

    return analytics;
  }

  /**
   * Get default limits for role
   */
  getLimitsForRole(role: string): UserLimits {
    return this.defaultLimits[role] || this.defaultLimits.freemium;
  }

  /**
   * Track user usage (to be called when user performs actions)
   */
  async trackUsage(userId: number, activityType: 'search' | 'ai_analysis' | 'vin_search' | 'export'): Promise<void> {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Check if usage record exists for today
    const [existingUsage] = await db.select({ id: userUsage.id })
      .from(userUsage)
      .where(and(
        eq(userUsage.userId, userId),
        gte(userUsage.date, startOfToday)
      ))
      .limit(1);

    if (existingUsage) {
      // Update existing record
      const updateData: any = {};
      switch (activityType) {
        case 'search':
          updateData.searches = sql`${userUsage.searches} + 1`;
          break;
        case 'ai_analysis':
          updateData.aiAnalyses = sql`${userUsage.aiAnalyses} + 1`;
          break;
        case 'vin_search':
          updateData.vinSearches = sql`${userUsage.vinSearches} + 1`;
          break;
        case 'export':
          updateData.exports = sql`${userUsage.exports} + 1`;
          break;
      }

      await db.update(userUsage)
        .set(updateData)
        .where(eq(userUsage.id, existingUsage.id));
    } else {
      // Create new record
      const insertData: any = {
        userId,
        date: today,
        searches: 0,
        aiAnalyses: 0,
        vinSearches: 0,
        exports: 0
      };

      switch (activityType) {
        case 'search':
          insertData.searches = 1;
          break;
        case 'ai_analysis':
          insertData.aiAnalyses = 1;
          break;
        case 'vin_search':
          insertData.vinSearches = 1;
          break;
        case 'export':
          insertData.exports = 1;
          break;
      }

      await db.insert(userUsage).values(insertData);
    }

    // Also record in activity log
    await db.insert(userActivity).values({
      userId,
      activityType,
      timestamp: new Date()
    });
  }
}

export const userManagementService = new UserManagementService();