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

// Comprehensive vehicle makes data
const vehicleMakes = {
  'Acura': ['ILX', 'MDX', 'RDX', 'TLX', 'TSX', 'ZDX'],
  'Audi': ['A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'R8', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'SQ5', 'SQ7', 'TT'],
  'BMW': ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'i3', 'i8', 'M2', 'M3', 'M4', 'M5', 'M6', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z3', 'Z4'],
  'Buick': ['Enclave', 'Encore', 'Envision', 'LaCrosse', 'Regal', 'Verano'],
  'Cadillac': ['ATS', 'CT4', 'CT5', 'CT6', 'CTS', 'DeVille', 'DTS', 'Escalade', 'SRX', 'STS', 'XLR', 'XT4', 'XT5', 'XT6'],
  'Chevrolet': ['Avalanche', 'Aveo', 'Blazer', 'Camaro', 'Captiva', 'Cobalt', 'Colorado', 'Corvette', 'Cruze', 'Equinox', 'Express', 'HHR', 'Impala', 'Malibu', 'Monte Carlo', 'Silverado', 'Sonic', 'Spark', 'Suburban', 'Tahoe', 'Trailblazer', 'Traverse', 'Trax', 'Uplander', 'Volt'],
  'Chrysler': ['200', '300', 'Aspen', 'Crossfire', 'Pacifica', 'PT Cruiser', 'Sebring', 'Town & Country', 'Voyager'],
  'Dodge': ['Avenger', 'Caliber', 'Challenger', 'Charger', 'Dakota', 'Dart', 'Durango', 'Grand Caravan', 'Journey', 'Magnum', 'Nitro', 'Ram', 'Stratus', 'Viper'],
  'Ford': ['Bronco', 'C-MAX', 'Crown Victoria', 'E-Series', 'Edge', 'Escape', 'Expedition', 'Explorer', 'F-150', 'F-250', 'F-350', 'F-450', 'Fiesta', 'Five Hundred', 'Flex', 'Focus', 'Freestyle', 'Fusion', 'GT', 'Mustang', 'Ranger', 'Taurus', 'Thunderbird', 'Transit'],
  'GMC': ['Acadia', 'Canyon', 'Envoy', 'Jimmy', 'Safari', 'Savana', 'Sierra', 'Terrain', 'Yukon'],
  'Honda': ['Accord', 'Civic', 'CR-V', 'CR-Z', 'Crosstour', 'Element', 'Fit', 'HR-V', 'Insight', 'Odyssey', 'Passport', 'Pilot', 'Ridgeline', 'S2000'],
  'Hyundai': ['Accent', 'Azera', 'Elantra', 'Genesis', 'Santa Fe', 'Sonata', 'Tucson', 'Veloster', 'Veracruz'],
  'Infiniti': ['EX35', 'FX35', 'FX45', 'G25', 'G35', 'G37', 'I30', 'I35', 'M35', 'M45', 'Q40', 'Q45', 'Q50', 'Q60', 'Q70', 'QX30', 'QX50', 'QX56', 'QX60', 'QX70', 'QX80'],
  'Jaguar': ['F-PACE', 'F-TYPE', 'S-TYPE', 'X-TYPE', 'XE', 'XF', 'XJ', 'XK'],
  'Jeep': ['Cherokee', 'Commander', 'Compass', 'Grand Cherokee', 'Grand Wagoneer', 'Liberty', 'Patriot', 'Renegade', 'Wagoneer', 'Wrangler'],
  'Kia': ['Forte', 'Optima', 'Rio', 'Sedona', 'Sorento', 'Soul', 'Sportage', 'Stinger'],
  'Land Rover': ['Defender', 'Discovery', 'Freelander', 'LR2', 'LR3', 'LR4', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar'],
  'Lexus': ['CT', 'ES', 'GS', 'GX', 'IS', 'LC', 'LS', 'LX', 'NX', 'RC', 'RX', 'SC', 'UX'],
  'Lincoln': ['Aviator', 'Continental', 'Corsair', 'LS', 'Mark LT', 'MKC', 'MKS', 'MKT', 'MKX', 'MKZ', 'Navigator', 'Town Car', 'Zephyr'],
  'Mazda': ['CX-3', 'CX-5', 'CX-7', 'CX-9', 'Mazda2', 'Mazda3', 'Mazda5', 'Mazda6', 'MX-5 Miata', 'RX-8', 'Tribute'],
  'Mercedes-Benz': ['A-Class', 'B-Class', 'C-Class', 'CL-Class', 'CLA-Class', 'CLK-Class', 'CLS-Class', 'E-Class', 'G-Class', 'GL-Class', 'GLA-Class', 'GLC-Class', 'GLE-Class', 'GLK-Class', 'GLS-Class', 'M-Class', 'Metris', 'R-Class', 'S-Class', 'SL-Class', 'SLK-Class', 'SLS-Class', 'Sprinter'],
  'Mini': ['Clubman', 'Convertible', 'Cooper', 'Countryman', 'Hardtop', 'Paceman'],
  'Mitsubishi': ['Eclipse', 'Galant', 'Lancer', 'Mirage', 'Montero', 'Outlander', 'Outlander Sport'],
  'Nissan': ['350Z', '370Z', 'Altima', 'Armada', 'Cube', 'Frontier', 'GT-R', 'Juke', 'Kicks', 'Leaf', 'Maxima', 'Murano', 'NV200', 'Pathfinder', 'Quest', 'Rogue', 'Sentra', 'Titan', 'Versa', 'Xterra'],
  'Porsche': ['911', 'Boxster', 'Cayenne', 'Cayman', 'Macan', 'Panamera', 'Taycan'],
  'Ram': ['1500', '2500', '3500', 'ProMaster'],
  'Subaru': ['Ascent', 'BRZ', 'Crosstrek', 'Forester', 'Impreza', 'Legacy', 'Outback', 'Tribeca', 'WRX'],
  'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y'],
  'Toyota': ['4Runner', 'Avalon', 'Avanza', 'C-HR', 'Camry', 'Celica', 'Corolla', 'FJ Cruiser', 'Highlander', 'Land Cruiser', 'Matrix', 'Prius', 'RAV4', 'Sequoia', 'Sienna', 'Solara', 'Tacoma', 'Tundra', 'Venza', 'Yaris'],
  'Volkswagen': ['Atlas', 'Beetle', 'CC', 'Eos', 'Golf', 'GTI', 'Jetta', 'Passat', 'Routan', 'Tiguan', 'Touareg'],
  'Volvo': ['C30', 'C70', 'S40', 'S60', 'S80', 'S90', 'V40', 'V50', 'V60', 'V70', 'V90', 'XC40', 'XC60', 'XC70', 'XC90']
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
  
  // Extract sales data safely
  const salesData = searchResults?.data?.salesHistory || searchResults?.salesHistory || [];
  const hasResults = salesData.length > 0;
  
  // Calculate total pages based on estimated total records
  // If we have 25 results and it's page 1, assume there are more pages
  const estimatedTotal = salesData.length === resultsPerPage ? resultsPerPage * 20 : salesData.length;
  const totalPages = Math.ceil(estimatedTotal / resultsPerPage);

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
          {hasSearched && !isSearching && hasResults && (
            <div className="space-y-6">
              {/* Results Summary with Display Options */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {salesData.length} Results for {make} {model} ({yearFrom}-{yearTo})
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Average sold price: {formatCurrency(calculateAveragePrice(salesData))}
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
                    <SalesAnalytics salesHistory={salesData} />
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
                        {salesData.map((sale: any, index: number) => (
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
                    {salesData.map((sale: any, index: number) => (
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

              {/* Pagination Controls */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Showing {((page - 1) * resultsPerPage) + 1} to {Math.min(page * resultsPerPage, salesData.length)} of {salesData.length} results
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Results per page selector */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Show:</span>
                      <select
                        value={resultsPerPage}
                        onChange={(e) => {
                          setResultsPerPage(parseInt(e.target.value));
                          setPage(1); // Reset to first page when changing page size
                        }}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="text-sm text-gray-700 dark:text-gray-300">per page</span>
                    </div>

                    {/* Pagination buttons */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          const newPage = Math.max(1, page - 1);
                          setPage(newPage);
                          refetch(); // Trigger new API request
                        }}
                        disabled={page <= 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
                      >
                        Previous
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => {
                              setPage(pageNum);
                              refetch(); // Trigger new API request
                            }}
                            className={`px-3 py-1 text-sm border rounded-md ${
                              page === pageNum
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => {
                          const newPage = page + 1;
                          setPage(newPage);
                          refetch(); // Trigger new API request
                        }}
                        disabled={page >= totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Results State */}
          {hasSearched && !isSearching && !hasResults && (
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