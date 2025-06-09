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
      { make: 'Mazda', priority: 4 },
      { make: 'Volkswagen', priority: 4 },
      { make: 'Subaru', priority: 4 },
      { make: 'Mitsubishi', priority: 4 },
    ];

    this.collectionQueue = makesToCollect.map((makeConfig, index) => ({
      id: `make_${index}_${makeConfig.make}`,
      make: makeConfig.make,
      priority: makeConfig.priority,
      modelsDiscovered: [],
      lastModelIndex: -1,
    }));

    console.log(`Data collection queue initialized with ${this.collectionQueue.length} makes`);
    console.log('Collection priorities:');
    console.log('Priority 1 (Data Gap Fill):', makesToCollect.filter(m => m.priority === 1).map(m => m.make).join(', '));
    console.log('Priority 2 (High Volume):', makesToCollect.filter(m => m.priority === 2).map(m => m.make).join(', '));
    console.log('Priority 3 (Well Covered):', makesToCollect.filter(m => m.priority === 3).map(m => m.make).join(', '));
    console.log('Note: Auto-collection disabled - use manual controls only');
  }

  async startAutomatedCollection() {
    if (this.isRunning) {
      console.log('Data collection already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting automated data collection service');
    
    // Start the collection loop
    this.runCollectionLoop();
  }

  stopAutomatedCollection() {
    this.isRunning = false;
    console.log('Automated data collection stopped');
  }

  private async runCollectionLoop() {
    while (this.isRunning) {
      try {
        await this.processNextJob();
        
        // Wait before next collection
        await new Promise(resolve => setTimeout(resolve, this.COLLECTION_INTERVAL));
      } catch (error) {
        console.error('Error in collection loop:', error);
        // Wait longer on error before retrying
        await new Promise(resolve => setTimeout(resolve, this.COLLECTION_INTERVAL * 2));
      }
    }
  }

  private async processNextJob() {
    // Sort queue by priority and last collected time
    const sortedQueue = this.collectionQueue.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (!a.lastCollected && !b.lastCollected) return 0;
      if (!a.lastCollected) return -1;
      if (!b.lastCollected) return 1;
      return a.lastCollected.getTime() - b.lastCollected.getTime();
    });

    const job = sortedQueue[0];
    if (!job) return;

    console.log(`Processing collection job: ${job.make} (150-day window)`);

    try {
      const collectedCount = await this.collectDataForMake(job);
      
      // Update last collected time
      job.lastCollected = new Date();
      
      console.log(`Completed job ${job.id}: collected ${collectedCount} records`);
    } catch (error) {
      console.error(`Failed to process job ${job.id}:`, error);
    }
  }

  private async collectDataForMake(job: CollectionJob): Promise<number> {
    let totalCollected = 0;

    // Calculate 150 days back from present day
    const endDate = new Date(); // Today
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - this.DAYS_WINDOW); // Go back 150 days from today

    console.log(`Collecting ${job.make} data from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    // First, discover all available models for this make in the 150-day window
    const discoveredModels = await this.discoverModelsForMake(job.make, startDate, endDate);
    
    if (discoveredModels.length === 0) {
      console.log(`No models found for ${job.make} in 150-day window`);
      return 0;
    }

    job.modelsDiscovered = discoveredModels;
    console.log(`Discovered ${discoveredModels.length} models for ${job.make}: ${discoveredModels.slice(0, 5).join(', ')}${discoveredModels.length > 5 ? '...' : ''}`);

    // Process models in batches with concurrent collection for efficiency
    const concurrencyLimit = 3; // Process 3 model-site combinations concurrently
    const tasks = [];
    
    // Create all collection tasks
    for (const model of discoveredModels) {
      for (const site of [1, 2]) { // Copart and IAAI
        tasks.push({
          make: job.make,
          model,
          site,
          siteName: site === 1 ? 'Copart' : 'IAAI',
          startDate,
          endDate
        });
      }
    }
    
    // Process tasks in concurrent batches
    for (let i = 0; i < tasks.length; i += concurrencyLimit) {
      const batch = tasks.slice(i, i + concurrencyLimit);
      
      const batchPromises = batch.map(async (task, index) => {
        // Stagger the start of each concurrent request by 1 second
        await new Promise(resolve => setTimeout(resolve, index * 1000));
        
        try {
          // Check if we already have data for this specific combination
          const existingCount = await this.checkExistingData(task.make, task.model, task.site, task.startDate, task.endDate);
          
          if (existingCount > 0) {
            console.log(`${task.make} ${task.model}: Found ${existingCount} existing records from ${task.siteName}, skipping`);
            return 0; // Return 0 for new collections since we already have this data
          }
          
          console.log(`Collecting ${task.make} ${task.model} data from ${task.siteName}...`);
          
          // Use existing sales history API endpoint (cache-first, then API)
          const count = await this.collectDataUsingExistingAPI(
            task.make, 
            task.model, 
            task.startDate, 
            task.endDate, 
            2012, 
            2025, 
            task.site
          );
          
          if (count > 0) {
            console.log(`${task.make} ${task.model}: Collected ${count} new records from ${task.siteName}`);
          }
          
          return count;
        } catch (error) {
          console.error(`Failed to collect ${task.make} ${task.model} from ${task.siteName}:`, error);
          return 0;
        }
      });
      
      // Wait for current batch to complete
      const batchResults = await Promise.all(batchPromises);
      totalCollected += batchResults.reduce((sum: number, count: number) => sum + count, 0);
      
      // Add delay between batches to respect rate limits
      if (i + concurrencyLimit < tasks.length) {
        console.log(`Completed batch ${Math.floor(i / concurrencyLimit) + 1}, waiting before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return totalCollected;
  }

  private async discoverModelsForMake(make: string, startDate: Date, endDate: Date): Promise<string[]> {
    try {
      // Use our internal API to discover models by checking what's available
      const baseUrl = 'http://localhost:5000/api/sales-history';
      const params = new URLSearchParams({
        make: make,
        sale_date_from: startDate.toISOString().split('T')[0],
        sale_date_to: endDate.toISOString().split('T')[0],
        limit: '1', // We just want to see if data exists
      });

      // Try to get a sample to see available models
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'eComAutos Data Collection Service'
        }
      });

      if (!response.ok) {
        console.log(`Failed to discover models for ${make}: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      // Extract unique models from existing database records for this make in the time window
      const existingModels = await db
        .selectDistinct({ model: salesHistory.model })
        .from(salesHistory)
        .where(
          and(
            eq(salesHistory.make, make),
            gte(salesHistory.sale_date, startDate),
            lte(salesHistory.sale_date, endDate)
          )
        )
        .limit(200); // Get comprehensive model list

      const models = existingModels
        .map(row => row.model)
        .filter((model): model is string => model !== null && model.trim() !== '' && model !== 'Unknown')
        .slice(0, 100); // Get more comprehensive model coverage

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
    yearFrom: number = 2012,
    yearTo: number = 2025,
    site: number = 1
  ): Promise<number> {
    return this.collectDataUsingExistingAPI(make, model, startDate, endDate, yearFrom, yearTo, site);
  }

  private async collectDataUsingExistingAPI(
    make: string, 
    model: string, 
    startDate: Date, 
    endDate: Date, 
    yearFrom: number = 2012,
    yearTo: number = 2025,
    site: number = 1
  ): Promise<number> {
    let totalCollected = 0;
    let page = 1;
    let hasMoreData = true;
    
    // Use the existing sales history endpoint which handles cache + database automatically
    const baseUrl = 'http://localhost:5000/api/sales-history';
    
    while (hasMoreData && page <= 10) { // Max 10 pages per model to avoid rate limits
      try {
        const params = new URLSearchParams({
          make: make,
          model: model,
          sale_date_from: startDate.toISOString().split('T')[0],
          sale_date_to: endDate.toISOString().split('T')[0],
          year_from: yearFrom.toString(),
          year_to: yearTo.toString(),
          site: site.toString(),
          page: page.toString(),
          limit: this.BATCH_SIZE.toString()
        });

        const response = await fetch(`${baseUrl}?${params.toString()}`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'eComAutos Data Collection Service'
          }
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.log(`Rate limited for ${make} ${model}, waiting...`);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds on rate limit
            continue;
          }
          hasMoreData = false;
          break;
        }

        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
          hasMoreData = false;
          break;
        }

        totalCollected += data.data.length;
        page++;

        // 2-3 second delay between requests to respect rate limits
        const delay = 2000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (error) {
        console.error(`Error collecting page ${page} for ${make} ${model}:`, error);
        hasMoreData = false;
      }
    }

    return totalCollected;
  }

  private async checkExistingData(
    make: string, 
    model: string, 
    site: number, 
    startDate: Date, 
    endDate: Date
  ): Promise<number> {
    try {
      const { salesHistory } = await import('../shared/schema');
      const { db } = await import('./db');
      const { eq, and, gte, lte, count } = await import('drizzle-orm');

      const result = await db
        .select({ count: count() })
        .from(salesHistory)
        .where(
          and(
            eq(salesHistory.make, make),
            eq(salesHistory.model, model),
            eq(salesHistory.site, site),
            gte(salesHistory.sale_date, startDate),
            lte(salesHistory.sale_date, endDate)
          )
        );

      return result[0]?.count || 0;
    } catch (error) {
      console.error(`Error checking existing data for ${make} ${model}:`, error);
      return 0;
    }
  }

  // Public methods for status and control
  getCollectionStatus() {
    return {
      isRunning: this.isRunning,
      totalJobs: this.collectionQueue.length,
      completedJobs: this.collectionQueue.filter(job => job.lastCollected).length,
      lastCollectionTimes: this.collectionQueue
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

  // Start collection for a specific make with manual parameters
  async startMakeCollection(make: string, options?: {
    yearFrom?: number;
    yearTo?: number;
    daysBack?: number;
  }) {
    const yearFrom = options?.yearFrom || 2012;
    const yearTo = options?.yearTo || 2025;
    const daysBack = options?.daysBack || 150;
    
    console.log(`Starting manual collection for ${make} (${yearFrom}-${yearTo}, ${daysBack} days back)`);
    
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - daysBack);
      
      let totalCollected = 0;
      
      // Get all models for this make from existing data
      const existingModels = await db
        .selectDistinct({ model: salesHistory.model })
        .from(salesHistory)
        .where(
          and(
            eq(salesHistory.make, make),
            gte(salesHistory.year, yearFrom),
            lte(salesHistory.year, yearTo)
          )
        )
        .limit(100);

      const models = existingModels
        .map(row => row.model)
        .filter((model): model is string => model !== null && model.trim() !== '' && model !== 'Unknown');

      console.log(`Found ${models.length} models for ${make}: ${models.slice(0, 5).join(', ')}${models.length > 5 ? '...' : ''}`);

      // If no models found, try a general search to discover models
      if (models.length === 0) {
        console.log(`No existing models found for ${make}, attempting discovery...`);
        const discoveredModels = await this.discoverModelsForMake(make, startDate, endDate);
        models.push(...discoveredModels.slice(0, 20)); // Limit to 20 models for discovery
      }

      // Collect data for each model from both Copart and IAAI
      for (const model of models.slice(0, 50)) { // Limit to 50 models max
        try {
          console.log(`Collecting ${make} ${model} data from both Copart and IAAI...`);
          
          // Collect from Copart (site 1)
          const copartCollected = await this.collectDataForMakeModelSite(
            make, 
            model, 
            startDate, 
            endDate,
            yearFrom,
            yearTo,
            1 // Copart
          );
          
          // Small delay between sites
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Collect from IAAI (site 2)
          const iaaiCollected = await this.collectDataForMakeModelSite(
            make, 
            model, 
            startDate, 
            endDate,
            yearFrom,
            yearTo,
            2 // IAAI
          );
          
          totalCollected += copartCollected + iaaiCollected;
          console.log(`${make} ${model}: ${copartCollected} Copart + ${iaaiCollected} IAAI = ${copartCollected + iaaiCollected} total`);
          
          // 5-second delay between model collections as per user request
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
          console.error(`Error collecting ${make} ${model}:`, error);
        }
      }

      // Update or create job record
      const existingJob = this.collectionQueue.find(job => job.make.toLowerCase() === make.toLowerCase());
      if (existingJob) {
        existingJob.lastCollected = new Date();
        existingJob.modelsDiscovered = models;
      } else {
        const newJob: CollectionJob = {
          id: `${make.toLowerCase()}-${Date.now()}`,
          make: make,
          priority: 1,
          lastCollected: new Date(),
          modelsDiscovered: models,
          lastModelIndex: 0
        };
        this.collectionQueue.push(newJob);
      }

      console.log(`Manual collection completed for ${make}: ${totalCollected} records collected`);
      return { 
        message: `Completed collection for ${make}`, 
        modelsProcessed: models.length,
        recordsCollected: totalCollected,
        timeframe: `${daysBack} days (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`,
        yearRange: `${yearFrom}-${yearTo}`
      };
    } catch (error) {
      console.error(`Error in manual collection for ${make}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const dataCollectionService = new DataCollectionService();