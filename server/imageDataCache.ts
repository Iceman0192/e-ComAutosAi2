/**
 * Image Data Cache - Handles IAAI's Long DeepZoom URLs
 * Temporary storage for vehicle image data that exceeds URL parameter limits
 */

interface CachedImageData {
  platform: string;
  lotId: string;
  vin: string;
  year: string;
  make: string;
  model: string;
  series?: string;
  mileage: string;
  damage: string;
  color?: string;
  location?: string;
  currentBid?: string;
  auctionDate?: string;
  images: string[];
  timestamp: number;
}

class ImageDataCache {
  private cache = new Map<string, CachedImageData>();
  private readonly EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

  /**
   * Store vehicle data with images and return a reference ID
   */
  store(vehicleData: Omit<CachedImageData, 'timestamp'>): string {
    const referenceId = `${vehicleData.platform}_${vehicleData.lotId}_${Date.now()}`;
    
    this.cache.set(referenceId, {
      ...vehicleData,
      timestamp: Date.now()
    });

    // Clean up expired entries
    this.cleanup();
    
    return referenceId;
  }

  /**
   * Retrieve vehicle data by reference ID
   */
  retrieve(referenceId: string): CachedImageData | null {
    const data = this.cache.get(referenceId);
    
    if (!data) {
      return null;
    }

    // Check if expired
    if (Date.now() - data.timestamp > this.EXPIRY_TIME) {
      this.cache.delete(referenceId);
      return null;
    }

    return data;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.cache.entries()) {
      if (now - data.timestamp > this.EXPIRY_TIME) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache stats for debugging
   */
  getStats(): { totalEntries: number; oldestEntry: number | null } {
    const entries = Array.from(this.cache.values());
    return {
      totalEntries: entries.length,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : null
    };
  }
}

export const imageDataCache = new ImageDataCache();