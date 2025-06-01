import { useState } from 'react';
import { useSalesHistory, FilterState } from '../hooks/useSalesHistory';
import ErrorBoundary from '../components/ui/error-boundary';
import { Link, useLocation } from 'wouter';
import SalesAnalytics from '../components/sales/SalesAnalytics';
import { Button } from '@/components/ui/button';
import { Car } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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

export default function IAAIPage() {
  // Primary search parameters
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('');
  const [vin, setVin] = useState('');
  const [yearFrom, setYearFrom] = useState(currentYear - 5);
  const [yearTo, setYearTo] = useState(currentYear);
  const [sites, setSites] = useState<string[]>(['iaai']); // Changed to iaai
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
  
  // Fresh Data Toggle for Gold+ (Gold and Platinum) users
  const { hasPermission } = useAuth();
  const [freshDataEnabled, setFreshDataEnabled] = useState(false);
  const [fetchingFreshData, setFetchingFreshData] = useState(false);
  
  // Function to open vehicle details modal
  const openVehicleDetails = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setCurrentImageIndex(0);
    setIsModalOpen(true);
  };

  // Function to close vehicle details modal
  const closeVehicleDetails = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
    setCurrentImageIndex(0);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section with Platform Toggle */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  IAAI Vehicle Sales History
                </h1>
                <p className="text-red-100 text-lg">
                  Search and analyze vehicle sales data from IAAI auctions
                </p>
              </div>
              <PlatformToggle />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SalesAnalytics
            make={make}
            setMake={setMake}
            model={model}
            setModel={setModel}
            vin={vin}
            setVin={setVin}
            yearFrom={yearFrom}
            setYearFrom={setYearFrom}
            yearTo={yearTo}
            setYearTo={setYearTo}
            auctionDateFrom={auctionDateFrom}
            setAuctionDateFrom={setAuctionDateFrom}
            auctionDateTo={auctionDateTo}
            setAuctionDateTo={setAuctionDateTo}
            damageType={damageType}
            setDamageType={setDamageType}
            minMileage={minMileage}
            setMinMileage={setMinMileage}
            maxMileage={maxMileage}
            setMaxMileage={setMaxMileage}
            platform="iaai"
            hasSearched={hasSearched}
            setHasSearched={setHasSearched}
            searchResults={searchResults}
            setSearchResults={setSearchResults}
            openVehicleDetails={openVehicleDetails}
            selectedVehicle={selectedVehicle}
            isModalOpen={isModalOpen}
            closeVehicleDetails={closeVehicleDetails}
            currentImageIndex={currentImageIndex}
            setCurrentImageIndex={setCurrentImageIndex}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            freshDataEnabled={freshDataEnabled}
            setFreshDataEnabled={setFreshDataEnabled}
            fetchingFreshData={fetchingFreshData}
            setFetchingFreshData={setFetchingFreshData}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}