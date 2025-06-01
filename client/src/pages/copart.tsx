import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Wrench,
  Filter,
  TrendingUp,
  BarChart3,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';

interface CopartLot {
  lot_id: number;
  site: number;
  base_site: string;
  vin: string;
  sale_status: string;
  sale_date: string;
  purchase_price: number;
  current_bid: number;
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
  odometer: number;
  images: string[];
  link: string;
  link_img_hd: string[];
  link_img_small: string[];
}

interface SearchFilters {
  make: string;
  model: string;
  yearFrom: string;
  yearTo: string;
  location: string;
  damage: string;
  status: string;
}

export default function CopartPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    make: '',
    model: '',
    yearFrom: '',
    yearTo: '',
    location: '',
    damage: '',
    status: ''
  });
  const [lots, setLots] = useState<CopartLot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedLot, setSelectedLot] = useState<CopartLot | null>(null);

  const searchCopartLots = async (resetPage = false) => {
    setIsLoading(true);
    setError(null);
    const currentPage = resetPage ? 1 : page;
    
    try {
      const params = new URLSearchParams({
        site: '1', // Copart
        page: currentPage.toString(),
        size: '25'
      });

      if (searchQuery.trim()) {
        if (searchQuery.length === 17) {
          params.append('vin', searchQuery);
        } else {
          params.append('query', searchQuery);
        }
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (key === 'yearFrom') params.append('year_from', value);
          else if (key === 'yearTo') params.append('year_to', value);
          else params.append(key, value);
        }
      });

      const response = await fetch(`/api/cars?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to search Copart lots');
      }

      const data = await response.json();
      
      if (data.success) {
        setLots(data.data.vehicles || []);
        setTotalCount(data.data.total || 0);
        if (resetPage) setPage(1);
      } else {
        setError(data.message || 'No lots found');
        setLots([]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while searching');
      setLots([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    searchCopartLots(true);
  }, []);

  const formatPrice = (price: number) => {
    return price > 0 ? `$${price.toLocaleString()}` : 'No bid';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string, saleDate: string) => {
    const statusLower = status.toLowerCase();
    const isUpcoming = new Date(saleDate) > new Date();
    
    if (statusLower.includes('sold')) {
      return <Badge variant="default" className="bg-green-600">Sold</Badge>;
    } else if (statusLower.includes('not sold')) {
      return <Badge variant="destructive">Not Sold</Badge>;
    } else if (isUpcoming) {
      return <Badge variant="secondary" className="bg-blue-600 text-white">Live Auction</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const LotDetailDialog = ({ lot }: { lot: CopartLot }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{lot.year} {lot.make} {lot.model} - Lot {lot.lot_id}</span>
            {lot.link && (
              <Button variant="outline" size="sm" onClick={() => window.open(lot.link, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-1" />
                View on Copart
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle Images */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Vehicle Photos</h3>
            {lot.link_img_hd && lot.link_img_hd.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {lot.link_img_hd.slice(0, 4).map((imageUrl: string, index: number) => (
                  <div key={index} className="aspect-square bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={`Vehicle photo ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => window.open(imageUrl, '_blank')}
                    />
                  </div>
                ))}
                {lot.link_img_hd.length > 4 && (
                  <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        +{lot.link_img_hd.length - 4} more
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-8 text-center">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No photos available</p>
              </div>
            )}
          </div>

          {/* Vehicle Specifications */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Vehicle Specifications</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">VIN:</span>
                <span className="font-mono text-sm">{lot.vin}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Year:</span>
                <span>{lot.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Make:</span>
                <span>{lot.make}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Model:</span>
                <span>{lot.model}</span>
              </div>
              {lot.series && (
                <div className="flex justify-between">
                  <span className="font-medium">Series:</span>
                  <span>{lot.series}</span>
                </div>
              )}
              {lot.trim && (
                <div className="flex justify-between">
                  <span className="font-medium">Trim:</span>
                  <span>{lot.trim}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium">Mileage:</span>
                <span>{lot.odometer?.toLocaleString() || 'Unknown'} miles</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Color:</span>
                <span>{lot.color}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Transmission:</span>
                <span>{lot.transmission}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Drive:</span>
                <span>{lot.drive}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Fuel:</span>
                <span>{lot.fuel}</span>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold mb-3">Auction Information</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Sale Date:</span>
                  <span>{formatDate(lot.sale_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Location:</span>
                  <span>{lot.auction_location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Damage:</span>
                  <span>{lot.vehicle_damage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Title:</span>
                  <span>{lot.vehicle_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Current Bid:</span>
                  <span className="font-bold text-lg">{formatPrice(lot.current_bid || 0)}</span>
                </div>
                {lot.purchase_price > 0 && (
                  <div className="flex justify-between">
                    <span className="font-medium">Final Price:</span>
                    <span className="font-bold text-lg text-green-600">{formatPrice(lot.purchase_price)}</span>
                  </div>
                )}
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
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <h1 className="text-3xl font-bold">Copart Auctions</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Search and explore vehicles from Copart auction platform. Find salvage, clean title, and specialty vehicles.
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Copart Lots
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by VIN, make, model, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => searchCopartLots(true)} disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Make</label>
              <Input
                placeholder="Toyota, Ford..."
                value={filters.make}
                onChange={(e) => setFilters({...filters, make: e.target.value})}
                className="h-12 text-base touch-manipulation"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Model</label>
              <Input
                placeholder="Camry, F-150..."
                value={filters.model}
                onChange={(e) => setFilters({...filters, model: e.target.value})}
                className="h-12 text-base touch-manipulation"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Year From</label>
              <Input
                type="number"
                placeholder="2020"
                value={filters.yearFrom}
                onChange={(e) => setFilters({...filters, yearFrom: e.target.value})}
                className="h-12 text-base touch-manipulation"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Year To</label>
              <Input
                type="number"
                placeholder="2024"
                value={filters.yearTo}
                onChange={(e) => setFilters({...filters, yearTo: e.target.value})}
                className="h-12 text-base touch-manipulation"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {lots.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Found {totalCount.toLocaleString()} Copart lots
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => {
                  setPage(page - 1);
                  searchCopartLots();
                }}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPage(page + 1);
                  searchCopartLots();
                }}
              >
                Next
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {lots.map((lot) => (
              <Card key={lot.lot_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {lot.year} {lot.make} {lot.model}
                      </h3>
                      <p className="text-muted-foreground">
                        Lot {lot.lot_id} • {lot.series && `${lot.series} • `}VIN: {lot.vin}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(lot.sale_status, lot.sale_date)}
                      <p className="text-lg font-bold mt-1">
                        {lot.purchase_price > 0 ? formatPrice(lot.purchase_price) : formatPrice(lot.current_bid || 0)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(lot.sale_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{lot.auction_location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      <span>{lot.odometer?.toLocaleString() || 'Unknown'} mi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <span>{lot.vehicle_damage}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Badge variant="outline">{lot.color}</Badge>
                      <Badge variant="outline">{lot.transmission}</Badge>
                      <Badge variant="outline">{lot.fuel}</Badge>
                    </div>
                    <LotDetailDialog lot={lot} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && lots.length === 0 && (
        <div className="text-center py-12">
          <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No lots found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or filters
          </p>
        </div>
      )}
    </div>
  );
}