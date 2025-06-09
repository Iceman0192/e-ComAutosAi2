import { Request, Response, NextFunction } from 'express';
import { db } from '../db.js';
import { users } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

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
export function attachUser(req: Request & { user?: any }, res: Response, next: NextFunction) {
  // Skip if user is already attached
  if (req.user) {
    return next();
  }

  // Check if user is authenticated via session
  if (req.session && (req.session as any).userId) {
    const userId = (req.session as any).userId;
    
    // In a real implementation, you'd fetch user from database
    // For now, create a mock user based on session
    req.user = {
      id: userId,
      username: `user${userId}`,
      email: `user${userId}@example.com`,
      name: `User ${userId}`,
      role: 'admin' // Default to admin for development
    };
  }

  next();
}

export function requireAuth(req: Request & { user?: any }, res: Response, next: NextFunction) {
  // Check if user is authenticated
  if (!req.user && (!req.session || !(req.session as any).userId)) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Attach user if not already attached
  if (!req.user && req.session && (req.session as any).userId) {
    const userId = (req.session as any).userId;
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
  return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
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

export function requireAdmin(req: Request & { user?: any }, res: Response, next: NextFunction) {
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

export function requirePremium(req: Request & { user?: any }, res: Response, next: NextFunction) {
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