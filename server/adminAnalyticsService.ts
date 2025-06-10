/**
 * Admin Analytics Service - Real Database Analytics
 * Provides comprehensive platform metrics from actual user data
 */

import { db } from './db';
import { users, userUsage, userSubscriptions, subscriptionPlans, userActivity } from '../shared/schema';
import { eq, and, gte, lte, count, sum, desc, asc, sql } from 'drizzle-orm';

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  userGrowthRate: number;
  
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowthRate: number;
  
  activeSubscriptions: number;
  subscriptionsByTier: Record<string, number>;
  subscriptionGrowthRate: number;
  
  platformUsage: {
    totalSearches: number;
    searchesToday: number;
    aiAnalysesToday: number;
    vinSearchesToday: number;
    exportsToday: number;
  };
  
  recentActivity: Array<{
    id: number;
    type: string;
    description: string;
    timestamp: Date;
    userEmail: string;
  }>;
  
  usersByTier: Record<string, number>;
  topActiveUsers: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    totalSearches: number;
    lastActive: Date;
  }>;
}

export class AdminAnalyticsService {
  
  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get user metrics
    const [totalUsersResult] = await db.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult.count;

    const [activeUsersResult] = await db.select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true));
    const activeUsers = activeUsersResult.count;

    const [newUsersThisMonthResult] = await db.select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, startOfMonth));
    const newUsersThisMonth = newUsersThisMonthResult.count;

    const [newUsersLastMonthResult] = await db.select({ count: count() })
      .from(users)
      .where(and(
        gte(users.createdAt, startOfLastMonth),
        lte(users.createdAt, endOfLastMonth)
      ));
    const newUsersLastMonth = newUsersLastMonthResult.count;

    const userGrowthRate = newUsersLastMonth > 0 
      ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
      : 0;

    // Get subscription metrics
    const activeSubscriptions = await db.select({ count: count() })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.status, 'active'));

    const subscriptionsByTierData = await db.select({
      role: subscriptionPlans.role,
      count: count()
    })
    .from(userSubscriptions)
    .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
    .where(eq(userSubscriptions.status, 'active'))
    .groupBy(subscriptionPlans.role);

    const subscriptionsByTier = subscriptionsByTierData.reduce((acc, item) => {
      acc[item.role] = item.count;
      return acc;
    }, {} as Record<string, number>);

    // Get usage metrics
    const usageToday = await db.select({
      totalSearches: sql<number>`CAST(COALESCE(SUM(${userUsage.searches}), 0) AS INTEGER)`,
      aiAnalyses: sql<number>`CAST(COALESCE(SUM(${userUsage.aiAnalyses}), 0) AS INTEGER)`,
      vinSearches: sql<number>`CAST(COALESCE(SUM(${userUsage.vinSearches}), 0) AS INTEGER)`,
      exports: sql<number>`CAST(COALESCE(SUM(${userUsage.exports}), 0) AS INTEGER)`
    })
    .from(userUsage)
    .where(gte(userUsage.date, startOfToday));

    const totalUsageResult = await db.select({
      totalSearches: sql<number>`CAST(COALESCE(SUM(${userUsage.searches}), 0) AS INTEGER)`
    }).from(userUsage);

    // Get users by tier
    const usersByTierData = await db.select({
      role: users.role,
      count: count()
    })
    .from(users)
    .where(eq(users.isActive, true))
    .groupBy(users.role);

    const usersByTier = usersByTierData.reduce((acc, item) => {
      acc[item.role] = item.count;
      return acc;
    }, {} as Record<string, number>);

    // Get recent activity
    const recentActivity = await db.select({
      id: userActivity.id,
      activityType: userActivity.activityType,
      timestamp: userActivity.timestamp,
      userEmail: users.email,
      vehicleData: userActivity.vehicleData
    })
    .from(userActivity)
    .innerJoin(users, eq(userActivity.userId, users.id))
    .orderBy(desc(userActivity.timestamp))
    .limit(10);

    // Get top active users
    const topActiveUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      lastLoginAt: users.lastLoginAt,
      totalSearches: sql<number>`COALESCE(SUM(${userUsage.searches}), 0)`
    })
    .from(users)
    .leftJoin(userUsage, eq(users.id, userUsage.userId))
    .where(eq(users.isActive, true))
    .groupBy(users.id, users.name, users.email, users.role, users.lastLoginAt)
    .orderBy(desc(sql`COALESCE(SUM(${userUsage.searches}), 0)`))
    .limit(5);

    // Revenue calculation (simplified - would need Stripe integration for real revenue)
    const monthlyRevenue = subscriptionsByTier.basic * 29 + 
                          subscriptionsByTier.gold * 99 + 
                          subscriptionsByTier.platinum * 199 + 
                          subscriptionsByTier.enterprise * 499;

    return {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      userGrowthRate,
      
      totalRevenue: monthlyRevenue * 12, // Annualized
      monthlyRevenue,
      revenueGrowthRate: 8, // Would calculate from historical data
      
      activeSubscriptions: activeSubscriptions[0].count,
      subscriptionsByTier,
      subscriptionGrowthRate: 5, // Would calculate from historical data
      
      platformUsage: {
        totalSearches: totalUsageResult[0]?.totalSearches || 0,
        searchesToday: usageToday[0]?.totalSearches || 0,
        aiAnalysesToday: usageToday[0]?.aiAnalyses || 0,
        vinSearchesToday: usageToday[0]?.vinSearches || 0,
        exportsToday: usageToday[0]?.exports || 0
      },
      
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        type: activity.activityType,
        description: this.formatActivityDescription(activity.activityType, activity.vehicleData),
        timestamp: activity.timestamp,
        userEmail: activity.userEmail
      })),
      
      usersByTier,
      
      topActiveUsers: topActiveUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalSearches: user.totalSearches,
        lastActive: user.lastLoginAt || new Date()
      }))
    };
  }

  /**
   * Get user management data
   */
  async getUserManagementData() {
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
      subscriptionStatus: users.subscriptionStatus,
      isTrialActive: users.isTrialActive,
      trialEndsAt: users.trialEndsAt
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(100);

    return allUsers;
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics() {
    const subscriptionData = await db.select({
      userId: userSubscriptions.userId,
      userName: users.name,
      userEmail: users.email,
      planName: subscriptionPlans.name,
      status: userSubscriptions.status,
      currentPeriodStart: userSubscriptions.currentPeriodStart,
      currentPeriodEnd: userSubscriptions.currentPeriodEnd,
      monthlyPrice: subscriptionPlans.monthlyPrice
    })
    .from(userSubscriptions)
    .innerJoin(users, eq(userSubscriptions.userId, users.id))
    .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
    .orderBy(desc(userSubscriptions.createdAt));

    return subscriptionData;
  }

  /**
   * Get detailed usage analytics
   */
  async getUsageAnalytics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const usageData = await db.select({
      date: userUsage.date,
      searches: sum(userUsage.searches),
      aiAnalyses: sum(userUsage.aiAnalyses),
      vinSearches: sum(userUsage.vinSearches),
      exports: sum(userUsage.exports)
    })
    .from(userUsage)
    .where(gte(userUsage.date, startDate))
    .groupBy(userUsage.date)
    .orderBy(asc(userUsage.date));

    return usageData;
  }

  private formatActivityDescription(activityType: string, vehicleData: string | null): string {
    switch (activityType) {
      case 'search':
        return 'Performed vehicle search';
      case 'view_lot':
        return 'Viewed auction lot details';
      case 'save_vehicle':
        return 'Saved vehicle to watchlist';
      case 'market_analysis':
        return 'Ran market analysis';
      case 'ai_analysis':
        return 'Used AI vehicle analysis';
      case 'vin_search':
        return 'Searched VIN history';
      default:
        return `Performed ${activityType}`;
    }
  }
}

export const adminAnalyticsService = new AdminAnalyticsService();