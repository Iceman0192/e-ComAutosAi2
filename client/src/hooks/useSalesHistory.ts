import { useQuery } from '@tanstack/react-query';
import { fetchSalesHistory } from '../api/apiClient';
import { SalesHistoryData } from '../api/apiClient';

export interface FilterState {
  make: string;
  model: string;
  year_from?: number;
  year_to?: number;
  auction_date_from?: string;
  auction_date_to?: string;
  page?: number;
  size?: number;
  damage_type?: string;
  odometer_from?: number;
  odometer_to?: number;
  sites: string[];
}

export function useSalesHistory(filterState: FilterState) {
  return useQuery({
    queryKey: ['salesHistory', filterState],
    queryFn: async () => {
      // Convert filterState to parameters for API call
      const params = new URLSearchParams();
      
      // Add required search parameters
      if (filterState.make) params.append('make', filterState.make);
      if (filterState.model) params.append('model', filterState.model);
      
      // Year range parameters
      if (filterState.year_from !== undefined) params.append('year_from', filterState.year_from.toString());
      if (filterState.year_to !== undefined) params.append('year_to', filterState.year_to.toString());
      
      // Sale date range parameters (renamed from auction_date to match API expectations)
      if (filterState.auction_date_from) params.append('sale_date_from', filterState.auction_date_from);
      if (filterState.auction_date_to) params.append('sale_date_to', filterState.auction_date_to);
      
      // Pagination parameters
      if (filterState.page !== undefined) params.append('page', filterState.page.toString());
      if (filterState.size !== undefined) params.append('size', filterState.size.toString());
      
      // Additional filters
      if (filterState.damage_type) params.append('damage_type', filterState.damage_type);
      if (filterState.odometer_from !== undefined) params.append('odometer_from', filterState.odometer_from.toString());
      if (filterState.odometer_to !== undefined) params.append('odometer_to', filterState.odometer_to.toString());
      
      // Site filter - Convert between our UI names and API values
      if (filterState.sites && filterState.sites.length > 0) {
        if (filterState.sites.includes('copart')) params.append('site', '1');
        if (filterState.sites.includes('iaai')) params.append('site', '2');
      }
      
      const response = await fetchSalesHistory(params);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch sales history');
      }

      return response.data;
    },
    // IMPORTANT: Only enabled when explicitly triggered
    enabled: false // This prevents automatic fetching on component mount
  });
}