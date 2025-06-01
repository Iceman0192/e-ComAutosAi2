import type { Express, Request, Response } from "express";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: ['Basic search', '50 searches/month', 'Standard support'],
    limits: {
      searches: 50,
      exports: 0,
      platforms: 1
    }
  },
  gold: {
    name: 'Gold',
    price: 49,
    priceId: process.env.STRIPE_GOLD_PRICE_ID || 'price_gold_monthly',
    features: ['Advanced filters', 'Both platforms', '500 searches/month', 'Priority support'],
    limits: {
      searches: 500,
      exports: 10,
      platforms: 2
    }
  },
  platinum: {
    name: 'Platinum',
    price: 99,
    priceId: process.env.STRIPE_PLATINUM_PRICE_ID || 'price_platinum_monthly',
    features: ['Cross-platform analysis', 'AI insights', 'Unlimited searches', 'Data export'],
    limits: {
      searches: -1, // unlimited
      exports: -1,
      platforms: 2
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly',
    features: ['All features', 'Team management', 'Admin tools', 'White-label'],
    limits: {
      searches: -1,
      exports: -1,
      platforms: 2
    }
  }
};

export function setupSubscriptionRoutes(app: Express) {
  
  // Get subscription plans
  app.get('/api/subscription/plans', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: SUBSCRIPTION_PLANS
    });
  });

  // Create checkout session for subscription
  app.post('/api/subscription/create-checkout', async (req: Request, res: Response) => {
    try {
      const { planId, userId } = req.body;
      
      if (!planId || planId === 'free') {
        return res.status(400).json({
          success: false,
          message: 'Invalid plan selected'
        });
      }

      const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
      if (!plan || !plan.priceId) {
        return res.status(400).json({
          success: false,
          message: 'Plan not found'
        });
      }

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/billing?canceled=true`,
        customer_email: (req as any).user?.email,
        metadata: {
          userId: userId || (req as any).user?.id || 'demo-user',
          planId: planId
        },
      });

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url
        }
      });

    } catch (error: any) {
      console.error('Checkout session creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create checkout session',
        error: error.message
      });
    }
  });

  // Get customer subscription status
  app.get('/api/subscription/status', async (req: Request, res: Response) => {
    try {
      // For demo purposes, return current user subscription
      // In production, this would query the database for the user's Stripe customer ID
      const userId = (req as any).user?.id || 'demo-user';
      
      res.json({
        success: true,
        data: {
          plan: 'free',
          status: 'active',
          nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          usage: {
            searches: 127,
            searchLimit: 500,
            exports: 3,
            exportLimit: 10
          }
        }
      });

    } catch (error: any) {
      console.error('Subscription status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get subscription status',
        error: error.message
      });
    }
  });

  // Cancel subscription
  app.post('/api/subscription/cancel', async (req: Request, res: Response) => {
    try {
      const { subscriptionId } = req.body;
      
      if (!subscriptionId) {
        return res.status(400).json({
          success: false,
          message: 'Subscription ID required'
        });
      }

      // Cancel the subscription at period end
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      res.json({
        success: true,
        data: {
          subscription: {
            id: subscription.id,
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodEnd: subscription.current_period_end
          }
        }
      });

    } catch (error: any) {
      console.error('Subscription cancellation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel subscription',
        error: error.message
      });
    }
  });

  // Reactivate subscription
  app.post('/api/subscription/reactivate', async (req: Request, res: Response) => {
    try {
      const { subscriptionId } = req.body;
      
      if (!subscriptionId) {
        return res.status(400).json({
          success: false,
          message: 'Subscription ID required'
        });
      }

      // Reactivate the subscription
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      res.json({
        success: true,
        data: {
          subscription: {
            id: subscription.id,
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          }
        }
      });

    } catch (error: any) {
      console.error('Subscription reactivation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reactivate subscription',
        error: error.message
      });
    }
  });

  // Webhook handler for Stripe events
  app.post('/api/webhooks/stripe', async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !endpointSecret) {
      return res.status(400).send('Missing signature or webhook secret');
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);
        // Update user subscription in database
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object;
        console.log('Subscription updated:', subscription.id);
        // Update subscription status in database
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        console.log('Subscription deleted:', deletedSubscription.id);
        // Handle subscription cancellation
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log('Payment succeeded:', invoice.id);
        // Handle successful payment
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log('Payment failed:', failedInvoice.id);
        // Handle failed payment
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });
}