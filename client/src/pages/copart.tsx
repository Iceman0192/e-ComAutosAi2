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
  const [vin, setVin] = useState('');
  const [yearFrom, setYearFrom] = useState(currentYear - 5);
  const [yearTo, setYearTo] = useState(currentYear);
  const [sites, setSites] = useState<string[]>(['copart']);
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
  const [isSearching, setIsSearching] = useState(false);
  
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

  // Function to perform search with current filter state
  const performSearch = async () => {
    if (!make) {
      alert('Please select a make to search');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    
    try {
      console.log('Performing Copart search with filters:', filterState);
      
      // Build search parameters for Copart (site=1)
      const searchParams = new URLSearchParams({
        make: make,
        site: '1', // Copart site ID
        page: page.toString(),
        size: resultsPerPage.toString(),
        year_from: yearFrom.toString(),
        year_to: yearTo.toString(),
        sale_date_from: auctionDateFrom,
        sale_date_to: auctionDateTo
      });

      // Add model if specified
      if (model) {
        searchParams.append('model', model);
      }
      
      // Make the API call to Copart endpoint
      const response = await fetch('/api/sales-history?' + searchParams.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received Copart search data:', data);
      
      if (data.success) {
        setSearchResults(data.data);
        setTotalResults(data.data.salesHistory?.length || 0);
      } else {
        console.error('Search failed:', data.error);
        alert('Search failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Search error:', error);
      alert('Search failed: ' + (error?.message || 'Unknown error'));
    } finally {
      setIsSearching(false);
    }
  };

  // Function to reset search
  const resetSearch = () => {
    setHasSearched(false);
    setSearchResults(null);
    setIsSearching(false);
    setPage(1);
    setTotalResults(0);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header with platform toggle */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                  ← Back to Dashboard
                </Link>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Copart Vehicle Search
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Search and analyze Copart auction sales data
                  </p>
                </div>
              </div>
              <PlatformToggle currentPlatform="copart" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Search Criteria
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Make */}
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
                  <option value="Acura">Acura</option>
                  <option value="Audi">Audi</option>
                  <option value="BMW">BMW</option>
                  <option value="Buick">Buick</option>
                  <option value="Cadillac">Cadillac</option>
                  <option value="Chevrolet">Chevrolet</option>
                  <option value="Chrysler">Chrysler</option>
                  <option value="Dodge">Dodge</option>
                  <option value="Ford">Ford</option>
                  <option value="GMC">GMC</option>
                  <option value="Honda">Honda</option>
                  <option value="Hyundai">Hyundai</option>
                  <option value="Infiniti">Infiniti</option>
                  <option value="Jeep">Jeep</option>
                  <option value="Kia">Kia</option>
                  <option value="Lexus">Lexus</option>
                  <option value="Lincoln">Lincoln</option>
                  <option value="Mazda">Mazda</option>
                  <option value="Mercedes-Benz">Mercedes-Benz</option>
                  <option value="Mitsubishi">Mitsubishi</option>
                  <option value="Nissan">Nissan</option>
                  <option value="Ram">Ram</option>
                  <option value="Subaru">Subaru</option>
                  <option value="Tesla">Tesla</option>
                  <option value="Toyota">Toyota</option>
                  <option value="Volkswagen">Volkswagen</option>
                  <option value="Volvo">Volvo</option>
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
                      <option value="4Runner">4Runner</option>
                      <option value="Avalon">Avalon</option>
                      <option value="Camry">Camry</option>
                      <option value="Corolla">Corolla</option>
                      <option value="Highlander">Highlander</option>
                      <option value="Prius">Prius</option>
                      <option value="RAV4">RAV4</option>
                      <option value="Sequoia">Sequoia</option>
                      <option value="Sienna">Sienna</option>
                      <option value="Tacoma">Tacoma</option>
                      <option value="Tundra">Tundra</option>
                      <option value="Venza">Venza</option>
                    </>
                  )}
                  {make === 'Honda' && (
                    <>
                      <option value="Accord">Accord</option>
                      <option value="Civic">Civic</option>
                      <option value="CR-V">CR-V</option>
                      <option value="HR-V">HR-V</option>
                      <option value="Odyssey">Odyssey</option>
                      <option value="Passport">Passport</option>
                      <option value="Pilot">Pilot</option>
                      <option value="Ridgeline">Ridgeline</option>
                    </>
                  )}
                  {make === 'Ford' && (
                    <>
                      <option value="Bronco">Bronco</option>
                      <option value="Edge">Edge</option>
                      <option value="Escape">Escape</option>
                      <option value="Expedition">Expedition</option>
                      <option value="Explorer">Explorer</option>
                      <option value="F-150">F-150</option>
                      <option value="F-250">F-250</option>
                      <option value="F-350">F-350</option>
                      <option value="Focus">Focus</option>
                      <option value="Fusion">Fusion</option>
                      <option value="Mustang">Mustang</option>
                      <option value="Ranger">Ranger</option>
                    </>
                  )}
                  {make === 'Chevrolet' && (
                    <>
                      <option value="Blazer">Blazer</option>
                      <option value="Camaro">Camaro</option>
                      <option value="Colorado">Colorado</option>
                      <option value="Corvette">Corvette</option>
                      <option value="Cruze">Cruze</option>
                      <option value="Equinox">Equinox</option>
                      <option value="Impala">Impala</option>
                      <option value="Malibu">Malibu</option>
                      <option value="Silverado 1500">Silverado 1500</option>
                      <option value="Silverado 2500">Silverado 2500</option>
                      <option value="Suburban">Suburban</option>
                      <option value="Tahoe">Tahoe</option>
                      <option value="Traverse">Traverse</option>
                    </>
                  )}
                  {make === 'Nissan' && (
                    <>
                      <option value="Altima">Altima</option>
                      <option value="Armada">Armada</option>
                      <option value="Frontier">Frontier</option>
                      <option value="Maxima">Maxima</option>
                      <option value="Murano">Murano</option>
                      <option value="Pathfinder">Pathfinder</option>
                      <option value="Rogue">Rogue</option>
                      <option value="Sentra">Sentra</option>
                      <option value="Titan">Titan</option>
                      <option value="Versa">Versa</option>
                    </>
                  )}
                  {make === 'BMW' && (
                    <>
                      <option value="3 Series">3 Series</option>
                      <option value="5 Series">5 Series</option>
                      <option value="7 Series">7 Series</option>
                      <option value="X1">X1</option>
                      <option value="X3">X3</option>
                      <option value="X5">X5</option>
                      <option value="X7">X7</option>
                    </>
                  )}
                  {make === 'Mercedes-Benz' && (
                    <>
                      <option value="C-Class">C-Class</option>
                      <option value="E-Class">E-Class</option>
                      <option value="S-Class">S-Class</option>
                      <option value="GLC">GLC</option>
                      <option value="GLE">GLE</option>
                      <option value="GLS">GLS</option>
                    </>
                  )}
                  {make === 'Lexus' && (
                    <>
                      <option value="ES">ES</option>
                      <option value="GX">GX</option>
                      <option value="IS">IS</option>
                      <option value="LS">LS</option>
                      <option value="LX">LX</option>
                      <option value="NX">NX</option>
                      <option value="RX">RX</option>
                    </>
                  )}
                  {make === 'Audi' && (
                    <>
                      <option value="A3">A3</option>
                      <option value="A4">A4</option>
                      <option value="A6">A6</option>
                      <option value="A8">A8</option>
                      <option value="Q3">Q3</option>
                      <option value="Q5">Q5</option>
                      <option value="Q7">Q7</option>
                      <option value="Q8">Q8</option>
                    </>
                  )}
                  {make === 'Jeep' && (
                    <>
                      <option value="Cherokee">Cherokee</option>
                      <option value="Compass">Compass</option>
                      <option value="Grand Cherokee">Grand Cherokee</option>
                      <option value="Gladiator">Gladiator</option>
                      <option value="Renegade">Renegade</option>
                      <option value="Wrangler">Wrangler</option>
                    </>
                  )}
                  {make === 'Hyundai' && (
                    <>
                      <option value="Accent">Accent</option>
                      <option value="Elantra">Elantra</option>
                      <option value="Genesis">Genesis</option>
                      <option value="Palisade">Palisade</option>
                      <option value="Santa Fe">Santa Fe</option>
                      <option value="Sonata">Sonata</option>
                      <option value="Tucson">Tucson</option>
                    </>
                  )}
                  {make === 'Kia' && (
                    <>
                      <option value="Forte">Forte</option>
                      <option value="Optima">Optima</option>
                      <option value="Rio">Rio</option>
                      <option value="Sorento">Sorento</option>
                      <option value="Soul">Soul</option>
                      <option value="Sportage">Sportage</option>
                      <option value="Telluride">Telluride</option>
                    </>
                  )}
                  {make === 'Subaru' && (
                    <>
                      <option value="Ascent">Ascent</option>
                      <option value="Forester">Forester</option>
                      <option value="Impreza">Impreza</option>
                      <option value="Legacy">Legacy</option>
                      <option value="Outback">Outback</option>
                      <option value="WRX">WRX</option>
                    </>
                  )}
                  {make === 'Tesla' && (
                    <>
                      <option value="Model 3">Model 3</option>
                      <option value="Model S">Model S</option>
                      <option value="Model X">Model X</option>
                      <option value="Model Y">Model Y</option>
                    </>
                  )}
                  {make === 'Dodge' && (
                    <>
                      <option value="Challenger">Challenger</option>
                      <option value="Charger">Charger</option>
                      <option value="Durango">Durango</option>
                      <option value="Journey">Journey</option>
                    </>
                  )}
                  {make === 'Ram' && (
                    <>
                      <option value="1500">1500</option>
                      <option value="2500">2500</option>
                      <option value="3500">3500</option>
                    </>
                  )}
                  {make === 'GMC' && (
                    <>
                      <option value="Acadia">Acadia</option>
                      <option value="Canyon">Canyon</option>
                      <option value="Sierra 1500">Sierra 1500</option>
                      <option value="Sierra 2500">Sierra 2500</option>
                      <option value="Terrain">Terrain</option>
                      <option value="Yukon">Yukon</option>
                    </>
                  )}
                  {make === 'Mazda' && (
                    <>
                      <option value="CX-3">CX-3</option>
                      <option value="CX-5">CX-5</option>
                      <option value="CX-9">CX-9</option>
                      <option value="Mazda3">Mazda3</option>
                      <option value="Mazda6">Mazda6</option>
                      <option value="MX-5 Miata">MX-5 Miata</option>
                    </>
                  )}
                  {make === 'Volkswagen' && (
                    <>
                      <option value="Atlas">Atlas</option>
                      <option value="Golf">Golf</option>
                      <option value="Jetta">Jetta</option>
                      <option value="Passat">Passat</option>
                      <option value="Tiguan">Tiguan</option>
                    </>
                  )}
                  {make === 'Acura' && (
                    <>
                      <option value="ILX">ILX</option>
                      <option value="MDX">MDX</option>
                      <option value="RDX">RDX</option>
                      <option value="TLX">TLX</option>
                    </>
                  )}
                  {make === 'Infiniti' && (
                    <>
                      <option value="Q50">Q50</option>
                      <option value="Q60">Q60</option>
                      <option value="QX50">QX50</option>
                      <option value="QX60">QX60</option>
                      <option value="QX80">QX80</option>
                    </>
                  )}
                  {make === 'Cadillac' && (
                    <>
                      <option value="CT4">CT4</option>
                      <option value="CT5">CT5</option>
                      <option value="Escalade">Escalade</option>
                      <option value="XT4">XT4</option>
                      <option value="XT5">XT5</option>
                      <option value="XT6">XT6</option>
                    </>
                  )}
                  {make === 'Lincoln' && (
                    <>
                      <option value="Aviator">Aviator</option>
                      <option value="Continental">Continental</option>
                      <option value="Corsair">Corsair</option>
                      <option value="Navigator">Navigator</option>
                    </>
                  )}
                  {make === 'Buick' && (
                    <>
                      <option value="Enclave">Enclave</option>
                      <option value="Encore">Encore</option>
                      <option value="Envision">Envision</option>
                    </>
                  )}
                  {make === 'Chrysler' && (
                    <>
                      <option value="300">300</option>
                      <option value="Pacifica">Pacifica</option>
                    </>
                  )}
                  {make === 'Mitsubishi' && (
                    <>
                      <option value="Eclipse Cross">Eclipse Cross</option>
                      <option value="Mirage">Mirage</option>
                      <option value="Outlander">Outlander</option>
                    </>
                  )}
                  {make === 'Volvo' && (
                    <>
                      <option value="S60">S60</option>
                      <option value="S90">S90</option>
                      <option value="XC40">XC40</option>
                      <option value="XC60">XC60</option>
                      <option value="XC90">XC90</option>
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
                    {Array.from({ length: 25 }, (_, i) => currentYear - i).map(year => (
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
                    {Array.from({ length: 25 }, (_, i) => currentYear - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Auction Date Range */}
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label htmlFor="auctionDateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sale Date From
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
                    Sale Date To
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

            {/* Search Actions */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
              <button
                onClick={performSearch}
                disabled={isSearching || !make}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-md transition-colors flex items-center justify-center min-w-[140px]"
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
                  'Search Copart'
                )}
              </button>
              
              {hasSearched && (
                <button
                  onClick={resetSearch}
                  className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-md transition-colors"
                >
                  Reset Search
                </button>
              )}
            </div>
          </div>

          {/* Search Results */}
          {hasSearched && searchResults && searchResults.salesHistory && (
            <div className="space-y-6">
              {/* Results Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Search Results: {make} {model} ({yearFrom}-{yearTo})
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Found {searchResults.salesHistory.length} vehicles • Average Price: {formatCurrency(calculateAveragePrice(searchResults.salesHistory))}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Copart Data
                    </span>
                  </div>
                </div>
              </div>

              {/* View Tabs */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab(TabType.TIMELINE)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === TabType.TIMELINE
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Analytics Dashboard
                    </button>
                    <button
                      onClick={() => setActiveTab(TabType.TABLE)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === TabType.TABLE
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Table View
                    </button>
                    <button
                      onClick={() => setActiveTab(TabType.PHOTOS)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === TabType.PHOTOS
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Photo Grid
                    </button>
                  </nav>
                </div>

                <div className="p-6">
                  {/* Analytics Dashboard */}
                  {activeTab === TabType.TIMELINE && (
                    <SalesAnalytics salesHistory={searchResults.salesHistory} />
                  )}

                  {/* Table View */}
                  {activeTab === TabType.TABLE && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
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
                              Mileage
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Damage
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Location
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {searchResults.salesHistory.map((sale: any) => (
                            <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => openVehicleDetails(sale)}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-12 w-12">
                                    {sale.link_img_small && sale.link_img_small[0] ? (
                                      <img 
                                        className="h-12 w-12 rounded object-cover" 
                                        src={sale.link_img_small[0]} 
                                        alt={`${sale.year} ${sale.make} ${sale.model}`}
                                        onError={(e) => {
                                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42Mjc0IDM2IDM2IDMwLjYyNzQgMzYgMjRDMzYgMTcuMzcyNiAzMC42Mjc0IDEyIDI0IDEyQzE3LjM3MjYgMTIgMTIgMTcuMzcyNiAxMiAyNEMxMiAzMC42Mjc0IDE3LjM3MjYgMzYgMjQgMzZaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0yNCAyOFYyNCIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMjQgMjBIMjQuMDEiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';
                                        }}
                                      />
                                    ) : (
                                      <div className="h-12 w-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <span className="text-gray-400 text-xs">No Image</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {sale.year} {sale.make} {sale.model}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {sale.series} • VIN: {sale.vin?.slice(-8)}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {new Date(sale.sale_date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {formatCurrency(sale.purchase_price)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {(sale.vehicle_mileage || sale.odometer)?.toLocaleString()} miles
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  {sale.vehicle_damage || 'Unknown'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {sale.auction_location}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  sale.sale_status === 'Sold' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
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

                  {/* Photo Grid */}
                  {activeTab === TabType.PHOTOS && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {searchResults.salesHistory.map((sale: any) => (
                        <div key={sale.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => openVehicleDetails(sale)}>
                          <div className="aspect-w-16 aspect-h-12 relative">
                            {sale.link_img_small && sale.link_img_small[0] ? (
                              <img 
                                className="w-full h-48 object-cover" 
                                src={sale.link_img_small[0]} 
                                alt={`${sale.year} ${sale.make} ${sale.model}`}
                                onError={(e) => {
                                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDMyMCAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTkyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNjAgMTI4QzE3Ny42NzMgMTI4IDE5MiAxMTMuNjczIDE5MiA5NkMxOTIgNzguMzI2OSAxNzcuNjczIDY0IDE2MCA2NEMxNDIuMzI3IDY0IDEyOCA3OC4zMjY5IDEyOCA5NkMxMjggMTEzLjY3MyAxNDIuMzI3IDEyOCAxNjAgMTI4WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMTYwIDEwNFY5NiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMTYwIDg4SDE2MC4wMSIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=';
                                }}
                              />
                            ) : (
                              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <span className="text-gray-400">No Image Available</span>
                              </div>
                            )}
                            <div className="absolute top-2 right-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                sale.sale_status === 'Sold' 
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-500 text-white'
                              }`}>
                                {sale.sale_status}
                              </span>
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              {sale.year} {sale.make} {sale.model} {sale.series}
                            </h3>
                            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                              <div className="flex justify-between">
                                <span>Price:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(sale.purchase_price)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Mileage:</span>
                                <span>{(sale.vehicle_mileage || sale.odometer)?.toLocaleString()} mi</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Damage:</span>
                                <span>{sale.vehicle_damage || 'Unknown'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Location:</span>
                                <span>{sale.auction_location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Pagination */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing <span className="font-medium">{(page - 1) * resultsPerPage + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(page * resultsPerPage, totalResults)}</span> of{' '}
                    <span className="font-medium">{totalResults}</span> results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                      Page {page}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={searchResults.salesHistory.length < resultsPerPage}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
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

          {/* Vehicle Details Modal */}
          {isModalOpen && selectedVehicle && (
            <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closeModal}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                  <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                        {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model} {selectedVehicle.series}
                      </h3>
                      <button
                        onClick={closeModal}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Vehicle Image */}
                      <div>
                        {selectedVehicle.link_img_hd && selectedVehicle.link_img_hd[0] ? (
                          <img 
                            className="w-full h-64 object-cover rounded-lg" 
                            src={selectedVehicle.link_img_hd[0]} 
                            alt={`${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
                          />
                        ) : (
                          <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400">No Image Available</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Vehicle Details */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">Sale Price:</span>
                            <p className="text-gray-600 dark:text-gray-400">{formatCurrency(selectedVehicle.purchase_price)}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">Sale Date:</span>
                            <p className="text-gray-600 dark:text-gray-400">{new Date(selectedVehicle.sale_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">Mileage:</span>
                            <p className="text-gray-600 dark:text-gray-400">{(selectedVehicle.vehicle_mileage || selectedVehicle.odometer)?.toLocaleString()} miles</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">VIN:</span>
                            <p className="text-gray-600 dark:text-gray-400 font-mono text-xs">{selectedVehicle.vin}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">Damage:</span>
                            <p className="text-gray-600 dark:text-gray-400">{selectedVehicle.vehicle_damage || 'Unknown'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">Title:</span>
                            <p className="text-gray-600 dark:text-gray-400">{selectedVehicle.vehicle_title || 'Unknown'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">Location:</span>
                            <p className="text-gray-600 dark:text-gray-400">{selectedVehicle.auction_location}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">Status:</span>
                            <p className="text-gray-600 dark:text-gray-400">{selectedVehicle.sale_status}</p>
                          </div>
                        </div>
                        
                        {selectedVehicle.link && (
                          <div className="pt-4">
                            <a 
                              href={selectedVehicle.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                              View on Copart
                              <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}