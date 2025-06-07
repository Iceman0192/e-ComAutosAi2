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
  private readonly COLLECTION_INTERVAL = 30 * 60 * 1000; // 30 minutes
  private readonly DAYS_WINDOW = 90; // 90 day rolling window

  constructor() {
    this.initializeCollectionQueue();
  }

  private initializeCollectionQueue() {
    // Simple make-only collection - discover models dynamically from 90-day windows
    const makesToCollect = [
      // Priority 1: High-value luxury brands
      { make: 'BMW', priority: 1 },
      { make: 'Mercedes-Benz', priority: 1 },
      { make: 'Audi', priority: 1 },
      { make: 'Tesla', priority: 1 },
      { make: 'Porsche', priority: 1 },
      
      // Priority 2: Popular mainstream brands
      { make: 'Toyota', priority: 2 },
      { make: 'Honda', priority: 2 },
      { make: 'Ford', priority: 2 },
      { make: 'Chevrolet', priority: 2 },
      { make: 'Nissan', priority: 2 },
      { make: 'Hyundai', priority: 2 },
      { make: 'Kia', priority: 2 },
      
      // Priority 3: Other major brands
      { make: 'Lexus', priority: 3 },
      { make: 'Jeep', priority: 3 },
      { make: 'Dodge', priority: 3 },
      { make: 'Mazda', priority: 3 },
      { make: 'Volkswagen', priority: 3 },
      { make: 'Subaru', priority: 3 },
      { make: 'Mitsubishi', priority: 3 },
      { make: 'Infiniti', priority: 3 },
    ];

    this.collectionQueue = makesToCollect.map((makeConfig, index) => ({
      id: `make_${index}_${makeConfig.make}`,
      make: makeConfig.make,
      priority: makeConfig.priority,
      modelsDiscovered: [],
      lastModelIndex: -1,
    }));

    console.log(`Data collection queue initialized with ${this.collectionQueue.length} makes`);
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
            gte(salesHistory.saleDate, startDate.toISOString().split('T')[0]),
            lte(salesHistory.saleDate, endDate.toISOString().split('T')[0])
          )
        )
        .limit(100); // Limit to top 100 models

      const models = existingModels
        .map(row => row.model)
        .filter(model => model && model.trim() !== '' && model !== 'Unknown')
        .slice(0, 50); // Limit to 50 models per make

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
    const maxPages = 50; // Reasonable limit per model
    
    const baseUrl = 'http://localhost:5000/api/sales-history';
    
    while (hasMoreData && page <= maxPages) {
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