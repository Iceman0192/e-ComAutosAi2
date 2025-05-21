import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import axios from "axios";

const APICAR_BASE_URL = process.env.APICAR_BASE_URL || "https://api.apicar.store";
const APICAR_API_KEY = process.env.APICAR_API_KEY || "";

// Simple in-memory cache
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Helper function for API requests with caching
async function cachedApiRequest(url: string): Promise<any> {
  // Check cache first
  const cacheKey = url;
  const now = Date.now();
  
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    if (cached.expiry > now) {
      return cached.data;
    }
    cache.delete(cacheKey);
  }

  try {
    // Make the actual API request
    const response = await axios.get(url, {
      headers: {
        'api-key': APICAR_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    // Cache the result
    cache.set(cacheKey, {
      data: response.data,
      expiry: now + CACHE_TTL,
    });
    
    return response.data;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

// Register routes
export async function registerRoutes(app: Express): Promise<Server> {
  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Global error:", err);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Get sales history
  app.get('/api/sales-history', async (req, res) => {
    try {
      // Extract parameters
      const make = req.query.make as string;
      const model = req.query.model as string;
      
      // Basic validation
      if (!make || !model) {
        return res.status(400).json({
          success: false,
          message: "Make and model are required"
        });
      }
      
      // Build API URL - fixed path
      const apiUrl = new URL(`${APICAR_BASE_URL}/history-cars`);
      const params = new URLSearchParams();
      
      // Required parameters
      params.append('make', make);
      params.append('model', model);
      
      // Date range handling
      const dateRange = req.query.dateRange as string || 'last3m';
      const today = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'last3m':
          startDate.setMonth(today.getMonth() - 3);
          break;
        case 'last6m':
          startDate.setMonth(today.getMonth() - 6);
          break;
        case 'lasty':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        case 'custom':
          if (req.query.customDateStart) {
            startDate = new Date(req.query.customDateStart as string);
          } else {
            startDate.setMonth(today.getMonth() - 3);
          }
          if (req.query.customDateEnd) {
            today.setTime(new Date(req.query.customDateEnd as string).getTime());
          }
          break;
      }
      
      // Format dates as YYYY-MM-DD
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      params.append('auction_date_from', formatDate(startDate));
      params.append('auction_date_to', formatDate(today));
      
      // Optional VIN filter
      if (req.query.vin) {
        params.append('vin', req.query.vin as string);
      }
      
      // Site filter
      if (req.query.sites) {
        const siteValues = Array.isArray(req.query.sites) 
          ? req.query.sites as string[]
          : [req.query.sites as string];
          
        // Map to correct site ID: 1=Copart, 2=IAAI
        for (const site of siteValues) {
          if (site && typeof site === 'string') {
            if (site.toLowerCase() === 'copart') {
              params.append('site', '1');
            } else if (site.toLowerCase() === 'iaai') {
              params.append('site', '2');
            }
          }
        }
      }
      
      // Pagination
      params.append('page', '1');
      params.append('size', '50'); // Get a good number of results
      
      // Call the API
      const fullUrl = `${apiUrl.toString()}?${params.toString()}`;
      console.log("Requesting:", fullUrl);
      
      const apiData = await cachedApiRequest(fullUrl);
      
      // Safe data transformation
      const salesHistory = [];
      let vehicle = null;
      
      // Process data if available
      if (apiData && apiData.data && Array.isArray(apiData.data)) {
        // Extract vehicle info from first record
        if (apiData.data.length > 0) {
          const firstItem = apiData.data[0];
          vehicle = {
            vin: firstItem.vin || '',
            make: firstItem.make || '',
            model: firstItem.model || '',
            year: firstItem.year || 0,
            trim: firstItem.series || '',
            mileage: firstItem.odometer || 0,
            title_status: firstItem.document || ''
          };
        }
        
        // Map sales records
        for (const item of apiData.data) {
          const record = {
            id: item.id || '',
            vin: item.vin || '',
            lot_id: item.lot_id,
            sale_date: item.sale_date || new Date().toISOString(),
            purchase_price: item.purchase_price != null ? item.purchase_price : undefined,
            sale_status: item.sale_status || 'Unknown',
            buyer_state: item.buyer_state || undefined,
            buyer_country: item.buyer_country || undefined,
            base_site: item.base_site || 'Unknown',
            auction_location: item.location || undefined,
            vehicle_mileage: item.odometer,
            vehicle_damage: item.damage_pr || undefined,
            vehicle_title: item.document || undefined,
            vehicle_has_keys: item.keys === 'Yes'
          };
          
          salesHistory.push(record);
        }
      }
      
      // Calculate statistics
      const stats = {
        totalSales: salesHistory.length,
        averagePrice: 0,
        successRate: 0,
        priceTrend: 0,
        topLocations: []
      };
      
      // Process sales for statistics
      const soldSales = salesHistory.filter(sale => 
        sale.sale_status === 'Sold' && sale.purchase_price != null
      );
      
      // Average price
      if (soldSales.length > 0) {
        const total = soldSales.reduce((sum, sale) => sum + (sale.purchase_price || 0), 0);
        stats.averagePrice = total / soldSales.length;
      }
      
      // Success rate
      if (salesHistory.length > 0) {
        stats.successRate = (soldSales.length / salesHistory.length) * 100;
      }
      
      // Price trend (simplified)
      stats.priceTrend = 5.2; // Example value
      
      // Geographic data
      const locationCounts = {};
      for (const sale of salesHistory) {
        if (sale.buyer_state) {
          locationCounts[sale.buyer_state] = (locationCounts[sale.buyer_state] || 0) + 1;
        }
      }
      
      const geographicData = Object.entries(locationCounts)
        .map(([state, count]) => ({ state, count }))
        .sort((a, b) => b.count - a.count);
        
      // Top locations
      stats.topLocations = geographicData.slice(0, 5);
      
      // Price trend data (simplified)
      const priceTrend = [
        { month: '2023-01', avgPrice: 18500 },
        { month: '2023-02', avgPrice: 19000 },
        { month: '2023-03', avgPrice: 19200 },
        { month: '2023-04', avgPrice: 18800 },
        { month: '2023-05', avgPrice: 19500 },
      ];
      
      // Return formatted response
      res.json({
        success: true,
        salesHistory,
        vehicle,
        stats,
        priceTrend,
        geographicData
      });
      
    } catch (error) {
      console.error("Sales history error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch sales history. Please try again."
      });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}