import { Express, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../auth/unifiedAuth';
import { UsageService } from '../services/usageService';

export function setupUsageRoutes(app: Express) {
  // Get current usage
  app.get('/api/usage', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const usage = await UsageService.getUserUsage(req.user!.id);
      const limits = UsageService.getLimitsForRole(req.user!.role);
      
      res.json({
        success: true,
        usage,
        limits
      });
    } catch (error) {
      console.error('Get usage error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch usage data' 
      });
    }
  });
  
  // Check if action is allowed
  app.post('/api/usage/check', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { eventType } = req.body;
      
      const result = await UsageService.checkUsageLimit(
        req.user!.id,
        req.user!.role,
        eventType
      );
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Check usage error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to check usage limit' 
      });
    }
  });
  
  // Track usage (called after successful action)
  app.post('/api/usage/track', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { eventType, metadata } = req.body;
      
      // First check if allowed
      const limitCheck = await UsageService.checkUsageLimit(
        req.user!.id,
        req.user!.role,
        eventType
      );
      
      if (!limitCheck.allowed) {
        return res.status(429).json({
          success: false,
          message: limitCheck.reason
        });
      }
      
      // Track the event
      await UsageService.trackEvent(req.user!.id, eventType, metadata);
      
      // Return updated usage
      const usage = await UsageService.getUserUsage(req.user!.id);
      
      res.json({
        success: true,
        usage
      });
    } catch (error) {
      console.error('Track usage error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to track usage' 
      });
    }
  });
}