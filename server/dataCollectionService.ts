import { db } from './db';
import { salesHistory } from '../shared/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

interface CollectionJob {
  id: string;
  make: string;
  model?: string;
  yearFrom: number;
  yearTo: number;
  priority: number;
  lastCollected?: Date;
}

export class DataCollectionService {
  private isRunning = false;
  private collectionQueue: CollectionJob[] = [];
  private readonly BATCH_SIZE = 50;
  private readonly MAX_PAGES_PER_JOB = 100;
  private readonly COLLECTION_INTERVAL = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.initializeCollectionQueue();
  }

  private initializeCollectionQueue() {
    // High-priority vehicles (popular, high-value, frequently searched)
    const highPriorityVehicles: Omit<CollectionJob, 'id' | 'lastCollected'>[] = [
      // Luxury vehicles
      { make: 'BMW', priority: 1, yearFrom: 2015, yearTo: 2025 },
      { make: 'Mercedes-Benz', priority: 1, yearFrom: 2015, yearTo: 2025 },
      { make: 'Audi', priority: 1, yearFrom: 2015, yearTo: 2025 },
      { make: 'Lexus', priority: 1, yearFrom: 2015, yearTo: 2025 },
      
      // Popular mainstream vehicles
      { make: 'Honda', model: 'Civic', priority: 2, yearFrom: 2012, yearTo: 2025 },
      { make: 'Honda', model: 'Accord', priority: 2, yearFrom: 2012, yearTo: 2025 },
      { make: 'Toyota', model: 'Camry', priority: 2, yearFrom: 2012, yearTo: 2025 },
      { make: 'Toyota', model: 'Corolla', priority: 2, yearFrom: 2012, yearTo: 2025 },
      { make: 'Nissan', model: 'Altima', priority: 2, yearFrom: 2012, yearTo: 2025 },
      
      // SUVs and Trucks
      { make: 'Honda', model: 'CR-V', priority: 2, yearFrom: 2012, yearTo: 2025 },
      { make: 'Toyota', model: 'RAV4', priority: 2, yearFrom: 2012, yearTo: 2025 },
      { make: 'Ford', model: 'F-150', priority: 2, yearFrom: 2015, yearTo: 2025 },
      { make: 'Chevrolet', model: 'Silverado', priority: 2, yearFrom: 2015, yearTo: 2025 },
      
      // Electric vehicles
      { make: 'Tesla', priority: 1, yearFrom: 2012, yearTo: 2025 },
      { make: 'Nissan', model: 'Leaf', priority: 2, yearFrom: 2012, yearTo: 2025 },
      
      // Medium priority - complete make collections
      { make: 'Ford', priority: 3, yearFrom: 2010, yearTo: 2025 },
      { make: 'Chevrolet', priority: 3, yearFrom: 2010, yearTo: 2025 },
      { make: 'Nissan', priority: 3, yearFrom: 2010, yearTo: 2025 },
      { make: 'Hyundai', priority: 3, yearFrom: 2010, yearTo: 2025 },
      { make: 'Kia', priority: 3, yearFrom: 2010, yearTo: 2025 },
    ];

    this.collectionQueue = highPriorityVehicles.map((job, index) => ({
      ...job,
      id: `job_${index}_${job.make}_${job.model || 'all'}`,
    }));

    console.log(`Data collection queue initialized with ${this.collectionQueue.length} jobs`);
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

    console.log(`Processing collection job: ${job.make} ${job.model || 'all models'} (${job.yearFrom}-${job.yearTo})`);

    try {
      const collectedCount = await this.collectDataForJob(job);
      
      // Update last collected time
      job.lastCollected = new Date();
      
      console.log(`Completed job ${job.id}: collected ${collectedCount} records`);
    } catch (error) {
      console.error(`Failed to process job ${job.id}:`, error);
    }
  }

  private async collectDataForJob(job: CollectionJob): Promise<number> {
    let totalCollected = 0;
    let page = 1;
    let hasMoreData = true;

    // Calculate 90-day date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    // Use the existing internal sales history API
    const baseUrl = 'http://localhost:5000/api/sales-history';
    
    while (hasMoreData && page <= this.MAX_PAGES_PER_JOB) {
      try {
        // Build query parameters for internal API
        const params = new URLSearchParams({
          make: job.make,
          year_from: job.yearFrom.toString(),
          year_to: job.yearTo.toString(),
          sale_date_from: startDate.toISOString().split('T')[0],
          sale_date_to: endDate.toISOString().split('T')[0],
          page: page.toString(),
          limit: this.BATCH_SIZE.toString(),
        });

        if (job.model) {
          params.append('model', job.model);
        }

        const response = await fetch(`${baseUrl}?${params.toString()}`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'e-ComAutos Data Collection Service'
          }
        });

        if (!response.ok) {
          console.error(`Internal API request failed with status ${response.status}`);
          // Try to get some fresh data from existing database for this make
          const existingRecords = await this.getExistingRecordsFromDB(job, page);
          if (existingRecords.length > 0) {
            console.log(`Found ${existingRecords.length} existing records for ${job.make} on page ${page}`);
            totalCollected += existingRecords.length;
          }
          break;
        }

        const data = await response.json();
        
        if (!data.success || !data.data) {
          console.log('No more data available from API');
          break;
        }

        // Handle different response structures
        let records = [];
        if (data.data.salesHistory) {
          records = data.data.salesHistory;
        } else if (Array.isArray(data.data)) {
          records = data.data;
        } else {
          console.log('Unexpected data structure:', Object.keys(data.data));
          break;
        }

        if (!records || records.length === 0) {
          hasMoreData = false;
          break;
        }

        console.log(`Page ${page}: found ${records.length} records for ${job.make} ${job.model || ''}`);
        totalCollected += records.length;

        // Check if we have fewer records than requested (indicates last page)
        if (records.length < this.BATCH_SIZE) {
          hasMoreData = false;
        }

        page++;

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        break;
      }
    }

    return totalCollected;
  }

  private async getExistingRecordsFromDB(job: CollectionJob, page: number): Promise<any[]> {
    try {
      const offset = (page - 1) * this.BATCH_SIZE;
      
      // Calculate 90-day date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);

      const conditions = [
        eq(salesHistory.make, job.make),
        gte(salesHistory.year, job.yearFrom),
        lte(salesHistory.year, job.yearTo),
        gte(salesHistory.sale_date, startDate),
        lte(salesHistory.sale_date, endDate)
      ];

      if (job.model) {
        conditions.push(eq(salesHistory.model, job.model));
      }

      const records = await db
        .select()
        .from(salesHistory)
        .where(and(...conditions))
        .orderBy(desc(salesHistory.sale_date))
        .limit(this.BATCH_SIZE)
        .offset(offset);

      return records;
    } catch (error) {
      console.error('Error fetching existing records from DB:', error);
      return [];
    }
  }

  getCollectionStatus() {
    return {
      isRunning: this.isRunning,
      queueLength: this.collectionQueue.length,
      nextJob: this.collectionQueue.find(job => !job.lastCollected) || 
               this.collectionQueue.sort((a, b) => {
                 if (!a.lastCollected && !b.lastCollected) return a.priority - b.priority;
                 if (!a.lastCollected) return -1;
                 if (!b.lastCollected) return 1;
                 return a.lastCollected.getTime() - b.lastCollected.getTime();
               })[0],
      lastProcessed: this.collectionQueue
        .filter(job => job.lastCollected)
        .sort((a, b) => (b.lastCollected?.getTime() || 0) - (a.lastCollected?.getTime() || 0))[0]
    };
  }
}

// Singleton instance
export const dataCollectionService = new DataCollectionService();