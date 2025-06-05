import { db } from './db';
import { sql } from 'drizzle-orm';

interface SimpleAnalysisResult {
  summary: {
    totalVehicles: number;
    averagePrice: number;
    priceRange: [number, number];
    topMakes: string[];
    analysisDate: string;
  };
  opportunities: Array<{
    title: string;
    description: string;
    profitPotential: string;
    actionSteps: string[];
    dataSupport: string;
  }>;
  marketTrends: Array<{
    category: string;
    finding: string;
    impact: string;
  }>;
  recommendations: {
    immediate: string[];
    strategic: string[];
  };
}

export class SimpleAnalysisService {
  async analyzeMarket(): Promise<SimpleAnalysisResult> {
    console.log('Starting simple market analysis...');
    
    // Get Toyota sales data using raw SQL to avoid type issues
    const vehicles = await db.execute(sql`
      SELECT 
        make, 
        year, 
        CAST(purchase_price AS NUMERIC) as price,
        vehicle_damage as damage,
        auction_location as location,
        vehicle_has_keys as has_keys,
        sale_date
      FROM sales_history 
      WHERE purchase_price IS NOT NULL 
        AND CAST(purchase_price AS NUMERIC) > 0
        AND make IS NOT NULL
      ORDER BY sale_date DESC 
      LIMIT 15000
    `);

    const vehicleData = vehicles.rows as any[];
    console.log(`Analyzing ${vehicleData.length} vehicles...`);

    // Calculate summary metrics
    const summary = this.calculateSummary(vehicleData);
    
    // Generate opportunities based on real data patterns
    const opportunities = this.findOpportunities(vehicleData);
    
    // Analyze market trends
    const marketTrends = this.analyzeMarketTrends(vehicleData);
    
    // Generate actionable recommendations
    const recommendations = this.generateRecommendations(vehicleData);

    return {
      summary,
      opportunities,
      marketTrends,
      recommendations
    };
  }

  private calculateSummary(vehicles: any[]) {
    const prices = vehicles.map(v => v.price).filter(p => p > 0);
    const makeCount: Record<string, number> = {};
    
    vehicles.forEach(v => {
      if (v.make) {
        makeCount[v.make] = (makeCount[v.make] || 0) + 1;
      }
    });

    const topMakes = Object.entries(makeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([make]) => make);

    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    return {
      totalVehicles: vehicles.length,
      averagePrice: Math.round(avgPrice),
      priceRange: [Math.min(...prices), Math.max(...prices)] as [number, number],
      topMakes,
      analysisDate: new Date().toISOString().split('T')[0]
    };
  }

  private findOpportunities(vehicles: any[]) {
    const opportunities = [];

    // Damage-based opportunity analysis
    const damageOpportunity = this.analyzeDamageOpportunity(vehicles);
    if (damageOpportunity) opportunities.push(damageOpportunity);

    // Keys opportunity analysis  
    const keysOpportunity = this.analyzeKeysOpportunity(vehicles);
    if (keysOpportunity) opportunities.push(keysOpportunity);

    // Location opportunity analysis
    const locationOpportunity = this.analyzeLocationOpportunity(vehicles);
    if (locationOpportunity) opportunities.push(locationOpportunity);

    // Year-based opportunity analysis
    const yearOpportunity = this.analyzeYearOpportunity(vehicles);
    if (yearOpportunity) opportunities.push(yearOpportunity);

    return opportunities;
  }

