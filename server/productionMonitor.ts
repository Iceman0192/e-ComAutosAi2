import { pool } from './db';

interface PerformanceMetrics {
  totalQueries: number;
  avgQueryTime: number;
  slowQueries: number;
  errorCount: number;
  activeConnections: number;
  uptime: number;
}

class ProductionMonitor {
  private queryTimes: number[] = [];
  private errorCount = 0;
  private startTime = Date.now();
  private maxQueryHistory = 1000;

  logQuery(queryTime: number, wasError: boolean = false) {
    this.queryTimes.push(queryTime);
    if (this.queryTimes.length > this.maxQueryHistory) {
      this.queryTimes.shift();
    }
    
    if (wasError) {
      this.errorCount++;
    }

    // Log slow queries (>1000ms)
    if (queryTime > 1000) {
      console.warn(`Slow query detected: ${queryTime}ms`);
    }
  }

  async getMetrics(): Promise<PerformanceMetrics> {
    const totalQueries = this.queryTimes.length;
    const avgQueryTime = totalQueries > 0 
      ? this.queryTimes.reduce((a, b) => a + b, 0) / totalQueries 
      : 0;
    const slowQueries = this.queryTimes.filter(time => time > 1000).length;

    // Get database connection info
    let activeConnections = 0;
    try {
      const result = await pool.query('SELECT count(*) as count FROM pg_stat_activity');
      activeConnections = parseInt(result.rows[0]?.count || '0');
    } catch (error) {
      console.error('Failed to get connection count:', error);
    }

    return {
      totalQueries,
      avgQueryTime: Math.round(avgQueryTime),
      slowQueries,
      errorCount: this.errorCount,
      activeConnections,
      uptime: Date.now() - this.startTime
    };
  }

  async checkDatabaseHealth(): Promise<{ healthy: boolean; message: string }> {
    try {
      const start = Date.now();
      await pool.query('SELECT 1');
      const queryTime = Date.now() - start;
      
      if (queryTime > 5000) {
        return { healthy: false, message: 'Database response time too slow' };
      }
      
      return { healthy: true, message: 'Database healthy' };
    } catch (error) {
      return { healthy: false, message: `Database error: ${error}` };
    }
  }

  // Memory usage monitoring
  getMemoryUsage() {
    const used = process.memoryUsage();
    return {
      rss: Math.round(used.rss / 1024 / 1024), // MB
      heapTotal: Math.round(used.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(used.heapUsed / 1024 / 1024), // MB
      external: Math.round(used.external / 1024 / 1024), // MB
    };
  }

  // CPU usage approximation
  getCpuUsage() {
    const usage = process.cpuUsage();
    return {
      user: usage.user / 1000000, // Convert to seconds
      system: usage.system / 1000000 // Convert to seconds
    };
  }
}

export const productionMonitor = new ProductionMonitor();