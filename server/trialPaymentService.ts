import Stripe from "stripe";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export class TrialPaymentService {
  
  // Create setup intent for trial signup - collects payment method without charging
  async createTrialSetupIntent(email: string, name: string) {
    try {
      // Create or retrieve Stripe customer
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          trial_signup: 'true',
          signup_date: new Date().toISOString()
        }
      });

      // Create setup intent for future payments
      const setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        payment_method_types: ['card'],
        usage: 'off_session', // For future payments
        metadata: {
          trial_signup: 'true',
          customer_email: email
        }
      });

      return {
        setupIntent,
        customer,
        clientSecret: setupIntent.client_secret
      };
    } catch (error) {
      console.error('Error creating trial setup intent:', error);
      throw new Error('Failed to initialize payment collection');
    }
  }

  // Confirm setup intent and save payment method
  async confirmTrialSetupIntent(setupIntentId: string, userId: number) {
    try {
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      
      if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
        // Update user with Stripe customer ID and trial info
        await db.update(users)
          .set({
            stripeCustomerId: setupIntent.customer as string,
            trialStartDate: new Date(),
            trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            isTrialActive: true,
            hasUsedTrial: true,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        return {
          success: true,
          paymentMethodId: setupIntent.payment_method,
          customerId: setupIntent.customer
        };
      } else {
        throw new Error('Setup intent not completed successfully');
      }
    } catch (error) {
      console.error('Error confirming setup intent:', error);
      throw new Error('Failed to save payment method');
    }
  }

  // Create subscription when trial ends (called by background job)
  async createSubscriptionAfterTrial(userId: number, priceId: string = 'price_basic_monthly') {
    try {
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || !user.stripeCustomerId) {
        throw new Error('User or Stripe customer not found');
      }

      // Get customer's default payment method
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      if (!customer || customer.deleted) {
        throw new Error('Stripe customer not found');
      }

      // Create subscription with trial end date
      const subscription = await stripe.subscriptions.create({
        customer: user.stripeCustomerId,
        items: [{ price: priceId }],
        trial_end: Math.floor(user.trialEndDate!.getTime() / 1000),
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          user_id: userId.toString(),
          converted_from_trial: 'true'
        }
      });

      // Update user with subscription info
      await db.update(users)
        .set({
          stripeSubscriptionId: subscription.id,
          role: 'basic', // Convert to paid plan
          isTrialActive: false,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      return subscription;
    } catch (error) {
      console.error('Error creating subscription after trial:', error);
      throw error;
    }
  }

  // Check if trial has ended and create subscription
  async processExpiredTrials() {
    try {
      const expiredTrials = await db.select()
        .from(users)
        .where(eq(users.isTrialActive, true));

      const now = new Date();
      
      for (const user of expiredTrials) {
        if (user.trialEndDate && user.trialEndDate <= now) {
          try {
            await this.createSubscriptionAfterTrial(user.id);
            console.log(`Converted trial to subscription for user ${user.id}`);
          } catch (error) {
            console.error(`Failed to convert trial for user ${user.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error processing expired trials:', error);
    }
  }

  // Cancel trial and subscription if user wants to downgrade
  async cancelTrialAndSubscription(userId: number) {
    try {
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      // Cancel Stripe subscription if exists
      if (user.stripeSubscriptionId) {
        await stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true
        });
      }

      // Update user to freemium
      await db.update(users)
        .set({
          role: 'freemium',
          isTrialActive: false,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      return { success: true };
    } catch (error) {
      console.error('Error canceling trial:', error);
      throw error;
    }
  }
}

export const trialPaymentService = new TrialPaymentService();