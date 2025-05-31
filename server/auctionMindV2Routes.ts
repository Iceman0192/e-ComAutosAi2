/**
 * AuctionMind V2 - Clean Implementation
 * Uses /cars search endpoint for comprehensive live lot analysis with images
 */

import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import axios from 'axios';
import { db } from './db';
import { salesHistory } from '@shared/schema';
import { and, between, ilike, isNotNull, sql } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Search live lots using APICAR /cars endpoint
 */
async function searchLiveLots(lotId: string, site: number): Promise<any> {
  try {
    console.log(`Searching live lots for Lot ID: ${lotId}, Site: ${site}`);
    
    const response = await axios.get(`https://api.apicar.store/api/cars`, {
      headers: {
        'api-key': process.env.APICAR_API_KEY,
        'accept': '*/*'
      },
      params: {
        site: site,
        lot_id: lotId,
        size: 25 // APICAR API limit
      }
    });

    console.log(`Live lots API response: ${response.status}, found ${response.data?.data?.length || 0} lots`);
    
    if (response.data?.data && response.data.data.length > 0) {
      console.log('Sample lots found:', response.data.data.slice(0, 3).map((lot: any) => ({
        lot_id: lot.lot_id,
        make: lot.make,
        model: lot.model,
        year: lot.year
      })));
    }
    
    if (response.data?.data && response.data.data.length > 0) {
      // Find the exact lot match
      const targetLot = response.data.data.find((lot: any) => 
        lot.lot_id.toString() === lotId.toString()
      );
      
      // Get similar lots (same make/model or year range)
      const similarLots = response.data.data.filter((lot: any) => {
        if (lot.lot_id.toString() === lotId.toString()) return false;
        
        if (targetLot) {
          // Same make and model
          if (lot.make === targetLot.make && lot.model === targetLot.model) return true;
          // Same make, similar year (within 3 years)
          if (lot.make === targetLot.make && Math.abs(lot.year - targetLot.year) <= 3) return true;
        }
        
        return false;
      });
      
      return {
        targetLot,
        similarLots,
        totalFound: response.data.data.length
      };
    }
    
    return null;
  } catch (error: any) {
    console.error('Live lots search error:', error.response?.data || error.message);
    throw new Error(`Live lots search failed: ${error.message}`);
  }
}

/**
 * Search historical auction data by VIN
 */
async function searchAuctionHistory(vin: string): Promise<any[]> {
  try {
    console.log(`Searching auction history for VIN: ${vin}`);
    
    const result = await db
      .select()
      .from(salesHistory)
      .where(ilike(salesHistory.vin, vin))
      .orderBy(salesHistory.sale_date)
      .limit(50);
    
    console.log(`Found ${result.length} historical records for VIN`);
    return result;
  } catch (error: any) {
    console.error('Auction history search error:', error);
    return [];
  }
}

/**
 * Find comparable vehicles in database
 */
async function findComparableVehicles(vehicleInfo: any): Promise<any[]> {
  try {
    console.log(`Finding comparables for ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`);
    
    const yearRange = 2;
    const mileage = vehicleInfo.odometer || 0;
    const mileageRange = Math.max(mileage * 0.3, 10000);
    
    const result = await db
      .select()
      .from(salesHistory)
      .where(
        and(
          ilike(salesHistory.make, vehicleInfo.make),
          ilike(salesHistory.model, vehicleInfo.model),
          between(salesHistory.year, vehicleInfo.year - yearRange, vehicleInfo.year + yearRange),
          isNotNull(salesHistory.purchase_price)
        )
      )
      .orderBy(salesHistory.sale_date)
      .limit(20);
    
    console.log(`Found ${result.length} comparable vehicles`);
    return result;
  } catch (error: any) {
    console.error('Comparable search error:', error);
    return [];
  }
}

/**
 * AI Vision Analysis using current auction images
 */
