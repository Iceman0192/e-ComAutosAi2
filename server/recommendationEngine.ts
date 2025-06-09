/**
 * AI-Powered Vehicle Recommendation Engine
 * Analyzes user preferences, browsing history, and market data to generate personalized recommendations
 */

import OpenAI from 'openai';
import { db } from './db.js';
import { userPreferences, userActivity, recommendations, salesHistory } from '../shared/schema.js';
import { eq, and, desc, sql, gte, lte, inArray } from 'drizzle-orm';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface UserProfile {
  preferences: any;
  recentActivity: any[];
  searchPatterns: {
    commonMakes: string[];
    priceRange: { min: number; max: number };
    yearRange: { min: number; max: number };
    preferredDamageTypes: string[];
  };
}

export interface RecommendationRequest {
  userId: number;
  maxRecommendations?: number;
  refreshExisting?: boolean;
}

export class RecommendationEngine {
  /**
   * Generate personalized recommendations for a user
   */
  async generateRecommendations(request: RecommendationRequest) {
    const { userId, maxRecommendations = 10, refreshExisting = false } = request;
    
    // Get user profile
    const userProfile = await this.buildUserProfile(userId);
    
    // Clear existing recommendations if refresh requested
    if (refreshExisting) {
      await db.update(recommendations)
        .set({ isActive: false })
        .where(eq(recommendations.userId, userId));
    }
    
    // Find candidate vehicles from market data
    const candidates = await this.findCandidateVehicles(userProfile);
    
    // Score and rank candidates using AI
    const scoredRecommendations = await this.scoreVehiclesWithAI(userProfile, candidates);
    
    // Save top recommendations to database
    const topRecommendations = scoredRecommendations
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, maxRecommendations);
    
    await this.saveRecommendations(userId, topRecommendations);
    
