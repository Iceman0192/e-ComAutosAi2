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

      // Create new user with 7-day trial
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);

      const [newUser] = await db.insert(users).values({
        email,
        username,
        name: name || username,
        password: hashedPassword,
        role: 'gold', // Start with gold during trial
        isActive: true,
        trialStartDate,
        trialEndDate,
        isTrialActive: true,
        hasUsedTrial: true
      }).returning();

      // Create session
      const sessionId = `session_${Date.now()}_${Math.random()}`;
      const userSession = {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        isTrialActive: newUser.isTrialActive,
        trialEndDate: newUser.trialEndDate
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
        isTrialActive: user.isTrialActive,
        trialEndDate: user.trialEndDate
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

  // Create admin user endpoint (for development/setup)
  app.post('/api/auth/create-admin', async (req: Request, res: Response) => {
    try {
      const adminEmail = 'admin@ecomautos.com';
      const adminPassword = 'admin123';
      
      // Check if admin already exists
      const existingAdmin = await db.select()
        .from(users)
        .where(eq(users.email, adminEmail))
        .limit(1);

      if (existingAdmin.length > 0) {
        return res.json({
          success: true,
          message: 'Admin user already exists',
          credentials: {
            email: adminEmail,
            password: adminPassword
          }
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Create admin user
      const [adminUser] = await db.insert(users).values({
        email: adminEmail,
        username: 'admin',
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        trialStartDate: null,
        trialEndDate: null,
        isTrialActive: false,
        hasUsedTrial: false
      }).returning();

      res.json({
        success: true,
        message: 'Admin user created successfully',
        credentials: {
          email: adminEmail,
          password: adminPassword
        }
      });

    } catch (error: any) {
      console.error('Create admin error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create admin user'
      });
    }
  });
}