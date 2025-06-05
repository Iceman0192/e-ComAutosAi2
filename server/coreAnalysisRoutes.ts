import type { Express } from "express";
import { SimpleAnalysisService } from './simpleAnalysisService';

const simpleAnalysisService = new SimpleAnalysisService();

export function registerCoreAnalysisRoutes(app: Express) {
  // Simple, focused market analysis endpoint
  app.post("/api/analysis/market", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
      }

      const filters = req.body.filters || {};
      console.log('Core analysis request:', filters);
      
      const analysis = await simpleAnalysisService.analyzeMarket();
      
      res.json({
        success: true,
        data: analysis
      });

    } catch (error: any) {
      console.error('Core analysis error:', error);
      res.status(500).json({
        success: false,
        message: "Analysis failed",
        error: error.message
      });
    }
  });
}