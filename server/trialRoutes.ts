import express from 'express';
import { TrialService } from './trialService';
import { requireAuth } from './authRoutes';

const router = express.Router();

// Start free trial
router.post('/start-trial', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user can start trial
    const canStart = await TrialService.canStartTrial(userId);
    if (!canStart) {
      return res.status(400).json({
        success: false,
        message: 'You have already used your free trial'
      });
    }

    const success = await TrialService.startTrial(userId);
    if (success) {
      res.json({
        success: true,
        message: 'Free trial started successfully! You now have 7 days of Gold access.',
        trialInfo: await TrialService.checkTrialStatus(userId)
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to start trial'
      });
    }
  } catch (error) {
    console.error('Trial start error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Check trial status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const trialStatus = await TrialService.checkTrialStatus(userId);
    const canStart = await TrialService.canStartTrial(userId);
    
    res.json({
      success: true,
      data: {
        ...trialStatus,
        canStartTrial: canStart
      }
    });
  } catch (error) {
    console.error('Trial status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check trial status'
    });
  }
});

export default router;