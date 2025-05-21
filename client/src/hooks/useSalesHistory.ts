import { useQuery } from "@tanstack/react-query";
import { SaleHistoryResponse } from "@shared/schema";
import { FilterState } from "./useFilterState";

interface SalesHistoryData {
  salesHistory: Array<{
    id: string;
    vin: string;
    lot_number?: string;
    sale_date: string;
    purchase_price?: number;
    sale_status: string;
    buyer_state?: string;
    base_site: string;
    year?: number;
    make?: string;
    model?: string;
    trim?: string;
    mileage?: number;
    title_status?: string;
  }>;
  vehicle?: {
    vin: string;
    make: string;
    model: string;
    year: number;
    trim?: string;
    mileage?: number;
    title_status?: string;
  };
  stats: {
    totalSales: number;
    averagePrice: number;
    successRate: number;
    priceTrend: number;
    topLocations: Array<{ state: string; count: number }>;
  };
  priceTrend: Array<{ month: string; avgPrice: number }>;
  geographicData: Array<{ state: string; count: number }>;
}

export function useSalesHistory(filterState: FilterState) {
  const {
    vin,
    make,
    model,
    dateRange,
    customDateStart,
    customDateEnd,
    saleStatus,
    priceMin,
    priceMax,
    buyerLocation,
    sites
  } = filterState;

  return useQuery<SalesHistoryData>({
    queryKey: [
      '/api/sales-history', 
      make,
      model,
      dateRange, 
      customDateStart, 
      customDateEnd, 
      saleStatus.join(','), 
      priceMin, 
      priceMax, 
      buyerLocation, 
      sites.join(',')
    ],
    queryFn: async ({ queryKey }) => {
      // Build URL with query parameters
      const url = new URL('/api/sales-history', window.location.origin);
      
      // Add parameters - focus on make and model as primary identifiers
      if (make) url.searchParams.append('make', make);
      if (model) url.searchParams.append('model', model);
      
      // Add VIN as an optional parameter if available
      if (vin) url.searchParams.append('vin', vin);
      
      if (dateRange) url.searchParams.append('dateRange', dateRange);
      if (dateRange === 'custom') {
        if (customDateStart) url.searchParams.append('customDateStart', customDateStart);
        if (customDateEnd) url.searchParams.append('customDateEnd', customDateEnd);
      }
      
      if (saleStatus.length > 0) {
        saleStatus.forEach(status => url.searchParams.append('saleStatus', status));
      }
      
      if (priceMin !== undefined) url.searchParams.append('priceMin', priceMin.toString());
      if (priceMax !== undefined) url.searchParams.append('priceMax', priceMax.toString());
      if (buyerLocation) url.searchParams.append('buyerLocation', buyerLocation);
      
      if (sites.length > 0) {
        sites.forEach(site => url.searchParams.append('sites', site));
      }
      
      // For the first query, don't fetch if both make and model are empty
      if (!make || !model) {
        return {
          salesHistory: [],
          vehicle: undefined,
          stats: {
            totalSales: 0,
            averagePrice: 0,
            successRate: 0,
            priceTrend: 0,
            topLocations: []
          },
          priceTrend: [],
          geographicData: []
        };
      }
      
      // Use the default fetch function
      const response = await fetch(url.toString(), {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales history');
      }
      
      return await response.json();
    },
    enabled: !!vin,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
