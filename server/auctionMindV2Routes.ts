/**
 * AuctionMind V2 - Clean Implementation
 * Uses /cars search endpoint for comprehensive live lot analysis with images
 */

import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import axios from 'axios';
import { db } from './db';
import { salesHistory } from '@shared/schema';
import { and, between, ilike, isNotNull, sql, eq, gt, or } from 'drizzle-orm';

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
          size: 20,
          sale_status: 'available' // Only active/available lots
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
    console.log(`Searching APICAR VIN history for: ${vin}`);
    
    const response = await axios.get(`https://api.apicar.store/api/cars/vin/all`, {
      headers: {
        'api-key': process.env.APICAR_API_KEY,
        'accept': '*/*'
      },
      params: {
        vin: vin
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
    const targetLocation = vehicleInfo.auction_location || vehicleInfo.location || '';
    const targetState = extractStateFromLocation(targetLocation);
    const targetMileage = parseInt(vehicleInfo.odometer_reading || vehicleInfo.odometer) || 0;
    
    console.log(`Finding exact specification matches for ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model} in ${targetState} region`);
    
    // Use simpler query approach that works with current setup
    const result = await db
      .select()
      .from(salesHistory)
      .where(
        and(
          ilike(salesHistory.make, vehicleInfo.make),
          ilike(salesHistory.model, vehicleInfo.model),
          between(salesHistory.year, vehicleInfo.year - 2, vehicleInfo.year + 2),
          isNotNull(salesHistory.purchase_price)
        )
      )
      .orderBy(salesHistory.sale_date)
      .limit(30);

    // Filter for exact specifications and location preferences
    let exactMatches = result.filter(vehicle => {
      // Exact year match gets priority
      const isExactYear = vehicle.year === vehicleInfo.year;
      
      // Location matching - prioritize same state
      const isLocationMatch = targetState && (
        vehicle.auction_location?.includes(targetState) || 
        vehicle.buyer_state === targetState
      );
      
      // Specification matching
      let specScore = 0;
      
      if (vehicleInfo.transmission && vehicle.transmission) {
        if (vehicle.transmission.toLowerCase().includes(vehicleInfo.transmission.toLowerCase())) {
          specScore += 2;
        }
      }
      
      if (vehicleInfo.engine && vehicle.engine) {
        if (vehicle.engine.toLowerCase().includes(vehicleInfo.engine.toLowerCase())) {
          specScore += 2;
        }
      }
      
      if ((vehicleInfo.trim || vehicleInfo.series) && (vehicle.trim || vehicle.series)) {
        const targetTrim = (vehicleInfo.trim || vehicleInfo.series).toLowerCase();
        if (vehicle.trim?.toLowerCase().includes(targetTrim) || 
            vehicle.series?.toLowerCase().includes(targetTrim)) {
          specScore += 2;
        }
      }
      
      // Mileage similarity (±20,000 miles gets bonus)
      if (targetMileage > 0 && vehicle.vehicle_mileage) {
        const mileageDiff = Math.abs(parseInt(vehicle.vehicle_mileage) - targetMileage);
        if (mileageDiff <= 20000) {
          specScore += 1;
        }
      }
      
      // Only include sold vehicles with valid prices
      const hasSalePrice = vehicle.sale_status === 'Sold' && 
                          vehicle.purchase_price && 
                          parseFloat(vehicle.purchase_price) > 0;
      
      // Assign matching priority
      vehicle.matchPriority = 0;
      if (isExactYear && isLocationMatch && specScore >= 3) vehicle.matchPriority = 1; // Perfect match
      else if (isExactYear && isLocationMatch) vehicle.matchPriority = 2; // Exact year + location
      else if (isExactYear && specScore >= 2) vehicle.matchPriority = 3; // Exact year + specs
      else if (isLocationMatch && specScore >= 2) vehicle.matchPriority = 4; // Location + specs
      else if (isExactYear) vehicle.matchPriority = 5; // Exact year only
      else if (isLocationMatch) vehicle.matchPriority = 6; // Location only
      else if (specScore >= 2) vehicle.matchPriority = 7; // Specs only
      else vehicle.matchPriority = 8; // Basic match
      
      return hasSalePrice;
    });

    // Sort by priority and take best matches
    exactMatches.sort((a, b) => a.matchPriority - b.matchPriority);
    exactMatches = exactMatches.slice(0, 20);

    // Calculate location-based pricing insights
    const locationMatches = exactMatches.filter(vehicle => 
      targetState && (
        vehicle.auction_location?.includes(targetState) || 
        vehicle.buyer_state === targetState
      )
    );
    
    const locationAvgPrice = locationMatches.length > 0 
      ? locationMatches.reduce((sum, v) => sum + parseFloat(v.purchase_price || '0'), 0) / locationMatches.length
      : 0;

    const exactYearMatches = exactMatches.filter(v => v.year === vehicleInfo.year);
    
    console.log(`Found ${exactMatches.length} total matches: ${exactYearMatches.length} exact year, ${locationMatches.length} in ${targetState}`);
    console.log(`Location-based average: $${Math.round(locationAvgPrice)} from ${locationMatches.length} local sales`);

    return exactMatches;
  } catch (error: any) {
    console.error('Comparable search error:', error);
    return [];
  }
}

/**
 * Extract state abbreviation from location string
 */
function extractStateFromLocation(location: string): string {
  if (!location) return '';
  
  // Extract state patterns: "TX", "CA", "New York", etc.
  const stateMatch = location.match(/\b([A-Z]{2})\b|, ([A-Z]{2})$/) || 
                    location.match(/\b(California|Texas|Florida|New York|Illinois|Pennsylvania|Ohio|Georgia|North Carolina|Michigan|Virginia|Washington|Arizona|Massachusetts|Tennessee|Indiana|Missouri|Maryland|Wisconsin|Colorado|Minnesota|South Carolina|Alabama|Louisiana|Kentucky|Oregon|Oklahoma|Connecticut|Utah|Iowa|Nevada|Arkansas|Mississippi|Kansas|New Mexico|Nebraska|West Virginia|Idaho|Hawaii|New Hampshire|Maine|Montana|Rhode Island|Delaware|South Dakota|North Dakota|Alaska|Vermont|Wyoming)\b/i);
  
  if (stateMatch) {
    const state = stateMatch[1] || stateMatch[2] || stateMatch[0];
    // Convert full state names to abbreviations if needed
    const stateAbbreviations: { [key: string]: string } = {
      'California': 'CA', 'Texas': 'TX', 'Florida': 'FL', 'New York': 'NY',
      'Illinois': 'IL', 'Pennsylvania': 'PA', 'Ohio': 'OH', 'Georgia': 'GA'
    };
    return stateAbbreviations[state] || state.toUpperCase();
  }
  
  return location.split(',')[0].trim().toUpperCase().slice(0, 2);
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

    // Filter images to only include supported formats and valid URLs
    const images = lotData.link_img_hd.filter((url: string) => {
      // Check if URL contains supported image formats
      const supportedFormats = /\.(jpg|jpeg|png|gif|webp)($|\?)/i;
      const hasValidFormat = supportedFormats.test(url);
      
      // Skip video files
      const isVideo = /\.(mp4|mov|avi|webm)($|\?)/i.test(url);
      
      if (isVideo) {
        console.log(`Skipping video file: ${url}`);
        return false;
      }
      
      if (!hasValidFormat) {
        console.log(`Skipping unsupported format: ${url}`);
        return false;
      }
      
      return true;
    });

    console.log(`Filtered to ${images.length} valid image files for AI analysis`);

    if (images.length === 0) {
      console.log('No valid images found for AI analysis');
      return {
        overallCondition: "Unable to assess - no valid images",
        damageAssessment: "No analyzable images available",
        repairEstimate: "Cannot estimate without images",
        marketImpact: "Unknown",
        confidence: 0
      };
    }

    const imageMessages = images.map((url: string) => ({
      type: "image_url",
      image_url: { url }
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a certified automotive damage assessor with 20+ years of experience. Perform a meticulous damage assessment following this systematic approach:

MANDATORY INSPECTION CHECKLIST - Examine each area separately:
1. FRONT: bumper, hood, headlights, grille, windshield
2. DRIVER SIDE: front door, rear door, front fender, rear quarter panel, side mirrors
3. PASSENGER SIDE: front door, rear door, front fender, rear quarter panel, side mirrors  
4. REAR: bumper, tailgate/trunk, taillights, rear window
5. ROOF: sunroof, roof rails, antenna area
6. INTERIOR: seats, dashboard, door panels, electronics
7. WHEELS/TIRES: all four wheels, tire condition, suspension visible

CRITICAL INSTRUCTIONS:
- Look at EACH image carefully - some may show different angles of the same damage
- Do NOT assume undamaged areas - only state "appears undamaged" if you can clearly see that area in the images
- Pay special attention to subtle damage: paint scratches, panel gaps, color mismatches
- If you see any damage on passenger side in ANY image, report it specifically
- Look for damage patterns that might indicate impact direction

DAMAGE DOCUMENTATION:
- Document exact location (front passenger door, rear driver quarter panel, etc.)
- Note damage type (dent, scratch, missing part, misalignment)
- Estimate severity (minor, moderate, major, severe)

Format response as JSON:
{
  "damageAssessment": "systematic description going through each vehicle side/area",
  "damageAreas": ["specific damaged areas with side designation"],
  "repairEstimate": "realistic cost range",
  "overallCondition": "excellent/good/fair/poor", 
  "investmentRecommendation": "buy/analyze/avoid",
  "confidenceLevel": "high/medium/low",
  "keyFindings": ["critical damage observations by area"]
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `CRITICAL DAMAGE ASSESSMENT REQUIRED: This ${lotData.year} ${lotData.make} ${lotData.model} (${lotData.odometer || 'unknown'} miles) has ${lotData.link_img_hd.length} high-resolution images.

IMPORTANT: Previous assessments may have missed passenger side damage. You MUST examine each image systematically:
- Check every angle for damage visibility
- Look specifically for passenger side damage in multiple images
- Do not declare any area "undamaged" unless you can clearly see that area is intact
- Report ALL damage found, regardless of severity

Examine all images now and provide complete damage documentation:`
            },
            ...imageMessages
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1200
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    return { ...analysis, hasImages: true, imageCount: images.length };

  } catch (error: any) {
    console.error('AI vision analysis error:', error);
    
    // Handle specific image format errors
    if (error.code === 'invalid_image_format' || error.message?.includes('unsupported image')) {
      return { 
        summary: 'Image analysis unavailable - auction platform images are in an unsupported format for AI processing. Analysis continues with available vehicle data.',
        hasImages: true,
        imageCount: lotData.link_img_hd?.length || 0,
        error: 'Image format not supported by AI vision analysis',
        damageAssessment: 'Unable to perform visual damage assessment due to image format limitations. Please refer to auction platform photos for visual inspection.',
        recommendation: 'Manual inspection recommended'
      };
    }
    
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
function generateMarketIntelligence(targetLot: any, similarLots: any[], historicalData: any[], internalComparables: any[]): any {
  try {
    // VIN-specific historical data
    const avgHistoricalPrice = historicalData.length > 0 
      ? historicalData.reduce((sum, record) => sum + (parseFloat(record.price) || 0), 0) / historicalData.length
      : 0;

    // Internal database comparables (filtered for sold items with prices)
    const soldComparables = internalComparables.filter(comp => 
      comp.purchase_price && parseFloat(comp.purchase_price) > 0
    );
    const avgInternalPrice = soldComparables.length > 0
      ? soldComparables.reduce((sum, comp) => sum + parseFloat(comp.purchase_price), 0) / soldComparables.length
      : 0;

    const currentBid = targetLot.current_bid || 0;
    
    // Weighted estimated value (prioritize VIN history, then internal comparables)
    let estimatedValue = 0;
    if (avgHistoricalPrice > 0) {
      estimatedValue = avgHistoricalPrice;
    } else if (avgInternalPrice > 0) {
      estimatedValue = avgInternalPrice;
    }

    // Calculate similar lots average bid (current active lots)
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

    // Enhanced recommendation logic with internal data
    if (estimatedValue > 0 && currentBid > 0) {
      const bidToValueRatio = currentBid / estimatedValue;
      
      // Increase confidence based on data sources
      let baseConfidence = 70;
      if (avgHistoricalPrice > 0) baseConfidence += 10; // VIN history available
      if (soldComparables.length >= 5) baseConfidence += 5; // Good comparable sample
      
      if (bidToValueRatio < 0.7) {
        recommendation = 'BUY';
        confidence = Math.min(baseConfidence + 15, 95);
        actionableBidSuggestion = `Strong buy signal. Consider bidding up to $${Math.round(estimatedValue * 0.8).toLocaleString()}`;
      } else if (bidToValueRatio > 1.2) {
        recommendation = 'AVOID';
        confidence = Math.min(baseConfidence + 10, 90);
        actionableBidSuggestion = `Overpriced. Current bid exceeds historical value by ${Math.round((bidToValueRatio - 1) * 100)}%`;
      } else {
        recommendation = 'ANALYZE';
        confidence = baseConfidence;
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
        internalAvgPrice: Math.round(avgInternalPrice),
        currentBid,
        estimatedValue: Math.round(estimatedValue),
        avgSimilarBid: Math.round(avgSimilarBid),
        lowestSimilarBid,
        highestSimilarBid,
        similarLotsCount: similarLots.length,
        historicalRecords: historicalData.length,
        internalComparables: soldComparables.length,
        bidToValueRatio: estimatedValue > 0 ? Math.round((currentBid / estimatedValue) * 100) : 0,
        competitiveRange: {
          min: Math.round(avgSimilarBid * 0.9),
          max: Math.round(avgSimilarBid * 1.1)
        },
        dataQuality: {
          hasVinHistory: avgHistoricalPrice > 0,
          hasInternalData: soldComparables.length > 0,
          hasActiveLots: similarLots.length > 0
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
            size: 20,
            sale_status: 'available' // Only active lots
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

      // Step 5: Internal Database Search - Historical comparables
      console.log(`Step 5: Searching internal database for historical comparables`);
      let internalComparables = [];
      try {
        internalComparables = await findComparableVehicles(targetLot);
        console.log(`Found ${internalComparables.length} internal historical comparables`);
      } catch (error) {
        console.log('Internal database search failed');
      }

      // Step 6: Market intelligence
      const marketIntelligence = generateMarketIntelligence(
        targetLot, 
        similarActiveLots, 
        vinHistory, 
        internalComparables
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