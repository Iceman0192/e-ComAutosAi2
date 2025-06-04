import { db } from "./db";
import { aiAnalysisCache, salesHistory } from "@shared/schema";
import { sql, desc, and, gte, lte, eq } from "drizzle-orm";
import crypto from "crypto";

interface CacheEntry {
  id: string;
  userId: number;
  analysisType: 'standard' | 'comprehensive';
  filters: any;
  datasetSize: number;
  resultsHash: string;
  results: any;
  insights: any;
  performance: any;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
}

interface CacheStrategy {
  shouldCache: boolean;
  ttl: number; // time to live in milliseconds
  priority: 'high' | 'medium' | 'low';
}

export class IntelligentCacheManager {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private readonly MAX_MEMORY_CACHE = 100;
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly HIGH_PRIORITY_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    this.initializeMemoryCache();
    this.startCleanupScheduler();
  }

  async initializeMemoryCache() {
    try {
      const recentCacheEntries = await db
        .select()
        .from(aiAnalysisCache)
        .orderBy(desc(aiAnalysisCache.lastAccessed))
        .limit(this.MAX_MEMORY_CACHE);

      recentCacheEntries.forEach(entry => {
        this.memoryCache.set(entry.resultsHash, {
          id: entry.id.toString(),
          userId: entry.userId,
          analysisType: entry.analysisType as any,
          filters: JSON.parse(entry.filters),
          datasetSize: entry.datasetSize,
          resultsHash: entry.resultsHash,
          results: JSON.parse(entry.results),
          insights: entry.insights ? JSON.parse(entry.insights) : null,
          performance: entry.performance ? JSON.parse(entry.performance) : null,
          createdAt: new Date(entry.createdAt),
          lastAccessed: new Date(entry.lastAccessed),
          accessCount: entry.accessCount
        });
      });

      console.log(`Initialized memory cache with ${recentCacheEntries.length} entries`);
    } catch (error) {
      console.error('Error initializing memory cache:', error);
    }
  }

  generateCacheKey(userId: number, analysisType: string, filters: any, datasetSize: number): string {
    const normalizedFilters = this.normalizeFilters(filters);
    const keyData = {
      userId,
      analysisType,
      filters: normalizedFilters,
      datasetSize
    };
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');
  }

  private normalizeFilters(filters: any): any {
    // Sort arrays and normalize data for consistent hashing
    const normalized = { ...filters };
    
    if (normalized.makes) {
      normalized.makes = [...normalized.makes].sort();
    }
    if (normalized.damageTypes) {
      normalized.damageTypes = [...normalized.damageTypes].sort();
    }
    if (normalized.locations) {
      normalized.locations = [...normalized.locations].sort();
    }
    
    return normalized;
  }

  async getCachedResult(
    userId: number, 
    analysisType: string, 
    filters: any, 
    datasetSize: number
  ): Promise<CacheEntry | null> {
    const cacheKey = this.generateCacheKey(userId, analysisType, filters, datasetSize);
    
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry && this.isEntryValid(memoryEntry)) {
      await this.updateAccessMetrics(cacheKey);
      return memoryEntry;
    }

    // Check database cache
    try {
      const dbEntry = await db
        .select()
        .from(aiAnalysisCache)
        .where(eq(aiAnalysisCache.resultsHash, cacheKey))
        .limit(1);

      if (dbEntry.length > 0) {
        const entry = dbEntry[0];
        const cacheEntry: CacheEntry = {
          id: entry.id.toString(),
          userId: entry.userId,
          analysisType: entry.analysisType as any,
          filters: JSON.parse(entry.filters),
          datasetSize: entry.datasetSize,
          resultsHash: entry.resultsHash,
          results: JSON.parse(entry.results),
          insights: entry.insights ? JSON.parse(entry.insights) : null,
          performance: entry.performance ? JSON.parse(entry.performance) : null,
          createdAt: new Date(entry.createdAt),
          lastAccessed: new Date(entry.lastAccessed),
          accessCount: entry.accessCount
        };

        if (this.isEntryValid(cacheEntry)) {
          // Add to memory cache
          this.addToMemoryCache(cacheKey, cacheEntry);
          await this.updateAccessMetrics(cacheKey);
          return cacheEntry;
        } else {
          // Remove expired entry
          await this.removeFromCache(cacheKey);
        }
      }
    } catch (error) {
      console.error('Error retrieving from database cache:', error);
    }

    return null;
  }

  async cacheResult(
    userId: number,
    analysisType: string,
    filters: any,
    datasetSize: number,
    results: any,
    insights?: any,
    performance?: any
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(userId, analysisType, filters, datasetSize);
    const strategy = this.determineCacheStrategy(analysisType, datasetSize, performance);
    
    if (!strategy.shouldCache) {
      return;
    }

    const cacheEntry: CacheEntry = {
      id: '', // Will be set by database
      userId,
      analysisType: analysisType as any,
      filters,
      datasetSize,
      resultsHash: cacheKey,
      results,
      insights,
      performance,
      createdAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 1
    };

    try {
      // Store in database
      await db.insert(aiAnalysisCache).values({
        userId,
        analysisType,
        filters: JSON.stringify(filters),
        datasetSize,
        resultsHash: cacheKey,
        results: JSON.stringify(results),
        insights: insights ? JSON.stringify(insights) : null,
        performance: performance ? JSON.stringify(performance) : null,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 1
      });

      // Add to memory cache
      this.addToMemoryCache(cacheKey, cacheEntry);
      
      console.log(`Cached ${analysisType} analysis for user ${userId} with ${datasetSize} records`);
    } catch (error) {
      console.error('Error caching result:', error);
    }
  }

  private determineCacheStrategy(
    analysisType: string, 
    datasetSize: number, 
    performance?: any
  ): CacheStrategy {
    let strategy: CacheStrategy = {
      shouldCache: true,
      ttl: this.DEFAULT_TTL,
      priority: 'medium'
    };

    // High priority for comprehensive analyses
    if (analysisType === 'comprehensive') {
      strategy.priority = 'high';
      strategy.ttl = this.HIGH_PRIORITY_TTL;
    }

    // High priority for large datasets
    if (datasetSize >= 25000) {
      strategy.priority = 'high';
      strategy.ttl = this.HIGH_PRIORITY_TTL;
    }

    // Consider execution time for caching priority
    if (performance?.duration && performance.duration > 30000) { // 30+ seconds
      strategy.priority = 'high';
      strategy.ttl = this.HIGH_PRIORITY_TTL;
    }

    // Don't cache very small datasets (likely test runs)
    if (datasetSize < 1000) {
      strategy.shouldCache = false;
    }

    return strategy;
  }

  private isEntryValid(entry: CacheEntry): boolean {
    const now = new Date();
    const ageMs = now.getTime() - entry.createdAt.getTime();
    
    // Determine TTL based on priority
    let ttl = this.DEFAULT_TTL;
    if (entry.analysisType === 'comprehensive' || entry.datasetSize >= 25000) {
      ttl = this.HIGH_PRIORITY_TTL;
    }

    return ageMs < ttl;
  }

  private addToMemoryCache(key: string, entry: CacheEntry): void {
    // Remove least recently used if at capacity
    if (this.memoryCache.size >= this.MAX_MEMORY_CACHE) {
      const lruKey = this.findLRUKey();
      if (lruKey) {
        this.memoryCache.delete(lruKey);
      }
    }

    this.memoryCache.set(key, entry);
  }

  private findLRUKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.memoryCache) {
      if (entry.lastAccessed.getTime() < oldestTime) {
        oldestTime = entry.lastAccessed.getTime();
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private async updateAccessMetrics(cacheKey: string): Promise<void> {
    try {
      // Update memory cache
      const memoryEntry = this.memoryCache.get(cacheKey);
      if (memoryEntry) {
        memoryEntry.lastAccessed = new Date();
        memoryEntry.accessCount++;
      }

      // Update database
      await db.update(aiAnalysisCache)
        .set({
          lastAccessed: new Date(),
          accessCount: sql`${aiAnalysisCache.accessCount} + 1`
        })
        .where(eq(aiAnalysisCache.resultsHash, cacheKey));
    } catch (error) {
      console.error('Error updating access metrics:', error);
    }
  }

  private async removeFromCache(cacheKey: string): Promise<void> {
    try {
      this.memoryCache.delete(cacheKey);
      await db.delete(aiAnalysisCache)
        .where(eq(aiAnalysisCache.resultsHash, cacheKey));
    } catch (error) {
      console.error('Error removing from cache:', error);
    }
  }

  async getCacheStatistics(): Promise<any> {
    try {
      const totalEntriesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(aiAnalysisCache);
      
      const recentEntriesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(aiAnalysisCache)
        .where(gte(aiAnalysisCache.lastAccessed, new Date(Date.now() - 24 * 60 * 60 * 1000)));

      const avgAccessCountResult = await db
        .select({ avg: sql<number>`avg(access_count)` })
        .from(aiAnalysisCache);

      return {
        totalCacheEntries: totalEntriesResult[0]?.count || 0,
        memoryCacheEntries: this.memoryCache.size,
        recentlyAccessed: recentEntriesResult[0]?.count || 0,
        averageAccessCount: Math.round(Number(avgAccessCountResult[0]?.avg || 0) * 10) / 10,
        cacheHitRate: this.calculateCacheHitRate()
      };
    } catch (error) {
      console.error('Error getting cache statistics:', error);
      return {
        totalCacheEntries: 0,
        memoryCacheEntries: this.memoryCache.size,
        recentlyAccessed: 0,
        averageAccessCount: 0,
        cacheHitRate: 0
      };
    }
  }

  private calculateCacheHitRate(): number {
    // This would be more accurate with dedicated hit/miss tracking
    // For now, estimate based on access patterns
    const totalEntries = this.memoryCache.size;
    if (totalEntries === 0) return 0;
    
    const frequentlyAccessed = Array.from(this.memoryCache.values())
      .filter(entry => entry.accessCount > 1).length;
    
    return Math.round((frequentlyAccessed / totalEntries) * 100);
  }

  private startCleanupScheduler(): void {
    // Clean up expired entries every hour
    setInterval(async () => {
      try {
        const cutoffDate = new Date(Date.now() - this.HIGH_PRIORITY_TTL);
        
        // Remove from database
        await db.delete(aiAnalysisCache)
          .where(lte(aiAnalysisCache.createdAt, cutoffDate));

        // Remove from memory cache
        for (const [key, entry] of this.memoryCache) {
          if (!this.isEntryValid(entry)) {
            this.memoryCache.delete(key);
          }
        }

        console.log('Cache cleanup completed');
      } catch (error) {
        console.error('Error during cache cleanup:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  async precomputeFrequentAnalyses(): Promise<void> {
    console.log('Starting precomputation of frequent analyses...');
    
    try {
      // Identify most common analysis patterns
      const commonPatterns = await db
        .select({
          analysisType: aiAnalysisCache.analysisType,
          filters: aiAnalysisCache.filters,
          datasetSize: aiAnalysisCache.datasetSize,
          accessCount: sql<number>`sum(access_count)`
        })
        .from(aiAnalysisCache)
        .groupBy(aiAnalysisCache.analysisType, aiAnalysisCache.filters, aiAnalysisCache.datasetSize)
        .having(sql`sum(access_count) > 5`)
        .orderBy(sql`sum(access_count) DESC`)
        .limit(5);

      console.log(`Found ${commonPatterns.length} frequently accessed analysis patterns`);
      
      // TODO: Implement background precomputation for these patterns
      // This would run during off-peak hours to refresh popular analyses
      
    } catch (error) {
      console.error('Error in precomputation analysis:', error);
    }
  }
}