  private analyzeDamageOpportunity(vehicles: any[]) {
    const damageGroups: Record<string, number[]> = {};
    
    vehicles.forEach(v => {
      const damage = v.damage || 'Unknown';
      if (!damageGroups[damage]) damageGroups[damage] = [];
      damageGroups[damage].push(v.price);
    });

    // Find damage types with good volume and analyze pricing
    const damageAnalysis = Object.entries(damageGroups)
      .filter(([_, prices]) => prices.length >= 50)
      .map(([damage, prices]) => ({
        damage,
        avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
        count: prices.length
      }))
      .sort((a, b) => a.avgPrice - b.avgPrice);

    if (damageAnalysis.length < 2) return null;

    const bestDamage = damageAnalysis[0];
    const avgMarketPrice = vehicles.reduce((sum, v) => sum + v.price, 0) / vehicles.length;
    const discount = Math.round(avgMarketPrice - bestDamage.avgPrice);
    const discountPercent = ((discount / avgMarketPrice) * 100).toFixed(1);

    return {
      title: `${bestDamage.damage} Damage Vehicles`,
      description: `Vehicles with ${bestDamage.damage} damage trade at ${discountPercent}% below market average, presenting strong acquisition opportunities with potential for profitable resale.`,
      profitPotential: `$${discount} savings per vehicle`,
      actionSteps: [
        `Target ${bestDamage.damage} damage vehicles in upcoming auctions`,
        `Set maximum bid at $${Math.round(bestDamage.avgPrice * 1.1)}`,
        `Research repair costs for ${bestDamage.damage} damage types`,
        `Focus on vehicles where damage appears repairable`
      ],
      dataSupport: `Analysis of ${bestDamage.count} vehicles with ${bestDamage.damage} damage`
    };
  }

  private analyzeKeysOpportunity(vehicles: any[]) {
    const withKeys = vehicles.filter(v => v.has_keys === true);
    const withoutKeys = vehicles.filter(v => v.has_keys === false);

    if (withKeys.length < 20 || withoutKeys.length < 20) return null;

    const keysAvg = withKeys.reduce((sum, v) => sum + v.price, 0) / withKeys.length;
    const noKeysAvg = withoutKeys.reduce((sum, v) => sum + v.price, 0) / withoutKeys.length;
    const priceDiff = Math.round(keysAvg - noKeysAvg);
    const percentDiff = ((priceDiff / noKeysAvg) * 100).toFixed(1);

    return {
      title: 'Vehicle Keys Impact Strategy',
      description: `Vehicles with keys present command ${percentDiff}% higher prices. Strategic targeting of keyless vehicles can reduce acquisition costs while factoring replacement expenses.`,
      profitPotential: `$${priceDiff} potential savings per vehicle`,
      actionSteps: [
        'Focus bidding on vehicles listed without keys',
        'Budget $200-$600 for key replacement costs',
        'Verify security system compatibility before bidding',
        'Target newer models where key programming is cost-effective'
      ],
      dataSupport: `${withKeys.length} vehicles with keys vs ${withoutKeys.length} without keys analyzed`
    };
  }

  private analyzeLocationOpportunity(vehicles: any[]) {
    const locationGroups: Record<string, number[]> = {};
    
    vehicles.forEach(v => {
      const location = v.location || 'Unknown';
      if (!locationGroups[location]) locationGroups[location] = [];
      locationGroups[location].push(v.price);
    });

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
    const avgMarketPrice = vehicles.reduce((sum, v) => sum + v.price, 0) / vehicles.length;
    const savings = Math.round(avgMarketPrice - bestLocation.avgPrice);
    const savingsPercent = ((savings / avgMarketPrice) * 100).toFixed(1);

    return {
      title: `${bestLocation.location} Geographic Advantage`,
      description: `Vehicles from ${bestLocation.location} auctions trade ${savingsPercent}% below market average, offering geographic arbitrage opportunities for strategic buyers.`,
      profitPotential: `$${savings} average savings per vehicle`,
      actionSteps: [
        `Prioritize bidding at ${bestLocation.location} auction locations`,
        'Calculate transportation costs to your target market',
        'Build relationships with local auction representatives',
        'Monitor inventory patterns at this location'
      ],
      dataSupport: `${bestLocation.count} vehicles analyzed from ${bestLocation.location}`
    };
  }

  private analyzeYearOpportunity(vehicles: any[]) {
    const yearGroups: Record<number, number[]> = {};
    
    vehicles.forEach(v => {
      if (v.year && v.year > 2000) {
        if (!yearGroups[v.year]) yearGroups[v.year] = [];
        yearGroups[v.year].push(v.price);
      }
    });

    const yearAnalysis = Object.entries(yearGroups)
      .filter(([_, prices]) => prices.length >= 30)
      .map(([year, prices]) => ({
        year: parseInt(year),
        avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
        count: prices.length
      }))
      .sort((a, b) => a.avgPrice - b.avgPrice);

    if (yearAnalysis.length < 3) return null;

    const bestYear = yearAnalysis[0];
    const avgMarketPrice = vehicles.reduce((sum, v) => sum + v.price, 0) / vehicles.length;
    const discount = Math.round(avgMarketPrice - bestYear.avgPrice);

    return {
      title: `${bestYear.year} Model Year Opportunity`,
      description: `${bestYear.year} model year vehicles trade significantly below market average, representing strong value acquisition targets with established depreciation curves.`,
      profitPotential: `$${discount} below market average`,
      actionSteps: [
        `Focus on ${bestYear.year} model year vehicles in auctions`,
        `Research common mechanical issues for ${bestYear.year} models`,
        `Set competitive bid limits around $${Math.round(bestYear.avgPrice * 1.05)}`,
        'Target popular makes from this model year'
      ],
      dataSupport: `${bestYear.count} vehicles from ${bestYear.year} analyzed`
    };
  }

