# Complete Source Code Files - Monetization System

## 1. Authentication System - Primary File (server/authRoutes.ts)

```typescript
import type { Express, Request, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Simple in-memory session store for demo purposes
// In production, this would use a proper session store
const sessions = new Map();

// Middleware to check authentication
export function requireAuth(req: any, res: Response, next: any) {
  const sessionId = req.cookies.sessionId;
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  req.user = sessions.get(sessionId);
  next();
}

// Middleware to check admin role
export function requireAdmin(req: any, res: Response, next: any) {
  const sessionId = req.cookies.sessionId;
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const user = sessions.get(sessionId);
  if (user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  req.user = user;
  next();
}

export function setupAuthRoutes(app: Express) {
  
  // Signup endpoint
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    try {
      const { email, password, username, name } = req.body;
      
      if (!email || !password || !username) {
        return res.status(400).json({
          success: false,
          message: 'Email, password, and username are required'
        });
      }

      // Check if user already exists
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const [newUser] = await db.insert(users).values({
        email,
        username,
        name: name || username,
        password: hashedPassword,
        role: 'freemium',
        isActive: true
      }).returning();

      // Create session
      const sessionId = `session_${Date.now()}_${Math.random()}`;
      const userSession = {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        isActive: newUser.isActive
      };
      sessions.set(sessionId, userSession);
      
      // Set session cookie
      res.cookie('sessionId', sessionId, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({
        success: true,
        message: 'Account created successfully! Your 7-day free trial has started.',
        user: userSession
      });

    } catch (error: any) {
      console.error('Signup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create account'
      });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find user in database
      const [user] = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account has been deactivated. Please contact support.'
        });
      }

      // Update last login
      await db.update(users)
        .set({ 
          lastLoginAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      // Create session
      const sessionId = `session_${Date.now()}_${Math.random()}`;
      const userSession = {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      };
      sessions.set(sessionId, userSession);
      
      // Set session cookie
      res.cookie('sessionId', sessionId, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      res.json({
        success: true,
        message: 'Login successful',
        user: userSession
      });
      
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  });
  
  // Get current user
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const sessionId = req.cookies?.sessionId;
    const user = sessionId ? sessions.get(sessionId) : null;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    res.json({
      success: true,
      user: user
    });
  });
  
  // Logout endpoint
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const sessionId = req.cookies?.sessionId;
    if (sessionId) {
      sessions.delete(sessionId);
    }
    
    res.clearCookie('sessionId');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
}
```

## 2. Authentication System - Conflicting File (server/simpleAuth.ts)

```typescript
import type { Express, Request, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { trialPaymentService } from "./trialPaymentService";

// Simple in-memory session store
const sessions = new Map();

// IDENTICAL MIDDLEWARE TO authRoutes.ts - CAUSING CONFLICTS
export function requireAuth(req: any, res: Response, next: any) {
  const sessionId = req.cookies.sessionId;
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  req.user = sessions.get(sessionId);
  next();
}

export function setupSimpleAuth(app: Express) {
  // DUPLICATE ROUTES - CONFLICTING WITH authRoutes.ts
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    // Different implementation using role: 'free' instead of 'freemium'
    const [newUser] = await db.insert(users).values({
      role: 'free', // ROLE INCONSISTENCY
    });
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    // Duplicate login logic
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    // Duplicate me endpoint
  });
}
```

## 3. Usage Tracking System (server/usageRoutes.ts)

```typescript
import { Express, Request, Response } from 'express';
import { db } from './db';
import { userUsageStats } from '../shared/schema'; // IMPORT ERROR - TABLE DOESN'T EXIST
import { eq, and, sql } from 'drizzle-orm';
import { requireAuth } from './authRoutes';

// TYPE MISMATCH WITH AUTH SYSTEM
interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    username: string;
    email: string;
    name: string;
    role: 'freemium' | 'basic' | 'gold' | 'platinum' | 'admin';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
}

export function setupUsageRoutes(app: Express) {
  // Get user usage stats
  app.get('/api/usage', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().substring(0, 7);

      // BROKEN: userUsageStats table doesn't exist in schema
      let dailyStats = await db.select()
        .from(userUsageStats)
        .where(and(
          eq(userUsageStats.userId, userId),
          eq(userUsageStats.date, today),
          eq(userUsageStats.period, 'daily')
        ))
        .limit(1);

      // SQL SYNTAX ERROR: onConflictDoUpdate incorrect
      if (dailyStats.length === 0) {
        await db.insert(userUsageStats).values({
          userId,
          date: today,
          period: 'daily',
          searches: 0,
          vinSearches: 0,
          exports: 0,
          aiAnalyses: 0
        });
      }

      res.json({
        success: true,
        data: {
          searches: dailyStats[0].searches,
          vinSearches: monthlyStats[0].vinSearches,
          exports: monthlyStats[0].exports,
          aiAnalyses: monthlyStats[0].aiAnalyses
        }
      });
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch usage statistics'
      });
    }
  });

  // Increment usage count - BROKEN SQL
  app.post('/api/increment-usage', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // BROKEN: SQL syntax error in onConflictDoUpdate
      await db.insert(userUsageStats).values({
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
          searches: sql`${userUsageStats.searches} + 1`, // TYPE ERROR
          updatedAt: sql`now()`
        }
      });
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  });
}
```

