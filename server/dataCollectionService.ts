import { db, pool } from './db';
import { salesHistory } from '../shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

interface CollectionJob {
  id: string;
  make: string;
  priority: number;
  lastCollected?: Date;
  modelsDiscovered?: string[];
  lastModelIndex?: number;
}

export class DataCollectionService {
  private isRunning = false;
  private collectionQueue: CollectionJob[] = [];
  private readonly BATCH_SIZE = 25; // Match API pagination limit
  private readonly COLLECTION_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly DAYS_WINDOW = 150; // 150 day rolling window (5 months max)

  constructor() {
    this.initializeCollectionQueue();
    // Auto-start is disabled - manual control only
  }

  private initializeCollectionQueue() {
    // Rebalanced collection - prioritize data gap fills first
    const makesToCollect = [
      // Priority 1: Fill mainstream brand gaps (Honda, Toyota, Ford, Chevrolet)
      { make: 'Toyota', priority: 1 },
      { make: 'Honda', priority: 1 },
      { make: 'Ford', priority: 1 },
      { make: 'Chevrolet', priority: 1 },
      
      // Priority 2: Other high-volume mainstream brands
      { make: 'Nissan', priority: 2 },
      { make: 'Hyundai', priority: 2 },
      { make: 'Kia', priority: 2 },
      { make: 'Jeep', priority: 2 },
      { make: 'Dodge', priority: 2 },
      
      // Priority 3: Well-covered luxury brands (already strong data)
      { make: 'BMW', priority: 3 },
      { make: 'Mercedes-Benz', priority: 3 },
      { make: 'Audi', priority: 3 },
      { make: 'Tesla', priority: 3 },
      { make: 'Porsche', priority: 3 },
      
      // Priority 4: Additional brands
      { make: 'Lexus', priority: 4 },
      { make: 'Infiniti', priority: 4 },
      { make: 'Acura', priority: 4 },
      { make: 'Cadillac', priority: 4 }
    ];

    this.collectionQueue = makesToCollect.map(({ make, priority }) => ({
      id: `${make.toLowerCase()}-${priority}`,
      make,
      priority,
      lastCollected: undefined,
      modelsDiscovered: [],
      lastModelIndex: 0
    }));

    console.log(`Data collection queue initialized with ${this.collectionQueue.length} makes`);
    console.log('Collection priorities:');
    console.log('Priority 1 (Data Gap Fill): Toyota, Honda, Ford, Chevrolet');
    console.log('Priority 2 (High Volume): Nissan, Hyundai, Kia, Jeep, Dodge');
    console.log('Priority 3 (Well Covered): BMW, Mercedes-Benz, Audi, Tesla, Porsche');
    console.log('Note: Auto-collection disabled - use manual controls only');
  }

  async startAutomatedCollection() {
    if (this.isRunning) {
      console.log('Collection already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting automated data collection service...');
    
    // Start the collection loop
    this.runCollectionLoop();
  }

  stopAutomatedCollection() {
    this.isRunning = false;
    console.log('Data collection service stopped');
  }

  private async runCollectionLoop() {
    while (this.isRunning) {
      try {
        await this.processNextJob();
        // Wait before processing next job
        await new Promise(resolve => setTimeout(resolve, this.COLLECTION_INTERVAL));
      } catch (error) {
        console.error('Error in collection loop:', error);
        // Continue after error with shorter delay
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
      }
    }
  }

  private async processNextJob() {
    // Sort by priority (lower number = higher priority) and last collected time
    const sortedJobs = this.collectionQueue
      .filter(job => !job.lastCollected || 
        (Date.now() - job.lastCollected.getTime()) > (24 * 60 * 60 * 1000)) // 24 hours
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        const aTime = a.lastCollected?.getTime() || 0;
        const bTime = b.lastCollected?.getTime() || 0;
        return aTime - bTime; // Oldest first
      });

    if (sortedJobs.length === 0) {
      console.log('No jobs need processing at this time');
      return;
    }

    const job = sortedJobs[0];
    console.log(`Processing collection job for ${job.make} (Priority ${job.priority})`);

