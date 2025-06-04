import type { Express } from "express";
import { opportunityAnalysisService } from "./opportunityAnalysisService";

export function registerOpportunityRoutes(app: Express): void {
  // Analyze market opportunities from real sales data with configurable batch size
  app.get("/api/opportunities/analyze", async (req, res) => {
    try {
      const batchSize = parseInt(req.query.batchSize as string) || 15000;
      const analysis = await opportunityAnalysisService.analyzeMarketOpportunities(batchSize);
      
      res.json({ 
        success: true, 
        data: analysis 
      });
    } catch (error) {
      console.error('Error analyzing opportunities:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to analyze market opportunities" 
      });
    }
  });

  // Progressive analysis endpoint for training AI on entire database
  app.get("/api/opportunities/analyze-progressive", async (req, res) => {
    try {
      const batchSize = parseInt(req.query.batchSize as string) || 25000;
      const analysis = await opportunityAnalysisService.analyzeMarketOpportunities(batchSize);
      
      res.json({ 
        success: true, 
        data: analysis,
        meta: {
          batchSize,
          totalCoverage: analysis.overview.coveragePercentage,
          analysisMode: 'progressive'
        }
      });
    } catch (error) {
      console.error('Error in progressive analysis:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to perform progressive market analysis" 
      });
    }
  });

  // Full database analysis endpoint (for maximum AI training)
  app.get("/api/opportunities/analyze-full", async (req, res) => {
    try {
      const batchSize = parseInt(req.query.batchSize as string) || 50000;
      console.log(`Starting full database analysis with batch size: ${batchSize.toLocaleString()}`);
      
      const analysis = await opportunityAnalysisService.analyzeMarketOpportunities(batchSize);
      
      res.json({ 
        success: true, 
        data: analysis,
        meta: {
          batchSize,
          totalCoverage: analysis.overview.coveragePercentage,
          analysisMode: 'full-database',
          recordsAnalyzed: analysis.overview.totalRecords,
          totalDatabaseSize: analysis.overview.totalDatabaseRecords
        }
      });
    } catch (error) {
      console.error('Error in full database analysis:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to perform full database analysis" 
      });
    }
  });
}