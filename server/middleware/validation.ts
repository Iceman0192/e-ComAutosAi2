import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(400, 'Validation error', true));
      } else {
        next(error);
      }
    }
  };
};

// Common validation schemas
export const authSchemas = {
  signup: z.object({
    body: z.object({
      username: z.string().min(3).max(50),
      email: z.string().email(),
      password: z.string().min(8).max(100),
      name: z.string().min(1).max(100)
    })
  }),

  login: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(1)
    })
  })
};

export const vehicleSchemas = {
  search: z.object({
    query: z.object({
      site: z.string().optional().default('1'),
      page: z.string().optional().default('1'),
      size: z.string().optional().default('25'),
      make: z.string().optional(),
      model: z.string().optional(),
      year: z.string().optional(),
      location: z.string().optional()
    })
  }),

  vinLookup: z.object({
    body: z.object({
      vin: z.string().length(17).regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'Invalid VIN format')
    })
  }),

  salesHistory: z.object({
    query: z.object({
      make: z.string().min(1),
      model: z.string().optional(),
      site: z.string().optional().default('1'),
      yearFrom: z.string().optional(),
      yearTo: z.string().optional()
    })
  })
};

export const usageSchemas = {
  trackUsage: z.object({
    body: z.object({
      eventType: z.enum(['search', 'vin_lookup', 'export', 'ai_analysis']),
      metadata: z.object({}).optional()
    })
  }),

  checkUsage: z.object({
    body: z.object({
      eventType: z.enum(['search', 'vin_lookup', 'export', 'ai_analysis'])
    })
  })
};

export const aiSchemas = {
  chat: z.object({
    body: z.object({
      message: z.string().min(1).max(2000),
      vehicleData: z.object({}).optional(),
      conversationId: z.string().optional()
    })
  }),

  auctionMind: z.object({
    body: z.object({
      vin: z.string().length(17).regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'Invalid VIN format').optional(),
      lotId: z.string().optional(),
      site: z.number().min(1).max(2).optional()
    })
  })
};

export const adminSchemas = {
  updateUserRole: z.object({
    params: z.object({
      userId: z.string().regex(/^\d+$/, 'User ID must be a number')
    }),
    body: z.object({
      role: z.enum(['freemium', 'basic', 'gold', 'platinum', 'enterprise', 'admin'])
    })
  }),

  resetUsage: z.object({
    params: z.object({
      userId: z.string().regex(/^\d+$/, 'User ID must be a number')
    })
  })
};