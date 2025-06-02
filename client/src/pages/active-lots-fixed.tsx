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
  const [lots, setLots] = useState<AuctionLot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSite, setSelectedSite] = useState('copart');
  const [searchMake, setSearchMake] = useState('');
  const [searchModel, setSearchModel] = useState('');
  const [budgetPreset, setBudgetPreset] = useState('any');
  const [yearPreset, setYearPreset] = useState('any');
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

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

  const searchActiveLots = async (resetPage = false) => {
    if (!searchMake.trim()) {
      setError('Please enter a vehicle make to search');
      return;
    }

    setIsLoading(true);
    setError('');
    
    if (resetPage) {
      setCurrentPage(1);
    }

    try {
      const searchParams = new URLSearchParams({
        site: selectedSite,
        make: searchMake,
        model: searchModel,
        page: resetPage ? '1' : currentPage.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '' && value !== 'all')
        )
      });

      const response = await fetch(`/api/search-active-lots?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setLots(data.lots || []);
        setTotalResults(data.total || 0);
        setTotalPages(data.totalPages || 0);
        if (resetPage) setCurrentPage(1);
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setLots([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBudgetPreset = (value: string) => {
    setBudgetPreset(value);
    switch (value) {
      case 'under-5k':
        setFilters(prev => ({ ...prev, price_max: '5000', price_min: '' }));
        break;
      case 'under-10k':
        setFilters(prev => ({ ...prev, price_max: '10000', price_min: '' }));
        break;
      case 'under-25k':
        setFilters(prev => ({ ...prev, price_max: '25000', price_min: '' }));
        break;
      case 'under-50k':
        setFilters(prev => ({ ...prev, price_max: '50000', price_min: '' }));
        break;
      case 'any':
        setFilters(prev => ({ ...prev, price_max: '', price_min: '' }));
        break;
    }
  };

  const handleYearPreset = (value: string) => {
    setYearPreset(value);
    switch (value) {
      case '2020+':
        setFilters(prev => ({ ...prev, year_from: '2020', year_to: '' }));
        break;
      case '2015-2019':
        setFilters(prev => ({ ...prev, year_from: '2015', year_to: '2019' }));
        break;
      case '2010-2014':
        setFilters(prev => ({ ...prev, year_from: '2010', year_to: '2014' }));
        break;
      case '2005-2009':
        setFilters(prev => ({ ...prev, year_from: '2005', year_to: '2009' }));
        break;
      case 'any':
        setFilters(prev => ({ ...prev, year_from: '', year_to: '' }));
        break;
    }
  };

  const clearAllFilters = () => {
    setSearchMake('');
    setSearchModel('');
    setBudgetPreset('any');
    setYearPreset('any');
    setFilters({
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
  };

  const LotDetailDialog = ({ lot }: { lot: AuctionLot }) => (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">
          {lot.year} {lot.make} {lot.model} {lot.series}
        </DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicle Images */}
        <div className="space-y-4">
          {lot.link_img_hd && lot.link_img_hd.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {lot.link_img_hd.slice(0, 4).map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`${lot.make} ${lot.model} - Image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-car.jpg';
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <Car className="h-16 w-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Vehicle Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">VIN:</span>
              <p className="text-gray-600 dark:text-gray-300">{lot.vin}</p>
            </div>
            <div>
              <span className="font-medium">Lot ID:</span>
              <p className="text-gray-600 dark:text-gray-300">{lot.lot_id}</p>
            </div>
            <div>
              <span className="font-medium">Odometer:</span>
              <p className="text-gray-600 dark:text-gray-300">{lot.odometer?.toLocaleString()} mi</p>
            </div>
            <div>
              <span className="font-medium">Current Bid:</span>
              <p className="text-green-600 font-semibold">${lot.current_bid?.toLocaleString()}</p>
            </div>
            <div>
              <span className="font-medium">Location:</span>
              <p className="text-gray-600 dark:text-gray-300">{lot.location}</p>
            </div>
            <div>
              <span className="font-medium">Auction Date:</span>
              <p className="text-gray-600 dark:text-gray-300">{new Date(lot.auction_date).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="font-medium">Primary Damage:</span>
              <p className="text-gray-600 dark:text-gray-300">{lot.damage_pr}</p>
            </div>
            <div>
              <span className="font-medium">Document Type:</span>
              <p className="text-gray-600 dark:text-gray-300">{lot.document}</p>
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <Badge variant="outline">{lot.status}</Badge>
            </div>
            <div>
              <span className="font-medium">Engine:</span>
              <p className="text-gray-600 dark:text-gray-300">{lot.engine}</p>
            </div>
            <div>
              <span className="font-medium">Transmission:</span>
              <p className="text-gray-600 dark:text-gray-300">{lot.transmission}</p>
            </div>
            <div>
              <span className="font-medium">Fuel:</span>
              <p className="text-gray-600 dark:text-gray-300">{lot.fuel}</p>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Vehicle Search</h1>
              <p className="text-gray-600 dark:text-gray-300">Find vehicles from Copart and IAAI auctions</p>
            </div>
            
            {/* Platform Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setSelectedSite('copart')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedSite === 'copart'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Copart
              </button>
              <button
                onClick={() => setSelectedSite('iaai')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedSite === 'iaai'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                IAAI
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Primary Search */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Make & Model</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Make *</label>
                <Input
                  placeholder="e.g., Toyota, Honda, Ford"
                  value={searchMake}
                  onChange={(e) => setSearchMake(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Model (Optional)</label>
                <Input
                  placeholder="e.g., Camry, Civic, F-150"
                  value={searchModel}
                  onChange={(e) => setSearchModel(e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
          </div>

          {/* Essential Filters */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Essential Filters</h3>
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
                    <SelectItem value="Fire">Fire</SelectItem>
                    <SelectItem value="Vandalism">Vandalism</SelectItem>
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
          </div>

          {/* Search Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={clearAllFilters} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Clear All
            </Button>
            <Button onClick={() => searchActiveLots(true)} disabled={isLoading} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              {isLoading ? 'Searching...' : 'Search Vehicles'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Results */}
      {lots.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Search Results ({totalResults.toLocaleString()} vehicles found)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lots.map((lot) => (
              <Card key={lot.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                  {lot.link_img_hd && lot.link_img_hd.length > 0 ? (
                    <img
                      src={lot.link_img_hd[0]}
                      alt={`${lot.year} ${lot.make} ${lot.model}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-car.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-white/90 text-black">
                      {selectedSite === 'copart' ? 'Copart' : 'IAAI'}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">
                      {lot.year} {lot.make} {lot.model}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">${lot.current_bid?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Gauge className="h-4 w-4 text-blue-600" />
                        <span>{lot.odometer?.toLocaleString() || 'N/A'} mi</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        <span className="truncate">{lot.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <span>{new Date(lot.auction_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {lot.damage_pr}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {lot.document}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {lot.status}
                      </Badge>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <LotDetailDialog lot={lot} />
                      </Dialog>
                      
                      {lot.link && (
                        <Button size="sm" asChild className="flex-1">
                          <a href={lot.link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Auction
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}