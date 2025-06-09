import type { Express } from "express";
import { dataCollectionService } from "./dataCollectionService";
import { requireAuth, requireAdmin, AuthenticatedRequest } from "./auth/unifiedAuth";

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

  // Get collection jobs (admin only)
  app.get('/api/admin/data-collection/jobs', requireAuth, requireAdmin, (req, res) => {
    try {
      const jobs = dataCollectionService.getQueueStatus();
      res.json({
        success: true,
        data: jobs
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
}