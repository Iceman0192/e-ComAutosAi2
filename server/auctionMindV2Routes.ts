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
 * Get specific lot and search for similar lots
 */
async function searchLiveLots(lotId: string, site: number): Promise<any> {
  try {
    console.log(`Fetching specific lot: ${lotId}, Site: ${site}`);
    
    // Step 1: Get the specific lot using direct lot lookup
    const lotResponse = await axios.get(`https://api.apicar.store/api/cars/${lotId}`, {
      headers: {
        'api-key': process.env.APICAR_API_KEY,
        'accept': '*/*'
      },
      params: {
        site: site
      }
    });

    console.log(`Specific lot API response: ${lotResponse.status}`);
    
    if (!lotResponse.data) {
      return null;
    }
    
    const targetLot = lotResponse.data;
    console.log(`Target lot found: ${targetLot.year} ${targetLot.make} ${targetLot.model}`);
    console.log(`Images available: ${targetLot.link_img_hd?.length || 0} HD, ${targetLot.link_img_small?.length || 0} small`);
    
    // Step 2: Search for similar lots using the vehicle info
    let similarLots = [];
    try {
      const similarResponse = await axios.get(`https://api.apicar.store/api/cars`, {
        headers: {
          'api-key': process.env.APICAR_API_KEY,
          'accept': '*/*'
        },
        params: {
          site: site,
          make: targetLot.make,
          model: targetLot.model,
          year_from: targetLot.year - 2,
          year_to: targetLot.year + 2,
          size: 20
        }
      });
      
      if (similarResponse.data?.data) {
        similarLots = similarResponse.data.data.filter((lot: any) => 
          lot.lot_id.toString() !== lotId.toString()
        );
        console.log(`Found ${similarLots.length} similar lots`);
      }
    } catch (similarError) {
      console.log('Similar lots search failed, continuing with target lot only');
    }
    
    return {
      targetLot,
      similarLots,
      totalFound: similarLots.length + 1
    };
    
  } catch (error: any) {
    console.error('Lot lookup error:', error.response?.data || error.message);
    throw new Error(`Lot lookup failed: ${error.message}`);
  }
}

/**
 * Search historical auction data by VIN
 */
async function searchAuctionHistory(vin: string): Promise<any[]> {
  try {
    console.log(`Searching APICAR auction history for VIN: ${vin}`);
    
    const response = await axios.get(`https://api.apicar.store/api/cars`, {
      headers: {
        'api-key': process.env.APICAR_API_KEY,
        'accept': '*/*'
      },
      params: {
        vin: vin,
        size: 50
      }
    });

    console.log(`APICAR VIN search response: ${response.status}, found ${response.data?.data?.length || 0} records`);
    
    if (response.data?.data && response.data.data.length > 0) {
      return response.data.data.map((record: any) => ({
        saleDate: record.sale_date,
        price: record.purchase_price,
        damage: record.damage_pr,
        platform: record.site === 1 ? 'Copart' : 'IAAI',
        lotId: record.lot_id,
        location: record.location,
        year: record.year,
        make: record.make,
        model: record.model,
        mileage: record.odometer
      }));
    }
    
    return [];
  } catch (error: any) {
    console.error('APICAR VIN search error:', error.response?.data || error.message);
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

    // Use ALL available images for maximum analysis quality
    const images = lotData.link_img_hd;
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
      ? historicalData.reduce((sum, record) => sum + (parseFloat(record.price) || 0), 0) / historicalData.length
      : 0;

    const currentBid = targetLot.current_bid || 0;
    const estimatedValue = avgHistoricalPrice || 0;

    // Calculate similar lots average bid
    const similarBids = similarLots.filter(lot => lot.current_bid > 0).map(lot => lot.current_bid);
    const avgSimilarBid = similarBids.length > 0 
      ? similarBids.reduce((sum, bid) => sum + bid, 0) / similarBids.length
      : 0;

    // Find lowest and highest similar lot bids
    const lowestSimilarBid = similarBids.length > 0 ? Math.min(...similarBids) : 0;
    const highestSimilarBid = similarBids.length > 0 ? Math.max(...similarBids) : 0;

    let recommendation = 'ANALYZE';
    let confidence = 50;
    let actionableBidSuggestion = '';

    if (estimatedValue > 0 && currentBid > 0) {
      const bidToValueRatio = currentBid / estimatedValue;
      
      if (bidToValueRatio < 0.7) {
        recommendation = 'BUY';
        confidence = 85;
        actionableBidSuggestion = `Strong buy signal. Consider bidding up to $${Math.round(estimatedValue * 0.8).toLocaleString()}`;
      } else if (bidToValueRatio > 1.2) {
        recommendation = 'AVOID';
        confidence = 80;
        actionableBidSuggestion = `Overpriced. Current bid exceeds historical value by ${Math.round((bidToValueRatio - 1) * 100)}%`;
      } else {
        recommendation = 'ANALYZE';
        confidence = 70;
        actionableBidSuggestion = `Fair value range. Monitor closely, consider max bid of $${Math.round(estimatedValue * 0.9).toLocaleString()}`;
      }
    } else if (avgSimilarBid > 0) {
      actionableBidSuggestion = `Similar lots averaging $${Math.round(avgSimilarBid).toLocaleString()}. Consider competitive bidding.`;
    }

    return {
      recommendation,
      confidence,
      actionableBidSuggestion,
      marketData: {
        historicalAvgPrice: Math.round(avgHistoricalPrice),
        currentBid,
        estimatedValue: Math.round(estimatedValue),
        avgSimilarBid: Math.round(avgSimilarBid),
        lowestSimilarBid,
        highestSimilarBid,
        similarLotsCount: similarLots.length,
        historicalRecords: historicalData.length,
        bidToValueRatio: estimatedValue > 0 ? Math.round((currentBid / estimatedValue) * 100) : 0,
        competitiveRange: {
          min: Math.round(avgSimilarBid * 0.9),
          max: Math.round(avgSimilarBid * 1.1)
        }
      }
    };
  } catch (error: any) {
    console.error('Market intelligence error:', error);
    return {
      recommendation: 'ANALYZE',
      confidence: 0,
      actionableBidSuggestion: 'Market analysis unavailable',
      marketData: {}
    };
  }
}

