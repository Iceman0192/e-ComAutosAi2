import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { ChevronDown, BarChart3, Table, Grid, RotateCcw } from 'lucide-react';
import PlatformToggle from '../components/ui/platform-toggle';

// Vehicle makes and models data
const vehicleMakes = {
  'Acura': ['TLX', 'RDX', 'MDX', 'ILX', 'NSX'],
  'Audi': ['A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'TT'],
  'BMW': ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7', 'Z4'],
  'Buick': ['Encore', 'Envision', 'Enclave', 'Regal', 'LaCrosse'],
  'Cadillac': ['ATS', 'CTS', 'XTS', 'XT4', 'XT5', 'XT6', 'Escalade'],
  'Chevrolet': ['Spark', 'Sonic', 'Cruze', 'Malibu', 'Impala', 'Camaro', 'Corvette', 'Equinox', 'Traverse', 'Tahoe', 'Suburban', 'Silverado'],
  'Chrysler': ['300', 'Pacifica', 'Voyager'],
  'Dodge': ['Charger', 'Challenger', 'Durango', 'Journey', 'Grand Caravan', 'Ram 1500', 'Ram 2500'],
  'Ford': ['Fiesta', 'Focus', 'Fusion', 'Mustang', 'Escape', 'Edge', 'Explorer', 'Expedition', 'F-150', 'F-250', 'F-350'],
  'Genesis': ['G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80'],
  'GMC': ['Terrain', 'Acadia', 'Yukon', 'Sierra 1500', 'Sierra 2500'],
  'Honda': ['Civic', 'Accord', 'Insight', 'CR-V', 'HR-V', 'Passport', 'Pilot', 'Ridgeline'],
  'Hyundai': ['Accent', 'Elantra', 'Sonata', 'Azera', 'Veloster', 'Kona', 'Tucson', 'Santa Fe', 'Palisade'],
  'Infiniti': ['Q50', 'Q60', 'Q70', 'QX30', 'QX50', 'QX60', 'QX80'],
  'Jaguar': ['XE', 'XF', 'XJ', 'F-PACE', 'E-PACE', 'I-PACE'],
  'Jeep': ['Compass', 'Cherokee', 'Grand Cherokee', 'Wrangler', 'Gladiator', 'Renegade'],
  'Kia': ['Rio', 'Forte', 'Optima', 'Stinger', 'Soul', 'Seltos', 'Sportage', 'Sorento', 'Telluride'],
  'Land Rover': ['Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Sport', 'Range Rover Evoque'],
  'Lexus': ['IS', 'ES', 'GS', 'LS', 'LC', 'NX', 'RX', 'GX', 'LX'],
  'Lincoln': ['MKC', 'MKX', 'MKZ', 'Continental', 'Navigator', 'Aviator', 'Corsair'],
  'Mazda': ['Mazda3', 'Mazda6', 'CX-3', 'CX-5', 'CX-9', 'MX-5 Miata'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'E-Class', 'S-Class', 'GLA', 'GLC', 'GLE', 'GLS', 'G-Class'],
  'Mitsubishi': ['Mirage', 'Lancer', 'Eclipse Cross', 'Outlander', 'Outlander Sport'],
  'Nissan': ['Versa', 'Sentra', 'Altima', 'Maxima', 'Rogue', 'Murano', 'Pathfinder', 'Armada', 'Titan'],
  'Porsche': ['718', '911', 'Panamera', 'Macan', 'Cayenne', 'Taycan'],
  'Ram': ['1500', '2500', '3500', 'ProMaster'],
  'Subaru': ['Impreza', 'Legacy', 'Outback', 'Forester', 'Crosstrek', 'Ascent'],
  'Tesla': ['Model S', 'Model 3', 'Model X', 'Model Y'],
  'Toyota': ['Corolla', 'Camry', 'Avalon', 'Prius', 'RAV4', 'Highlander', 'Sequoia', 'Tacoma', 'Tundra', '4Runner'],
  'Volkswagen': ['Jetta', 'Passat', 'Arteon', 'Golf', 'Tiguan', 'Atlas'],
  'Volvo': ['S60', 'S90', 'V60', 'V90', 'XC40', 'XC60', 'XC90']
};

export default function CopartPage() {
  // Search state
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('');
  const [yearFrom, setYearFrom] = useState('2020');
  const [yearTo, setYearTo] = useState('2025');
  const [saleDateFrom, setSaleDateFrom] = useState('2025-02-24');
  const [saleDateTo, setSaleDateTo] = useState('2025-05-24');
  
  // Results state
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('analytics');
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 25;
  
  // Available models for selected make
  const availableModels = make ? vehicleMakes[make] || [] : [];
  
  // Reset model when make changes
  useEffect(() => {
    setModel('');
  }, [make]);
  
  // Fetch data function
  const fetchData = async (page = 1) => {
    if (!make) return;
    
    setLoading(true);
    console.log(`Fetching page ${page} with size ${resultsPerPage} and params:`, {
      make,
      year_from: yearFrom,
      year_to: yearTo,
      sale_date_from: saleDateFrom,
      sale_date_to: saleDateTo,
      page: page.toString(),
      size: resultsPerPage.toString(),
      site: "1"
    });
    
    try {
      const params = new URLSearchParams({
        make,
        year_from: yearFrom,
        year_to: yearTo,
        sale_date_from: saleDateFrom,
        sale_date_to: saleDateTo,
        page: page.toString(),
        size: resultsPerPage.toString(),
        site: "1"
      });
      
      if (model) {
        params.append('model', model);
      }
      
      const response = await fetch(`/api/sales-history?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.data);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching sales history:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchData(1);
  };
  
  // Handle reset
  const handleReset = () => {
    setMake('Toyota');
    setModel('');
    setYearFrom('2020');
    setYearTo('2025');
    setSaleDateFrom('2025-02-24');
    setSaleDateTo('2025-05-24');
    setResults(null);
    setCurrentPage(1);
  };
  
  // Handle page change
  const handlePageChange = (page) => {
    fetchData(page);
  };
  
  // Calculate total pages
  const totalResults = results?.salesHistory?.length || 0;
  const hasMoreData = totalResults === resultsPerPage;
  const totalPages = hasMoreData ? Math.max(currentPage + 4, 10) : Math.ceil(totalResults / resultsPerPage);
  
  return (
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
                  Make <span className="text-red-500">*</span>
                </label>
                <select
                  id="make"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
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
                  {availableModels.map(modelName => (
                    <option key={modelName} value={modelName}>{modelName}</option>
                  ))}
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
                  onChange={(e) => setYearFrom(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {Array.from({ length: 26 }, (_, i) => 2025 - i).map(year => (
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {Array.from({ length: 26 }, (_, i) => 2025 - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              {/* Sale Date From */}
              <div>
                <label htmlFor="saleDateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sale Date From
                </label>
                <input
                  type="date"
                  id="saleDateFrom"
                  value={saleDateFrom}
                  onChange={(e) => setSaleDateFrom(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              {/* Sale Date To */}
              <div>
                <label htmlFor="saleDateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sale Date To
                </label>
                <input
                  type="date"
                  id="saleDateTo"
                  value={saleDateTo}
                  onChange={(e) => setSaleDateTo(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSearch}
                disabled={!make || loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Search
              </button>
            </div>
          </div>
        </div>
        
        {/* Results Section */}
        {results && (
          <div className="space-y-6">
            {/* View Mode Toggle */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setViewMode('analytics')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    viewMode === 'analytics'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics Dashboard
                </button>
                
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  Table View
                </button>
                
                <button
                  onClick={() => setViewMode('photos')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    viewMode === 'photos'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  Photo Grid
                </button>
              </div>
            </div>
            
            {/* Content based on view mode */}
            {viewMode === 'analytics' && <AnalyticsView data={results} />}
            {viewMode === 'table' && <TableView data={results} />}
            {viewMode === 'photos' && <PhotoView data={results} />}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, currentPage - 2) + i;
                      if (pageNum > totalPages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 text-sm border rounded-md ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Analytics View Component
function AnalyticsView({ data }) {
  const salesHistory = data?.salesHistory || [];
  
  // Calculate statistics
  const totalVehicles = salesHistory.length;
  const soldVehicles = salesHistory.filter(sale => sale.sale_status === 'SOLD').length;
  const averagePrice = salesHistory.reduce((sum, sale) => {
    const price = parseFloat(sale.bid_amount?.replace(/[$,]/g, '') || sale.final_bid_amount?.replace(/[$,]/g, '') || '0');
    return sum + price;
  }, 0) / totalVehicles;
  
  // Damage analysis
  const damageStats = {};
  salesHistory.forEach(sale => {
    const damage = sale.damage_pr || 'Unknown';
    if (!damageStats[damage]) {
      damageStats[damage] = { count: 0, prices: [] };
    }
    damageStats[damage].count++;
    const price = parseFloat(sale.bid_amount?.replace(/[$,]/g, '') || sale.final_bid_amount?.replace(/[$,]/g, '') || '0');
    if (price > 0) damageStats[damage].prices.push(price);
  });
  
  const damageAnalysis = Object.entries(damageStats).map(([damage, stats]) => ({
    damage,
    count: stats.count,
    average: stats.prices.length > 0 ? stats.prices.reduce((a, b) => a + b, 0) / stats.prices.length : 0,
    min: stats.prices.length > 0 ? Math.min(...stats.prices) : 0,
    max: stats.prices.length > 0 ? Math.max(...stats.prices) : 0
  })).sort((a, b) => b.count - a.count);
  
  console.log('Damage analysis data:', damageAnalysis);
  
  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Summary Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalVehicles}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Vehicles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{soldVehicles}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Sold</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {((soldVehicles / totalVehicles) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              ${averagePrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Price</div>
          </div>
        </div>
      </div>
      
      {/* Damage Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Damage Analysis</h3>
        <div className="space-y-3">
          {damageAnalysis.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">{item.damage}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{item.count} vehicles</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900 dark:text-white">
                  ${item.average.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">avg price</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Table View Component
function TableView({ data }) {
  const salesHistory = data?.salesHistory || [];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Sales History Table</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Damage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Mileage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Final Bid
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {salesHistory.map((sale, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {sale.year} {sale.make_name} {sale.model_name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    LOT: {sale.lot_number}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {sale.year}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {sale.damage_pr || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {sale.odometer ? `${parseInt(sale.odometer).toLocaleString()} mi` : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {sale.final_bid_amount || sale.bid_amount || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    sale.sale_status === 'SOLD' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
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
  );
}

// Photo View Component
function PhotoView({ data }) {
  const salesHistory = data?.salesHistory || [];
  
  const getImageUrl = (vehicle) => {
    if (!vehicle.images_list) return null;
    
    try {
      const images = typeof vehicle.images_list === 'string' 
        ? JSON.parse(vehicle.images_list) 
        : vehicle.images_list;
      
      if (Array.isArray(images) && images.length > 0) {
        return images[0].hd || images[0].small || images[0].cached;
      }
    } catch (e) {
      console.error('Error parsing images:', e);
    }
    
    return null;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Photo Grid</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {salesHistory.map((sale, index) => {
          const imageUrl = getImageUrl(sale);
          return (
            <div key={index} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow dark:border-gray-600">
              <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={`${sale.year} ${sale.make_name} ${sale.model_name}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`flex items-center justify-center text-gray-500 dark:text-gray-400 ${imageUrl ? 'hidden' : 'flex'}`}>
                  <Grid className="w-8 h-8" />
                </div>
              </div>
              <div className="p-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {sale.year} {sale.make_name} {sale.model_name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  LOT: {sale.lot_number}
                </div>
                <div className="text-sm font-semibold text-blue-600 mt-1">
                  {sale.final_bid_amount || sale.bid_amount || 'N/A'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}