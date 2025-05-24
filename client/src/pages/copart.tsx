import { useState } from 'react';
import { useSalesHistory, FilterState } from '../hooks/useSalesHistory';
import ErrorBoundary from '../components/ui/error-boundary';
import { Link } from 'wouter';
import SalesAnalytics from '../components/sales/SalesAnalytics';
import { formatCurrency } from '../utils/formatters';
import PlatformToggle from '../components/ui/platform-toggle';

// Tab enum for better organization
enum TabType {
  TIMELINE = "timeline",
  TABLE = "table", 
  PHOTOS = "photos"
}

// Vehicle makes data
const vehicleMakes = {
  'Toyota': ['4Runner', 'Avalon', 'Camry', 'Corolla', 'Highlander', 'Prius', 'RAV4', 'Sienna', 'Tacoma', 'Tundra'],
  'Honda': ['Accord', 'Civic', 'CR-V', 'Fit', 'HR-V', 'Odyssey', 'Passport', 'Pilot', 'Ridgeline'],
  'Ford': ['Bronco', 'Edge', 'Escape', 'Explorer', 'F-150', 'Focus', 'Fusion', 'Mustang', 'Ranger'],
  'Chevrolet': ['Blazer', 'Camaro', 'Corvette', 'Cruze', 'Equinox', 'Malibu', 'Silverado', 'Suburban', 'Tahoe'],
  'Nissan': ['Altima', 'Armada', 'Frontier', 'Maxima', 'Murano', 'Pathfinder', 'Rogue', 'Sentra', 'Titan', 'Versa'],
  'BMW': ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'GLS'],
  'Lexus': ['ES', 'GX', 'IS', 'LS', 'LX', 'NX', 'RX'],
  'Audi': ['A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8']
};

// Get current year for the year picker default value
const currentYear = new Date().getFullYear();

