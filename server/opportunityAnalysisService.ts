import OpenAI from "openai";
import { db } from "./db";
import { salesHistory } from "@shared/schema";
import { sql, desc, and, gte, lte, eq } from "drizzle-orm";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface OpportunityInsight {
  category: string;
  title: string;
  description: string;
  confidence: number;
  potentialProfit: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  actionableSteps: string[];
  dataPoints: {
    avgBuyPrice: number;
    avgSellPrice: number;
    volume: number;
    successRate: number;
  };
}

interface MarketAnalysis {
  overview: {
    totalRecords: number;
    totalDatabaseRecords: number;
    coveragePercentage: number;
    dateRange: string;
    avgPrice: number;
    topPerformingMakes: string[];
  };
  opportunities: OpportunityInsight[];
  marketTrends: {
    trend: string;
    description: string;
    impact: string;
  }[];
  riskFactors: string[];
  recommendations: string[];
}

export class OpportunityAnalysisService {
  async analyzeMarketOpportunities(batchSize: number = 15000): Promise<MarketAnalysis> {
    try {
      // Get total record count first to show progress
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(salesHistory);
      const totalRecords = totalCountResult[0]?.count || 0;

      // Get comprehensive sales data for analysis - configurable batch size
      const salesData = await db
        .select()
        .from(salesHistory)
        .orderBy(desc(salesHistory.sale_date))
        .limit(batchSize);

      if (salesData.length === 0) {
        throw new Error('No sales data available for analysis');
      }

      console.log(`Starting analysis of ${salesData.length} of ${totalRecords.toLocaleString()} total records (${Math.round((salesData.length / totalRecords) * 100)}% coverage)`);

      // Calculate comprehensive market statistics
      const marketStats = await this.calculateMarketStatistics(salesData);
      
      // Analyze data quality and completeness
      const dataQuality = await this.assessDataQuality(salesData);
      
      // Find profitable patterns across multiple dimensions
      const profitablePatterns = await this.identifyProfitablePatterns(salesData);
      
      // Analyze auction site performance (Copart vs IAAI)
      const sitePerformance = await this.analyzeSitePerformance(salesData);
      
      // Analyze vehicle year distributions
      const yearDistribution = await this.analyzeYearDistribution(salesData);
      
      // Analyze sale status patterns
      const saleStatusPatterns = await this.analyzeSaleStatusPatterns(salesData);

      // Use AI to generate advanced insights with all analysis data
      const aiAnalysis = await this.generateAIInsights(
        salesData, 
        marketStats, 
        profitablePatterns,
        dataQuality,
        sitePerformance,
        yearDistribution,
        saleStatusPatterns
      );

      return {
        overview: {
          totalRecords: salesData.length,
          totalDatabaseRecords: totalRecords,
          coveragePercentage: Math.round((salesData.length / totalRecords) * 100),
          dateRange: this.getDateRange(salesData),
          avgPrice: marketStats.avgPrice,
          topPerformingMakes: marketStats.topMakes
        },
        opportunities: aiAnalysis.opportunities,
        marketTrends: aiAnalysis.trends,
        riskFactors: aiAnalysis.risks,
        recommendations: aiAnalysis.recommendations
      };

    } catch (error) {
      console.error('Error analyzing market opportunities:', error);
      throw new Error('Failed to analyze market opportunities');
    }
  }

