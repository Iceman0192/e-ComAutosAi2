import { useState } from 'react';
import { useSalesHistory, FilterState } from '../hooks/useSalesHistory';
import ErrorBoundary from '../components/ui/error-boundary';

// Tab enum for better organization
enum TabType {
  TIMELINE = "timeline",
  MAP = "map",
  TABLE = "table"
}

export default function Home() {
  // Filter state
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('Camry');
  const [vin, setVin] = useState('');
  const [dateRange, setDateRange] = useState<'last3m' | 'last6m' | 'lasty' | 'custom'>('last3m');
  const [sites, setSites] = useState<string[]>(['copart', 'iaai']);
  const [activeTab, setActiveTab] = useState<TabType>(TabType.TIMELINE);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFiltersOnMobile, setShowFiltersOnMobile] = useState(false);
  const [saleStatus, setSaleStatus] = useState<string[]>(['Sold', 'Pure Sale', 'On Approval']);
  const [priceMin, setPriceMin] = useState<number | undefined>(undefined);
  const [priceMax, setPriceMax] = useState<number | undefined>(undefined);
  const [buyerLocation, setBuyerLocation] = useState<string | undefined>(undefined);
  const [customDateStart, setCustomDateStart] = useState<string>('');
  const [customDateEnd, setCustomDateEnd] = useState<string>('');
  
  // Combine filter state
  const filterState: FilterState = {
    vin,
    make,
    model,
    dateRange,
    customDateStart,
    customDateEnd,
    saleStatus,
    priceMin,
    priceMax,
    buyerLocation,
    sites
  };
  
  // Fetch data
  const { data, isLoading, error, refetch } = useSalesHistory(filterState);
  
  const handleSearch = () => {
    refetch();
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main content */}
      <div className="flex-1">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Vehicle Sales History
                  </h1>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="make" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Make
                    </label>
                    <input
                      type="text"
                      id="make"
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Model
                    </label>
                    <input
                      type="text"
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleSearch}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <ErrorBoundary>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-700 dark:text-gray-300">Loading sales data...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Unable to load data</h2>
                <p className="text-red-600 dark:text-red-300 mt-2">
                  There was an error fetching the sales history. Please check your connection and try again.
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                >
                  Try Again
                </button>
              </div>
            ) : data ? (
              <div className="space-y-6">
                {/* Summary stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Total Sales
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                        {data.stats.totalSales}
                      </dd>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Average Price
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                        ${Math.round(data.stats.averagePrice).toLocaleString()}
                      </dd>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Success Rate
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                        {Math.round(data.stats.successRate)}%
                      </dd>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Price Trend
                      </dt>
                      <dd className={`mt-1 text-3xl font-semibold ${data.stats.priceTrend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {data.stats.priceTrend >= 0 ? '+' : ''}{data.stats.priceTrend.toFixed(1)}%
                      </dd>
                    </div>
                  </div>
                </div>
                
                {/* Tabs */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex">
                      <button
                        className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                          activeTab === TabType.TIMELINE
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                        onClick={() => setActiveTab(TabType.TIMELINE)}
                      >
                        Timeline
                      </button>
                      <button
                        className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                          activeTab === TabType.MAP
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                        onClick={() => setActiveTab(TabType.MAP)}
                      >
                        Geographic
                      </button>
                      <button
                        className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                          activeTab === TabType.TABLE
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                        onClick={() => setActiveTab(TabType.TABLE)}
                      >
                        Table
                      </button>
                    </nav>
                  </div>
                  
                  <div className="px-4 py-5 sm:p-6">
                    {activeTab === TabType.TIMELINE && (
                      <div className="h-80">
                        {/* Timeline content would go here */}
                        <p className="text-gray-600 dark:text-gray-300 text-center py-12">
                          Timeline visualization would be displayed here
                        </p>
                      </div>
                    )}
                    
                    {activeTab === TabType.MAP && (
                      <div className="h-80">
                        {/* Map content would go here */}
                        <p className="text-gray-600 dark:text-gray-300 text-center py-12">
                          Geographic visualization would be displayed here
                        </p>
                      </div>
                    )}
                    
                    {activeTab === TabType.TABLE && (
                      <div>
                        {/* Table content */}
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                >
                                  Sale Date
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                >
                                  Vehicle
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                >
                                  Price
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                >
                                  Status
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                >
                                  Location
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {data.salesHistory.map((sale) => (
                                <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {new Date(sale.sale_date).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    <span className="font-medium">{data.vehicle?.make} {data.vehicle?.model} {data.vehicle?.year}</span>
                                    <br />
                                    <span className="text-gray-500 dark:text-gray-400 text-xs">{sale.vin}</span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {sale.purchase_price ? `$${sale.purchase_price.toLocaleString()}` : 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      sale.sale_status === 'Sold' 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    }`}>
                                      {sale.sale_status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {sale.buyer_state || sale.auction_location || 'Unknown'}
                                  </td>
                                </tr>
                              ))}
                              {data.salesHistory.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No sales history found for this vehicle.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-300">
                  Enter a make and model and click Search to view sales history.
                </p>
              </div>
            )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}