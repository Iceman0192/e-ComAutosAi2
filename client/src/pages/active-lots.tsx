import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  RefreshCw, 
  AlertCircle,
  Car,
  Calendar,
  MapPin,
  DollarSign,
  Gauge,
  Fuel,
  Settings,
  FileText,
  Eye,
  TrendingUp,
  Users
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
  make: string;
  model: string;
  yearFrom: string;
  yearTo: string;
  location: string;
  damage: string;
  priceMin: string;
  priceMax: string;
  mileageMin: string;
  mileageMax: string;
  transmission: string;
  fuel: string;
  color: string;
  titleType: string;
}

interface QuickFilters {
  priceRange: string;
  yearRange: string;
  condition: string;
}

export default function ActiveLotsPage() {
  const [smartSearch, setSmartSearch] = useState('');
  const [lots, setLots] = useState<AuctionLot[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<'copart' | 'iaai'>('copart');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedLot, setSelectedLot] = useState<AuctionLot | null>(null);

  const [quickFilters, setQuickFilters] = useState<QuickFilters>({
    priceRange: '',
    yearRange: '',
    condition: ''
  });

  const [filters, setFilters] = useState<SearchFilters>({
    make: '',
    model: '',
    yearFrom: '',
    yearTo: '',
    location: '',
    damage: '',
    priceMin: '',
    priceMax: '',
    mileageMin: '',
    mileageMax: '',
    transmission: '',
    fuel: '',
    color: '',
    titleType: ''
  });

  const { toast } = useToast();

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

  const applyQuickFilter = (type: string, value: string) => {
    if (type === 'clear') {
      setQuickFilters({ priceRange: '', yearRange: '', condition: '' });
      setFilters({
        make: '', model: '', yearFrom: '', yearTo: '', location: '',
        damage: '', priceMin: '', priceMax: '', mileageMin: '', mileageMax: '',
        transmission: '', fuel: '', color: '', titleType: ''
      });
      return;
    }

    const newQuickFilters = { ...quickFilters, [type]: value };
    setQuickFilters(newQuickFilters);

    // Apply the quick filter logic
    const newFilters = { ...filters };
    
    if (type === 'priceRange') {
      switch (value) {
        case 'under5k':
          newFilters.priceMax = '5000';
          newFilters.priceMin = '';
          break;
        case '5k-15k':
          newFilters.priceMin = '5000';
          newFilters.priceMax = '15000';
          break;
        case '15k-30k':
          newFilters.priceMin = '15000';
          newFilters.priceMax = '30000';
          break;
        case 'over30k':
          newFilters.priceMin = '30000';
          newFilters.priceMax = '';
          break;
        default:
          newFilters.priceMin = '';
          newFilters.priceMax = '';
      }
    }

    if (type === 'yearRange') {
      switch (value) {
        case 'new':
          newFilters.yearFrom = '2020';
          newFilters.yearTo = '';
          break;
        case 'recent':
          newFilters.yearFrom = '2015';
          newFilters.yearTo = '2019';
          break;
        case 'older':
          newFilters.yearFrom = '';
          newFilters.yearTo = '2014';
          break;
        default:
          newFilters.yearFrom = '';
          newFilters.yearTo = '';
      }
    }

    setFilters(newFilters);
  };

  const searchActiveLots = async (resetPage = false) => {
    setIsLoading(true);
    setError('');
    
    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    try {
      const queryParams = new URLSearchParams({
        site: selectedPlatform === 'copart' ? '1' : '2',
        page: currentPage.toString(),
        size: '25',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      console.log('Active Lots Search:', selectedPlatform === 'copart' ? 'Site 1' : 'Site 2', 'Page', currentPage, 'Query:', Object.fromEntries(queryParams));

      const response = await fetch(`/api/cars?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch lots');
      
      const data = await response.json();
      console.log('Active Lots API Response:', data);
      
      if (data.success) {
        setLots(data.vehicles || []);
        setTotalCount(data.count || 0);
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

  useEffect(() => {
    searchActiveLots();
  }, [selectedPlatform]);

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
        <CardContent className="space-y-6">
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

          {/* Smart Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search vehicles... (e.g., '2020 Honda Civic', '2018-2022 Toyota', 'BMW under 25k')"
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

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick filters:</span>
            
            <Button
              variant={quickFilters.priceRange === 'under5k' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyQuickFilter('priceRange', quickFilters.priceRange === 'under5k' ? '' : 'under5k')}
              className="h-7 text-xs"
            >
              Under $5K
            </Button>
            <Button
              variant={quickFilters.priceRange === '5k-15k' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyQuickFilter('priceRange', quickFilters.priceRange === '5k-15k' ? '' : '5k-15k')}
              className="h-7 text-xs"
            >
              $5K - $15K
            </Button>
            <Button
              variant={quickFilters.priceRange === '15k-30k' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyQuickFilter('priceRange', quickFilters.priceRange === '15k-30k' ? '' : '15k-30k')}
              className="h-7 text-xs"
            >
              $15K - $30K
            </Button>
            <Button
              variant={quickFilters.priceRange === 'over30k' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyQuickFilter('priceRange', quickFilters.priceRange === 'over30k' ? '' : 'over30k')}
              className="h-7 text-xs"
            >
              Over $30K
            </Button>

            <Button
              variant={quickFilters.yearRange === 'new' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyQuickFilter('yearRange', quickFilters.yearRange === 'new' ? '' : 'new')}
              className="h-7 text-xs"
            >
              2020+ (New)
            </Button>
            <Button
              variant={quickFilters.yearRange === 'recent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyQuickFilter('yearRange', quickFilters.yearRange === 'recent' ? '' : 'recent')}
              className="h-7 text-xs"
            >
              2015-2019 (Recent)
            </Button>
            <Button
              variant={quickFilters.yearRange === 'older' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyQuickFilter('yearRange', quickFilters.yearRange === 'older' ? '' : 'older')}
              className="h-7 text-xs"
            >
              Pre-2015 (Older)
            </Button>

            <Button
              variant={quickFilters.condition === 'runDrive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyQuickFilter('condition', quickFilters.condition === 'runDrive' ? '' : 'runDrive')}
              className="h-7 text-xs"
            >
              Run & Drive
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyQuickFilter('clear', 'clear')}
              className="h-7 text-xs text-red-600 hover:text-red-700"
            >
              Clear All
            </Button>
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

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Make</label>
                  <Select value={filters.make} onValueChange={(value) => setFilters({...filters, make: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select make" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Makes</SelectItem>
                      <SelectItem value="Honda">Honda</SelectItem>
                      <SelectItem value="Toyota">Toyota</SelectItem>
                      <SelectItem value="Ford">Ford</SelectItem>
                      <SelectItem value="Chevrolet">Chevrolet</SelectItem>
                      <SelectItem value="BMW">BMW</SelectItem>
                      <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                      <SelectItem value="Audi">Audi</SelectItem>
                      <SelectItem value="Nissan">Nissan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Year From</label>
                  <Input
                    placeholder="e.g., 2015"
                    value={filters.yearFrom}
                    onChange={(e) => setFilters({...filters, yearFrom: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Year To</label>
                  <Input
                    placeholder="e.g., 2023"
                    value={filters.yearTo}
                    onChange={(e) => setFilters({...filters, yearTo: e.target.value})}
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
              </div>

              <div className="flex justify-end">
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
                    setPage(Math.max(1, page - 1));
                    searchActiveLots();
                  }}
                  disabled={page <= 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPage(page + 1);
                    searchActiveLots();
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

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">${lot.current_bid.toLocaleString()}</span>
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
                      <Badge variant="outline" className="text-xs">
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
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            {selectedLot?.year} {selectedLot?.make} {selectedLot?.model} - Lot #{selectedLot?.lot_id}
                          </DialogTitle>
                        </DialogHeader>
                        {selectedLot && (
                          <div className="space-y-6">
                            {/* Vehicle Images */}
                            {selectedLot.link_img_hd && selectedLot.link_img_hd.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {selectedLot.link_img_hd.slice(0, 6).map((img, index) => (
                                  <img
                                    key={index}
                                    src={img}
                                    alt={`${selectedLot.make} ${selectedLot.model} - Image ${index + 1}`}
                                    className="w-full h-48 object-cover rounded-lg border"
                                  />
                                ))}
                              </div>
                            )}

                            {/* Vehicle Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Vehicle Information</h3>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">VIN:</span>
                                    <span className="font-mono">{selectedLot.vin}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Engine:</span>
                                    <span>{selectedLot.engine}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Fuel:</span>
                                    <span>{selectedLot.fuel}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Drive:</span>
                                    <span>{selectedLot.drive}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Color:</span>
                                    <span>{selectedLot.color}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Keys:</span>
                                    <span>{selectedLot.keys || 'Unknown'}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Auction Details</h3>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Current Bid:</span>
                                    <span className="font-semibold text-green-600">
                                      ${selectedLot.current_bid.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Auction Date:</span>
                                    <span>{new Date(selectedLot.auction_date).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Location:</span>
                                    <span>{selectedLot.location}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Document:</span>
                                    <span>{selectedLot.document}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Primary Damage:</span>
                                    <span>{selectedLot.damage_pr}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Secondary Damage:</span>
                                    <span>{selectedLot.damage_sec}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
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