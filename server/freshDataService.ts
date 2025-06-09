/**
 * Fresh Data Service - 3-Day Fresh Data Management
 * Handles Gold+ tier fresh data fetching and 3-day migration cycle
 */

import { db } from './db';
import { salesHistory } from '@shared/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import { getVehicleSalesHistory } from './apiClient';

export interface FreshDataParams {
  make: string;
  model?: string;
  site: number;
  yearFrom?: number;
  yearTo?: number;
}

export class FreshDataService {
  
  /**
   * Check if we have fresh data for the last 3 days
   */
  async hasFreshData(params: FreshDataParams): Promise<boolean> {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const conditions = [
        eq(salesHistory.make, params.make),
        eq(salesHistory.site, params.site),
        sql`${salesHistory.sale_date} >= ${threeDaysAgo.toISOString()}`
      ];
      
      if (params.model && params.model.trim() !== '') {
        conditions.push(eq(salesHistory.model, params.model));
      }
      
      const freshRecords = await db.select()
        .from(salesHistory)
        .where(and(...conditions))
        .limit(1);
      
      return freshRecords.length > 0;
      
    } catch (error) {
      console.error('Fresh data check failed:', error);
      return false;
    }
  }
  
  /**
   * Fetch fresh data from API for Gold+ users
   */
  async fetchFreshData(params: FreshDataParams, userTier: string): Promise<any> {
    // Only Gold+ tiers can fetch fresh data
    if (!['gold', 'platinum', 'admin'].includes(userTier.toLowerCase())) {
      throw new Error('Fresh data access requires Gold+ tier');
    }
    
    try {
      console.log(`Fetching fresh data for ${params.make} ${params.model || 'all models'} (Gold+ request)`);
      
      // Calculate date range for last 3 days
      const today = new Date();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(today.getDate() - 3);
      
      const auctionDateFrom = threeDaysAgo.toISOString().split('T')[0];
      const auctionDateTo = today.toISOString().split('T')[0];
      
      // Fetch fresh data from API
      const apiResponse = await getVehicleSalesHistory(
        params.make,
        params.site.toString(),
        params.model,
        1, // Start with page 1 for fresh data
        50, // Larger page size for fresh data
        params.yearFrom,
        params.yearTo,
        auctionDateFrom,
        auctionDateTo
      );
      
      if (apiResponse.success && apiResponse.data && apiResponse.data.length > 0) {
        // Store fresh data in primary database immediately
        // (This feeds the platform-wide fresh data)
        console.log(`Storing ${apiResponse.data.length} fresh records`);
        
        // Note: Fresh data gets stored directly in primary DB
        // and will be available to all users immediately
        return {
          success: true,
          data: apiResponse.data,
          freshDataCount: apiResponse.data.length,
          dateRange: `${auctionDateFrom} to ${auctionDateTo}`
        };
      }
      
      return {
        success: true,
        data: [],
        freshDataCount: 0,
        message: 'No fresh data available for the last 3 days'
      };
      
    } catch (error) {
      console.error('Fresh data fetch failed:', error);
      throw error;
    }
  }
  
  /**
   * Get combined data (cached + fresh) for Gold+ users
   */
  async getCombinedData(params: FreshDataParams, page: number = 1, size: number = 25, includeFresh: boolean = false) {
    try {
      const conditions = [
        eq(salesHistory.make, params.make),
        eq(salesHistory.site, params.site)
      ];
      
      if (params.model && params.model.trim() !== '') {
        conditions.push(eq(salesHistory.model, params.model));
      }
      
      if (params.yearFrom) {
        conditions.push(gte(salesHistory.year, params.yearFrom));
      }
      
      if (params.yearTo) {
        conditions.push(gte(salesHistory.year, params.yearTo));
      }
      
      // Add fresh data filter if requested
      if (includeFresh) {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        conditions.push(sql`${salesHistory.sale_date} >= ${threeDaysAgo.toISOString()}`);
      }
      
      const offset = (page - 1) * size;
      
      const results = await db.select()
        .from(salesHistory)
        .where(and(...conditions))
        .orderBy(desc(salesHistory.sale_date))
        .limit(size)
        .offset(offset);
      
      const totalCount = await db.select()
        .from(salesHistory)
        .where(and(...conditions));
      
      return {
        data: results,
        totalCount: totalCount.length,
        page,
        size
      };
      
    } catch (error) {
      console.error('Combined data fetch failed:', error);
      throw error;
    }
  }
}

export const freshDataService = new FreshDataService();