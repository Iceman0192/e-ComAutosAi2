import { useState } from 'react';
import { useSalesHistory, FilterState } from '../hooks/useSalesHistory';
import ErrorBoundary from '../components/ui/error-boundary';
import { Link } from 'wouter';
import SalesTimeline from '../components/sales/SalesTimeline';
import { formatCurrency } from '../utils/formatters';

// Tab enum for better organization
enum TabType {
  TIMELINE = "timeline",
  TABLE = "table",
  PHOTOS = "photos"
}

// Get current year for the year picker default value
const currentYear = new Date().getFullYear();

export default function IAAIPage() {
  // Primary search parameters
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('');
  const [yearFrom, setYearFrom] = useState(currentYear - 5);
  const [yearTo, setYearTo] = useState(currentYear);
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
  
  // Combine filter state for API request - HARDCODED TO IAAI ONLY
  const filterState: FilterState = {
    make,
    model,
    year_from: yearFrom,
    year_to: yearTo,
    sites: ['iaai'], // HARDCODED TO IAAI ONLY
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
  
  // Use the sales history hook
  const { data, isLoading, error, refetch } = useSalesHistory(filterState, hasSearched);
  
  // Update search results when data changes
  if (data && data !== searchResults) {
    setSearchResults(data);
  }
  
  // Handle search
  const handleSearch = () => {
    setHasSearched(true);
    setPage(1); // Reset to first page
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* IAAI Header with Red Branding */}
      <header className="bg-red-600 text-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">IAAI Vehicle Sales History</h1>
            <Link href="/" className="text-red-200 hover:text-white transition-colors">
              ← Back to Copart
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Search Filters Card with Red Accents */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6 border-t-4 border-red-600">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <span className="inline-block w-3 h-3 bg-red-600 rounded-full mr-3"></span>
              Search IAAI Vehicle Sales History
            </h2>
            
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
                </select>
              </div>

              {/* Year From */}
              <div>
                <label htmlFor="yearFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Year From
                </label>
                <select
                  id="yearFrom"
                  value={yearFrom}
                  onChange={(e) => setYearFrom(parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {Array.from({ length: 25 }, (_, i) => currentYear - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Year To */}
              <div>
                <label htmlFor="yearTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Year To
                </label>
                <select
                  id="yearTo"
                  value={yearTo}
                  onChange={(e) => setYearTo(parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {Array.from({ length: 25 }, (_, i) => currentYear - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Auction Date From */}
              <div>
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

              {/* Auction Date To */}
              <div>
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
            
            <div className="mt-6">
              <button
                type="button"
                onClick={handleSearch}
                className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Search IAAI History
              </button>
            </div>
          </div>
        </div>
        
        {/* Results Area */}
        <ErrorBoundary>
          {!hasSearched ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-gray-700 dark:text-gray-300">
                Fill in your search criteria above and click "Search IAAI History" to view results.
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-700 dark:text-gray-300">Loading IAAI sales history data...</p>
            </div>
          ) : error ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Unable to load IAAI data</h2>
                  <p className="text-red-600 dark:text-red-300 mt-2">
                    There was an error fetching the IAAI sales history. Please check your search parameters and try again.
                  </p>
                  <button
                    onClick={() => refetch()}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          ) : hasSearched && searchResults?.success && searchResults?.data?.salesHistory && searchResults.data.salesHistory.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {/* Results Header with Red Branding */}
              <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6 flex flex-wrap items-center justify-between bg-red-50 dark:bg-red-900/10">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {searchResults?.data?.salesHistory.length || 0} IAAI Results for {make} {model} {yearFrom && yearTo ? `(${yearFrom}-${yearTo})` : ''}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Average sold price: {formatCurrency(calculateAveragePrice(searchResults?.data?.salesHistory))}
                  </p>
                </div>
                
                {/* Tab navigation with Red Theme */}
                <div className="flex mt-2 sm:mt-0">
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === TabType.TIMELINE
                        ? 'bg-red-600 text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab(TabType.TIMELINE)}
                  >
                    Timeline
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === TabType.TABLE
                        ? 'bg-red-600 text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab(TabType.TABLE)}
                  >
                    Table View
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === TabType.PHOTOS
                        ? 'bg-red-600 text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab(TabType.PHOTOS)}
                  >
                    Photos
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === TabType.TIMELINE && (
                  <SalesTimeline 
                    salesHistory={searchResults?.data?.salesHistory || []} 
                    primaryColor="#dc2626" // Red color for IAAI
                  />
                )}
                
                {activeTab === TabType.TABLE && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Vehicle
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Sale Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {searchResults?.data?.salesHistory.map((sale: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {sale.year} {sale.make} {sale.model}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {sale.vin}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {new Date(sale.sale_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(sale.purchase_price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {sale.auction_location}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                sale.sale_status === 'Sold' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {sale.sale_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {activeTab === TabType.PHOTOS && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults?.data?.salesHistory.map((sale: any, index: number) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        {sale.link_img_small && sale.link_img_small.length > 0 ? (
                          <img 
                            src={sale.link_img_small[0]} 
                            alt={`${sale.year} ${sale.make} ${sale.model}`}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-gray-500 dark:text-gray-400">No Image</span>
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {sale.year} {sale.make} {sale.model}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatCurrency(sale.purchase_price)} • {sale.sale_status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : hasSearched ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-gray-700 dark:text-gray-300">
                No IAAI sales history found for the specified criteria.
              </p>
            </div>
          ) : null}
        </ErrorBoundary>
      </main>
    </div>
  );
}