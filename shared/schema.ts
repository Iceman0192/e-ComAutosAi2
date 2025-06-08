import { pgTable, text, serial, integer, boolean, timestamp, numeric, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum('user_role', ['free', 'basic', 'gold', 'platinum', 'enterprise', 'admin']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRoleEnum('role').default('free').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
  isActive: boolean('is_active').default(true).notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  trialStartDate: timestamp('trial_start_date'),
  trialEndDate: timestamp('trial_end_date'),
  isTrialActive: boolean('is_trial_active').default(false).notNull(),
  hasUsedTrial: boolean('has_used_trial').default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserRole = typeof users.role.enumValues[number];

// Usage tracking tables
export const userUsage = pgTable("user_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").defaultNow().notNull(),
  searches: integer("searches").default(0).notNull(),
  aiAnalyses: integer("ai_analyses").default(0).notNull(),
  vinSearches: integer("vin_searches").default(0).notNull(),
  exports: integer("exports").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_user_usage_user_id").on(table.userId),
  dateIdx: index("idx_user_usage_date").on(table.date),
}));

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: userRoleEnum('role').notNull(),
  monthlyPrice: numeric("monthly_price").notNull(),
  yearlyPrice: numeric("yearly_price"),
  stripePriceId: text("stripe_price_id"),
  stripeYearlyPriceId: text("stripe_yearly_price_id"),
  features: text("features"), // JSON string
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  roleIdx: index("idx_subscription_plans_role").on(table.role),
  isActiveIdx: index("idx_subscription_plans_is_active").on(table.isActive),
}));

export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id, { onDelete: "restrict" }),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  status: text("status").notNull(), // active, canceled, past_due, trialing, incomplete, incomplete_expired
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_user_subscriptions_user_id").on(table.userId),
  planIdIdx: index("idx_user_subscriptions_plan_id").on(table.planId),
  statusIdx: index("idx_user_subscriptions_status").on(table.status),
}));

export const insertUserUsageSchema = createInsertSchema(userUsage);
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions);

export type InsertUserUsage = z.infer<typeof insertUserUsageSchema>;
export type UserUsage = typeof userUsage.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type UserSubscription = typeof userSubscriptions.$inferSelect;

// Database relations for proper joins and queries
import { relations } from "drizzle-orm";

