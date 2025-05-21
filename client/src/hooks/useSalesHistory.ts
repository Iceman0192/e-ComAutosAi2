import { useQuery } from '@tanstack/react-query';
import { fetchSalesHistory } from '../api/apiClient';
import { SalesHistoryData } from '../api/apiClient';

export interface FilterState {
  vin: string;
  make: string;
  model: string;
  dateRange: 'last3m' | 'last6m' | 'lasty' | 'custom';
  customDateStart?: string;
  customDateEnd?: string;
  saleStatus: string[];
  priceMin?: number;
  priceMax?: number;
  buyerLocation?: string;
  sites: string[];
}

export function useSalesHistory(filterState: FilterState) {
  return useQuery({
    queryKey: ['salesHistory', filterState],
    queryFn: async () => {
      const response = await fetchSalesHistory({
        vin: filterState.vin,
        make: filterState.make,
        model: filterState.model,
        dateRange: filterState.dateRange,
        customDateStart: filterState.customDateStart,
        customDateEnd: filterState.customDateEnd,
        saleStatus: filterState.saleStatus,
        priceMin: filterState.priceMin,
        priceMax: filterState.priceMax,
        buyerLocation: filterState.buyerLocation,
        sites: filterState.sites
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch sales history');
      }

      return response.data;
    },
    enabled: Boolean(filterState.make && filterState.model)
  });
}