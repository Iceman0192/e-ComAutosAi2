import { LRUCache } from 'lru-cache';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private cache: LRUCache<string, CacheEntry>;
  private defaultTTL = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.cache = new LRUCache({
      max: 1000, // Maximum number of items
      maxSize: 50 * 1024 * 1024, // 50MB max cache size
      sizeCalculation: (value) => JSON.stringify(value).length,
      ttl: this.defaultTTL,
    });
  }

  set(key: string, data: any, ttl?: number): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };
    this.cache.set(key, entry);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Generate cache key for search queries
  generateSearchKey(params: {
    make?: string;
    model?: string;
    year_from?: string;
    year_to?: string;
    site?: string;
    page?: string;
    size?: string;
    location?: string;
    damage?: string;
  }): string {
    const sortedParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== '')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    
    return `search:${sortedParams}`;
  }

  // Generate cache key for VIN history
  generateVinKey(vin: string): string {
    return `vin:${vin.toUpperCase()}`;
  }

  // Generate cache key for lot details
  generateLotKey(lotId: string, site: string): string {
    return `lot:${site}:${lotId}`;
  }

  // Cache statistics
  getStats() {
    return {
      size: this.cache.size,
      calculatedSize: this.cache.calculatedSize,
      hitRate: this.getHitRate(),
    };
  }

  private getHitRate(): number {
    // Simple hit rate calculation (would need more sophisticated tracking in production)
    return this.cache.size > 0 ? 0.8 : 0; // Placeholder
  }
}

export const cacheManager = new CacheManager();

// Cache middleware for Express routes
export function withCache(keyGenerator: (req: any) => string, ttl?: number) {
  return (req: any, res: any, next: any) => {
    const cacheKey = keyGenerator(req);
    const cached = cacheManager.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache response
    res.json = function(data: any) {
      if (res.statusCode === 200 && data.success) {
        cacheManager.set(cacheKey, data, ttl);
      }
      return originalJson.call(this, data);
    };

    next();
  };
}