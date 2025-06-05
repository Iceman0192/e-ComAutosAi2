import type { Express } from "express";
import { dataCollectionService } from "./dataCollectionService";
import { requireAuth, requireAdmin } from "./simpleAuth";

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

  // Start collection for specific make
  app.post('/api/admin/data-collection/start-make', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { make } = req.body;
      if (!make) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle make is required'
        });
      }

      const result = await dataCollectionService.startMakeCollection(make);
      res.json({
        success: true,
        message: `Started collecting ${make} vehicles`,
        data: result
      });
    } catch (error: any) {
      console.error('Error starting make collection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start make collection'
      });
    }
  });
}