/**
 * Vehicle Data Transfer Utilities
 * Unified URL hash encoding for both Copart and IAAI platforms
 * Handles variable image counts and complex URLs reliably
 */

export interface VehicleTransferData {
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
}

/**
 * Encode vehicle data into URL hash for reliable transfer
 * Works with any number of images from any platform
 */
export function encodeVehicleData(data: VehicleTransferData): string {
  try {
    const encodedData = btoa(JSON.stringify(data));
    return `#${encodedData}`;
  } catch (error) {
    console.error('Failed to encode vehicle data:', error);
    return '';
  }
}

/**
 * Decode vehicle data from URL hash
 * Returns null if no valid data found
 */
export function decodeVehicleData(): VehicleTransferData | null {
  try {
    const hash = window.location.hash.slice(1); // Remove # prefix
    if (!hash) return null;
    
    const decodedData = JSON.parse(atob(hash));
    
    // Validate required fields
    if (!decodedData.platform || !decodedData.lotId || !decodedData.vin) {
      return null;
    }
    
    return decodedData;
  } catch (error) {
    console.error('Failed to decode vehicle data:', error);
    return null;
  }
}

/**
 * Navigate to AI Analysis with encoded vehicle data
 */
export function navigateToAIAnalysis(data: VehicleTransferData, setLocation: (path: string) => void) {
  const hash = encodeVehicleData(data);
  if (hash) {
    setLocation(`/ai-analysis${hash}`);
  } else {
    console.error('Failed to encode vehicle data for navigation');
  }
}

/**
 * Check if current page has valid vehicle data
 */
export function hasValidVehicleData(): boolean {
  return decodeVehicleData() !== null;
}