export default function Copart() {
  // Primary search parameters
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('');
  const [yearFrom, setYearFrom] = useState(currentYear - 5);
  const [yearTo, setYearTo] = useState(currentYear);
  
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
  
  // UI state
  const [activeTab, setActiveTab] = useState<TabType>(TabType.TIMELINE);
  
  // Modal state for vehicle details
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  // Combine filter state for API request
  const filterState: FilterState = {
    make,
    model: model || '',
    year_from: yearFrom,
    year_to: yearTo,
    auction_date_from: auctionDateFrom,
    auction_date_to: auctionDateTo,
    page,
    size: resultsPerPage,
    sites: ['copart']
  };

  // API hook for sales history
  const { data: searchResults, isLoading: isSearching, error, refetch } = useSalesHistory(filterState);
  const hasSearched = !!searchResults;

  // Reset function
  const handleReset = () => {
    setMake('Toyota');
    setModel('');
    setYearFrom(currentYear - 5);
    setYearTo(currentYear);
    setAuctionDateFrom(() => {
      const date = new Date();
      date.setMonth(date.getMonth() - 3);
      return date.toISOString().split('T')[0];
    });
    setAuctionDateTo(() => {
      return new Date().toISOString().split('T')[0];
    });
    setPage(1);
    setActiveTab(TabType.TIMELINE);
  };

  // Helper functions
  const calculateAveragePrice = (salesHistory: any[]) => {
    if (!salesHistory || salesHistory.length === 0) return 0;
    const total = salesHistory.reduce((sum, sale) => sum + (parseInt(sale.purchase_price) || 0), 0);
    return total / salesHistory.length;
  };

  const openVehicleDetails = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
  };

  const modelOptions = vehicleMakes[make as keyof typeof vehicleMakes] || [];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header - BLUE branding for Copart */}
        <header className="bg-blue-600 text-white">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/" className="text-white hover:text-blue-200 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <h1 className="text-2xl font-bold">Copart Vehicle Sales History</h1>
              </div>
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
                    Make *
                  </label>
                  <select
                    id="make"
                    value={make}
                    onChange={(e) => {
                      setMake(e.target.value);
                      setModel(''); // Reset model when make changes
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select Make</option>
                    {Object.keys(vehicleMakes).map(makeName => (
                      <option key={makeName} value={makeName}>{makeName}</option>
                    ))}
                  </select>
                </div>

                {/* Model - Optional */}
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Model
                  </label>
                  <select
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={!make}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:disabled:bg-gray-600"
                  >
                    <option value="">All Models</option>
                    {modelOptions.map(modelName => (
                      <option key={modelName} value={modelName}>{modelName}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Year Range */}
              <div className="flex space-x-2 mt-4">
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
                    {Array.from({length: 30}, (_, i) => currentYear - i).map(year => (
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
                    {Array.from({length: 30}, (_, i) => currentYear - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date Range */}
              <div className="flex space-x-2 mt-4">
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
            
              {/* Search and Reset Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => refetch()}
                  disabled={!make || isSearching}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  {isSearching ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Searching Copart Database...
                    </>
                  ) : (
                    'Search Vehicle History'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Reset Search
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isSearching && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
              <div className="mx-auto max-w-md">
                <svg className="animate-spin mx-auto h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Searching Copart database...</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Please wait while we fetch vehicle sales history.
                </p>
              </div>
            </div>
          )}

          {/* Welcome State */}
          {!hasSearched && !isSearching && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Ready to search Copart vehicle history</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Fill in your search criteria above and click "Search Vehicle History" to view results.
              </p>
            </div>
          )}

          {/* Results Display */}
          {hasSearched && !isSearching && searchResults && searchResults.salesHistory && searchResults.salesHistory.length > 0 && (
            <div className="space-y-6">
              {/* Results Summary with Display Options */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {searchResults.salesHistory.length} Results for {make} {model} ({yearFrom}-{yearTo})
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Average sold price: {formatCurrency(calculateAveragePrice(searchResults.salesHistory))}
                  </div>
                </div>
                
                {/* Display Tabs */}
                <div className="flex space-x-1 mb-4">
                  <button
                    onClick={() => setActiveTab(TabType.TIMELINE)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === TabType.TIMELINE 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    Analytics Dashboard
                  </button>
                  <button
                    onClick={() => setActiveTab(TabType.TABLE)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === TabType.TABLE 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    Table View
                  </button>
                  <button
                    onClick={() => setActiveTab(TabType.PHOTOS)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === TabType.PHOTOS 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
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
                    <SalesAnalytics salesHistory={searchResults.salesHistory} />
                  </div>
                </div>
              )}

              {activeTab === TabType.TABLE && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Vehicle
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Mileage
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Damage
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Sale Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Sale Price
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {searchResults.salesHistory.map((sale: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors" onClick={() => openVehicleDetails(sale)}>
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-16 w-20 mr-4 relative">
                                  {sale.link_img_small && sale.link_img_small.length > 0 ? (
                                    <img
                                      src={sale.link_img_small[0]}
                                      alt="Vehicle"
                                      className="h-16 w-20 object-cover rounded-lg"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="h-16 w-20 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700 flex items-center justify-center">
                                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
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
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900 dark:text-white font-medium">
                                {sale.vehicle_title || sale.title || 'Unknown'}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {sale.vehicle_damage || sale.damage_pr || 'Unknown'}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {sale.auction_location || sale.location || 'N/A'}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : 'N/A'}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatCurrency(parseInt(sale.purchase_price) || 0)}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                sale.sale_status === 'SOLD' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              }`}>
                                {sale.sale_status || 'Unknown'}
                              </span>
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
                    {searchResults.salesHistory.map((sale: any, index: number) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="h-48 bg-gray-200 dark:bg-gray-600 relative">
                          {sale.link_img_small && sale.link_img_small.length > 0 ? (
                            <img
                              src={sale.link_img_small[0]}
                              alt="Vehicle"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                            {sale.year} {sale.make} {sale.model}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Lot {sale.lot_id} • {sale.vehicle_damage || sale.damage_pr || 'Unknown damage'}
                          </p>
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {formatCurrency(parseInt(sale.purchase_price) || 0)}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              sale.sale_status === 'SOLD' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            }`}>
                              {sale.sale_status || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Results State */}
          {hasSearched && !isSearching && (!searchResults || !searchResults.salesHistory || searchResults.salesHistory.length === 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
              <div className="mx-auto max-w-md">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No results found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Try adjusting your search criteria or expanding the date range.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}