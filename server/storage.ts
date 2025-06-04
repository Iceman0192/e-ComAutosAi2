import { 
  type User, 
  type InsertUser, 
  type SaleHistory, 
  type InsertSaleHistory,
  type Vehicle,
  type InsertVehicle
} from "@shared/schema";

// Modify the interface with any CRUD methods you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
import { users, salesHistory, vehicles } from "@shared/schema";
import { eq } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
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
}

export const storage = new DatabaseStorage();
