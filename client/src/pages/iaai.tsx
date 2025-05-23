import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

export default function IAAI() {
  const [, setLocation] = useLocation();
  
  // State for form inputs
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [auctionDateFrom, setAuctionDateFrom] = useState('');
  const [auctionDateTo, setAuctionDateTo] = useState('');
  
  // Results state
  const [salesData, setSalesData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 25;

  // Set default date range (3 months back from today)
  useEffect(() => {
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    
    setAuctionDateFrom(threeMonthsAgo.toISOString().split('T')[0]);
    setAuctionDateTo(today.toISOString().split('T')[0]);
  }, []);

  // Function to handle search
  const handleSearch = async () => {
    if (!make) {
      alert('Please select a make');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const params = new URLSearchParams({
      make,
      page: '1',
      size: resultsPerPage.toString(),
      site: '2' // Hardcoded for IAAI
    });
    
    if (model) params.append('model', model);
    if (yearFrom) params.append('year_from', yearFrom);
    if (yearTo) params.append('year_to', yearTo);
    if (auctionDateFrom) params.append('sale_date_from', auctionDateFrom);
    if (auctionDateTo) params.append('sale_date_to', auctionDateTo);

    try {
      const response = await fetch(`/api/sales-history?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setSalesData(result.data);
        setTotalResults(result.data.pagination?.totalCount || result.data.salesHistory.length);
        setCurrentPage(1);
      } else {
        setError(result.message || 'Search failed');
      }
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to load more pages
  const loadPage = async (newPage: number) => {
    if (!make || newPage === currentPage) return;

    const params = new URLSearchParams({
      make,
      page: newPage.toString(),
      size: resultsPerPage.toString(),
      site: '2' // Hardcoded for IAAI
    });
    
    if (model) params.append('model', model);
    if (yearFrom) params.append('year_from', yearFrom);
    if (yearTo) params.append('year_to', yearTo);
    if (auctionDateFrom) params.append('sale_date_from', auctionDateFrom);
    if (auctionDateTo) params.append('sale_date_to', auctionDateTo);

    fetch(`/api/sales-history?${params}`)
      .then(response => response.json())
      .then(result => {
        if (result.success && result.data.salesHistory.length > 0) {
          // Update the current sales data with new page
          setSalesData(result.data);
          setCurrentPage(newPage);
          
          // Update total results if we got new information
          const displayedCount = result.data.salesHistory.length;
          
          if (result.data.pagination?.totalCount) {
            setTotalResults(result.data.pagination.totalCount);
          } else {
            // Estimate total results based on page data
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
        console.error("Error fetching page", newPage, error);
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
                <input
                  type="text"
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g., Camry, Accord"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Year From */}
              <div>
                <label htmlFor="yearFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Year From
                </label>
                <select
                  id="yearFrom"
                  value={yearFrom}
                  onChange={(e) => setYearFrom(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Any Year</option>
                  {Array.from({length: 30}, (_, i) => 2024 - i).map(year => (
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
                  onChange={(e) => setYearTo(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Any Year</option>
                  {Array.from({length: 30}, (_, i) => 2024 - i).map(year => (
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

            {/* Auction Sites - Radio buttons for navigation */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Auction Sites
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="auctionSite"
                    value="copart"
                    checked={false}
                    onChange={() => setLocation('/')}
                    className="mr-2"
                  />
                  Copart
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="auctionSite"
                    value="iaai"
                    checked={true}
                    readOnly
                    className="mr-2"
                  />
                  IAAI
                </label>
              </div>
            </div>

            {/* Search Button */}
            <div className="mt-6">
              <button
                onClick={handleSearch}
                disabled={!make || isLoading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-md transition-colors"
              >
                {isLoading ? 'Searching...' : 'Search Vehicle History'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {!salesData && !isLoading && !error && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Fill in your search criteria above and click "Search Vehicle History" to view results.
          </div>
        )}

        {salesData && (
          <div className="space-y-6">
            {/* Results Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Search Results
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((currentPage - 1) * resultsPerPage) + 1} to {Math.min(currentPage * resultsPerPage, totalResults)} of {totalResults} results
                </div>
              </div>
            </div>

            {/* Sales Table */}
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
                    {salesData.salesHistory.map((sale: any, index: number) => (
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
                          {sale.purchase_price ? `$${sale.purchase_price.toLocaleString()}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            sale.sale_status === 'sold' 
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

            {/* Pagination */}
            {totalResults > resultsPerPage && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => loadPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
                  >
                    Previous
                  </button>
                  
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {Math.ceil(totalResults / resultsPerPage)}
                  </span>
                  
                  <button
                    onClick={() => loadPage(currentPage + 1)}
                    disabled={currentPage >= Math.ceil(totalResults / resultsPerPage)}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}