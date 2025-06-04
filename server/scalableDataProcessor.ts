import { db } from "./db";
import { salesHistory } from "@shared/schema";
import { sql, desc, and, gte, lte, eq, inArray } from "drizzle-orm";
import { AILearningEngine } from "./aiLearningEngine";
import { IntelligentCacheManager } from "./intelligentCacheManager";

interface ProcessingBatch {
  batchId: string;
  data: any[];
  size: number;
  startTime: Date;
  filters?: any;
}

interface ProcessingMetrics {
  totalRecords: number;
  processedBatches: number;
  averageBatchTime: number;
  totalProcessingTime: number;
  memoryUsage: number;
  cacheHitRate: number;
}

export class ScalableDataProcessor {
  private learningEngine: AILearningEngine;
  private cacheManager: IntelligentCacheManager;
  private readonly OPTIMAL_BATCH_SIZE = 5000;
  private readonly MAX_MEMORY_THRESHOLD = 0.85; // 85% memory usage threshold
  private processingMetrics: ProcessingMetrics;

  constructor() {
    this.learningEngine = new AILearningEngine();
    this.cacheManager = new IntelligentCacheManager();
    this.processingMetrics = {
      totalRecords: 0,
      processedBatches: 0,
      averageBatchTime: 0,
      totalProcessingTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0
    };
  }

  async processLargeDataset(
    userId: number,
    analysisType: 'standard' | 'comprehensive',
    requestedSize: number,
    filters: any = {}
  ): Promise<any> {
    const startTime = Date.now();
    console.log(`Starting scalable processing for ${requestedSize} records (${analysisType} analysis)`);

    // Check cache first
    const cachedResult = await this.cacheManager.getCachedResult(
      userId, analysisType, filters, requestedSize
    );
    
    if (cachedResult) {
      console.log(`Cache hit - returning cached result for ${analysisType} analysis`);
      return {
        success: true,
        data: cachedResult.results,
        cached: true,
        processingTime: Date.now() - startTime,
        cacheKey: cachedResult.resultsHash
      };
    }

    // Determine optimal processing strategy
    const strategy = this.determineProcessingStrategy(requestedSize, analysisType);
    
    try {
      let results;
      
      if (strategy.useStreaming) {
        results = await this.processWithStreaming(userId, analysisType, requestedSize, filters);
      } else {
        results = await this.processBatchWise(userId, analysisType, requestedSize, filters);
      }

      const totalTime = Date.now() - startTime;
      
      // Cache the results
      await this.cacheManager.cacheResult(
        userId, analysisType, filters, requestedSize, results, null, {
          duration: totalTime,
          strategy: strategy.name,
          batchCount: this.processingMetrics.processedBatches
        }
      );

      // Update learning engine with incremental data
      if (results.newDataBatch && results.newDataBatch.length > 0) {
        await this.learningEngine.processIncrementalData(results.newDataBatch);
      }

      return {
        success: true,
        data: results,
        cached: false,
        processingTime: totalTime,
        metrics: this.processingMetrics
      };

    } catch (error) {
      console.error('Error in scalable data processing:', error);
      throw error;
    }
  }

  private determineProcessingStrategy(dataSize: number, analysisType: string): any {
    const memoryUsage = this.getCurrentMemoryUsage();
    
    if (dataSize >= 50000 || memoryUsage > this.MAX_MEMORY_THRESHOLD) {
      return {
        name: 'streaming',
        useStreaming: true,
        batchSize: Math.max(this.OPTIMAL_BATCH_SIZE, Math.floor(dataSize / 20)),
        maxConcurrency: 2
      };
    } else if (dataSize >= 15000) {
      return {
        name: 'batch_processing',
        useStreaming: false,
        batchSize: this.OPTIMAL_BATCH_SIZE,
        maxConcurrency: 3
      };
    } else {
      return {
        name: 'direct_processing',
        useStreaming: false,
        batchSize: dataSize,
        maxConcurrency: 1
      };
    }
  }