async function performAIVisionAnalysis(lotData: any): Promise<any> {
  try {
    if (!lotData.link_img_hd || lotData.link_img_hd.length === 0) {
      return { 
        summary: 'No images available for AI vision analysis',
        hasImages: false 
      };
    }

    console.log(`Running AI vision analysis on ${lotData.link_img_hd.length} images`);

    // Use first 4 images for analysis
    const images = lotData.link_img_hd.slice(0, 4);
    const imageMessages = images.map((url: string) => ({
      type: "image_url",
      image_url: { url }
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional automotive damage assessor. Analyze these auction photos and provide a precise damage assessment. Be conservative and accurate - only report damage you can clearly see. Format your response as JSON with these exact fields:
          {
            "damageAssessment": "detailed description of visible damage",
            "repairEstimate": "estimated repair cost range",
            "overallCondition": "excellent/good/fair/poor",
            "investmentRecommendation": "buy/analyze/avoid",
            "confidenceLevel": "high/medium/low"
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this ${lotData.year} ${lotData.make} ${lotData.model} (${lotData.odometer} miles) for damage assessment:`
            },
            ...imageMessages
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    return { ...analysis, hasImages: true, imageCount: images.length };

  } catch (error: any) {
    console.error('AI vision analysis error:', error);
    return { 
      summary: 'AI vision analysis temporarily unavailable',
      hasImages: false,
      error: error.message 
    };
  }
}

/**
 * Generate market intelligence summary
 */
function generateMarketIntelligence(targetLot: any, similarLots: any[], historicalData: any[], comparables: any[]): any {
  try {
    const avgHistoricalPrice = historicalData.length > 0 
      ? historicalData.reduce((sum, record) => sum + (parseFloat(record.purchase_price) || 0), 0) / historicalData.length
      : 0;

    const avgComparablePrice = comparables.length > 0
      ? comparables.reduce((sum, record) => sum + (parseFloat(record.purchase_price) || 0), 0) / comparables.length
      : 0;

    const currentBid = targetLot.current_bid || 0;
    const estimatedValue = avgHistoricalPrice || avgComparablePrice || 0;

    let recommendation = 'ANALYZE';
    let confidence = 50;

    if (estimatedValue > 0 && currentBid > 0) {
      const bidToValueRatio = currentBid / estimatedValue;
      
      if (bidToValueRatio < 0.7) {
        recommendation = 'BUY';
        confidence = 85;
      } else if (bidToValueRatio > 1.2) {
        recommendation = 'AVOID';
        confidence = 80;
      } else {
        recommendation = 'ANALYZE';
        confidence = 70;
      }
    }

    return {
      recommendation,
      confidence,
      marketData: {
        historicalAvgPrice: Math.round(avgHistoricalPrice),
        comparableAvgPrice: Math.round(avgComparablePrice),
        currentBid,
        estimatedValue: Math.round(estimatedValue),
        similarLotsCount: similarLots.length,
        historicalRecords: historicalData.length,
        comparableRecords: comparables.length
      }
    };
  } catch (error: any) {
    console.error('Market intelligence error:', error);
    return {
      recommendation: 'ANALYZE',
      confidence: 0,
      marketData: {}
    };
  }
}

export function setupAuctionMindV2Routes(app: Express) {
  /**
   * Get available lots for testing
   */
  app.get('/api/auction-mind-v2/available-lots', async (req: Request, res: Response) => {
    try {
      const site = parseInt(req.query.site as string) || 1;
      
      const response = await axios.get(`https://api.apicar.store/api/cars`, {
        headers: {
          'api-key': process.env.APICAR_API_KEY,
          'accept': '*/*'
        },
        params: {
          site: site,
          size: 25
        }
      });

      if (response.data?.data) {
        const lots = response.data.data.map((lot: any) => ({
          lotId: lot.lot_id,
          vehicle: `${lot.year} ${lot.make} ${lot.model}`,
          damage: lot.damage_pr,
          currentBid: lot.current_bid,
          hasImages: lot.link_img_hd && lot.link_img_hd.length > 0,
          auctionDate: lot.auction_date
        }));

        return res.json({
          success: true,
          site: site === 1 ? 'Copart' : 'IAAI',
          lots: lots.slice(0, 10)
        });
      }

      return res.json({
        success: false,
        message: 'No lots found'
      });

    } catch (error: any) {
      console.error('Available lots error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch available lots'
      });
    }
  });

  /**
   * AuctionMind V2 - Comprehensive Lot Analysis
   */
  app.post('/api/auction-mind-v2/analyze', async (req: Request, res: Response) => {
    try {
      const { lotId, site } = req.body;

      if (!lotId || typeof lotId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Lot ID is required'
        });
      }

      if (!site || (site !== 1 && site !== 2)) {
        return res.status(400).json({
          success: false,
          message: 'Site must be 1 (Copart) or 2 (IAAI)'
        });
      }

      console.log(`AuctionMind V2 analysis for Lot ID: ${lotId}, Site: ${site}`);

      // Step 1: Search live lots
      const liveLotsData = await searchLiveLots(lotId, site);
      
      if (!liveLotsData) {
        return res.json({
          success: false,
          message: `No auction data found for search on ${site === 1 ? 'Copart' : 'IAAI'}`
        });
      }
      
      if (!liveLotsData.targetLot) {
        console.log(`Target lot ${lotId} not found in results. Found lots:`, liveLotsData.similarLots?.slice(0, 3).map((lot: any) => ({ lot_id: lot.lot_id, make: lot.make, model: lot.model })));
        return res.json({
          success: false,
          message: `Lot ${lotId} not found on ${site === 1 ? 'Copart' : 'IAAI'}. Found ${liveLotsData.totalFound} other lots.`
        });
      }

      const { targetLot, similarLots } = liveLotsData;

      // Step 2: AI Vision Analysis
      const visionAnalysis = await performAIVisionAnalysis(targetLot);

      // Step 3: Historical data search
      const historicalData = await searchAuctionHistory(targetLot.vin);
      const comparables = await findComparableVehicles(targetLot);

      // Step 4: Market intelligence
      const marketIntelligence = generateMarketIntelligence(
        targetLot, 
        similarLots, 
        historicalData, 
        comparables
      );

      // Format comprehensive response
      const analysisResult = {
        lotInfo: {
          lotId: targetLot.lot_id,
          vin: targetLot.vin,
          vehicle: `${targetLot.year} ${targetLot.make} ${targetLot.model} ${targetLot.series || ''}`.trim(),
          mileage: targetLot.odometer,
          damage: targetLot.damage_pr,
          status: targetLot.status,
          currentBid: targetLot.current_bid,
          auctionDate: targetLot.auction_date,
          location: targetLot.location,
          site: site === 1 ? 'Copart' : 'IAAI'
        },
        aiVision: visionAnalysis,
        marketIntelligence,
        similarLots: similarLots.slice(0, 5).map((lot: any) => ({
          lotId: lot.lot_id,
          vehicle: `${lot.year} ${lot.make} ${lot.model}`,
          damage: lot.damage_pr,
          currentBid: lot.current_bid,
          hasImages: lot.link_img_hd && lot.link_img_hd.length > 0
        })),
        historicalData: historicalData.slice(0, 10).map((record: any) => ({
          saleDate: record.sale_date,
          price: record.purchase_price,
          damage: record.vehicle_damage,
          platform: record.base_site
        }))
      };

      console.log('AuctionMind V2 analysis completed successfully');
      
      res.json({
        success: true,
        data: analysisResult
      });

    } catch (error: any) {
      console.error('AuctionMind V2 analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Analysis failed',
        error: error.message
      });
    }
  });
}