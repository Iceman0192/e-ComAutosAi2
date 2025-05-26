import { useState } from 'react';
import { useSalesHistory, FilterState } from '../hooks/useSalesHistory';
import ErrorBoundary from '../components/ui/error-boundary';
import { Link, useLocation } from 'wouter';
import SalesAnalytics from '../components/sales/SalesAnalytics';
import { Button } from '@/components/ui/button';
import { Car } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { EcomNavbar } from '../components/layout/EcomNavbar';

import { formatCurrency } from '../utils/formatters';
import PlatformToggle from '../components/ui/platform-toggle';

// Tab enum for better organization
enum TabType {
  TIMELINE = "timeline",
  TABLE = "table",
  PHOTOS = "photos"
}

// Get current year for the year picker default value
const currentYear = new Date().getFullYear();

export default function CopartSalesHistory() {
  // Primary search parameters
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('');
  const [vin, setVin] = useState('');
  const [yearFrom, setYearFrom] = useState(currentYear - 5);
  const [yearTo, setYearTo] = useState(currentYear);
  const [sites, setSites] = useState<string[]>(['copart']);
  const [condition, setCondition] = useState<string>('all'); // 'all', 'used', 'salvage'
  const [damageType, setDamageType] = useState<string>('all');
  const [minMileage, setMinMileage] = useState<number | undefined>(undefined);
  const [maxMileage, setMaxMileage] = useState<number | undefined>(undefined);
  
  // Date range for auction
  const [auctionDateFrom, setAuctionDateFrom] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  });
  const [auctionDateTo, setAuctionDateTo] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // Pagination
  const [page, setPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(25); // API supports up to 25 per page
  const [totalResults, setTotalResults] = useState(0);
  
  // UI state
  const [activeTab, setActiveTab] = useState<TabType>(TabType.TIMELINE);
  
  // Combine filter state for API request
  const filterState: FilterState = {
    make,
    model,
    year_from: yearFrom,
    year_to: yearTo,
    sites,
    auction_date_from: auctionDateFrom,
    auction_date_to: auctionDateTo,
    page,
    size: resultsPerPage,
    damage_type: damageType !== 'all' ? damageType : undefined,
    odometer_from: minMileage,
    odometer_to: maxMileage
  };
  
  // State to track if a search has been performed
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Helper function to calculate average price from sales history
  const calculateAveragePrice = (salesHistory: any[] = []) => {
    if (!salesHistory || salesHistory.length === 0) return 0;
    
    const salesWithPrices = salesHistory.filter(sale => sale.purchase_price !== undefined);
    if (salesWithPrices.length === 0) return 0;
    
    const total = salesWithPrices.reduce((sum, sale) => sum + (sale.purchase_price || 0), 0);
    return total / salesWithPrices.length;
  };

  // State to hold the actual results data
  const [searchResults, setSearchResults] = useState<any>(null);
  
  // State for detailed vehicle modal
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Fresh Data Toggle for Gold+ (Gold and Platinum) users
  const { hasPermission } = useAuth();
  const [freshDataEnabled, setFreshDataEnabled] = useState(false);
  const [fetchingFreshData, setFetchingFreshData] = useState(false);

  // Use the sales history hook with fresh data parameter
  const { data: searchResults_, isLoading, error, refetch } = useSalesHistory(filterState, hasSearched, freshDataEnabled);

  // Update search results when data changes
  useState(() => {
    if (searchResults_) {
      setSearchResults(searchResults_);
      // Update total results for pagination
      const resultsCount = searchResults_?.data?.salesHistory?.length || 0;
      if (page === 1) {
        // Estimate total based on current page results
        setTotalResults(resultsCount === resultsPerPage ? resultsCount * 10 : resultsCount);
      } else {
        setTotalResults(Math.max(totalResults, (page - 1) * resultsPerPage + resultsCount));
      }
    }
  });

  const handleSearch = () => {
    console.log('Search initiated with fresh data:', freshDataEnabled);
    setPage(1); // Reset to first page on new search
    setHasSearched(true);
    setIsSearching(true);
    
    // Build search parameters
    const searchParams = new URLSearchParams({
      make: make || '',
      model: model || '',
      year_from: yearFrom ? yearFrom.toString() : '',
      year_to: yearTo ? yearTo.toString() : '',
      page: '1',
      size: resultsPerPage.toString(),
      sale_date_from: auctionDateFrom,
      sale_date_to: auctionDateTo,
      ...(freshDataEnabled && { fresh_data: 'true' }),
      ...(sites.length > 0 && { site: sites.map(site => site === 'copart' ? '1' : '2').join(',') })
    });

    fetch(`/api/sales-history?${searchParams}`)
      .then(response => response.json())
      .then(data => {
        setSearchResults(data);
        setIsSearching(false);
        
        // Update pagination info
        const resultsCount = data?.data?.salesHistory?.length || 0;
        setTotalResults(resultsCount === resultsPerPage ? resultsCount * 10 : resultsCount);
      })
      .catch(error => {
        console.error('Search error:', error);
        setIsSearching(false);
      });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    
    // Build search parameters for pagination
    const searchParams = new URLSearchParams({
      make: make || '',
      model: model || '',
      year_from: yearFrom ? yearFrom.toString() : '',
      year_to: yearTo ? yearTo.toString() : '',
      page: newPage.toString(),
      size: resultsPerPage.toString(),
      sale_date_from: auctionDateFrom,
      sale_date_to: auctionDateTo,
      ...(freshDataEnabled && { fresh_data: 'true' }),
      ...(sites.length > 0 && { site: sites.map(site => site === 'copart' ? '1' : '2').join(',') })
    });

    fetch(`/api/sales-history?${searchParams}`)
      .then(response => response.json())
      .then(data => {
        setSearchResults(data);
        
        // Update pagination info for subsequent pages
        const resultsCount = data?.data?.salesHistory?.length || 0;
        if (resultsCount === resultsPerPage && newPage * resultsPerPage > totalResults) {
          setTotalResults(Math.max(totalResults, newPage * resultsPerPage + resultsCount));
        } else if (resultsCount < resultsPerPage) {
          setTotalResults((newPage - 1) * resultsPerPage + resultsCount);
        }
      })
      .catch(error => {
        console.error('Pagination error:', error);
      });
  };

  return (
    <div className="min-h-screen bg-background">
      <EcomNavbar />
      
      {/* Enhanced Header with EcomAutos.AI branding and Copart theme */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
                <Car className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Copart Sales History</h1>
                <p className="text-blue-100 mt-1">Powered by EcomAutos.AI Intelligence Platform</p>
              </div>
            </div>
            
            {/* Fresh Data Toggle for Gold+ users */}
            {hasPermission('gold') && (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-lg px-4 py-3">
                <PlatformToggle
                  enabled={freshDataEnabled}
                  onToggle={setFreshDataEnabled}
                  label="Fresh Data"
                  description="Access last 14 days of fresh auction data"
                  goldFeature={true}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-sm border p-6 sticky top-6">
              <h2 className="text-xl font-semibold mb-6 text-card-foreground">Search Filters</h2>
              
              {/* Vehicle Search */}
              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="make" className="block text-sm font-medium text-muted-foreground mb-2">
                    Make
                  </label>
                  <select
                    id="make"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  >
                    <option value="">All Makes</option>
                    <option value="Toyota">Toyota</option>
                    <option value="Honda">Honda</option>
                    <option value="Ford">Ford</option>
                    <option value="Chevrolet">Chevrolet</option>
                    <option value="Nissan">Nissan</option>
                    <option value="BMW">BMW</option>
                    <option value="Mercedes-Benz">Mercedes-Benz</option>
                    <option value="Audi">Audi</option>
                    <option value="Lexus">Lexus</option>
                    <option value="Hyundai">Hyundai</option>
                    <option value="Kia">Kia</option>
                    <option value="Subaru">Subaru</option>
                    <option value="Mazda">Mazda</option>
                    <option value="Volkswagen">Volkswagen</option>
                    <option value="Jeep">Jeep</option>
                    <option value="Ram">Ram</option>
                    <option value="GMC">GMC</option>
                    <option value="Cadillac">Cadillac</option>
                    <option value="Lincoln">Lincoln</option>
                    <option value="Acura">Acura</option>
                    <option value="Infiniti">Infiniti</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-muted-foreground mb-2">
                    Model {make && `(${make})`}
                  </label>
                  <input
                    id="model"
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={`Enter ${make || 'vehicle'} model`}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  />
                </div>
              </div>

              {/* Year Range */}
              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="yearFrom" className="block text-sm font-medium text-muted-foreground mb-2">
                    Year From
                  </label>
                  <select
                    id="yearFrom"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  >
                    {Array.from({length: currentYear - 1990 + 1}, (_, i) => currentYear - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="yearTo" className="block text-sm font-medium text-muted-foreground mb-2">
                    Year To
                  </label>
                  <select
                    id="yearTo"
                    value={yearTo}
                    onChange={(e) => setYearTo(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  >
                    {Array.from({length: currentYear - 1990 + 1}, (_, i) => currentYear - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sale Date Range */}
              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="auctionDateFrom" className="block text-sm font-medium text-muted-foreground mb-2">
                    Sale Date From
                  </label>
                  <input
                    id="auctionDateFrom"
                    type="date"
                    value={auctionDateFrom}
                    onChange={(e) => setAuctionDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  />
                </div>

                <div>
                  <label htmlFor="auctionDateTo" className="block text-sm font-medium text-muted-foreground mb-2">
                    Sale Date To
                  </label>
                  <input
                    id="auctionDateTo"
                    type="date"
                    value={auctionDateTo}
                    onChange={(e) => setAuctionDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  />
                </div>
              </div>

              {/* Search Button */}
              <Button 
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {isSearching ? 'Searching...' : 'Search Copart'}
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <ErrorBoundary>
              {hasSearched && searchResults?.data?.salesHistory?.length > 0 ? (
                <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
                  {/* Results Header */}
                  <div className="border-b px-6 py-4 flex flex-wrap items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold">
                        {searchResults?.data?.salesHistory.length || 0} Results for {make} {model} {yearFrom && yearTo ? `(${yearFrom}-${yearTo})` : ''}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Average sold price: {formatCurrency(searchResults?.data?.stats?.averagePrice)}
                      </p>
                    </div>
                    
                    {/* Tab navigation */}
                    <div className="flex mt-2 sm:mt-0">
                      <button
                        className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                          activeTab === TabType.TIMELINE
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={() => setActiveTab(TabType.TIMELINE)}
                      >
                        Timeline
                      </button>
                      <button
                        className={`px-4 py-2 text-sm font-medium ${
                          activeTab === TabType.TABLE
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={() => setActiveTab(TabType.TABLE)}
                      >
                        Table View
                      </button>
                      <button
                        className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                          activeTab === TabType.PHOTOS
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={() => setActiveTab(TabType.PHOTOS)}
                      >
                        Photo Grid
                      </button>
                    </div>
                  </div>
                  
                  {/* Result content based on active tab */}
                  {activeTab === TabType.TIMELINE && (
                    <div className="p-6">
                      <SalesAnalytics 
                        salesHistory={searchResults?.data?.salesHistory || []}
                      />
                    </div>
                  )}
                  
                  {activeTab === TabType.TABLE && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Vehicle
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Sale Price
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Sale Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {searchResults?.data?.salesHistory?.map((sale: any, index: number) => (
                            <tr key={index} className="hover:bg-muted/30 cursor-pointer transition-colors">
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-16 w-20 mr-4">
                                    {(() => {
                                      let imageUrl = '';
                                      if (sale.link_img_small && Array.isArray(sale.link_img_small) && sale.link_img_small.length > 0) {
                                        imageUrl = sale.link_img_small[0];
                                      } else if (sale.link_img_hd && Array.isArray(sale.link_img_hd) && sale.link_img_hd.length > 0) {
                                        imageUrl = sale.link_img_hd[0];
                                      } else if (sale.images) {
                                        const images = typeof sale.images === 'string' ? JSON.parse(sale.images) : sale.images;
                                        if (Array.isArray(images) && images.length > 0) {
                                          imageUrl = images[0];
                                        }
                                      }
                                      
                                      return imageUrl ? (
                                        <img
                                          src={imageUrl}
                                          alt={`${sale.year} ${sale.make} ${sale.model}`}
                                          className="w-full h-full object-cover rounded border"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-muted rounded border flex items-center justify-center">
                                          <Car className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-foreground">
                                      {sale.year} {sale.make} {sale.model} {sale.series}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      VIN: {sale.vin} • Lot: {sale.lot_id}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm font-medium">
                                {sale.purchase_price ? formatCurrency(sale.purchase_price) : 'Not sold'}
                              </td>
                              <td className="px-4 py-4 text-sm text-muted-foreground">
                                {new Date(sale.sale_date).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination */}
                  <div className="border-t px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          Showing {((page - 1) * resultsPerPage) + 1} to {Math.min(page * resultsPerPage, totalResults)} of {totalResults} results
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(Math.max(1, page - 1))}
                          disabled={page <= 1}
                        >
                          Previous
                        </Button>
                        
                        <span className="px-3 py-1 text-sm font-medium">
                          Page {page}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(page + 1)}
                          disabled={searchResults?.data?.salesHistory?.length === 0}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : hasSearched ? (
                <div className="bg-card rounded-lg shadow-sm border p-6 text-center">
                  <Car className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No sales history found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search criteria or select a different make and model.
                  </p>
                  <Button onClick={handleSearch} variant="outline">
                    Search Again
                  </Button>
                </div>
              ) : (
                <div className="bg-card rounded-lg shadow-sm border p-8 text-center">
                  <Car className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
                  <h3 className="text-xl font-medium mb-4">Welcome to Copart Sales History</h3>
                  <p className="text-muted-foreground mb-6">
                    Enter your search criteria on the left to explore comprehensive auction data and market insights.
                  </p>
                </div>
              )}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}