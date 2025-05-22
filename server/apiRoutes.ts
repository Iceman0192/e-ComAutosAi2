/**
 * API Endpoint Handlers
 * Clean implementation for vehicle sales history
 */

import { Express, Request, Response } from 'express';
import { getVehicleSalesHistory } from './apiClient';
import { db } from './db';
import { salesHistory, vehicles } from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export function setupApiRoutes(app: Express) {
  /**
   * Vehicle Sales History Endpoint
   */
  app.get('/api/sales-history', async (req: Request, res: Response) => {
    try {
      // Extract parameters
      const make = req.query.make as string;
      const model = req.query.model as string;
      const page = parseInt(req.query.page as string) || 1;
      const size = parseInt(req.query.size as string) || 25;
      const yearFrom = req.query.year_from ? parseInt(req.query.year_from as string) : undefined;
      const yearTo = req.query.year_to ? parseInt(req.query.year_to as string) : undefined;
      const saleFrom = req.query.sale_date_from as string;
      const saleTo = req.query.sale_date_to as string;
      
      console.log('Sales history request received for:', { 
        make, 
        model, 
        page, 
        size,
        yearFrom,
        yearTo,
        saleFrom,
        saleTo 
      });
      
      // Validate required parameters
      if (!make) {
        return res.status(400).json({
          success: false,
          message: 'Make parameter is required'
        });
      }
      
      // First try to get results from database if we have them
      let dbResults = [];
      let apiResponse;
      let fromDatabase = false;
      
      try {
        // Check if we have cached results in the database
        console.log('Checking database for cached results with query:', { make, model });
        
        const dbSalesHistory = await db.query.salesHistory.findMany({
          where: (fields: any) => {
            let conditions = [
              eq(fields.make, make)
            ];
            
            if (model) {
              conditions.push(eq(fields.model, model));
            }
            
            if (yearFrom) {
              conditions.push(gte(fields.year, yearFrom));
            }
            
            if (yearTo) {
              conditions.push(lte(fields.year, yearTo));
            }
            
            return and(...conditions);
          },
          limit: size,
          offset: (page - 1) * size
        });
        
        console.log(`Found ${dbSalesHistory.length} results in database cache`);
        
        // If we have enough cached results, use them instead of making API call
        if (dbSalesHistory.length > 0) {
          dbResults = dbSalesHistory;
          fromDatabase = true;
        }
      } catch (dbError) {
        console.error('Error querying database:', dbError);
        // Continue to API call if database query fails
      }
      
      // If we don't have enough cached results, call the API
      if (!fromDatabase) {
        const apiUrl = `https://api.apicar.store/api/history-cars?make=${make}&site=1&page=${page}&size=${size}${yearFrom ? '&year_from=' + yearFrom : ''}${yearTo ? '&year_to=' + yearTo : ''}${saleFrom ? '&sale_date_from=' + saleFrom : ''}${saleTo ? '&sale_date_to=' + saleTo : ''}${model ? '&model=' + model : ''}`;
        console.log(`Requesting from APICAR API: ${apiUrl}`);
        
        apiResponse = await getVehicleSalesHistory(
          make, 
          model, 
          page, 
          size,
          yearFrom,
          yearTo,
          saleFrom,
          saleTo
        );
        
        // Save response to database for future use
        if (apiResponse?.success && apiResponse.data && apiResponse.data.data) {
          try {
            console.log(`Saving ${apiResponse.data.data.length} results to database cache`);
            
            // Insert each item into the database
            const insertPromises = apiResponse.data.data.map(async (item: any) => {
              try {
                // Format the data according to our database schema
                const saleHistoryItem = {
                  id: `${item.id || item.lot_id}-1`,
                  lot_id: item.lot_id || 0,
                  site: item.site || 1,
                  base_site: item.base_site || 'copart',
                  vin: item.vin || '',
                  sale_status: item.sale_status || 'Unknown',
                  sale_date: item.sale_date ? new Date(item.sale_date) : new Date(),
                  purchase_price: item.purchase_price || null,
                  buyer_state: item.buyer_state || null,
                  buyer_country: item.buyer_country || null,
                  buyer_type: item.buyer_type || null,
                  auction_location: item.location || null,
                  vehicle_mileage: item.odometer || null,
                  vehicle_damage: item.damage_pr || null,
                  vehicle_title: item.document || null,
                  vehicle_has_keys: item.keys === 'Yes',
                  year: item.year || null,
                  make: item.make || null,
                  model: item.model || null,
                  series: item.series || null,
                  trim: item.series || null,
                  transmission: item.transmission || null,
                  drive: item.drive || null,
                  fuel: item.fuel || null,
                  color: item.color || null,
                  created_at: new Date(),
                  images: item.link_img_hd ? JSON.stringify(item.link_img_hd) : null,
                  link: item.link || null
                };
                
                // Insert into database, ignoring duplicates
                await db.insert(salesHistory).values(saleHistoryItem)
                  .onConflictDoNothing({ target: salesHistory.id });
                  
                return true;
              } catch (itemError) {
                console.error('Error inserting item into database:', itemError);
                return false;
              }
            });
            
            // Wait for all inserts to complete
            await Promise.all(insertPromises);
            
            console.log('Successfully saved results to database cache');
          } catch (dbSaveError) {
            console.error('Error saving API results to database:', dbSaveError);
            // Continue processing the API response even if we couldn't save to DB
          }
        }
      }
      
      // Handle API errors
      if (!fromDatabase && (!apiResponse || !apiResponse.success)) {
        return res.status(500).json({
          success: false,
          message: apiResponse?.message || 'Error fetching sales history'
        });
      }
      
      // Format the response
      const salesHistoryList = [];
      let vehicle = null;
      let totalCount = 0;
      let stats = {
        totalSales: 0,
        averagePrice: 0,
        successRate: 0,
        priceTrend: 0
      };
      
      // Process API data if available
      if (!fromDatabase && apiResponse && apiResponse.data) {
        const apiData = apiResponse.data;
        
        // Store API response count if available for pagination
        if (apiData && apiData.count) {
          totalCount = apiData.count;
        }
      
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
          
          // Map sales records and filter by year if needed
          apiData.data.forEach((item) => {
            // Skip records that don't match our year range criteria
            const itemYear = item.year ? parseInt(item.year) : 0;
            
            // Apply additional filtering on the server-side for year range
            if (yearFrom && itemYear && itemYear < yearFrom) {
              return; // Skip items with year below our minimum
            }
            
            if (yearTo && itemYear && itemYear > yearTo) {
              return; // Skip items with year above our maximum
            }
            
            salesHistoryList.push({
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
          stats.totalSales = salesHistoryList.length;
          
          // Calculate average price
          const validPrices = salesHistoryList
            .filter(sale => sale.purchase_price)
            .map(sale => sale.purchase_price);
            
          if (validPrices.length > 0) {
            stats.averagePrice = validPrices.reduce((acc, price) => acc + price, 0) / validPrices.length;
          }
          
          // Calculate success rate
          const soldItems = salesHistoryList.filter(sale => sale.sale_status === 'Sold').length;
          stats.successRate = soldItems / salesHistoryList.length * 100;
          
          // Price trend (dummy data for now - would need time series analysis)
          stats.priceTrend = 5; // Assuming 5% increase
        }
      } else if (fromDatabase) {
        // Use the database results
        salesHistoryList.push(...dbResults);
        totalCount = dbResults.length; // This is not accurate for pagination, but it's what we have
        
        // Calculate basic statistics from DB results
        stats.totalSales = salesHistoryList.length;
        
        // Calculate average price
        const validPrices = salesHistoryList
          .filter(sale => sale.purchase_price)
          .map(sale => sale.purchase_price);
          
        if (validPrices.length > 0) {
          stats.averagePrice = validPrices.reduce((acc, price) => acc + price, 0) / validPrices.length;
        }
        
        // Calculate success rate (if the status field exists)
        const soldItems = salesHistoryList.filter(sale => sale.sale_status === 'Sold').length;
        stats.successRate = soldItems / salesHistoryList.length * 100;
      }
      
      // Generate mock trends and geographic data
      const priceTrend = generatePriceTrend(stats.averagePrice);
      const geographicData = generateGeographicData(salesHistoryList);
      
      // Send the response
      res.json({
        success: true,
        data: {
          salesHistory: salesHistoryList,
          vehicle,
          stats,
          priceTrend,
          geographicData,
          pagination: {
            totalCount: totalCount,
            currentPage: page,
            pageSize: size,
            totalPages: Math.ceil(totalCount / size)
          }
        }
      });
      
    } catch (error) {
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