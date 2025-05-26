import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("FREE"),
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
