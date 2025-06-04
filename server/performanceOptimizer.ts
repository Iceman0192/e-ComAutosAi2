import { db } from './db';
import { salesHistory, userUsage } from '@shared/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';

export class PerformanceOptimizer {
  private queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  // Optimized search with intelligent caching and indexing
  async optimizedSearch(params: {
    make?: string;
    model?: string;
    year_from?: number;
    year_to?: number;
    site?: number;
    page?: number;
    size?: number;
    location?: string;
  }) {
    const cacheKey = this.generateCacheKey(params);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const { page = 1, size = 25, ...filters } = params;
    const offset = (page - 1) * size;

    // Build optimized query with proper indexing
    let query = db.select().from(salesHistory);
    const conditions = [];

    if (filters.make) {
      conditions.push(eq(salesHistory.make, filters.make));
    }
    if (filters.model) {
      conditions.push(eq(salesHistory.model, filters.model));
    }
    if (filters.year_from) {
      conditions.push(gte(salesHistory.year, filters.year_from));
    }
    if (filters.year_to) {
      conditions.push(sql`${salesHistory.year} <= ${filters.year_to}`);
    }
    if (filters.site) {
      conditions.push(eq(salesHistory.site, filters.site));
    }
    if (filters.location) {
      conditions.push(sql`${salesHistory.auction_location} ILIKE ${'%' + filters.location + '%'}`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Execute optimized query with pagination
    const results = await query
      .orderBy(desc(salesHistory.sale_date))
      .limit(size)
      .offset(offset);

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(salesHistory);
    
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [{ count }] = await countQuery;

    const response = {
      success: true,
      data: {
        salesHistory: results,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / size),
          totalItems: count,
          itemsPerPage: size,
        },
      },
    };

    this.setCache(cacheKey, response);
    return response;
  }

  // Batch processing for large datasets
  async batchProcessVehicles(vins: string[], batchSize = 50) {
    const results = [];
    
    for (let i = 0; i < vins.length; i += batchSize) {
      const batch = vins.slice(i, i + batchSize);
      const batchResults = await db
        .select()
        .from(salesHistory)
        .where(sql`${salesHistory.vin} = ANY(${batch})`);
      
      results.push(...batchResults);
    }

    return results;
  }

  // Database health monitoring
  async getDatabaseHealth() {
    try {
      // Check connection
      const connectionTest = await db.execute(sql`SELECT 1 as health`);
      
      // Get table sizes
      const tableSizes = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `);

      // Get active connections
      const connections = await db.execute(sql`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);

      // Cache hit rate
      const cacheStats = await db.execute(sql`
        SELECT 
          sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
        FROM pg_statio_user_tables
      `);

      return {
        status: 'healthy',
        connection: connectionTest.length > 0,
        tableSizes: tableSizes.rows,
        activeConnections: connections.rows[0],
        cacheHitRatio: cacheStats.rows[0],
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  // Query performance analysis
  async analyzeQueryPerformance(query: string) {
    try {
      const explain = await db.execute(sql`EXPLAIN ANALYZE ${sql.raw(query)}`);
      return {
        success: true,
        analysis: explain.rows,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Cache management
  private generateCacheKey(params: any): string {
    return Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');
  }

  private getFromCache(key: string) {
    const cached = this.queryCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.queryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any, ttl = this.defaultTTL) {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Cleanup old entries
    if (this.queryCache.size > 1000) {
      const oldestKey = this.queryCache.keys().next().value;
      this.queryCache.delete(oldestKey);
    }
  }

  // Database optimization recommendations
  async getOptimizationRecommendations() {
    const recommendations = [];

    try {
      // Check for missing indexes
      const slowQueries = await db.execute(sql`
        SELECT query, mean_time, calls 
        FROM pg_stat_statements 
        WHERE mean_time > 100 
        ORDER BY mean_time DESC 
        LIMIT 10
      `);

      if (slowQueries.rows.length > 0) {
        recommendations.push({
          type: 'slow_queries',
          priority: 'high',
          description: 'Found slow queries that may benefit from indexing',
          queries: slowQueries.rows,
        });
      }

      // Check table bloat
      const bloatedTables = await db.execute(sql`
        SELECT 
          tablename,
          pg_size_pretty(pg_total_relation_size(tablename)) as size,
          n_dead_tup,
          n_live_tup,
          CASE WHEN n_live_tup > 0 
            THEN round(100 * n_dead_tup / (n_live_tup + n_dead_tup), 2) 
            ELSE 0 
          END as bloat_ratio
        FROM pg_stat_user_tables 
        WHERE n_dead_tup > 1000
        ORDER BY bloat_ratio DESC
      `);

      if (bloatedTables.rows.length > 0) {
        recommendations.push({
          type: 'table_bloat',
          priority: 'medium',
          description: 'Tables with high dead tuple ratio need VACUUM',
          tables: bloatedTables.rows,
        });
      }

      return {
        success: true,
        recommendations,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const performanceOptimizer = new PerformanceOptimizer();