    try {
      await this.collectDataForMake(job);
      job.lastCollected = new Date();
    } catch (error) {
      console.error(`Failed to collect data for ${job.make}:`, error);
    }
  }

  private async collectDataForMake(job: CollectionJob): Promise<number> {
    const { make } = job;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - this.DAYS_WINDOW);

    let totalCollected = 0;

    try {
      // Discover models for this make
      const discoveredModels = await this.discoverModelsForMake(make, startDate, endDate);
      
      if (discoveredModels.length === 0) {
        console.log(`No models found for ${make}, attempting base collection`);
        // Try without model specification
        totalCollected += await this.collectDataForMakeModelSite(
          make, '', startDate, endDate, 2012, 2025, 1
        );
        totalCollected += await this.collectDataForMakeModelSite(
          make, '', startDate, endDate, 2012, 2025, 2
        );
      } else {
        console.log(`Found ${discoveredModels.length} models for ${make}: ${discoveredModels.slice(0, 5).join(', ')}${discoveredModels.length > 5 ? '...' : ''}`);
        
        // Update job with discovered models
        job.modelsDiscovered = discoveredModels;
        
        // Collect data for each model from both sites
        for (const model of discoveredModels.slice(0, 50)) { // Limit to 50 models
          // Collect from Copart (site 1)
          const copartCollected = await this.collectDataForMakeModelSite(
            make, model, startDate, endDate, 2012, 2025, 1
          );
          
          // Small delay between sites
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Collect from IAAI (site 2)
          const iaaiCollected = await this.collectDataForMakeModelSite(
            make, model, startDate, endDate, 2012, 2025, 2
          );
          
          const modelTotal = copartCollected + iaaiCollected;
          totalCollected += modelTotal;
          
          if (modelTotal > 0) {
            console.log(`${make} ${model}: ${copartCollected} Copart + ${iaaiCollected} IAAI = ${modelTotal} total`);
          }
          
          // Delay between models to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      console.log(`Collection completed for ${make}: ${totalCollected} total records collected`);
      return totalCollected;
    } catch (error) {
      console.error(`Error collecting data for ${make}:`, error);
      throw error;
    }
  }

  private async discoverModelsForMake(make: string, startDate: Date, endDate: Date): Promise<string[]> {
    try {
      // Check existing data first
      const existingModels = await db
        .selectDistinct({ model: salesHistory.model })
        .from(salesHistory)
        .where(
          and(
            eq(salesHistory.make, make),
            gte(salesHistory.saleDate, startDate.toISOString().split('T')[0]),
            lte(salesHistory.saleDate, endDate.toISOString().split('T')[0])
          )
        )
        .limit(100);

      const models = existingModels
        .map(row => row.model)
        .filter((model): model is string => model !== null && model.trim() !== '' && model !== 'Unknown')
        .slice(0, 50);

      return models;
    } catch (error) {
      console.error(`Error discovering models for ${make}:`, error);
      return [];
    }
  }

  private async collectDataForMakeModelSite(
    make: string,
    model: string,
    startDate: Date,
    endDate: Date,
    yearFrom: number,
    yearTo: number,
    site: number
  ): Promise<number> {
    try {
      // Use existing API endpoint to collect data
      return await this.collectDataUsingExistingAPI(
        make, model, startDate, endDate, yearFrom, yearTo, site
      );
    } catch (error) {
      console.error(`Error collecting ${make} ${model} from site ${site}:`, error);
      return 0;
    }
  }

  private async collectDataUsingExistingAPI(
    make: string,
    model: string,
    startDate: Date,
    endDate: Date,
    yearFrom: number,
    yearTo: number,
    site: number
  ): Promise<number> {
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Check if we already have data for this period
      const existingCount = await this.checkExistingData(
        make, model, startDateStr, endDateStr, yearFrom, yearTo, site
      );
      
      if (existingCount > 0) {
        console.log(`${make} ${model} (site ${site}): ${existingCount} records already exist, skipping`);
        return 0;
      }

      // Simulate API call and data insertion
      // In a real implementation, this would call the actual APICAR API
      // and insert the results into the database
      
      return 0; // Placeholder return
    } catch (error) {
      console.error(`Error in API collection for ${make} ${model}:`, error);
      return 0;
    }
  }

  private async checkExistingData(
    make: string,
    model: string,
    startDate: string,
    endDate: string,
    yearFrom: number,
    yearTo: number,
    site: number
  ): Promise<number> {
    try {
      const conditions = [
        eq(salesHistory.make, make),
        eq(salesHistory.site, site),
        gte(salesHistory.saleDate, startDate),
        lte(salesHistory.saleDate, endDate),
        gte(salesHistory.year, yearFrom),
        lte(salesHistory.year, yearTo)
      ];

      if (model && model.trim() !== '') {
        conditions.push(eq(salesHistory.model, model));
      }

      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(salesHistory)
        .where(and(...conditions));

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error checking existing data:', error);
      return 0;
    }
  }

  getCollectionStatus() {
    return {
      isRunning: this.isRunning,
      queueLength: this.collectionQueue.length,
      nextJobs: this.collectionQueue
        .filter(job => !job.lastCollected || 
          (Date.now() - job.lastCollected.getTime()) > (24 * 60 * 60 * 1000))
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 5)
        .map(job => ({
          make: job.make,
          priority: job.priority,
          lastCollected: job.lastCollected,
          modelsCount: job.modelsDiscovered?.length || 0
        })),
      recentActivity: this.collectionQueue
        .filter(job => job.lastCollected)
        .map(job => ({
          make: job.make,
          lastCollected: job.lastCollected,
          modelsCount: job.modelsDiscovered?.length || 0
        }))
        .sort((a, b) => (b.lastCollected?.getTime() || 0) - (a.lastCollected?.getTime() || 0))
        .slice(0, 10)
    };
  }

  getQueueStatus() {
    return this.collectionQueue.map(job => ({
      id: job.id,
      make: job.make,
      priority: job.priority,
      lastCollected: job.lastCollected,
      modelsDiscovered: job.modelsDiscovered?.length || 0,
      status: job.lastCollected ? 'completed' : 'pending'
    }));
  }

  // Get vehicle progress summary
  async getVehicleProgress() {
    try {
      const progressQuery = `
        SELECT 
          make,
          COUNT(*) as total_records,
          COUNT(DISTINCT model) as unique_models,
          MIN(sale_date) as earliest_sale,
          MAX(sale_date) as latest_sale,
          AVG(purchase_price) as avg_price
        FROM sales_history 
        WHERE purchase_price > 0 
        GROUP BY make 
        ORDER BY total_records DESC
        LIMIT 50
      `;
      
      const result = await pool.query(progressQuery);
      return result.rows;
    } catch (error) {
      console.error('Error getting vehicle progress:', error);
      return [];
    }
  }

  // Get collection statistics by auction site
  async getCollectionStatsByAuctionSite() {
    try {
      const siteStatsQuery = `
        SELECT 
          site,
          CASE 
            WHEN site = 1 THEN 'Copart'
            WHEN site = 2 THEN 'IAAI'
            ELSE 'Unknown'
          END as site_name,
          COUNT(*) as vehicle_count,
          COUNT(DISTINCT make) as unique_makes,
          COUNT(DISTINCT model) as unique_models
        FROM sales_history 
        GROUP BY site
        ORDER BY vehicle_count DESC
      `;
      
      const result = await pool.query(siteStatsQuery);
      const sites = result.rows;
      
      const totalVehicles = sites.reduce((sum, stat) => sum + parseInt(stat.vehicle_count), 0);
      
      return {
        sites: sites.map(stat => ({
          ...stat,
          percentage: totalVehicles > 0 ? Math.round((stat.vehicle_count / totalVehicles) * 100) : 0
        })),
        totalVehicles,
        siteBreakdown: sites.map(stat => ({
          site: stat.site,
          siteName: stat.site_name,
          vehicleCount: parseInt(stat.vehicle_count),
          uniqueMakes: parseInt(stat.unique_makes),
          uniqueModels: parseInt(stat.unique_models),
          percentage: totalVehicles > 0 ? Math.round((stat.vehicle_count / totalVehicles) * 100) : 0
        }))
      };
    } catch (error) {
      console.error('Error getting auction site stats:', error);
      return {
        sites: [],
        totalVehicles: 0,
        siteBreakdown: []
      };
    }
  }

  // Start collection for a specific make with manual parameters
  async startMakeCollection(make: string, options?: {
    site?: number;
    yearFrom?: number;
    yearTo?: number;
    daysBack?: number;
    discoverModels?: boolean;
  }) {
    const site = options?.site || 1;
    const yearFrom = options?.yearFrom || 2012;
    const yearTo = options?.yearTo || 2025;
    const daysBack = options?.daysBack || 150;
    const discoverModels = options?.discoverModels !== false;
    
    const siteName = site === 1 ? 'Copart' : 'IAAI';
    console.log(`Starting manual collection for ${make} on ${siteName} (${yearFrom}-${yearTo}, ${daysBack} days back)`);
    
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - daysBack);
      
      let totalCollected = 0;
      
      if (discoverModels) {
        // Discover models by making an initial API call
        const discoveredModels = await this.discoverModelsForMake(make, startDate, endDate);
        
        if (discoveredModels.length === 0) {
          console.log(`No models found for ${make}, attempting base collection`);
          // Try without model specification to discover what's available
          totalCollected += await this.collectDataForMakeModelSite(
            make, '', startDate, endDate, yearFrom, yearTo, site
          );
        } else {
          console.log(`Found ${discoveredModels.length} models for ${make}: ${discoveredModels.slice(0, 5).join(', ')}${discoveredModels.length > 5 ? '...' : ''}`);
          
          // Collect data for each discovered model on the specified site only
          for (const model of discoveredModels) {
            const collected = await this.collectDataForMakeModelSite(
              make, model, startDate, endDate, yearFrom, yearTo, site
            );
            totalCollected += collected;
            
            if (collected > 0) {
              console.log(`${make} ${model} (${siteName}): Collected ${collected} records`);
            }
            
            // Small delay between models
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } else {
        // Direct collection without model discovery
        totalCollected += await this.collectDataForMakeModelSite(
          make, '', startDate, endDate, yearFrom, yearTo, site
        );
      }
      
      console.log(`Manual collection completed for ${make} on ${siteName}: ${totalCollected} total records collected`);
      return totalCollected;
    } catch (error) {
      console.error(`Error in manual collection for ${make}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const dataCollectionService = new DataCollectionService();