export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(userSubscriptions),
  usage: many(userUsage),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  userSubscriptions: many(userSubscriptions),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [userSubscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const userUsageRelations = relations(userUsage, ({ one }) => ({
  user: one(users, {
    fields: [userUsage.userId],
    references: [users.id],
  }),
}));

// Sales history schema
// Data collection progress tracking
export const collectionProgress = pgTable("collection_progress", {
  id: serial("id").primaryKey(),
  jobId: text("job_id").notNull().unique(),
  make: text("make").notNull(),
  model: text("model"),
  yearFrom: integer("year_from").notNull(),
  yearTo: integer("year_to").notNull(),
  priority: integer("priority").notNull(),
  copartCompleted: boolean("copart_completed").default(false).notNull(),
  iaaiCompleted: boolean("iaai_completed").default(false).notNull(),
  lastCopartPage: integer("last_copart_page").default(0).notNull(),
  lastIaaiPage: integer("last_iaai_page").default(0).notNull(),
  lastCollected: timestamp("last_collected"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const salesHistory = pgTable("sales_history", {
  id: text("id").primaryKey(),
  lot_id: integer("lot_id").notNull(),
  site: integer("site").notNull(),
  base_site: text("base_site").notNull(),
  vin: text("vin").notNull(),
  sale_status: text("sale_status").notNull(),
  sale_date: timestamp("sale_date").notNull(),
  purchase_price: numeric("purchase_price"),
  buyer_state: text("buyer_state"),
  buyer_country: text("buyer_country"),
  buyer_type: text("buyer_type"),
  auction_location: text("auction_location"),
  vehicle_mileage: integer("vehicle_mileage"),
  vehicle_damage: text("vehicle_damage"),
  vehicle_title: text("vehicle_title"),
  vehicle_has_keys: boolean("vehicle_has_keys"),
  // Additional vehicle-specific information
  year: integer("year"),
  make: text("make"),
  model: text("model"),
  series: text("series"),
  trim: text("trim"),
  transmission: text("transmission"),
  drive: text("drive"),
  fuel: text("fuel"),
  engine: text("engine"),
  color: text("color"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  // Store image URLs as JSON
  images: text("images"),
  link: text("link")
});

export const insertSaleHistorySchema = createInsertSchema(salesHistory);

export type InsertSaleHistory = z.infer<typeof insertSaleHistorySchema>;
export type SaleHistory = typeof salesHistory.$inferSelect;

// Vehicle info schema
export const vehicles = pgTable("vehicles", {
  vin: text("vin").primaryKey(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  trim: text("trim"),
  mileage: integer("mileage"),
  title_status: text("title_status"),
  last_updated: timestamp("last_updated").notNull()
});

export const insertVehicleSchema = createInsertSchema(vehicles);

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

// Temporary database for fresh data (Gold/Platinum exclusive)
export const freshSalesHistory = pgTable("fresh_sales_history", {
  id: text("id").primaryKey(),
  lot_id: integer("lot_id"),
  site: integer("site").notNull(),
  base_site: text("base_site"),
  vin: text("vin"),
  sale_status: text("sale_status"),
  sale_date: timestamp("sale_date"),
  purchase_price: text("purchase_price"),
  buyer_state: text("buyer_state"),
  buyer_country: text("buyer_country"),
  buyer_type: text("buyer_type"),
  auction_location: text("auction_location"),
  vehicle_mileage: integer("vehicle_mileage"),
  vehicle_damage: text("vehicle_damage"),
  vehicle_title: text("vehicle_title"),
  vehicle_has_keys: boolean("vehicle_has_keys"),
  year: integer("year"),
  make: text("make"),
  model: text("model"),
  series: text("series"),
  trim: text("trim"),
  transmission: text("transmission"),
  drive: text("drive"),
  fuel: text("fuel"),
  engine: text("engine"),
  color: text("color"),
  images: text("images"),
  link: text("link"),
  link_img_hd: text("link_img_hd").array(),
  link_img_small: text("link_img_small").array(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  expires_at: timestamp("expires_at").notNull(), // 3-day expiration
});

export const insertFreshSalesHistorySchema = createInsertSchema(freshSalesHistory);
export type InsertFreshSalesHistory = z.infer<typeof insertFreshSalesHistorySchema>;
export type FreshSalesHistory = typeof freshSalesHistory.$inferSelect;

// API schemas for APICAR
// Updated schema based on actual APICAR API response format
export const SaleHistoryResponseSchema = z.object({
  size: z.number(),
  page: z.number(),
  pages: z.number(),
  count: z.number(),
  data: z.array(
    z.object({
      id: z.string(),
      lot_id: z.number(),
      site: z.number(),
      base_site: z.string(),
      odometer: z.number().nullable(),
      year: z.number().nullable(),
      make: z.string(),
      model: z.string(),
      series: z.string().nullable(),
      vin: z.string(),
      sale_status: z.string().optional(),
      sale_date: z.string().transform(str => new Date(str)).optional(),
      purchase_price: z.number().optional().nullable(),
      buyer_state: z.string().optional().nullable(),
      buyer_country: z.string().optional().nullable(),
      color: z.string().nullable(),
      damage_pr: z.string().nullable(),
      damage_sec: z.string().nullable(),
      keys: z.string().nullable(),
      title: z.string().nullable(),
      engine: z.string().nullable(),
      location: z.string().nullable(),
      document: z.string().nullable(),
      transmission: z.string().nullable(),
      drive: z.string().nullable(),
      fuel: z.string().nullable(),
      link_img_hd: z.array(z.string()).nullable(),
      link: z.string().nullable(),
      sale_history: z.array(
        z.object({
          id: z.string(),
          lot_id: z.number(),
          site: z.number(),
          base_site: z.string(),
          vin: z.string(),
          sale_status: z.string(),
          sale_date: z.string().transform(str => new Date(str)),
          purchase_price: z.number().optional().nullable(),
          buyer_state: z.string().optional().nullable(),
          buyer_country: z.string().optional().nullable()
        })
      ).nullable().optional()
    })
  )
});

export type SaleHistoryResponse = z.infer<typeof SaleHistoryResponseSchema>;

export const SalesFilterSchema = z.object({
  vin: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(), 
  dateRange: z.enum(['last3m', 'last6m', 'lasty', 'custom']),
  customDateStart: z.string().optional(),
  customDateEnd: z.string().optional(),
  saleStatus: z.array(z.string()).optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  buyerLocation: z.string().optional(),
  sites: z.array(z.string()).optional()
});

export type SalesFilter = z.infer<typeof SalesFilterSchema>;
