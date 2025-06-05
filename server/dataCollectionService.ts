import { db } from './db';
import { salesHistory } from '../shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

interface CollectionJob {
  id: string;
  make: string;
  model?: string;
  yearFrom: number;
  yearTo: number;
  priority: number;
  lastCollected?: Date;
}

interface ApiResponse {
  success: boolean;
  data?: {
    salesHistory: any[];
    totalCount: number;
  };
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

    // Calculate date range for recent data (last 90 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const params = new URLSearchParams({
      make: job.make,
      year_from: job.yearFrom.toString(),
      year_to: job.yearTo.toString(),
      sale_date_from: startDate.toISOString().split('T')[0],
      sale_date_to: endDate.toISOString().split('T')[0],
      site: '1', // Start with Copart
      size: this.BATCH_SIZE.toString(),
    });

    if (job.model) {
      params.append('model', job.model);
    }

    while (hasMoreData && page <= this.MAX_PAGES_PER_JOB) {
      params.set('page', page.toString());
      
      try {
        const response = await fetch(`https://api.apicar.store/api/history-cars?${params.toString()}`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'e-ComAutos Data Collection Service'
          }
        });

        if (!response.ok) {
          console.error(`API request failed with status ${response.status}`);
          break;
        }

        const data: ApiResponse = await response.json();
        
        if (!data.success || !data.data?.salesHistory) {
          console.log('No more data available');
          break;
        }

        const records = data.data.salesHistory;
        if (records.length === 0) {
          hasMoreData = false;
          break;
        }

        // Store records in database
        const storedCount = await this.storeRecords(records);
        totalCollected += storedCount;

        console.log(`Page ${page}: stored ${storedCount}/${records.length} new records`);

        // Check if we have fewer records than requested (indicates last page)
        if (records.length < this.BATCH_SIZE) {
          hasMoreData = false;
        }

        page++;

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        break;
      }
    }

    // Also collect from IAAI (site 2) for high-priority jobs
    if (job.priority <= 2) {
      params.set('site', '2');
      page = 1;
      hasMoreData = true;

      while (hasMoreData && page <= Math.min(this.MAX_PAGES_PER_JOB, 20)) {
        params.set('page', page.toString());
        
        try {
          const response = await fetch(`https://api.apicar.store/api/history-cars?${params.toString()}`, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'e-ComAutos Data Collection Service'
            }
          });

          if (!response.ok) break;

          const data: ApiResponse = await response.json();
          
          if (!data.success || !data.data?.salesHistory) break;

          const records = data.data.salesHistory;
          if (records.length === 0) break;

          const storedCount = await this.storeRecords(records);
          totalCollected += storedCount;

          console.log(`IAAI Page ${page}: stored ${storedCount}/${records.length} new records`);

          if (records.length < this.BATCH_SIZE) hasMoreData = false;

          page++;
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`Error fetching IAAI page ${page}:`, error);
          break;
        }
      }
    }

    return totalCollected;
  }

  private async storeRecords(records: any[]): Promise<number> {
    let storedCount = 0;

    for (const record of records) {
      try {
        // Check if record already exists
        const existing = await db.select({ id: salesHistory.id })
          .from(salesHistory)
          .where(eq(salesHistory.lot_id, record.lot_id))
          .limit(1);

        if (existing.length > 0) {
          continue; // Skip duplicate
        }

        // Insert new record using the existing schema structure
        await db.insert(salesHistory).values({
          id: `${record.lot_id}-${record.site}`,
          lot_id: record.lot_id,
          site: record.site,
          base_site: record.base_site || 'unknown',
          vin: record.vin || '',
          sale_status: record.status || 'unknown',
          sale_date: record.sale_date ? new Date(record.sale_date) : new Date(),
          purchase_price: record.cost_priced ? record.cost_priced.toString() : null,
          buyer_state: null,
          buyer_country: record.country || null,
          buyer_type: null,
          auction_location: record.location || null,
          vehicle_mileage: record.odometer || null,
          vehicle_damage: record.damage_pr || null,
          vehicle_title: record.title || null,
          vehicle_has_keys: record.keys === 'Yes' ? true : record.keys === 'No' ? false : null,
          year: record.year || null,
          make: record.make || null,
          model: record.model || null,
          series: record.series || null,
          trim: null,
          transmission: record.transmission || null,
          drive: record.drive || null,
          fuel: record.fuel || null,
          engine: record.engine || null,
          color: record.color || null,
          images: record.images ? JSON.stringify(record.images) : null,
          link: null
        });

        storedCount++;
      } catch (error) {
        console.error('Error storing record:', error);
        // Continue with next record
      }
    }

    return storedCount;
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