import type { Express } from "express";
import { opportunityAnalysisService } from "./opportunityAnalysisService";

export function registerOpportunityRoutes(app: Express): void {
  // Analyze market opportunities from real sales data
  app.get("/api/opportunities/analyze", async (req, res) => {
    try {
      const analysis = await opportunityAnalysisService.analyzeMarketOpportunities();
      
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
}