import type { Express, Request, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Simple in-memory session store
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

export function setupSimpleAuth(app: Express) {
  
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
      const [user] = await db.select({
        id: users.id,
        email: users.email,
        username: users.username,
        name: users.name,
        password: users.password,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt
      })
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
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
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