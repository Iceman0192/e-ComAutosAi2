import { trialPaymentService } from "./trialPaymentService";

export class TrialScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  
  // Start monitoring for expired trials
  start() {
    if (this.intervalId) {
      console.log('Trial scheduler already running');
      return;
    }

    // Check for expired trials every hour
    this.intervalId = setInterval(async () => {
      try {
        await trialPaymentService.processExpiredTrials();
        console.log('Processed expired trials check');
      } catch (error) {
        console.error('Error processing expired trials:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    console.log('Trial scheduler started - checking expired trials every hour');
  }

  // Stop monitoring
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Trial scheduler stopped');
    }
  }

  // Manual trigger for testing
  async processNow() {
    try {
      await trialPaymentService.processExpiredTrials();
      console.log('Manual trial processing completed');
    } catch (error) {
      console.error('Error in manual trial processing:', error);
      throw error;
    }
  }
}

export const trialScheduler = new TrialScheduler();