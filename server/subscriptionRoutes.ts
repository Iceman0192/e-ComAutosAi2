import type { Express, Request, Response } from "express";
import Stripe from "stripe";
import { db } from "./db";
import { users, subscriptionPlans, userSubscriptions } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { AuthenticatedRequest } from "./authTypes";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export function registerSubscriptionRoutes(app: Express) {
  // Get available subscription plans
  app.get("/api/subscription/plans", async (req, res) => {
    try {
      const plans = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true));

      const formattedPlans = plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        role: plan.role,
        monthlyPrice: parseFloat(plan.monthlyPrice),
        yearlyPrice: plan.yearlyPrice ? parseFloat(plan.yearlyPrice) : null,
        features: plan.features ? JSON.parse(plan.features) : [],
        stripePriceId: plan.stripePriceId,
        stripeYearlyPriceId: plan.stripeYearlyPriceId,
      }));

      res.json({ success: true, plans: formattedPlans });
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch subscription plans' });
    }
  });

  // Create subscription checkout session
  app.post("/api/subscription/create-checkout", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
      const { planId, billing = 'monthly' } = req.body;
      const user = req.user;

      // Get plan details
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId))
        .limit(1);

      if (!plan) {
        return res.status(404).json({ success: false, message: 'Plan not found' });
      }

      const priceId = billing === 'yearly' ? plan.stripeYearlyPriceId : plan.stripePriceId;
      if (!priceId) {
        return res.status(400).json({ success: false, message: 'Price ID not configured for this billing cycle' });
      }

      // Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: user.id.toString(),
          },
        });
        stripeCustomerId = customer.id;

        // Update user with customer ID
        await db
          .update(users)
          .set({ stripeCustomerId })
          .where(eq(users.id, user.id));
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/dashboard?subscription=success`,
        cancel_url: `${req.headers.origin}/billing?subscription=cancelled`,
        metadata: {
          userId: user.id.toString(),
          planId: planId.toString(),
        },
      });

      res.json({ success: true, sessionUrl: session.url });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ success: false, message: 'Failed to create checkout session' });
    }
  });

  // Get user's current subscription
  app.get("/api/subscription/current", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
      const user = req.user;

      const [subscription] = await db
        .select({
          subscription: userSubscriptions,
          plan: subscriptionPlans,
        })
        .from(userSubscriptions)
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(eq(userSubscriptions.userId, user.id))
        .orderBy(userSubscriptions.createdAt)
        .limit(1);

      if (!subscription) {
        return res.json({ success: true, subscription: null });
      }

      // Get Stripe subscription details if available
      let stripeSubscription = null;
      if (subscription.subscription.stripeSubscriptionId) {
        try {
          stripeSubscription = await stripe.subscriptions.retrieve(
            subscription.subscription.stripeSubscriptionId
          );
        } catch (error) {
          console.error('Error fetching Stripe subscription:', error);
        }
      }

      res.json({
        success: true,
        subscription: {
          id: subscription.subscription.id,
          planName: subscription.plan?.name,
          status: subscription.subscription.status,
          currentPeriodStart: subscription.subscription.currentPeriodStart,
          currentPeriodEnd: subscription.subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.subscription.cancelAtPeriodEnd,
          stripeSubscription,
        },
      });
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch subscription' });
    }
  });

  // Cancel subscription
  app.post("/api/subscription/cancel", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
      const user = req.user;

      const [subscription] = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, user.id))
        .limit(1);

      if (!subscription || !subscription.stripeSubscriptionId) {
        return res.status(404).json({ success: false, message: 'No active subscription found' });
      }

      // Cancel at period end in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      // Update local record
      await db
        .update(userSubscriptions)
        .set({ cancelAtPeriodEnd: true })
        .where(eq(userSubscriptions.id, subscription.id));

      res.json({ success: true, message: 'Subscription will be cancelled at the end of the current period' });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({ success: false, message: 'Failed to cancel subscription' });
    }
  });

  // Stripe webhook handler
  app.post("/api/subscription/webhook", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send('Webhook signature verification failed');
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object);
          break;
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object);
          break;
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });
}

async function handleCheckoutCompleted(session: any) {
  const userId = parseInt(session.metadata.userId);
  const planId = parseInt(session.metadata.planId);

  // Get plan details to determine role
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, planId))
    .limit(1);

  if (!plan) {
    console.error('Plan not found for checkout session:', planId);
    return;
  }

  // Update user role
  await db
    .update(users)
    .set({ 
      role: plan.role,
      stripeSubscriptionId: session.subscription,
    })
    .where(eq(users.id, userId));

  // Create subscription record
  await db.insert(userSubscriptions).values({
    userId,
    planId,
    stripeSubscriptionId: session.subscription,
    status: 'active',
  });
}

async function handleSubscriptionUpdated(subscription: any) {
  await db
    .update(userSubscriptions)
    .set({
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    })
    .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));
}

async function handleSubscriptionDeleted(subscription: any) {
  // Downgrade user to freemium
  const [userSub] = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (userSub) {
    await db
      .update(users)
      .set({ role: 'freemium' })
      .where(eq(users.id, userSub.userId));

    await db
      .update(userSubscriptions)
      .set({ status: 'cancelled' })
      .where(eq(userSubscriptions.id, userSub.id));
  }
}

async function handlePaymentSucceeded(invoice: any) {
  // Update subscription status if needed
  if (invoice.subscription) {
    await db
      .update(userSubscriptions)
      .set({ status: 'active' })
      .where(eq(userSubscriptions.stripeSubscriptionId, invoice.subscription));
  }
}

async function handlePaymentFailed(invoice: any) {
  // Update subscription status
  if (invoice.subscription) {
    await db
      .update(userSubscriptions)
      .set({ status: 'past_due' })
      .where(eq(userSubscriptions.stripeSubscriptionId, invoice.subscription));
  }
}