export function setupAuctionMindV2Routes(app: Express) {
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

      // Step 1: Lot Lookup - Get specific lot data
      const liveLotsData = await searchLiveLots(lotId, site);
      
      if (!liveLotsData || !liveLotsData.targetLot) {
        return res.json({
          success: false,
          message: `Lot ${lotId} not found on ${site === 1 ? 'Copart' : 'IAAI'}`
        });
      }

      const targetLot = liveLotsData.targetLot;
      console.log(`Step 1: Found lot ${targetLot.year} ${targetLot.make} ${targetLot.model}, VIN: ${targetLot.vin || 'N/A'}`);

      // Step 2: VIN Lookup - Get historical context
      let vinHistory = [];
      if (targetLot.vin) {
        console.log(`Step 2: VIN lookup for historical data`);
        try {
          vinHistory = await searchAuctionHistory(targetLot.vin);
          console.log(`Found ${vinHistory.length} historical records`);
        } catch (error) {
          console.log('VIN lookup failed, continuing without historical data');
        }
      } else {
        console.log('Step 2: No VIN available for historical lookup');
      }

      // Step 3: AI Analysis - Analyze current condition
      let aiAnalysis = null;
      if (targetLot.link_img_hd && targetLot.link_img_hd.length > 0) {
        console.log(`Step 3: AI analysis of ${targetLot.link_img_hd.length} images`);
        try {
          aiAnalysis = await performAIVisionAnalysis(targetLot);
        } catch (error) {
          console.log('AI analysis failed:', error);
        }
      } else {
        console.log('Step 3: No images available for AI analysis');
      }

      // Step 4: Similar Active Lots - Search based on vehicle specifications
      console.log(`Step 4: Searching for similar active lots`);
      let similarActiveLots = [];
      try {
        const response = await axios.get(`https://api.apicar.store/api/cars`, {
          headers: {
            'api-key': process.env.APICAR_API_KEY,
            'accept': '*/*'
          },
          params: {
            site: site,
            make: targetLot.make,
            model: targetLot.model,
            year_from: targetLot.year - 2,
            year_to: targetLot.year + 2,
            size: 20
          }
        });
        
        if (response.data?.data) {
          similarActiveLots = response.data.data.filter((lot: any) => 
            lot.lot_id.toString() !== lotId.toString()
          );
          console.log(`Found ${similarActiveLots.length} similar active lots`);
        }
      } catch (error) {
        console.log('Similar lots search failed');
      }

      // Step 5: Market intelligence
      const marketIntelligence = generateMarketIntelligence(
        targetLot, 
        similarActiveLots, 
        vinHistory, 
        []
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
          site: site === 1 ? 'Copart' : 'IAAI',
          images: targetLot.link_img_hd || [],
          imageCount: targetLot.link_img_hd ? targetLot.link_img_hd.length : 0
        },
        vinHistory: vinHistory.slice(0, 10).map((record: any) => ({
          saleDate: record.saleDate,
          price: record.price,
          damage: record.damage,
          platform: record.platform,
          lotId: record.lotId,
          location: record.location,
          year: record.year,
          make: record.make,
          model: record.model,
          mileage: record.mileage
        })),
        aiAnalysis,
        similarActiveLots: similarActiveLots.map((lot: any) => ({
          lotId: lot.lot_id,
          vin: lot.vin,
          vehicle: `${lot.year} ${lot.make} ${lot.model}`,
          year: lot.year,
          make: lot.make,
          model: lot.model,
          series: lot.series,
          trim: lot.trim,
          mileage: lot.odometer,
          color: lot.color,
          transmission: lot.transmission,
          driveType: lot.drive_type,
          fuelType: lot.fuel_type,
          keys: lot.keys,
          damage: lot.damage_pr,
          currentBid: lot.current_bid,
          auctionDate: lot.auction_date,
          location: lot.location,
          status: lot.status,
          titleStatus: lot.title_status,
          hasImages: lot.link_img_hd && lot.link_img_hd.length > 0,
          images: lot.link_img_hd || []
        })),
        marketIntelligence
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