    return topRecommendations;
  }

  /**
   * Build comprehensive user profile from preferences and activity
   */
  async buildUserProfile(userId: number): Promise<UserProfile> {
    // Get user preferences
    const prefs = await db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activity = await db.select()
      .from(userActivity)
      .where(and(
        eq(userActivity.userId, userId),
        gte(userActivity.timestamp, thirtyDaysAgo)
      ))
      .orderBy(desc(userActivity.timestamp))
      .limit(100);

    // Analyze search patterns from activity
    const searchPatterns = this.analyzeSearchPatterns(activity);

    return {
      preferences: prefs[0] || null,
      recentActivity: activity,
      searchPatterns
    };
  }

  /**
   * Analyze user search patterns to understand preferences
   */
  private analyzeSearchPatterns(activity: any[]) {
    const searches = activity.filter(a => a.activityType === 'search');
    const makeCount: { [key: string]: number } = {};
    const prices: number[] = [];
    const years: number[] = [];
    const damages: string[] = [];

    searches.forEach(search => {
      try {
        const params = JSON.parse(search.searchParams || '{}');
        
        if (params.make) {
          makeCount[params.make] = (makeCount[params.make] || 0) + 1;
        }
        
        if (params.priceMin || params.priceMax) {
          if (params.priceMin) prices.push(params.priceMin);
          if (params.priceMax) prices.push(params.priceMax);
        }
        
        if (params.yearFrom || params.yearTo) {
          if (params.yearFrom) years.push(params.yearFrom);
          if (params.yearTo) years.push(params.yearTo);
        }
      } catch (e) {
        // Skip invalid JSON
      }
    });

    const commonMakes = Object.entries(makeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([make]) => make);

    return {
      commonMakes,
      priceRange: {
        min: prices.length ? Math.min(...prices) : 0,
        max: prices.length ? Math.max(...prices) : 100000
      },
      yearRange: {
        min: years.length ? Math.min(...years) : 2010,
        max: years.length ? Math.max(...years) : new Date().getFullYear()
      },
      preferredDamageTypes: [...new Set(damages)]
    };
  }

  /**
   * Find candidate vehicles from market data based on user profile
   */
  async findCandidateVehicles(userProfile: UserProfile) {
    const { preferences, searchPatterns } = userProfile;
    
    // Build dynamic query conditions
    const conditions = [];
    
    // Use preferences if available, fallback to search patterns
    const targetMakes = preferences?.preferredMakes?.length 
      ? preferences.preferredMakes 
      : searchPatterns.commonMakes;
    
    const minYear = preferences?.preferredYearMin || searchPatterns.yearRange.min;
    const maxYear = preferences?.preferredYearMax || searchPatterns.yearRange.max;
    const maxPrice = preferences?.budgetMax || searchPatterns.priceRange.max;
    const minPrice = preferences?.budgetMin || searchPatterns.priceRange.min;

    // Search sales history database
    const results = await db.select()
      .from(salesHistory)
      .where(and(
        targetMakes.length ? inArray(salesHistory.make, targetMakes) : sql`1=1`,
        gte(salesHistory.year, minYear),
        lte(salesHistory.year, maxYear),
        maxPrice ? lte(salesHistory.purchase_price, maxPrice) : sql`1=1`,
        minPrice ? gte(salesHistory.purchase_price, minPrice) : sql`1=1`,
        sql`${salesHistory.purchase_price} > 0`
      ))
      .orderBy(desc(salesHistory.sale_date))
      .limit(400);

    // Normalize data structure
    const candidates = results.map(v => ({
      ...v,
      platform: v.site === 1 ? 'copart' : 'iaai',
      price: parseInt(v.purchase_price || '0'),
      mileage: v.vehicle_mileage,
      damage: v.vehicle_damage,
      location: v.auction_location
    }));

    return candidates.slice(0, 50); // Limit for AI processing
  }

  /**
   * Use AI to score and analyze vehicle recommendations
   */
  async scoreVehiclesWithAI(userProfile: UserProfile, candidates: any[]) {
    const { preferences, searchPatterns } = userProfile;
    
    // Create user context for AI
    const userContext = {
      preferences: preferences || {},
      searchPatterns,
      investmentGoal: preferences?.investmentGoal || 'unknown',
      riskTolerance: preferences?.riskTolerance || 'medium',
      budgetRange: preferences ? 
        `$${preferences.budgetMin || 0} - $${preferences.budgetMax || 'unlimited'}` :
        `$${searchPatterns.priceRange.min} - $${searchPatterns.priceRange.max}`
    };

    const prompt = `
You are an expert automotive market analyst helping users find the best vehicle investment opportunities.

User Profile:
${JSON.stringify(userContext, null, 2)}

Analyze these ${candidates.length} vehicles and score each from 0-100 based on:
1. Match with user preferences and search patterns
2. Market value and investment potential  
3. Condition and damage assessment
4. Location convenience
5. Risk vs reward profile

For each vehicle, provide:
- score (0-100)
- recommendation_type ("trending", "match", "opportunity") 
- reasoning (2-3 sentences explaining the score)

Vehicles to analyze:
${JSON.stringify(candidates.slice(0, 20), null, 2)}

Respond with JSON array of scored recommendations.
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const aiResponse = JSON.parse(response.choices[0].message.content || '{"recommendations": []}');
      const recommendations = aiResponse.recommendations || [];

      // Map AI scores back to vehicle data
      return recommendations.map((rec: any, index: number) => ({
        ...candidates[index],
        score: rec.score || 0,
        recommendationType: rec.recommendation_type || 'match',
        reasoning: rec.reasoning || 'AI analysis completed',
        aiAnalysis: rec
      }));

    } catch (error) {
      console.error('AI scoring failed:', error);
      
      // Fallback: Simple rule-based scoring
      return candidates.map(vehicle => ({
        ...vehicle,
        score: this.calculateFallbackScore(vehicle, userProfile),
        recommendationType: 'match',
        reasoning: 'Scored using preference matching algorithm'
      }));
    }
  }

  /**
   * Fallback scoring when AI is unavailable
   */
  private calculateFallbackScore(vehicle: any, userProfile: UserProfile): number {
    let score = 50; // Base score
    
    const { preferences, searchPatterns } = userProfile;
    
    // Make preference match
    const targetMakes = preferences?.preferredMakes || searchPatterns.commonMakes;
    if (targetMakes.includes(vehicle.make)) {
      score += 20;
    }
    
    // Year preference
    const targetYearMin = preferences?.preferredYearMin || searchPatterns.yearRange.min;
    const targetYearMax = preferences?.preferredYearMax || searchPatterns.yearRange.max;
    if (vehicle.year >= targetYearMin && vehicle.year <= targetYearMax) {
      score += 15;
    }
    
    // Price range match
    const budgetMax = preferences?.budgetMax || searchPatterns.priceRange.max;
    const budgetMin = preferences?.budgetMin || searchPatterns.priceRange.min;
    if (vehicle.price >= budgetMin && vehicle.price <= budgetMax) {
      score += 15;
    }
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Save recommendations to database
   */
  async saveRecommendations(userId: number, scoredRecommendations: any[]) {
    const recommendationData = scoredRecommendations.map(rec => ({
      userId,
      vehicleId: rec.vin || rec.lotId || `${rec.platform}-${rec.id}`,
      recommendationType: rec.recommendationType,
      score: rec.score.toString(),
      reasoning: rec.reasoning,
      vehicleData: JSON.stringify({
        make: rec.make,
        model: rec.model,
        year: rec.year,
        price: rec.price,
        mileage: rec.mileage,
        damage: rec.damage,
        location: rec.location,
        platform: rec.platform
      }),
      marketData: JSON.stringify(rec.aiAnalysis || {}),
      isActive: true
    }));

    if (recommendationData.length > 0) {
      await db.insert(recommendations).values(recommendationData);
    }
  }

  /**
   * Get active recommendations for a user
   */
  async getUserRecommendations(userId: number, limit: number = 10) {
    return await db.select()
      .from(recommendations)
      .where(and(
        eq(recommendations.userId, userId),
        eq(recommendations.isActive, true)
      ))
      .orderBy(desc(recommendations.score), desc(recommendations.createdAt))
      .limit(limit);
  }

  /**
   * Track user activity for recommendation learning
   */
  async trackUserActivity(userId: number, activityType: string, vehicleData?: any, searchParams?: any) {
    await db.insert(userActivity).values({
      userId,
      activityType,
      vehicleData: vehicleData ? JSON.stringify(vehicleData) : null,
      searchParams: searchParams ? JSON.stringify(searchParams) : null
    });
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: number, preferences: any) {
    // Check if preferences exist
    const existing = await db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db.update(userPreferences)
        .set({ ...preferences, updatedAt: new Date() })
        .where(eq(userPreferences.userId, userId));
    } else {
      await db.insert(userPreferences).values({
        userId,
        ...preferences
      });
    }
  }
}

export const recommendationEngine = new RecommendationEngine();