import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
        name: string;
        role: 'freemium' | 'basic' | 'gold' | 'platinum' | 'admin';
        stripeCustomerId?: string;
        stripeSubscriptionId?: string;
      };
      isAuthenticated(): boolean;
      trackUsage?: () => Promise<void>;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: NonNullable<Request['user']>;
}