/**
 * Targeted Data Collection Routes
 * Allows users to collect specific auction data based on search criteria
 */
import { Express, Request, Response } from 'express';
import { requireAuth } from './authRoutes';
import { dataCollectionService } from './dataCollectionService';
import { getVehicleSalesHistory } from './apiClient';
import { db } from './db';
import { salesHistory } from '../shared/schema';
import { pool } from './db';

interface TargetedCollectionRequest {
  make: string;
  model?: string;
  yearFrom: number;
  yearTo: number;
  saleDateFrom: string; // YYYY-MM-DD format
  saleDateTo: string;   // YYYY-MM-DD format
  site?: number; // 1 for Copart, 2 for IAAI, or both if not specified
}

export function setupTargetedCollectionRoutes(app: Express) {
  /**
   * Targeted Data Collection Endpoint
   * POST /api/collect-targeted-data
   */
  app.post('/api/collect-targeted-data', requireAuth, async (req: Request, res: Response) => {
    try {
      const {
        make,
        model,
        yearFrom,
        yearTo,
        saleDateFrom,
        saleDateTo,
        site
      }: TargetedCollectionRequest = req.body;

      // Validation
      if (!make || !yearFrom || !yearTo || !saleDateFrom || !saleDateTo) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: make, yearFrom, yearTo, saleDateFrom, saleDateTo'
        });
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(saleDateFrom) || !dateRegex.test(saleDateTo)) {
        return res.status(400).json({
          success: false,
          error: 'Date format must be YYYY-MM-DD'
        });
      }

      // Validate date range
      const startDate = new Date(saleDateFrom);
      const endDate = new Date(saleDateTo);
      
      if (startDate > endDate) {
        return res.status(400).json({
          success: false,
          error: 'Start date must be before end date'
        });
      }

      // Determine which sites to collect from
      const sitesToCollect = site ? [site] : [1, 2]; // Both Copart and IAAI if not specified
      
      console.log(`Starting targeted collection: ${make} ${model || 'all models'} (${yearFrom}-${yearTo}) from ${saleDateFrom} to ${saleDateTo}`);

      let totalCollected = 0;
      const results = [];

      for (const siteId of sitesToCollect) {
        const siteName = siteId === 1 ? 'Copart' : 'IAAI';
        
        try {
          // Check existing data for this specific criteria
          const existingCount = await checkExistingTargetedData({
            make,
            model,
            yearFrom,
            yearTo,
            saleDateFrom,
            saleDateTo,
            site: siteId
          });

          console.log(`${make} ${model || 'all models'} (${siteName}): Found ${existingCount} existing records for this criteria`);

          // Collect data using API
          const collected = await collectTargetedData({
            make,
            model,
            yearFrom,
            yearTo,
            saleDateFrom,
            saleDateTo,
            site: siteId
          });

          totalCollected += collected;
          
          results.push({
            site: siteId,
            siteName,
            recordsCollected: collected,
            existingRecords: existingCount
          });

          console.log(`${siteName}: Collected ${collected} new records for ${make} ${model || 'all models'}`);

        } catch (error: any) {
          console.error(`Error collecting from ${siteName}:`, error.message);
          results.push({
            site: siteId,
            siteName,
            recordsCollected: 0,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        data: {
          totalRecordsCollected: totalCollected,
          criteria: {
            make,
            model: model || 'all models',
            yearRange: `${yearFrom}-${yearTo}`,
            dateRange: `${saleDateFrom} to ${saleDateTo}`
          },
          results
        }
      });

    } catch (error: any) {
      console.error('Error in targeted collection:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * Check Targeted Data Availability
   * POST /api/check-targeted-data
   */
  app.post('/api/check-targeted-data', requireAuth, async (req: Request, res: Response) => {
    try {
      const {
        make,
        model,
        yearFrom,
        yearTo,
        saleDateFrom,
        saleDateTo,
        site
      }: TargetedCollectionRequest = req.body;

      if (!make || !yearFrom || !yearTo || !saleDateFrom || !saleDateTo) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const sitesToCheck = site ? [site] : [1, 2];
      const results = [];

      for (const siteId of sitesToCheck) {
        const count = await checkExistingTargetedData({
          make,
          model,
          yearFrom,
          yearTo,
          saleDateFrom,
          saleDateTo,
          site: siteId
        });

        results.push({
          site: siteId,
          siteName: siteId === 1 ? 'Copart' : 'IAAI',
          existingRecords: count
        });
      }

      res.json({
        success: true,
        data: {
          criteria: {
            make,
            model: model || 'all models',
            yearRange: `${yearFrom}-${yearTo}`,
            dateRange: `${saleDateFrom} to ${saleDateTo}`
          },
          results
        }
      });

    } catch (error: any) {
      console.error('Error checking targeted data:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

/**
 * Check existing data for specific criteria
 */
async function checkExistingTargetedData(criteria: TargetedCollectionRequest): Promise<number> {
  try {
    let query = `
      SELECT COUNT(*) as count
      FROM sales_history 
      WHERE make = $1 
      AND site = $2 
      AND sale_date >= $3 
      AND sale_date <= $4 
      AND year >= $5 
      AND year <= $6
    `;
    
    const params = [
      criteria.make,
      criteria.site,
      criteria.saleDateFrom,
      criteria.saleDateTo,
      criteria.yearFrom,
      criteria.yearTo
    ];
    
    if (criteria.model && criteria.model.trim() !== '') {
      query += ' AND model = $7';
      params.push(criteria.model);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0]?.count || '0');
  } catch (error) {
    console.error('Error checking existing targeted data:', error);
    return 0;
  }
}

/**
 * Collect data for specific criteria using API
 */
async function collectTargetedData(criteria: TargetedCollectionRequest): Promise<number> {
  try {
    let totalCollected = 0;
    let currentPage = 1;
    const pageSize = 25;
    let hasMoreData = true;

    while (hasMoreData) {
      try {
        const apiResponse = await getVehicleSalesHistory(
          criteria.make,
          criteria.site!.toString(),
          criteria.model || undefined,
          currentPage,
          pageSize,
          criteria.yearFrom,
          criteria.yearTo,
          criteria.saleDateFrom,
          criteria.saleDateTo
        );

        if (!apiResponse.success || !apiResponse.data) {
          console.log(`No more data available for ${criteria.make} ${criteria.model || 'all models'} on page ${currentPage}`);
          hasMoreData = false;
          break;
        }

        // Extract vehicles array from response structure
        let vehicles = [];
        if (apiResponse.data.data && Array.isArray(apiResponse.data.data)) {
          vehicles = apiResponse.data.data;
        } else if (Array.isArray(apiResponse.data)) {
          vehicles = apiResponse.data;
        } else {
          console.log(`Unexpected response structure on page ${currentPage}`);
          hasMoreData = false;
          break;
        }

        if (vehicles.length === 0) {
          console.log(`No vehicles found on page ${currentPage}`);
          hasMoreData = false;
          break;
        }

        // Insert data using raw SQL for compatibility
        for (const vehicle of vehicles) {
          try {
            const insertQuery = `
              INSERT INTO sales_history (
                id, lot_id, site, base_site, vin, sale_status, sale_date,
                purchase_price, year, make, model, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
              ON CONFLICT (id) DO NOTHING
            `;
            
            await pool.query(insertQuery, [
              `${vehicle.lot_id}-${vehicle.site}-${Date.now()}-${Math.random()}`,
              vehicle.lot_id,
              vehicle.site,
              vehicle.site === 1 ? 'copart' : 'iaai',
              vehicle.vin || '',
              vehicle.sale_status || 'sold',
              new Date(vehicle.sale_date),
              vehicle.purchase_price?.toString() || '0',
              vehicle.year,
              vehicle.make,
              vehicle.model,
              new Date()
            ]);
            totalCollected++;
          } catch (insertError: any) {
            // Skip duplicate entries
            if (!insertError.message?.includes('duplicate key')) {
              console.error(`Error inserting vehicle ${vehicle.vin}:`, insertError.message);
            }
          }
        }

        console.log(`Page ${currentPage}: Collected ${vehicles.length} records (${totalCollected} total)`);
        
        // Check if we should continue
        if (vehicles.length < pageSize) {
          console.log(`Reached end of available data - page ${currentPage} returned ${vehicles.length} records`);
          hasMoreData = false;
        } else {
          currentPage++;
          // Add delay between API calls
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (apiError: any) {
        console.error(`API error on page ${currentPage}:`, apiError.message);
        hasMoreData = false;
      }
    }

    console.log(`Completed targeted collection: ${totalCollected} records collected`);
    return totalCollected;
    
  } catch (error) {
    console.error(`Error in targeted data collection:`, error);
    return 0;
  }
}