/**
 * Personalized Vehicle Recommendation API Routes
 * Handles user preferences, recommendations, and activity tracking
 */

import { Express, Request, Response } from 'express';
import { recommendationEngine } from './recommendationEngine.js';
import { requireAuth } from './authRoutes.js';
import { AuthenticatedRequest } from './authTypes.js';

export function setupRecommendationRoutes(app: Express) {
  
  /**
   * Get personalized recommendations for authenticated user
   */
  app.get('/api/recommendations', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { limit = 10, refresh = false } = req.query;
      const userId = req.user.id;

      let recommendations;
      
      if (refresh === 'true') {
        // Generate fresh recommendations
        recommendations = await recommendationEngine.generateRecommendations({
          userId,
          maxRecommendations: parseInt(limit as string),
          refreshExisting: true
        });
      } else {
        // Get existing recommendations
        recommendations = await recommendationEngine.getUserRecommendations(
          userId, 
          parseInt(limit as string)
        );
        
        // If no existing recommendations, generate new ones
        if (recommendations.length === 0) {
          const generated = await recommendationEngine.generateRecommendations({
            userId,
            maxRecommendations: parseInt(limit as string)
          });
          recommendations = await recommendationEngine.getUserRecommendations(userId, parseInt(limit as string));
        }
      }

      res.json({
        success: true,
        recommendations: recommendations.map(rec => ({
          id: rec.id,
          vehicleId: rec.vehicleId,
          type: rec.recommendationType,
          score: parseFloat(rec.score),
          reasoning: rec.reasoning,
          vehicle: JSON.parse(rec.vehicleData),
          marketData: rec.marketData ? JSON.parse(rec.marketData) : null,
          createdAt: rec.createdAt,
          viewed: !!rec.viewedAt
        }))
      });

    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recommendations'
      });
    }
  });

  /**
   * Generate fresh recommendations
   */
  app.post('/api/recommendations/generate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { maxRecommendations = 10 } = req.body;
      const userId = req.user.id;

      const recommendations = await recommendationEngine.generateRecommendations({
        userId,
        maxRecommendations,
        refreshExisting: true
      });

      res.json({
        success: true,
        message: `Generated ${recommendations.length} personalized recommendations`,
        count: recommendations.length
      });

    } catch (error) {
      console.error('Error generating recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate recommendations'
      });
    }
  });

  /**
   * Get user preferences
   */
  app.get('/api/preferences', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const userProfile = await recommendationEngine.buildUserProfile(userId);

      res.json({
        success: true,
        preferences: userProfile.preferences,
        searchPatterns: userProfile.searchPatterns,
        activityCount: userProfile.recentActivity.length
      });

    } catch (error) {
      console.error('Error fetching preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user preferences'
      });
    }
  });

  /**
   * Update user preferences
   */
  app.post('/api/preferences', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const preferences = req.body;

      await recommendationEngine.updateUserPreferences(userId, preferences);

      res.json({
        success: true,
        message: 'Preferences updated successfully'
      });

    } catch (error) {
      console.error('Error updating preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update preferences'
      });
    }
  });

  /**
   * Track user activity (search, view, etc.)
   */
  app.post('/api/activity/track', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { activityType, vehicleData, searchParams } = req.body;

      await recommendationEngine.trackUserActivity(userId, activityType, vehicleData, searchParams);

      res.json({
        success: true,
        message: 'Activity tracked successfully'
      });

    } catch (error) {
      console.error('Error tracking activity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track activity'
      });
    }
  });

  /**
   * Mark recommendation as viewed
   */
  app.post('/api/recommendations/:id/view', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const recommendationId = parseInt(req.params.id);
      const userId = req.user.id;

      // Update viewed timestamp
      const { db } = await import('./db.js');
      const { recommendations } = await import('../shared/schema.js');
      const { eq, and } = await import('drizzle-orm');

      await db.update(recommendations)
        .set({ viewedAt: new Date() })
        .where(and(
          eq(recommendations.id, recommendationId),
          eq(recommendations.userId, userId)
        ));

      res.json({
        success: true,
        message: 'Recommendation marked as viewed'
      });

    } catch (error) {
      console.error('Error marking recommendation as viewed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update recommendation'
      });
    }
  });

  /**
   * Dismiss recommendation
   */
  app.post('/api/recommendations/:id/dismiss', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const recommendationId = parseInt(req.params.id);
      const userId = req.user.id;

      const { db } = await import('./db.js');
      const { recommendations } = await import('../shared/schema.js');
      const { eq, and } = await import('drizzle-orm');

      await db.update(recommendations)
        .set({ 
          dismissedAt: new Date(),
          isActive: false 
        })
        .where(and(
          eq(recommendations.id, recommendationId),
          eq(recommendations.userId, userId)
        ));

      res.json({
        success: true,
        message: 'Recommendation dismissed'
      });

    } catch (error) {
      console.error('Error dismissing recommendation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to dismiss recommendation'
      });
    }
  });

  /**
   * Get recommendation analytics for user
   */
  app.get('/api/recommendations/analytics', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      
      const { db } = await import('./db.js');
      const { recommendations, userActivity } = await import('../shared/schema.js');
      const { eq, and, count, avg, sql } = await import('drizzle-orm');

      // Get recommendation stats
      const [totalRecs] = await db.select({ count: count() })
        .from(recommendations)
        .where(eq(recommendations.userId, userId));

      const [activeRecs] = await db.select({ count: count() })
        .from(recommendations)
        .where(and(
          eq(recommendations.userId, userId),
          eq(recommendations.isActive, true)
        ));

      const [viewedRecs] = await db.select({ count: count() })
        .from(recommendations)
        .where(and(
          eq(recommendations.userId, userId),
          sql`viewed_at IS NOT NULL`
        ));

      const [avgScore] = await db.select({ avg: avg(recommendations.score) })
        .from(recommendations)
        .where(and(
          eq(recommendations.userId, userId),
          eq(recommendations.isActive, true)
        ));

      // Get activity stats (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [recentActivity] = await db.select({ count: count() })
        .from(userActivity)
        .where(and(
          eq(userActivity.userId, userId),
          sql`timestamp >= ${thirtyDaysAgo}`
        ));

      res.json({
        success: true,
        analytics: {
          totalRecommendations: totalRecs.count,
          activeRecommendations: activeRecs.count,
          viewedRecommendations: viewedRecs.count,
          averageScore: parseFloat(avgScore.avg || '0'),
          recentActivity: recentActivity.count,
          engagementRate: totalRecs.count > 0 ? (viewedRecs.count / totalRecs.count * 100) : 0
        }
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics'
      });
    }
  });
}