import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import axios from "axios";

// API configuration
const API_KEY = process.env.APICAR_API_KEY || "";

/**
 * Make a direct API request to APICAR
 */
export async function getVehicleHistory(make: string, model?: string) {
  try {
    // Construct URL with only the parameters we know work
    const url = 'https://api.apicar.store/api/history-cars';
    const params = new URLSearchParams();
    params.append('make', make);
    params.append('site', '1'); // Copart
    
    if (model && model !== 'undefined' && model !== '') {
      params.append('model', model);
    }
    
    const fullUrl = `${url}?${params.toString()}`;
    console.log("API Request URL:", fullUrl);
    
    // Make API request
    const response = await axios.get(fullUrl, {
      headers: {
        'api-key': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error("API request failed:", error.message);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Setup API routes
 */
export async function setupApiRoutes(app: Express): Promise<void> {
  // API endpoint for vehicle sales history
  app.get('/api/sales-history', async (req, res) => {
    try {
      console.log("Received search request with params:", req.query);
      
      // Extract main search parameters
      const make = req.query.make as string;
      const model = req.query.model as string;
      
      // Only make is absolutely required
      if (!make) {
        return res.status(400).json({
          success: false,
          message: "Vehicle make is required"
        });
      }
      
      // Make the API request with our simplified function
      const result = await getVehicleHistory(make, model);
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.message || "Failed to fetch sales history data"
        });
      }
      
      // Extract vehicle data from API response
      const apiData = result.data;
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
        apiData.data.forEach((item: any) => {
          salesHistory.push({
            id: item.id || '',
            vin: item.vin || '',
            lot_id: item.lot_id,
            sale_date: item.sale_date || new Date().toISOString(),
            purchase_price: item.purchase_price,
            sale_status: item.sale_status || 'Unknown',
            buyer_state: item.buyer_state,
            buyer_country: item.buyer_country,
            base_site: item.base_site || 'copart',
            link_img_small: item.link_img_small,
            link_img_hd: item.link_img_hd,
            link: item.link,
            // Additional vehicle data
            year: item.year,
            make: item.make,
            model: item.model,
            series: item.series,
            trim: item.series,
            odometer: item.odometer,
            vehicle_type: item.vehicle_type,
            damage_pr: item.damage_pr,
            damage_sec: item.damage_sec,
            fuel: item.fuel,
            drive: item.drive,
            transmission: item.transmission,
            color: item.color,
            keys: item.keys,
            title: item.title,
            location: item.location,
            vehicle_title: item.document,
            vehicle_damage: item.damage_pr,
            vehicle_mileage: item.odometer,
            vehicle_has_keys: item.keys === 'Yes'
          });
        });
      }
      
      // Calculate sales statistics
      const statsCalc = calculateStatistics(salesHistory);
      
      // Format response
      const response = {
        salesHistory,
        vehicle,
        stats: {
          totalSales: salesHistory.length,
          averagePrice: statsCalc.avgPrice,
          successRate: statsCalc.successRate,
          priceTrend: statsCalc.priceTrend
        },
        priceTrend: statsCalc.priceTrendData,
        geographicData: statsCalc.geographicData
      };
      
      res.json({
        success: true,
        data: response
      });
    } catch (error: any) {
      console.error("API Error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch sales history data"
      });
    }
  });
}

/**
 * Calculate statistics from sales data
 */
function calculateStatistics(salesHistory: any[]) {
  // Default empty values
  const result = {
    avgPrice: 0,
    successRate: 0,
    priceTrend: 0,
    priceTrendData: [],
    geographicData: []
  };
  
  if (!salesHistory.length) return result;
  
  // Calculate average price
  const validPrices = salesHistory
    .filter(sale => sale.purchase_price !== undefined && sale.purchase_price !== null)
    .map(sale => sale.purchase_price);
    
  if (validPrices.length) {
    result.avgPrice = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;
  }
  
  // Calculate success rate (% of "Sold" status)
  const soldCount = salesHistory.filter(sale => sale.sale_status === 'Sold').length;
  result.successRate = (soldCount / salesHistory.length) * 100;
  
  // Generate dummy price trend (would normally use time-series analysis)
  result.priceTrend = Math.random() * 10 - 5; // -5% to +5%
  
  // Generate price trend data by month (simplified)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  for (let i = 5; i >= 0; i--) {
    const month = (currentMonth - i + 12) % 12;
    const avgPriceForMonth = result.avgPrice * (1 + (Math.random() * 0.2 - 0.1)); // ±10% variation
    
    result.priceTrendData.push({
      month: monthNames[month],
      avgPrice: avgPriceForMonth
    });
  }
  
  // Generate geographic data
  const stateMap: {[key: string]: number} = {};
  
  salesHistory.forEach(sale => {
    if (sale.buyer_state) {
      const state = sale.buyer_state;
      stateMap[state] = (stateMap[state] || 0) + 1;
    }
  });
  
  result.geographicData = Object.entries(stateMap)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
    
  return result;
}