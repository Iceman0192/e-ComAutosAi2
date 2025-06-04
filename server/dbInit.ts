import { db } from './db';
import { subscriptionPlans } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function initializeDatabase() {
  console.log('Initializing database with subscription plans...');

  const plans = [
    {
      name: 'Freemium',
      role: 'freemium' as const,
      monthlyPrice: '0',
      yearlyPrice: '0',
      stripePriceId: null,
      stripeYearlyPriceId: null,
      features: JSON.stringify([
        '10 daily searches',
        '5 VIN lookups per month',
        '10 data exports per month',
        'Basic search filters',
        'Community support'
      ]),
      isActive: true,
    },
    {
      name: 'Basic',
      role: 'basic' as const,
      monthlyPrice: '29',
      yearlyPrice: '290',
      stripePriceId: 'price_basic_monthly', // To be replaced with actual Stripe price IDs
      stripeYearlyPriceId: 'price_basic_yearly',
      features: JSON.stringify([
        '50 daily searches',
        '25 VIN lookups per month',
        '100 data exports per month',
        'Advanced search filters',
        'Export capabilities',
        'Email support'
      ]),
      isActive: true,
    },
    {
      name: 'Gold',
      role: 'gold' as const,
      monthlyPrice: '79',
      yearlyPrice: '790',
      stripePriceId: 'price_gold_monthly',
      stripeYearlyPriceId: 'price_gold_yearly',
      features: JSON.stringify([
        '200 daily searches',
        '100 VIN lookups per month',
        '500 data exports per month',
        'Cross-platform search',
        'Advanced analytics',
        'Bulk export tools',
        'Priority support'
      ]),
      isActive: true,
    },
    {
      name: 'Platinum',
      role: 'platinum' as const,
      monthlyPrice: '149',
      yearlyPrice: '1490',
      stripePriceId: 'price_platinum_monthly',
      stripeYearlyPriceId: 'price_platinum_yearly',
      features: JSON.stringify([
        'Unlimited searches',
        'Unlimited VIN lookups',
        'Unlimited data exports',
        'AuctionMind Pro AI Analysis',
        'Market intelligence reports',
        'API access',
        'Custom reporting',
        'White-glove support'
      ]),
      isActive: true,
    },
  ];

  try {
    for (const plan of plans) {
      const existing = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.role, plan.role))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(subscriptionPlans).values(plan);
        console.log(`Created subscription plan: ${plan.name}`);
      } else {
        console.log(`Subscription plan already exists: ${plan.name}`);
      }
    }

    console.log('Database initialization completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Database initialization failed:', error);
    return { success: false, error };
  }
}

export async function createIndexes() {
  console.log('Creating database indexes for performance...');

  try {
    // Create indexes for common search patterns
    await db.execute(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_history_make_model 
      ON sales_history(make, model);
    `);

    await db.execute(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_history_vin 
      ON sales_history(vin);
    `);

    await db.execute(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_history_year_site 
      ON sales_history(year, site);
    `);

    await db.execute(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_history_sale_date 
      ON sales_history(sale_date DESC);
    `);

    await db.execute(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_usage_user_date 
      ON user_usage(user_id, date);
    `);

    await db.execute(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_subscriptions_user_status 
      ON user_subscriptions(user_id, status);
    `);

    console.log('Database indexes created successfully');
    return { success: true };
  } catch (error) {
    console.error('Index creation failed:', error);
    return { success: false, error };
  }
}