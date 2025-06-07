import { Router } from 'express';
import { storage } from './storage';
import { requireAuth } from './simpleAuth';

const router = Router();

// Get user usage statistics
router.get('/usage', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const usage = await storage.getUserUsage(userId);
    
    res.json({
      success: true,
      data: usage
    });
  } catch (error) {
    console.error('Error fetching user usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage statistics'
    });
  }
});

// Increment usage counter
router.post('/increment-usage', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.body;
    
    if (!['search', 'vin', 'export'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid usage type'
      });
    }
    
    await storage.incrementUsage(userId, type);
    
    res.json({
      success: true,
      message: 'Usage incremented successfully'
    });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to increment usage'
    });
  }
});

// Check if user can perform action
router.post('/check-limit', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.body;
    
    const canPerform = await storage.checkUsageLimit(userId, type);
    
    res.json({
      success: true,
      data: { canPerform }
    });
  } catch (error) {
    console.error('Error checking usage limit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check usage limit'
    });
  }
});

// Reset daily usage (called by scheduler)
router.post('/reset-daily', async (req, res) => {
  try {
    await storage.resetDailyUsage();
    
    res.json({
      success: true,
      message: 'Daily usage reset successfully'
    });
  } catch (error) {
    console.error('Error resetting daily usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset daily usage'
    });
  }
});

// Reset monthly usage (called by scheduler)
router.post('/reset-monthly', async (req, res) => {
  try {
    await storage.resetMonthlyUsage();
    
    res.json({
      success: true,
      message: 'Monthly usage reset successfully'
    });
  } catch (error) {
    console.error('Error resetting monthly usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset monthly usage'
    });
  }
});

export default router;