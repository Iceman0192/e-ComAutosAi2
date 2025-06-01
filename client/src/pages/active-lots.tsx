import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
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
  ExternalLink,
  RefreshCw,
  Target,
  ChevronDown,
  ChevronRight,
  Zap,
  Users,
  FileText,
  Fuel,
  Settings
} from 'lucide-react';

interface AuctionLot {
  id: string;
  lot_id: number;
  site: number;
  base_site: string;
  vin: string;
  odometer: number;
  current_bid: number;
  auction_date: string;
  year: number;
  make: string;
  model: string;
  series: string;
  damage_pr: string;
  damage_sec: string;
  fuel: string;
  drive: string;
  transmission: string;
  color: string;
  status: string;
  title: string;
  engine: string;
  location: string;
  country: string;
  document: string;
  currency: string;
  link_img_hd: string[];
  link_img_small?: string[];
  salvage_id?: number;
  price_new?: number;
  price_future?: number;
  reserve_price?: number;
  cost_priced?: number;
  cost_repair?: number;
  cylinders?: number;
  state?: string;
  vehicle_type?: string;
  auction_type?: string;
  keys?: string;
  odobrand?: string;
  engine_size?: number;
  location_old?: string;
  location_id?: number;
  document_old?: string;
  seller?: string;
  is_buynow?: boolean;
  iaai_360?: any;
  copart_exterior_360?: any[];
  copart_interior_360?: any;
  video?: string;
  purchase_price?: number;
  sale_status?: string;
  sale_date?: string;
  auction_location?: string;
  vehicle_damage?: string;
  vehicle_title?: string;
  trim?: string;
  images?: string[];
  link?: string;
}

interface SearchFilters {
  site: string;
  lot_id: string;
  salvage_id: string;
  title: string;
  status: string;
  odometer: string;
  odobrand: string;
  drive: string;
  price_new: string;
  price_future: string;
  current_bid: string;
  auction_date: string;
  year: string;
  make: string;
  model: string;
  series: string;
  damage_pr: string;
  damage_sec: string;
  keys: string;
  fuel: string;
  transmission: string;
  color: string;
  document: string;
  vehicle_type: string;
  auction_type: string;
  is_buynow: string;
  location: string;
  seller_type: string;
  body_type: string;
  cylinders: string;
  engine_size: string;
}

