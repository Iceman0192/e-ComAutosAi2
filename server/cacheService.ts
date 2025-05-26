/**
 * Clean Cache Service - Simplified and Reliable
 * Handles operational integrity between database and API
 */

import { db } from './db';
import { salesHistory } from '@shared/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export interface CacheKey {
  make: string;
  model?: string;
  site: number;
  yearFrom?: number;
  yearTo?: number;
  auctionDateFrom?: string;
  auctionDateTo?: string;
}

export class VehicleCacheService {
  
  /**
   * Check if Gold+ users need fresh data (for page 1 only)
   */
  async needsFreshData(params: CacheKey, userRole: string): Promise<boolean> {
    // Only Gold+ users get fresh data priority
    if (userRole !== 'gold' && userRole !== 'platinum' && userRole !== 'admin') {
      return false;
    }
    
    try {
      // Get the newest record from our cache for this search
      const conditions = [
        eq(salesHistory.make, params.make),
        eq(salesHistory.site, params.site)
      ];
      
      if (params.model && params.model.trim() !== '') {
        conditions.push(eq(salesHistory.model, params.model));
      }
      
      const newestCached = await db.select()
        .from(salesHistory)
        .where(and(...conditions))
        .orderBy(desc(salesHistory.sale_date))
        .limit(1);
      
      if (newestCached.length === 0) {
        return true; // No cache at all, need fresh data
      }
      
      // Check if cached data is older than 1 hour (configurable freshness threshold)
      const cacheAge = Date.now() - new Date(newestCached[0].created_at).getTime();
      const oneHour = 60 * 60 * 1000;
      
      return cacheAge > oneHour;
      
    } catch (error) {
      console.error('Fresh data check failed:', error);
      return true; // On error, fetch fresh data to be safe
    }
  }
  
  /**
   * Generate a consistent cache key for search criteria
   */
  private generateCacheKey(params: CacheKey): string {
    const {
      make,
      model = 'all',
      site,
      yearFrom = 'any',
      yearTo = 'any',
      auctionDateFrom = 'any',
      auctionDateTo = 'any'
    } = params;
    
    return `${make}-${model}-${site}-${yearFrom}-${yearTo}-${auctionDateFrom}-${auctionDateTo}`.toLowerCase();
  }
  
  /**
   * Check if we have sufficient cached data for this search and page
   */
  async hasCachedData(params: CacheKey, page: number = 1, size: number = 25): Promise<boolean> {
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
        conditions.push(lte(salesHistory.year, params.yearTo));
      }
      
      // Count total records instead of limiting to required count
      const totalRecords = await db.select()
        .from(salesHistory)
        .where(and(...conditions));
      
      const totalCount = totalRecords.length;
      const requiredForPage = page * size; // Need at least this many records to serve the requested page
      
      console.log(`Cache check: Found ${totalCount} results for ${this.generateCacheKey(params)}, need ${requiredForPage} for page ${page}`);
      
      return totalCount >= requiredForPage;
      
    } catch (error) {
      console.error('Cache check failed:', error);
      return false;
    }
  }
  
  /**
   * Get cached data for pagination with role-based ordering
   */
  async getCachedData(params: CacheKey, page: number = 1, size: number = 25, userRole: string = 'free') {
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
        conditions.push(lte(salesHistory.year, params.yearTo));
      }
      
      const offset = (page - 1) * size;
      
      // Role-based data ordering:
      // FREE users: Oldest to Newest (oldest data first)
      // GOLD/PLATINUM users: Newest to Oldest (newest data first)
      const isGoldOrPlatinum = userRole === 'gold' || userRole === 'platinum' || userRole === 'admin';
      const sortOrder = isGoldOrPlatinum ? desc(salesHistory.sale_date) : salesHistory.sale_date;
      
      const results = await db.select()
        .from(salesHistory)
        .where(and(...conditions))
        .orderBy(sortOrder)
        .limit(size)
        .offset(offset);
      
      // Get total count for pagination
      const totalCount = await db.select()
        .from(salesHistory)
        .where(and(...conditions));
      
      // Transform cached data to match frontend expectations
      const transformedResults = results.map((item: any) => {
        // For IAAI (site 2), ensure images are in the correct format
        if (params.site === 2) {
          // Parse images from JSON string and add to link_img_hd field
          if (item.images && typeof item.images === 'string') {
            try {
              const parsedImages = JSON.parse(item.images);
              item.link_img_hd = Array.isArray(parsedImages) ? parsedImages : [parsedImages];
            } catch (error) {
              console.error('Error parsing cached images:', error);
              item.link_img_hd = [];
            }
          }
        }
        return item;
      });

      console.log(`Cache served: ${results.length} results for page ${page}`);
      
      return {
        data: transformedResults,
        totalCount: totalCount.length,
        fromCache: true
      };
      
    } catch (error) {
      console.error('Cache retrieval failed:', error);
      return null;
    }
  }
  
  /**
   * Store API results in cache
   */
  async storeResults(params: CacheKey, apiResults: any[]) {
    try {
      console.log(`Storing ${apiResults.length} results in cache for ${this.generateCacheKey(params)}`);
      
      const insertPromises = apiResults.map(async (item: any) => {
        try {
          const saleHistoryItem = {
            id: `${item.lot_id}-${params.site}`,
            lot_id: item.lot_id,
            site: params.site,
            base_site: params.site === 1 ? 'copart' : 'iaai',
            vin: item.vin || '',
            sale_status: item.sale_status || 'Unknown',
            sale_date: item.sale_date ? new Date(item.sale_date) : new Date(),
            purchase_price: item.purchase_price || null,
            buyer_state: item.buyer_state || null,
            buyer_country: item.buyer_country || null,
            buyer_type: item.buyer_type || null,
            auction_location: item.auction_location || item.location || null,
            vehicle_mileage: item.odometer || item.vehicle_mileage || null,
            vehicle_damage: item.damage_pr || item.vehicle_damage || null,
            vehicle_title: item.title || item.vehicle_title || null,
            vehicle_has_keys: item.keys === 'Yes' || item.vehicle_has_keys || false,
            year: item.year || null,
            make: item.make || params.make,
            model: item.model || params.model || null,
            series: item.series || null,
            trim: item.trim || item.series || null,
            transmission: item.transmission || null,
            drive: item.drive || null,
            fuel: item.fuel || null,
            color: item.color || null,
            created_at: new Date(),
            images: item.link_img_hd ? JSON.stringify(item.link_img_hd) : null,
            link: item.link || null
          };
          
          await db.insert(salesHistory).values(saleHistoryItem)
            .onConflictDoNothing({ target: salesHistory.id });
            
          return true;
        } catch (itemError) {
          console.error('Error storing individual item:', itemError);
          return false;
        }
      });
      
      await Promise.all(insertPromises);
      console.log(`Successfully stored cache data for ${this.generateCacheKey(params)}`);
      
    } catch (error) {
      console.error('Cache storage failed:', error);
    }
  }
}

export const cacheService = new VehicleCacheService();