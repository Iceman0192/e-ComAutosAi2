import { db } from './db';
import { salesHistory } from '@shared/schema';
import { sql, and, gte, lte, inArray, desc, asc } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface AnalysisFilters {
  makes?: string[];
  yearRange?: [number, number];
  priceRange?: [number, number];
  damageTypes?: string[];
  locations?: string[];
}

interface OpportunityInsight {
  title: string;
  description: string;
  profitPotential: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  actionSteps: string[];
  dataSupport: string;
}

interface MarketTrend {
  category: string;
  finding: string;
  impact: string;
  confidence: number;
}

interface CoreAnalysisResult {
  summary: {
    totalVehicles: number;
    averagePrice: number;
    priceRange: [number, number];
    topMakes: string[];
    analysisDate: string;
  };
  opportunities: OpportunityInsight[];
  marketTrends: MarketTrend[];
  recommendations: {
    immediate: string[];
    strategic: string[];
  };
}

export class CoreAnalysisService {
  async analyzeMarket(filters: AnalysisFilters = {}): Promise<CoreAnalysisResult> {
    console.log('Starting core market analysis...');
    
    // Build database query with filters
    const conditions = [];
    
    if (filters.makes?.length) {
      conditions.push(inArray(salesHistory.make, filters.makes));
    }
    
    if (filters.yearRange) {
      conditions.push(gte(salesHistory.year, filters.yearRange[0]));
      conditions.push(lte(salesHistory.year, filters.yearRange[1]));
    }
    
    if (filters.priceRange) {
      conditions.push(gte(salesHistory.purchase_price, filters.priceRange[0]));
      conditions.push(lte(salesHistory.purchase_price, filters.priceRange[1]));
    }

    // Get market data
    const vehicles = await db
      .select()
      .from(salesHistory)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(15000)
      .orderBy(desc(salesHistory.sale_date));

    console.log(`Analyzing ${vehicles.length} vehicles...`);

    // Calculate core metrics
    const summary = this.calculateSummaryMetrics(vehicles);
    
    // Generate AI insights
    const opportunities = await this.generateOpportunityInsights(vehicles);
    const marketTrends = await this.analyzeMarketTrends(vehicles);
    const recommendations = this.generateRecommendations(vehicles, opportunities);

    return {
      summary,
      opportunities,
      marketTrends,
      recommendations
    };
  }

