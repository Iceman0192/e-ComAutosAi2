import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useLocation } from 'wouter';
import PlatformToggle from '../components/ui/platform-toggle';
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
  Zap,
  ChevronLeft,
  ChevronRight,
  X
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
  const [, setLocation] = useLocation();
  const [lotId, setLotId] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
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
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch lot data');
      }
      
      return result;
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
      setCurrentImageIndex(0); // Reset image viewer when searching new lot
    }
  };

  // Image viewer navigation functions
  const openImageViewer = (index: number) => {
    setCurrentImageIndex(index);
    setShowImageViewer(true);
  };

  const nextImage = () => {
    if (lotData?.lot?.link_img_hd) {
      setCurrentImageIndex((prev) => 
        prev === lotData.lot.link_img_hd.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (lotData?.lot?.link_img_hd) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? lotData.lot.link_img_hd.length - 1 : prev - 1
      );
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - BLUE branding for Copart */}
      <header className="bg-blue-600 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Copart Live Lot Analysis</h1>
              <p className="text-blue-100 mt-1 text-sm">Search current auction lots and analyze comparable sales</p>
            </div>
            <div className="hidden sm:block">
              <PlatformToggle />
            </div>
          </div>
          {/* Mobile platform toggle */}
          <div className="sm:hidden mt-3">
            <PlatformToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Enhanced Search Section */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Search className="h-5 w-5" />
            Live Lot Lookup
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            Enter a Copart lot ID to view current auction details and photos
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="lotId" className="text-sm font-medium">Lot ID</Label>
              <div className="mt-1 relative">
                <Input
                  id="lotId"
                  placeholder="Enter lot ID (e.g., 57442255)"
                  value={lotId}
                  onChange={(e) => setLotId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pr-12 text-lg h-12"
                />
                <Car className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleSearch} 
                disabled={!lotId.trim() || lotLoading}
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                size="lg"
              >
                {lotLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search Lot
                  </>
                )}
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

      {/* Enhanced Live Lot Display */}
      {lotData?.lot && (
        <>
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100 text-xl lg:text-2xl">
                    <Car className="h-6 w-6" />
                    {lotData.lot.title}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Lot #{lotData.lot.lot_id}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      VIN: {lotData.lot.vin}
                    </Badge>
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {lotData.lot.year} {lotData.lot.make} {lotData.lot.model}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" asChild className="bg-white hover:bg-gray-50">
                    <a href={lotData.lot.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Copart
                    </a>
                  </Button>
                  {lotData.lot.current_bid > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Current Bid</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(lotData.lot.current_bid)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Interactive Vehicle Images */}
              {lotData.lot.link_img_hd?.length > 0 && (
                <div className="mb-6">
                  {/* Main Image with Navigation */}
                  <div className="relative mb-4 group">
                    <img
                      src={lotData.lot.link_img_hd[currentImageIndex]}
                      alt={`Vehicle image ${currentImageIndex + 1}`}
                      className="w-full h-64 md:h-96 object-cover rounded-lg border cursor-pointer"
                      onClick={() => openImageViewer(currentImageIndex)}
                      onError={(e) => {
                        // Fallback to standard quality if HD fails
                        const target = e.target as HTMLImageElement;
                        if (lotData.lot.link_img_small?.[currentImageIndex]) {
                          target.src = lotData.lot.link_img_small[currentImageIndex];
                        }
                      }}
                    />
                    
                    {/* Navigation Arrows - Always visible on mobile */}
                    {lotData.lot.link_img_hd.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                          onClick={nextImage}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    {/* Image Counter */}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                      {currentImageIndex + 1} / {lotData.lot.link_img_hd.length}
                    </div>
                  </div>
                  
                  {/* Thumbnail Strip - Mobile Optimized */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {lotData.lot.link_img_hd.map((img: string, index: number) => (
                      <img
                        key={index}
                        src={img}
                        alt={`Thumbnail ${index + 1}`}
                        className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 object-cover rounded border-2 cursor-pointer transition-all touch-manipulation ${
                          index === currentImageIndex 
                            ? 'border-blue-500 ring-2 ring-blue-200' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                        onError={(e) => {
                          // Fallback to standard quality if HD thumbnail fails
                          const target = e.target as HTMLImageElement;
                          if (lotData.lot.link_img_small?.[index]) {
                            target.src = lotData.lot.link_img_small[index];
                          }
                        }}
                      />
                    ))}
                  </div>
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

      {/* Full-Screen Image Modal - Mobile Optimized */}
      {showImageViewer && lotData?.lot?.link_img_hd && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-2 md:p-4">
            {/* Close Button - Larger for mobile */}
            <Button
              variant="secondary"
              size="lg"
              className="absolute top-2 right-2 md:top-4 md:right-4 z-10 touch-manipulation"
              onClick={() => setShowImageViewer(false)}
            >
              <X className="h-5 w-5 md:h-4 md:w-4" />
            </Button>
            
            {/* Navigation Arrows - Mobile Optimized */}
            {lotData.lot.link_img_hd.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="lg"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 touch-manipulation md:left-4"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-6 w-6 md:h-6 md:w-6" />
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 touch-manipulation md:right-4"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-6 w-6 md:h-6 md:w-6" />
                </Button>
              </>
            )}
            
            {/* Full-Size Image with Error Handling */}
            <img
              src={lotData.lot.link_img_hd[currentImageIndex]}
              alt={`Vehicle image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain touch-manipulation"
              onClick={() => setShowImageViewer(false)}
              onError={(e) => {
                // Fallback to standard quality if HD fails in modal
                const target = e.target as HTMLImageElement;
                if (lotData.lot.link_img_small?.[currentImageIndex]) {
                  target.src = lotData.lot.link_img_small[currentImageIndex];
                }
              }}
            />
            
            {/* Image Counter */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-2 rounded-lg text-sm md:bottom-4 md:px-4">
              {currentImageIndex + 1} / {lotData.lot.link_img_hd.length}
            </div>
            
            {/* Thumbnail Strip in Modal - Hidden on small mobile */}
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 gap-2 max-w-screen-lg overflow-x-auto hidden sm:flex md:bottom-16">
              {lotData.lot.link_img_hd.map((img: string, index: number) => (
                <img
                  key={index}
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 object-cover rounded border-2 cursor-pointer transition-all touch-manipulation ${
                    index === currentImageIndex 
                      ? 'border-blue-500 ring-2 ring-blue-300' 
                      : 'border-white/50 hover:border-white'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                  onError={(e) => {
                    // Fallback for modal thumbnails
                    const target = e.target as HTMLImageElement;
                    if (lotData.lot.link_img_small?.[index]) {
                      target.src = lotData.lot.link_img_small[index];
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Find Comparables Section - Gold Tier Manual Filtering */}
      {lotData?.lot && hasPermission('FULL_ANALYTICS') && (
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Filter className="h-5 w-5" />
              Find Comparable Vehicles
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Search for similar vehicles in your database to compare prices across platforms
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Comparable Search Ready</p>
                <p className="text-sm">
                  Vehicle: {lotData.lot.year} {lotData.lot.make} {lotData.lot.model}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Feature coming online - will search database for similar vehicles
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}