## 4. Database Schema (shared/schema.ts)

```typescript
import { pgTable, text, serial, integer, boolean, timestamp, numeric, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum('user_role', ['freemium', 'basic', 'gold', 'platinum', 'enterprise', 'admin']);

// MAIN USERS TABLE
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRoleEnum('role').default('freemium').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
  isActive: boolean('is_active').default(true).notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  trialStartDate: timestamp('trial_start_date'),
  trialEndDate: timestamp('trial_end_date'),
  isTrialActive: boolean('is_trial_active').default(false).notNull(),
  hasUsedTrial: boolean('has_used_trial').default(false).notNull(),
});

// SUBSCRIPTION PLANS TABLE
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: userRoleEnum('role').notNull(),
  monthlyPrice: numeric("monthly_price").notNull(),
  yearlyPrice: numeric("yearly_price"),
  stripePriceId: text("stripe_price_id"),
  stripeYearlyPriceId: text("stripe_yearly_price_id"),
  features: text("features"), // JSON string
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// WORKING USAGE TABLE
export const userUsage = pgTable("user_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").defaultNow().notNull(),
  searches: integer("searches").default(0).notNull(),
  aiAnalyses: integer("ai_analyses").default(0).notNull(),
  vinSearches: integer("vin_searches").default(0).notNull(),
  exports: integer("exports").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// BROKEN USAGE TABLE - IMPORTED BY usageRoutes.ts
export const userUsageStats = pgTable('user_usage_stats', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  date: text('date').notNull(), // YYYY-MM-DD for daily, YYYY-MM for monthly
  period: text('period').notNull(), // 'daily' or 'monthly'
  searches: integer('searches').notNull().default(0),
  vinSearches: integer('vin_searches').notNull().default(0),
  exports: integer('exports').notNull().default(0),
  aiAnalyses: integer('ai_analyses').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
// ^ THIS TABLE CAUSES DATABASE CREATION ERRORS
```

## 5. Frontend Usage Context (client/src/contexts/UsageContext.tsx)

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// FRONTEND USAGE LIMITS - NOT CONNECTED TO DATABASE
const USAGE_LIMITS = {
  freemium: {
    dailySearches: 10,
    monthlyVinLookups: 5,
    monthlyExports: 10,
    monthlyAiAnalyses: 2,
    features: {
      basicSearch: true,
      advancedFilters: false,
      priceAlerts: false,
      bulkExport: false,
      apiAccess: false,
      prioritySupport: false,
      customReports: false
    }
  },
  // ... other tiers
};

interface UsageContextType {
  usageStats: UsageStats;
  limits: typeof USAGE_LIMITS[keyof typeof USAGE_LIMITS];
  features: typeof USAGE_LIMITS[keyof typeof USAGE_LIMITS]['features'];
  canPerformAction: (action: 'search' | 'vin' | 'export' | 'ai') => boolean;
  getRemainingUsage: () => object;
  trackUsage: (action: 'search' | 'vin' | 'export' | 'ai') => Promise<void>;
  hasFeature: (feature: string) => boolean;
  refreshUsage: () => Promise<void>;
}

export function UsageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // BROKEN: API calls fail due to backend errors
  const refreshUsage = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/usage', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // This endpoint returns 500 errors due to SQL issues
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    }
  };

  // BROKEN: trackUsage calls /api/increment-usage which fails
  const trackUsage = async (action: 'search' | 'vin' | 'export' | 'ai') => {
    if (!user) return;

    try {
      const response = await fetch('/api/increment-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ type: action })
      });
      // This endpoint fails with SQL errors
    } catch (error) {
      console.error('Failed to track usage:', error);
    }
  };
}
```

## 6. Server Integration (server/index.ts)

```typescript
// CONFLICTING AUTH SYSTEM SETUP
(async () => {
  // Two auth systems registered - CAUSING ROUTE CONFLICTS
  setupSimpleAuth(app);  // Registers /api/auth/* routes
  setupAuthRoutes(app);  // Registers same routes - CONFLICT
  
  // Admin routes depend on broken auth
  setupAdminRoutes(app);
  
  // Usage routes broken due to database issues
  setupUsageRoutes(app); // FAILS - database table doesn't exist
})();
```

## Key Problems Summary:

1. **Dual Auth Systems**: `authRoutes.ts` and `simpleAuth.ts` register identical routes
2. **Database Schema Conflicts**: `userUsage` table exists but `userUsageStats` (used by code) doesn't
3. **Role Naming Inconsistency**: 'freemium' vs 'free' in different files
4. **SQL Syntax Errors**: `onConflictDoUpdate` syntax incorrect in usageRoutes.ts
5. **Type Mismatches**: `AuthenticatedRequest` interfaces don't align
6. **API Failures**: Frontend expects working `/api/usage` and `/api/increment-usage` endpoints
7. **Session Management**: In-memory sessions lost on server restart
8. **Missing Connections**: Subscription plans exist but don't affect user permissions

## Current System Status: 
- Authentication: BROKEN (401 errors)
- Usage Tracking: BROKEN (database/SQL errors)  
- Subscriptions: DISCONNECTED (no permission updates)
- Monetization: NON-FUNCTIONAL