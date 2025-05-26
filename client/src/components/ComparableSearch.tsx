import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  MapPin
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ComparableSearchProps {
  initialData: {
    make: string;
    model?: string;
    year?: number;
    damageType?: string;
  };
}

interface ComparableResult {
  comparables: {
    copart: any[];
    iaai: any[];
  };
  statistics: {
    totalFound: number;
    copartCount: number;
    iaaiCount: number;
    copartAvgPrice: number;
    iaaiAvgPrice: number;
    priceDifference: number;
  };
  searchCriteria: any;
}

export default function ComparableSearch({ initialData }: ComparableSearchProps) {
  const { hasPermission } = useAuth();
  
  // Search parameters
  const [searchParams, setSearchParams] = useState({
    make: initialData.make || '',
    model: initialData.model || '',
    yearFrom: initialData.year ? initialData.year - 2 : undefined,
    yearTo: initialData.year ? initialData.year + 2 : undefined,
    damageType: initialData.damageType || 'all',
    maxMileage: undefined,
    sites: ['copart', 'iaai']
  });

  const [hasSearched, setHasSearched] = useState(false);

  // Fetch comparable vehicles
  const { data: comparableData, isLoading, error } = useQuery({
    queryKey: ['/api/find-comparables', searchParams],
    queryFn: () => apiRequest('POST', '/api/find-comparables', searchParams),
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
      {/* Search Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="make">Vehicle Make</Label>
          <Input
            id="make"
            value={searchParams.make}
            onChange={(e) => setSearchParams({ ...searchParams, make: e.target.value })}
            placeholder="e.g., Toyota"
          />
        </div>
        
        <div>
          <Label htmlFor="model">Model (Optional)</Label>
          <Input
            id="model"
            value={searchParams.model}
            onChange={(e) => setSearchParams({ ...searchParams, model: e.target.value })}
            placeholder="e.g., Camry"
          />
        </div>

        <div>
          <Label htmlFor="yearFrom">Year Range</Label>
          <div className="flex gap-2">
            <Input
              id="yearFrom"
              type="number"
              value={searchParams.yearFrom || ''}
              onChange={(e) => setSearchParams({ ...searchParams, yearFrom: parseInt(e.target.value) || undefined })}
              placeholder="From"
              min="1990"
              max="2025"
            />
            <Input
              type="number"
              value={searchParams.yearTo || ''}
              onChange={(e) => setSearchParams({ ...searchParams, yearTo: parseInt(e.target.value) || undefined })}
              placeholder="To"
              min="1990"
              max="2025"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
          <Search className="h-4 w-4 mr-2" />
          Find Comparable Vehicles
        </Button>
        
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-600">
            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            Searching database...
          </div>
        )}
      </div>

      {/* Results */}
      {comparableData?.data && (
        <div className="space-y-6">
          {/* Price Comparison Summary */}
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <DollarSign className="h-5 w-5" />
                Price Comparison Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Copart Average</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(comparableData.data.statistics.copartAvgPrice)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {comparableData.data.statistics.copartCount} vehicles
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">IAAI Average</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(comparableData.data.statistics.iaaiAvgPrice)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {comparableData.data.statistics.iaaiCount} vehicles
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Price Difference</p>
                  <div className="flex items-center justify-center gap-1">
                    {comparableData.data.statistics.priceDifference > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <p className={`text-2xl font-bold ${
                      comparableData.data.statistics.priceDifference > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(Math.abs(comparableData.data.statistics.priceDifference))}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {comparableData.data.statistics.priceDifference > 0 ? 'Copart higher' : 'IAAI higher'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Comparable Sales */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Comparable Sales</CardTitle>
              <CardDescription>
                Found {comparableData.data.statistics.totalFound} similar vehicles in database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...comparableData.data.comparables.copart.slice(0, 5), ...comparableData.data.comparables.iaai.slice(0, 5)]
                  .sort((a, b) => new Date(b.sale_date || b.auction_date).getTime() - new Date(a.sale_date || a.auction_date).getTime())
                  .slice(0, 10)
                  .map((vehicle, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={vehicle.base_site === 'Copart' ? 'default' : 'destructive'}>
                            {vehicle.base_site || (vehicle.site === 1 ? 'Copart' : 'IAAI')}
                          </Badge>
                          <span className="font-medium">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
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
                        <p className="text-lg font-bold">
                          {formatCurrency(vehicle.purchase_price || 0)}
                        </p>
                        {vehicle.odometer && (
                          <p className="text-sm text-gray-500">
                            {vehicle.odometer.toLocaleString()} mi
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <p className="text-red-700 dark:text-red-300">
              Error searching for comparable vehicles. Please try again.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}