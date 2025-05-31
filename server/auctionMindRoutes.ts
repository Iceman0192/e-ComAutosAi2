/**
 * AuctionMind API Routes - Multi-AI Vehicle Analysis System
 * Uses VIN-based comprehensive data for superior insights
 */

import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import axios from 'axios';

// OpenAI setup - using the newest model
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface VINAnalysisData {
  vin: string;
  vehicleHistory: any[];
  openaiAnalysis: any;
  perplexityInsights: any;
  consensus: any;
}

/**
 * Fetch comprehensive VIN data from APICAR
 */
async function fetchVINData(vin: string): Promise<any> {
  try {
    console.log(`Fetching VIN data for: ${vin}`);
    const response = await axios.get(`https://api.apicar.store/api/cars/vin/all?vin=${vin}`, {
      headers: {
        'api-key': process.env.APICAR_API_KEY,
        'accept': '*/*'
      }
    });
    console.log(`VIN API response status: ${response.status}`);
    console.log(`VIN API response data:`, response.data);
    return response.data;
  } catch (error: any) {
    console.log(`VIN data fetch error:`, error.response?.data || error.message);
    throw new Error(`VIN data fetch failed: ${error.message}`);
  }
}

/**
 * OpenAI Analysis using GPT-4o for vehicle assessment
 */
async function performOpenAIAnalysis(vinData: any[]): Promise<any> {
  try {
    if (!vinData || vinData.length === 0) {
      return { summary: 'No vehicle data available for analysis' };
    }

    const vehicleInfo = vinData[0];
    const saleHistory = vinData.map(entry => ({
      date: entry.sale_date,
      price: entry.purchase_price,
      platform: entry.base_site,
      damage: entry.damage_pr,
      condition: entry.status
    }));

    const prompt = `Brief analysis for ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model} (${vehicleInfo.odometer} miles):

Recent Sales: ${saleHistory.slice(0, 3).map(sale => `$${sale.price} (${sale.damage})`).join(', ')}

Provide concise JSON response:
- summary: 2 sentences max
- currentValue: estimated value range
- trend: up/down/stable
- recommendation: buy/hold/pass with 1-line reason

Keep total response under 150 words.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert vehicle auction analyst with deep knowledge of automotive markets, depreciation patterns, and auction dynamics."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 400
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error: any) {
    console.error('OpenAI analysis error:', error);
    return { 
      summary: 'OpenAI analysis temporarily unavailable',
      error: error.message 
    };
  }
}

/**
 * Perplexity Analysis for real-time market research
 */
async function performPerplexityAnalysis(vehicleInfo: any): Promise<any> {
  try {
    const prompt = `Quick market update for ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}: Current market value, demand level, and key trends affecting pricing. Keep response under 100 words.`;

    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        {
          role: 'system',
          content: 'You are a vehicle market research expert. Provide current, accurate market intelligence.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.2
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      marketInsight: response.data.choices[0].message.content,
      sources: response.data.citations || []
    };
  } catch (error: any) {
    console.error('Perplexity analysis error:', error);
    return { 
      marketInsight: 'Market research temporarily unavailable',
      error: error.message 
    };
  }
}

/**
 * Generate AI consensus recommendation
 */
function generateConsensus(openaiAnalysis: any, perplexityInsights: any, vinData: any[]): any {
  try {
    const latestEntry = vinData[0];
    const priceHistory = vinData.map(entry => entry.purchase_price).filter(p => p > 0);
    
    let recommendation = 'ANALYZE';
    let confidence = 50;
    
    if (priceHistory.length >= 2) {
      const pricetrend = priceHistory[0] - priceHistory[priceHistory.length - 1];
      const avgPrice = priceHistory.reduce((a, b) => a + b, 0) / priceHistory.length;
      
      // Simple consensus logic - can be enhanced with more sophisticated AI
      if (pricetrend > 0 && latestEntry.purchase_price < avgPrice * 0.8) {
        recommendation = 'BUY';
        confidence = 75;
      } else if (pricetrend < 0 || latestEntry.purchase_price > avgPrice * 1.2) {
        recommendation = 'PASS';
        confidence = 70;
      }
    }

    return {
      recommendation,
      confidence,
      reasoning: `Analysis based on ${vinData.length} auction records and multi-AI assessment`
    };
  } catch (error: any) {
    return {
      recommendation: 'ANALYZE',
      confidence: 50,
      reasoning: 'Insufficient data for consensus'
    };
  }
}

export function setupAuctionMindRoutes(app: Express) {
  /**
   * AuctionMind VIN Analysis Endpoint
   */
  app.post('/api/auction-mind/analyze', async (req: Request, res: Response) => {
    try {
      const { vin } = req.body;

      if (!vin || typeof vin !== 'string' || vin.length !== 17) {
        return res.status(400).json({
          success: false,
          message: 'Valid 17-character VIN required'
        });
      }

      console.log(`AuctionMind analysis requested for VIN: ${vin}`);

      // Fetch comprehensive VIN data from APICAR
      const vinData = await fetchVINData(vin);

      if (!vinData || vinData.length === 0) {
        return res.json({
          success: true,
          data: {
            message: 'No auction history found for this VIN',
            vin,
            history: [],
            openai: { summary: 'No data available for analysis' },
            perplexity: { marketInsight: 'No market data available' },
            consensus: { recommendation: 'ANALYZE', confidence: 0 }
          }
        });
      }

      // Perform multi-AI analysis
      const [openaiAnalysis, perplexityInsights] = await Promise.all([
        performOpenAIAnalysis(vinData),
        performPerplexityAnalysis(vinData[0])
      ]);

      // Generate consensus
      const consensus = generateConsensus(openaiAnalysis, perplexityInsights, vinData);

      // Format response data
      const analysisResult = {
        vin,
        vehicleInfo: {
          year: vinData[0].year,
          make: vinData[0].make,
          model: vinData[0].model,
          series: vinData[0].series,
          engine: vinData[0].engine,
          mileage: vinData[0].odometer
        },
        history: vinData.map((entry: any) => ({
          lotId: entry.lot_id,
          platform: entry.base_site.toUpperCase(),
          date: entry.sale_date,
          price: entry.purchase_price,
          damage: entry.damage_pr,
          status: entry.sale_status,
          location: entry.location
        })),
        openai: openaiAnalysis,
        perplexity: perplexityInsights,
        consensus,
        pricing: {
          currentValue: vinData[0].purchase_price,
          prediction: Math.round(vinData[0].purchase_price * 1.1), // Simple prediction
          trend: vinData.length > 1 ? 
            (vinData[0].purchase_price > vinData[1].purchase_price ? 'increasing' : 'decreasing') : 
            'stable'
        },
        recommendation: {
          strategy: openaiAnalysis.recommendation || 'Monitor market conditions and vehicle condition trends',
          confidence: consensus.confidence
        }
      };

      console.log(`AuctionMind analysis completed for VIN: ${vin}`);

      res.json({
        success: true,
        data: analysisResult
      });

    } catch (error: any) {
      console.error('AuctionMind analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Analysis failed',
        error: error.message
      });
    }
  });
}