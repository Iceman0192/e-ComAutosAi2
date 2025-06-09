import type { Express } from "express";
import { dataCollectionService } from "./dataCollectionService";
import { requireAuth, requireAdmin } from "./authRoutes";

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
      // This endpoint will be implemented to show database growth over time
      res.json({
        success: true,
        data: {
          message: "Database statistics endpoint ready for implementation"
        }
      });
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
}