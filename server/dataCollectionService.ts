import { db } from './db';
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
  private readonly BATCH_SIZE = 50;
  private readonly COLLECTION_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly DAYS_WINDOW = 180; // 180 day rolling window (6 months max)

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

    console.log(`Processing collection job: ${job.make} (90-day window)`);

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

    // Calculate 90-day date range from present day
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - this.DAYS_WINDOW);

    console.log(`Collecting ${job.make} data from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    // First, discover all available models for this make in the 90-day window
    const discoveredModels = await this.discoverModelsForMake(job.make, startDate, endDate);
    
    if (discoveredModels.length === 0) {
      console.log(`No models found for ${job.make} in 90-day window`);
      return 0;
    }

    job.modelsDiscovered = discoveredModels;
    console.log(`Discovered ${discoveredModels.length} models for ${job.make}: ${discoveredModels.slice(0, 5).join(', ')}${discoveredModels.length > 5 ? '...' : ''}`);

    // Collect data for each discovered model from both Copart and IAAI
    const sitesToCollect = [1, 2]; // Copart and IAAI
    
    for (const site of sitesToCollect) {
      const siteName = site === 1 ? 'Copart' : 'IAAI';
      
      for (const model of discoveredModels) {
        try {
          const modelCount = await this.collectDataForMakeModel(job.make, model, startDate, endDate, site);
          totalCollected += modelCount;
          
          if (modelCount > 0) {
            console.log(`Collected ${modelCount} records for ${job.make} ${model} from ${siteName}`);
          }
        } catch (error) {
          console.error(`Failed to collect ${job.make} ${model} from ${siteName}:`, error);
        }
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

  private async collectDataForMakeModel(
    make: string, 
    model: string, 
    startDate: Date, 
    endDate: Date, 
    site: number
  ): Promise<number> {
    let totalCollected = 0;
    let page = 1;
    let hasMoreData = true;
    // No artificial page limit - collect ALL data within 90-180 day window
    
    const baseUrl = 'http://localhost:5000/api/sales-history';
    
    while (hasMoreData) {
      try {
        const params = new URLSearchParams({
          make: make,
          model: model,
          sale_date_from: startDate.toISOString().split('T')[0],
          sale_date_to: endDate.toISOString().split('T')[0],
          page: page.toString(),
          limit: this.BATCH_SIZE.toString(),
          site: site.toString(),
        });

        const response = await fetch(`${baseUrl}?${params.toString()}`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'eComAutos Data Collection Service'
          }
        });

        if (!response.ok) {
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

        // Small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error collecting page ${page} for ${make} ${model}:`, error);
        hasMoreData = false;
      }
    }

    return totalCollected;
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
}

// Export singleton instance
export const dataCollectionService = new DataCollectionService();