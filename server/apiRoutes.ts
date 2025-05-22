/**
 * API Endpoint Handlers
 * Clean implementation for vehicle sales history
 */

import { Express, Request, Response } from 'express';
import { getVehicleSalesHistory } from './apiClient';

export function setupApiRoutes(app: Express) {
  /**
   * Vehicle Sales History Endpoint
   */
  app.get('/api/sales-history', async (req: Request, res: Response) => {
    try {
      // Extract parameters
      const make = req.query.make as string;
      const model = req.query.model as string;
      
      // Validate required parameters
      if (!make) {
        return res.status(400).json({
          success: false,
          message: 'Make parameter is required'
        });
      }
      
      // Call our API client
      console.log('Sales history request received for:', { make, model });
      const apiResponse = await getVehicleSalesHistory(make, model);
      
      // Handle API errors
      if (!apiResponse.success) {
        return res.status(500).json({
          success: false,
          message: apiResponse.message || 'Error fetching sales history'
        });
      }
      
      // Process the API data into our application format
      const apiData = apiResponse.data;
      
      // Format the response
      const salesHistory: any[] = [];
      let vehicle = null;
      let stats = {
        totalSales: 0,
        averagePrice: 0,
        successRate: 0,
        priceTrend: 0
      };
      
      // Process API data if available
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
            auction_location: item.location,
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
            vehicle_has_keys: item.keys === 'Yes',
            // Media
            link_img_small: item.link_img_small,
            link_img_hd: item.link_img_hd,
            link: item.link
          });
        });
        
        // Calculate basic statistics
        stats.totalSales = salesHistory.length;
        
        // Calculate average price
        const validPrices = salesHistory
          .filter(sale => sale.purchase_price)
          .map(sale => sale.purchase_price);
          
        if (validPrices.length > 0) {
          stats.averagePrice = validPrices.reduce((acc, price) => acc + price, 0) / validPrices.length;
        }
        
        // Calculate success rate
        const soldItems = salesHistory.filter(sale => sale.sale_status === 'Sold').length;
        stats.successRate = soldItems / salesHistory.length * 100;
        
        // Price trend (dummy data for now - would need time series analysis)
        stats.priceTrend = 5; // Assuming 5% increase
      }
      
      // Generate mock trends and geographic data
      const priceTrend = generatePriceTrend(stats.averagePrice);
      const geographicData = generateGeographicData(salesHistory);
      
      // Send the response
      res.json({
        success: true,
        data: {
          salesHistory,
          vehicle,
          stats,
          priceTrend,
          geographicData
        }
      });
      
    } catch (error: any) {
      console.error('Error in sales history endpoint:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  });
}

/**
 * Generate price trend data for the last 6 months
 */
function generatePriceTrend(averagePrice: number) {
  const result = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const variation = (Math.random() * 0.2) - 0.1; // -10% to +10%
    result.push({
      month: months[monthIndex],
      avgPrice: averagePrice * (1 + variation)
    });
  }
  
  return result;
}

/**
 * Generate geographic distribution data
 */
function generateGeographicData(salesHistory: any[]) {
  const stateMap: Record<string, number> = {};
  
  // Count sales by state
  salesHistory.forEach(sale => {
    if (sale.buyer_state) {
      const state = sale.buyer_state;
      stateMap[state] = (stateMap[state] || 0) + 1;
    }
  });
  
  // Convert to array and sort by count
  return Object.entries(stateMap)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 states
}