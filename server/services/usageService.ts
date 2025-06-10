import { db } from "../db";
import { userUsageStats, usageEvents } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export class UsageService {
  static async trackEvent(
    userId: number, 
    eventType: 'search' | 'vin_lookup' | 'export' | 'ai_analysis',
    metadata?: any
  ) {
    try {
      // Record the event
      await db.insert(usageEvents).values({
        userId,
        eventType,
        metadata: metadata ? JSON.stringify(metadata) : null
      });
      
      // Update usage stats
      const today = new Date().toISOString().split('T')[0];
      const month = today.substring(0, 7);
      
      // Map event types to column names
      const columnMap = {
        'search': 'searches',
        'vin_lookup': 'vinSearches',
        'export': 'exports',
        'ai_analysis': 'aiAnalyses'
      } as const;
      
      const column = columnMap[eventType];
      
      // Update daily stats for searches
      if (eventType === 'search') {
        await db.insert(userUsageStats)
          .values({
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
              updatedAt: new Date()
            }
          });
      }
      
      // Update monthly stats for other types
      if (['vin_lookup', 'export', 'ai_analysis'].includes(eventType)) {
        const updateData = {
          userId,
          date: month,
          period: 'monthly' as const,
          searches: 0,
          vinSearches: eventType === 'vin_lookup' ? 1 : 0,
          exports: eventType === 'export' ? 1 : 0,
          aiAnalyses: eventType === 'ai_analysis' ? 1 : 0
        };
        
        await db.insert(userUsageStats)
          .values(updateData)
          .onConflictDoUpdate({
            target: [userUsageStats.userId, userUsageStats.date, userUsageStats.period],
            set: {
              [column]: sql`${userUsageStats[column]} + 1`,
              updatedAt: new Date()
            }
          });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Usage tracking error:', error);
      throw error;
    }
  }
  
  static async getUserUsage(userId: number) {
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7);
    
    const [dailyStats] = await db
      .select()
      .from(userUsageStats)
      .where(
        and(
          eq(userUsageStats.userId, userId),
          eq(userUsageStats.date, today),
          eq(userUsageStats.period, 'daily')
        )
      )
      .limit(1);
    
    const [monthlyStats] = await db
      .select()
      .from(userUsageStats)
      .where(
        and(
          eq(userUsageStats.userId, userId),
          eq(userUsageStats.date, month),
          eq(userUsageStats.period, 'monthly')
        )
      )
      .limit(1);
    
    return {
      daily: dailyStats || {
        searches: 0,
        vinSearches: 0,
        exports: 0,
        aiAnalyses: 0
      },
      monthly: monthlyStats || {
        searches: 0,
        vinSearches: 0,
        exports: 0,
        aiAnalyses: 0
      }
    };
  }
  
  static async checkUsageLimit(
    userId: number,
    userRole: string,
    eventType: 'search' | 'vin_lookup' | 'export' | 'ai_analysis'
  ): Promise<{ allowed: boolean; reason?: string }> {
    // ADMIN USERS BYPASS ALL USAGE LIMITS
    if (userRole === 'admin') {
      return { allowed: true };
    }
    
    const usage = await this.getUserUsage(userId);
    const limits = this.getLimitsForRole(userRole);
    
    // Map event types to usage properties
    const usageMap = {
      'search': { period: 'daily' as const, field: 'searches', limit: 'dailySearches' },
      'vin_lookup': { period: 'monthly' as const, field: 'vinSearches', limit: 'monthlyVinLookups' },
      'export': { period: 'monthly' as const, field: 'exports', limit: 'monthlyExports' },
      'ai_analysis': { period: 'monthly' as const, field: 'aiAnalyses', limit: 'monthlyAiAnalyses' }
    } as const;
    
    const mapping = usageMap[eventType];
    const current = usage[mapping.period][mapping.field as keyof typeof usage.daily];
    const limit = limits[mapping.limit as keyof typeof limits];
    
    if (limit === -1) return { allowed: true }; // Unlimited
    
    if (current && typeof current === 'number' && current >= limit) {
      return {
        allowed: false,
        reason: `${mapping.period === 'daily' ? 'Daily' : 'Monthly'} limit reached for ${eventType.replace('_', ' ')}`
      };
    }
    
    return { allowed: true };
  }
  
  static getLimitsForRole(role: string) {
    const limits = {
      freemium: {
        dailySearches: 10,
        monthlyVinLookups: 5,
        monthlyExports: 10,
        monthlyAiAnalyses: 2
      },
      basic: {
        dailySearches: 33, // ~1000 monthly
        monthlyVinLookups: 25,
        monthlyExports: 100,
        monthlyAiAnalyses: 10
      },
      gold: {
        dailySearches: 100,
        monthlyVinLookups: 50,
        monthlyExports: 100,
        monthlyAiAnalyses: 20
      },
      platinum: {
        dailySearches: -1, // unlimited
        monthlyVinLookups: 200,
        monthlyExports: -1,
        monthlyAiAnalyses: 100
      },
      enterprise: {
        dailySearches: -1,
        monthlyVinLookups: -1,
        monthlyExports: -1,
        monthlyAiAnalyses: -1
      },
      admin: {
        dailySearches: -1,
        monthlyVinLookups: -1,
        monthlyExports: -1,
        monthlyAiAnalyses: -1
      }
    };
    
    return limits[role as keyof typeof limits] || limits.freemium;
  }
}