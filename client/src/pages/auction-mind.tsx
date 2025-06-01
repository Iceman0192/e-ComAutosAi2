import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Eye, 
  Calendar,
  MapPin,
  DollarSign,
  Car,
  Camera,
  AlertCircle,
  CheckCircle,
  Clock,
  Gauge,
  Palette,
  Wrench,
  History,
  BarChart3,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface VehicleRecord {
  id: string;
  lot_id: number;
  site: number;
  base_site: string;
  vin: string;
  sale_status: string;
  sale_date: string;
  purchase_price: number;
  auction_location: string;
  vehicle_damage: string;
  vehicle_title: string;
  year: number;
  make: string;
  model: string;
  series: string;
  trim: string;
  transmission: string;
  drive: string;
  fuel: string;
  color: string;
  vehicle_mileage: number;
  images: string[];
  link: string;
}

interface VinHistoryData {
  vin: string;
  totalRecords: number;
  vehicles: VehicleRecord[];
  priceHistory: {
    averagePrice: number;
    highestPrice: number;
    lowestPrice: number;
    lastSalePrice: number;
  };
  platforms: string[];
  timespan: {
    firstSale: string;
    lastSale: string;
  };
}

export default function AuctionMind() {
  const { user } = useAuth();
  const [vinInput, setVinInput] = useState('');
  const [vinData, setVinData] = useState<VinHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecord | null>(null);

  // Hero Carousel Component
  const HeroCarousel = ({ images }: { images: string[] }) => {
    const [currentImage, setCurrentImage] = useState(0);
    
    if (!images || images.length === 0) {
      return (
        <div className="relative w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No images available</p>
          </div>
        </div>
      );
    }

    const nextImage = () => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
      setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
      <div className="w-full space-y-3">
        {/* Main image container */}
        <div className="relative w-full h-80 rounded-lg overflow-hidden bg-black shadow-lg">
          <img
            src={images[currentImage]}
            alt={`Vehicle image ${currentImage + 1}`}
            className="w-full h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 hover:scale-105"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 hover:scale-105"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              
              {/* Image indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentImage ? 'bg-white scale-110' : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
              
              {/* Image counter */}
              <div className="absolute top-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
                {currentImage + 1} / {images.length}
              </div>
            </>
          )}
        </div>
        
        {/* Thumbnail strip below main image */}
        {images.length > 1 && (
          <div className="flex justify-center">
            <div className="flex space-x-2 max-w-full overflow-x-auto px-2 py-1">
              {images.slice(0, 8).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  className={`flex-shrink-0 w-16 h-12 rounded border-2 overflow-hidden transition-all duration-200 ${
                    index === currentImage ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const searchVinHistory = async () => {
    if (!vinInput.trim()) {
      setError('Please enter a VIN number');
      return;
    }

    if (vinInput.length !== 17) {
      setError('VIN must be exactly 17 characters');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/auction-mind/vin-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vin: vinInput.toUpperCase() }),
      });

      if (!response.ok) {
        throw new Error('Failed to search VIN history');
      }

      const data = await response.json();
      
      if (data.success) {
        setVinData(data.data);
      } else {
        setError(data.message || 'No records found for this VIN');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while searching');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice > 0 ? `$${numPrice.toLocaleString()}` : 'Not sold';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSiteIcon = (site: number) => {
    return site === 1 ? 'Copart' : 'IAAI';
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('sold')) {
      return <Badge variant="default" className="bg-green-600">Sold</Badge>;
    } else if (statusLower.includes('not sold')) {
      return <Badge variant="destructive">Not Sold</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const VehicleDetailDialog = ({ vehicle }: { vehicle: VehicleRecord }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vehicle.year} {vehicle.make} {vehicle.model} - Lot {vehicle.lot_id}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hero Carousel */}
          <div className="col-span-full">
            <h3 className="text-lg font-semibold mb-3">Vehicle Photos</h3>
            <HeroCarousel images={vehicle.images || vehicle.link_img_hd || vehicle.link_img_small || []} />
          </div>

          {/* Vehicle Specifications */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Vehicle Specifications</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">VIN:</span>
                <span className="font-mono text-sm">{vehicle.vin}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Year:</span>
                <span>{vehicle.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Make:</span>
                <span>{vehicle.make}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Model:</span>
                <span>{vehicle.model}</span>
              </div>
              {vehicle.series && (
                <div className="flex justify-between">
                  <span className="font-medium">Series:</span>
                  <span>{vehicle.series}</span>
                </div>
              )}
              {vehicle.trim && (
                <div className="flex justify-between">
                  <span className="font-medium">Trim:</span>
                  <span>{vehicle.trim}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium">Mileage:</span>
                <span>{vehicle.vehicle_mileage?.toLocaleString() || 'Unknown'} miles</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Color:</span>
                <span>{vehicle.color}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Transmission:</span>
                <span>{vehicle.transmission}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Drive:</span>
                <span>{vehicle.drive}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Fuel:</span>
                <span>{vehicle.fuel}</span>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold mb-3">Auction Information</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Platform:</span>
                  <span>{getSiteIcon(vehicle.site)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Sale Date:</span>
                  <span>{formatDate(vehicle.sale_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Location:</span>
                  <span>{vehicle.auction_location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Damage:</span>
                  <span>{vehicle.vehicle_damage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Title:</span>
                  <span>{vehicle.vehicle_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Final Price:</span>
                  <span className="font-bold text-lg">{formatPrice(vehicle.purchase_price)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <History className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">VIN History Search</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Search comprehensive vehicle auction history by VIN. Access detailed records from Copart, IAAI, and other major auction platforms.
        </p>
      </div>

      {/* Search Section */}
      <Card className="max-w-2xl mx-auto mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            VIN Lookup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter 17-character VIN (e.g., 1HGBH41JXMN109186)"
              value={vinInput}
              onChange={(e) => setVinInput(e.target.value.toUpperCase())}
              className="font-mono"
              maxLength={17}
              disabled={isLoading}
            />
            <Button 
              onClick={searchVinHistory} 
              disabled={isLoading}
              className="whitespace-nowrap"
            >
              {isLoading ? 'Searching...' : 'Search VIN'}
            </Button>
          </div>
          {error && (
            <div className="flex items-center gap-2 mt-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {vinData && (
        <div className="space-y-8">
          {/* Vehicle Hero Section - Main Display */}
          {vinData.vehicles && vinData.vehicles.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              {/* Hero Carousel */}
              <div className="p-6">
                <HeroCarousel images={vinData.vehicles[0].images || vinData.vehicles[0].link_img_hd || vinData.vehicles[0].link_img_small || []} />
              </div>
              
              {/* Vehicle Information */}
              <div className="p-6 border-t bg-gray-50 dark:bg-gray-700">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {vinData.vehicles[0].year} {vinData.vehicles[0].make} {vinData.vehicles[0].model}
                  </h2>
                  {vinData.vehicles[0].series && (
                    <p className="text-xl text-gray-600 dark:text-gray-300">{vinData.vehicles[0].series}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                      <Car className="h-5 w-5 mr-2" />
                      Vehicle Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-300">VIN:</span>
                        <span className="font-mono text-sm">{vinData.vehicles[0].vin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-300">Lot ID:</span>
                        <span>{vinData.vehicles[0].lot_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-300">Platform:</span>
                        <Badge variant={vinData.vehicles[0].base_site === 'copart' ? 'default' : 'secondary'}>
                          {vinData.vehicles[0].base_site?.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-300">Location:</span>
                        <span>{vinData.vehicles[0].location || vinData.vehicles[0].auction_location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-300">Mileage:</span>
                        <span>{vinData.vehicles[0].odometer?.toLocaleString() || 'Unknown'} mi</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Vehicle Specifications */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                      <Wrench className="h-5 w-5 mr-2" />
                      Specifications
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-300">Color:</span>
                        <span>{vinData.vehicles[0].color}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-300">Transmission:</span>
                        <span>{vinData.vehicles[0].transmission}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-300">Drive:</span>
                        <span>{vinData.vehicles[0].drive}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-300">Fuel:</span>
                        <span>{vinData.vehicles[0].fuel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-300">Engine:</span>
                        <span>{vinData.vehicles[0].engine || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Auction Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                      <History className="h-5 w-5 mr-2" />
                      Auction Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-300">Primary Damage:</span>
                        <span className="text-red-600 font-medium">{vinData.vehicles[0].damage_pr || vinData.vehicles[0].vehicle_damage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-300">Title:</span>
                        <span>{vinData.vehicles[0].document || vinData.vehicles[0].vehicle_title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-300">Sale Date:</span>
                        <span>{new Date(vinData.vehicles[0].sale_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-600 dark:text-gray-300">Sale Price:</span>
                        <span className="text-2xl font-bold text-green-600">
                          ${vinData.vehicles[0].purchase_price?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-300">Status:</span>
                        <Badge variant={vinData.vehicles[0].sale_status === 'Sold' ? 'default' : 'destructive'}>
                          {vinData.vehicles[0].sale_status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Records</p>
                    <p className="text-2xl font-bold">{vinData.totalRecords}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Average Price</p>
                    <p className="text-2xl font-bold">{formatPrice(vinData.priceHistory.averagePrice)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Last Sale</p>
                    <p className="text-2xl font-bold">{formatPrice(vinData.priceHistory.lastSalePrice)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Platforms</p>
                    <p className="text-lg font-bold">{vinData.platforms.join(', ')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>


        </div>
      )}

      {/* Empty State */}
      {!vinData && !isLoading && (
        <div className="text-center py-12">
          <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Enter a VIN to begin</h3>
          <p className="text-muted-foreground">
            Search our comprehensive database for complete vehicle auction history
          </p>
        </div>
      )}
    </div>
  );
}