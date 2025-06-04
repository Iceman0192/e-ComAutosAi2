import { db } from "./db";
import { salesHistory } from "@shared/schema";
import { desc, sql, eq, and, gte, lte, count, avg, sum } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ComprehensiveAnalysis {
  marketIntelligence: {
    totalRecords: number;
    totalDatabaseRecords: number;
    coveragePercentage: number;
    dateRange: string;
    avgPrice: number;
    totalValue: number;
    uniqueMakes: number;
    uniqueModels: number;
    auctionSites: string[];
  };
  profitabilityMatrix: {
    byMake: Array<{make: string; avgBuyPrice: number; avgSellPrice: number; profitMargin: number; volume: number}>;
    byYear: Array<{year: string; avgBuyPrice: number; avgSellPrice: number; profitMargin: number; volume: number}>;
    bySite: Array<{site: string; avgBuyPrice: number; avgSellPrice: number; profitMargin: number; volume: number; soldRate: number}>;
    byDamage: Array<{damage: string; avgBuyPrice: number; avgSellPrice: number; profitMargin: number; volume: number}>;
  };
  opportunitySegments: Array<{
    segment: string;
    description: string;
    criteria: string;
    expectedProfit: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    volumeOpportunity: number;
    examples: Array<{make: string; model: string; year: string; estimatedProfit: number}>;
  }>;
  marketTrends: Array<{
    trend: string;
    timeframe: string;
    impact: string;
    confidence: number;
    dataSupport: string;
  }>;
  riskAssessment: {
    highRiskCategories: string[];
    lowRiskCategories: string[];
    marketVolatility: number;
    dataQualityScore: number;
  };
  actionableInsights: Array<{
    priority: 'High' | 'Medium' | 'Low';
    insight: string;
    action: string;
    expectedROI: number;
    implementation: string;
  }>;
}

export class ComprehensiveAnalysisService {
  async performDeepMarketAnalysis(): Promise<ComprehensiveAnalysis> {
    console.log('Starting comprehensive deep market analysis...');
    
    // Get total database metrics
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(salesHistory);
    const totalRecords = totalCountResult[0]?.count || 0;

    // Get all sales data for comprehensive analysis
    const salesData = await db
      .select()
      .from(salesHistory)
      .orderBy(desc(salesHistory.sale_date));

    console.log(`Analyzing complete dataset: ${salesData.length} records`);

    // Market Intelligence Overview
    const marketIntelligence = await this.calculateMarketIntelligence(salesData, totalRecords);
    
    // Profitability Matrix Analysis
    const profitabilityMatrix = await this.calculateProfitabilityMatrix(salesData);
    
    // Multi-run AI Analysis for Maximum Opportunity Discovery
    const opportunitySegments = await this.discoverOpportunitySegments(salesData);
    
    // Market Trends Analysis
    const marketTrends = await this.analyzeMarketTrends(salesData);
    
    // Risk Assessment
    const riskAssessment = await this.performRiskAssessment(salesData);
    
    // Generate Actionable Insights
    const actionableInsights = await this.generateActionableInsights(
      profitabilityMatrix,
      opportunitySegments,
      marketTrends,
      riskAssessment
    );

    console.log('Comprehensive analysis complete');

    return {
      marketIntelligence,
      profitabilityMatrix,
      opportunitySegments,
      marketTrends,
      riskAssessment,
      actionableInsights
    };
  }

  private async calculateMarketIntelligence(salesData: any[], totalRecords: number) {
    const validPrices = salesData.filter(record => record.sale_price && record.sale_price > 0);
    const totalValue = validPrices.reduce((sum, record) => sum + (record.sale_price || 0), 0);
    const avgPrice = validPrices.length > 0 ? totalValue / validPrices.length : 0;
    
    const uniqueMakes = new Set(salesData.map(record => record.make).filter(Boolean)).size;
    const uniqueModels = new Set(salesData.map(record => record.model).filter(Boolean)).size;
    const auctionSites = [...new Set(salesData.map(record => record.site).filter(Boolean))];
    
    const dates = salesData.map(record => new Date(record.sale_date)).filter(date => !isNaN(date.getTime()));
    const minDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
    const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();
    
    return {
      totalRecords: salesData.length,
      totalDatabaseRecords: totalRecords,
      coveragePercentage: Math.round((salesData.length / totalRecords) * 100),
      dateRange: `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`,
      avgPrice: Math.round(avgPrice),
      totalValue: Math.round(totalValue),
      uniqueMakes,
      uniqueModels,
      auctionSites
    };
  }

