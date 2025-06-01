/**
 * AuctionMind API Routes - Multi-AI Vehicle Analysis System
 * Uses VIN-based comprehensive data for superior insights
 */

import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import axios from 'axios';
import { db } from './db';
import { salesHistory } from '@shared/schema';
import { and, between, ilike, isNotNull, gt, sql } from 'drizzle-orm';

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
 * Search for comparable vehicles in the database
 */
async function findComparableVehiclesInDB(vehicleInfo: any): Promise<any[]> {
  try {
    console.log('Vehicle info for search:', vehicleInfo);
    
    const yearRange = 2; // Search within 2 years
    // Use odometer field from API data, fallback to vehicle_mileage
    const mileage = vehicleInfo.odometer || vehicleInfo.vehicle_mileage || 0;
    const mileageRange = Math.round(mileage * 0.3); // 30% mileage tolerance
    
    const result = await db
      .select({
        lot_id: salesHistory.lot_id,
        vin: salesHistory.vin,
        make: salesHistory.make,
        model: salesHistory.model,
        year: salesHistory.year,
        series: salesHistory.series,
        vehicle_mileage: salesHistory.vehicle_mileage,
        vehicle_damage: salesHistory.vehicle_damage,
        purchase_price: salesHistory.purchase_price,
        sale_date: salesHistory.sale_date,
        auction_location: salesHistory.auction_location,
        base_site: salesHistory.base_site
      })
      .from(salesHistory)
      .where(
        and(
          ilike(salesHistory.make, `%${vehicleInfo.make}%`),
          ilike(salesHistory.model, `%${vehicleInfo.model}%`),
          between(salesHistory.year, vehicleInfo.year - yearRange, vehicleInfo.year + yearRange),
          between(
            salesHistory.vehicle_mileage, 
            Math.max(0, mileage - mileageRange),
            mileage + mileageRange
          ),
          isNotNull(salesHistory.vehicle_damage),
          isNotNull(salesHistory.purchase_price),
          gt(salesHistory.purchase_price, "0")
        )
      )
      .limit(25);

    console.log(`Found ${result.length} comparable vehicles for ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model} with ${mileage} miles`);
    return result;
  } catch (error: any) {
    console.error('Database search error:', error);
    return [];
  }
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
    console.log(`VIN API response has ${response.data?.length || 0} records`);
    
    if (response.data && response.data.length > 0) {
      const firstRecord = response.data[0];
      console.log('First record keys:', Object.keys(firstRecord));
      console.log('Image fields check:', {
        link_img_hd: firstRecord.link_img_hd ? `Array with ${firstRecord.link_img_hd.length} items` : 'null/undefined',
        link_img_small: firstRecord.link_img_small ? `Array with ${firstRecord.link_img_small.length} items` : 'null/undefined',
        images: firstRecord.images ? 'exists' : 'null/undefined'
      });
    }
    
    return response.data;
  } catch (error: any) {
    console.log(`VIN data fetch error:`, error.response?.data || error.message);
    throw new Error(`VIN data fetch failed: ${error.message}`);
  }
}

/**
 * Fetch live lot data with images from APICAR
 */
async function fetchLiveLotData(lotId: string, site: number): Promise<any> {
  try {
    console.log(`Fetching live lot data for Lot ID: ${lotId}, Site: ${site}`);
    
    const response = await axios.get(`https://api.apicar.store/api/cars`, {
      headers: {
        'api-key': process.env.APICAR_API_KEY,
        'accept': '*/*'
      },
      params: {
        site: site,
        lot_id: lotId,
        size: 10
      }
    });

    console.log('Live Lot API Response status:', response.status);
    console.log('Live Lot API Response data count:', response.data?.data?.length || 0);
    
    // Find the matching lot in the response
    if (response.data.data && response.data.data.length > 0) {
      const matchingLot = response.data.data.find((lot: any) => 
        lot.lot_id.toString() === lotId.toString()
      );
      
      if (matchingLot) {
        console.log('Found matching lot with images:', {
          lot_id: matchingLot.lot_id,
          has_hd_images: matchingLot.link_img_hd ? matchingLot.link_img_hd.length : 0,
          has_small_images: matchingLot.link_img_small ? matchingLot.link_img_small.length : 0
        });
      }
      
      return matchingLot || null;
    }
    
    return null;
  } catch (error: any) {
    console.error('Error fetching live lot data from APICAR:', error.response?.data || error.message);
    throw new Error(`Failed to fetch live lot data: ${error.message}`);
  }
}

