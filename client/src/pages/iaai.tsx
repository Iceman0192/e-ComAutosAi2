import { useState } from 'react';
import { useSalesHistory, FilterState } from '../hooks/useSalesHistory';
import ErrorBoundary from '../components/ui/error-boundary';
import { Link } from 'wouter';
import SalesTimeline from '../components/sales/SalesTimeline';
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

export default function IAAI() {
  // Primary search parameters - HARDCODED for IAAI
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('');
  const [vin, setVin] = useState('');
  const [yearFrom, setYearFrom] = useState(currentYear - 5);
  const [yearTo, setYearTo] = useState(currentYear);
  const [sites, setSites] = useState<string[]>(['iaai']); // HARDCODED for IAAI
  const [condition, setCondition] = useState<string>('all');
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
  const [resultsPerPage, setResultsPerPage] = useState(25);
  const [totalResults, setTotalResults] = useState(0);
  
  // UI state
  const [activeTab, setActiveTab] = useState<TabType>(TabType.TIMELINE);
  
  // State to track if a search has been performed
  const [hasSearched, setHasSearched] = useState(false);
  
  // Helper function to calculate average price from sales history
  const calculateAveragePrice = (salesHistory: any[] = []) => {
    if (!salesHistory || salesHistory.length === 0) return 0;
    
    const salesWithPrices = salesHistory.filter(sale => sale.purchase_price !== undefined);
    if (salesWithPrices.length === 0) return 0;
    
    const total = salesWithPrices.reduce((sum, sale) => {
      const price = typeof sale.purchase_price === 'string' 
        ? parseFloat(sale.purchase_price) 
        : (sale.purchase_price || 0);
      return sum + price;
    }, 0);
    return total / salesWithPrices.length;
  };

  // State to hold the actual results data
  const [searchResults, setSearchResults] = useState<any>(null);
  
  // State for detailed vehicle modal
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Function to open vehicle details modal
  const openVehicleDetails = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setCurrentImageIndex(0);
    setIsModalOpen(true);
  };
  
  // Function to close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
    setCurrentImageIndex(0);
  };
  
  // Image navigation functions
  const nextImage = () => {
    if (selectedVehicle && selectedVehicle.link_img_hd) {
      setCurrentImageIndex((prev) => 
        prev < selectedVehicle.link_img_hd.length - 1 ? prev + 1 : 0
      );
    }
  };
  
  const prevImage = () => {
    if (selectedVehicle && selectedVehicle.link_img_hd) {
      setCurrentImageIndex((prev) => 
        prev > 0 ? prev - 1 : selectedVehicle.link_img_hd.length - 1
      );
    }
  };
  
  const handleSearch = () => {
    setPage(1); // Reset to first page on new search
    setHasSearched(true); // Mark that a search has been performed
    
    // Build parameters for initial search - HARDCODED for IAAI (site=2)
    const params = new URLSearchParams();
    params.append('make', make);
    if (model) params.append('model', model);
    if (yearFrom) params.append('year_from', yearFrom.toString());
    if (yearTo) params.append('year_to', yearTo.toString());
    params.append('page', '1');
    params.append('size', resultsPerPage.toString());
    params.append('sale_date_from', auctionDateFrom);
    params.append('sale_date_to', auctionDateTo);
    
    // HARDCODED for IAAI ONLY
    params.append('site', '2'); // IAAI site ID
    
    console.log(`Initial IAAI search with params:`, params.toString());
    
    // Make direct fetch request to dedicated IAAI endpoint
    fetch(`/api/iaai/sales-history?${params.toString()}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(result => {
        console.log("Received initial IAAI search data:", result);
        
        // Only update if successful
        if (result && result.success && result.data) {
          // Store results in local state
          setSearchResults(result);
          
          // Update total results count for pagination
          if (result.data.pagination && result.data.pagination.totalCount) {
            setTotalResults(result.data.pagination.totalCount);
          } else if (result.data.salesHistory && result.data.salesHistory.length > 0) {
            // If we got a full page, assume there are more results
            const displayedCount = result.data.salesHistory.length;
            if (displayedCount === resultsPerPage) {
              setTotalResults(resultsPerPage * 2); // Assume at least 2 pages
            } else {
              setTotalResults(displayedCount);
            }
          } else {
            // No results found
            setTotalResults(0);
          }
        } else {
          console.error("Invalid response format:", result);
          setSearchResults(null);
          setTotalResults(0);
        }
      })
      .catch(error => {
        console.error("Error during IAAI search:", error);
      });
  };
  
  // Handle page change - fetch new data with updated page number
  const handlePageChange = (newPage: number) => {
    // Update current page state
    setPage(newPage);
    
    // Build complete URL parameters for API request - HARDCODED for IAAI
    const params = new URLSearchParams();
    params.append('make', make);
    if (model) params.append('model', model);
    if (yearFrom) params.append('year_from', yearFrom.toString());
    if (yearTo) params.append('year_to', yearTo.toString());
    params.append('page', newPage.toString());
    params.append('size', resultsPerPage.toString());
    params.append('sale_date_from', auctionDateFrom);
    params.append('sale_date_to', auctionDateTo);
    
    // HARDCODED for IAAI ONLY
    params.append('site', '2'); // IAAI site ID
    
    console.log(`Requesting IAAI page ${newPage} with params:`, params.toString());
    
    // Make direct fetch request to dedicated IAAI endpoint
    fetch(`/api/iaai/sales-history?${params.toString()}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(result => {
        console.log("Received IAAI data for page", newPage, result);
        
        // Only update if successful
        if (result.success && result.data) {
          // Store results in local state
          setSearchResults(result);
          
          // Make sure we're showing search has been performed
          setHasSearched(true);
          
          // Update total results count for pagination
          if (result.data.pagination && result.data.pagination.totalCount) {
            setTotalResults(result.data.pagination.totalCount);
          } else if (result.data.salesHistory) {
            // If we have more results than just this page, estimate there are more
            const displayedCount = result.data.salesHistory.length;
            if (displayedCount === resultsPerPage) {
              // If we got a full page, assume there are at least more pages available
              setTotalResults(Math.max(newPage * resultsPerPage + resultsPerPage, totalResults));
            } else {
              // If we got a partial page, we can calculate the exact total
              setTotalResults((newPage - 1) * resultsPerPage + displayedCount);
            }
          }
        }
      })
      .catch(error => {
        console.error("Error fetching IAAI page", newPage, error);
      });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - RED branding for IAAI */}
      <header className="bg-red-600 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">IAAI Vehicle Sales History</h1>
            <PlatformToggle />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Search Filters Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Search Vehicle Sales History</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Make - Required */}
              <div>
                <label htmlFor="make" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Make <span className="text-red-500">*</span>
                </label>
                <select
                  id="make"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select Make</option>
                  <option value="Toyota">Toyota</option>
                  <option value="Honda">Honda</option>
                  <option value="Ford">Ford</option>
                  <option value="Chevrolet">Chevrolet</option>
                  <option value="Nissan">Nissan</option>
                  <option value="BMW">BMW</option>
                  <option value="Mercedes-Benz">Mercedes-Benz</option>
                  <option value="Lexus">Lexus</option>
                  <option value="Audi">Audi</option>
                  <option value="Jeep">Jeep</option>
                </select>
              </div>
              
              {/* Model */}
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model
                </label>
                <select
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">All Models</option>
                  {make === 'Toyota' && (
                    <>
                      <option value="Camry">Camry</option>
                      <option value="Corolla">Corolla</option>
                      <option value="RAV4">RAV4</option>
                      <option value="Tacoma">Tacoma</option>
                      <option value="Highlander">Highlander</option>
                      <option value="4Runner">4Runner</option>
                    </>
                  )}
                  {make === 'Honda' && (
                    <>
                      <option value="Civic">Civic</option>
                      <option value="Accord">Accord</option>
                      <option value="CR-V">CR-V</option>
                      <option value="Pilot">Pilot</option>
                    </>
                  )}
                  {make === 'Ford' && (
                    <>
                      <option value="F-150">F-150</option>
                      <option value="Escape">Escape</option>
                      <option value="Explorer">Explorer</option>
                      <option value="Mustang">Mustang</option>
                    </>
                  )}
                </select>
              </div>
              
              {/* Year Range */}
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label htmlFor="yearFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Year From
                  </label>
                  <select
                    id="yearFrom"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {Array.from({ length: 30 }, (_, i) => currentYear - 29 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label htmlFor="yearTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Year To
                  </label>
                  <select
                    id="yearTo"
                    value={yearTo}
                    onChange={(e) => setYearTo(parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {Array.from({ length: 30 }, (_, i) => currentYear - 29 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Auction Date Range */}
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label htmlFor="auctionDateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Auction Date From
                  </label>
                  <input
                    type="date"
                    id="auctionDateFrom"
                    value={auctionDateFrom}
                    onChange={(e) => setAuctionDateFrom(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="auctionDateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Auction Date To
                  </label>
                  <input
                    type="date"
                    id="auctionDateTo"
                    value={auctionDateTo}
                    onChange={(e) => setAuctionDateTo(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
            

            
            {/* Search Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleSearch}
                disabled={!make}
                className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Search Vehicle History
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {!hasSearched && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Fill in your search criteria above and click "Search Vehicle History" to view results.
          </div>
        )}

        {hasSearched && searchResults && searchResults.data && (
          <div className="space-y-6">
            {/* Results Summary with Display Options */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {searchResults.data.salesHistory.length} Results for {make} {model} ({yearFrom}-{yearTo})
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Average sold price: {formatCurrency(calculateAveragePrice(searchResults.data.salesHistory))}
                </div>
              </div>
              
              {/* Display Tabs */}
              <div className="flex space-x-1 mb-4">
                <button
                  onClick={() => setActiveTab(TabType.TIMELINE)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === TabType.TIMELINE
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setActiveTab(TabType.TABLE)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === TabType.TABLE
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Table View
                </button>
                <button
                  onClick={() => setActiveTab(TabType.PHOTOS)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === TabType.PHOTOS
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Photo Grid
                </button>
              </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === TabType.TIMELINE && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="p-6">
                  <SalesTimeline salesHistory={searchResults.data.salesHistory} priceTrend={[]} />
                </div>
              </div>
            )}

            {activeTab === TabType.TABLE && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                {/* Enhanced Filters Section */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">SALE FILTERS</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Vehicle title type</label>
                      <select className="w-full text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option>All title types</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Year</label>
                      <select className="w-full text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option>All years</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Vehicle condition type</label>
                      <select className="w-full text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option>All conditions</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Damage type</label>
                      <select className="w-full text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option>All damage types</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Odometer</label>
                      <select className="w-full text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option>All mileages</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Engine type</label>
                      <select className="w-full text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option>All engines</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Enhanced Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          VEHICLE
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          ODOMETER
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          TITLE/DAMAGE
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          LOCATION
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          SALE DATE
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {searchResults.data.salesHistory.map((sale: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors" onClick={() => openVehicleDetails(sale)}>
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              {/* Vehicle Image */}
                              <div className="flex-shrink-0 h-16 w-20 mr-4 relative">
                                {(() => {
                                  // Enhanced image handling - try multiple sources
                                  let imageUrl = '';
                                  if (sale.link_img_small && sale.link_img_small.length > 0) {
                                    imageUrl = sale.link_img_small[0];
                                  } else if (sale.link_img_hd && sale.link_img_hd.length > 0) {
                                    imageUrl = sale.link_img_hd[0];
                                  }
                                  
                                  return imageUrl ? (
                                    <img 
                                      src={imageUrl} 
                                      alt={`${sale.year} ${sale.make} ${sale.model}`}
                                      className="h-16 w-20 object-cover rounded-lg border border-red-200 dark:border-red-700 shadow-sm"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const placeholder = target.nextElementSibling as HTMLElement;
                                        if (placeholder) placeholder.style.display = 'flex';
                                      }}
                                    />
                                  ) : null;
                                })()}
                                <div 
                                  className="h-16 w-20 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg border border-red-200 dark:border-red-700 flex items-center justify-center"
                                  style={{ 
                                    display: (sale.link_img_small?.length > 0 || sale.link_img_hd?.length > 0) ? 'none' : 'flex'
                                  }}
                                >
                                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-red-600 dark:text-red-400">
                                  {sale.year} {sale.make} {sale.model} {sale.series}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Lot {sale.lot_id}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  VIN: {sale.vin}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {sale.vehicle_mileage || sale.odometer ? 
                                `${(sale.vehicle_mileage || sale.odometer).toLocaleString()} mi` : 
                                'N/A'
                              }
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {sale.vehicle_mileage || sale.odometer ? '(ACTUAL)' : ''}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900 dark:text-white font-medium">
                              {sale.vehicle_title || sale.title || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {sale.vehicle_damage || sale.damage_pr || 'Normal Wear'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                              IAAI: {sale.auction_location || sale.location || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {new Date(sale.sale_date).toLocaleDateString()}
                            </div>
                            <div className="text-xs">
                              <span className={`inline-flex px-2 py-1 rounded-full ${
                                sale.sale_status === 'sold' || sale.sale_status === 'Sold'
                                  ? 'bg-green-100 text-green-800' 
                                  : sale.sale_status === 'ON APPROVAL'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {sale.sale_status === 'ON APPROVAL' ? 'ON APPROVAL' : sale.sale_status}
                              </span>
                            </div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                              {sale.purchase_price ? formatCurrency(sale.purchase_price) : 'N/A'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === TabType.PHOTOS && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.data.salesHistory.map((sale: any, index: number) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      {/* Vehicle Image */}
                      {sale.link_img_small && sale.link_img_small.length > 0 ? (
                        <img 
                          src={sale.link_img_small[0]} 
                          alt={`${sale.year} ${sale.make} ${sale.model}`}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-gray-500 dark:text-gray-400">No Image Available</span>
                        </div>
                      )}
                      
                      {/* Vehicle Details */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {sale.year} {sale.make} {sale.model}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          VIN: {sale.vin}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {sale.purchase_price ? formatCurrency(sale.purchase_price) : 'N/A'}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            sale.sale_status === 'sold' || sale.sale_status === 'Sold'
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {sale.sale_status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {sale.auction_location || sale.location || 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination - Cohesive design with Copart (Red branding) */}
            {totalResults > resultsPerPage && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 rounded-lg shadow-md">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing <span className="font-medium">{(page - 1) * resultsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min((page * resultsPerPage), totalResults)}
                      </span> of{' '}
                      <span className="font-medium">{totalResults}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-red-100 dark:bg-red-900 text-sm font-bold text-red-600 dark:text-red-200">
                        Page {page}
                      </span>
                      
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {hasSearched && searchResults && (!searchResults.data || !searchResults.data.salesHistory || searchResults.data.salesHistory.length === 0) && (
          <div className="text-center py-12">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
              No IAAI results found for your search criteria. Try adjusting your filters or date range.
            </div>
          </div>
        )}

        {/* Detailed Vehicle Modal */}
        {isModalOpen && selectedVehicle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model} {selectedVehicle.series}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Images and Basic Info */}
                  <div>
                    {/* Vehicle Images - Interactive Gallery */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Vehicle Photos</h3>
                      {selectedVehicle.link_img_hd && selectedVehicle.link_img_hd.length > 0 ? (
                        <div>
                          {/* Main Image Display */}
                          <div className="relative mb-4">
                            <img
                              src={selectedVehicle.link_img_hd[currentImageIndex]}
                              alt={`${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model} - Image ${currentImageIndex + 1}`}
                              className="w-full h-80 object-cover rounded-lg border"
                            />
                            
                            {/* Image Counter */}
                            <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                              {currentImageIndex + 1} of {selectedVehicle.link_img_hd.length}
                            </div>
                            
                            {/* Navigation Arrows */}
                            {selectedVehicle.link_img_hd.length > 1 && (
                              <>
                                <button
                                  onClick={prevImage}
                                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-full transition-all"
                                >
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={nextImage}
                                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-full transition-all"
                                >
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                          
                          {/* Thumbnail Gallery */}
                          {selectedVehicle.link_img_hd.length > 1 && (
                            <div className="flex space-x-2 overflow-x-auto pb-2">
                              {selectedVehicle.link_img_hd.map((img: string, index: number) => (
                                <button
                                  key={index}
                                  onClick={() => setCurrentImageIndex(index)}
                                  className={`flex-shrink-0 w-20 h-16 rounded border-2 overflow-hidden ${
                                    currentImageIndex === index 
                                      ? 'border-red-500 ring-2 ring-red-200' 
                                      : 'border-gray-300 hover:border-red-300'
                                  }`}
                                >
                                  <img
                                    src={img}
                                    alt={`Thumbnail ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-64 bg-gray-200 dark:bg-gray-600 rounded-lg border flex items-center justify-center">
                          <span className="text-gray-500 dark:text-gray-400">No images available</span>
                        </div>
                      )}
                    </div>

                    {/* Sale Information */}
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">Sale Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-red-700 dark:text-red-300">Sale Price:</span>
                          <span className="font-bold text-red-900 dark:text-red-100">
                            {selectedVehicle.purchase_price ? formatCurrency(selectedVehicle.purchase_price) : 'Not sold'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-700 dark:text-red-300">Sale Date:</span>
                          <span className="text-red-900 dark:text-red-100">
                            {new Date(selectedVehicle.sale_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-700 dark:text-red-300">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            selectedVehicle.sale_status === 'sold' || selectedVehicle.sale_status === 'Sold'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedVehicle.sale_status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-700 dark:text-red-300">Lot ID:</span>
                          <span className="text-red-900 dark:text-red-100">{selectedVehicle.lot_id}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Specifications */}
                  <div>
                    {/* Vehicle Specifications */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Vehicle Specifications</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">VIN:</span>
                            <p className="font-mono text-sm text-gray-900 dark:text-white">{selectedVehicle.vin}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Year:</span>
                            <p className="text-gray-900 dark:text-white">{selectedVehicle.year}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Make:</span>
                            <p className="text-gray-900 dark:text-white">{selectedVehicle.make}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Model:</span>
                            <p className="text-gray-900 dark:text-white">{selectedVehicle.model}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Series:</span>
                            <p className="text-gray-900 dark:text-white">{selectedVehicle.series || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Trim:</span>
                            <p className="text-gray-900 dark:text-white">{selectedVehicle.trim || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Odometer:</span>
                            <p className="text-gray-900 dark:text-white">
                              {selectedVehicle.vehicle_mileage || selectedVehicle.odometer ? 
                                `${(selectedVehicle.vehicle_mileage || selectedVehicle.odometer).toLocaleString()} mi` : 
                                'N/A'
                              }
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Color:</span>
                            <p className="text-gray-900 dark:text-white">{selectedVehicle.color || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Transmission:</span>
                            <p className="text-gray-900 dark:text-white">{selectedVehicle.transmission || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Drive Type:</span>
                            <p className="text-gray-900 dark:text-white">{selectedVehicle.drive || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Fuel Type:</span>
                            <p className="text-gray-900 dark:text-white">{selectedVehicle.fuel || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Keys:</span>
                            <p className="text-gray-900 dark:text-white">{selectedVehicle.keys || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Damage and Title Information */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Condition & Title</h3>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 space-y-3">
                        <div>
                          <span className="text-sm text-yellow-700 dark:text-yellow-300">Title Status:</span>
                          <p className="text-yellow-900 dark:text-yellow-100 font-medium">
                            {selectedVehicle.vehicle_title || selectedVehicle.title || 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-yellow-700 dark:text-yellow-300">Primary Damage:</span>
                          <p className="text-yellow-900 dark:text-yellow-100 font-medium">
                            {selectedVehicle.vehicle_damage || selectedVehicle.damage_pr || 'Unknown'}
                          </p>
                        </div>
                        {selectedVehicle.damage_sec && (
                          <div>
                            <span className="text-sm text-yellow-700 dark:text-yellow-300">Secondary Damage:</span>
                            <p className="text-yellow-900 dark:text-yellow-100 font-medium">{selectedVehicle.damage_sec}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-sm text-yellow-700 dark:text-yellow-300">Has Keys:</span>
                          <p className="text-yellow-900 dark:text-yellow-100 font-medium">
                            {selectedVehicle.vehicle_has_keys ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Location Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Location</h3>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <div>
                          <span className="text-sm text-blue-700 dark:text-blue-300">Auction Location:</span>
                          <p className="text-blue-900 dark:text-blue-100 font-medium">
                            IAAI: {selectedVehicle.auction_location || selectedVehicle.location || 'N/A'}
                          </p>
                        </div>
                        {selectedVehicle.link && (
                          <div className="mt-3">
                            <a
                              href={selectedVehicle.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              View Original IAAI Listing
                              <svg className="ml-2 -mr-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}