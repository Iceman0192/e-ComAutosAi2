# Complete Monetization System Analysis - Source Code Consolidation

## Current Authentication System State

### File: server/authRoutes.ts
```typescript
import type { Express, Request, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Simple in-memory session store for demo purposes
const sessions = new Map();

export function requireAuth(req: any, res: Response, next: any) {
  const sessionId = req.cookies.sessionId;
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  req.user = sessions.get(sessionId);
  next();
}

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
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    // Implementation exists but fragmented
  });
  
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    // Implementation exists but fragmented
  });
  
  app.get('/api/auth/me', (req: Request, res: Response) => {
    // Implementation exists but fragmented
  });
}
```

### File: server/simpleAuth.ts
```typescript
import type { Express, Request, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// DUPLICATE AUTH SYSTEM - CONFLICT WITH authRoutes.ts

export function requireAuth(req: any, res: Response, next: any) {
  // DIFFERENT IMPLEMENTATION THAN authRoutes.ts
}

export function setupSimpleAuth(app: Express) {
  // PARALLEL AUTH ROUTES - CAUSING CONFLICTS
}
```

## Current Usage Tracking System State

### File: client/src/contexts/UsageContext.tsx
```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

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

interface UsageStats {
  dailySearches: number;
  monthlyVinLookups: number;
  monthlyExports: number;
  monthlyAiAnalyses: number;
  lastDailyReset: string;
  lastMonthlyReset: string;
}

// ISSUE: Frontend context expects backend API that's broken
export function UsageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const refreshUsage = async () => {
    // FAILS: /api/usage endpoint has SQL errors
    try {
      const response = await fetch('/api/usage', {
        credentials: 'include'
      });
      // This endpoint is currently failing due to database issues
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    }
  };
}
```

### File: server/usageRoutes.ts (BROKEN)
```typescript
import { Express, Request, Response } from 'express';
import { db } from './db';
import { userUsageStats } from '../shared/schema'; // IMPORT ERROR
import { eq, and, sql } from 'drizzle-orm';
import { requireAuth } from './authRoutes';

// BROKEN: Type mismatch with auth system
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
  // BROKEN: SQL syntax errors
  app.get('/api/usage', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    // Database queries failing due to onConflictDoUpdate syntax errors
  });
  
  app.post('/api/increment-usage', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    // SQL update queries failing
  });
}
```

## Current Subscription System State

### File: shared/schema.ts
```typescript
// USER ROLES INCONSISTENCY
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("freemium"), // ROLE NAMING ISSUE
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// SUBSCRIPTION PLANS EXIST BUT NOT CONNECTED TO USERS
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(), // freemium, basic, gold, platinum, enterprise, admin
  monthlyPrice: text("monthly_price").notNull(),
  yearlyPrice: text("yearly_price"),
  features: text("features"), // JSON string
  limits: text("limits"), // JSON string  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// BROKEN: Schema errors preventing database updates
export const userUsageStats = pgTable('user_usage_stats', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  date: text('date').notNull(),
  period: text('period').notNull(),
  searches: integer('searches').notNull().default(0),
  vinSearches: integer('vin_searches').notNull().default(0),
  exports: integer('exports').notNull().default(0),
  aiAnalyses: integer('ai_analyses').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

### File: server/subscriptionRoutes.ts
```typescript
// STRIPE INTEGRATION EXISTS BUT NOT CONNECTED TO PERMISSIONS
export function registerSubscriptionRoutes(app: Express) {
  app.post('/api/create-checkout-session', async (req: Request, res: Response) => {
    // Stripe checkout works but doesn't update user permissions
  });
  
  app.post('/api/webhook', async (req: Request, res: Response) => {
    // Stripe webhooks exist but don't sync with usage limits
  });
}
```

## Frontend Authentication State

### File: client/src/contexts/AuthContext.tsx
```typescript
export enum UserRole {
  FREE = 'freemium',    // NAMING INCONSISTENCY
  GOLD = 'gold',
  PLATINUM = 'platinum',
  ADMIN = 'admin'
}

// AUTH CONTEXT EXPECTS WORKING BACKEND
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // FAILS: /api/auth/me returns 401 constantly
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
        }
      });
  }, []);
}
```

## Server Integration Issues

### File: server/index.ts
```typescript
// ROUTE SETUP CONFLICTS
(async () => {
  // Multiple auth systems registered
  setupSimpleAuth(app);  // First auth system
  setupAuthRoutes(app);  // Second auth system - CONFLICT
  
  // Usage routes broken
  setupUsageRoutes(app); // FAILS due to database/type errors
  
  // Admin routes work but use broken auth
  setupAdminRoutes(app);
})();
```

## Critical Problems Identified

### 1. **Dual Authentication Systems**
- `authRoutes.ts` and `simpleAuth.ts` both register conflicting routes
- Different session management approaches
- Type definitions don't match

### 2. **Database Schema Failures**
- `userUsageStats` table can't be created due to syntax errors
- Foreign key relationships not properly established
- Migration commands failing

### 3. **Frontend-Backend API Mismatch**
- Frontend expects `/api/usage` endpoint that fails
- Authentication state constantly returns 401
- Usage tracking context crashes on load

### 4. **Subscription-Permission Disconnect**
- Stripe subscriptions work but don't affect user permissions
- User roles exist but aren't connected to subscription plans
- Usage limits defined in frontend but not enforced in backend

### 5. **Type System Inconsistencies**
- `AuthenticatedRequest` interfaces differ between files
- Role naming inconsistent ('free' vs 'freemium')
- SQL query type errors preventing database operations

## Required Actions for Resolution

1. **Choose Single Auth System**: Consolidate to one authentication approach
2. **Fix Database Schema**: Resolve SQL syntax errors and create missing tables
3. **Connect Subscriptions to Permissions**: Link Stripe webhooks to user role updates
4. **Repair Usage Tracking**: Fix SQL queries and API endpoints
5. **Unify Type Definitions**: Standardize interfaces across frontend/backend
6. **Test Integration**: Ensure end-to-end auth -> subscription -> permissions flow

## Current System Status: 🚨 BROKEN 🚨
**Authentication**: Non-functional (401 errors)
**Usage Tracking**: Broken (database errors)
**Subscriptions**: Disconnected (no permission updates)
**Monetization**: Completely non-functional

## Recommended Immediate Action
1. Choose primary authentication system
2. Fix database schema syntax errors
3. Create working auth -> permissions pipeline
4. Test with real user signup/login flow