  private async calculateMarketStatistics(salesData: any[]) {
    // Price analysis
    const prices = salesData
      .filter(r => r.purchase_price && !isNaN(parseFloat(r.purchase_price)))
      .map(r => parseFloat(r.purchase_price));

    const avgPrice = prices.length > 0 ? 
      Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

    // Make analysis with profit potential
    const makePerformance: Record<string, {count: number, avgPrice: number, profits: number[]}> = {};
    
    salesData.forEach(record => {
      if (record.make && record.purchase_price) {
        const make = record.make;
        const price = parseFloat(record.purchase_price);
        
        if (!makePerformance[make]) {
          makePerformance[make] = { count: 0, avgPrice: 0, profits: [] };
        }
        
        makePerformance[make].count++;
        makePerformance[make].avgPrice += price;
        
        // Estimate profit potential based on price vs average
        if (price < avgPrice * 0.8) {
          makePerformance[make].profits.push(avgPrice - price);
        }
      }
    });

    // Calculate averages and sort by profitability
    const topMakes = Object.entries(makePerformance)
      .map(([make, data]) => ({
        make,
        avgPrice: data.avgPrice / data.count,
        count: data.count,
        profitPotential: data.profits.length > 0 ? 
          data.profits.reduce((a, b) => a + b, 0) / data.profits.length : 0
      }))
      .sort((a, b) => b.profitPotential - a.profitPotential)
      .slice(0, 10)
      .map(item => item.make);

    return {
      avgPrice,
      topMakes,
      totalVolume: salesData.length,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices)
      }
    };
  }

  private async identifyProfitablePatterns(salesData: any[]) {
    // Group by various criteria to find patterns
    const patterns = {
      byMake: this.groupByMake(salesData),
      byYear: this.groupByYear(salesData),
      byLocation: this.groupByLocation(salesData),
      byDamage: this.groupByDamage(salesData),
      bySite: this.groupBySite(salesData)
    };

    return patterns;
  }

  private groupByMake(salesData: any[]) {
    const makeGroups: Record<string, any[]> = {};
    salesData.forEach(record => {
      if (record.make) {
        if (!makeGroups[record.make]) makeGroups[record.make] = [];
        makeGroups[record.make].push(record);
      }
    });
    return makeGroups;
  }

  private groupByYear(salesData: any[]) {
    const yearGroups: Record<string, any[]> = {};
    salesData.forEach(record => {
      if (record.year) {
        const year = record.year.toString();
        if (!yearGroups[year]) yearGroups[year] = [];
        yearGroups[year].push(record);
      }
    });
    return yearGroups;
  }

  private groupByLocation(salesData: any[]) {
    const locationGroups: Record<string, any[]> = {};
    salesData.forEach(record => {
      if (record.auction_location) {
        if (!locationGroups[record.auction_location]) locationGroups[record.auction_location] = [];
        locationGroups[record.auction_location].push(record);
      }
    });
    return locationGroups;
  }

  private groupByDamage(salesData: any[]) {
    const damageGroups: Record<string, any[]> = {};
    salesData.forEach(record => {
      if (record.vehicle_damage) {
        if (!damageGroups[record.vehicle_damage]) damageGroups[record.vehicle_damage] = [];
        damageGroups[record.vehicle_damage].push(record);
      }
    });
    return damageGroups;
  }

  private groupBySite(salesData: any[]) {
    const siteGroups: Record<string, any[]> = {};
    salesData.forEach(record => {
      if (record.base_site) {
        if (!siteGroups[record.base_site]) siteGroups[record.base_site] = [];
        siteGroups[record.base_site].push(record);
      }
    });
    return siteGroups;
  }

  private async assessDataQuality(salesData: any[]) {
    const totalRecords = salesData.length;
    let qualityMetrics = {
      completenessScore: 0,
      consistencyScore: 0,
      fieldsAnalysis: {} as Record<string, { completeness: number, uniqueValues: number }>
    };

    const criticalFields = ['make', 'model', 'year', 'purchase_price', 'base_site', 'sale_date', 'vehicle_damage'];
    
    criticalFields.forEach(field => {
      const nonNullCount = salesData.filter(record => 
        record[field] && record[field] !== '' && record[field] !== null
      ).length;
      
      const uniqueValues = new Set(salesData.map(record => record[field])).size;
      
      qualityMetrics.fieldsAnalysis[field] = {
        completeness: Math.round((nonNullCount / totalRecords) * 100),
        uniqueValues
      };
    });

    // Calculate overall completeness score
    const completenessScores = Object.values(qualityMetrics.fieldsAnalysis).map(f => f.completeness);
    qualityMetrics.completenessScore = Math.round(
      completenessScores.reduce((a, b) => a + b, 0) / completenessScores.length
    );

    return qualityMetrics;
  }

  private async analyzeSitePerformance(salesData: any[]) {
    const siteGroups: Record<string, any[]> = {};
    salesData.forEach(record => {
      if (record.base_site) {
        const site = record.base_site.toLowerCase();
        if (!siteGroups[site]) siteGroups[site] = [];
        siteGroups[site].push(record);
      }
    });

    const siteAnalysis: Record<string, any> = {};
    Object.entries(siteGroups).forEach(([site, records]) => {
      const prices = records
        .filter(r => r.purchase_price && !isNaN(parseFloat(r.purchase_price)))
        .map(r => parseFloat(r.purchase_price));
      
      const soldRecords = records.filter(r => r.sale_status && r.sale_status.toLowerCase().includes('sold'));
      
      siteAnalysis[site] = {
        totalVolume: records.length,
        avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
        soldRate: Math.round((soldRecords.length / records.length) * 100),
        priceRange: prices.length > 0 ? {
          min: Math.min(...prices),
          max: Math.max(...prices)
        } : { min: 0, max: 0 }
      };
    });

    return siteAnalysis;
  }

  private async analyzeYearDistribution(salesData: any[]) {
    const yearGroups: Record<string, any[]> = {};
    salesData.forEach(record => {
      if (record.year) {
        const year = record.year.toString();
        if (!yearGroups[year]) yearGroups[year] = [];
        yearGroups[year].push(record);
      }
    });

    const yearAnalysis: Record<string, any> = {};
    Object.entries(yearGroups).forEach(([year, records]) => {
      const prices = records
        .filter(r => r.purchase_price && !isNaN(parseFloat(r.purchase_price)))
        .map(r => parseFloat(r.purchase_price));
      
      yearAnalysis[year] = {
        volume: records.length,
        avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
        topMakes: this.getTopItems(records.map(r => r.make).filter(Boolean), 3)
      };
    });

    return yearAnalysis;
  }

  private async analyzeSaleStatusPatterns(salesData: any[]) {
    const statusGroups: Record<string, any[]> = {};
    salesData.forEach(record => {
      if (record.sale_status) {
        const status = record.sale_status.toLowerCase();
        if (!statusGroups[status]) statusGroups[status] = [];
        statusGroups[status].push(record);
      }
    });

    const statusAnalysis: Record<string, any> = {};
    Object.entries(statusGroups).forEach(([status, records]) => {
      const prices = records
        .filter(r => r.purchase_price && !isNaN(parseFloat(r.purchase_price)))
        .map(r => parseFloat(r.purchase_price));
      
      statusAnalysis[status] = {
        volume: records.length,
        percentage: Math.round((records.length / salesData.length) * 100),
        avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0
      };
    });

    return statusAnalysis;
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

  private async generateAIInsights(
    salesData: any[], 
    marketStats: any, 
    patterns: any,
    dataQuality: any,
    sitePerformance: any,
    yearDistribution: any,
    saleStatusPatterns: any
  ) {
    const prompt = `Analyze this comprehensive automotive auction market data and identify profitable buying opportunities:

MARKET OVERVIEW:
- Total Records Analyzed: ${salesData.length}
- Average Price: $${marketStats.avgPrice}
- Price Range: $${marketStats.priceRange.min} - $${marketStats.priceRange.max}
- Top Performing Makes: ${marketStats.topMakes.join(', ')}

DATA QUALITY ASSESSMENT:
- Overall Data Completeness: ${dataQuality.completenessScore}%
- Field Completeness Analysis:
${Object.entries(dataQuality.fieldsAnalysis).map(([field, data]: [string, any]) => 
  `  • ${field}: ${data.completeness}% complete (${data.uniqueValues} unique values)`
).join('\n')}

AUCTION SITE PERFORMANCE (Copart vs IAAI):
${Object.entries(sitePerformance).map(([site, data]: [string, any]) => 
  `- ${site.toUpperCase()}: ${data.totalVolume} vehicles, $${data.avgPrice} avg price, ${data.soldRate}% sold rate`
).join('\n')}

VEHICLE YEAR DISTRIBUTION:
${Object.entries(yearDistribution).slice(0, 10).map(([year, data]: [string, any]) => 
  `- ${year}: ${data.volume} vehicles, $${data.avgPrice} avg price, top makes: ${data.topMakes.join(', ')}`
).join('\n')}

SALE STATUS PATTERNS:
${Object.entries(saleStatusPatterns).map(([status, data]: [string, any]) => 
  `- ${status}: ${data.percentage}% of sales (${data.volume} vehicles), $${data.avgPrice} avg price`
).join('\n')}

PRICING PATTERNS BY MAKE:
${Object.entries(patterns.byMake).slice(0, 15).map(([make, records]: [string, any[]]) => {
  const prices = records.filter(r => r.purchase_price && !isNaN(parseFloat(r.purchase_price)))
    .map(r => parseFloat(r.purchase_price));
  const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  return `- ${make}: ${records.length} vehicles, $${avgPrice} avg price`;
}).join('\n')}

SAMPLE RECENT RECORDS:
${JSON.stringify(salesData.slice(0, 5), null, 2)}

Based on this comprehensive real automotive auction data analysis, identify:

SAMPLE DATA:
${JSON.stringify(salesData.slice(0, 10), null, 2)}

PATTERN ANALYSIS:
- Makes Available: ${Object.keys(patterns.byMake).length}
- Years Covered: ${Object.keys(patterns.byYear).length}
- Auction Locations: ${Object.keys(patterns.byLocation).length}
- Damage Types: ${Object.keys(patterns.byDamage).length}

Based on this real automotive auction data, identify:

1. PROFITABLE OPPORTUNITIES (5-7 specific opportunities):
   - Vehicle categories with best profit margins
   - Undervalued makes/models to target
   - Seasonal buying patterns
   - Location-based arbitrage opportunities
   - Damage type opportunities (salvage, minor damage, etc.)

2. MARKET TRENDS (3-5 trends):
   - Price movements and patterns
   - Popular vehicle segments
   - Geographic market shifts

3. RISK FACTORS (3-5 risks):
   - Market oversaturation areas
   - High-risk vehicle categories
   - Economic factors affecting pricing

4. ACTIONABLE RECOMMENDATIONS (5-7 recommendations):
   - Specific buying strategies
   - Timing recommendations
   - Target criteria for profitable purchases

Focus on realistic, data-driven opportunities that could generate 15-30% profit margins.
Provide specific dollar amounts, percentages, and actionable criteria.

Respond in JSON format with this structure:
{
  "opportunities": [
    {
      "category": "Vehicle Type/Strategy",
      "title": "Opportunity Title",
      "description": "Detailed description",
      "confidence": 85,
      "potentialProfit": 5000,
      "riskLevel": "Low",
      "actionableSteps": ["Step 1", "Step 2"],
      "dataPoints": {
        "avgBuyPrice": 15000,
        "avgSellPrice": 20000,
        "volume": 150,
        "successRate": 78
      }
    }
  ],
  "trends": [
    {
      "trend": "Trend Name",
      "description": "Description",
      "impact": "Market Impact"
    }
  ],
  "risks": ["Risk 1", "Risk 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert automotive auction investment analyst specializing in Copart and IAAI data. Identify profitable buying opportunities based on real market data. Focus on actionable insights that generate measurable returns."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 3000
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  private getDateRange(salesData: any[]): string {
    const dates = salesData
      .filter(r => r.sale_date)
      .map(r => new Date(r.sale_date))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) return 'No date range available';

    const oldest = dates[0].toLocaleDateString();
    const newest = dates[dates.length - 1].toLocaleDateString();
    
    return `${oldest} - ${newest}`;
  }
}

export const opportunityAnalysisService = new OpportunityAnalysisService();