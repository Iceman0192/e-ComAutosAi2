import { db } from './db';
import { salesHistory, collectionProgress } from '../shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

interface CollectionJob {
  id: string;
  make: string;
  model?: string;
  yearFrom: number;
  yearTo: number;
  priority: number;
  lastCollected?: Date;
  copartCompleted?: boolean;
  iaaiCompleted?: boolean;
  lastCopartPage?: number;
  lastIaaiPage?: number;
}

export class DataCollectionService {
  private isRunning = false;
  private collectionQueue: CollectionJob[] = [];
  private readonly BATCH_SIZE = 50;
  private readonly MAX_PAGES_PER_JOB = 200; // Limit to 90 days max data
  private readonly COLLECTION_INTERVAL = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.initializeCollectionQueue();
    this.loadCollectionState();
  }

  private async loadCollectionState(): Promise<void> {
    try {
      const existingProgress = await db.select().from(collectionProgress);
      
      for (const progress of existingProgress) {
        const jobIndex = this.collectionQueue.findIndex(job => job.id === progress.jobId);
        if (jobIndex !== -1) {
          this.collectionQueue[jobIndex] = {
            ...this.collectionQueue[jobIndex],
            copartCompleted: progress.copartCompleted,
            iaaiCompleted: progress.iaaiCompleted,
            lastCopartPage: progress.lastCopartPage,
            lastIaaiPage: progress.lastIaaiPage,
            lastCollected: progress.lastCollected ? new Date(progress.lastCollected) : undefined,
          };
        }
      }
      console.log('Collection state loaded from database');
    } catch (error) {
      console.log('No existing collection state found, starting fresh');
    }
  }

  private async saveCollectionState(job: CollectionJob): Promise<void> {
    try {
      await db.insert(collectionProgress).values({
        jobId: job.id,
        make: job.make,
        model: job.model || null,
        yearFrom: job.yearFrom,
        yearTo: job.yearTo,
        priority: job.priority,
        copartCompleted: job.copartCompleted || false,
        iaaiCompleted: job.iaaiCompleted || false,
        lastCopartPage: job.lastCopartPage || 0,
        lastIaaiPage: job.lastIaaiPage || 0,
        lastCollected: job.lastCollected || null,
      }).onConflictDoUpdate({
        target: collectionProgress.jobId,
        set: {
          copartCompleted: job.copartCompleted || false,
          iaaiCompleted: job.iaaiCompleted || false,
          lastCopartPage: job.lastCopartPage || 0,
          lastIaaiPage: job.lastIaaiPage || 0,
          lastCollected: job.lastCollected || null,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to save collection state:', error);
    }
  }

  private initializeCollectionQueue() {
    // Comprehensive make-based collection (all models per make)
    const makeBasedCollection: Omit<CollectionJob, 'id' | 'lastCollected'>[] = [
      // Priority 1: Luxury and Premium brands
      { make: 'BMW', priority: 1, yearFrom: 2012, yearTo: 2025 },
      { make: 'Mercedes-Benz', priority: 1, yearFrom: 2012, yearTo: 2025 },
      { make: 'Audi', priority: 1, yearFrom: 2012, yearTo: 2025 },
      { make: 'Lexus', priority: 1, yearFrom: 2012, yearTo: 2025 },
      { make: 'Tesla', priority: 1, yearFrom: 2012, yearTo: 2025 },
      { make: 'Acura', priority: 1, yearFrom: 2012, yearTo: 2025 },
      { make: 'Infiniti', priority: 1, yearFrom: 2012, yearTo: 2025 },
      { make: 'Cadillac', priority: 1, yearFrom: 2012, yearTo: 2025 },
      { make: 'Lincoln', priority: 1, yearFrom: 2012, yearTo: 2025 },
      { make: 'Genesis', priority: 1, yearFrom: 2015, yearTo: 2025 },
      
      // Priority 2: Major mainstream manufacturers
      { make: 'Toyota', priority: 2, yearFrom: 2012, yearTo: 2025 },
      { make: 'Honda', priority: 2, yearFrom: 2012, yearTo: 2025 },
      { make: 'Ford', priority: 2, yearFrom: 2012, yearTo: 2025 },
      { make: 'Chevrolet', priority: 2, yearFrom: 2012, yearTo: 2025 },
      { make: 'Nissan', priority: 2, yearFrom: 2012, yearTo: 2025 },
      { make: 'Hyundai', priority: 2, yearFrom: 2012, yearTo: 2025 },
      { make: 'Kia', priority: 2, yearFrom: 2012, yearTo: 2025 },
      { make: 'Volkswagen', priority: 2, yearFrom: 2012, yearTo: 2025 },
      { make: 'Subaru', priority: 2, yearFrom: 2012, yearTo: 2025 },
      { make: 'Mazda', priority: 2, yearFrom: 2012, yearTo: 2025 },
      
      // Priority 3: American brands and popular imports
      { make: 'Jeep', priority: 3, yearFrom: 2012, yearTo: 2025 },
      { make: 'Ram', priority: 3, yearFrom: 2012, yearTo: 2025 },
      { make: 'Dodge', priority: 3, yearFrom: 2012, yearTo: 2025 },
      { make: 'Chrysler', priority: 3, yearFrom: 2012, yearTo: 2025 },
      { make: 'GMC', priority: 3, yearFrom: 2012, yearTo: 2025 },
      { make: 'Buick', priority: 3, yearFrom: 2012, yearTo: 2025 },
      { make: 'Volvo', priority: 3, yearFrom: 2012, yearTo: 2025 },
      { make: 'Mitsubishi', priority: 3, yearFrom: 2012, yearTo: 2025 },
      { make: 'Land Rover', priority: 3, yearFrom: 2012, yearTo: 2025 },
      { make: 'Jaguar', priority: 3, yearFrom: 2012, yearTo: 2025 },
      
      // Priority 4: Luxury and exotic brands
      { make: 'Porsche', priority: 4, yearFrom: 2012, yearTo: 2025 },
      { make: 'Ferrari', priority: 4, yearFrom: 2012, yearTo: 2025 },
      { make: 'Lamborghini', priority: 4, yearFrom: 2012, yearTo: 2025 },
      { make: 'Maserati', priority: 4, yearFrom: 2012, yearTo: 2025 },
      { make: 'Bentley', priority: 4, yearFrom: 2012, yearTo: 2025 },
      { make: 'Rolls-Royce', priority: 4, yearFrom: 2012, yearTo: 2025 },
      { make: 'Aston Martin', priority: 4, yearFrom: 2012, yearTo: 2025 },
      { make: 'McLaren', priority: 4, yearFrom: 2014, yearTo: 2025 },
      { make: 'Alfa Romeo', priority: 4, yearFrom: 2014, yearTo: 2025 },
      
      // Priority 5: Additional manufacturers and specialty brands
      { make: 'Mini', priority: 5, yearFrom: 2012, yearTo: 2025 },
      { make: 'Smart', priority: 5, yearFrom: 2012, yearTo: 2025 },
      { make: 'Fiat', priority: 5, yearFrom: 2012, yearTo: 2025 },
      { make: 'Scion', priority: 5, yearFrom: 2012, yearTo: 2016 },
      { make: 'Saab', priority: 5, yearFrom: 2012, yearTo: 2012 },
      { make: 'Suzuki', priority: 5, yearFrom: 2012, yearTo: 2013 },
      { make: 'Isuzu', priority: 5, yearFrom: 2012, yearTo: 2016 },
      { make: 'Hummer', priority: 5, yearFrom: 2012, yearTo: 2012 },
      { make: 'Pontiac', priority: 5, yearFrom: 2012, yearTo: 2012 },
      { make: 'Saturn', priority: 5, yearFrom: 2012, yearTo: 2012 },
      { make: 'Mercury', priority: 5, yearFrom: 2012, yearTo: 2012 },
      
      // Priority 6: Commercial and truck manufacturers
      { make: 'Freightliner', priority: 6, yearFrom: 2012, yearTo: 2025 },
      { make: 'Peterbilt', priority: 6, yearFrom: 2012, yearTo: 2025 },
      { make: 'Kenworth', priority: 6, yearFrom: 2012, yearTo: 2025 },
      { make: 'Mack', priority: 6, yearFrom: 2012, yearTo: 2025 },
      { make: 'International', priority: 6, yearFrom: 2012, yearTo: 2025 },
      { make: 'Western Star', priority: 6, yearFrom: 2012, yearTo: 2025 },
      { make: 'Volvo Trucks', priority: 6, yearFrom: 2012, yearTo: 2025 },
      
      // Priority 7: Electric and emerging brands
      { make: 'Rivian', priority: 7, yearFrom: 2021, yearTo: 2025 },
      { make: 'Lucid', priority: 7, yearFrom: 2021, yearTo: 2025 },
      { make: 'Polestar', priority: 7, yearFrom: 2019, yearTo: 2025 },
      { make: 'Fisker', priority: 7, yearFrom: 2022, yearTo: 2025 },
      { make: 'Canoo', priority: 7, yearFrom: 2023, yearTo: 2025 },
      { make: 'VinFast', priority: 7, yearFrom: 2022, yearTo: 2025 },
      
      // Priority 8: Motorcycles and specialty vehicles
      { make: 'Harley-Davidson', priority: 8, yearFrom: 2012, yearTo: 2025 },
      { make: 'Indian', priority: 8, yearFrom: 2012, yearTo: 2025 },
      { make: 'Can-Am', priority: 8, yearFrom: 2012, yearTo: 2025 },
      { make: 'Polaris', priority: 8, yearFrom: 2012, yearTo: 2025 },
      { make: 'Victory', priority: 8, yearFrom: 2012, yearTo: 2017 },
      
      // Priority 9: RVs and recreational vehicles
      { make: 'Winnebago', priority: 9, yearFrom: 2012, yearTo: 2025 },
      { make: 'Thor', priority: 9, yearFrom: 2012, yearTo: 2025 },
      { make: 'Forest River', priority: 9, yearFrom: 2012, yearTo: 2025 },
      { make: 'Keystone', priority: 9, yearFrom: 2012, yearTo: 2025 },
      { make: 'Jayco', priority: 9, yearFrom: 2012, yearTo: 2025 },
      
      // Priority 10: Other and miscellaneous manufacturers
      { make: 'Other', priority: 10, yearFrom: 2012, yearTo: 2025 },
      { make: 'Unknown', priority: 10, yearFrom: 2012, yearTo: 2025 },
    ];

    this.collectionQueue = makeBasedCollection.map((job, index) => ({
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

    // Calculate 90-day date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    // Collect from both Copart (site=1) and IAAI (site=2) for ALL vehicles
    const sitesToCollect = [1, 2]; // All vehicles get both sites
    
    for (const site of sitesToCollect) {
      console.log(`Collecting ${job.make} data from ${site === 1 ? 'Copart' : 'IAAI'}`);
      
      let page = 1;
      let hasMoreData = true;
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
            site: site.toString(), // Add site parameter
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
            hasMoreData = false;
            break;
          }

          const data = await response.json();
          
          if (!data.success || !data.data) {
            console.log(`No more data available from ${site === 1 ? 'Copart' : 'IAAI'} API for ${job.make}`);
            hasMoreData = false;
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
            hasMoreData = false;
            break;
          }

          if (!records || records.length === 0) {
            console.log(`Page ${page}: No more records for ${job.make} from ${site === 1 ? 'Copart' : 'IAAI'}`);
            hasMoreData = false;
            break;
          }

          console.log(`Page ${page}: found ${records.length} records for ${job.make} ${job.model || ''} from ${site === 1 ? 'Copart' : 'IAAI'}`);
          totalCollected += records.length;

          // Check if we have fewer records than requested (indicates last page)
          if (records.length < 25) { // Using 25 as the API returns 25 per page
            console.log(`Last page reached for ${job.make} from ${site === 1 ? 'Copart' : 'IAAI'} (${records.length} records)`);
            hasMoreData = false;
          }

          page++;

          // Rate limiting - wait between requests
          await new Promise(resolve => setTimeout(resolve, 3000));

        } catch (error) {
          console.error(`Error fetching page ${page}:`, error);
          hasMoreData = false;
          break;
        }
      }
      
      console.log(`Completed ${site === 1 ? 'Copart' : 'IAAI'} collection for ${job.make}: ${totalCollected} total records`);
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

  async getVehicleProgress() {
    try {
      const result = await db.execute(sql`
        SELECT 
          make,
          COUNT(*)::int as "totalRecords",
          COUNT(CASE WHEN site = '1' THEN 1 END)::int as "copartRecords",
          COUNT(CASE WHEN site = '2' THEN 1 END)::int as "iaaiRecords"
        FROM ${salesHistory}
        GROUP BY make
        ORDER BY COUNT(*) DESC
      `);

      return result.rows.map((vehicle: any) => ({
        make: vehicle.make,
        totalRecords: vehicle.totalRecords,
        copartRecords: vehicle.copartRecords,
        iaaiRecords: vehicle.iaaiRecords,
        completed: vehicle.totalRecords > 1000
      }));
    } catch (error) {
      console.error('Error getting vehicle progress:', error);
      return [];
    }
  }

  async startMakeCollection(make: string) {
    // Find jobs for the specific make
    const makeJobs = this.collectionQueue.filter(job => job.make === make);
    
    if (makeJobs.length === 0) {
      throw new Error(`No collection jobs found for make: ${make}`);
    }

    // Start collection for this make
    this.isRunning = true;
    
    // Process the first incomplete job for this make
    const incompleteJob = makeJobs.find(job => 
      !job.copartCompleted || !job.iaaiCompleted
    );

    if (incompleteJob) {
      // Mark the job as being processed
      incompleteJob.lastCollected = new Date();
      await this.saveCollectionState(incompleteJob);
      
      // Start background collection for this make
      this.collectDataForJob(incompleteJob).catch(error => {
        console.error(`Error collecting data for ${make}:`, error);
      });
    }

    return {
      make,
      jobsFound: makeJobs.length,
      started: true
    };
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
        .sort((a, b) => (b.lastCollected?.getTime() || 0) - (a.lastCollected?.getTime() || 0))[0],
      availableJobs: this.collectionQueue
    };
  }
}

// Singleton instance
export const dataCollectionService = new DataCollectionService();