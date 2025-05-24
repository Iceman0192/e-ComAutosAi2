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

// Get current year for the year picker default value
const currentYear = new Date().getFullYear();

export default function Copart() {
  // Primary search parameters
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('');
  const [yearFrom, setYearFrom] = useState(currentYear - 5);
  const [yearTo, setYearTo] = useState(currentYear);
  const [sites, setSites] = useState<string[]>(['copart']);
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
  
  // Modal state for vehicle details
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
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
    sites,
    damage_type: damageType !== 'all' ? damageType : undefined,
    odometer_from: minMileage,
    odometer_to: maxMileage
  };

  // API hook for sales history - fix the data structure
  const { data: searchResults, isLoading: isSearching, error, refetch } = useSalesHistory(filterState);
  const hasSearched = !!searchResults;

  // Helper functions for seamless integration
  const calculateAveragePrice = (salesHistory: any[]) => {
    if (!salesHistory || salesHistory.length === 0) return 0;
    const total = salesHistory.reduce((sum, sale) => sum + (sale.purchase_price || 0), 0);
    return total / salesHistory.length;
  };

  const openVehicleDetails = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setCurrentImageIndex(0);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
  };

  // Handle search button click
  const handleSearch = () => {
    setPage(1); // Reset to first page on new search
    refetch();
  };

  // Handle reset button click
  const handleReset = () => {
    setMake('Toyota');
    setModel('');
    setYearFrom(currentYear - 5);
    setYearTo(currentYear);
    setCondition('all');
    setDamageType('all');
    setMinMileage(undefined);
    setMaxMileage(undefined);
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

  // Vehicle Makes with Models - comprehensive list
  const vehicleMakes = {
    "Acura": ["ILX", "MDX", "RDX", "TL", "TLX", "TSX", "ZDX"],
    "Audi": ["A3", "A4", "A5", "A6", "A7", "A8", "Q3", "Q5", "Q7", "Q8", "R8", "TT"],
    "BMW": ["X1", "X3", "X5", "X7", "2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "8 Series", "Z4"],
    "Buick": ["Enclave", "Encore", "Envision", "LaCrosse", "Regal"],
    "Cadillac": ["ATS", "CT4", "CT5", "CT6", "CTS", "Escalade", "SRX", "XT4", "XT5", "XT6"],
    "Chevrolet": ["Blazer", "Camaro", "Corvette", "Cruze", "Equinox", "Impala", "Malibu", "Silverado", "Suburban", "Tahoe", "Traverse"],
    "Chrysler": ["200", "300", "Pacifica", "Voyager"],
    "Dodge": ["Challenger", "Charger", "Dart", "Durango", "Grand Caravan", "Journey", "Ram"],
    "Ford": ["Bronco", "Edge", "Escape", "Expedition", "Explorer", "F-150", "F-250", "F-350", "Fiesta", "Focus", "Fusion", "Mustang", "Ranger", "Taurus"],
    "GMC": ["Acadia", "Canyon", "Sierra", "Terrain", "Yukon"],
    "Honda": ["Accord", "Civic", "CR-V", "HR-V", "Insight", "Odyssey", "Passport", "Pilot", "Ridgeline"],
    "Hyundai": ["Accent", "Elantra", "Genesis", "Kona", "Palisade", "Santa Fe", "Sonata", "Tucson", "Veloster"],
    "Infiniti": ["Q50", "Q60", "QX50", "QX60", "QX80"],
    "Jeep": ["Cherokee", "Compass", "Grand Cherokee", "Gladiator", "Renegade", "Wrangler"],
    "Kia": ["Forte", "Optima", "Rio", "Sedona", "Sorento", "Soul", "Sportage", "Stinger", "Telluride"],
    "Lexus": ["ES", "GS", "IS", "LS", "GX", "LX", "NX", "RX", "UX"],
    "Lincoln": ["Aviator", "Continental", "Corsair", "MKC", "MKT", "MKX", "MKZ", "Navigator"],
    "Mazda": ["CX-3", "CX-5", "CX-9", "Mazda3", "Mazda6", "MX-5 Miata"],
    "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLB", "GLC", "GLE", "GLS", "G-Class"],
    "Mitsubishi": ["Eclipse Cross", "Lancer", "Mirage", "Outlander", "Outlander Sport"],
    "Nissan": ["Altima", "Armada", "Frontier", "GT-R", "Kicks", "Leaf", "Maxima", "Murano", "Pathfinder", "Rogue", "Sentra", "Titan", "Versa", "370Z"],
    "Ram": ["1500", "2500", "3500", "ProMaster"],
    "Subaru": ["Ascent", "Crosstrek", "Forester", "Impreza", "Legacy", "Outback", "WRX"],
    "Tesla": ["Model 3", "Model S", "Model X", "Model Y"],
    "Toyota": ["4Runner", "Avalon", "Camry", "Corolla", "Highlander", "Land Cruiser", "Prius", "RAV4", "Sequoia", "Sienna", "Tacoma", "Tundra", "Venza"],
    "Volkswagen": ["Atlas", "Beetle", "Golf", "Jetta", "Passat", "Tiguan", "Touareg"],
    "Volvo": ["S60", "S90", "V60", "V90", "XC40", "XC60", "XC90"]
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
                    Make <span className="text-blue-500">*</span>
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
            </div>
            
            {/* Search and Reset Buttons */}
            <div className="mt-6 p-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleSearch}
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

          {/* Results Section */}
          {!hasSearched && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Fill in your search criteria above and click "Search Vehicle History" to view results.
            </div>
          )}

          {hasSearched && searchResults && searchResults.salesHistory && (
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
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === TabType.TIMELINE
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    Timeline
                  </button>
                  <button
                    onClick={() => setActiveTab(TabType.TABLE)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === TabType.TABLE
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    Table View
                  </button>
                  <button
                    onClick={() => setActiveTab(TabType.PHOTOS)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === TabType.PHOTOS
                        ? 'bg-blue-600 text-white'
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
                    <SalesAnalytics salesHistory={searchResults.salesHistory} />
                  </div>
                </div>
              )}

              {activeTab === TabType.TABLE && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  {/* Enhanced Filters Section - Matching IAAI */}
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

                  {/* Enhanced Table - Matching IAAI */}
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
                                        className="h-16 w-20 object-cover rounded-lg border border-blue-200 dark:border-blue-700 shadow-sm"
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
                                    className="h-16 w-20 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700 flex items-center justify-center"
                                    style={{ 
                                      display: (sale.link_img_small?.length > 0 || sale.link_img_hd?.length > 0 || sale.images) ? 'none' : 'flex'
                                    }}
                                  >
                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
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
                              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                Copart: {sale.auction_location || sale.location || 'N/A'}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {new Date(sale.sale_date).toLocaleDateString()}
                              </div>
                              <div className="text-xs">
                                <span className={`inline-flex px-2 py-1 rounded-full ${
                                  sale.sale_status === 'Sold' || sale.sale_status === 'sold'
                                    ? 'bg-green-100 text-green-800' 
                                    : sale.sale_status === 'Not sold'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {sale.sale_status}
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
                        <div className="h-48 bg-gray-200 dark:bg-gray-600 relative">
                          {(() => {
                            // Handle different image formats (API direct vs database cached)
                            let imageUrl = null;
                            if (sale.link_img_hd && sale.link_img_hd.length > 0) {
                              imageUrl = sale.link_img_hd[0];
                            } else if (sale.link_img_small && sale.link_img_small.length > 0) {
                              imageUrl = sale.link_img_small[0];
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
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => openVehicleDetails(sale)}
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
                            className="w-full h-full flex items-center justify-center"
                            style={{ 
                              display: (() => {
                                const hasImage = (sale.link_img_small?.length > 0) || (sale.link_img_hd?.length > 0) || 
                                                 (sale.images && ((typeof sale.images === 'string' && JSON.parse(sale.images).length > 0) || 
                                                  (Array.isArray(sale.images) && sale.images.length > 0)));
                                return hasImage ? 'none' : 'flex';
                              })()
                            }}
                          >
                            <span className="text-gray-500 dark:text-gray-400">No Image Available</span>
                          </div>
                        </div>
                        
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
                              sale.sale_status === 'Sold' || sale.sale_status === 'sold'
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
            </div>
          )}

          {/* No Results State */}
          {hasSearched && !isSearching && (!searchResults || !searchResults.data || !searchResults.data.salesHistory || searchResults.data.salesHistory.length === 0) && (
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