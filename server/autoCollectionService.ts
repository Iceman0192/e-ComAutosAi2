/**
 * Automated Collection Service
 * Continuously collects data across all makes and models to maximize coverage
 */

import { dataCollectionService } from './dataCollectionService';
import { pool } from './db';

interface AutoCollectionJob {
  id: string;
  make: string;
  model: string;
  site: number;
  priority: number;
  lastCollected?: Date;
  recordsCollected: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export class AutoCollectionService {
  private isRunning = false;
  private jobQueue: AutoCollectionJob[] = [];
  private activeJobs: Set<string> = new Set();
  private statsCache = {
    totalRecords: 0,
    recordsToday: 0,
    lastUpdate: Date.now()
  };

  private readonly MAX_CONCURRENT_JOBS = 3;
  private readonly JOB_INTERVAL = 30000; // 30 seconds between job starts
  private readonly PRIORITY_MAKES = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 
    'Hyundai', 'Kia', 'Jeep', 'Dodge', 'BMW'
  ];

  constructor() {
    this.initializeJobs();
  }

  /**
   * Initialize the job queue with comprehensive make/model/site combinations
   */
  private async initializeJobs() {
    try {
      // Get popular models for each make from existing data
      const query = `
        SELECT DISTINCT make, model, site, COUNT(*) as record_count
        FROM sales_history 
        WHERE make IS NOT NULL 
        AND model IS NOT NULL 
        AND model != 'Unknown'
        GROUP BY make, model, site
        ORDER BY record_count DESC
        LIMIT 500
      `;
      
      const result = await pool.query(query);
      const existingCombinations = new Set();
      
      // Add jobs for existing combinations
      result.rows.forEach((row: any, index: number) => {
        const jobId = `${row.make}-${row.model}-${row.site}`;
        if (!existingCombinations.has(jobId)) {
          existingCombinations.add(jobId);
          
          this.jobQueue.push({
            id: jobId,
            make: row.make,
            model: row.model,
            site: row.site,
            priority: this.PRIORITY_MAKES.includes(row.make) ? 1 : 2,
            recordsCollected: row.record_count,
            status: 'pending'
          });
        }
      });

      // Add jobs for priority makes without models (to discover new models)
      this.PRIORITY_MAKES.forEach(make => {
        [1, 2].forEach(site => { // Both Copart and IAAI
          const jobId = `${make}-all-${site}`;
          if (!existingCombinations.has(jobId)) {
            this.jobQueue.push({
              id: jobId,
              make: make,
              model: '', // Empty model means discover all models
              site: site,
              priority: 1,
              recordsCollected: 0,
              status: 'pending'
            });
          }
        });
      });

      // Sort by priority and existing record count
      this.jobQueue.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return (b.recordsCollected || 0) - (a.recordsCollected || 0);
      });