  private async processWithStreaming(
    userId: number,
    analysisType: string,
    requestedSize: number,
    filters: any
  ): Promise<any> {
    console.log(`Using streaming strategy for ${requestedSize} records`);
    
    const results = {
      overview: {},
      opportunities: [],
      marketTrends: [],
      riskFactors: [],
      recommendations: [],
      newDataBatch: []
    };

    let offset = 0;
    const batchSize = Math.min(this.OPTIMAL_BATCH_SIZE, Math.floor(requestedSize / 10));
    let processedRecords = 0;

    while (processedRecords < requestedSize) {
      const remainingRecords = requestedSize - processedRecords;
      const currentBatchSize = Math.min(batchSize, remainingRecords);
      
      const batch = await this.fetchDataBatch(currentBatchSize, offset, filters);
      
      if (batch.length === 0) break;

      // Process batch incrementally
      const batchResults = await this.processSingleBatch({
        batchId: `batch_${offset}`,
        data: batch,
        size: batch.length,
        startTime: new Date(),
        filters
      });

      // Merge results
      this.mergeStreamingResults(results, batchResults);
      
      processedRecords += batch.length;
      offset += batch.length;
      
      // Add to new data for learning
      results.newDataBatch.push(...batch.slice(0, 100)); // Sample for learning
      
      // Memory management
      if (this.getCurrentMemoryUsage() > this.MAX_MEMORY_THRESHOLD) {
        console.log('Memory threshold reached, forcing garbage collection');
        if (global.gc) global.gc();
      }
    }

    // Generate final insights with learned patterns
    const enhancedResults = await this.learningEngine.generateSmartInsights(
      results.newDataBatch,
      results
    );

    return { ...results, ...enhancedResults };
  }

  private async processBatchWise(
    userId: number,
    analysisType: string,
    requestedSize: number,
    filters: any
  ): Promise<any> {
    console.log(`Using batch processing strategy for ${requestedSize} records`);
    
    // Fetch all data in optimal chunks
    const allData = await this.fetchDataBatch(requestedSize, 0, filters);
    
    if (allData.length === 0) {
      throw new Error('No data available for analysis');
    }

    // Process in manageable chunks for memory efficiency
    const chunkSize = this.OPTIMAL_BATCH_SIZE;
    const chunks = this.chunkArray(allData, chunkSize);
    
    let aggregatedResults = {
      overview: {},
      opportunities: [],
      marketTrends: [],
      riskFactors: [],
      recommendations: [],
      newDataBatch: allData.slice(0, 500) // Sample for learning
    };

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const batchResults = await this.processSingleBatch({
        batchId: `chunk_${i}`,
        data: chunk,
        size: chunk.length,
        startTime: new Date(),
        filters
      });

      this.mergeStreamingResults(aggregatedResults, batchResults);
    }

    // Generate enhanced insights
    const enhancedResults = await this.learningEngine.generateSmartInsights(
      aggregatedResults.newDataBatch,
      aggregatedResults
    );

