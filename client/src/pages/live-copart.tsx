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
  Car, 
  Search, 
  Clock,
  MapPin,
  DollarSign,
  AlertCircle,
  Calendar,
  Gauge,
  Wrench,
  Key,
  FileText,
  ExternalLink,
  Filter,
  Zap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface LiveLot {
  id: string;
  lot_id: number;
  site: number;
  base_site: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  series?: string;
  odometer: number;
  current_bid: number;
  reserve_price: number;
  auction_date: string;
  damage_pr: string;
  damage_sec: string;
  color: string;
  location: string;
  title: string;
  document: string;
  keys: string;
  status: string;
  fuel: string;
  transmission: string;
  drive: string;
  engine: string;
  seller?: string;
  link: string;
  link_img_hd: string[];
  link_img_small: string[];
}

interface ComparableFilters {
  yearFrom: number;
  yearTo: number;
  make: string;
  model: string;
  mileageMin: number;
  mileageMax: number;
  damageType: string;
  titleStatus: string;
  dateFrom: string;
  dateTo: string;
}

export default function LiveCopart() {
  const { user, hasPermission } = useAuth();
  const [lotId, setLotId] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ComparableFilters>({
    yearFrom: 2020,
    yearTo: 2025,
    make: '',
    model: '',
    mileageMin: 0,
    mileageMax: 200000,
    damageType: '',
    titleStatus: '',
    dateFrom: '2023-01-01',
    dateTo: new Date().toISOString().split('T')[0]
  });

  // Fetch live lot data
  const { data: lotData, isLoading: lotLoading, error: lotError } = useQuery({
    queryKey: ['/api/live-copart', lotId],
    queryFn: async () => {
      const response = await fetch(`/api/live-copart/${lotId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch lot data');
      }
      return response.json();
    },
    enabled: searchTriggered && !!lotId,
  });

  // Fetch comparable sales (for Gold users with manual filters)
  const { data: comparableData, isLoading: comparableLoading } = useQuery({
    queryKey: ['/api/comparable-sales', filters],
    queryFn: () => apiRequest('POST', '/api/comparable-sales', filters),
    enabled: showFilters && hasPermission('FULL_ANALYTICS') && !!filters.make,
  });

  const handleSearch = () => {
    if (lotId.trim()) {
      setSearchTriggered(true);
    }
  };

  const handleFilterSearch = () => {
    if (lotData?.lot) {
      setFilters({
        ...filters,
        make: lotData.lot.make,
        model: lotData.lot.model,
        yearFrom: lotData.lot.year - 2,
        yearTo: lotData.lot.year + 2,
        mileageMin: Math.max(0, lotData.lot.odometer - 30000),
        mileageMax: lotData.lot.odometer + 30000,
      });
      setShowFilters(true);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!hasPermission('BASIC_SEARCH')) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              This feature requires a Gold membership or higher.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Copart Live Lots
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Search current auction lots and analyze comparable sales
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          <Car className="h-4 w-4 mr-1" />
          COPART
        </Badge>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Lot Lookup
          </CardTitle>
          <CardDescription>
            Enter a Copart lot ID to view current auction details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="lotId">Lot ID</Label>
              <Input
                id="lotId"
                placeholder="Enter lot ID (e.g., 57442255)"
                value={lotId}
                onChange={(e) => setLotId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={!lotId.trim() || lotLoading}>
                {lotLoading ? 'Searching...' : 'Search Lot'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {lotError && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="h-5 w-5" />
              <span>Error fetching lot data. Please check the lot ID and try again.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Lot Display */}
      {lotData?.lot && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  {lotData.lot.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Lot #{lotData.lot.lot_id}</Badge>
                  <Button variant="outline" size="sm" asChild>
                    <a href={lotData.lot.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View on Copart
                    </a>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Vehicle Images */}
              {lotData.lot.link_img_small?.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
                  {lotData.lot.link_img_small.slice(0, 6).map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Vehicle image ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                  ))}
                </div>
              )}

              {/* Key Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current Bid</p>
                    <p className="font-semibold">{formatCurrency(lotData.lot.current_bid)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reserve Price</p>
                    <p className="font-semibold">{formatCurrency(lotData.lot.reserve_price)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Auction Date</p>
                    <p className="font-semibold">{formatDate(lotData.lot.auction_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Gauge className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Odometer</p>
                    <p className="font-semibold">{lotData.lot.odometer?.toLocaleString()} miles</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Vehicle Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">VIN:</span>
                      <span className="font-mono">{lotData.lot.vin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Year:</span>
                      <span>{lotData.lot.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Make/Model:</span>
                      <span>{lotData.lot.make} {lotData.lot.model}</span>
                    </div>
                    {lotData.lot.series && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Series:</span>
                        <span>{lotData.lot.series}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Color:</span>
                      <span>{lotData.lot.color}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Engine:</span>
                      <span>{lotData.lot.engine}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Condition & Location</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Primary Damage:</span>
                      <span>{lotData.lot.damage_pr}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Secondary Damage:</span>
                      <span>{lotData.lot.damage_sec}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Title Status:</span>
                      <span>{lotData.lot.document}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Keys:</span>
                      <span>{lotData.lot.keys}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span>{lotData.lot.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Location:</span>
                      <span>{lotData.lot.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparable Analysis Section */}
          {hasPermission('FULL_ANALYTICS') && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {hasPermission('CROSS_PLATFORM_SEARCH') ? (
                        <Zap className="h-5 w-5 text-purple-600" />
                      ) : (
                        <Filter className="h-5 w-5 text-blue-600" />
                      )}
                      Comparable Analysis
                    </CardTitle>
                    <CardDescription>
                      {hasPermission('CROSS_PLATFORM_SEARCH') 
                        ? 'AI-powered analysis of similar vehicles' 
                        : 'Find similar vehicles using manual filters'
                      }
                    </CardDescription>
                  </div>
                  {!hasPermission('CROSS_PLATFORM_SEARCH') && (
                    <Button onClick={handleFilterSearch}>
                      <Filter className="h-4 w-4 mr-2" />
                      Find Comparables
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {hasPermission('CROSS_PLATFORM_SEARCH') ? (
                  <div className="text-center py-8">
                    <Zap className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      AI-powered comparable analysis will be implemented here
                    </p>
                    <Badge variant="default" className="bg-purple-600">
                      PLATINUM FEATURE
                    </Badge>
                  </div>
                ) : (
                  showFilters && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Year Range</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="From"
                              value={filters.yearFrom}
                              onChange={(e) => setFilters({...filters, yearFrom: parseInt(e.target.value)})}
                            />
                            <Input
                              type="number"
                              placeholder="To"
                              value={filters.yearTo}
                              onChange={(e) => setFilters({...filters, yearTo: parseInt(e.target.value)})}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Mileage Range</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Min"
                              value={filters.mileageMin}
                              onChange={(e) => setFilters({...filters, mileageMin: parseInt(e.target.value)})}
                            />
                            <Input
                              type="number"
                              placeholder="Max"
                              value={filters.mileageMax}
                              onChange={(e) => setFilters({...filters, mileageMax: parseInt(e.target.value)})}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Damage Type</Label>
                          <Select value={filters.damageType} onValueChange={(value) => setFilters({...filters, damageType: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Any damage type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Any damage type</SelectItem>
                              <SelectItem value="Normal Wear">Normal Wear</SelectItem>
                              <SelectItem value="Minor Dents/Scratches">Minor Dents/Scratches</SelectItem>
                              <SelectItem value="Front End">Front End</SelectItem>
                              <SelectItem value="Rear End">Rear End</SelectItem>
                              <SelectItem value="Side">Side</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {comparableLoading && (
                        <div className="text-center py-4">
                          <p>Searching for comparable sales...</p>
                        </div>
                      )}
                      {comparableData && (
                        <div className="text-center py-4">
                          <p className="text-gray-600 dark:text-gray-400">
                            Manual comparable search results will be displayed here
                          </p>
                        </div>
                      )}
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}