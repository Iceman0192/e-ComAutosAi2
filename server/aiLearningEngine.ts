import OpenAI from "openai";
import { db } from "./db";
import { aiPatterns, analysisHistory, salesHistory, aiLearningMetrics } from "@shared/schema";
import { sql, desc, and, gte, lte, eq, gt } from "drizzle-orm";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface LearnedPattern {
  id?: string;
  type: 'profitability' | 'temporal' | 'geographic' | 'damage_correlation' | 'market_trend';
  description: string;
  confidence: number;
  frequency: number;
  dataPoints: any;
  lastValidated: Date;
  effectiveness?: number;
}

interface IncrementalLearning {
  newPatterns: LearnedPattern[];
  updatedPatterns: LearnedPattern[];
  expiredPatterns: string[];
  confidenceAdjustments: { patternId: string; newConfidence: number }[];
}

export class AILearningEngine {
  private patternCache: Map<string, LearnedPattern> = new Map();
  private lastCacheUpdate: Date | null = null;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly MIN_PATTERN_FREQUENCY = 3;
  private readonly CONFIDENCE_THRESHOLD = 0.7;

  constructor() {
    this.initializeCache();
  }

  async initializeCache() {
    console.log('Initializing AI learning pattern cache...');
    
    try {
      const existingPatterns = await db
        .select()
        .from(aiPatterns)
        .where(gt(aiPatterns.confidence, sql`${this.CONFIDENCE_THRESHOLD}`))
        .orderBy(desc(aiPatterns.confidence));

      existingPatterns.forEach(pattern => {
        this.patternCache.set(pattern.id.toString(), {
          id: pattern.id.toString(),
          type: pattern.patternType as any,
          description: pattern.description,
          confidence: Number(pattern.confidence),
          frequency: pattern.frequency,
          dataPoints: JSON.parse(pattern.patternData),
          lastValidated: new Date(pattern.lastSeen)
        });
      });

      this.lastCacheUpdate = new Date();
      console.log(`Loaded ${existingPatterns.length} patterns into cache`);
    } catch (error) {
      console.error('Error initializing pattern cache:', error);
    }
  }

  async processIncrementalData(newDataBatch: any[]): Promise<IncrementalLearning> {
    console.log(`Processing ${newDataBatch.length} new records for incremental learning...`);
    
    // Extract patterns from new data
    const newPatterns = await this.extractPatternsFromBatch(newDataBatch);
    
    // Compare with existing patterns
    const learningResults = await this.updateExistingPatterns(newPatterns);
    
    // Persist validated patterns
    await this.persistLearningResults(learningResults);
    
    return learningResults;
  }

  private async extractPatternsFromBatch(dataBatch: any[]): Promise<LearnedPattern[]> {
    const patterns: LearnedPattern[] = [];
    
    // Profitability patterns
    const profitPatterns = this.analyzeProfitabilityPatterns(dataBatch);
    patterns.push(...profitPatterns);
    
    // Temporal patterns
    const temporalPatterns = this.analyzeTemporalPatterns(dataBatch);
    patterns.push(...temporalPatterns);
    
    // Geographic patterns
    const geoPatterns = this.analyzeGeographicPatterns(dataBatch);
    patterns.push(...geoPatterns);
    
    // Damage correlation patterns
    const damagePatterns = this.analyzeDamagePatterns(dataBatch);
    patterns.push(...damagePatterns);
    
    return patterns.filter(p => p.frequency >= this.MIN_PATTERN_FREQUENCY);
  }

