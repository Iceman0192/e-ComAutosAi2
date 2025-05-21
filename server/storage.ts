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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private saleHistories: Map<string, SaleHistory>;
  private vehicles: Map<string, Vehicle>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.saleHistories = new Map();
    this.vehicles = new Map();
    this.currentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Sales history methods
  async getSaleHistory(id: string): Promise<SaleHistory | undefined> {
    return this.saleHistories.get(id);
  }
  
  async getSaleHistoriesByVin(vin: string): Promise<SaleHistory[]> {
    return Array.from(this.saleHistories.values()).filter(
      (saleHistory) => saleHistory.vin === vin,
    );
  }
  
  async createSaleHistory(insertSaleHistory: InsertSaleHistory): Promise<SaleHistory> {
    const saleHistory = insertSaleHistory as SaleHistory;
    this.saleHistories.set(saleHistory.id, saleHistory);
    return saleHistory;
  }
  
  // Vehicle methods
  async getVehicle(vin: string): Promise<Vehicle | undefined> {
    return this.vehicles.get(vin);
  }
  
  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const vehicle = insertVehicle as Vehicle;
    this.vehicles.set(vehicle.vin, vehicle);
    return vehicle;
  }
  
  async updateVehicle(vin: string, partialVehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const existingVehicle = this.vehicles.get(vin);
    
    if (!existingVehicle) {
      return undefined;
    }
    
    const updatedVehicle = { ...existingVehicle, ...partialVehicle };
    this.vehicles.set(vin, updatedVehicle);
    
    return updatedVehicle;
  }
}

export const storage = new MemStorage();