export default function ActiveLotsPage() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [smartSearch, setSmartSearch] = useState('');
  const [lots, setLots] = useState<AuctionLot[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<'copart' | 'iaai'>('copart');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedLot, setSelectedLot] = useState<AuctionLot | null>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    site: '',
    lot_id: '',
    salvage_id: '',
    title: '',
    status: '',
    odometer: '',
    odobrand: '',
    drive: '',
    price_new: '',
    price_future: '',
    current_bid: '',
    auction_date: '',
    year: '',
    make: '',
    model: '',
    series: '',
    damage_pr: '',
    damage_sec: '',
    keys: '',
    fuel: '',
    transmission: '',
    color: '',
    document: '',
    vehicle_type: '',
    auction_type: '',
    is_buynow: '',
    location: '',
    seller_type: '',
    body_type: '',
    cylinders: '',
    engine_size: ''
  });

  // Enhanced search functionality
  const handleSmartSearch = async () => {
    if (!smartSearch.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/cars/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: smartSearch,
          platform: selectedPlatform 
        })
      });

      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setLots(data.vehicles || []);
      setTotalCount(data.count || 0);
      setPage(1);
    } catch (err) {
      setError('Search failed. Please try again.');
      toast({
        title: "Search Error",
        description: "Failed to search vehicles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  // Enhanced active lots search with all filtering options
  const searchActiveLots = async (resetPage = false) => {
    setIsLoading(true);
    setError('');
    
    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    try {
      const queryParams = new URLSearchParams({
        site: selectedPlatform === 'copart' ? '1' : '2',
        page: currentPage.toString(),
        size: '25'
      });

      // Add search query if provided
      if (searchQuery.trim()) {
        queryParams.append('search', searchQuery.trim());
      }

      // Add all filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.toString().trim()) {
          queryParams.append(key, value.toString().trim());
        }
      });

      console.log('Active Lots Search:', selectedPlatform === 'copart' ? 'Site 1' : 'Site 2', 'Page', currentPage, 'Query:', Object.fromEntries(queryParams));

      const response = await fetch(`/api/cars?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch lots');
      
      const data = await response.json();
      console.log('Active Lots API Response:', data);
      
      if (data.success) {
        setLots(data.data || data.vehicles || []);
        setTotalCount(data.count || 0);
        console.log('Updated totalCount to:', data.count || 0);
      } else {
        throw new Error(data.message || 'Search failed');
      }
    } catch (err) {
      setError('Failed to load lots. Please try again.');
      toast({
        title: "Load Error",
        description: "Failed to load auction lots. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Vehicle analysis functions
  const analyzeLot = (lot: AuctionLot) => {
    if (!hasPermission('AI_ANALYSIS')) {
      toast({
        title: "Premium Feature",
        description: "AI analysis is available for Gold+ members",
        variant: "destructive",
      });
      return;
    }
    // Analysis logic here
  };

  const findSimilarVehicles = (lot: AuctionLot) => {
    if (!hasPermission('CROSS_PLATFORM_SEARCH')) {
      toast({
        title: "Premium Feature",
        description: "Similar vehicle search is available for Platinum+ members",
        variant: "destructive",
      });
      return;
    }

    // Set filters to find similar vehicles
    const similarFilters = {
      site: '',
      lot_id: '',
      salvage_id: '',
      title: '',
      status: 'Run & Drive',
      odometer: '',
      odobrand: '',
      drive: '',
      price_new: '',
      price_future: '',
      current_bid: '',
      auction_date: '',
      year: `${lot.year - 1}-${lot.year + 1}`, // Near-exact match: ±1 year for better results
      make: lot.make,
      model: lot.model,
      series: '',
      damage_pr: '',
      damage_sec: '',
      keys: '',
      fuel: '',
      transmission: '',
      color: '',
      document: '',
      vehicle_type: '',
      auction_type: '',
      is_buynow: '',
      location: '',
      seller_type: '',
      body_type: '',
      cylinders: '',
      engine_size: ''
    };

    setFilters(similarFilters);
    
    // Search with similar vehicle criteria
    const queryParams = new URLSearchParams({
      site: selectedPlatform === 'copart' ? '2' : '1', // Search opposite platform
      page: '1',
      size: '25'
    });
    
    Object.entries(similarFilters).forEach(([key, value]) => {
      if (value && value.toString().trim()) {
        queryParams.append(key, value.toString().trim());
      }
    });
    
    setIsLoading(true);
    fetch(`/api/cars?${queryParams}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLots(data.data || []);
          setTotalCount(data.count || 0);
          setPage(1);
          
          toast({
            title: "Similar Vehicles Found",
            description: `Found ${data.count || 0} similar ${lot.year} ${lot.make} ${lot.model} vehicles on ${selectedPlatform === 'copart' ? 'IAAI' : 'Copart'}`,
          });
          
          // Switch to the opposite platform to show cross-platform results
          setSelectedPlatform(selectedPlatform === 'copart' ? 'iaai' : 'copart');
        }
      })
      .catch(() => {
        toast({
          title: "Search Error",
          description: "Failed to find similar vehicles. Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => setIsLoading(false));
  };

  // Load initial data
  useEffect(() => {
    searchActiveLots(true);
  }, [selectedPlatform]);

  // Vehicle lot detail dialog component
  const LotDetailDialog = ({ lot }: { lot: AuctionLot }) => (
    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>{lot.year} {lot.make} {lot.model} - Lot #{lot.lot_id}</span>
          <Badge variant="secondary">{lot.base_site.toUpperCase()}</Badge>
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Vehicle Images */}
        {lot.link_img_hd && lot.link_img_hd.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Vehicle Images ({lot.link_img_hd.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {lot.link_img_hd.slice(0, 12).map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`${lot.make} ${lot.model} - Image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => window.open(img, '_blank')}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vehicle Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VIN:</span>
                  <span className="font-mono text-xs">{lot.vin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Year:</span>
                  <span className="font-medium">{lot.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Make:</span>
                  <span className="font-medium">{lot.make}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-medium">{lot.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Series:</span>
                  <span className="font-medium">{lot.series}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Color:</span>
                  <span className="font-medium">{lot.color}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Engine:</span>
                  <span className="font-medium">{lot.engine}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transmission:</span>
                  <span className="font-medium">{lot.transmission}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Drive:</span>
                  <span className="font-medium">{lot.drive}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fuel:</span>
                  <span className="font-medium">{lot.fuel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Odometer:</span>
                  <span className="font-medium">{lot.odometer?.toLocaleString() || 'N/A'} mi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Keys:</span>
                  <span className="font-medium">{lot.keys || 'Unknown'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auction Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Auction Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Bid:</span>
                  <span className="font-semibold text-green-600">
                    ${lot.current_bid?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Auction Date:</span>
                  <span className="font-medium">{new Date(lot.auction_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{lot.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={lot.status === 'Run & Drive' ? 'default' : 'secondary'}>
                    {lot.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Document:</span>
                  <span className="font-medium">{lot.document}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Primary Damage:</span>
                  <span className="font-medium text-red-600">{lot.damage_pr}</span>
                </div>
                {lot.damage_sec && lot.damage_sec !== 'Unknown' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Secondary Damage:</span>
                    <span className="font-medium text-orange-600">{lot.damage_sec}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          {hasPermission('AI_ANALYSIS') && (
            <Button onClick={() => analyzeLot(lot)} className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              AI Analysis
            </Button>
          )}
          {hasPermission('CROSS_PLATFORM_SEARCH') && (
            <Button onClick={() => findSimilarVehicles(lot)} variant="outline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Find Similar
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => window.open(`https://${lot.base_site}.com/lot/${lot.lot_id}`, '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View on {lot.base_site.charAt(0).toUpperCase() + lot.base_site.slice(1)}
          </Button>
        </div>
      </div>
    </DialogContent>
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Active Lots
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Platform Selection */}
          <div className="flex gap-2">
            <Button
              variant={selectedPlatform === 'copart' ? 'default' : 'outline'}
              onClick={() => setSelectedPlatform('copart')}
              className="flex-1"
            >
              Copart
            </Button>
            <Button
              variant={selectedPlatform === 'iaai' ? 'default' : 'outline'}
              onClick={() => setSelectedPlatform('iaai')}
              className="flex-1"
            >
              IAAI
            </Button>
          </div>

          {/* Main Search Fields */}
          <div className="space-y-3">
            {/* Keyword Search */}
            <div className="flex gap-2">
              <Input
                placeholder="Search by make, model, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => searchActiveLots(true)} disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Smart Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Smart search... (e.g., '2020 Honda Civic', '2018-2022 Toyota', 'BMW under 25k')"
                value={smartSearch}
                onChange={(e) => setSmartSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSmartSearch()}
                className="pl-10 pr-4 py-3 text-base"
              />
              <Button 
                onClick={handleSmartSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                size="sm"
              >
                Search
              </Button>
            </div>
          </div>

          {/* Quick Filters for Quality Vehicle Discovery */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick filters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filters.year === '2018' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    year: filters.year === '2018' ? '' : '2018'
                  };
                  setFilters(newFilters);
                  setTimeout(() => searchActiveLots(true), 100);
                }}
                className="h-7 text-xs"
              >
                <Clock className="h-3 w-3 mr-1" />
                2018+ Models
              </Button>

              <Button
                variant={filters.odometer === '50000' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    odometer: filters.odometer === '50000' ? '' : '50000'
                  };
                  setFilters(newFilters);
                  setTimeout(() => searchActiveLots(true), 100);
                }}
                className="h-7 text-xs"
              >
                <Gauge className="h-3 w-3 mr-1" />
                Low Miles (&lt;50k)
              </Button>

              <Button
                variant={filters.damage_pr === 'Minor Dent/Scratches' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    damage_pr: filters.damage_pr === 'Minor Dent/Scratches' ? '' : 'Minor Dent/Scratches'
                  };
                  setFilters(newFilters);
                  setTimeout(() => searchActiveLots(true), 100);
                }}
                className="h-7 text-xs"
              >
                <Wrench className="h-3 w-3 mr-1" />
                Minor Damage
              </Button>

              <Button
                variant={filters.current_bid === '10000' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    current_bid: filters.current_bid === '10000' ? '' : '10000'
                  };
                  setFilters(newFilters);
                  setTimeout(() => searchActiveLots(true), 100);
                }}
                className="h-7 text-xs"
              >
                <DollarSign className="h-3 w-3 mr-1" />
                Under $10k
              </Button>

              <Button
                variant={filters.fuel === 'Hybrid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    fuel: filters.fuel === 'Hybrid' ? '' : 'Hybrid'
                  };
                  setFilters(newFilters);
                  setTimeout(() => searchActiveLots(true), 100);
                }}
                className="h-7 text-xs"
              >
                <Fuel className="h-3 w-3 mr-1" />
                Hybrid/Electric
              </Button>

              <Button
                variant={filters.current_bid === '25000' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    current_bid: filters.current_bid === '25000' ? '' : '25000'
                  };
                  setFilters(newFilters);
                  setTimeout(() => searchActiveLots(true), 100);
                }}
                className="h-7 text-xs"
              >
                <DollarSign className="h-3 w-3 mr-1" />
                Under $25k
              </Button>

              <Button
                variant={filters.year === '2020' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    year: filters.year === '2020' ? '' : '2020'
                  };
                  setFilters(newFilters);
                  setTimeout(() => searchActiveLots(true), 100);
                }}
                className="h-7 text-xs"
              >
                <Clock className="h-3 w-3 mr-1" />
                2020+ Only
              </Button>

              <Button
                variant={filters.odometer === '25000' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    odometer: filters.odometer === '25000' ? '' : '25000'
                  };
                  setFilters(newFilters);
                  setTimeout(() => searchActiveLots(true), 100);
                }}
                className="h-7 text-xs"
              >
                <Gauge className="h-3 w-3 mr-1" />
                Very Low Miles (&lt;25k)
              </Button>

              <Button
                variant={filters.damage_pr === 'Hail' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    damage_pr: filters.damage_pr === 'Hail' ? '' : 'Hail'
                  };
                  setFilters(newFilters);
                  setTimeout(() => searchActiveLots(true), 100);
                }}
                className="h-7 text-xs"
              >
                <Wrench className="h-3 w-3 mr-1" />
                Hail Damage
              </Button>

              <Button
                variant={filters.transmission === 'Automatic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    transmission: filters.transmission === 'Automatic' ? '' : 'Automatic'
                  };
                  setFilters(newFilters);
                  setTimeout(() => searchActiveLots(true), 100);
                }}
                className="h-7 text-xs"
              >
                <Settings className="h-3 w-3 mr-1" />
                Automatic Only
              </Button>

              <Button
                variant={filters.status === 'Run & Drive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    status: filters.status === 'Run & Drive' ? '' : 'Run & Drive'
                  };
                  setFilters(newFilters);
                  
                  // Immediately search with the new filters
                  const queryParams = new URLSearchParams({
                    site: selectedPlatform === 'copart' ? '1' : '2',
                    page: '1',
                    size: '25'
                  });
                  
                  Object.entries(newFilters).forEach(([key, value]) => {
                    if (value && value.toString().trim()) {
                      queryParams.append(key, value.toString().trim());
                    }
                  });
                  
                  setIsLoading(true);
                  fetch(`/api/cars?${queryParams}`)
                    .then(res => res.json())
                    .then(data => {
                      if (data.success) {
                        setLots(data.data || []);
                        setTotalCount(data.count || 0);
                        setPage(1);
                      }
                    })
                    .finally(() => setIsLoading(false));
                }}
                className="h-7 text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Run & Drive
              </Button>

              <Button
                variant={filters.is_buynow === 'true' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    is_buynow: filters.is_buynow === 'true' ? '' : 'true'
                  };
                  setFilters(newFilters);
                  setTimeout(() => searchActiveLots(true), 100);
                }}
                className="h-7 text-xs"
              >
                <Zap className="h-3 w-3 mr-1" />
                Buy Now
              </Button>

              <Button
                variant={filters.keys === 'Yes' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    keys: filters.keys === 'Yes' ? '' : 'Yes'
                  };
                  setFilters(newFilters);
                  setTimeout(() => searchActiveLots(true), 100);
                }}
                className="h-7 text-xs"
              >
                <Car className="h-3 w-3 mr-1" />
                Has Keys
              </Button>

              <Button
                variant={filters.document === 'Clean' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    document: filters.document === 'Clean' ? '' : 'Clean'
                  };
                  setFilters(newFilters);
                  setTimeout(() => searchActiveLots(true), 100);
                }}
                className="h-7 text-xs"
              >
                <FileText className="h-3 w-3 mr-1" />
                Clean Title
              </Button>

              <Button
                variant={filters.current_bid === '<5000' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    current_bid: filters.current_bid === '<5000' ? '' : '<5000'
                  };
                  setFilters(newFilters);
                  setTimeout(() => searchActiveLots(true), 100);
                }}
                className="h-7 text-xs"
              >
                <DollarSign className="h-3 w-3 mr-1" />
                Low Bids (&lt;$5k)
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newFilters = {
                    site: '',
                    lot_id: '',
                    salvage_id: '',
                    title: '',
                    status: '',
                    odometer: '',
                    odobrand: '',
                    drive: '',
                    price_new: '',
                    price_future: '',
                    current_bid: '',
                    auction_date: '',
                    year: '',
                    make: '',
                    model: '',
                    series: '',
                    damage_pr: '',
                    damage_sec: '',
                    keys: '',
                    fuel: '',
                    transmission: '',
                    color: '',
                    document: '',
                    vehicle_type: '',
                    auction_type: '',
                    is_buynow: '',
                    location: '',
                    seller_type: '',
                    body_type: '',
                    cylinders: '',
                    engine_size: ''
                  };
                  setFilters(newFilters);
                  setTimeout(() => searchActiveLots(true), 100);
                }}
                className="h-7 text-xs text-gray-500"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 text-sm"
            >
              <Filter className="h-4 w-4" />
              Advanced Filters
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Advanced Filters (Collapsible) */}
          {showAdvancedFilters && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Make</label>
                  <Select value={filters.make} onValueChange={(value) => setFilters({...filters, make: value, model: ''})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select make" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Makes</SelectItem>
                      <SelectItem value="Acura">Acura</SelectItem>
                      <SelectItem value="Audi">Audi</SelectItem>
                      <SelectItem value="BMW">BMW</SelectItem>
                      <SelectItem value="Chevrolet">Chevrolet</SelectItem>
                      <SelectItem value="Ford">Ford</SelectItem>
                      <SelectItem value="Honda">Honda</SelectItem>
                      <SelectItem value="Hyundai">Hyundai</SelectItem>
                      <SelectItem value="Infiniti">Infiniti</SelectItem>
                      <SelectItem value="Jeep">Jeep</SelectItem>
                      <SelectItem value="Kia">Kia</SelectItem>
                      <SelectItem value="Lexus">Lexus</SelectItem>
                      <SelectItem value="Mazda">Mazda</SelectItem>
                      <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                      <SelectItem value="Nissan">Nissan</SelectItem>
                      <SelectItem value="Subaru">Subaru</SelectItem>
                      <SelectItem value="Tesla">Tesla</SelectItem>
                      <SelectItem value="Toyota">Toyota</SelectItem>
                      <SelectItem value="Volkswagen">Volkswagen</SelectItem>
                      <SelectItem value="Volvo">Volvo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Model</label>
                  <Input
                    placeholder="Enter model"
                    value={filters.model}
                    onChange={(e) => setFilters({...filters, model: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Year From</label>
                  <Input
                    placeholder="e.g., 2015"
                    value={filters.year}
                    onChange={(e) => setFilters({...filters, year: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Engine Size</label>
                  <Input
                    placeholder="e.g., 2.5"
                    value={filters.engine_size}
                    onChange={(e) => setFilters({...filters, engine_size: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Location</label>
                  <Input
                    placeholder="e.g., CA, TX, FL"
                    value={filters.location}
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Damage</label>
                  <Select value={filters.damage_pr} onValueChange={(value) => setFilters({...filters, damage_pr: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select damage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Damage Types</SelectItem>
                      <SelectItem value="Front End">Front End</SelectItem>
                      <SelectItem value="Rear End">Rear End</SelectItem>
                      <SelectItem value="Side">Side</SelectItem>
                      <SelectItem value="All Over">All Over</SelectItem>
                      <SelectItem value="Minor Dent/Scratches">Minor Dent/Scratches</SelectItem>
                      <SelectItem value="Hail">Hail</SelectItem>
                      <SelectItem value="Water/Flood">Water/Flood</SelectItem>
                      <SelectItem value="Fire">Fire</SelectItem>
                      <SelectItem value="Vandalism">Vandalism</SelectItem>
                      <SelectItem value="Theft">Theft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Price Min</label>
                  <Input
                    placeholder="e.g., 1000"
                    value={filters.price_new}
                    onChange={(e) => setFilters({...filters, price_new: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Price Max</label>
                  <Input
                    placeholder="e.g., 50000"
                    value={filters.price_future}
                    onChange={(e) => setFilters({...filters, price_future: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Mileage Min</label>
                  <Input
                    placeholder="e.g., 10000"
                    value={filters.odometer}
                    onChange={(e) => setFilters({...filters, odometer: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Secondary Damage</label>
                  <Input
                    placeholder="e.g., Hail, Side"
                    value={filters.damage_sec}
                    onChange={(e) => setFilters({...filters, damage_sec: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Transmission</label>
                  <Select value={filters.transmission} onValueChange={(value) => setFilters({...filters, transmission: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transmission" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Automatic">Automatic</SelectItem>
                      <SelectItem value="Manual">Manual</SelectItem>
                      <SelectItem value="CVT">CVT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Fuel Type</label>
                  <Select value={filters.fuel} onValueChange={(value) => setFilters({...filters, fuel: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Gasoline">Gasoline</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                      <SelectItem value="Electric">Electric</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Flexible Fuel">Flexible Fuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({
                    site: '',
                    lot_id: '',
                    salvage_id: '',
                    title: '',
                    status: '',
                    odometer: '',
                    odobrand: '',
                    drive: '',
                    price_new: '',
                    price_future: '',
                    current_bid: '',
                    auction_date: '',
                    year: '',
                    make: '',
                    model: '',
                    series: '',
                    damage_pr: '',
                    damage_sec: '',
                    keys: '',
                    fuel: '',
                    transmission: '',
                    color: '',
                    document: '',
                    vehicle_type: '',
                    auction_type: '',
                    is_buynow: '',
                    location: '',
                    seller_type: '',
                    body_type: '',
                    cylinders: '',
                    engine_size: ''
                  })}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
                <Button onClick={() => searchActiveLots(true)} disabled={isLoading}>
                  {isLoading ? 'Searching...' : 'Apply Filters'}
                </Button>
              </div>
            </div>
          )}

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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-lg sm:text-xl font-semibold">
              Found {totalCount.toLocaleString()} active lots on {selectedPlatform.toUpperCase()}
            </h2>
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = Math.max(1, page - 1);
                    setPage(newPage);
                    
                    // Search with correct page number
                    const queryParams = new URLSearchParams({
                      site: selectedPlatform === 'copart' ? '1' : '2',
                      page: newPage.toString(),
                      size: '25'
                    });
                    
                    Object.entries(filters).forEach(([key, value]) => {
                      if (value && value.toString().trim()) {
                        queryParams.append(key, value.toString().trim());
                      }
                    });
                    
                    setIsLoading(true);
                    fetch(`/api/cars?${queryParams}`)
                      .then(res => res.json())
                      .then(data => {
                        if (data.success) {
                          setLots(data.data || []);
                          setTotalCount(data.count || 0);
                        }
                      })
                      .finally(() => setIsLoading(false));
                  }}
                  disabled={page <= 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = page + 1;
                    setPage(newPage);
                    
                    // Search with correct page number
                    const queryParams = new URLSearchParams({
                      site: selectedPlatform === 'copart' ? '1' : '2',
                      page: newPage.toString(),
                      size: '25'
                    });
                    
                    Object.entries(filters).forEach(([key, value]) => {
                      if (value && value.toString().trim()) {
                        queryParams.append(key, value.toString().trim());
                      }
                    });
                    
                    setIsLoading(true);
                    fetch(`/api/cars?${queryParams}`)
                      .then(res => res.json())
                      .then(data => {
                        if (data.success) {
                          setLots(data.data || []);
                          setTotalCount(data.count || 0);
                        }
                      })
                      .finally(() => setIsLoading(false));
                  }}
                  disabled={isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lots.map((lot) => (
              <Card key={lot.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg line-clamp-2">
                        {lot.year} {lot.make} {lot.model}
                      </h3>
                      <Badge variant="secondary" className="ml-2">
                        Lot #{lot.lot_id}
                      </Badge>
                    </div>

                    {/* Vehicle Image */}
                    {lot.link_img_hd && lot.link_img_hd.length > 0 && (
                      <div className="relative">
                        <img
                          src={lot.link_img_hd[0]}
                          alt={`${lot.make} ${lot.model}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        {lot.link_img_hd.length > 1 && (
                          <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            {lot.link_img_hd.length}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">${lot.current_bid?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-blue-600" />
                        <span>{lot.odometer?.toLocaleString() || 'N/A'} mi</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        <span className="truncate">{lot.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <span>{new Date(lot.auction_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        {lot.damage_pr}
                      </Badge>
                      <Badge 
                        variant={lot.status === 'Run & Drive' ? 'default' : 'secondary'} 
                        className="text-xs"
                      >
                        {lot.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {lot.transmission}
                      </Badge>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setSelectedLot(lot)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      {selectedLot && <LotDetailDialog lot={selectedLot} />}
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {lots.length === 0 && !isLoading && !error && (
        <Card>
          <CardContent className="text-center py-12">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No vehicles found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or browse all available lots
            </p>
            <Button 
              onClick={() => searchActiveLots(true)} 
              className="mt-4"
            >
              Browse All Lots
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}