  private async calculateProfitabilityMatrix(salesData: any[]) {
    // Group by Make
    const makeGroups = this.groupBy(salesData, 'make');
    const byMake = Object.entries(makeGroups)
      .filter(([make]) => make && make !== 'null')
      .map(([make, records]) => {
        const validRecords = records.filter(r => r.sale_price && r.sale_price > 0);
        const avgSellPrice = validRecords.reduce((sum, r) => sum + r.sale_price, 0) / validRecords.length || 0;
        const avgBuyPrice = avgSellPrice * 0.7; // Estimate 30% margin
        return {
          make,
          avgBuyPrice: Math.round(avgBuyPrice),
          avgSellPrice: Math.round(avgSellPrice),
          profitMargin: Math.round(avgSellPrice - avgBuyPrice),
          volume: validRecords.length
        };
      })
      .sort((a, b) => b.profitMargin - a.profitMargin)
      .slice(0, 20);

    // Group by Year
    const yearGroups = this.groupBy(salesData, 'year');
    const byYear = Object.entries(yearGroups)
      .filter(([year]) => year && year !== 'null' && parseInt(year) > 1990)
      .map(([year, records]) => {
        const validRecords = records.filter(r => r.sale_price && r.sale_price > 0);
        const avgSellPrice = validRecords.reduce((sum, r) => sum + r.sale_price, 0) / validRecords.length || 0;
        const avgBuyPrice = avgSellPrice * 0.7;
        return {
          year,
          avgBuyPrice: Math.round(avgBuyPrice),
          avgSellPrice: Math.round(avgSellPrice),
          profitMargin: Math.round(avgSellPrice - avgBuyPrice),
          volume: validRecords.length
        };
      })
      .sort((a, b) => b.profitMargin - a.profitMargin)
      .slice(0, 15);

    // Group by Site
    const siteGroups = this.groupBy(salesData, 'site');
    const bySite = Object.entries(siteGroups)
      .filter(([site]) => site && site !== 'null')
      .map(([site, records]) => {
        const validRecords = records.filter(r => r.sale_price && r.sale_price > 0);
        const soldRecords = records.filter(r => r.sale_status === 'SOLD');
        const soldRate = records.length > 0 ? (soldRecords.length / records.length) * 100 : 0;
        const avgSellPrice = validRecords.reduce((sum, r) => sum + r.sale_price, 0) / validRecords.length || 0;
        const avgBuyPrice = avgSellPrice * 0.7;
        return {
          site,
          avgBuyPrice: Math.round(avgBuyPrice),
          avgSellPrice: Math.round(avgSellPrice),
          profitMargin: Math.round(avgSellPrice - avgBuyPrice),
          volume: validRecords.length,
          soldRate: Math.round(soldRate)
        };
      })
      .sort((a, b) => b.profitMargin - a.profitMargin);

    // Group by Damage
    const damageGroups = this.groupBy(salesData, 'damage');
    const byDamage = Object.entries(damageGroups)
      .filter(([damage]) => damage && damage !== 'null')
      .map(([damage, records]) => {
        const validRecords = records.filter(r => r.sale_price && r.sale_price > 0);
        const avgSellPrice = validRecords.reduce((sum, r) => sum + r.sale_price, 0) / validRecords.length || 0;
        const avgBuyPrice = avgSellPrice * 0.7;
        return {
          damage,
          avgBuyPrice: Math.round(avgBuyPrice),
          avgSellPrice: Math.round(avgSellPrice),
          profitMargin: Math.round(avgSellPrice - avgBuyPrice),
          volume: validRecords.length
        };
      })
      .sort((a, b) => b.profitMargin - a.profitMargin)
      .slice(0, 10);

    return { byMake, byYear, bySite, byDamage };
  }

  private async discoverOpportunitySegments(salesData: any[]) {
    console.log('Discovering opportunity segments through AI analysis...');
    
    // Prepare data summary for AI analysis
    const makeStats = this.groupBy(salesData, 'make');
    const topMakes = Object.entries(makeStats)
      .filter(([make]) => make && make !== 'null')
      .map(([make, records]) => {
        const validRecords = records.filter(r => r.sale_price && r.sale_price > 0);
        const avgPrice = validRecords.reduce((sum, r) => sum + r.sale_price, 0) / validRecords.length || 0;
        return { make, avgPrice: Math.round(avgPrice), volume: validRecords.length };
      })
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 15);

    const prompt = `
    Analyze this automotive auction data and identify the top 8 most profitable opportunity segments for vehicle purchasing:

    Market Data Summary:
    - Total Records: ${salesData.length}
    - Top Makes by Volume: ${topMakes.map(m => `${m.make} (${m.volume} units, avg $${m.avgPrice})`).join(', ')}
    - Price Range: $${Math.min(...salesData.filter(r => r.sale_price > 0).map(r => r.sale_price))} - $${Math.max(...salesData.map(r => r.sale_price || 0))}

    For each opportunity segment, provide:
    1. Segment name and description
    2. Specific criteria for identifying these opportunities
    3. Expected profit potential
    4. Risk level assessment
    5. Volume opportunity

    Focus on actionable, specific segments that can be systematically identified and pursued.
    Respond in JSON format with an array of opportunity segments.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const aiResult = JSON.parse(response.choices[0].message.content || '{"segments": []}');
      
      return aiResult.segments || [];
    } catch (error) {
      console.error('Error in AI opportunity analysis:', error);
      return [];
    }
  }

  private async analyzeMarketTrends(salesData: any[]) {
    console.log('Analyzing market trends...');
    
    // Group by months to identify trends
    const monthlyData = salesData.reduce((acc, record) => {
      if (!record.sale_date) return acc;
      const date = new Date(record.sale_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { totalSales: 0, totalValue: 0, count: 0 };
      }
      
      if (record.sale_price && record.sale_price > 0) {
        acc[monthKey].totalValue += record.sale_price;
        acc[monthKey].count++;
      }
      acc[monthKey].totalSales++;
      
      return acc;
    }, {} as Record<string, any>);

    const trendPrompt = `
    Analyze these monthly automotive auction trends and identify 5 key market trends:

