/**
 * Fresh Data Manager - Temporary Database System
 * Handles 3-day migration cycle for Gold/Platinum exclusive data
 */

import { db } from './db';
import { freshSalesHistory, salesHistory } from '@shared/schema';
import { eq, lt, and, gte, desc } from 'drizzle-orm';
import { getVehicleSalesHistory } from './apiClient';

export interface FreshDataParams {
  make: string;
  model?: string;
  site: number;
  yearFrom?: number;
  yearTo?: number;
  auctionDateFrom: string;
  auctionDateTo: string;
}

export class FreshDataManager {
  
  /**
   * Check if fresh data exists in temporary database
   */
  async checkFreshDataExists(params: FreshDataParams, page: number = 1, size: number = 25): Promise<boolean> {
    const conditions = [
      eq(freshSalesHistory.make, params.make),
      eq(freshSalesHistory.site, params.site),
      gte(freshSalesHistory.expires_at, new Date()) // Not expired
    ];
    
    if (params.model) {
      conditions.push(eq(freshSalesHistory.model, params.model));
    }
    
    const offset = (page - 1) * size;
    const results = await db.select()
      .from(freshSalesHistory)
      .where(and(...conditions))
      .limit(size)
      .offset(offset);
    
    return results.length >= size;
  }
  
  /**
   * Get fresh data from temporary database
   */
  async getFreshData(params: FreshDataParams, page: number = 1, size: number = 25) {
    const conditions = [
      eq(freshSalesHistory.make, params.make),
      eq(freshSalesHistory.site, params.site),
      gte(freshSalesHistory.expires_at, new Date()) // Not expired
    ];
    
    if (params.model) {
      conditions.push(eq(freshSalesHistory.model, params.model));
    }
    
    const offset = (page - 1) * size;
    const results = await db.select()
      .from(freshSalesHistory)
      .where(and(...conditions))
      .orderBy(desc(freshSalesHistory.sale_date))
      .limit(size)
      .offset(offset);
    
    const totalCount = await db.select()
      .from(freshSalesHistory)
      .where(and(...conditions));
    
    return {
      data: results,
      totalCount: totalCount.length,
      fromFreshCache: true
    };
  }
  
  /**
   * Fetch and store fresh data from API
   */
  async fetchAndStoreFreshData(params: FreshDataParams, page: number = 1, size: number = 25) {
    console.log(`🌊 Fetching fresh data from API for: ${params.make} ${params.model || 'all models'}`);
    
    const apiResponse = await getVehicleSalesHistory(
      params.make,
      params.site.toString(),
      params.model,
      page,
      size,
      params.yearFrom,
      params.yearTo,
      params.auctionDateFrom,
      params.auctionDateTo
    );
    
    if (apiResponse.success && apiResponse.data.data && Array.isArray(apiResponse.data.data)) {
      // Store in temporary database with 3-day expiration
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 3);
      
      const freshRecords = apiResponse.data.data.map((item: any) => ({
        id: `${item.lot_id || item.id}-${params.site}-fresh`,
        lot_id: item.lot_id || item.id,
        site: params.site,
        base_site: item.base_site || (params.site === 1 ? 'copart' : 'iaai'),
        vin: item.vin,
        sale_status: item.sale_status || item.status,
        sale_date: item.sale_date ? new Date(item.sale_date) : null,
        purchase_price: item.purchase_price || item.cost_priced?.toString(),
        buyer_state: item.buyer_state,
        buyer_country: item.buyer_country,
        buyer_type: item.buyer_type,
        auction_location: item.auction_location || item.location,
        vehicle_mileage: item.vehicle_mileage || item.odometer,
        vehicle_damage: item.vehicle_damage || item.damage_pr,
        vehicle_title: item.vehicle_title || item.document,
        vehicle_has_keys: item.vehicle_has_keys || (item.keys === 'Yes'),
        year: item.year,
        make: item.make,
        model: item.model,
        series: item.series,
        trim: item.trim,
        transmission: item.transmission,
        drive: item.drive,
        fuel: item.fuel,
        engine: item.engine,
        color: item.color,
        images: typeof item.images === 'string' ? item.images : JSON.stringify(item.images || []),
        link: item.link,
        link_img_hd: item.link_img_hd || [],
        link_img_small: item.link_img_small || [],
        expires_at: expirationDate
      }));
      
      // Insert fresh records with conflict resolution
      for (const record of freshRecords) {
        try {
          await db.insert(freshSalesHistory)
            .values(record)
            .onConflictDoUpdate({
              target: freshSalesHistory.id,
              set: { expires_at: expirationDate }
            });
        } catch (error) {
          console.log(`Skipping duplicate fresh record: ${record.id}`);
        }
      }
      
      console.log(`✅ Stored ${freshRecords.length} fresh records in temporary database`);
      
      return {
        data: apiResponse.data.data,
        totalCount: apiResponse.data.count || freshRecords.length,
        fromAPI: true
      };
    }
    
    return { data: [], totalCount: 0, fromAPI: true };
  }
  
  /**
   * Migrate expired fresh data to main database
   */
  async migrateExpiredData() {
    console.log('🔄 Starting 3-day migration cycle...');
    
    // Get expired records
    const expiredRecords = await db.select()
      .from(freshSalesHistory)
      .where(lt(freshSalesHistory.expires_at, new Date()));
    
    if (expiredRecords.length === 0) {
      console.log('✅ No data to migrate');
      return;
    }
    
    // Migrate to main database
    for (const record of expiredRecords) {
      // Skip records with null lot_id
      if (record.lot_id === null) {
        console.log(`Skipping migration for record with null lot_id: ${record.id}`);
        continue;
      }

      const mainRecord = {
        id: record.id.replace('-fresh', ''),
        lot_id: record.lot_id,
        site: record.site,
        base_site: record.base_site || (record.site === 1 ? 'copart' : 'iaai'),
        vin: record.vin || '',
        sale_status: record.sale_status || 'unknown',
        sale_date: record.sale_date || new Date(),
        purchase_price: record.purchase_price,
        buyer_state: record.buyer_state,
        buyer_country: record.buyer_country,
        buyer_type: record.buyer_type,
        auction_location: record.auction_location,
        vehicle_mileage: record.vehicle_mileage,
        vehicle_damage: record.vehicle_damage,
        vehicle_title: record.vehicle_title,
        vehicle_has_keys: record.vehicle_has_keys,
        year: record.year,
        make: record.make,
        model: record.model,
        series: record.series,
        trim: record.trim,
        transmission: record.transmission,
        drive: record.drive,
        fuel: record.fuel,
        engine: record.engine,
        color: record.color,
        images: record.images,
        link: record.link,
      };
      
      try {
        await db.insert(salesHistory)
          .values([mainRecord])
          .onConflictDoNothing();
      } catch (error) {
        console.log(`Skipping duplicate migration: ${mainRecord.id}`);
      }
    }
    
    // Clean up expired records from temporary database
    await db.delete(freshSalesHistory)
      .where(lt(freshSalesHistory.expires_at, new Date()));
    
    console.log(`✅ Migrated ${expiredRecords.length} records to main database`);
  }
  
  /**
   * Clean up expired fresh data
   */
  async cleanupExpiredData() {
    const deletedCount = await db.delete(freshSalesHistory)
      .where(lt(freshSalesHistory.expires_at, new Date()));
    
    console.log(`🧹 Cleaned up expired fresh data records`);
  }
}

export const freshDataManager = new FreshDataManager();