  private calculateSummaryMetrics(vehicles: any[]): CoreAnalysisResult['summary'] {
    const prices = vehicles.map(v => parseFloat(v.purchase_price || 0)).filter(p => p > 0);
    const makeCount = vehicles.reduce((acc: Record<string, number>, v: any) => {
      acc[v.make] = (acc[v.make] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topMakes = Object.entries(makeCount)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([make]) => make);

    return {
      totalVehicles: vehicles.length,
      averagePrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      priceRange: [Math.min(...prices), Math.max(...prices)],
      topMakes,
      analysisDate: new Date().toISOString().split('T')[0]
    };
  }

  private async generateOpportunityInsights(vehicles: any[]): Promise<OpportunityInsight[]> {
    // Analyze key profit patterns
    const insights: OpportunityInsight[] = [];

    // Damage type analysis
    const damageAnalysis = this.analyzeDamageOpportunities(vehicles);
    if (damageAnalysis) insights.push(damageAnalysis);

    // Location analysis
    const locationAnalysis = this.analyzeLocationOpportunities(vehicles);
    if (locationAnalysis) insights.push(locationAnalysis);

    // Vehicle condition analysis
    const conditionAnalysis = this.analyzeConditionOpportunities(vehicles);
    if (conditionAnalysis) insights.push(conditionAnalysis);

    // Year/make analysis
    const makeYearAnalysis = this.analyzeMakeYearOpportunities(vehicles);
    if (makeYearAnalysis) insights.push(makeYearAnalysis);

    return insights.slice(0, 4); // Top 4 opportunities
  }

  private analyzeDamageOpportunities(vehicles: any[]): OpportunityInsight | null {
    const damageGroups = vehicles.reduce((acc, v) => {
      const damage = v.primaryDamage || 'Unknown';
      if (!acc[damage]) acc[damage] = [];
      acc[damage].push(v.salePrice);
      return acc;
    }, {} as Record<string, number[]>);

    // Find damage types with good volume and lower average prices
    const opportunities = Object.entries(damageGroups)
      .filter(([_, prices]) => prices.length >= 50) // Minimum volume
      .map(([damage, prices]) => ({
        damage,
        avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
        count: prices.length
      }))
      .sort((a, b) => a.avgPrice - b.avgPrice);

    if (opportunities.length < 2) return null;

    const bestOpportunity = opportunities[0];
    const avgMarketPrice = vehicles.reduce((sum, v) => sum + v.salePrice, 0) / vehicles.length;
    const discount = ((avgMarketPrice - bestOpportunity.avgPrice) / avgMarketPrice * 100).toFixed(1);

    return {
      title: `${bestOpportunity.damage} Damage Vehicles`,
      description: `Vehicles with ${bestOpportunity.damage} damage trade at ${discount}% below market average, presenting strong acquisition opportunities.`,
      profitPotential: `$${Math.round(avgMarketPrice - bestOpportunity.avgPrice)} per vehicle`,
      riskLevel: bestOpportunity.damage.toLowerCase().includes('flood') ? 'Medium' : 'Low',
      actionSteps: [
        `Target ${bestOpportunity.damage} damage vehicles in upcoming auctions`,
        `Set maximum bid at $${Math.round(bestOpportunity.avgPrice * 1.1)}`,
        `Focus on vehicles with repairable damage patterns`
      ],
      dataSupport: `Based on ${bestOpportunity.count} vehicles analyzed`
    };
  }

  private analyzeLocationOpportunities(vehicles: any[]): OpportunityInsight | null {
    const locationGroups = vehicles.reduce((acc, v) => {
      const location = v.location || 'Unknown';
      if (!acc[location]) acc[location] = [];
      acc[location].push(v.salePrice);
      return acc;
    }, {} as Record<string, number[]>);

    const locationAnalysis = Object.entries(locationGroups)
      .filter(([_, prices]) => prices.length >= 30)
      .map(([location, prices]) => ({
        location,
        avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
        count: prices.length
      }))
      .sort((a, b) => a.avgPrice - b.avgPrice);

    if (locationAnalysis.length < 2) return null;

    const bestLocation = locationAnalysis[0];
    const avgMarketPrice = vehicles.reduce((sum, v) => sum + v.salePrice, 0) / vehicles.length;
    const savings = Math.round(avgMarketPrice - bestLocation.avgPrice);

    return {
      title: `${bestLocation.location} Location Advantage`,
      description: `Vehicles from ${bestLocation.location} auctions trade at significantly lower prices, offering geographic arbitrage opportunities.`,
      profitPotential: `$${savings} average savings per vehicle`,
      riskLevel: 'Low',
      actionSteps: [
        `Prioritize auctions in ${bestLocation.location}`,
        `Research transportation costs to your market`,
        `Build relationships with ${bestLocation.location} auction houses`
      ],
      dataSupport: `Analysis of ${bestLocation.count} vehicles from this location`
    };
  }

  private analyzeConditionOpportunities(vehicles: any[]): OpportunityInsight | null {
    const withKeys = vehicles.filter(v => v.keys === 'Yes');
    const withoutKeys = vehicles.filter(v => v.keys === 'No');

    if (withKeys.length < 20 || withoutKeys.length < 20) return null;

    const keysAvgPrice = withKeys.reduce((sum, v) => sum + v.salePrice, 0) / withKeys.length;
    const noKeysAvgPrice = withoutKeys.reduce((sum, v) => sum + v.salePrice, 0) / withoutKeys.length;
    const priceDiff = Math.round(keysAvgPrice - noKeysAvgPrice);
    const percentDiff = ((priceDiff / noKeysAvgPrice) * 100).toFixed(1);

    return {
      title: 'Vehicle Keys Impact Analysis',
      description: `Vehicles with keys present command ${percentDiff}% higher prices. Target vehicles without keys for lower acquisition costs.`,
      profitPotential: `$${priceDiff} potential savings per vehicle`,
      riskLevel: 'Low',
      actionSteps: [
        'Focus bidding on vehicles listed without keys',
        'Factor in key replacement costs ($150-$500)',
        'Verify vehicle security systems before bidding'
      ],
      dataSupport: `${withKeys.length} vehicles with keys vs ${withoutKeys.length} without keys`
    };
  }

  private analyzeMakeYearOpportunities(vehicles: any[]): OpportunityInsight | null {
    const makeYearAnalysis = vehicles.reduce((acc, v) => {
      const key = `${v.make}_${v.year}`;
      if (!acc[key]) acc[key] = { prices: [], make: v.make, year: v.year };
      acc[key].prices.push(v.salePrice);
      return acc;
    }, {} as Record<string, { prices: number[], make: string, year: number }>);

    const opportunities = Object.values(makeYearAnalysis)
      .filter(data => data.prices.length >= 20)
      .map(data => ({
        ...data,
        avgPrice: data.prices.reduce((a, b) => a + b, 0) / data.prices.length,
        count: data.prices.length
      }))
      .sort((a, b) => a.avgPrice - b.avgPrice);

    if (opportunities.length < 3) return null;

    const bestOpportunity = opportunities[0];
    const marketAvg = vehicles.reduce((sum, v) => sum + v.salePrice, 0) / vehicles.length;
    const discount = Math.round(marketAvg - bestOpportunity.avgPrice);

    return {
      title: `${bestOpportunity.year} ${bestOpportunity.make} Opportunity`,
      description: `${bestOpportunity.year} ${bestOpportunity.make} vehicles trade below market average, representing strong value acquisition targets.`,
      profitPotential: `$${discount} below market average`,
      riskLevel: 'Low',
      actionSteps: [
        `Target ${bestOpportunity.year} ${bestOpportunity.make} models in auctions`,
        `Research common issues for this make/year combination`,
        `Set competitive bid limits around $${Math.round(bestOpportunity.avgPrice * 1.05)}`
      ],
      dataSupport: `${bestOpportunity.count} vehicles analyzed`
    };
  }

  private async analyzeMarketTrends(vehicles: any[]): Promise<MarketTrend[]> {
    const trends: MarketTrend[] = [];

    // Price trend by year
    const yearGroups = vehicles.reduce((acc, v) => {
      if (!acc[v.year]) acc[v.year] = [];
      acc[v.year].push(v.salePrice);
      return acc;
    }, {} as Record<number, number[]>);

    const yearTrends = Object.entries(yearGroups)
      .filter(([_, prices]) => prices.length >= 10)
      .map(([year, prices]) => ({
        year: parseInt(year),
        avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
        count: prices.length
      }))
      .sort((a, b) => a.year - b.year);

    if (yearTrends.length >= 3) {
      const oldestYear = yearTrends[0];
      const newestYear = yearTrends[yearTrends.length - 1];
      const priceChange = newestYear.avgPrice - oldestYear.avgPrice;
      const percentChange = ((priceChange / oldestYear.avgPrice) * 100).toFixed(1);

      trends.push({
        category: 'Price Evolution',
        finding: `Vehicle prices have ${priceChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(parseFloat(percentChange))}% from ${oldestYear.year} to ${newestYear.year}`,
        impact: priceChange > 0 ? 'Rising market - consider faster acquisition' : 'Declining market - negotiate aggressively',
        confidence: 85
      });
    }

    // Damage type trends
    const damageFrequency = vehicles.reduce((acc, v) => {
      const damage = v.primaryDamage || 'Unknown';
      acc[damage] = (acc[damage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topDamage = Object.entries(damageFrequency)
      .sort(([,a], [,b]) => b - a)[0];

    if (topDamage) {
      const percentage = ((topDamage[1] / vehicles.length) * 100).toFixed(1);
      trends.push({
        category: 'Damage Patterns',
        finding: `${topDamage[0]} damage represents ${percentage}% of available inventory`,
        impact: 'Develop expertise in this damage type for competitive advantage',
        confidence: 90
      });
    }

    return trends;
  }

  private generateRecommendations(vehicles: any[], opportunities: OpportunityInsight[]): CoreAnalysisResult['recommendations'] {
    const avgPrice = vehicles.reduce((sum, v) => sum + v.salePrice, 0) / vehicles.length;
    const topMakes = this.getTopMakes(vehicles, 3);

    return {
      immediate: [
        `Focus on vehicles priced $1,000-$2,000 below $${Math.round(avgPrice)} market average`,
        `Target ${opportunities[0]?.title || 'identified opportunities'} for immediate profit potential`,
        `Set up alerts for ${topMakes.join(', ')} vehicles in upcoming auctions`
      ],
      strategic: [
        'Build expertise in the most profitable damage categories',
        'Develop geographic diversification to access lower-priced markets',
        'Create standardized evaluation criteria for consistent decision-making'
      ]
    };
  }

  private getTopMakes(vehicles: any[], count: number): string[] {
    const makeCount = vehicles.reduce((acc, v) => {
      acc[v.make] = (acc[v.make] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(makeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([make]) => make);
  }
}