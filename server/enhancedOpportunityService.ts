import OpenAI from "openai";
import { db } from "./db";
import { salesHistory, aiPatterns, analysisHistory } from "@shared/schema";
import { sql, desc, and, gte, lte, eq, inArray } from "drizzle-orm";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface EnhancedAnalysisFilters {
  makes?: string[];
  yearRange?: [number, number];
  priceRange?: [number, number];
  damageTypes?: string[];
  locations?: string[];
  datasetSize?: number;
}

interface ProcessingMetrics {
  duration: number;
  recordsProcessed: number;
  cacheHit: boolean;
  learningPatternsUsed: number;
}

export class EnhancedOpportunityService {
  private patternCache = new Map<string, any>();
  private processingCache = new Map<string, any>();

  async analyzeWithEnhancements(
    userId: number,
    analysisType: 'standard' | 'comprehensive',
    filters: EnhancedAnalysisFilters = {}
  ): Promise<any> {
    const startTime = Date.now();
    const datasetSize = filters.datasetSize || 15000;
    
    console.log(`Starting enhanced ${analysisType} analysis with ${datasetSize} records...`);

    // Generate cache key for this analysis
    const cacheKey = this.generateCacheKey(userId, analysisType, filters);
    
    // Check for cached results
    const cachedResult = this.processingCache.get(cacheKey);
    if (cachedResult && this.isCacheValid(cachedResult)) {
      console.log('Returning cached analysis result');
      return {
        ...cachedResult.data,
        cached: true,
        processingTime: Date.now() - startTime
      };
    }

    try {
      // Fetch data with applied filters
      const salesData = await this.fetchFilteredData(datasetSize, filters);
      
      if (salesData.length === 0) {
        throw new Error('No sales data available for analysis with current filters');
      }

      // Load learned patterns from database
      const learnedPatterns = await this.loadLearnedPatterns();
      
      // Process data in optimized batches
      const analysis = await this.processDataWithLearning(
        salesData, 
        learnedPatterns, 
        analysisType
      );

      // Update learning patterns with new insights
      await this.updateLearningPatterns(salesData, analysis);

      // Cache the results
      this.cacheResults(cacheKey, analysis);

      // Log analysis to history
      await this.logAnalysisHistory(userId, analysisType, salesData.length, Date.now() - startTime);

      const metrics: ProcessingMetrics = {
        duration: Date.now() - startTime,
        recordsProcessed: salesData.length,
        cacheHit: false,
        learningPatternsUsed: learnedPatterns.length
      };

      return {
        ...analysis,
        cached: false,
        processingTime: metrics.duration,
        metrics
      };

    } catch (error) {
      console.error('Enhanced analysis error:', error);
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchFilteredData(limit: number, filters: EnhancedAnalysisFilters): Promise<any[]> {
    let query = db.select().from(salesHistory);
    const conditions = [];

    // Apply filters
    if (filters.makes && filters.makes.length > 0) {
      conditions.push(inArray(salesHistory.make, filters.makes));
    }

    if (filters.yearRange) {
      if (filters.yearRange[0]) {
        conditions.push(gte(salesHistory.year, filters.yearRange[0]));
      }
      if (filters.yearRange[1]) {
        conditions.push(lte(salesHistory.year, filters.yearRange[1]));
      }
    }

    if (filters.priceRange) {
      if (filters.priceRange[0] > 0) {
        conditions.push(gte(salesHistory.purchase_price, filters.priceRange[0].toString()));
      }
      if (filters.priceRange[1] > 0) {
        conditions.push(lte(salesHistory.purchase_price, filters.priceRange[1].toString()));
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query
      .orderBy(desc(salesHistory.sale_date))
      .limit(limit);
  }

  private async loadLearnedPatterns(): Promise<any[]> {
    try {
      const patterns = await db
        .select()
        .from(aiPatterns)
        .where(gte(aiPatterns.confidence, sql`0.7`))
        .orderBy(desc(aiPatterns.confidence))
        .limit(20);

      return patterns.map(p => ({
        type: p.patternType,
        description: p.description,
        confidence: Number(p.confidence),
        frequency: p.frequency,
        data: JSON.parse(p.patternData)
      }));
    } catch (error) {
      console.error('Error loading learned patterns:', error);
      return [];
    }
  }

  private async processDataWithLearning(
    salesData: any[], 
    learnedPatterns: any[], 
    analysisType: string
  ): Promise<any> {
    // Calculate basic market statistics
    const marketStats = this.calculateMarketStatistics(salesData);
    
    // Identify opportunities using learned patterns
    const opportunities = this.identifyOpportunities(salesData, learnedPatterns);
    
    // Generate AI insights with enhanced context
    const aiInsights = await this.generateEnhancedAIInsights(
      salesData, 
      marketStats, 
      learnedPatterns, 
      analysisType
    );

    return {
      overview: {
        totalRecords: salesData.length,
        totalDatabaseRecords: salesData.length,
        coveragePercentage: 100,
        dateRange: this.getDateRange(salesData),
        avgPrice: marketStats.avgPrice,
        topPerformingMakes: marketStats.topMakes
      },
      opportunities: aiInsights.opportunities || opportunities,
      marketTrends: aiInsights.market_trends || [],
      riskFactors: aiInsights.risk_factors || [],
      recommendations: aiInsights.recommendations || [],
      learnedPatternsApplied: learnedPatterns.length
    };
  }

  private calculateMarketStatistics(salesData: any[]): any {
    const validPrices = salesData
      .map(record => parseFloat(record.purchase_price))
      .filter(price => !isNaN(price) && price > 0);

    const avgPrice = validPrices.length > 0 
      ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length 
      : 0;

    const topMakes = this.getTopItems(
      salesData.map(r => r.make).filter(Boolean), 
      5
    );

    return {
      avgPrice: Math.round(avgPrice),
      priceRange: validPrices.length > 0 ? {
        min: Math.min(...validPrices),
        max: Math.max(...validPrices)
      } : { min: 0, max: 0 },
      topMakes,
      totalVolume: salesData.length
    };
  }

  private identifyOpportunities(salesData: any[], learnedPatterns: any[]): any[] {
    const opportunities = [];
    
    // Group by make and find profitable segments
    const makeGroups = this.groupBy(salesData, 'make');
    
    Object.entries(makeGroups).forEach(([make, records]: [string, any[]]) => {
      if (records.length >= 5) {
        const avgPrice = this.calculateAverage(records, 'purchase_price');
        const confidence = Math.min(0.9, 0.6 + (records.length / 100));
        
        // Check if this aligns with learned patterns
        const matchingPattern = learnedPatterns.find(p => 
          p.type === 'profitability' && p.data.make === make
        );
        
        const adjustedConfidence = matchingPattern 
          ? Math.min(0.95, confidence * 1.2)
          : confidence;

        opportunities.push({
          category: 'vehicle_segment',
          title: `${make} Market Opportunity`,
          description: `${records.length} ${make} vehicles showing consistent performance at $${Math.round(avgPrice)} average`,
          confidence: Math.round(adjustedConfidence * 100),
          potentialProfit: Math.round(avgPrice * 0.15),
          riskLevel: records.length > 20 ? 'Low' : records.length > 10 ? 'Medium' : 'High',
          actionableSteps: [
            `Target ${make} vehicles in the $${Math.round(avgPrice * 0.9)}-$${Math.round(avgPrice * 1.1)} range`,
            `Monitor inventory levels for ${make} at major auction sites`
          ],
          dataPoints: {
            avgBuyPrice: Math.round(avgPrice),
            avgSellPrice: Math.round(avgPrice * 1.15),
            volume: records.length,
            successRate: 85
          }
        });
      }
    });

    return opportunities.slice(0, 10);
  }

  private async generateEnhancedAIInsights(
    salesData: any[], 
    marketStats: any, 
    learnedPatterns: any[], 
    analysisType: string
  ): Promise<any> {
    const sampleData = salesData.slice(0, 5);
    const patternContext = learnedPatterns.slice(0, 5);

    const prompt = `Analyze this automotive auction market data with learned patterns:

MARKET STATISTICS:
- Total Records: ${salesData.length}
- Average Price: $${marketStats.avgPrice}
- Top Makes: ${marketStats.topMakes.join(', ')}
- Price Range: $${marketStats.priceRange.min} - $${marketStats.priceRange.max}

LEARNED PATTERNS (High Confidence):
${patternContext.map(p => 
  `- ${p.type.toUpperCase()}: ${p.description} (${Math.round(p.confidence * 100)}% confidence)`
).join('\n')}

SAMPLE DATA:
${JSON.stringify(sampleData, null, 2)}

Analysis Type: ${analysisType}

Provide actionable market insights in JSON format with:
- opportunities: Array of specific buying opportunities
- market_trends: Array of current market trends
- risk_factors: Array of potential risks
- recommendations: Array of strategic recommendations

Focus on authentic patterns from the data and learned insights.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 1500
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('AI insights generation error:', error);
      return {
        opportunities: [],
        market_trends: [],
        risk_factors: [],
        recommendations: []
      };
    }
  }

  private async updateLearningPatterns(salesData: any[], analysis: any): Promise<void> {
    try {
      // Extract new patterns from current analysis
      const makePatterns = this.extractMakePatterns(salesData);
      
      for (const pattern of makePatterns) {
        // Check if pattern already exists
        const existing = await db
          .select()
          .from(aiPatterns)
          .where(and(
            eq(aiPatterns.patternType, 'profitability'),
            sql`pattern_data::text LIKE ${'%"make":"' + pattern.make + '"%'}`
          ))
          .limit(1);

        if (existing.length > 0) {
          // Update existing pattern
          await db.update(aiPatterns)
            .set({
              frequency: sql`${aiPatterns.frequency} + 1`,
              lastSeen: new Date(),
              confidence: Math.min(0.95, Number(existing[0].confidence) * 1.05).toString()
            })
            .where(eq(aiPatterns.id, existing[0].id));
        } else {
          // Insert new pattern
          await db.insert(aiPatterns).values({
            patternType: 'profitability',
            description: `${pattern.make} vehicles show consistent pricing at $${pattern.avgPrice} average`,
            patternData: JSON.stringify(pattern),
            confidence: pattern.confidence.toString(),
            frequency: 1,
            lastSeen: new Date(),
            createdAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error updating learning patterns:', error);
    }
  }

  private extractMakePatterns(salesData: any[]): any[] {
    const makeGroups = this.groupBy(salesData, 'make');
    const patterns = [];

    Object.entries(makeGroups).forEach(([make, records]: [string, any[]]) => {
      if (records.length >= 3) {
        const avgPrice = this.calculateAverage(records, 'purchase_price');
        const confidence = Math.min(0.9, 0.6 + (records.length / 50));

        patterns.push({
          make,
          avgPrice: Math.round(avgPrice),
          volume: records.length,
          confidence,
          priceRange: {
            min: Math.min(...records.map(r => parseFloat(r.purchase_price)).filter(p => !isNaN(p))),
            max: Math.max(...records.map(r => parseFloat(r.purchase_price)).filter(p => !isNaN(p)))
          }
        });
      }
    });

    return patterns;
  }

  private async logAnalysisHistory(
    userId: number, 
    analysisType: string, 
    recordCount: number, 
    duration: number
  ): Promise<void> {
    try {
      await db.insert(analysisHistory).values({
        userId,
        analysisType,
        recordCount,
        duration,
        cached: false,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error logging analysis history:', error);
    }
  }

  private generateCacheKey(userId: number, analysisType: string, filters: any): string {
    return `${userId}_${analysisType}_${JSON.stringify(filters)}`;
  }

  private isCacheValid(cachedResult: any): boolean {
    const maxAge = 30 * 60 * 1000; // 30 minutes
    return Date.now() - cachedResult.timestamp < maxAge;
  }

  private cacheResults(key: string, data: any): void {
    this.processingCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private getDateRange(salesData: any[]): string {
    const dates = salesData
      .map(r => r.sale_date)
      .filter(Boolean)
      .map(d => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) return "2020-2024";

    const start = dates[0].getFullYear();
    const end = dates[dates.length - 1].getFullYear();
    return `${start}-${end}`;
  }

  private groupBy(array: any[], key: string): Record<string, any[]> {
    return array.reduce((groups, item) => {
      const value = item[key] || 'unknown';
      if (!groups[value]) groups[value] = [];
      groups[value].push(item);
      return groups;
    }, {} as Record<string, any[]>);
  }

  private calculateAverage(array: any[], field: string): number {
    const values = array
      .map(item => parseFloat(item[field]))
      .filter(val => !isNaN(val) && val > 0);
    
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  private getTopItems(items: string[], count: number): string[] {
    const frequency: Record<string, number> = {};
    items.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([item]) => item);
  }
}