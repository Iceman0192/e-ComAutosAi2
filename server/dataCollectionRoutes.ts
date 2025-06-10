import type { Express } from "express";
import { dataCollectionService } from "./dataCollectionService";
import { requireAuth, requireAdmin, AuthenticatedRequest } from "./auth/unifiedAuth";
import { pool } from "./db";
import { autoCollectionService } from "./autoCollectionService";

export function registerDataCollectionRoutes(app: Express) {
  
  // Get collection status (admin only)
  app.get('/api/admin/data-collection/status', requireAuth, requireAdmin, (req, res) => {
    try {
      const status = dataCollectionService.getCollectionStatus();
      res.json({
        success: true,
        data: status
      });
    } catch (error: any) {
      console.error('Error getting collection status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get collection status'
      });
    }
  });

  // Start automated collection (admin only)
  app.post('/api/admin/data-collection/start', requireAuth, requireAdmin, async (req, res) => {
    try {
      await dataCollectionService.startAutomatedCollection();
      res.json({
        success: true,
        message: 'Data collection started successfully'
      });
    } catch (error: any) {
      console.error('Error starting data collection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start data collection'
      });
    }
  });

  // Stop automated collection (admin only)
  app.post('/api/admin/data-collection/stop', requireAuth, requireAdmin, (req, res) => {
    try {
      dataCollectionService.stopAutomatedCollection();
      res.json({
        success: true,
        message: 'Data collection stopped successfully'
      });
    } catch (error: any) {
      console.error('Error stopping data collection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stop data collection'
      });
    }
  });

  // Start multiple collections (admin only)
  app.post('/api/admin/data-collection/start-multiple', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { searches } = req.body;
      if (!searches || !Array.isArray(searches)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid search parameters'
        });
      }

      const results = [];
      for (const search of searches) {
        try {
          await dataCollectionService.startMakeCollection(search.make, {
            yearFrom: search.yearFrom,
            yearTo: search.yearTo,
            daysBack: search.daysBack
          });
          results.push({
            make: search.make,
            model: search.model,
            status: 'started'
          });
        } catch (error: any) {
          console.error(`Failed to start collection for ${search.make}:`, error);
          results.push({
            make: search.make,
            model: search.model,
            status: 'failed',
            error: error?.message || 'Unknown error'
          });
        }
      }

      res.json({
        success: true,
        searches: results,
        message: `Started ${results.filter(r => r.status === 'started').length} collections`
      });
    } catch (error: any) {
      console.error('Error starting multiple collections:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start collections'
      });
    }
  });

  // Get available models for a make (admin only)
  app.get('/api/admin/data-collection/models', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { make } = req.query;
      
      if (!make) {
        return res.status(400).json({
          success: false,
          message: 'Make parameter is required'
        });
      }

      // Query distinct models from the database
      const query = `
        SELECT DISTINCT model 
        FROM sales_history 
        WHERE make = $1 
        AND model IS NOT NULL 
        AND model != '' 
        AND model != 'Unknown'
        ORDER BY model
        LIMIT 50
      `;
      
      const result = await pool.query(query, [make]);
      const models = result.rows.map((row: any) => row.model).filter((model: any) => model && model.trim() !== '');

      res.json({
        success: true,
        models
      });
    } catch (error: any) {
      console.error('Error fetching models:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch models'
      });
    }
  });

  // Start manual collection for specific make and site (admin only)
  app.post('/api/admin/data-collection/start-make-site', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { make, site, model, yearFrom, yearTo, daysBack, discoverModels } = req.body;
      
      if (!make || !site) {
        return res.status(400).json({
          success: false,
          message: 'Make and site are required'
        });
      }

      const options: any = {
        site: parseInt(site),
        yearFrom: yearFrom || 2012,
        yearTo: yearTo || 2025,
        daysBack: daysBack || 150,
        discoverModels: discoverModels !== false
      };

      // Add specific model if provided and not "all models"
      if (model && model !== '__all__') {
        options.specificModel = model;
        options.discoverModels = false; // Don't discover models if specific model requested
      }

      await dataCollectionService.startMakeCollection(make, options);

      res.json({
        success: true,
        message: `Started collection for ${make} on ${site === 1 ? 'Copart' : 'IAAI'}`
      });
    } catch (error: any) {
      console.error('Error starting make collection:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to start collection'
      });
    }
  });

  // Get collection jobs (admin only)
  app.get('/api/admin/data-collection/jobs', requireAuth, requireAdmin, async (req, res) => {
    try {
      const jobs = dataCollectionService.getQueueStatus();
      const vehicleProgress = await dataCollectionService.getVehicleProgress();
      const siteStats = await dataCollectionService.getCollectionStatsByAuctionSite();
      
      res.json({
        success: true,
        data: {
          jobs,
          vehicleProgress,
          siteStats
        }
      });
    } catch (error: any) {
      console.error('Error getting collection jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get collection jobs'
      });
    }
  });

  // Get database statistics
  app.get('/api/admin/database/stats', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { db } = await import('./db');
      const { sql } = await import('drizzle-orm');

      const [
        totalVehiclesResult,
        makesResult,
        platformRecordsResult,
        recentRecordsResult,
        dateRangeResult,
        topMakesResult,
        modelsResult
      ] = await Promise.all([
        // Total vehicles
        db.execute(sql`SELECT COUNT(*) as count FROM sales_history`),
        
        // Unique makes
        db.execute(sql`SELECT COUNT(DISTINCT make) as count FROM sales_history WHERE make IS NOT NULL`),
        
        // Platform breakdown
        db.execute(sql`
          SELECT 
            site,
            COUNT(*) as count
          FROM sales_history 
          GROUP BY site
        `),
        
        // Recent records (last 30 days)
        db.execute(sql`
          SELECT COUNT(*) as count 
          FROM sales_history 
          WHERE sale_date >= NOW() - INTERVAL '30 days'
        `),
        
        // Date range
        db.execute(sql`
          SELECT 
            MIN(sale_date) as oldest,
            MAX(sale_date) as newest
          FROM sales_history
          WHERE sale_date IS NOT NULL
        `),
        
        // Top makes with percentages
        db.execute(sql`
          WITH total_count AS (
            SELECT COUNT(*) as total FROM sales_history WHERE make IS NOT NULL
          ),
          make_counts AS (
            SELECT 
              make,
              COUNT(*) as count
            FROM sales_history 
            WHERE make IS NOT NULL
            GROUP BY make
            ORDER BY count DESC
            LIMIT 15
          )
          SELECT 
            mc.make,
            mc.count,
            ROUND((mc.count * 100.0 / tc.total), 2) as percentage
          FROM make_counts mc
          CROSS JOIN total_count tc
          ORDER BY mc.count DESC
        `),

        // Models by top makes
        db.execute(sql`
          SELECT DISTINCT 
            make,
            model,
            COUNT(*) as count
          FROM sales_history 
          WHERE make IS NOT NULL AND model IS NOT NULL
            AND make IN (
              SELECT make FROM (
                SELECT make, COUNT(*) as cnt
                FROM sales_history 
                WHERE make IS NOT NULL
                GROUP BY make
                ORDER BY cnt DESC
                LIMIT 10
              ) top_makes
            )
          GROUP BY make, model
          ORDER BY make, count DESC
        `)
      ]);

      // Handle query results properly
      const totalVehicles = (totalVehiclesResult as any)?.[0]?.count || 0;
      const totalMakes = (makesResult as any)?.[0]?.count || 0;
      const recentRecords = (recentRecordsResult as any)?.[0]?.count || 0;
      
      // Process platform records
      const platformRecordsArray = Array.isArray(platformRecordsResult) ? platformRecordsResult : 
                                   (platformRecordsResult ? [platformRecordsResult] : []);
      const platformRecords = platformRecordsArray.reduce((acc: any, row: any) => {
        if (row.site === 1) acc.copart = parseInt(row.count);
        if (row.site === 2) acc.iaai = parseInt(row.count);
        return acc;
      }, { copart: 0, iaai: 0 });

      const dateRange = (dateRangeResult as any)?.[0] || {};
      const topMakesArray = Array.isArray(topMakesResult) ? topMakesResult : 
                           (topMakesResult ? [topMakesResult] : []);
      const topMakes = topMakesArray.map((row: any) => ({
        make: row.make,
        count: parseInt(row.count),
        percentage: parseFloat(row.percentage)
      }));

      // Process models by make
      const modelsArray = Array.isArray(modelsResult) ? modelsResult : 
                         (modelsResult ? [modelsResult] : []);
      const modelsByMake = modelsArray.reduce((acc: any, row: any) => {
        if (!acc[row.make]) {
          acc[row.make] = [];
        }
        acc[row.make].push({
          model: row.model,
          count: parseInt(row.count)
        });
        return acc;
      }, {});

      const stats = {
        totalVehicles: parseInt(totalVehicles),
        totalMakes: parseInt(totalMakes),
        copartRecords: platformRecords.copart,
        iaaiRecords: platformRecords.iaai,
        recentRecords: parseInt(recentRecords),
        oldestRecord: dateRange.oldest ? new Date(dateRange.oldest).toLocaleDateString() : 'N/A',
        newestRecord: dateRange.newest ? new Date(dateRange.newest).toLocaleDateString() : 'N/A',
        topMakes,
        modelsByMake,
        recordsByMonth: [],
        avgPriceByMake: []
      };

      res.json(stats);
    } catch (error: any) {
      console.error('Error getting database stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get database statistics'
      });
    }
  });

  // Get vehicle progress summary
  app.get('/api/admin/data-collection/vehicle-progress', requireAuth, requireAdmin, async (req, res) => {
    try {
      const vehicleProgress = await dataCollectionService.getVehicleProgress();
      res.json({
        success: true,
        data: vehicleProgress
      });
    } catch (error: any) {
      console.error('Error getting vehicle progress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get vehicle progress'
      });
    }
  });

  // Start collection for specific make with manual parameters
  app.post('/api/admin/data-collection/start-make', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { make, yearFrom, yearTo, daysBack } = req.body;
      if (!make) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle make is required'
        });
      }

      // Validate optional parameters
      const options = {
        yearFrom: yearFrom ? parseInt(yearFrom) : 2012,
        yearTo: yearTo ? parseInt(yearTo) : 2025,
        daysBack: daysBack ? parseInt(daysBack) : 150
      };

      // Validate year range
      if (options.yearFrom < 1990 || options.yearFrom > 2025) {
        return res.status(400).json({
          success: false,
          message: 'Year from must be between 1990 and 2025'
        });
      }

      if (options.yearTo < options.yearFrom || options.yearTo > 2025) {
        return res.status(400).json({
          success: false,
          message: 'Year to must be between year from and 2025'
        });
      }

      // Validate days back
      if (options.daysBack < 1 || options.daysBack > 365) {
        return res.status(400).json({
          success: false,
          message: 'Days back must be between 1 and 365'
        });
      }

      console.log(`Starting manual collection for ${make} with options:`, options);
      const result = await dataCollectionService.startMakeCollection(make, options);
      
      res.json({
        success: true,
        message: `Started collecting ${make} vehicles (${options.yearFrom}-${options.yearTo}, ${options.daysBack} days back)`,
        data: result
      });
    } catch (error: any) {
      console.error('Error starting make collection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start make collection',
        error: error.message
      });
    }
  });

  // Start multiple collections with make/model combinations
  app.post('/api/admin/data-collection/start-multiple', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { searches } = req.body;
      
      if (!searches || !Array.isArray(searches) || searches.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No searches provided'
        });
      }

      const startedSearches = [];
      
      for (const search of searches) {
        const { make, model, yearFrom, yearTo, daysBack } = search;
        
        if (!make) {
          continue;
        }

        try {
          // Prepare collection options
          const options = {
            yearFrom: yearFrom || 2020,
            yearTo: yearTo || 2025,
            daysBack: daysBack || 30,
            priority: 2,
            model: model || undefined
          };

          console.log(`Starting collection for ${make}${model ? ` ${model}` : ''} with options:`, options);
          
          // Start collection for this make/model combination
          await dataCollectionService.startMakeCollection(make, options);

          startedSearches.push({
            id: `${make}-${model || 'all'}-${Date.now()}`,
            make,
            model: model || 'All Models',
            yearFrom: options.yearFrom,
            yearTo: options.yearTo,
            daysBack: options.daysBack,
            status: 'queued',
            progress: 0,
            recordsFound: 0
          });

          // Add delay between starts to prevent API overload
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
          console.error(`Failed to start collection for ${make}${model ? ` ${model}` : ''}:`, error);
        }
      }

      res.json({
        success: true,
        message: `Started ${startedSearches.length} of ${searches.length} requested collections`,
        searches: startedSearches
      });
    } catch (error: any) {
      console.error('Multiple collection start error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start multiple collections',
        error: error.message
      });
    }
  });

  // Get available models for a specific make
  app.get('/api/admin/database/models/:make', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { make } = req.params;
      const { db } = await import('./db');
      const { sql } = await import('drizzle-orm');

      const modelsResult = await db.execute(sql`
        SELECT DISTINCT 
          model,
          COUNT(*) as count
        FROM sales_history 
        WHERE make = ${make} 
          AND model IS NOT NULL 
          AND model != ''
        GROUP BY model
        ORDER BY count DESC, model ASC
        LIMIT 50
      `);

      const modelsArray = (modelsResult as any) || [];
      const models = modelsArray.map((row: any) => ({
        model: row.model,
        count: parseInt(row.count)
      }));

      res.json({
        success: true,
        data: {
          make,
          models,
          totalModels: models.length
        }
      });
    } catch (error: any) {
      console.error('Error getting models for make:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get models for make'
      });
    }
  });

  // Auto-collection status endpoint
  app.get('/api/admin/auto-collection/status', requireAuth, requireAdmin, (req, res) => {
    try {
      const status = autoCollectionService.getStatus();
      res.json(status);
    } catch (error: any) {
      console.error('Error getting auto-collection status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get auto-collection status'
      });
    }
  });

  // Start auto-collection
  app.post('/api/admin/auto-collection/start', requireAuth, requireAdmin, async (req, res) => {
    try {
      const result = await autoCollectionService.start();
      res.json(result);
    } catch (error: any) {
      console.error('Error starting auto-collection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start auto-collection'
      });
    }
  });

  // Stop auto-collection
  app.post('/api/admin/auto-collection/stop', requireAuth, requireAdmin, async (req, res) => {
    try {
      const result = await autoCollectionService.stop();
      res.json(result);
    } catch (error: any) {
      console.error('Error stopping auto-collection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stop auto-collection'
      });
    }
  });

  // Sales history data endpoint
  app.get('/api/sales-history', requireAuth, async (req, res) => {
    try {
      const { page = '1', limit = '50', search, make, site } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (search) {
        whereClause += ` AND (vin ILIKE $${paramIndex} OR make ILIKE $${paramIndex} OR model ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (make) {
        whereClause += ` AND make = $${paramIndex}`;
        params.push(make);
        paramIndex++;
      }

      if (site) {
        whereClause += ` AND site = $${paramIndex}`;
        params.push(parseInt(site as string));
        paramIndex++;
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM sales_history ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const totalRecords = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalRecords / parseInt(limit as string));

      // Get paginated data
      const dataQuery = `
        SELECT id, make, model, year, sale_date, purchase_price, odometer, 
               damage_pr, location, site, vin
        FROM sales_history 
        ${whereClause}
        ORDER BY sale_date DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(parseInt(limit as string), offset);

      const dataResult = await pool.query(dataQuery, params);

      res.json({
        success: true,
        data: dataResult.rows,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalRecords,
          totalPages
        }
      });
    } catch (error: any) {
      console.error('Error fetching sales history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sales history'
      });
    }
  });

  // Sales history data endpoint for user interface
  app.get('/api/sales-history', requireAuth, async (req, res) => {
    try {
      const { page = '1', limit = '50', search, make, site } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (search) {
        whereClause += ` AND (vin ILIKE $${paramIndex} OR make ILIKE $${paramIndex} OR model ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (make) {
        whereClause += ` AND make = $${paramIndex}`;
        params.push(make);
        paramIndex++;
      }

      if (site) {
        whereClause += ` AND site = $${paramIndex}`;
        params.push(parseInt(site as string));
        paramIndex++;
      }

      const query = `
        SELECT vin, make, model, year, site, auction_date, purchase_price, 
               lot_number, location, created_at
        FROM sales_history 
        ${whereClause}
        ORDER BY auction_date DESC, created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(parseInt(limit as string), offset);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM sales_history 
        ${whereClause}
      `;

      const [result, countResult] = await Promise.all([
        pool.query(query, params),
        pool.query(countQuery, params.slice(0, -2)) // Remove limit/offset params for count
      ]);

      const totalRecords = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalRecords / parseInt(limit as string));

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalRecords,
          totalPages
        }
      });

    } catch (error: any) {
      console.error('Error fetching sales history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sales history'
      });
    }
  });
}