  private analyzeProfitabilityPatterns(data: any[]): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];
    
    // Group by make and analyze profit margins
    const makeGroups = this.groupBy(data, 'make');
    
    Object.entries(makeGroups).forEach(([make, records]: [string, any[]]) => {
      const profitableRecords = records.filter(r => 
        r.purchase_price && parseFloat(r.purchase_price) > 0
      );
      
      if (profitableRecords.length >= this.MIN_PATTERN_FREQUENCY) {
        const avgPrice = this.calculateAverage(profitableRecords, 'purchase_price');
        const priceVariance = this.calculateVariance(profitableRecords, 'purchase_price');
        
        // Calculate confidence based on data consistency
        const confidence = Math.max(0.5, 1 - (priceVariance / (avgPrice * avgPrice)));
        
        if (confidence >= this.CONFIDENCE_THRESHOLD) {
          patterns.push({
            type: 'profitability',
            description: `${make} vehicles show consistent pricing at $${Math.round(avgPrice)} average`,
            confidence: Math.round(confidence * 100) / 100,
            frequency: profitableRecords.length,
            dataPoints: {
              make,
              avgPrice: Math.round(avgPrice),
              priceRange: {
                min: Math.min(...profitableRecords.map(r => parseFloat(r.purchase_price))),
                max: Math.max(...profitableRecords.map(r => parseFloat(r.purchase_price)))
              },
              sampleSize: profitableRecords.length
            },
            lastValidated: new Date()
          });
        }
      }
    });
    
    return patterns;
  }

  private analyzeTemporalPatterns(data: any[]): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];
    
    // Group by month and analyze seasonal trends
    const monthGroups = this.groupBy(data, 'sale_date', (date) => {
      if (!date) return 'unknown';
      return new Date(date).getMonth().toString();
    });
    
    Object.entries(monthGroups).forEach(([month, records]: [string, any[]]) => {
      if (records.length >= this.MIN_PATTERN_FREQUENCY && month !== 'unknown') {
        const avgPrice = this.calculateAverage(records, 'purchase_price');
        const monthName = new Date(2024, parseInt(month), 1).toLocaleString('default', { month: 'long' });
        
        patterns.push({
          type: 'temporal',
          description: `${monthName} shows ${records.length} transactions at $${Math.round(avgPrice)} average`,
          confidence: Math.min(0.95, 0.6 + (records.length / 100)),
          frequency: records.length,
          dataPoints: {
            month: parseInt(month),
            monthName,
            avgPrice: Math.round(avgPrice),
            volume: records.length,
            topMakes: this.getTopItems(records.map(r => r.make).filter(Boolean), 3)
          },
          lastValidated: new Date()
        });
      }
    });
    
    return patterns;
  }

  private analyzeGeographicPatterns(data: any[]): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];
    
    const locationGroups = this.groupBy(data, 'auction_location');
    
    Object.entries(locationGroups).forEach(([location, records]: [string, any[]]) => {
      if (records.length >= this.MIN_PATTERN_FREQUENCY && location && location !== 'null') {
        const avgPrice = this.calculateAverage(records, 'purchase_price');
        const soldRecords = records.filter(r => 
          r.sale_status && r.sale_status.toLowerCase().includes('sold')
        );
        const soldRate = (soldRecords.length / records.length) * 100;
        
        patterns.push({
          type: 'geographic',
          description: `${location} location shows ${soldRate.toFixed(1)}% sold rate with $${Math.round(avgPrice)} average`,
          confidence: Math.min(0.9, 0.6 + (records.length / 200)),
          frequency: records.length,
          dataPoints: {
            location,
            avgPrice: Math.round(avgPrice),
            volume: records.length,
            soldRate: Math.round(soldRate * 10) / 10,
            topMakes: this.getTopItems(records.map(r => r.make).filter(Boolean), 3)
          },
          lastValidated: new Date()
        });
      }
    });
    
    return patterns;
  }

  private analyzeDamagePatterns(data: any[]): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];
    
    const damageGroups = this.groupBy(data, 'vehicle_damage');
    
    Object.entries(damageGroups).forEach(([damage, records]: [string, any[]]) => {
      if (records.length >= this.MIN_PATTERN_FREQUENCY && damage && damage !== 'null') {
        const avgPrice = this.calculateAverage(records, 'purchase_price');
        const withKeys = records.filter(r => r.vehicle_has_keys === true).length;
        const keyRate = (withKeys / records.length) * 100;
        
        patterns.push({
          type: 'damage_correlation',
          description: `${damage} damage type: $${Math.round(avgPrice)} average, ${keyRate.toFixed(1)}% have keys`,
          confidence: Math.min(0.85, 0.6 + (records.length / 150)),
          frequency: records.length,
          dataPoints: {
            damageType: damage,
            avgPrice: Math.round(avgPrice),
            volume: records.length,
            keyAvailabilityRate: Math.round(keyRate * 10) / 10,
            topMakes: this.getTopItems(records.map(r => r.make).filter(Boolean), 3)
          },
          lastValidated: new Date()
        });
      }
    });
    
    return patterns;
  }

  private async updateExistingPatterns(newPatterns: LearnedPattern[]): Promise<IncrementalLearning> {
    const results: IncrementalLearning = {
      newPatterns: [],
      updatedPatterns: [],
      expiredPatterns: [],
      confidenceAdjustments: []
    };

    for (const newPattern of newPatterns) {
      const similarExisting = this.findSimilarPattern(newPattern);
      
      if (similarExisting) {
        // Update existing pattern
        const updatedPattern = this.mergePatterns(similarExisting, newPattern);
        results.updatedPatterns.push(updatedPattern);
        this.patternCache.set(similarExisting.id!, updatedPattern);
      } else {
        // Add new pattern
        results.newPatterns.push(newPattern);
      }
    }

    // Check for expired patterns (not seen in recent data)
    const cutoffDate = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)); // 7 days
    for (const [id, pattern] of this.patternCache) {
      if (pattern.lastValidated < cutoffDate && pattern.confidence < 0.6) {
        results.expiredPatterns.push(id);
        this.patternCache.delete(id);
      }
    }

    return results;
  }

  private findSimilarPattern(newPattern: LearnedPattern): LearnedPattern | null {
    for (const existing of this.patternCache.values()) {
      if (existing.type === newPattern.type) {
        // Type-specific similarity checks
        if (this.arePatternsContentSimilar(existing, newPattern)) {
          return existing;
        }
      }
    }
    return null;
  }

  private arePatternsContentSimilar(existing: LearnedPattern, newPattern: LearnedPattern): boolean {
    switch (existing.type) {
      case 'profitability':
        return existing.dataPoints.make === newPattern.dataPoints.make;
      case 'temporal':
        return existing.dataPoints.month === newPattern.dataPoints.month;
      case 'geographic':
        return existing.dataPoints.location === newPattern.dataPoints.location;
      case 'damage_correlation':
        return existing.dataPoints.damageType === newPattern.dataPoints.damageType;
      default:
        return false;
    }
  }

  private mergePatterns(existing: LearnedPattern, newPattern: LearnedPattern): LearnedPattern {
    // Weighted average of confidence based on frequency
    const totalFreq = existing.frequency + newPattern.frequency;
    const weightedConfidence = (
      (existing.confidence * existing.frequency) + 
      (newPattern.confidence * newPattern.frequency)
    ) / totalFreq;

    return {
      ...existing,
      confidence: Math.round(weightedConfidence * 100) / 100,
      frequency: totalFreq,
      dataPoints: {
        ...existing.dataPoints,
        ...newPattern.dataPoints,
        sampleSize: totalFreq
      },
      lastValidated: new Date()
    };
  }

  private async persistLearningResults(results: IncrementalLearning): Promise<void> {
    try {
      // Insert new patterns
      for (const pattern of results.newPatterns) {
        await db.insert(aiPatterns).values({
          patternType: pattern.type,
          description: pattern.description,
          patternData: JSON.stringify(pattern.dataPoints),
          confidence: pattern.confidence.toString(),
          frequency: pattern.frequency,
          lastSeen: new Date(),
          createdAt: new Date()
        });
      }

      // Update existing patterns
      for (const pattern of results.updatedPatterns) {
        if (pattern.id) {
          await db.update(aiPatterns)
            .set({
              confidence: pattern.confidence.toString(),
              frequency: pattern.frequency,
              patternData: JSON.stringify(pattern.dataPoints),
              lastSeen: new Date()
            })
            .where(eq(aiPatterns.id, parseInt(pattern.id)));
        }
      }

      // Remove expired patterns
      for (const expiredId of results.expiredPatterns) {
        await db.delete(aiPatterns)
          .where(eq(aiPatterns.id, parseInt(expiredId)));
      }

      console.log(`Learning persisted: ${results.newPatterns.length} new, ${results.updatedPatterns.length} updated, ${results.expiredPatterns.length} expired`);
    } catch (error) {
      console.error('Error persisting learning results:', error);
    }
  }

  async getHighConfidencePatterns(type?: string): Promise<LearnedPattern[]> {
    const patterns = Array.from(this.patternCache.values())
      .filter(p => p.confidence >= this.CONFIDENCE_THRESHOLD)
      .filter(p => !type || p.type === type)
      .sort((a, b) => b.confidence - a.confidence);
    
    return patterns;
  }

  async generateSmartInsights(salesData: any[], existingAnalysis: any): Promise<any> {
    // Use cached patterns to enhance analysis
    const relevantPatterns = await this.getHighConfidencePatterns();
    
    const enhancedPrompt = `Based on ${relevantPatterns.length} learned patterns and new data analysis:

LEARNED PATTERNS (High Confidence):
${relevantPatterns.slice(0, 10).map(p => 
  `- ${p.type.toUpperCase()}: ${p.description} (${p.confidence} confidence, ${p.frequency} occurrences)`
).join('\n')}

NEW DATA SAMPLE:
${JSON.stringify(salesData.slice(0, 3), null, 2)}

CURRENT ANALYSIS:
${JSON.stringify(existingAnalysis, null, 2)}

Provide enhanced insights that:
1. Validate or contradict learned patterns with new data
2. Identify emerging opportunities not yet in pattern database
3. Recommend specific actions based on pattern confidence
4. Suggest market timing based on temporal patterns

Respond in JSON format with opportunities, market_trends, risk_factors, and recommendations arrays.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: enhancedPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 2000
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error generating smart insights:', error);
      return existingAnalysis;
    }
  }

  // Utility methods
  private groupBy(array: any[], key: string, transform?: (value: any) => string): Record<string, any[]> {
    return array.reduce((groups, item) => {
      const value = transform ? transform(item[key]) : item[key];
      const groupKey = value || 'unknown';
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, any[]>);
  }

  private calculateAverage(array: any[], field: string): number {
    const values = array
      .map(item => parseFloat(item[field]))
      .filter(val => !isNaN(val) && val > 0);
    
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  private calculateVariance(array: any[], field: string): number {
    const values = array
      .map(item => parseFloat(item[field]))
      .filter(val => !isNaN(val) && val > 0);
    
    if (values.length < 2) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  }

  private getTopItems(items: string[], count: number): string[] {
    const frequency: Record<string, number> = {};
    items.filter(Boolean).forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([item]) => item);
  }
}