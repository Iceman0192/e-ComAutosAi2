import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { z } from "zod";
import { SaleHistoryResponseSchema, SalesFilterSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

const APICAR_BASE_URL = process.env.APICAR_BASE_URL || "https://api.apicar.com";
const APICAR_API_KEY = process.env.APICAR_API_KEY || "";

// Simple in-memory cache with expiration
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

async function cachedApiRequest(url: string): Promise<any> {
  const cacheKey = url;
  const now = Date.now();
  
  // Check if we have a valid cached response
  if (cache.has(cacheKey)) {
    const cachedResponse = cache.get(cacheKey)!;
    if (cachedResponse.expiry > now) {
      return cachedResponse.data;
    }
    // Expired cache, remove it
    cache.delete(cacheKey);
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${APICAR_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    // Cache the response
    cache.set(cacheKey, {
      data: response.data,
      expiry: now + CACHE_TTL,
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      throw new Error(`API Error (${status}): ${message}`);
    }
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get sales history for a VIN
  app.get('/api/sales-history', async (req, res) => {
    try {
      // Validate and parse request query parameters
      const filter = SalesFilterSchema.parse({
        vin: req.query.vin,
        dateRange: req.query.dateRange || 'last3m',
        customDateStart: req.query.customDateStart,
        customDateEnd: req.query.customDateEnd,
        saleStatus: req.query.saleStatus ? 
          (Array.isArray(req.query.saleStatus) ? req.query.saleStatus : [req.query.saleStatus]) : 
          undefined,
        priceMin: req.query.priceMin ? Number(req.query.priceMin) : undefined,
        priceMax: req.query.priceMax ? Number(req.query.priceMax) : undefined,
        buyerLocation: req.query.buyerLocation,
        sites: req.query.sites ? 
          (Array.isArray(req.query.sites) ? req.query.sites : [req.query.sites]) : 
          undefined
      });

      if (!filter.vin) {
        return res.status(400).json({ message: 'VIN is required' });
      }

      // Build API URL
      const apiUrl = `${APICAR_BASE_URL}/sales-history?vin=${filter.vin}`;
      
      // Fetch data from API
      const apiData = await cachedApiRequest(apiUrl);
      
      // Validate API response
      const validatedData = SaleHistoryResponseSchema.parse(apiData);
      
      // Apply filters to data
      let filteredSales = validatedData.sale_history;
      
      // Date range filter
      const today = new Date();
      let startDate: Date;
      
      switch (filter.dateRange) {
        case 'last3m':
          startDate = new Date(today);
          startDate.setMonth(today.getMonth() - 3);
          break;
        case 'last6m':
          startDate = new Date(today);
          startDate.setMonth(today.getMonth() - 6);
          break;
        case 'lasty':
          startDate = new Date(today);
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        case 'custom':
          if (filter.customDateStart && filter.customDateEnd) {
            startDate = new Date(filter.customDateStart);
            const endDate = new Date(filter.customDateEnd);
            filteredSales = filteredSales.filter(sale => 
              sale.sale_date >= startDate && sale.sale_date <= endDate
            );
          } else {
            // Default to 3 months if custom dates aren't provided
            startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 3);
          }
          break;
        default:
          startDate = new Date(today);
          startDate.setMonth(today.getMonth() - 3);
      }
      
      // Apply date filter for non-custom ranges
      if (filter.dateRange !== 'custom') {
        filteredSales = filteredSales.filter(sale => sale.sale_date >= startDate);
      }
      
      // Sale status filter
      if (filter.saleStatus && filter.saleStatus.length > 0) {
        filteredSales = filteredSales.filter(sale => 
          filter.saleStatus!.includes(sale.sale_status)
        );
      }
      
      // Price range filter
      if (filter.priceMin !== undefined) {
        filteredSales = filteredSales.filter(sale => 
          sale.purchase_price !== undefined && sale.purchase_price >= filter.priceMin!
        );
      }
      
      if (filter.priceMax !== undefined) {
        filteredSales = filteredSales.filter(sale => 
          sale.purchase_price !== undefined && sale.purchase_price <= filter.priceMax!
        );
      }
      
      // Buyer location filter
      if (filter.buyerLocation) {
        filteredSales = filteredSales.filter(sale => 
          sale.buyer_state === filter.buyerLocation || 
          sale.buyer_country === filter.buyerLocation
        );
      }
      
      // Sites filter
      if (filter.sites && filter.sites.length > 0) {
        filteredSales = filteredSales.filter(sale => 
          filter.sites!.includes(sale.base_site)
        );
      }
      
      // Calculate statistics
      const salesCount = filteredSales.length;
      
      // Calculate average price (only for sold items with a price)
      const soldSales = filteredSales.filter(sale => 
        sale.sale_status === 'Sold' && sale.purchase_price !== undefined
      );
      
      const avgPrice = soldSales.length > 0 
        ? soldSales.reduce((sum, sale) => sum + (sale.purchase_price || 0), 0) / soldSales.length 
        : 0;
      
      // Calculate sale success rate
      const successRate = filteredSales.length > 0 
        ? (soldSales.length / filteredSales.length) * 100 
        : 0;
      
      // Group by location for geographic analysis
      const locationCounts = filteredSales.reduce((acc, sale) => {
        if (sale.buyer_state) {
          acc[sale.buyer_state] = (acc[sale.buyer_state] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      // Top locations
      const topLocations = Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([state, count]) => ({ state, count }));
      
      // Price trends - calculate monthly averages
      const monthlyPrices = filteredSales.reduce((acc, sale) => {
        if (sale.purchase_price) {
          const month = `${sale.sale_date.getFullYear()}-${(sale.sale_date.getMonth() + 1).toString().padStart(2, '0')}`;
          if (!acc[month]) {
            acc[month] = { sum: 0, count: 0 };
          }
          acc[month].sum += sale.purchase_price;
          acc[month].count += 1;
        }
        return acc;
      }, {} as Record<string, { sum: number, count: number }>);
      
      const priceTrend = Object.entries(monthlyPrices).map(([month, { sum, count }]) => ({
        month,
        avgPrice: sum / count
      })).sort((a, b) => a.month.localeCompare(b.month));
      
      // Calculate price trend percentage
      let trendPercentage = 0;
      if (priceTrend.length >= 2) {
        const firstPrice = priceTrend[0].avgPrice;
        const lastPrice = priceTrend[priceTrend.length - 1].avgPrice;
        trendPercentage = ((lastPrice - firstPrice) / firstPrice) * 100;
      }
      
      // Return the processed data
      res.json({
        salesHistory: filteredSales,
        vehicle: validatedData.vehicle,
        stats: {
          totalSales: salesCount,
          averagePrice: avgPrice,
          successRate: successRate,
          topLocations: topLocations,
          priceTrend: trendPercentage
        },
        priceTrend: priceTrend,
        geographicData: Object.entries(locationCounts).map(([state, count]) => ({ state, count }))
      });
      
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error('Error fetching sales history:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    }
  });

  // Get summary statistics for dashboard
  app.get('/api/sales-stats', async (req, res) => {
    try {
      const vin = req.query.vin as string;
      
      if (!vin) {
        return res.status(400).json({ message: 'VIN is required' });
      }
      
      // Similar implementation as above endpoint but focused on stats only
      const apiUrl = `${APICAR_BASE_URL}/sales-history?vin=${vin}`;
      const apiData = await cachedApiRequest(apiUrl);
      const validatedData = SaleHistoryResponseSchema.parse(apiData);
      
      // Calculate high-level stats
      const salesCount = validatedData.sale_history.length;
      
      const soldSales = validatedData.sale_history.filter(sale => 
        sale.sale_status === 'Sold' && sale.purchase_price !== undefined
      );
      
      const avgPrice = soldSales.length > 0 
        ? soldSales.reduce((sum, sale) => sum + (sale.purchase_price || 0), 0) / soldSales.length 
        : 0;
      
      const successRate = validatedData.sale_history.length > 0 
        ? (soldSales.length / validatedData.sale_history.length) * 100 
        : 0;
      
      res.json({
        totalSales: salesCount,
        averagePrice: avgPrice,
        successRate: successRate
      });
      
    } catch (error) {
      console.error('Error fetching sales stats:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
