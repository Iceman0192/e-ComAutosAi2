import type { Express, Request, Response } from "express";
import bcrypt from "bcrypt";
import { storage } from './storage';

// Simple in-memory user store for demo purposes
// In production, this would use the database
const users = new Map();
const sessions = new Map();

// Demo user for testing
users.set('demo@example.com', {
  id: 'demo-user',
  email: 'demo@example.com',
  username: 'demo',
  role: 'free',
  subscriptionStatus: 'active',
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  password: '$2b$10$demo.hash' // Demo password hash
});

export function setupAuthRoutes(app: Express) {
  
  // Login endpoint
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      // Get user from database
      const dbUser = await storage.getUserByEmail(email);
      if (!dbUser) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, dbUser.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      const user = {
        id: dbUser.id.toString(),
        email: dbUser.email,
        username: dbUser.username,
        role: dbUser.role,
        subscriptionStatus: 'active',
        stripeCustomerId: dbUser.stripeCustomerId,
        stripeSubscriptionId: dbUser.stripeSubscriptionId
      };
      
      // Create session
      const sessionId = `session_${Date.now()}_${Math.random()}`;
      sessions.set(sessionId, user);
      
      // Set session cookie
      res.cookie('sessionId', sessionId, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            subscriptionStatus: user.subscriptionStatus
          }
        }
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
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          subscriptionStatus: user.subscriptionStatus
        }
      }
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
  
  // Authentication middleware
  app.use((req: Request, res: Response, next) => {
    const sessionId = req.cookies?.sessionId;
    const user = sessionId ? sessions.get(sessionId) : null;
    
    if (user) {
      (req as any).user = user;
    }
    
    next();
  });
}