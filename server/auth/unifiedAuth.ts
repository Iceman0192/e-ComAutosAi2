import type { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { db } from "../db";
import { users, sessions } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";

// Unified AuthenticatedRequest interface
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    name: string;
    role: 'freemium' | 'basic' | 'gold' | 'platinum' | 'enterprise' | 'admin';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
}

// Session management using database instead of in-memory
async function createSession(userId: number): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  await db.insert(sessions).values({
    sessionId,
    userId,
    expiresAt
  });
  
  return sessionId;
}

async function getSession(sessionId: string) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.sessionId, sessionId),
        gt(sessions.expiresAt, new Date())
      )
    )
    .limit(1);
    
  return session;
}

// Unified auth middleware
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const sessionId = req.cookies.sessionId;
    
    if (!sessionId) {
      return res.status(401).json({ success: false, message: 'No session found' });
    }
    
    const session = await getSession(sessionId);
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session' });
    }
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);
      
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      stripeCustomerId: user.stripeCustomerId || undefined,
      stripeSubscriptionId: user.stripeSubscriptionId || undefined
    };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
}

export async function requireRole(roles: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    await requireAuth(req, res, () => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions' 
        });
      }
      next();
    });
  };
}

export function setupUnifiedAuth(app: Express) {
  // Signup endpoint
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    try {
      const { username, email, password, name } = req.body;
      
      // Validate input
      if (!username || !email || !password || !name) {
        return res.status(400).json({ 
          success: false, 
          message: 'All fields are required' 
        });
      }
      
      // Check if user exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
        
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'User already exists' 
        });
      }
      
      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          email,
          password: hashedPassword,
          name,
          role: 'freemium',
          trialStartDate: new Date(),
          trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 day trial
          isTrialActive: true
        })
        .returning();
        
      // Create session
      const sessionId = await createSession(newUser.id);
      
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      res.json({
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ success: false, message: 'Signup failed' });
    }
  });
  
  // Login endpoint
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
        
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }
      
      const sessionId = await createSession(user.id);
      
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Login failed' });
    }
  });
  
  // Get current user endpoint
  app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      user: req.user
    });
  });
  
  // Logout endpoint
  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    const sessionId = req.cookies.sessionId;
    
    if (sessionId) {
      await db
        .delete(sessions)
        .where(eq(sessions.sessionId, sessionId));
    }
    
    res.clearCookie('sessionId');
    res.json({ success: true, message: 'Logged out successfully' });
  });
}