    return { ...aggregatedResults, ...enhancedResults };
  }

  private async fetchDataBatch(
    size: number,
    offset: number,
    filters: any = {}
  ): Promise<any[]> {
    let query = db.select().from(salesHistory);

    // Apply filters
    const conditions = [];
    
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

    const data = await query
      .orderBy(desc(salesHistory.sale_date))
      .limit(size)
      .offset(offset);

    return data;
  }

  private async processSingleBatch(batch: ProcessingBatch): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Basic statistical analysis
      const batchStats = this.calculateBatchStatistics(batch.data);
      
      // Identify patterns within this batch
      const batchPatterns = this.extractBatchPatterns(batch.data);
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      
      // Update metrics
      this.updateProcessingMetrics(batch.size, processingTime);
      
      return {
        overview: batchStats,
        opportunities: batchPatterns.opportunities,
        marketTrends: batchPatterns.trends,
        riskFactors: batchPatterns.risks,
        recommendations: batchPatterns.recommendations,
        batchMetrics: {
          batchId: batch.batchId,
          size: batch.size,
          processingTime
        }
      };
      
    } catch (error) {
      console.error(`Error processing batch ${batch.batchId}:`, error);
      throw error;
    }
  }

  private calculateBatchStatistics(data: any[]): any {
    const validPrices = data
      .map(record => parseFloat(record.purchase_price))
      .filter(price => !isNaN(price) && price > 0);

    if (validPrices.length === 0) {
      return {
        totalRecords: data.length,
        avgPrice: 0,
        priceRange: { min: 0, max: 0 },
        topMakes: []
      };
    }

    const avgPrice = validPrices.reduce((a, b) => a + b, 0) / validPrices.length;
    const topMakes = this.getTopItems(data.map(r => r.make).filter(Boolean), 5);

    return {
      totalRecords: data.length,
      avgPrice: Math.round(avgPrice),
      priceRange: {
        min: Math.min(...validPrices),
        max: Math.max(...validPrices)
      },
      topMakes
    };
  }

  private extractBatchPatterns(data: any[]): any {
    // Extract basic patterns from batch data
    const makeGroups = this.groupBy(data, 'make');
    const yearGroups = this.groupBy(data, 'year');
    
    const opportunities = Object.entries(makeGroups)
      .filter(([make, records]: [string, any[]]) => records.length >= 3)
      .slice(0, 3)
      .map(([make, records]: [string, any[]]) => {
        const avgPrice = this.calculateAverage(records, 'purchase_price');
        return {
          category: 'vehicle_segment',
          title: `${make} Market Opportunity`,
          description: `${records.length} ${make} vehicles at $${Math.round(avgPrice)} average`,
          confidence: Math.min(0.9, 0.6 + (records.length / 50)),
          potentialProfit: Math.round(avgPrice * 0.15), // Estimated 15% margin
          riskLevel: records.length > 10 ? 'Low' : 'Medium',
          actionableSteps: [`Target ${make} vehicles in $${Math.round(avgPrice * 0.9)}-$${Math.round(avgPrice * 1.1)} range`]
        };
      });

    return {
      opportunities,
      trends: [],
      risks: [],
      recommendations: [`Focus on ${Object.keys(makeGroups).length} available makes`]
    };
  }

  private mergeStreamingResults(aggregate: any, batchResults: any): void {
    // Merge opportunities
    if (batchResults.opportunities) {
      aggregate.opportunities.push(...batchResults.opportunities);
    }

    // Merge market trends
    if (batchResults.marketTrends) {
      aggregate.marketTrends.push(...batchResults.marketTrends);
    }

    // Merge recommendations
    if (batchResults.recommendations) {
      aggregate.recommendations.push(...batchResults.recommendations);
    }

    // Update overview statistics
    if (batchResults.overview && aggregate.overview) {
      if (!aggregate.overview.totalRecords) {
        aggregate.overview = { ...batchResults.overview };
      } else {
        // Merge statistics
        aggregate.overview.totalRecords += batchResults.overview.totalRecords || 0;
        
        if (batchResults.overview.avgPrice) {
          const totalRecords = aggregate.overview.totalRecords;
          const batchRecords = batchResults.overview.totalRecords || 0;
          const weightedAvg = (
            (aggregate.overview.avgPrice * (totalRecords - batchRecords)) +
            (batchResults.overview.avgPrice * batchRecords)
          ) / totalRecords;
          aggregate.overview.avgPrice = Math.round(weightedAvg);
        }
      }
    }
  }

  private updateProcessingMetrics(batchSize: number, processingTime: number): void {
    this.processingMetrics.totalRecords += batchSize;
    this.processingMetrics.processedBatches++;
    
    const totalTime = (this.processingMetrics.averageBatchTime * (this.processingMetrics.processedBatches - 1)) + processingTime;
    this.processingMetrics.averageBatchTime = Math.round(totalTime / this.processingMetrics.processedBatches);
    
    this.processingMetrics.memoryUsage = this.getCurrentMemoryUsage();
  }

  private getCurrentMemoryUsage(): number {
    const used = process.memoryUsage();
    const totalHeap = used.heapTotal;
    const usedHeap = used.heapUsed;
    return usedHeap / totalHeap;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
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
    items.filter(Boolean).forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([item]) => item);
  }

  async getProcessingStatistics(): Promise<any> {
    const cacheStats = await this.cacheManager.getCacheStatistics();
    
    return {
      processing: this.processingMetrics,
      cache: cacheStats,
      memory: {
        usage: this.getCurrentMemoryUsage(),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };
  }
}