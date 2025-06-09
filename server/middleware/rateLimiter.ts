import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';
import { logger } from './logger.js';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    requests: number;
    resetTime: number;
  };
}

class InMemoryRateLimitStore {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  get(key: string): { requests: number; resetTime: number } | null {
    const entry = this.store[key];
    if (!entry || entry.resetTime < Date.now()) {
      return null;
    }
    return entry;
  }

  set(key: string, requests: number, resetTime: number) {
    this.store[key] = { requests, resetTime };
  }

  increment(key: string, windowMs: number): { requests: number; resetTime: number } {
    const now = Date.now();
    const resetTime = now + windowMs;
    const existing = this.get(key);

    if (!existing) {
      this.set(key, 1, resetTime);
      return { requests: 1, resetTime };
    }

    existing.requests++;
    this.set(key, existing.requests, existing.resetTime);
    return existing;
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

const store = new InMemoryRateLimitStore();

export const createRateLimiter = (config: RateLimitConfig) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Generate key based on IP and user
      const userId = (req as any).session?.userId;
      const key = userId ? `user:${userId}` : `ip:${req.ip}`;
      
      const { requests, resetTime } = store.increment(key, config.windowMs);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, config.maxRequests - requests).toString(),
        'X-RateLimit-Reset': new Date(resetTime).toISOString()
      });

      if (requests > config.maxRequests) {
        logger.log({
          timestamp: new Date().toISOString(),
          method: req.method,
          url: req.originalUrl || req.url,
          ip: req.ip || 'unknown',
          userId,
          statusCode: 429,
          error: 'Rate limit exceeded'
        });

        throw new AppError(
          429, 
          config.message || 'Too many requests, please try again later'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Predefined rate limiters for different use cases
export const rateLimiters = {
  // Strict rate limiting for authentication endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again in 15 minutes'
  }),

  // AI Chat endpoints
  aiChat: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'AI chat request limit reached, please wait before making more requests'
  }),

  // AI Analysis endpoints
  aiAnalysis: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'AI analysis request limit reached, please wait before making more requests'
  }),

  // AuctionMind endpoints
  auctionMind: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    message: 'AuctionMind request limit reached, please wait before making more requests'
  }),

  // Sales History endpoints
  salesHistory: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Sales history request limit reached, please wait before making more requests'
  }),

  // Vehicle Search endpoints
  vehicleSearch: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    message: 'Vehicle search request limit reached, please wait before searching again'
  }),

  // Comparables endpoints
  comparables: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 25,
    message: 'Comparables request limit reached, please wait before making more requests'
  }),

  // Admin endpoints
  admin: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Admin request limit reached, please wait before making more requests'
  }),

  // General API rate limiting
  api: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'API request limit reached, please slow down'
  }),

  // Strict rate limiting for expensive operations
  expensive: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Request limit reached for this operation'
  })
};

// Tier-based rate limiting based on user subscription
export const createTierBasedRateLimiter = (tierLimits: Record<string, RateLimitConfig>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const userTier = user?.role || 'freemium';
    
    const config = tierLimits[userTier] || tierLimits.freemium;
    const rateLimiter = createRateLimiter(config);
    
    rateLimiter(req, res, next);
  };
};

export const tierBasedLimits = {
  search: {
    freemium: { windowMs: 60 * 1000, maxRequests: 10 },
    basic: { windowMs: 60 * 1000, maxRequests: 25 },
    gold: { windowMs: 60 * 1000, maxRequests: 50 },
    platinum: { windowMs: 60 * 1000, maxRequests: 100 },
    enterprise: { windowMs: 60 * 1000, maxRequests: 500 },
    admin: { windowMs: 60 * 1000, maxRequests: 1000 }
  },
  ai: {
    freemium: { windowMs: 60 * 1000, maxRequests: 2 },
    basic: { windowMs: 60 * 1000, maxRequests: 5 },
    gold: { windowMs: 60 * 1000, maxRequests: 15 },
    platinum: { windowMs: 60 * 1000, maxRequests: 30 },
    enterprise: { windowMs: 60 * 1000, maxRequests: 100 },
    admin: { windowMs: 60 * 1000, maxRequests: 200 }
  }
};