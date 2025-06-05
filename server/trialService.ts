import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

export class TrialService {
  static async startTrial(userId: number): Promise<boolean> {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user.length) {
        throw new Error('User not found');
      }

      // Check if user has already used their trial
      if (user[0].hasUsedTrial) {
        return false;
      }

      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 days from now

      await db.update(users)
        .set({
          trialStartDate,
          trialEndDate,
          isTrialActive: true,
          hasUsedTrial: true,
          role: 'gold', // Give them gold access during trial
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      return true;
    } catch (error) {
      console.error('Error starting trial:', error);
      return false;
    }
  }

  static async checkTrialStatus(userId: number): Promise<{
    isTrialActive: boolean;
    daysRemaining: number;
    trialEndDate: Date | null;
  }> {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user.length) {
        return { isTrialActive: false, daysRemaining: 0, trialEndDate: null };
      }

      const userData = user[0];
      const now = new Date();

      if (!userData.isTrialActive || !userData.trialEndDate) {
        return { isTrialActive: false, daysRemaining: 0, trialEndDate: null };
      }

      const trialEndDate = new Date(userData.trialEndDate);
      const timeDiff = trialEndDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // If trial has expired, deactivate it
      if (daysRemaining <= 0) {
        await this.expireTrial(userId);
        return { isTrialActive: false, daysRemaining: 0, trialEndDate };
      }

      return { 
        isTrialActive: true, 
        daysRemaining: Math.max(0, daysRemaining), 
        trialEndDate 
      };
    } catch (error) {
      console.error('Error checking trial status:', error);
      return { isTrialActive: false, daysRemaining: 0, trialEndDate: null };
    }
  }

  static async expireTrial(userId: number): Promise<void> {
    try {
      await db.update(users)
        .set({
          isTrialActive: false,
          role: 'freemium', // Downgrade to freemium after trial
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error expiring trial:', error);
    }
  }

  static async canStartTrial(userId: number): Promise<boolean> {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user.length) {
        return false;
      }

      return !user[0].hasUsedTrial;
    } catch (error) {
      console.error('Error checking trial eligibility:', error);
      return false;
    }
  }
}