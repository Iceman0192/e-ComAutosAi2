import { 
  type User, 
  type UpsertUser, 
  type SaleHistory, 
  type InsertSaleHistory,
  type Vehicle,
  type InsertVehicle,
  type UserUsage,
  type InsertUserUsage
} from "@shared/schema";

// Modify the interface with any CRUD methods you might need
export interface IStorage {
  // User methods for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Usage tracking methods
  getUserUsage(userId: string): Promise<UserUsage | undefined>;
  incrementUsage(userId: string, type: 'search' | 'vin' | 'export'): Promise<void>;
  checkUsageLimit(userId: string, type: 'search' | 'vin' | 'export'): Promise<boolean>;
  resetDailyUsage(): Promise<void>;
  resetMonthlyUsage(): Promise<void>;
  
  // Sales history methods
  getSaleHistory(id: string): Promise<SaleHistory | undefined>;
  getSaleHistoriesByVin(vin: string): Promise<SaleHistory[]>;
  createSaleHistory(saleHistory: InsertSaleHistory): Promise<SaleHistory>;
  
  // Vehicle methods
  getVehicle(vin: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(vin: string, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
}



import { db } from "./db";
import { users, salesHistory, vehicles, userUsage } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";
// Plan limits - aligned with pricing structure
const PLAN_LIMITS = {
  freemium: { dailySearches: 10, monthlyVinLookups: 5, monthlyExports: 10 },
  basic: { dailySearches: 33, monthlyVinLookups: 25, monthlyExports: 100 }, // ~1000 monthly searches
  gold: { dailySearches: 167, monthlyVinLookups: 100, monthlyExports: 500 }, // ~5000 monthly searches  
  platinum: { dailySearches: -1, monthlyVinLookups: -1, monthlyExports: -1 },
  enterprise: { dailySearches: -1, monthlyVinLookups: -1, monthlyExports: -1 },
  admin: { dailySearches: -1, monthlyVinLookups: -1, monthlyExports: -1 }
} as const;

export class DatabaseStorage implements IStorage {
  // User operations for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getSaleHistory(id: string): Promise<SaleHistory | undefined> {
    const [saleHistory] = await db.select().from(salesHistory).where(eq(salesHistory.id, id));
    return saleHistory || undefined;
  }

  async getSaleHistoriesByVin(vin: string): Promise<SaleHistory[]> {
    return await db.select().from(salesHistory).where(eq(salesHistory.vin, vin));
  }

  async createSaleHistory(insertSaleHistory: InsertSaleHistory): Promise<SaleHistory> {
    const [saleHistory] = await db
      .insert(salesHistory)
      .values(insertSaleHistory)
      .returning();
    return saleHistory;
  }

  async getVehicle(vin: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.vin, vin));
    return vehicle || undefined;
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db
      .insert(vehicles)
      .values(insertVehicle)
      .returning();
    return vehicle;
  }

  async updateVehicle(vin: string, partialVehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const [vehicle] = await db
      .update(vehicles)
      .set(partialVehicle)
      .where(eq(vehicles.vin, vin))
      .returning();
    return vehicle || undefined;
  }

  // Usage tracking methods
  async getUserUsage(userId: string): Promise<UserUsage | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [usage] = await db
      .select()
      .from(userUsage)
      .where(
        and(
          eq(userUsage.userId, userId),
          gte(userUsage.date, today)
        )
      );
    
    return usage || undefined;
  }

  async incrementUsage(userId: string, type: 'search' | 'vin' | 'export'): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get or create today's usage record
    let [usage] = await db
      .select()
      .from(userUsage)
      .where(
        and(
          eq(userUsage.userId, userId),
          gte(userUsage.date, today)
        )
      );

    if (!usage) {
      // Create new usage record for today
      [usage] = await db
        .insert(userUsage)
        .values({
          userId,
          date: today,
          searches: type === 'search' ? 1 : 0,
          vinSearches: type === 'vin' ? 1 : 0,
          exports: type === 'export' ? 1 : 0
        })
        .returning();
    } else {
      // Update existing record
      const updateData: any = {};
      if (type === 'search') updateData.searches = usage.searches + 1;
      if (type === 'vin') updateData.vinSearches = usage.vinSearches + 1;
      if (type === 'export') updateData.exports = usage.exports + 1;

      await db
        .update(userUsage)
        .set(updateData)
        .where(eq(userUsage.id, usage.id));
    }
  }

  async checkUsageLimit(userId: string, type: 'search' | 'vin' | 'export'): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const limits = PLAN_LIMITS[user.role as keyof typeof PLAN_LIMITS];
    if (!limits) return false;

    // Check if unlimited
    if (type === 'search' && limits.dailySearches === -1) return true;
    if (type === 'vin' && limits.monthlyVinLookups === -1) return true;
    if (type === 'export' && limits.monthlyExports === -1) return true;

    const usage = await this.getUserUsage(userId);
    if (!usage) return true; // No usage yet, so allowed

    // Check daily/monthly limits
    if (type === 'search') {
      return usage.searches < limits.dailySearches;
    }
    
    if (type === 'vin') {
      // For VIN and export, check monthly usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const monthlyUsage = await db
        .select()
        .from(userUsage)
        .where(
          and(
            eq(userUsage.userId, userId),
            gte(userUsage.date, startOfMonth)
          )
        );
      
      const totalVinSearches = monthlyUsage.reduce((sum, record) => sum + record.vinSearches, 0);
      return totalVinSearches < limits.monthlyVinLookups;
    }
    
    if (type === 'export') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const monthlyUsage = await db
        .select()
        .from(userUsage)
        .where(
          and(
            eq(userUsage.userId, userId),
            gte(userUsage.date, startOfMonth)
          )
        );
      
      const totalExports = monthlyUsage.reduce((sum, record) => sum + record.exports, 0);
      return totalExports < limits.monthlyExports;
    }

    return false;
  }

  async resetDailyUsage(): Promise<void> {
    // Daily usage is automatically reset by date-based queries
    // No action needed as we query by current date
  }

  async resetMonthlyUsage(): Promise<void> {
    // Monthly usage is automatically calculated by date range queries
    // No action needed as we calculate monthly totals from daily records
  }
}

export const storage = new DatabaseStorage();
