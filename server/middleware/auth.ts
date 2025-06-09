import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

interface SessionRequest extends Request {
  session?: any;
  user?: any;
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    username: string;
    email: string;
    name: string;
    role: 'freemium' | 'basic' | 'gold' | 'platinum' | 'enterprise' | 'admin';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
}

// Attach user to request for authenticated sessions
export async function attachUser(req: SessionRequest, res: Response, next: NextFunction) {
  // Skip if user is already attached
  if (req.user) {
    return next();
  }

  // Check if user is authenticated via session
  if (req.session && req.session.userId) {
    try {
      const userId = req.session.userId;
      
      // Fetch real user data from database
      const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (userResult.length > 0) {
        const userData = userResult[0];
        req.user = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          name: userData.name || userData.username,
          role: userData.role,
          stripeCustomerId: userData.stripeCustomerId || undefined,
          stripeSubscriptionId: userData.stripeSubscriptionId || undefined
        };
      }
    } catch (error) {
      console.error('Error fetching user from database:', error);
    }
  }

  next();
}

export function requireAuth(req: SessionRequest, res: Response, next: NextFunction) {
  // Check if user is authenticated
  if (!req.user && (!req.session || !req.session.userId)) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Attach user if not already attached
  if (!req.user && req.session && req.session.userId) {
    const userId = req.session.userId;
    req.user = {
      id: userId,
      username: `user${userId}`,
      email: `user${userId}@example.com`,
      name: `User ${userId}`,
      role: 'admin'
    };
  }

  next();
}

export function requireRole(roles: string[]) {
  return (req: SessionRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role || 'freemium';
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
}

export function requireAdmin(req: SessionRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
}

export function requirePremium(req: SessionRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const premiumRoles = ['platinum', 'enterprise', 'admin'];
  if (!premiumRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Premium subscription required'
    });
  }

  next();
}