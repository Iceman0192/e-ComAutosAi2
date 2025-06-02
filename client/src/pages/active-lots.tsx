import { useState, useEffect } from 'react';
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
  AlertCircle,
  Gauge,
  ExternalLink,
  RefreshCw
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
  price_min: string;
  price_max: string;
  current_bid: string;
  auction_date: string;
  year: string;
  year_from: string;
  year_to: string;
  odometer_min: string;
  odometer_max: string;
  mileage_min: string;
  mileage_max: string;
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
  buy_now: string;
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
  const [budgetPreset, setBudgetPreset] = useState('any');
  const [yearPreset, setYearPreset] = useState('any');
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
    price_min: '',
    price_max: '',
    current_bid: '',
    auction_date: '',
    year: '',
    year_from: '',
    year_to: '',
    odometer_min: '',
    odometer_max: '',
    mileage_min: '',
    mileage_max: '',
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
    buy_now: '',
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
    searchWithFilters(filters, resetPage);
  };

  // Helper function to handle quick filter clicks
  const handleQuickFilter = (filterKey: keyof SearchFilters, filterValue: string) => {
    const newFilters = {
      ...filters,
      [filterKey]: filters[filterKey] === filterValue ? '' : filterValue
    };
    console.log('Quick Filter Applied:', filterKey, '=', newFilters[filterKey]);
    console.log('New Filter State:', newFilters);
    setFilters(newFilters);

    // Search with the new filters immediately
    searchWithFilters(newFilters, true);
  };

  // Search function that accepts filters as parameter
  const searchWithFilters = async (searchFilters: SearchFilters, resetPage = false) => {
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

      // Add all filter parameters using the provided filters
      Object.entries(searchFilters).forEach(([key, value]) => {
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

  // Handle preset filters
  const handleBudgetPreset = (preset: string) => {
    setBudgetPreset(preset);
    const newFilters = { ...filters };

    switch (preset) {
      case 'under-5k':
        newFilters.price_max = '5000';
        break;
      case 'under-10k':
        newFilters.price_max = '10000';
        break;
      case 'under-25k':
        newFilters.price_max = '25000';
        break;
      case 'under-50k':
        newFilters.price_max = '50000';
        break;
      case 'any':
      default:
        newFilters.price_max = '';
        break;
    }

    setFilters(newFilters);
  };

  const handleYearPreset = (preset: string) => {
    setYearPreset(preset);
    const newFilters = { ...filters };

    switch (preset) {
      case '2020+':
        newFilters.year_from = '2020';
        newFilters.year_to = '';
        break;
      case '2015-2019':
        newFilters.year_from = '2015';
        newFilters.year_to = '2019';
        break;
      case '2010-2014':
        newFilters.year_from = '2010';
        newFilters.year_to = '2014';
        break;
      case '2005-2009':
        newFilters.year_from = '2005';
        newFilters.year_to = '2009';
        break;
      case 'any':
      default:
        newFilters.year_from = '';
        newFilters.year_to = '';
        break;
    }

    setFilters(newFilters);
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
      price_min: '',
      price_max: '',
      current_bid: '',
      auction_date: '',
      year: `${lot.year - 1}-${lot.year + 1}`, // Near-exact match: ±1 year for better results
      year_from: '',
      year_to: '',
      odometer_min: '',
      odometer_max: '',
      mileage_min: '',
      mileage_max: '',
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
      buy_now: '',
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

          {/* Primary Search Interface */}
          <div className="space-y-6">
            {/* Vehicle Search - Make & Model */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Find Your Vehicle</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Make</label>
                  <Select value={filters.make} onValueChange={(value) => setFilters({...filters, make: value, model: ''})}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select make" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Make</SelectItem>
                      <SelectItem value="Toyota">Toyota</SelectItem>
                      <SelectItem value="Honda">Honda</SelectItem>
                      <SelectItem value="Ford">Ford</SelectItem>
                      <SelectItem value="Chevrolet">Chevrolet</SelectItem>
                      <SelectItem value="BMW">BMW</SelectItem>
                      <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                      <SelectItem value="Audi">Audi</SelectItem>
                      <SelectItem value="Nissan">Nissan</SelectItem>
                      <SelectItem value="Hyundai">Hyundai</SelectItem>
                      <SelectItem value="Kia">Kia</SelectItem>
                      <SelectItem value="Subaru">Subaru</SelectItem>
                      <SelectItem value="Mazda">Mazda</SelectItem>
                      <SelectItem value="Volkswagen">Volkswagen</SelectItem>
                      <SelectItem value="Lexus">Lexus</SelectItem>
                      <SelectItem value="Acura">Acura</SelectItem>
                      <SelectItem value="Infiniti">Infiniti</SelectItem>
                      <SelectItem value="Cadillac">Cadillac</SelectItem>
                      <SelectItem value="Lincoln">Lincoln</SelectItem>
                      <SelectItem value="Buick">Buick</SelectItem>
                      <SelectItem value="GMC">GMC</SelectItem>
                      <SelectItem value="Ram">Ram</SelectItem>
                      <SelectItem value="Jeep">Jeep</SelectItem>
                      <SelectItem value="Dodge">Dodge</SelectItem>
                      <SelectItem value="Chrysler">Chrysler</SelectItem>
                      <SelectItem value="Tesla">Tesla</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Model</label>
                  <Select value={filters.model} onValueChange={(value) => setFilters({...filters, model: value})}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Any model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Model</SelectItem>
                      {filters.make === 'Toyota' && (
                        <>
                          <SelectItem value="Camry">Camry</SelectItem>
                          <SelectItem value="Corolla">Corolla</SelectItem>
                          <SelectItem value="Prius">Prius</SelectItem>
                          <SelectItem value="RAV4">RAV4</SelectItem>
                          <SelectItem value="Highlander">Highlander</SelectItem>
                          <SelectItem value="Tacoma">Tacoma</SelectItem>
                          <SelectItem value="Tundra">Tundra</SelectItem>
                        </>
                      )}
                      {filters.make === 'Honda' && (
                        <>
                          <SelectItem value="Accord">Accord</SelectItem>
                          <SelectItem value="Civic">Civic</SelectItem>
                          <SelectItem value="CR-V">CR-V</SelectItem>
                          <SelectItem value="Pilot">Pilot</SelectItem>
                          <SelectItem value="Odyssey">Odyssey</SelectItem>
                          <SelectItem value="Fit">Fit</SelectItem>
                        </>
                      )}
                      {filters.make === 'Ford' && (
                        <>
                          <SelectItem value="F-150">F-150</SelectItem>
                          <SelectItem value="Mustang">Mustang</SelectItem>
                          <SelectItem value="Explorer">Explorer</SelectItem>
                          <SelectItem value="Escape">Escape</SelectItem>
                          <SelectItem value="Focus">Focus</SelectItem>
                          <SelectItem value="Fusion">Fusion</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Essential Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Budget Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Budget</label>
                <Select value={budgetPreset} onValueChange={handleBudgetPreset}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Any price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Price</SelectItem>
                    <SelectItem value="under-5k">Under $5K</SelectItem>
                    <SelectItem value="under-10k">Under $10K</SelectItem>
                    <SelectItem value="under-25k">Under $25K</SelectItem>
                    <SelectItem value="under-50k">Under $50K</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Year Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <Select value={yearPreset} onValueChange={handleYearPreset}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Any year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Year</SelectItem>
                    <SelectItem value="2020+">2020 & Newer</SelectItem>
                    <SelectItem value="2015-2019">2015-2019</SelectItem>
                    <SelectItem value="2010-2014">2010-2014</SelectItem>
                    <SelectItem value="2005-2009">2005-2009</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Condition Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Condition</label>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Any condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Condition</SelectItem>
                    <SelectItem value="Run & Drive">Run & Drive</SelectItem>
                    <SelectItem value="Starts">Starts Only</SelectItem>
                    <SelectItem value="Won't Start">Won't Start</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Select value={filters.location} onValueChange={(value) => setFilters({...filters, location: value})}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Any location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Location</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="PA">Pennsylvania</SelectItem>
                    <SelectItem value="OH">Ohio</SelectItem>
                    <SelectItem value="IL">Illinois</SelectItem>
                    <SelectItem value="NC">North Carolina</SelectItem>
                    <SelectItem value="GA">Georgia</SelectItem>
                    <SelectItem value="VA">Virginia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Primary Damage Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Primary Damage</label>
                <Select value={filters.damage_pr} onValueChange={(value) => setFilters({...filters, damage_pr: value})}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Any damage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Damage</SelectItem>
                    <SelectItem value="Front End">Front End</SelectItem>
                    <SelectItem value="Rear End">Rear End</SelectItem>
                    <SelectItem value="Side">Side</SelectItem>
                    <SelectItem value="Hail">Hail</SelectItem>
                    <SelectItem value="Minor Dent/Scratches">Minor Dent/Scratches</SelectItem>
                    <SelectItem value="Water/Flood">Water/Flood</SelectItem>
                    <SelectItem value="Fire">Fire</SelectItem>                    <SelectItem value="Vandalism">Vandalism</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Document Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Type</label>
                <Select value={filters.document} onValueChange={(value) => setFilters({...filters, document: value})}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Any title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Title</SelectItem>
                    <SelectItem value="Clean">Clean</SelectItem>
                    <SelectItem value="Salvage">Salvage</SelectItem>
                    <SelectItem value="Rebuilt">Rebuilt</SelectItem>
                    <SelectItem value="Lemon">Lemon</SelectItem>
                    <SelectItem value="Flood">Flood</SelectItem>
                    <SelectItem value="Cert of Title">Cert of Title</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(filters.make !== '' || filters.price_max !== '' || filters.year_from !== '' || filters.status !== '') && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Active filters:</span>
                  {filters.make && filters.make !== 'all' && (
                    <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                      {filters.make} {filters.model && filters.model !== 'all' ? filters.model : ''}
                    </span>
                  )}
                  {filters.price_max && (
                    <span className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm">
                      Under ${parseInt(filters.price_max).toLocaleString()}
                    </span>
                  )}
                  {(filters.year_from || filters.year_to) && (
                    <span className="bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm">
                      {filters.year_from}{filters.year_to ? `-${filters.year_to}` : '+'}
                    </span>
                  )}
                  {filters.status && filters.status !== 'all' && (
                    <span className="bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full text-sm">
                      {filters.status}
                    </span>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setFilters({
                        site: '', lot_id: '', salvage_id: '', title: '', status: '', odometer: '', odobrand: '', drive: '',
                        price_new: '', price_future: '', price_min: '', price_max: '', current_bid: '', auction_date: '',
                        year: '', year_from: '', year_to: '', odometer_min: '', odometer_max: '', mileage_min: '', mileage_max: '',
                        make: '', model: '', series: '', damage_pr: '', damage_sec: '', keys: '', fuel: '', transmission: '',
                        color: '', document: '', vehicle_type: '', auction_type: '', is_buynow: '', buy_now: '', location: '',
                        seller_type: '', body_type: '', cylinders: '', engine_size: ''
                      });
                      setBudgetPreset('any');
                      setYearPreset('any');
                    }}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear all
                  </Button>
                </div>
              </div>
            )}

            {/* Search Action */}
            <div>
              <Button onClick={() => searchActiveLots(true)} className="w-full h-14 text-lg font-semibold" disabled={isLoading}>
                <Search className="w-5 h-5 mr-2" />
                {isLoading ? 'Searching vehicles...' : `Search ${totalCount?.toLocaleString() || ''} Vehicles`}
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                Searching {selectedPlatform === 'copart' ? 'Copart' : 'IAAI'} auction platform
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <div className="space-y-6">

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

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