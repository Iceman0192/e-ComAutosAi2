/**
 * AI Vehicle Analysis System - Clean Implementation
 * Processes comprehensive vehicle data and provides market intelligence
 */

import { Express, Request, Response } from 'express';
import { pool } from './db';

interface VehicleAnalysisRequest {
  platform: string;
  lotId: string;
  vin: string;
  vehicleData: {
    year: number;
    make: string;
    model: string;
    series?: string;
    mileage: number;
    damage_primary: string;
    damage_secondary?: string;
    color?: string;
    location?: string;
    title?: string;
    document?: string;
    keys?: string;
    engine?: string;
    fuel?: string;
    transmission?: string;
    drive?: string;
    current_bid: number;
    reserve_price: number;
    auction_date?: string;
    status?: string;
    seller?: string;
    images_hd?: string[];
    images_small?: string[];
    salvage_id?: string;
    vehicle_score?: string;
    iaai_360?: string;
    video?: string;
  };
}

export function setupAIAnalysis(app: Express) {
  app.post('/api/ai-analysis', async (req: Request, res: Response) => {
    try {
      const { platform, lotId, vin, vehicleData }: VehicleAnalysisRequest = req.body;

      console.log(`🤖 AI Analysis Request: ${vehicleData.year} ${vehicleData.make} ${vehicleData.model}, VIN: ${vin}`);

      // Step 1: Query database for comparable vehicles
      const comparableQuery = `
        SELECT 
          site, make, model, year, purchase_price, sale_date, vehicle_damage, 
          vehicle_mileage, sale_status, auction_location
        FROM sales_history 
        WHERE (make ILIKE $1 AND model ILIKE $2 AND year BETWEEN $3 AND $4)
           OR vin = $5
        ORDER BY sale_date DESC
        LIMIT 100
      `;

      const comparableResults = await pool.query(comparableQuery, [
        `%${vehicleData.make}%`,
        `%${vehicleData.model}%`,
        vehicleData.year - 3,
        vehicleData.year + 1,
        vin
      ]);

      // Separate by platform for cross-platform analysis
      const copartSales = comparableResults.rows.filter(row => row.site === 1);
      const iaaiSales = comparableResults.rows.filter(row => row.site === 2);

      // Calculate market statistics
      const copartPrices = copartSales
        .filter(row => row.purchase_price && parseFloat(row.purchase_price) > 0)
        .map(row => parseFloat(row.purchase_price));
      
      const iaaiPrices = iaaiSales
        .filter(row => row.purchase_price && parseFloat(row.purchase_price) > 0)
        .map(row => parseFloat(row.purchase_price));

      const copartAvg = copartPrices.length > 0 
        ? copartPrices.reduce((a, b) => a + b, 0) / copartPrices.length 
        : 0;
      
      const iaaiAvg = iaaiPrices.length > 0 
        ? iaaiPrices.reduce((a, b) => a + b, 0) / iaaiPrices.length 
        : 0;

      // Step 2: Initialize OpenAI for comprehensive analysis
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Step 3: Create comprehensive analysis prompt
      const analysisPrompt = `
COMPREHENSIVE VEHICLE AUCTION ANALYSIS

VEHICLE PROFILE:
- Vehicle: ${vehicleData.year} ${vehicleData.make} ${vehicleData.model} ${vehicleData.series || ''}
- VIN: ${vin}
- Platform: ${platform.toUpperCase()}
- Lot ID: ${lotId}
- Mileage: ${vehicleData.mileage?.toLocaleString()} miles

DAMAGE ASSESSMENT:
- Primary Damage: ${vehicleData.damage_primary}
- Secondary Damage: ${vehicleData.damage_secondary || 'None'}

VEHICLE SPECIFICATIONS:
- Engine: ${vehicleData.engine || 'N/A'}
- Transmission: ${vehicleData.transmission || 'N/A'}
- Drive Type: ${vehicleData.drive || 'N/A'}
- Fuel Type: ${vehicleData.fuel || 'N/A'}
- Color: ${vehicleData.color || 'N/A'}

AUCTION DETAILS:
- Location: ${vehicleData.location || 'N/A'}
- Title Status: ${vehicleData.title || 'N/A'}
- Keys Available: ${vehicleData.keys || 'N/A'}
- Current Bid: $${vehicleData.current_bid}
- Reserve Price: $${vehicleData.reserve_price}
- Auction Date: ${vehicleData.auction_date || 'N/A'}

MARKET DATA FROM DATABASE:
- Copart Sales Found: ${copartSales.length} vehicles (Avg: $${copartAvg.toFixed(0)})
- IAAI Sales Found: ${iaaiSales.length} vehicles (Avg: $${iaaiAvg.toFixed(0)})
- Price Difference: ${iaaiAvg > copartAvg ? 'IAAI higher' : 'Copart higher'} by $${Math.abs(iaaiAvg - copartAvg).toFixed(0)}

MULTIMEDIA AVAILABLE:
- HD Images: ${vehicleData.images_hd?.length || 0}
- 360° View: ${vehicleData.iaai_360 ? 'Yes' : 'No'}
- Video: ${vehicleData.video ? 'Yes' : 'No'}

Provide comprehensive analysis in JSON format with:
{
  "marketAnalysis": {
    "estimatedValue": "Dollar amount for clean vehicle",
    "damageImpact": "Percentage depreciation from damage",
    "repairCosts": "Estimated repair cost range"
  },
  "crossPlatformIntelligence": {
    "platformComparison": "Price differences between platforms",
    "arbitrageOpportunity": "Potential profit from platform differences"
  },
  "exportAnalysis": {
    "centralAmericaDemand": "Market demand assessment",
    "shippingConsiderations": "Logistics factors",
    "documentationRequirements": "Title and documentation assessment"
  },
  "recommendation": {
    "decision": "BUY|PASS|CAUTION",
    "confidence": 85,
    "maxBid": 15000,
    "reasoning": "Detailed explanation",
    "profitProjection": "Expected profit range"
  }
}

Focus on actionable insights for Central America export market with specific dollar amounts.
      `;

      // Step 4: Get AI analysis
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert automotive auction analyst specializing in salvage vehicles and Central America export markets. Provide detailed, actionable analysis with specific dollar amounts and confidence scores."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.2
      });

      const analysis = JSON.parse(aiResponse.choices[0].message.content || '{}');

      console.log('✅ AI Analysis completed successfully');

      // Step 5: Return comprehensive response
      res.json({
        success: true,
        data: {
          vehicle: vehicleData,
          marketData: {
            copartSales: copartSales.length,
            iaaiSales: iaaiSales.length,
            copartAverage: copartAvg,
            iaaiAverage: iaaiAvg,
            recentComparables: comparableResults.rows.slice(0, 10)
          },
          analysis,
          platform: platform.toUpperCase(),
          timestamp: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('❌ AI Analysis failed:', error);
      res.status(500).json({
        success: false,
        error: 'AI analysis failed',
        details: error.message
      });
    }
  });
}