      console.log(`Auto-collection initialized with ${this.jobQueue.length} jobs`);
    } catch (error) {
      console.error('Error initializing auto-collection jobs:', error);
    }
  }

  /**
   * Start the automated collection system
   */
  async start() {
    if (this.isRunning) {
      return { success: false, message: 'Auto-collection is already running' };
    }

    this.isRunning = true;
    console.log('Starting automated collection system...');
    
    // Start the job processor
    this.processJobs();
    
    return { 
      success: true, 
      message: `Auto-collection started with ${this.jobQueue.length} jobs queued` 
    };
  }

  /**
   * Stop the automated collection system
   */
  async stop() {
    if (!this.isRunning) {
      return { success: false, message: 'Auto-collection is not running' };
    }

    this.isRunning = false;
    console.log('Stopping automated collection system...');
    
    return { 
      success: true, 
      message: 'Auto-collection stopped' 
    };
  }

  /**
   * Process jobs from the queue
   */
  private async processJobs() {
    while (this.isRunning) {
      try {
        // Check if we can start new jobs
        if (this.activeJobs.size < this.MAX_CONCURRENT_JOBS) {
          const nextJob = this.getNextJob();
          
          if (nextJob) {
            this.startJob(nextJob);
          }
        }

        // Update stats periodically
        if (Date.now() - this.statsCache.lastUpdate > 60000) { // Every minute
          await this.updateStats();
        }

        // Wait before checking for next job
        await new Promise(resolve => setTimeout(resolve, this.JOB_INTERVAL));
        
      } catch (error) {
        console.error('Error in job processor:', error);
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute on error
      }
    }
  }

  /**
   * Get the next highest priority job
   */
  private getNextJob(): AutoCollectionJob | null {
    const availableJobs = this.jobQueue.filter(job => 
      job.status === 'pending' && !this.activeJobs.has(job.id)
    );

    if (availableJobs.length === 0) {
      // Reset completed jobs back to pending if queue is empty
      this.jobQueue.forEach(job => {
        if (job.status === 'completed') {
          job.status = 'pending';
        }
      });
      return this.jobQueue.find(job => job.status === 'pending') || null;
    }

    return availableJobs[0];
  }

  /**
   * Start processing a specific job
   */
  private async startJob(job: AutoCollectionJob) {
    this.activeJobs.add(job.id);
    job.status = 'running';
    
    console.log(`Starting auto-collection job: ${job.make} ${job.model || 'all models'} on site ${job.site}`);

    try {
      const options = {
        site: job.site,
        yearFrom: 2012,
        yearTo: 2025,
        daysBack: 150,
        specificModel: job.model || undefined,
        discoverModels: !job.model // Discover models if no specific model
      };

      await dataCollectionService.startMakeCollection(job.make, options);
      
      job.status = 'completed';
      job.lastCollected = new Date();
      
      console.log(`Completed auto-collection job: ${job.id}`);
      
    } catch (error) {
      console.error(`Failed auto-collection job ${job.id}:`, error);
      job.status = 'failed';
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  /**
   * Update statistics cache
   */
  private async updateStats() {
    try {
      // Get total records
      const totalQuery = 'SELECT COUNT(*) as total FROM sales_history';
      const totalResult = await pool.query(totalQuery);
      this.statsCache.totalRecords = parseInt(totalResult.rows[0].total);

      // Get today's records
      const todayQuery = `
        SELECT COUNT(*) as today 
        FROM sales_history 
        WHERE created_at >= CURRENT_DATE
      `;
      const todayResult = await pool.query(todayQuery);
      this.statsCache.recordsToday = parseInt(todayResult.rows[0].today);

      this.statsCache.lastUpdate = Date.now();
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    const pendingJobs = this.jobQueue.filter(job => job.status === 'pending').length;
    const completedJobs = this.jobQueue.filter(job => job.status === 'completed').length;
    const totalJobs = this.jobQueue.length;
    
    const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
    
    // Calculate estimated completion
    const avgJobTime = 60; // seconds per job (estimate)
    const remainingJobs = pendingJobs + this.activeJobs.size;
    const estimatedSeconds = remainingJobs * avgJobTime / this.MAX_CONCURRENT_JOBS;
    const estimatedCompletion = new Date(Date.now() + estimatedSeconds * 1000);

    return {
      isRunning: this.isRunning,
      totalRecords: this.statsCache.totalRecords,
      recordsToday: this.statsCache.recordsToday,
      activeJobs: this.activeJobs.size,
      pendingJobs: pendingJobs,
      completedJobs: completedJobs,
      totalJobs: totalJobs,
      completionRate: completionRate,
      avgRecordsPerHour: Math.round(this.statsCache.recordsToday * (24 / (new Date().getHours() || 1))),
      estimatedCompletion: this.isRunning ? estimatedCompletion.toLocaleString() : 'N/A'
    };
  }

  /**
   * Get job queue status
   */
  getJobs() {
    return this.jobQueue.slice(0, 50); // Return first 50 jobs for display
  }
}

export const autoCollectionService = new AutoCollectionService();