/**
 * Clean API Routes - Rebuilt AI Analysis System
 * Uses URL hash data directly - no database dependencies
 */

import { Express, Request, Response } from 'express';
import { performAIAnalysis } from './aiAnalysisService';

export function setupCleanApiRoutes(app: Express) {
  
  /**
   * Clean AI Vehicle Analysis Endpoint - URL Hash Based
   */
  app.post('/api/ai-analysis', async (req: Request, res: Response) => {
    try {
      const { platform, lotId, vin, vehicleData, currentBid, customPrompt } = req.body;
      
      if (!platform || !lotId || !vin || !vehicleData) {
        return res.status(400).json({
          success: false,
          message: 'Missing required analysis parameters'
        });
      }

      // Use our clean AI analysis service
      const result = await performAIAnalysis({
        platform,
        lotId,
        vin,
        currentBid,
        customPrompt,
        vehicleData
      });

      res.json(result);

    } catch (error: any) {
      console.error('AI Analysis error:', error);
      res.status(500).json({
        success: false,
        message: `AI analysis failed: ${error.message}`
      });
    }
  });

  /**
   * OpenAI API Key Validation Endpoint
   */
  app.get('/api/openai/validate', async (req: Request, res: Response) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          success: false,
          message: 'OpenAI API key not configured'
        });
      }

      // Test API key with a minimal request
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [{ role: "user", content: "Test connection" }],
          max_tokens: 5,
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();

      return res.json({
        success: true,
        message: 'OpenAI API key validated successfully',
        model: data.model,
        status: 'ready'
      });
    } catch (error: any) {
      console.error('OpenAI API validation error:', error);
      return res.status(400).json({
        success: false,
        message: `OpenAI API validation failed: ${error.message}`,
        status: 'error'
      });
    }
  });
}