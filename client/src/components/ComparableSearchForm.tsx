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
  Loader2
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

          {/* Recent Sales List */}
          {comparableData?.comparables && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Comparable Sales</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Found {comparableData?.statistics?.totalFound || 0} similar vehicles in database
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {(() => {
                    // Gold users only see their current platform, Platinum sees both
                    const platformSales = hasPermission('CROSS_PLATFORM_SEARCH') 
                      ? [
                          ...(comparableData?.comparables?.copart || []).slice(0, 5),
                          ...(comparableData?.comparables?.iaai || []).slice(0, 5)
                        ]
                      : platform === 'copart' 
                        ? (comparableData?.comparables?.copart || []).slice(0, 8)
                        : (comparableData?.comparables?.iaai || []).slice(0, 8);
                    
                    return platformSales
                      .sort((a: any, b: any) => new Date(b.sale_date || b.auction_date || '').getTime() - new Date(a.sale_date || a.auction_date || '').getTime())
                      .slice(0, 8)
                      .map((vehicle: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={vehicle.base_site === 'Copart' || vehicle.site === 1 ? 'default' : 'destructive'}>
                              {vehicle.base_site || (vehicle.site === 1 ? 'Copart' : 'IAAI')}
                            </Badge>
                            <span className="font-medium text-sm">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            {vehicle.sale_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(vehicle.sale_date).toLocaleDateString()}
                              </div>
                            )}
                            {vehicle.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {vehicle.location}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {formatCurrency(vehicle.purchase_price || 0)}
                          </p>
                          {vehicle.odometer && (
                            <p className="text-xs text-gray-500">
                              {vehicle.odometer.toLocaleString()} mi
                            </p>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
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