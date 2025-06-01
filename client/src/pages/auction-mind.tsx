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
        
        {/* Thumbnail strip for easy navigation */}
        {images.length > 1 && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2 max-w-xs overflow-x-auto">
            {images.slice(0, 6).map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                className={`flex-shrink-0 w-12 h-8 rounded border-2 overflow-hidden transition-all duration-200 ${
                  index === currentImage ? 'border-white' : 'border-white/30 hover:border-white/60'
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
        <div className="space-y-6">
          {/* Summary Cards */}
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

          {/* Vehicle Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Auction History ({vinData.totalRecords} records)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vinData.vehicles.map((vehicle, index) => (
                  <div key={vehicle.id} className="border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </h3>
                        <p className="text-muted-foreground">
                          Lot {vehicle.lot_id} • {getSiteIcon(vehicle.site)}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(vehicle.sale_status)}
                        <p className="text-lg font-bold mt-1">{formatPrice(vehicle.purchase_price)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(vehicle.sale_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{vehicle.auction_location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                        <span>{vehicle.vehicle_mileage?.toLocaleString() || 'Unknown'} mi</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        <span>{vehicle.vehicle_damage}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex gap-2">
                        <Badge variant="outline">{vehicle.color}</Badge>
                        <Badge variant="outline">{vehicle.transmission}</Badge>
                        <Badge variant="outline">{vehicle.fuel}</Badge>
                      </div>
                      <VehicleDetailDialog vehicle={vehicle} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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