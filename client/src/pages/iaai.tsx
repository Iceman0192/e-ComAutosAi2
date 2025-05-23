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
    
    const total = salesWithPrices.reduce((sum, sale) => sum + (sale.purchase_price || 0), 0);
    return total / salesWithPrices.length;
  };

  // State to hold the actual results data
  const [searchResults, setSearchResults] = useState<any>(null);
  
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
        <div className="container mx-auto px-4 py-3">
          <h1 className="text-2xl font-bold">Vehicle Sales History Finder - IAAI</h1>
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
            
            {/* Auction Sites - Navigation Radio Buttons */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Auction Sites
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="auctionSite"
                    value="copart"
                    checked={false}
                    onChange={() => window.location.href = '/'}
                    className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Copart</span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="auctionSite"
                    value="iaai"
                    checked={true}
                    readOnly
                    className="form-radio h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">IAAI</span>
                </label>
              </div>
            </div>
            
            {/* Search Button */}
            <div className="mt-6">
              <button
                onClick={handleSearch}
                disabled={!make}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-md transition-colors"
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
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
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
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Location
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {searchResults.data.salesHistory.map((sale: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {sale.year} {sale.make} {sale.model}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              VIN: {sale.vin}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(sale.sale_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {sale.purchase_price ? formatCurrency(sale.purchase_price) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              sale.sale_status === 'sold' || sale.sale_status === 'Sold'
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {sale.sale_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {sale.auction_location || sale.location || 'N/A'}
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

            {/* Pagination */}
            {totalResults > resultsPerPage && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
                  >
                    Previous
                  </button>
                  
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {page} of {Math.ceil(totalResults / resultsPerPage)}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= Math.ceil(totalResults / resultsPerPage)}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
                  >
                    Next
                  </button>
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
      </main>
    </div>
  );
}