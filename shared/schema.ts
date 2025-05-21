import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Sales history schema
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
  vehicle_has_keys: boolean("vehicle_has_keys")
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

// API schemas for APICAR
export const SaleHistoryResponseSchema = z.object({
  sale_history: z.array(
    z.object({
      id: z.string(),
      lot_id: z.number(),
      site: z.number(),
      base_site: z.string(),
      vin: z.string(),
      sale_status: z.string(),
      sale_date: z.string().transform(str => new Date(str)),
      purchase_price: z.number().optional(),
      buyer_state: z.string().optional(),
      buyer_country: z.string().optional(),
      buyer_type: z.string().optional(),
      auction_location: z.string().optional(),
      vehicle_mileage: z.number().optional(),
      vehicle_damage: z.string().optional(),
      vehicle_title: z.string().optional(),
      vehicle_has_keys: z.boolean().optional()
    })
  ),
  vehicle: z.object({
    vin: z.string(),
    make: z.string(),
    model: z.string(),
    year: z.number(),
    trim: z.string().optional(),
    mileage: z.number().optional(),
    title_status: z.string().optional()
  }).optional()
});

export type SaleHistoryResponse = z.infer<typeof SaleHistoryResponseSchema>;

export const SalesFilterSchema = z.object({
  vin: z.string().optional(),
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
