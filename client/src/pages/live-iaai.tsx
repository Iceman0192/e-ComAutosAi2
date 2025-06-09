import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocation } from 'wouter';
import PlatformToggle from '../components/ui/platform-toggle';
import { 
  Car, 
  Search, 
  MapPin,
  DollarSign,
  AlertCircle,
  Wrench,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function LiveIAAI() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [lotId, setLotId] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);

  // Fetch live lot data
  const { data: lotData, isLoading: lotLoading, error: lotError } = useQuery({
    queryKey: ['/api/live-iaai', lotId],
    queryFn: async () => {
      const response = await fetch(`/api/live-iaai/${lotId}`);
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch lot data');
      }
      
      return result;
    },
    enabled: searchTriggered && !!lotId,
  });

  const handleSearch = () => {
    if (lotId.trim()) {
      setSearchTriggered(true);
      setCurrentImageIndex(0);
    }
  };

  // Image viewer navigation
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - RED branding for IAAI */}
      <header className="bg-red-600 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">IAAI Live Lot Analysis</h1>
              <p className="text-red-100 mt-1 text-sm">Search current auction lots and view detailed information</p>
            </div>
            <div className="hidden sm:block">
              <PlatformToggle />
            </div>
          </div>
          <div className="sm:hidden mt-3">
            <PlatformToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Search Card */}
        <Card className="shadow-lg border-red-200">
          <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/50 dark:to-pink-950/50">
            <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
              <Search className="h-5 w-5" />
              Live Lot Lookup
            </CardTitle>
            <CardDescription className="text-red-700 dark:text-red-300">
              Enter an IAAI lot ID to view current auction details and photos
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="lotId" className="text-sm font-medium">Lot ID</Label>
                <div className="mt-1 relative">
                  <Input
                    id="lotId"
                    placeholder="Enter lot ID (e.g., 35442255)"
                    value={lotId}
                    onChange={(e) => setLotId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSearch}
                  disabled={lotLoading || !lotId.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white px-8"
                >
                  {lotLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    'Search Lot'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {lotError && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertCircle className="h-5 w-5" />
                <span>Error: {lotError.message}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Lot Display */}
        {lotData?.lot && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  {lotData.lot.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Lot #{lotData.lot.lot_id}</Badge>
                  {lotData.lot.salvage_id && (
                    <Badge variant="secondary">Stock #{lotData.lot.salvage_id}</Badge>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <a href={lotData.lot.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View on IAAI
                    </a>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Vehicle Images */}
              {lotData.lot.link_img_hd?.length > 0 && (
                <div className="mb-6">
                  {/* Main Image */}
                  <div className="relative mb-4 group">
                    <img
                      src={lotData.lot.link_img_hd[currentImageIndex]}
                      alt={`Vehicle image ${currentImageIndex + 1}`}
                      className="w-full h-96 object-cover rounded-lg cursor-pointer"
                      onClick={() => setShowImageViewer(true)}
                    />
                    
                    {/* Navigation Arrows */}
                    {lotData.lot.link_img_hd.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-70 hover:opacity-100"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-70 hover:opacity-100"
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
                    
                    {/* Fullscreen Button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2 opacity-70 hover:opacity-100"
                      onClick={() => setShowImageViewer(true)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Image Thumbnails */}
                  {lotData.lot.link_img_hd.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {lotData.lot.link_img_hd.map((img: string, index: number) => (
                        <img
                          key={index}
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          className={`w-16 h-16 object-cover rounded cursor-pointer flex-shrink-0 ${
                            index === currentImageIndex ? 'ring-2 ring-red-500' : ''
                          }`}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Vehicle Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Auction Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Auction Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Current Bid:</span>
                      <span className="font-semibold text-green-600">{formatCurrency(lotData.lot.current_bid)}</span>
                    </div>
                    {lotData.lot.reserve_price > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Reserve:</span>
                        <span className="font-semibold text-red-600">{formatCurrency(lotData.lot.reserve_price)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Auction Date:</span>
                      <span>{formatDateTime(lotData.lot.auction_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">VIN:</span>
                      <span className="font-mono text-xs">{lotData.lot.vin}</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Specifications */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Vehicle Specs
                  </h4>
                  <div className="space-y-2 text-sm">
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
                      <span className="text-gray-600 dark:text-gray-400">Mileage:</span>
                      <span>{lotData.lot.odometer.toLocaleString()} mi</span>
                    </div>
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

                {/* Condition & Location */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Condition & Location
                  </h4>
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
        )}

        {/* Image Viewer Modal */}
        {showImageViewer && lotData?.lot?.link_img_hd && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-6xl max-h-full">
              <img
                src={lotData.lot.link_img_hd[currentImageIndex]}
                alt={`Vehicle image ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
              
              {/* Close Button */}
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4"
                onClick={() => setShowImageViewer(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              {/* Navigation */}
              {lotData.lot.link_img_hd.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded">
                {currentImageIndex + 1} / {lotData.lot.link_img_hd.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}