    Monthly Data: ${JSON.stringify(Object.entries(monthlyData).slice(-12))}

    Identify trends in:
    1. Volume changes
    2. Price movements
    3. Seasonal patterns
    4. Market dynamics
    5. Future predictions

    Respond in JSON format with trend analysis.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: trendPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"trends": []}');
      return result.trends || [];
    } catch (error) {
      console.error('Error in trend analysis:', error);
      return [];
    }
  }

  private async performRiskAssessment(salesData: any[]) {
    // Calculate data quality
    const totalRecords = salesData.length;
    const completeRecords = salesData.filter(record => 
      record.make && record.model && record.year && record.sale_price
    ).length;
    const dataQualityScore = Math.round((completeRecords / totalRecords) * 100);

    // Identify high and low risk categories
    const makeGroups = this.groupBy(salesData, 'make');
    const makeVolatility = Object.entries(makeGroups)
      .filter(([make]) => make && make !== 'null')
      .map(([make, records]) => {
        const prices = records.filter(r => r.sale_price && r.sale_price > 0).map(r => r.sale_price);
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length || 0;
        const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length || 0;
        const stdDev = Math.sqrt(variance);
        const volatility = avgPrice > 0 ? (stdDev / avgPrice) * 100 : 0;
        
        return { make, volatility, volume: records.length };
      })
      .filter(item => item.volume >= 10); // Only consider makes with sufficient data

    const highRiskCategories = makeVolatility
      .filter(item => item.volatility > 50)
      .sort((a, b) => b.volatility - a.volatility)
      .slice(0, 5)
      .map(item => item.make);

    const lowRiskCategories = makeVolatility
      .filter(item => item.volatility < 25 && item.volume >= 20)
      .sort((a, b) => a.volatility - b.volatility)
      .slice(0, 5)
      .map(item => item.make);

    const marketVolatility = makeVolatility.length > 0 
      ? Math.round(makeVolatility.reduce((sum, item) => sum + item.volatility, 0) / makeVolatility.length)
      : 0;

    return {
      highRiskCategories,
      lowRiskCategories,
      marketVolatility,
      dataQualityScore
    };
  }

  private async generateActionableInsights(
    profitabilityMatrix: any,
    opportunitySegments: any[],
    marketTrends: any[],
    riskAssessment: any
  ) {
    const insights = [];

    // High-priority insights from profitability matrix
    if (profitabilityMatrix.byMake.length > 0) {
      const topMake = profitabilityMatrix.byMake[0];
      insights.push({
        priority: 'High' as const,
        insight: `${topMake.make} vehicles show highest profit margins at $${topMake.profitMargin} average`,
        action: `Focus purchasing on ${topMake.make} vehicles with target buy price under $${topMake.avgBuyPrice}`,
        expectedROI: Math.round((topMake.profitMargin / topMake.avgBuyPrice) * 100),
        implementation: 'Set up automated alerts for underpriced vehicles in this category'
      });
    }

    // Site-based insights
    if (profitabilityMatrix.bySite.length > 0) {
      const bestSite = profitabilityMatrix.bySite[0];
      insights.push({
        priority: 'Medium' as const,
        insight: `${bestSite.site} shows ${bestSite.soldRate}% sell-through rate with $${bestSite.profitMargin} margins`,
        action: `Increase bidding activity on ${bestSite.site} for optimal profit opportunities`,
        expectedROI: Math.round((bestSite.profitMargin / bestSite.avgBuyPrice) * 100),
        implementation: 'Allocate more capital to this auction site'
      });
    }

    // Risk-based insights
    if (riskAssessment.lowRiskCategories.length > 0) {
      insights.push({
        priority: 'High' as const,
        insight: `Low-risk categories: ${riskAssessment.lowRiskCategories.slice(0, 3).join(', ')} show stable pricing`,
        action: 'Increase volume in these stable categories for consistent returns',
        expectedROI: 15,
        implementation: 'Develop standardized buying criteria for these categories'
      });
    }

    return insights.slice(0, 8);
  }

  private groupBy(array: any[], key: string) {
    return array.reduce((groups, item) => {
      const value = item[key];
      if (!groups[value]) {
        groups[value] = [];
      }
      groups[value].push(item);
      return groups;
    }, {} as Record<string, any[]>);
  }
}

export const comprehensiveAnalysisService = new ComprehensiveAnalysisService();