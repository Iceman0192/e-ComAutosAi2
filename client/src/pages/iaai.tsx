import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSalesHistory } from '@/api/apiClient';
import { useFilterState } from '@/hooks/useFilterState';
import AppLayout from '@/components/layout/AppLayout';
import { SalesTimeline } from '@/components/sales/SalesTimeline';
import SaleDetail from '@/components/sales/SaleDetail';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Grid, List, Clock } from 'lucide-react';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';

enum TabType {
  TIMELINE = "timeline",
  TABLE = "table", 
  PHOTOS = "photos"
}

export default function IAAI() {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.TIMELINE);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [page, setPage] = useState(1);
  const resultsPerPage = 25;

  const filterState = useFilterState();

  const searchParams = new URLSearchParams({
    make: filterState.make,
    model: filterState.model,
    page: page.toString(),
    size: resultsPerPage.toString(),
    site: '2', // IAAI site ID
    ...(filterState.dateRange !== 'custom' ? {} : {
      sale_date_from: filterState.customDateStart,
      sale_date_to: filterState.customDateEnd
    }),
    ...(filterState.priceMin ? { price_min: filterState.priceMin.toString() } : {}),
    ...(filterState.priceMax ? { price_max: filterState.priceMax.toString() } : {})
  });

  // Add date range parameters based on selection
  const now = new Date();
  let startDate: Date;
  
  switch (filterState.dateRange) {
    case 'last3m':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      searchParams.append('sale_date_from', startDate.toISOString().split('T')[0]);
      searchParams.append('sale_date_to', now.toISOString().split('T')[0]);
      break;
    case 'last6m':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      searchParams.append('sale_date_from', startDate.toISOString().split('T')[0]);
      searchParams.append('sale_date_to', now.toISOString().split('T')[0]);
      break;
    case 'lasty':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      searchParams.append('sale_date_from', startDate.toISOString().split('T')[0]);
      searchParams.append('sale_date_to', now.toISOString().split('T')[0]);
      break;
  }

  const {
    data: searchResults,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['iaai-sales-history', searchParams.toString()],
    queryFn: () => fetchSalesHistory(searchParams),
    enabled: !!(filterState.make && filterState.model),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const salesHistory = searchResults?.data?.salesHistory || [];
  const totalResults = searchResults?.data?.pagination?.totalCount || salesHistory.length;
  const averagePrice = searchResults?.data?.stats?.averagePrice || 0;

  const totalPages = Math.ceil(totalResults / resultsPerPage);

  const handleRefresh = () => {
    refetch();
  };

  useEffect(() => {
    setPage(1);
  }, [filterState.make, filterState.model, filterState.dateRange]);

  // Loading state
  if (isLoading && !searchResults) {
    return (
      <AppLayout filterState={filterState} onRefresh={handleRefresh}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading IAAI sales data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AppLayout filterState={filterState} onRefresh={handleRefresh}>
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-4">Error loading IAAI data</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </AppLayout>
    );
  }

  // No results state
  if (!isLoading && (!salesHistory || salesHistory.length === 0)) {
    return (
      <AppLayout filterState={filterState} onRefresh={handleRefresh}>
        <div className="text-center py-12">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              No IAAI Results Found
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              No sales data found for {filterState.make} {filterState.model} on IAAI.
              Try adjusting your search criteria or date range.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout filterState={filterState} onRefresh={handleRefresh}>
      <div className="space-y-6">
        {/* Header with IAAI branding */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 rounded-lg">
          <h1 className="text-2xl font-bold mb-2">IAAI Sales History</h1>
          <p className="text-orange-100">
            {filterState.make} {filterState.model} • {totalResults.toLocaleString()} total results
          </p>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Sales</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{salesHistory.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Average Price</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(averagePrice)}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Price Range</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {salesHistory.length > 0 ? (
                `${formatCurrency(Math.min(...salesHistory.map(s => s.purchase_price || 0)))} - ${formatCurrency(Math.max(...salesHistory.map(s => s.purchase_price || 0)))}`
              ) : 'N/A'}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Auction House</div>
            <div className="text-2xl font-bold text-orange-600">IAAI</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab(TabType.TIMELINE)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === TabType.TIMELINE
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Timeline View
              </button>
              <button
                onClick={() => setActiveTab(TabType.TABLE)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === TabType.TABLE
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <List className="w-4 h-4 inline mr-2" />
                Table View
              </button>
              <button
                onClick={() => setActiveTab(TabType.PHOTOS)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === TabType.PHOTOS
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Grid className="w-4 h-4 inline mr-2" />
                Photo Grid
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === TabType.TIMELINE && (
              <SalesTimeline 
                salesHistory={salesHistory}
                isLoading={isLoading}
              />
            )}

            {activeTab === TabType.TABLE && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Sale Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Mileage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Damage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Location
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {salesHistory.map((sale: any) => (
                      <tr 
                        key={sale.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {sale.year} {sale.make} {sale.model}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {sale.series || sale.trim}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(sale.sale_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(sale.purchase_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatNumber(sale.odometer || sale.vehicle_mileage, 'mi')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {sale.damage_pr || sale.vehicle_damage || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {sale.auction_location || sale.location}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === TabType.PHOTOS && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {salesHistory.map((sale: any) => {
                  let imageUrls = [];
                  if (sale.link_img_small) {
                    imageUrls = Array.isArray(sale.link_img_small) ? sale.link_img_small : [sale.link_img_small];
                  } else if (sale.images) {
                    try {
                      imageUrls = typeof sale.images === 'string' ? JSON.parse(sale.images) : sale.images;
                    } catch {
                      imageUrls = [];
                    }
                  }

                  return (
                    <div 
                      key={sale.id}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedSale(sale)}
                    >
                      <div className="aspect-w-16 aspect-h-12 bg-gray-200 dark:bg-gray-700">
                        {imageUrls.length > 0 ? (
                          <img
                            src={imageUrls[0]}
                            alt={`${sale.year} ${sale.make} ${sale.model}`}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.currentTarget.parentElement!.innerHTML = `
                                <div class="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <span class="text-gray-500 dark:text-gray-400">No Image</span>
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-gray-500 dark:text-gray-400">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {sale.year} {sale.make} {sale.model}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {sale.series || sale.trim}
                        </p>
                        <div className="mt-2 flex justify-between items-center">
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(sale.purchase_price)}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatNumber(sale.odometer || sale.vehicle_mileage, 'mi')}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(sale.sale_date)} • {sale.auction_location || sale.location}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 rounded-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              variant="outline"
            >
              Previous
            </Button>
            <Button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              variant="outline"
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{(page - 1) * resultsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min((page * resultsPerPage), totalResults)}
                </span> of{' '}
                <span className="font-medium">
                  {totalResults}
                </span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  if (pageNum <= totalPages) {
                    return (
                      <Button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        className="relative inline-flex items-center px-4 py-2"
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                  return null;
                })}
                
                <Button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  variant="outline"
                  size="sm"
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <SaleDetail
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          averagePrice={averagePrice}
        />
      )}
    </AppLayout>
  );
}