  private analyzeMarketTrends(vehicles: any[]) {
    const trends = [];

    // Price trend by year
    const currentYear = new Date().getFullYear();
    const recentVehicles = vehicles.filter(v => v.year >= currentYear - 8);
    const olderVehicles = vehicles.filter(v => v.year < currentYear - 8 && v.year > currentYear - 15);

    if (recentVehicles.length > 100 && olderVehicles.length > 100) {
      const recentAvg = recentVehicles.reduce((sum, v) => sum + v.price, 0) / recentVehicles.length;
      const olderAvg = olderVehicles.reduce((sum, v) => sum + v.price, 0) / olderVehicles.length;
      const priceDiff = recentAvg - olderAvg;
      const percentDiff = ((priceDiff / olderAvg) * 100).toFixed(1);

      trends.push({
        category: 'Age-Based Pricing',
        finding: `Newer vehicles (8 years or less) trade ${Math.abs(parseFloat(percentDiff))}% ${priceDiff > 0 ? 'higher' : 'lower'} than older vehicles`,
        impact: priceDiff > 0 ? 'Focus on older vehicles for better value opportunities' : 'Recent models showing competitive pricing'
      });
    }

    // Damage frequency analysis
    const damageFreq: Record<string, number> = {};
    vehicles.forEach(v => {
      const damage = v.damage || 'Unknown';
      damageFreq[damage] = (damageFreq[damage] || 0) + 1;
    });

    const topDamage = Object.entries(damageFreq)
      .sort(([,a], [,b]) => b - a)[0];

    if (topDamage) {
      const percentage = ((topDamage[1] / vehicles.length) * 100).toFixed(1);
      trends.push({
        category: 'Damage Distribution',
        finding: `${topDamage[0]} damage represents ${percentage}% of available inventory`,
        impact: `Developing expertise in ${topDamage[0]} damage repair provides competitive advantage`
      });
    }

    // Make concentration analysis
    const makeFreq: Record<string, number> = {};
    vehicles.forEach(v => {
      if (v.make) {
        makeFreq[v.make] = (makeFreq[v.make] || 0) + 1;
      }
    });

    const topMake = Object.entries(makeFreq)
      .sort(([,a], [,b]) => b - a)[0];

    if (topMake) {
      const percentage = ((topMake[1] / vehicles.length) * 100).toFixed(1);
      trends.push({
        category: 'Brand Availability',
        finding: `${topMake[0]} vehicles represent ${percentage}% of auction inventory`,
        impact: `Strong ${topMake[0]} market presence offers consistent acquisition opportunities`
      });
    }

    return trends;
  }

  private generateRecommendations(vehicles: any[]) {
    const avgPrice = vehicles.reduce((sum, v) => sum + v.price, 0) / vehicles.length;
    const priceStdDev = Math.sqrt(
      vehicles.reduce((sum, v) => sum + Math.pow(v.price - avgPrice, 2), 0) / vehicles.length
    );

    return {
      immediate: [
        `Target vehicles priced $${Math.round(priceStdDev)} below the $${Math.round(avgPrice)} market average`,
        'Focus on high-frequency damage types for consistent opportunities',
        'Set up alerts for the most active auction locations',
        'Prioritize vehicles with clear repair paths and market demand'
      ],
      strategic: [
        'Build specialized expertise in the most profitable damage categories',
        'Develop geographic diversification to access multiple auction markets',
        'Create standardized evaluation criteria for consistent decision-making',
        'Establish repair network relationships for cost-effective reconditioning'
      ]
    };
  }
}