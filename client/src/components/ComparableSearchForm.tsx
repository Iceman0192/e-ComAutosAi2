import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  MapPin,
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';

interface ComparableSearchFormProps {
  lotData: any;
  platform?: 'copart' | 'iaai';
}

export default function ComparableSearchForm({ lotData, platform = 'copart' }: ComparableSearchFormProps) {
  const { hasPermission } = useAuth();
  
  // Gold users only see their current platform, Platinum+ gets cross-platform
  const allowedSites = hasPermission('CROSS_PLATFORM_SEARCH') 
    ? ['copart', 'iaai'] 
    : [platform];
    
  const [searchParams, setSearchParams] = useState({
    make: lotData.make || '',
    model: lotData.model || '',
    series: lotData.series || lotData.trim || '',
    yearFrom: lotData.year ? lotData.year - 1 : 2020,
    yearTo: lotData.year ? lotData.year + 1 : 2025,
    damageType: lotData.damage_pr || lotData.damage_primary || lotData.vehicle_damage || '',
    maxMileage: lotData.odometer ? Math.round(lotData.odometer * 1.2) : '',
    saleStatus: 'sold',
    engineType: '',
    documentType: '',
    driveType: '',
    vehicleStatus: '',
    locationState: '',
    sites: allowedSites
  });

  const [hasSearched, setHasSearched] = useState(false);

  // Authentic damage types from your database
  const damageTypes = [
    'Burn Engine', 'Damage History', 'Suspension', 'Electrical', 'Mechanical',
    'Replaced Vin', 'Burn', 'Unknown', 'Top/Roof', 'Partial Repair', 'Theft',
    'Rear End', 'Minor Dent/Scratches', 'Front End', 'Engine Damage', 'Side',
    'All Over', 'Stripped', 'Water/Flood', 'Repossession'
  ];

  // Fetch comparable vehicles
  const { data: comparableData, isLoading, error } = useQuery({
    queryKey: ['/api/find-comparables', searchParams, hasSearched],
    queryFn: async () => {
      const response = await fetch('/api/find-comparables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch comparable vehicles');
      }
      const result = await response.json();
      // Extract data from the wrapper if it exists
      return result.data || result;
    },
    enabled: hasSearched && !!searchParams.make,
  });

  const handleSearch = () => {
    setHasSearched(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Pre-filled Search Form with Enhanced Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="make" className="text-sm font-medium">Vehicle Make</Label>
          <Input
            id="make"
            value={searchParams.make}
            onChange={(e) => setSearchParams({ ...searchParams, make: e.target.value })}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="model" className="text-sm font-medium">Model</Label>
          <Input
            id="model"
            value={searchParams.model}
            onChange={(e) => setSearchParams({ ...searchParams, model: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="series" className="text-sm font-medium">Series/Trim</Label>
          <Input
            id="series"
            value={searchParams.series}
            onChange={(e) => setSearchParams({ ...searchParams, series: e.target.value })}
            className="mt-1"
            placeholder="e.g., TRD Pro, Limited"
          />
        </div>

        <div>
          <Label htmlFor="damageType" className="text-sm font-medium">Damage Type</Label>
          <Select
            value={searchParams.damageType}
            onValueChange={(value) => setSearchParams({ ...searchParams, damageType: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select damage type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {damageTypes.map((damage) => (
                <SelectItem key={damage} value={damage}>
                  {damage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="yearFrom" className="text-sm font-medium">Year Range</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="yearFrom"
              type="number"
              value={searchParams.yearFrom}
              onChange={(e) => setSearchParams({ ...searchParams, yearFrom: parseInt(e.target.value) })}
              placeholder="From"
              min="1990"
              max="2025"
            />
            <Input
              type="number"
              value={searchParams.yearTo}
              onChange={(e) => setSearchParams({ ...searchParams, yearTo: parseInt(e.target.value) })}
              placeholder="To"
              min="1990"
              max="2025"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="maxMileage" className="text-sm font-medium">Max Mileage</Label>
          <Input
            id="maxMileage"
            type="number"
            value={searchParams.maxMileage}
            onChange={(e) => setSearchParams({ ...searchParams, maxMileage: e.target.value })}
            className="mt-1"
            placeholder="Maximum odometer reading"
          />
        </div>

        <div>
          <Label htmlFor="saleStatus" className="text-sm font-medium">Sale Status</Label>
          <Select 
            value={searchParams.saleStatus} 
            onValueChange={(value) => setSearchParams({ ...searchParams, saleStatus: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select sale status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sold">Sold Only</SelectItem>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="on_approval">On Approval</SelectItem>
              <SelectItem value="not_sold">Not Sold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="engineType" className="text-sm font-medium">Engine Type</Label>
          <Select 
            value={searchParams.engineType} 
            onValueChange={(value) => setSearchParams({ ...searchParams, engineType: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Any engine type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Engine Type</SelectItem>
              <SelectItem value="3.5l 6">3.5L V6</SelectItem>
              <SelectItem value="3.5l v-6 di, dohc, vvt, 278hp">3.5L V6 DI DOHC VVT 278HP</SelectItem>
              <SelectItem value="2.7l 4">2.7L I4</SelectItem>
              <SelectItem value="4.0l 6">4.0L V6</SelectItem>
              <SelectItem value="2.4l 4">2.4L I4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="documentType" className="text-sm font-medium">Document Type</Label>
          <Select 
            value={searchParams.documentType} 
            onValueChange={(value) => setSearchParams({ ...searchParams, documentType: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Any document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Document Type</SelectItem>
              <SelectItem value="Salvage">Salvage</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
              <SelectItem value="Clear">Clear</SelectItem>
              <SelectItem value="Lemon">Lemon</SelectItem>
              <SelectItem value="Flood">Flood</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="driveType" className="text-sm font-medium">Drive Type</Label>
          <Select 
            value={searchParams.driveType} 
            onValueChange={(value) => setSearchParams({ ...searchParams, driveType: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Any drive type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Drive Type</SelectItem>
              <SelectItem value="Front Wheel Drive">Front Wheel Drive (FWD)</SelectItem>
              <SelectItem value="All Wheel Drive">All Wheel Drive (AWD)</SelectItem>
              <SelectItem value="Four Wheel Drive">Four Wheel Drive (4WD)</SelectItem>
              <SelectItem value="Rear Wheel Drive">Rear Wheel Drive (RWD)</SelectItem>
              <SelectItem value="Unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="vehicleStatus" className="text-sm font-medium">Vehicle Status</Label>
          <Select 
            value={searchParams.vehicleStatus} 
            onValueChange={(value) => setSearchParams({ ...searchParams, vehicleStatus: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Any vehicle status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Status</SelectItem>
              <SelectItem value="Run & Drive">Run & Drive</SelectItem>
              <SelectItem value="Starts">Starts</SelectItem>
              <SelectItem value="Enhanced Vehicle">Enhanced Vehicle</SelectItem>
              <SelectItem value="Stationary/Cranks">Stationary/Cranks</SelectItem>
              <SelectItem value="Unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="locationState" className="text-sm font-medium">Location (State)</Label>
          <Select 
            value={searchParams.locationState} 
            onValueChange={(value) => setSearchParams({ ...searchParams, locationState: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Any state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any State</SelectItem>
              <SelectItem value="TX">Texas (TX)</SelectItem>
              <SelectItem value="FL">Florida (FL)</SelectItem>
              <SelectItem value="CA">California (CA)</SelectItem>
              <SelectItem value="AZ">Arizona (AZ)</SelectItem>
              <SelectItem value="GA">Georgia (GA)</SelectItem>
              <SelectItem value="NC">North Carolina (NC)</SelectItem>
              <SelectItem value="IL">Illinois (IL)</SelectItem>
              <SelectItem value="PA">Pennsylvania (PA)</SelectItem>
              <SelectItem value="OH">Ohio (OH)</SelectItem>
              <SelectItem value="VA">Virginia (VA)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button 
            onClick={handleSearch} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading || !searchParams.make}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Find Comparables
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Results Section */}
      {comparableData && (
        <div className="space-y-4">
          {/* Price Analysis Summary */}
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200 text-lg">
                <DollarSign className="h-5 w-5" />
                {hasPermission('CROSS_PLATFORM_SEARCH') ? 'Cross-Platform Price Analysis' : `${platform === 'copart' ? 'Copart' : 'IAAI'} Price Analysis`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasPermission('CROSS_PLATFORM_SEARCH') ? (
                // Platinum users see cross-platform comparison
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Copart Average</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(comparableData?.statistics?.copartAvgPrice || 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {comparableData?.statistics?.copartCount || 0} vehicles found
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">IAAI Average</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(comparableData?.statistics?.iaaiAvgPrice || 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {comparableData?.statistics?.iaaiCount || 0} vehicles found
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Price Difference</p>
                    <div className="flex items-center justify-center gap-1">
                      {(comparableData?.statistics?.priceDifference || 0) > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <p className={`text-xl font-bold ${
                        (comparableData?.statistics?.priceDifference || 0) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(Math.abs(comparableData?.statistics?.priceDifference || 0))}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {(comparableData?.statistics?.priceDifference || 0) > 0 ? 'Copart higher' : 'IAAI higher'}
                    </p>
                  </div>
                </div>
              ) : (
                // Gold users see only their current platform
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {platform === 'copart' ? 'Copart' : 'IAAI'} Average Price
                  </p>
                  <p className={`text-3xl font-bold ${platform === 'copart' ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(platform === 'copart' ? 
                      (comparableData?.statistics?.copartAvgPrice || 0) : 
                      (comparableData?.statistics?.iaaiAvgPrice || 0)
                    )}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Based on {platform === 'copart' ? 
                      (comparableData?.statistics?.copartCount || 0) : 
                      (comparableData?.statistics?.iaaiCount || 0)
                    } comparable vehicles
                  </p>
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Upgrade to Platinum for cross-platform price comparisons
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analytics and Sales Table */}
          {comparableData?.comparables && (
            <>
              <ComparableAnalytics 
                data={comparableData} 
                platform={platform}
                hasPermission={hasPermission}
              />
              <Card>
                <CardContent className="p-0">
                  <ComparableSalesTable 
                    data={comparableData} 
                    platform={platform}
                    hasPermission={hasPermission}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4">
            <p className="text-red-700 dark:text-red-300 text-sm">
              Unable to search for comparable vehicles. Please check your search criteria and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!hasSearched && !isLoading && (
        <div className="text-center py-6">
          <div className="text-gray-500 dark:text-gray-400">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              Click "Find Comparables" to search for similar vehicles in your database
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Analytics component for comparable sales
function ComparableAnalytics({ data, platform, hasPermission }: any) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = data?.statistics || {};

  return (
    <div className={`grid grid-cols-1 gap-4 mb-6 ${hasPermission('CROSS_PLATFORM_SEARCH') ? 'md:grid-cols-4' : 'md:grid-cols-2'}`}>
      {/* Only show Total Found for Platinum+ users who see cross-platform data */}
      {hasPermission('CROSS_PLATFORM_SEARCH') && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Found</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {stats.totalFound || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Price</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {hasPermission('CROSS_PLATFORM_SEARCH') 
                ? formatCurrency((stats.copartAvgPrice + stats.iaaiAvgPrice) / 2 || 0)
                : formatCurrency(platform === 'copart' ? stats.copartAvgPrice || 0 : stats.iaaiAvgPrice || 0)
              }
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${platform === 'copart' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-red-100 dark:bg-red-900'}`}>
            <Badge className={`h-5 w-5 ${platform === 'copart' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`} />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {hasPermission('CROSS_PLATFORM_SEARCH') ? 'Copart Sales' : `${platform === 'copart' ? 'Copart' : 'IAAI'} Sales`}
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {hasPermission('CROSS_PLATFORM_SEARCH') 
                ? stats.copartCount || 0
                : platform === 'copart' 
                  ? stats.copartCount || 0 
                  : stats.iaaiCount || 0
              }
            </p>
          </div>
        </div>
      </div>

      {/* Only show both platform counts for Platinum+ users */}
      {hasPermission('CROSS_PLATFORM_SEARCH') && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <Badge className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">IAAI Sales</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {stats.iaaiCount || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Table component for comparable sales with pagination
function ComparableSalesTable({ data, platform, hasPermission }: any) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const itemsPerPage = 20;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const openModal = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setCurrentImageIndex(0);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedVehicle?.images) {
      const images = typeof selectedVehicle.images === 'string' 
        ? JSON.parse(selectedVehicle.images) 
        : selectedVehicle.images;
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (selectedVehicle?.images) {
      const images = typeof selectedVehicle.images === 'string' 
        ? JSON.parse(selectedVehicle.images) 
        : selectedVehicle.images;
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  // Get platform sales based on user permissions
  const platformSales = hasPermission('CROSS_PLATFORM_SEARCH') 
    ? [
        ...(data?.comparables?.copart || []),
        ...(data?.comparables?.iaai || [])
      ]
    : platform === 'copart' 
      ? (data?.comparables?.copart || [])
      : (data?.comparables?.iaai || []);

  // Search filter
  const filteredSales = platformSales.filter((sale: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (sale.make && sale.make.toLowerCase().includes(query)) ||
      (sale.model && sale.model.toLowerCase().includes(query)) ||
      (sale.vin && sale.vin.toLowerCase().includes(query)) ||
      (sale.location && sale.location.toLowerCase().includes(query)) ||
      (sale.vehicle_damage && sale.vehicle_damage.toLowerCase().includes(query))
    );
  });

  // Sort by sale date (newest first)
  const sortedSales = filteredSales.sort((a: any, b: any) => 
    new Date(b.sale_date || '').getTime() - new Date(a.sale_date || '').getTime()
  );

  // Pagination
  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSales = sortedSales.slice(startIndex, endIndex);

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-medium">Comparable Sales Records</h3>
        <div className="mt-2 sm:mt-0 flex space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-2 text-gray-500 h-4 w-4" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              placeholder="Search records" 
              className="pl-9 pr-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm w-48 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
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
                Damage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Mileage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Final Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Platform
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {currentSales.map((vehicle: any, index: number) => (
              <tr 
                key={`${vehicle.vin}-${index}`}
                onClick={() => openModal(vehicle)}
                className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </div>
                      {vehicle.series && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {vehicle.series}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        VIN: {vehicle.vin}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {vehicle.sale_date ? new Date(vehicle.sale_date).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {vehicle.vehicle_damage || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {vehicle.vehicle_mileage ? vehicle.vehicle_mileage.toLocaleString() + ' mi' : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(vehicle.purchase_price || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={vehicle.site === 1 ? 'default' : 'destructive'}>
                    {vehicle.site === 1 ? 'Copart' : 'IAAI'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex-1 flex justify-between sm:hidden">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, sortedSales.length)}</span> of{' '}
              <span className="font-medium">{sortedSales.length}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="rounded-l-md"
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-none"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="rounded-r-md"
              >
                Next
              </Button>
            </nav>
          </div>
        </div>
      </div>

      {/* Vehicle Detail Modal */}
      {isModalOpen && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model} {selectedVehicle.series}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl">
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Vehicle Photos</h3>
                    {(() => {
                      let images = [];
                      if (selectedVehicle.images) {
                        images = typeof selectedVehicle.images === 'string' 
                          ? JSON.parse(selectedVehicle.images) 
                          : selectedVehicle.images;
                      }
                      return images.length > 0 ? (
                        <div>
                          <div className="relative mb-4">
                            <img
                              src={images[currentImageIndex]}
                              alt={`${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
                              className="w-full h-80 object-cover rounded-lg border"
                            />
                            <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                              {currentImageIndex + 1} of {images.length}
                            </div>
                            {images.length > 1 && (
                              <>
                                <button onClick={prevImage} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80">
                                  <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button onClick={nextImage} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80">
                                  <ChevronRight className="h-5 w-5" />
                                </button>
                              </>
                            )}
                          </div>
                          {images.length > 1 && (
                            <div className="flex space-x-2 overflow-x-auto pb-2">
                              {images.map((img: string, index: number) => (
                                <button
                                  key={index}
                                  onClick={() => setCurrentImageIndex(index)}
                                  className={`flex-shrink-0 w-20 h-16 rounded border-2 overflow-hidden ${
                                    currentImageIndex === index ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-blue-300'
                                  }`}
                                >
                                  <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-64 bg-gray-200 dark:bg-gray-600 rounded-lg border flex items-center justify-center">
                          <p className="text-gray-500 dark:text-gray-400">No images available</p>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Sale Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Final Sale Price:</span>
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(selectedVehicle.purchase_price || 0)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Sale Status:</span>
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                          selectedVehicle.sale_status === 'Sold' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : selectedVehicle.sale_status === 'On Approval'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {selectedVehicle.sale_status || 'Unknown'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Sale Date:</span>
                          <p className="text-gray-900 dark:text-white">
                            {selectedVehicle.sale_date ? new Date(selectedVehicle.sale_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Platform:</span>
                          <Badge variant={selectedVehicle.site === 1 ? 'default' : 'destructive'}>
                            {selectedVehicle.site === 1 ? 'Copart' : 'IAAI'}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">VIN:</span>
                          <p className="text-gray-900 dark:text-white font-mono text-xs">{selectedVehicle.vin || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Auction Location:</span>
                          <p className="text-gray-900 dark:text-white">
                            {selectedVehicle.auction_location || selectedVehicle.location || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {selectedVehicle.link && (
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Original Listing:</span>
                            <a 
                              href={selectedVehicle.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                            >
                              View on {selectedVehicle.site === 1 ? 'Copart' : 'IAAI'}
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Vehicle Specifications</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Mileage:</span>
                          <p className="text-gray-900 dark:text-white">
                            {selectedVehicle.vehicle_mileage ? selectedVehicle.vehicle_mileage.toLocaleString() + ' mi' : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Color:</span>
                          <p className="text-gray-900 dark:text-white">{selectedVehicle.color || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Transmission:</span>
                          <p className="text-gray-900 dark:text-white">{selectedVehicle.transmission || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Drive Type:</span>
                          <p className="text-gray-900 dark:text-white">{selectedVehicle.drive || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Fuel Type:</span>
                          <p className="text-gray-900 dark:text-white">{selectedVehicle.fuel || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Keys:</span>
                          <p className="text-gray-900 dark:text-white">{selectedVehicle.keys || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Damage Information</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Primary Damage:</span>
                        <p className="text-gray-900 dark:text-white">{selectedVehicle.vehicle_damage || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Title Status:</span>
                        <p className="text-gray-900 dark:text-white">{selectedVehicle.vehicle_title || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}