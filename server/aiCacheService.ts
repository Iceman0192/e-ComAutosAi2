import { db } from './db';
import { aiAnalysisCache, aiLearningMetrics } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';

export interface AnalysisFilters {
  datasetSize: number;
  makes?: string[];
  models?: string[];
  yearFrom?: number;
  yearTo?: number;
  priceFrom?: number;
  priceTo?: number;
  sites?: string[];
  damageTypes?: string[];
}

export interface CachedAnalysis {
  id: number;
  results: any;
  insights?: string;
  performance?: any;
  createdAt: Date;
  accessCount: number;
}

export class AICacheService {
  private generateCacheKey(analysisType: string, filters: AnalysisFilters, userId: number): string {
    const filterString = JSON.stringify(filters, Object.keys(filters).sort());
    return crypto.createHash('sha256')
      .update(`${userId}-${analysisType}-${filterString}`)
      .digest('hex');
  }

  async getCachedAnalysis(
    userId: number,
    analysisType: string,
    filters: AnalysisFilters
  ): Promise<CachedAnalysis | null> {
    try {
      const cacheKey = this.generateCacheKey(analysisType, filters, userId);
      const filterJson = JSON.stringify(filters);

      const [cached] = await db
        .select()
        .from(aiAnalysisCache)
        .where(
          and(
            eq(aiAnalysisCache.userId, userId),
            eq(aiAnalysisCache.analysisType, analysisType),
            eq(aiAnalysisCache.filters, filterJson)
          )
        )
        .orderBy(desc(aiAnalysisCache.createdAt))
        .limit(1);

      if (cached) {
        // Update access count and last accessed time
        await db
          .update(aiAnalysisCache)
          .set({
            lastAccessed: new Date(),
            accessCount: sql`${aiAnalysisCache.accessCount} + 1`
          })
          .where(eq(aiAnalysisCache.id, cached.id));

        return {
          id: cached.id,
          results: JSON.parse(cached.results),
          insights: cached.insights || undefined,
          performance: cached.performance ? JSON.parse(cached.performance) : undefined,
          createdAt: cached.createdAt,
          accessCount: cached.accessCount + 1
        };
      }

      return null;
    } catch (error) {
      console.error('Error retrieving cached analysis:', error);
      return null;
    }
  }

  async cacheAnalysis(
    userId: number,
    analysisType: string,
    filters: AnalysisFilters,
    results: any,
    performance?: any,
    insights?: string
  ): Promise<void> {
    try {
      const resultsHash = crypto.createHash('sha256')
        .update(JSON.stringify(results))
        .digest('hex');

      const filterJson = JSON.stringify(filters);
      const resultsJson = JSON.stringify(results);
      const performanceJson = performance ? JSON.stringify(performance) : null;

      await db.insert(aiAnalysisCache).values({
        userId,
        analysisType,
        filters: filterJson,
        datasetSize: filters.datasetSize,
        resultsHash,
        results: resultsJson,
        insights,
        performance: performanceJson
      });

      // Extract and store learning patterns
      await this.extractLearningPatterns(analysisType, results);
    } catch (error) {
      console.error('Error caching analysis:', error);
    }
  }

  private async extractLearningPatterns(analysisType: string, results: any): Promise<void> {
    try {
      // Extract opportunity patterns
      if (results.opportunities) {
        for (const opportunity of results.opportunities) {
          await this.storeLearningPattern(
            analysisType,
            'opportunity',
            {
              make: opportunity.make,
              priceRange: opportunity.priceRange,
              profitMargin: opportunity.profitMargin,
              indicators: opportunity.indicators
            },
            opportunity.confidence || 0.8
          );
        }
      }

      // Extract trend patterns
      if (results.trends) {
        for (const trend of results.trends) {
          await this.storeLearningPattern(
            analysisType,
            'trend',
            {
              type: trend.type,
              direction: trend.direction,
              strength: trend.strength,
              timeframe: trend.timeframe
            },
            trend.confidence || 0.7
          );
        }
      }

      // Extract risk patterns
      if (results.risks) {
        for (const risk of results.risks) {
          await this.storeLearningPattern(
            analysisType,
            'risk',
            {
              category: risk.category,
              severity: risk.severity,
              indicators: risk.indicators
            },
            risk.confidence || 0.6
          );
        }
      }
    } catch (error) {
      console.error('Error extracting learning patterns:', error);
    }
  }

  private async storeLearningPattern(
    analysisType: string,
    patternType: string,
    pattern: any,
    confidence: number
  ): Promise<void> {
    try {
      const patternJson = JSON.stringify(pattern);
      
      // Check if pattern already exists
      const [existing] = await db
        .select()
        .from(aiLearningMetrics)
        .where(
          and(
            eq(aiLearningMetrics.analysisType, analysisType),
            eq(aiLearningMetrics.patternType, patternType),
            eq(aiLearningMetrics.pattern, patternJson)
          )
        );

      if (existing) {
        // Update frequency and confidence
        await db
          .update(aiLearningMetrics)
          .set({
            frequency: sql`${aiLearningMetrics.frequency} + 1`,
            confidence: ((existing.confidence + confidence) / 2).toString(),
            lastSeen: new Date()
          })
          .where(eq(aiLearningMetrics.id, existing.id));
      } else {
        // Insert new pattern
        await db.insert(aiLearningMetrics).values({
          analysisType,
          patternType,
          pattern: patternJson,
          confidence: confidence.toString()
        });
      }
    } catch (error) {
      console.error('Error storing learning pattern:', error);
    }
  }

  async getLearningInsights(analysisType: string, limit: number = 10): Promise<any[]> {
    try {
      const patterns = await db
        .select()
        .from(aiLearningMetrics)
        .where(eq(aiLearningMetrics.analysisType, analysisType))
        .orderBy(desc(aiLearningMetrics.frequency), desc(aiLearningMetrics.confidence))
        .limit(limit);

      return patterns.map(p => ({
        type: p.patternType,
        pattern: JSON.parse(p.pattern),
        confidence: parseFloat(p.confidence),
        frequency: p.frequency,
        lastSeen: p.lastSeen
      }));
    } catch (error) {
      console.error('Error retrieving learning insights:', error);
      return [];
    }
  }

  async getAnalysisHistory(userId: number, limit: number = 20): Promise<any[]> {
    try {
      const history = await db
        .select({
          id: aiAnalysisCache.id,
          analysisType: aiAnalysisCache.analysisType,
          filters: aiAnalysisCache.filters,
          datasetSize: aiAnalysisCache.datasetSize,
          createdAt: aiAnalysisCache.createdAt,
          accessCount: aiAnalysisCache.accessCount
        })
        .from(aiAnalysisCache)
        .where(eq(aiAnalysisCache.userId, userId))
        .orderBy(desc(aiAnalysisCache.createdAt))
        .limit(limit);

      return history.map(h => ({
        ...h,
        filters: JSON.parse(h.filters)
      }));
    } catch (error) {
      console.error('Error retrieving analysis history:', error);
      return [];
    }
  }

  async clearOldCache(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      await db
        .delete(aiAnalysisCache)
        .where(sql`${aiAnalysisCache.createdAt} < ${cutoffDate}`);
    } catch (error) {
      console.error('Error clearing old cache:', error);
    }
  }
}

export const aiCacheService = new AICacheService();