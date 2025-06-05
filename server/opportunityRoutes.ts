import type { Express } from "express";
import { EnhancedOpportunityService } from "./enhancedOpportunityService";
import { comprehensiveAnalysisService } from "./comprehensiveAnalysisService";

const enhancedService = new EnhancedOpportunityService();

export function registerOpportunityRoutes(app: Express): void {
  // Analyze market opportunities from real sales data with configurable batch size
  app.post("/api/opportunities/analyze", async (req, res) => {
    try {
      const { filters } = req.body;
      const batchSize = filters?.datasetSize || 15000;
      const userId = (req as any).user?.id || 1;
      
      console.log(`Starting enhanced market analysis with ${batchSize} records...`);
      const analysis = await enhancedService.analyzeWithEnhancements(
        userId,
        'standard',
        { ...filters, datasetSize: batchSize }
      );
      
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
      const userId = (req as any).user?.id || 1;
      
      const analysis = await enhancedService.analyzeWithEnhancements(
        userId,
        'standard',
        { datasetSize: batchSize }
      );
      
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
      const userId = (req as any).user?.id || 1;
      
      console.log(`Starting full database analysis with batch size: ${batchSize.toLocaleString()}`);
      
      const analysis = await enhancedService.analyzeWithEnhancements(
        userId,
        'comprehensive',
        { datasetSize: batchSize }
      );
      
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

  // Comprehensive deep analysis endpoint for maximum data extraction
  app.post("/api/opportunities/comprehensive", async (req, res) => {
    try {
      console.log('Starting comprehensive market intelligence analysis...');
      
      const analysis = await comprehensiveAnalysisService.performDeepMarketAnalysis();
      
      res.json({ 
        success: true, 
        data: analysis,
        meta: {
          analysisType: 'comprehensive',
          totalRecords: analysis.marketIntelligence.totalRecords,
          coveragePercentage: analysis.marketIntelligence.coveragePercentage,
          insights: analysis.actionableInsights.length,
          opportunities: analysis.opportunitySegments.length
        }
      });
    } catch (error) {
      console.error('Error in comprehensive analysis:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to perform comprehensive market analysis" 
      });
    }
  });
}