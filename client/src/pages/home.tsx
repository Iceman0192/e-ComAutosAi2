import { useState } from 'react';
import { useSalesHistory, FilterState } from '../hooks/useSalesHistory';
import ErrorBoundary from '../components/ui/error-boundary';
import { Link } from 'wouter';
import TieredTimelineContent from '../components/sales/TieredTimelineContent';
import TieredTableContent from '../components/sales/TieredTableContent';
import { formatCurrency } from '../utils/formatters';
import PlatformToggle from '../components/ui/platform-toggle';

enum TabType {
  TIMELINE = "timeline",
  TABLE = "table",
  PHOTOS = "photos"
}

const currentYear = new Date().getFullYear();

export default function Home() {
  // Primary search parameters
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('Camry');
  const [yearFrom, setYearFrom] = useState(2015);
  const [yearTo, setYearTo] = useState(currentYear);
  
  // Secondary filters (shown after search)
  const [showSecondaryFilters, setShowSecondaryFilters] = useState(false);
  const [selectedDamageTypes, setSelectedDamageTypes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 50000 });
  const [mileageRange, setMileageRange] = useState<{ min: number; max: number }>({ min: 0, max: 200000 });
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  
  // Modal and UI state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>(TabType.TIMELINE);

  const filterState: FilterState = {
    make,
    model,
    year_from: yearFrom,
    year_to: yearTo,
    sites: ['copart']
  };

  const { data: searchResults, isLoading, error, refetch } = useSalesHistory(filterState);

  const handleSearch = () => {
    setShowSecondaryFilters(true);
    refetch();
  };

  const openModal = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setCurrentImageIndex(0);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
  };

  const nextImage = () => {
    if (selectedVehicle?.link_img_hd) {
      setCurrentImageIndex((prev) => 
        prev === selectedVehicle.link_img_hd.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (selectedVehicle?.link_img_hd) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedVehicle.link_img_hd.length - 1 : prev - 1
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Vehicle Sales History Search
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Search and analyze vehicle auction sales data from Copart
          </p>
        </div>

        {/* Platform Toggle */}
        <div className="flex justify-center mb-8">
          <PlatformToggle />
        </div>

        {/* Primary Search Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Make
              </label>
              <select
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="Toyota">Toyota</option>
                <option value="Honda">Honda</option>
                <option value="Ford">Ford</option>
                <option value="Chevrolet">Chevrolet</option>
                <option value="BMW">BMW</option>
                <option value="Mercedes-Benz">Mercedes-Benz</option>
                <option value="Audi">Audi</option>
                <option value="Nissan">Nissan</option>
                <option value="Hyundai">Hyundai</option>
                <option value="Volkswagen">Volkswagen</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Enter model"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Year From
              </label>
              <select
                value={yearFrom}
                onChange={(e) => setYearFrom(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {Array.from({ length: 30 }, (_, i) => currentYear - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Year To
              </label>
              <select
                value={yearTo}
                onChange={(e) => setYearTo(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {Array.from({ length: 30 }, (_, i) => currentYear - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                'Search Sales History'
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {showSecondaryFilters && (
          <ErrorBoundary>
            {error ? (
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6">
                <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
                  Search Error
                </h3>
                <p className="text-red-600 dark:text-red-300">
                  {error.message || 'Failed to fetch sales history. Please try again.'}
                </p>
                <button
                  onClick={handleSearch}
                  className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  Retry Search
                </button>
              </div>
            ) : searchResults?.data?.salesHistory?.length ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex space-x-8 px-6">
                    <button
                      onClick={() => setActiveTab(TabType.TIMELINE)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === TabType.TIMELINE
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Timeline & Analytics
                    </button>
                    <button
                      onClick={() => setActiveTab(TabType.TABLE)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === TabType.TABLE
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Table View
                    </button>
                    <button
                      onClick={() => setActiveTab(TabType.PHOTOS)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === TabType.PHOTOS
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Photos Grid
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                {activeTab === TabType.TIMELINE && (
                  <TieredTimelineContent searchResults={searchResults} />
                )}
                
                {activeTab === TabType.TABLE && (
                  <TieredTableContent searchResults={searchResults} />
                )}
                
                {activeTab === TabType.PHOTOS && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {searchResults.data.salesHistory
                        .filter((sale: any) => sale.link_img_small && sale.link_img_small.length > 0)
                        .map((sale: any) => (
                          <div key={sale.id} className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                               onClick={() => openModal(sale)}>
                            <div className="aspect-w-16 aspect-h-9">
                              <img
                                src={sale.link_img_small[0]}
                                alt={`${sale.year} ${sale.make} ${sale.model}`}
                                className="w-full h-48 object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f3f4f6"/><text x="150" y="100" text-anchor="middle" fill="%236b7280" font-family="Arial, sans-serif" font-size="14">No Image Available</text></svg>';
                                }}
                              />
                            </div>
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {sale.year} {sale.make} {sale.model}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Sale Price: {sale.purchase_price ? formatCurrency(sale.purchase_price) : 'N/A'}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Date: {new Date(sale.sale_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        )}

        {/* Vehicle Detail Modal */}
        {isModalOpen && selectedVehicle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Vehicle Images */}
                {selectedVehicle.link_img_hd && selectedVehicle.link_img_hd.length > 0 && (
                  <div className="mb-6">
                    <div className="relative">
                      <img
                        src={selectedVehicle.link_img_hd[currentImageIndex]}
                        alt={`${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
                        className="w-full h-64 sm:h-96 object-cover rounded-lg"
                      />
                      {selectedVehicle.link_img_hd.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                    {selectedVehicle.link_img_hd.length > 1 && (
                      <div className="flex justify-center mt-4 space-x-2">
                        {selectedVehicle.link_img_hd.map((_: any, index: number) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-3 h-3 rounded-full ${
                              index === currentImageIndex ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Vehicle Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sale Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Sale Price:</span>
                        <span className="font-medium">{selectedVehicle.purchase_price ? formatCurrency(selectedVehicle.purchase_price) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Sale Date:</span>
                        <span className="font-medium">{new Date(selectedVehicle.sale_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <span className="font-medium">{selectedVehicle.sale_status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Location:</span>
                        <span className="font-medium">Copart: {selectedVehicle.auction_location || selectedVehicle.location || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vehicle Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">VIN:</span>
                        <span className="font-medium">{selectedVehicle.vin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Mileage:</span>
                        <span className="font-medium">{selectedVehicle.odometer?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Damage:</span>
                        <span className="font-medium">{selectedVehicle.damage_pr || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Title:</span>
                        <span className="font-medium">{selectedVehicle.title || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}