/**
 * OpenAI Vision Analysis using GPT-4o for real vehicle image assessment
 */
async function performOpenAIAnalysis(vinData: any[], liveLotData?: any): Promise<any> {
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

    // Prioritize live lot images over VIN data images
    let images = [];
    let imageSource = 'none';
    
    if (liveLotData && liveLotData.link_img_hd && Array.isArray(liveLotData.link_img_hd)) {
      images = liveLotData.link_img_hd;
      imageSource = 'live_lot';
      console.log('Using live lot images:', images.length);
    } else if (vehicleInfo.link_img_hd && Array.isArray(vehicleInfo.link_img_hd)) {
      images = vehicleInfo.link_img_hd;
      imageSource = 'vin_data';
      console.log('Using VIN data images:', images.length);
    } else if (vehicleInfo.images) {
      // Handle database records format
      if (Array.isArray(vehicleInfo.images)) {
        images = vehicleInfo.images;
        imageSource = 'database';
      } else if (typeof vehicleInfo.images === 'string') {
        try {
          images = JSON.parse(vehicleInfo.images);
          imageSource = 'database';
        } catch (e) {
          console.log('Failed to parse images JSON:', vehicleInfo.images);
          images = [];
        }
      }
    }
    
    console.log(`Images found: ${images.length} (source: ${imageSource})`);
    if (images.length > 0) {
      console.log('Sample image URL:', images[0]);
    }
    const imageMessages = [];

    // Include up to 4 key images for analysis
    const keyImages = images.slice(0, 4);
    
    if (keyImages.length > 0) {
      console.log(`Analyzing ${keyImages.length} vehicle images with OpenAI Vision`);
      console.log('Image URLs:', keyImages.slice(0, 2)); // Log first 2 image URLs
      
      for (const imageUrl of keyImages) {
        imageMessages.push({
          type: "image_url" as const,
          image_url: {
            url: imageUrl,
            detail: "high" as const
          }
        });
      }

      const prompt = `CRITICAL: Be extremely conservative and accurate. Only report damage that is clearly visible and obvious in the photos.

Analyze this ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model} with ${vehicleInfo.odometer} miles.

Vehicle Details:
- Recent Sales: ${saleHistory.slice(0, 3).map(sale => `$${sale.price} (${sale.damage})`).join(', ')}
- Listed Damage: ${vehicleInfo.damage_pr}

IMPORTANT INSTRUCTIONS:
1. ONLY report damage you can clearly see in the images
2. If the vehicle looks clean or damage is not visible, state "No visible damage in images"
3. Do not speculate or assume damage based on listings
4. Be honest if image quality limits assessment

Provide JSON analysis:
- summary: 2-3 sentence overview based ONLY on what you see
- damageAssessment: "No visible damage in images" OR specific damage you clearly observe
- repairEstimate: realistic cost range only if damage is visible
- currentValue: market value estimate
- trend: price trend analysis based on data
- recommendation: conservative buy/hold/pass recommendation
- confidenceScore: 0-1 based on image clarity and visible evidence

Focus on what is actually visible, not what might be there.`;

      const userContent: any[] = [
        { type: "text", text: prompt },
        ...imageMessages
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a conservative automotive damage assessor with 20+ years experience. You NEVER report damage unless it's clearly visible and obvious in photos. You prioritize accuracy over assumptions. If damage isn't clearly visible, you state that explicitly."
          },
          {
            role: "user",
            content: userContent
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 800
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      console.log('OpenAI Vision analysis completed:', Object.keys(result));
      return result;
    } else {
      console.log('No images available for visual analysis, using text-only mode');
      // Fallback to text-only analysis if no images
      const prompt = `Brief analysis for ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model} (${vehicleInfo.odometer} miles):

Recent Sales: ${saleHistory.slice(0, 3).map(sale => `$${sale.price} (${sale.damage})`).join(', ')}

Provide concise JSON response:
- summary: 2 sentences max
- currentValue: estimated value range
- trend: up/down/stable
- recommendation: buy/hold/pass with 1-line reason

Keep total response under 150 words.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
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
    }
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
function generateConsensus(openaiAnalysis: any, perplexityInsights: any, vinData: any[], comparableVehicles: any[] = []): any {
  try {
    const latestEntry = vinData[0];
    const priceHistory = vinData.map(entry => entry.purchase_price).filter(p => p > 0);
    
    let recommendation = 'ANALYZE';
    let confidence = 50;
    
    // Factor in comparable vehicles from database
    const comparableCount = comparableVehicles.length;
    const avgComparablePrice = comparableVehicles.length > 0 
      ? comparableVehicles.reduce((sum, vehicle) => sum + parseFloat(vehicle.purchase_price || 0), 0) / comparableCount
      : 0;
    
    // Enhanced consensus logic with image analysis and comparable data
    if (priceHistory.length >= 2 && comparableCount > 0) {
      const currentPrice = latestEntry.purchase_price;
      const pricetrend = priceHistory[0] - priceHistory[priceHistory.length - 1];
      const avgPrice = priceHistory.reduce((a, b) => a + b, 0) / priceHistory.length;
      
      // Factor in OpenAI confidence score from image analysis
      const imageConfidence = openaiAnalysis.confidenceScore || 0.5;
      const damageLevel = openaiAnalysis.damageAssessment ? 
        (openaiAnalysis.damageAssessment.toLowerCase().includes('severe') ? 0.3 : 
         openaiAnalysis.damageAssessment.toLowerCase().includes('moderate') ? 0.6 : 0.8) : 0.5;
      
      // Compare against database comparables
      const priceVsComparables = avgComparablePrice > 0 ? currentPrice / avgComparablePrice : 1;
      
      if (pricetrend > 0 && currentPrice < avgComparablePrice * 0.85 && damageLevel > 0.6) {
        recommendation = 'BUY';
        confidence = Math.min(85, 60 + (imageConfidence * 25));
      } else if (pricetrend < 0 || currentPrice > avgComparablePrice * 1.15 || damageLevel < 0.4) {
        recommendation = 'PASS';
        confidence = Math.min(80, 55 + (imageConfidence * 25));
      } else {
        recommendation = 'ANALYZE';
        confidence = Math.min(75, 45 + (imageConfidence * 30));
      }
    }

    return {
      recommendation,
      confidence: Math.round(confidence),
      reasoning: `Analysis based on ${vinData.length} auction records, ${comparableCount} comparable vehicles, and visual assessment`,
      comparableData: {
        count: comparableCount,
        avgPrice: Math.round(avgComparablePrice),
        priceComparison: avgComparablePrice > 0 ? 
          (latestEntry.purchase_price / avgComparablePrice * 100).toFixed(1) + '% of average' : 'N/A'
      }
    };
  } catch (error: any) {
    return {
      recommendation: 'ANALYZE',
      confidence: 50,
      reasoning: 'Insufficient data for consensus',
      comparableData: { count: 0, avgPrice: 0, priceComparison: 'N/A' }
    };
  }
}

/**
 * Search VIN history in both internal database and external APIs
 */
async function searchVinHistory(vin: string): Promise<any> {
  try {
    console.log(`Searching VIN history for: ${vin}`);
    
    // Search internal database first
    const internalResults = await db
      .select()
      .from(salesHistory)
      .where(sql`${salesHistory.vin} = ${vin}`)
      .orderBy(sql`${salesHistory.sale_date} DESC`);
    
    console.log(`Found ${internalResults.length} records in internal database`);
    
    // Search external API using the correct history-cars endpoint for VIN history
    let externalResults = [];
    
    try {
      const response = await axios.get(`https://api.apicar.store/api/history-cars`, {
        headers: {
          'api-key': process.env.APICAR_API_KEY,
          'accept': '*/*'
        },
        params: { 
          vin: vin,
          size: 50 // Get more results to ensure we find the VIN
        }
      });
      
      if (response.data?.data) {
        externalResults = response.data.data.filter((vehicle: any) => vehicle.vin === vin);
        console.log(`Found ${externalResults.length} VIN history records from APICAR`);
      }
    } catch (error) {
      console.log('External VIN history search failed:', error);
    }
    
    console.log(`Total external VIN history results: ${externalResults.length}`);
    
    // Combine and deduplicate results
    const allResults = [...internalResults];
    
    // Add external results that aren't already in internal database
    for (const extResult of externalResults) {
      const exists = internalResults.some(internal => 
        internal.lot_id === extResult.lot_id && internal.site === extResult.site
      );
      
      if (!exists) {
        // Transform external result to match internal format
        allResults.push({
          id: `${extResult.lot_id}-${extResult.site}-ext`,
          lot_id: extResult.lot_id,
          site: extResult.site,
          base_site: extResult.site === 1 ? 'copart' : 'iaai',
          vin: extResult.vin,
          sale_status: extResult.sale_status || 'Unknown',
          sale_date: extResult.sale_date || new Date(),
          purchase_price: extResult.purchase_price || extResult.price || 0,
          auction_location: extResult.location || 'Unknown',
          vehicle_damage: extResult.damage_pr || extResult.vehicle_damage || 'Unknown',
          vehicle_title: extResult.title || extResult.vehicle_title || 'Unknown',
          year: extResult.year,
          make: extResult.make,
          model: extResult.model,
          series: extResult.series,
          trim: extResult.trim,
          transmission: extResult.transmission,
          drive: extResult.drive,
          fuel: extResult.fuel,
          color: extResult.color,
          vehicle_mileage: extResult.odometer || extResult.vehicle_mileage,
          images: extResult.link_img_hd || [],
          link: extResult.link,
          created_at: new Date(),
          vehicle_has_keys: null,
          buyer_state: null,
          buyer_country: null,
          buyer_type: null,
          engine: extResult.engine
        });
      }
    }
    
    // Calculate price statistics
    const soldRecords = allResults.filter(r => 
      r.purchase_price && parseFloat(r.purchase_price.toString()) > 0
    );
    
    const prices = soldRecords.map(r => parseFloat(r.purchase_price.toString()));
    const priceHistory = {
      averagePrice: prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0,
      highestPrice: prices.length > 0 ? Math.max(...prices) : 0,
      lowestPrice: prices.length > 0 ? Math.min(...prices) : 0,
      lastSalePrice: soldRecords.length > 0 ? parseFloat(soldRecords[0].purchase_price.toString()) : 0
    };
    
    // Get unique platforms
    const platforms = [...new Set(allResults.map(r => r.site === 1 ? 'Copart' : 'IAAI'))];
    
    // Sort by sale date (newest first)
    allResults.sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime());
    
    return {
      vin,
      totalRecords: allResults.length,
      vehicles: allResults.map(vehicle => ({
        ...vehicle,
        images: typeof vehicle.images === 'string' ? JSON.parse(vehicle.images || '[]') : vehicle.images || []
      })),
      priceHistory,
      platforms,
      timespan: {
        firstSale: allResults.length > 0 ? allResults[allResults.length - 1].sale_date : null,
        lastSale: allResults.length > 0 ? allResults[0].sale_date : null
      }
    };
    
  } catch (error: any) {
    console.error('VIN search error:', error);
    throw new Error('Failed to search VIN history');
  }
}

