import { useState } from 'react';
import { useSalesHistory, FilterState } from '../hooks/useSalesHistory';
import ErrorBoundary from '../components/ui/error-boundary';
import { Link } from 'wouter';
import SalesTimeline from '../components/sales/SalesTimeline';

// Tab enum for better organization
enum TabType {
  TIMELINE = "timeline",
  TABLE = "table",
  PHOTOS = "photos"
}

// Get current year for the year picker default value
const currentYear = new Date().getFullYear();

export default function Home() {
  // Primary search parameters
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('');
  const [yearFrom, setYearFrom] = useState(currentYear - 5);
  const [yearTo, setYearTo] = useState(currentYear);
  const [sites, setSites] = useState<string[]>(['copart', 'iaai']);
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
  
  // Helper function to calculate average price from sales history
  const calculateAveragePrice = (salesHistory: any[] = []) => {
    if (!salesHistory || salesHistory.length === 0) return 0;
    
    const salesWithPrices = salesHistory.filter(sale => sale.purchase_price !== undefined);
    if (salesWithPrices.length === 0) return 0;
    
    const total = salesWithPrices.reduce((sum, sale) => sum + (sale.purchase_price || 0), 0);
    return total / salesWithPrices.length;
  };

  // Fetch data - will only execute when triggered by button click
  const { data, isLoading, error, refetch } = useSalesHistory(filterState);
  
  const handleSearch = () => {
    setPage(1); // Reset to first page on new search
    setHasSearched(true); // Mark that a search has been performed
    refetch() // Explicitly trigger the data fetch
      .then(result => {
        // Add debugging to see what data we're getting back
        console.log("Received data:", result);
        // Update total results count for pagination
        if (result.data && result.data.pagination) {
          setTotalResults(result.data.pagination.totalCount);
        } else if (result.data && result.data.salesHistory) {
          // Fallback to length of current results if no pagination info
          setTotalResults(result.data.salesHistory.length);
        }
      });
  };
  
  // Handle page change - fetch new data with updated page number
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Refetch with new page number
    refetch().then(result => {
      console.log("Received data:", result);
      if (result.data && result.data.pagination) {
        setTotalResults(result.data.pagination.totalCount);
      } else if (result.data && result.data.salesHistory) {
        // Fallback to length of current results if no pagination info
        setTotalResults(result.data.salesHistory.length);
      }
    });
  };
  
  // Location options for dropdown
  const locationOptions = [
    "All Locations",
    "Abilene, TX",
    "Adelanto, CA",
    "Albuquerque, NM",
    "Altoona, PA",
    "Amarillo, TX",
    "Anchorage, AK",
    "Appleton, WI",
    "Atlanta East, GA",
    "Atlanta North, GA",
    "Atlanta South, GA",
    "Austin, TX",
    "Bakersfield, CA",
    "Baltimore, MD",
    "Baton Rouge, LA",
    "Billings, MT",
    "Birmingham, AL",
    "Bismarck, ND",
    "Boise, ID",
    "Boston-Shirley, MA"
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-blue-600 text-white">
        <div className="container mx-auto px-4 py-3">
          <h1 className="text-2xl font-bold">Vehicle Sales History Finder</h1>
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
            
            {/* Auction sources */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Auction Sites
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={sites.includes('copart')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSites([...sites, 'copart']);
                      } else {
                        setSites(sites.filter(s => s !== 'copart'));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Copart</span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={sites.includes('iaai')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSites([...sites, 'iaai']);
                      } else {
                        setSites(sites.filter(s => s !== 'iaai'));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">IAAI</span>
                </label>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="button"
                onClick={handleSearch}
                className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Search Vehicle History
              </button>
            </div>
          </div>
        </div>
        
        {/* Results Area */}
        <ErrorBoundary>
          {!hasSearched ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-gray-700 dark:text-gray-300">
                Fill in your search criteria above and click "Search Vehicle History" to view results.
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-700 dark:text-gray-300">Loading sales history data...</p>
            </div>
          ) : error ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Unable to load data</h2>
                  <p className="text-red-600 dark:text-red-300 mt-2">
                    There was an error fetching the sales history. Please check your search parameters and try again.
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
          ) : ((console.log("Received data:", data)), data?.success && data?.data?.salesHistory && data.data.salesHistory.length > 0) ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {/* Results Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6 flex flex-wrap items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {data?.data?.salesHistory.length} Results for {make} {model} {yearFrom && yearTo ? `(${yearFrom}-${yearTo})` : ''}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Average sold price: ${Math.round(calculateAveragePrice(data?.data?.salesHistory)).toLocaleString()}
                  </p>
                </div>
                
                {/* Tab navigation */}
                <div className="flex mt-2 sm:mt-0">
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === TabType.TIMELINE
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab(TabType.TIMELINE)}
                  >
                    Timeline
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === TabType.TABLE
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab(TabType.TABLE)}
                  >
                    Table View
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === TabType.PHOTOS
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab(TabType.PHOTOS)}
                  >
                    Photo Grid
                  </button>
                </div>
              </div>
              
              {/* Result content based on active tab */}
              {activeTab === TabType.TIMELINE && (
                <div className="p-4">
                  <SalesTimeline 
                    salesHistory={data?.data?.salesHistory || []}
                    priceTrend={data?.data?.priceTrend || []}
                  />
                </div>
              )}
              
              {activeTab === TabType.TABLE && (
                <div className="flex flex-col lg:flex-row">
                  {/* Secondary filters sidebar (appears after search results) */}
                  <div className="w-full lg:w-56 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="font-medium text-sm mb-4 text-gray-700 dark:text-gray-300">SALE FILTERS</h3>
                    
                    {/* Vehicle info filters */}
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Vehicle title type
                        </label>
                        <select className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                          <option>All title types</option>
                          <option>Clean Title</option>
                          <option>Salvage Title</option>
                          <option>Rebuilt/Rebuildable</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Year
                        </label>
                        <select className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                          <option>All years</option>
                          {Array.from({ length: 10 }, (_, i) => currentYear - i).map(year => (
                            <option key={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Vehicle condition type
                        </label>
                        <select className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                          <option>All conditions</option>
                          <option>Run & Drive</option>
                          <option>Engine Start</option>
                          <option>Non-Running</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Damage type
                        </label>
                        <select className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                          <option>All damage types</option>
                          <option>Front End</option>
                          <option>Rear End</option>
                          <option>Side</option>
                          <option>Minor Dent/Scratches</option>
                          <option>Undercarriage</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Odometer
                        </label>
                        <select className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                          <option>All mileages</option>
                          <option>Under 25,000 miles</option>
                          <option>25,001 - 50,000 miles</option>
                          <option>50,001 - 100,000 miles</option>
                          <option>100,001 - 150,000 miles</option>
                          <option>Over 150,000 miles</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Technical filters */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Engine type
                        </label>
                        <select className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                          <option>All engines</option>
                          <option>4 Cylinder</option>
                          <option>6 Cylinder</option>
                          <option>8 Cylinder</option>
                          <option>Hybrid</option>
                          <option>Electric</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Transmission
                        </label>
                        <select className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                          <option>All transmissions</option>
                          <option>Automatic</option>
                          <option>Manual</option>
                          <option>CVT</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Fuel type
                        </label>
                        <select className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                          <option>All fuel types</option>
                          <option>Gasoline</option>
                          <option>Diesel</option>
                          <option>Hybrid</option>
                          <option>Electric</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Drive train
                        </label>
                        <select className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                          <option>All drive types</option>
                          <option>AWD</option>
                          <option>FWD</option>
                          <option>RWD</option>
                          <option>4WD</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Auction location
                        </label>
                        <select className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                          <option>All locations</option>
                          <option>FL - MIAMI CENTRAL</option>
                          <option>FL - MIAMI SOUTH</option>
                          <option>NY - LONG ISLAND</option>
                          <option>CA - LOS ANGELES</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Sale date
                        </label>
                        <select className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                          <option>All dates</option>
                          <option>Last 7 days</option>
                          <option>Last 30 days</option>
                          <option>Last 90 days</option>
                          <option>Last 6 months</option>
                          <option>Last year</option>
                        </select>
                      </div>
                      
                      <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm">
                        Apply Filters
                      </button>
                    </div>
                  </div>
                  
                  {/* Sales Results Table */}
                  <div className="flex-1 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Vehicle
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Odometer
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Title/Damage
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Location
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Sale Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Current Bid
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {data.data.salesHistory.map((sale) => (
                          <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {sale.link_img_small && sale.link_img_small.length > 0 ? (
                                  <img 
                                    src={sale.link_img_small[0]} 
                                    alt={`${sale.year} ${sale.make} ${sale.model}`}
                                    className="h-16 w-24 rounded-sm mr-3 object-cover"
                                  />
                                ) : (
                                  <div className="h-16 w-24 rounded-sm bg-gray-200 dark:bg-gray-700 mr-3 flex items-center justify-center">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">No image</span>
                                  </div>
                                )}
                                <div>
                                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                    {sale.year} {sale.make} {sale.model} {sale.series}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Lot# {sale.lot_id || "N/A"}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    VIN: {sale.vin ? sale.vin.substring(0, 8) + '...' : 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {sale.odometer ? `${sale.odometer.toLocaleString()} mi` : 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {sale.odometer ? '(ACTUAL)' : '(NOT ACTUAL)'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {sale.title || sale.vehicle_title || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {sale.damage_pr || sale.vehicle_damage || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                {(sale.base_site === 'copart' ? 'COPART: ' : 'IAAI: ') + (sale.location || sale.auction_location || sale.buyer_state || 'Unknown')}
                              </div>
                              {sale.buyer_state && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {sale.buyer_state}/{sale.buyer_country}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {new Date(sale.sale_date).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {sale.sale_status}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {sale.purchase_price ? `$${sale.purchase_price.toLocaleString()} USD` : 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Item# {sale.id.substring(0, 4)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-xs">
                                View Details
                              </button>
                              {sale.link && (
                                <a 
                                  href={sale.link} 
                                  target="_blank"
                                  rel="noopener noreferrer" 
                                  className="block mt-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  View Sale List
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {activeTab === TabType.PHOTOS && (
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {data.data.salesHistory.map((sale) => (
                      <div key={sale.id} className="bg-white dark:bg-gray-700 rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="h-48 w-full bg-gray-200 dark:bg-gray-600 relative">
                          {sale.link_img_hd && sale.link_img_hd.length > 0 ? (
                            <img 
                              src={sale.link_img_hd[0]} 
                              alt={`${sale.year} ${sale.make} ${sale.model}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <span className="text-sm text-gray-500 dark:text-gray-400">No image available</span>
                            </div>
                          )}
                          
                          <div className="absolute top-2 right-2">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              sale.sale_status === 'SOLD' || sale.sale_status === 'Sold'
                                ? 'bg-green-100 text-green-800'
                                : sale.sale_status === 'ON APPROVAL'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {sale.sale_status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {sale.year} {sale.make} {sale.model} {sale.series}
                          </h3>
                          
                          <div className="mt-2 flex justify-between items-center">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {sale.odometer ? `${sale.odometer.toLocaleString()} mi` : 'N/A'} • {sale.damage_pr || 'Unknown Damage'}
                            </div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {sale.purchase_price ? `$${sale.purchase_price.toLocaleString()}` : 'N/A'}
                            </div>
                          </div>
                          
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Sold: {new Date(sale.sale_date).toLocaleDateString()} • {sale.location || sale.buyer_state || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Pagination */}
              <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
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
                        {Math.min(page * resultsPerPage, 
                          (data?.data?.pagination?.totalCount || data?.data?.salesHistory?.length || 0))}
                      </span> of{' '}
                      <span className="font-medium">
                        {data?.data?.pagination?.totalCount || totalResults || 0}
                      </span> results
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* Results per page selector */}
                    <div className="flex items-center">
                      <label htmlFor="resultsPerPage" className="text-sm text-gray-700 dark:text-gray-300 mr-2">
                        Per page:
                      </label>
                      <select
                        id="resultsPerPage"
                        value={resultsPerPage}
                        onChange={(e) => {
                          setResultsPerPage(Number(e.target.value));
                          // Reset to page 1 when changing results per page
                          setPage(1);
                          // Refetch with new page size
                          setTimeout(() => refetch(), 0);
                        }}
                        className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm py-1 px-2"
                      >
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="25">25</option>
                      </select>
                    </div>
                  
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(Math.max(1, page - 1))}
                        disabled={page <= 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {Array.from({ length: Math.min(5, Math.ceil(totalResults / resultsPerPage) || 1) }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => handlePageChange(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border ${
                            page === i + 1
                              ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-200'
                              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                          } text-sm font-medium`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= Math.ceil(totalResults / resultsPerPage) || totalResults === 0}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
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
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No sales history found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Try adjusting your search criteria or select a different make and model.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Search Again
                  </button>
                </div>
              </div>
            </div>
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
}