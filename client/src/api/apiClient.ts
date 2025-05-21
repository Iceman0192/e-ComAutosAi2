/**
 * API Client for handling all server requests
 */

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

const BASE_URL = window.location.origin;

/**
 * Generic fetch function with proper error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Parse the JSON response
    const data = await response.json();

    // If the response is not ok, handle the error
    if (!response.ok) {
      return {
        data: {} as T,
        success: false,
        message: data.message || 'Something went wrong, please try again',
      };
    }

    // Return the data with success flag
    return {
      data,
      success: true,
    };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      data: {} as T,
      success: false,
      message: 'Unable to connect to the server. Please try again.',
    };
  }
}

// API function interfaces
export interface Vehicle {
  vin: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  mileage?: number;
  title_status?: string;
}

export interface SalesRecord {
  id: string;
  lot_id?: number;
  vin: string;
  sale_date: string;
  sale_status: string;
  purchase_price?: number;
  buyer_state?: string;
  buyer_country?: string;
  buyer_type?: string;
  base_site: string;
  auction_location?: string;
  
  // Vehicle specific data that might be included directly in sales record
  year?: number;
  make?: string;
  model?: string;
  series?: string;
  trim?: string;
  odometer?: number;
  vehicle_type?: string;
  damage_pr?: string;
  damage_sec?: string;
  fuel?: string;
  drive?: string;
  transmission?: string;
  color?: string;
  keys?: string;
  title?: string;
  location?: string;
  vehicle_title?: string;
  vehicle_damage?: string;
  vehicle_mileage?: number;
  vehicle_has_keys?: boolean;
  
  // Image and media links
  link_img_small?: string[];
  link_img_hd?: string[];
  link?: string;
}

export interface SalesStatistics {
  totalSales: number;
  averagePrice: number;
  successRate: number;
  priceTrend: number;
  topLocations: Array<{ state: string; count: number }>;
}

export interface SalesHistoryData {
  salesHistory: SalesRecord[];
  vehicle?: Vehicle;
  stats: SalesStatistics;
  priceTrend: Array<{ month: string; avgPrice: number }>;
  geographicData: Array<{ state: string; count: number }>;
}

/**
 * Fetch sales history data based on filters
 */
export async function fetchSalesHistory(filters: {
  make: string;
  model: string;
  vin?: string;
  dateRange?: string;
  customDateStart?: string;
  customDateEnd?: string;
  saleStatus?: string[];
  priceMin?: number;
  priceMax?: number;
  buyerLocation?: string;
  sites?: string[];
}): Promise<ApiResponse<SalesHistoryData>> {
  // Build the URL with query parameters
  const params = new URLSearchParams();
  
  if (filters.make) params.append('make', filters.make);
  if (filters.model) params.append('model', filters.model);
  if (filters.vin) params.append('vin', filters.vin);
  if (filters.dateRange) params.append('dateRange', filters.dateRange);
  
  if (filters.dateRange === 'custom') {
    if (filters.customDateStart) params.append('customDateStart', filters.customDateStart);
    if (filters.customDateEnd) params.append('customDateEnd', filters.customDateEnd);
  }
  
  if (filters.saleStatus && filters.saleStatus.length > 0) {
    filters.saleStatus.forEach(status => params.append('saleStatus', status));
  }
  
  if (filters.priceMin !== undefined) params.append('priceMin', filters.priceMin.toString());
  if (filters.priceMax !== undefined) params.append('priceMax', filters.priceMax.toString());
  if (filters.buyerLocation) params.append('buyerLocation', filters.buyerLocation);
  
  if (filters.sites && filters.sites.length > 0) {
    filters.sites.forEach(site => params.append('sites', site));
  }
  
  const endpoint = `/api/sales-history?${params.toString()}`;
  return apiFetch<SalesHistoryData>(endpoint);
}