export function setupAuctionMindRoutes(app: Express) {
  /**
   * Database Record Count Endpoint
   */
  app.get('/api/database/count', async (req: Request, res: Response) => {
    try {
      const result = await db.execute('SELECT COUNT(*) as count FROM sales_history');
      const count = result.rows[0]?.count || 0;
      res.json({ count: parseInt(count as string) });
    } catch (error: any) {
      console.error('Database count error:', error);
      res.json({ count: 0 });
    }
  });

  /**
   * Dashboard Statistics Endpoint
   */
  app.get('/api/dashboard/stats', async (req: Request, res: Response) => {
    try {
      // Get database record count
      const dbCountResult = await db.execute('SELECT COUNT(*) as count FROM sales_history');
      const totalRecords = parseInt(dbCountResult.rows[0]?.count as string) || 0;

      // Get recent data additions (last 30 days)
      const recentAdditionsResult = await db.execute(`
        SELECT COUNT(*) as count 
        FROM sales_history 
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `);
      const recentAdditions = parseInt(recentAdditionsResult.rows[0]?.count as string) || 0;

      // Get unique makes and models
      const makesResult = await db.execute('SELECT COUNT(DISTINCT make) as count FROM sales_history');
      const totalMakes = parseInt(makesResult.rows[0]?.count as string) || 0;

      const modelsResult = await db.execute('SELECT COUNT(DISTINCT model) as count FROM sales_history');
      const totalModels = parseInt(modelsResult.rows[0]?.count as string) || 0;

      // Get record counts by platform (skip pricing for now due to data format issues)
      const platformCountResult = await db.execute(`
        SELECT 
          base_site,
          COUNT(*) as count
        FROM sales_history 
        WHERE base_site IS NOT NULL
        GROUP BY base_site
      `);

      const platformStats = platformCountResult.rows.reduce((acc: any, row: any) => {
        acc[row.base_site] = {
          count: parseInt(row.count as string),
          avgPrice: 0 // Will add pricing analysis later with better data cleaning
        };
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          totalRecords,
          recentAdditions,
          totalMakes,
          totalModels,
          platformStats,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch dashboard statistics' 
      });
    }
  });

  /**
   * VIN History Search Endpoint
   */
  app.post('/api/auction-mind/vin-history', async (req: Request, res: Response) => {
    try {
      const { vin } = req.body;
      
      if (!vin) {
        return res.status(400).json({
          success: false,
          message: 'VIN is required'
        });
      }
      
      if (vin.length !== 17) {
        return res.status(400).json({
          success: false,
          message: 'VIN must be exactly 17 characters'
        });
      }
      
      console.log(`VIN History Search for: ${vin}`);
      
      const vinHistoryData = await searchVinHistory(vin);
      
      if (vinHistoryData.totalRecords === 0) {
        return res.json({
          success: false,
          message: 'No auction records found for this VIN'
        });
      }
      
      res.json({
        success: true,
        data: vinHistoryData
      });
      
    } catch (error: any) {
      console.error('VIN history search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search VIN history'
      });
    }
  });

  /**
   * VIN Lookup Endpoint - First step to get lot information
   */
  app.post('/api/auction-mind/vin-lookup', async (req: Request, res: Response) => {
    try {
      const { vin } = req.body;

      if (!vin || typeof vin !== 'string' || vin.length !== 17) {
        return res.status(400).json({
          success: false,
          message: 'Valid 17-character VIN required'
        });
      }

      console.log(`VIN lookup requested for: ${vin}`);

      // Fetch VIN data from APICAR
      const vinData = await fetchVINData(vin);

      if (!vinData || vinData.length === 0) {
        return res.json({
          success: false,
          message: 'No auction history found for this VIN'
        });
      }

      // Return VIN data for frontend to extract lot information
      res.json({
        success: true,
        data: vinData
      });

    } catch (error: any) {
      console.error('VIN lookup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to lookup VIN data'
      });
    }
  });

  /**
   * AuctionMind VIN + Lot Analysis Endpoint
   */
  app.post('/api/auction-mind/analyze', async (req: Request, res: Response) => {
    try {
      const { vin, lotId } = req.body;

      if (!vin || typeof vin !== 'string' || vin.length !== 17) {
        return res.status(400).json({
          success: false,
          message: 'Valid 17-character VIN required'
        });
      }

      if (!lotId || typeof lotId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Lot ID required for current auction images'
        });
      }

      console.log(`AuctionMind analysis requested for VIN: ${vin}, Lot ID: ${lotId}`);

      // Step 1: Fetch comprehensive VIN data from APICAR
      const vinData = await fetchVINData(vin);

      if (!vinData || vinData.length === 0) {
        return res.json({
          success: true,
          data: {
            message: 'No auction history found for this VIN',
            vin,
            lotId,
            history: [],
            openai: { summary: 'No data available for analysis' },
            perplexity: { marketInsight: 'No market data available' },
            consensus: { recommendation: 'ANALYZE', confidence: 0 }
          }
        });
      }

      // Step 2: Determine auction site from VIN data
      const vehicleInfo = vinData[0];
      const auctionSite = vehicleInfo.base_site === 'copart' ? 1 : 2; // 1=Copart, 2=IAAI
      console.log(`Auto-detected auction site: ${vehicleInfo.base_site} (site=${auctionSite})`);

      // Step 3: Fetch live lot data with current images
      let liveLotData = null;
      try {
        liveLotData = await fetchLiveLotData(lotId, auctionSite);
        if (!liveLotData) {
          console.log(`No live lot found for Lot ID ${lotId} on site ${auctionSite}`);
        }
      } catch (error) {
        console.log('Live lot fetch failed, proceeding with VIN data only:', error);
      }

      // Step 4: Search for comparable vehicles in database
      const comparableVehicles = await findComparableVehiclesInDB(vehicleInfo);
      
      // Step 5: Perform multi-AI analysis with live lot images
      const [openaiAnalysis, perplexityInsights] = await Promise.all([
        performOpenAIAnalysis(vinData, liveLotData),
        performPerplexityAnalysis(vinData[0])
      ]);

      // Step 6: Generate consensus with all available data
      const consensus = generateConsensus(openaiAnalysis, perplexityInsights, vinData, comparableVehicles);

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
        vehicleHistory: comparableVehicles,
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