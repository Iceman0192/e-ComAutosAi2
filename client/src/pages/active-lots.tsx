import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  ExternalLink,
  RefreshCw,
  Target
} from 'lucide-react';

interface AuctionLot {
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
  priceMin: string;
  priceMax: string;
  mileageMin: string;
  mileageMax: string;
  transmission: string;
  fuel: string;
  color: string;
  titleType: string;
}

// Make-Model mapping data
const makeModelData: { [key: string]: string[] } = {
  "Acura": ["CSX", "ILX", "Integra", "MDX", "NSX", "RDX", "RL", "RLX", "TL", "TLX", "TSX", "ZDX"],
  "Audi": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "e-tron", "Q2", "Q3", "Q4", "Q5", "Q7", "Q8", "R8", "TT"],
  "BMW": ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "8 Series", "i3", "i4", "i7", "i8", "iX", "M2", "M3", "M4", "M5", "M6", "M8", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4"],
  "Buick": ["Cascada", "Enclave", "Encore", "Envision", "LaCrosse", "Regal", "Verano"],
  "Cadillac": ["ATS", "CT4", "CT5", "CT6", "CTS", "Escalade", "LYRIQ", "SRX", "XT4", "XT5", "XT6", "XTS"],
  "Chevrolet": ["Avalanche", "Blazer", "Bolt EV", "Camaro", "Colorado", "Corvette", "Cruze", "Equinox", "Express", "Impala", "Malibu", "Silverado", "Sonic", "Spark", "Suburban", "Tahoe", "Traverse", "Trax", "Volt"],
  "Chrysler": ["200", "300", "Pacifica", "Voyager"],
  "Dodge": ["Challenger", "Charger", "Durango", "Journey", "Ram 1500", "Ram 2500", "Ram 3500"],
  "Ford": ["Bronco", "Bronco Sport", "E-Transit", "EcoSport", "Edge", "Escape", "Expedition", "Explorer", "F-150", "F-250", "F-350", "F-450", "Fiesta", "Flex", "Focus", "Fusion", "GT", "Maverick", "Mustang", "Ranger", "Taurus", "Transit"],
  "GMC": ["Acadia", "Canyon", "Savana", "Sierra", "Terrain", "Yukon"],
  "Honda": ["Accord", "Civic", "CR-V", "HR-V", "Insight", "Odyssey", "Passport", "Pilot", "Ridgeline"],
  "Hyundai": ["Accent", "Elantra", "Genesis", "Ioniq", "Kona", "Palisade", "Santa Fe", "Sonata", "Tucson", "Veloster", "Venue"],
  "Infiniti": ["Q50", "Q60", "Q70", "QX30", "QX50", "QX60", "QX70", "QX80"],
  "Jeep": ["Cherokee", "Compass", "Gladiator", "Grand Cherokee", "Renegade", "Wrangler"],
  "Kia": ["Cadenza", "Forte", "K5", "Niro", "Optima", "Rio", "Sedona", "Seltos", "Sorento", "Soul", "Sportage", "Stinger", "Telluride"],
  "Lexus": ["CT", "ES", "GS", "GX", "IS", "LC", "LS", "LX", "NX", "RC", "RX", "UX"],
  "Lincoln": ["Aviator", "Continental", "Corsair", "MKC", "MKT", "MKX", "MKZ", "Navigator", "Nautilus"],
  "Mazda": ["CX-3", "CX-30", "CX-5", "CX-9", "Mazda3", "Mazda6", "MX-5 Miata"],
  "Mercedes-Benz": ["A-Class", "C-Class", "CLA", "CLS", "E-Class", "G-Class", "GLA", "GLB", "GLC", "GLE", "GLS", "S-Class", "SL", "SLC"],
  "MINI": ["Clubman", "Convertible", "Countryman", "Hardtop"],
  "Mitsubishi": ["Eclipse Cross", "Mirage", "Outlander", "Outlander Sport"],
  "Nissan": ["370Z", "Altima", "Armada", "Frontier", "Kicks", "Leaf", "Maxima", "Murano", "NV200", "Pathfinder", "Rogue", "Sentra", "Titan", "Versa"],
  "Porsche": ["718 Boxster", "718 Cayman", "911", "Cayenne", "Macan", "Panamera", "Taycan"],
  "Ram": ["1500", "2500", "3500", "ProMaster"],
  "Subaru": ["Ascent", "BRZ", "Crosstrek", "Forester", "Impreza", "Legacy", "Outback", "WRX"],
  "Tesla": ["Model 3", "Model S", "Model X", "Model Y"],
  "Toyota": ["4Runner", "Avalon", "Camry", "C-HR", "Corolla", "Highlander", "Land Cruiser", "Prius", "RAV4", "Sequoia", "Sienna", "Tacoma", "Tundra", "Venza"],
  "Volkswagen": ["Arteon", "Atlas", "Beetle", "Golf", "Jetta", "Passat", "Tiguan", "Touareg"],
  "Volvo": ["S60", "S90", "V60", "V90", "XC40", "XC60", "XC90"]
};

export default function ActiveLotsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'copart' | 'iaai'>('copart');
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
  const [lots, setLots] = useState<AuctionLot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedLot, setSelectedLot] = useState<AuctionLot | null>(null);

  const searchActiveLots = async (resetPage = false) => {
    setIsLoading(true);
    setError(null);
    const currentPage = resetPage ? 1 : page;
    
    try {
      const params = new URLSearchParams({
        site: selectedPlatform === 'copart' ? '1' : '2',
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
          else if (key === 'priceMin') params.append('price_min', value);
          else if (key === 'priceMax') params.append('price_max', value);
          else if (key === 'mileageMin') params.append('mileage_min', value);
          else if (key === 'mileageMax') params.append('mileage_max', value);
          else if (key === 'titleType') params.append('title_type', value);
          else params.append(key, value);
        }
      });

      const response = await fetch(`/api/cars?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to search ${selectedPlatform.toUpperCase()} lots`);
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
    searchActiveLots(true);
  }, [selectedPlatform]);

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
    const statusLower = (status || '').toLowerCase();
    const isUpcoming = new Date(saleDate) > new Date();
    
    if (statusLower.includes('sold')) {
      return <Badge variant="default" className="bg-green-600">Sold</Badge>;
    } else if (statusLower.includes('not sold')) {
      return <Badge variant="destructive">Not Sold</Badge>;
    } else if (isUpcoming) {
      return <Badge variant="secondary" className={selectedPlatform === 'copart' ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'}>Live Auction</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const getPlatformColor = () => {
    return selectedPlatform === 'copart' ? 'red' : 'orange';
  };

  const LotDetailDialog = ({ lot }: { lot: AuctionLot }) => (
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
                View on {selectedPlatform.toUpperCase()}
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
                  <span className="font-medium">Platform:</span>
                  <span>{selectedPlatform.toUpperCase()}</span>
                </div>
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
          <Target className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Active Lot Finder</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover active auction lots across Copart and IAAI platforms. Search by vehicle specifications or use lot data to find similar opportunities.
        </p>
      </div>

      {/* Platform Toggle */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Auction Platform</span>
            <div className="flex items-center space-x-4">
              <Label htmlFor="platform-toggle" className="text-sm font-medium">
                Platform:
              </Label>
              <div className="flex items-center space-x-3">
                <span className={`text-sm ${selectedPlatform === 'copart' ? 'font-bold' : 'text-muted-foreground'}`}>
                  Copart
                </span>
                <Switch
                  id="platform-toggle"
                  checked={selectedPlatform === 'iaai'}
                  onCheckedChange={(checked) => setSelectedPlatform(checked ? 'iaai' : 'copart')}
                />
                <span className={`text-sm ${selectedPlatform === 'iaai' ? 'font-bold' : 'text-muted-foreground'}`}>
                  IAAI
                </span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-4 h-4 rounded-full ${selectedPlatform === 'copart' ? 'bg-red-600' : 'bg-orange-600'}`}></div>
            <span className="text-sm font-medium">
              Currently searching {selectedPlatform === 'copart' ? 'Copart' : 'IAAI'} active lots
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Active Lots
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
            <Button onClick={() => searchActiveLots(true)} disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          <div className="space-y-4">
            {/* Basic Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Make</label>
                <Select value={filters.make} onValueChange={(value) => setFilters({...filters, make: value, model: 'all'})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select make" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Makes</SelectItem>
                    <SelectItem value="Acura">Acura</SelectItem>
                    <SelectItem value="Alfa Romeo">Alfa Romeo</SelectItem>
                    <SelectItem value="Aston Martin">Aston Martin</SelectItem>
                    <SelectItem value="Audi">Audi</SelectItem>
                    <SelectItem value="BMW">BMW</SelectItem>
                    <SelectItem value="Bentley">Bentley</SelectItem>
                    <SelectItem value="Bugatti">Bugatti</SelectItem>
                    <SelectItem value="Buick">Buick</SelectItem>
                    <SelectItem value="Cadillac">Cadillac</SelectItem>
                    <SelectItem value="Chevrolet">Chevrolet</SelectItem>
                    <SelectItem value="Chrysler">Chrysler</SelectItem>
                    <SelectItem value="Dodge">Dodge</SelectItem>
                    <SelectItem value="Ferrari">Ferrari</SelectItem>
                    <SelectItem value="Fiat">Fiat</SelectItem>
                    <SelectItem value="Fisker">Fisker</SelectItem>
                    <SelectItem value="Ford">Ford</SelectItem>
                    <SelectItem value="GMC">GMC</SelectItem>
                    <SelectItem value="Genesis">Genesis</SelectItem>
                    <SelectItem value="Honda">Honda</SelectItem>
                    <SelectItem value="Hyundai">Hyundai</SelectItem>
                    <SelectItem value="Infiniti">Infiniti</SelectItem>
                    <SelectItem value="Isuzu">Isuzu</SelectItem>
                    <SelectItem value="Jaguar">Jaguar</SelectItem>
                    <SelectItem value="Jeep">Jeep</SelectItem>
                    <SelectItem value="Kia">Kia</SelectItem>
                    <SelectItem value="Lamborghini">Lamborghini</SelectItem>
                    <SelectItem value="Land Rover">Land Rover</SelectItem>
                    <SelectItem value="Lexus">Lexus</SelectItem>
                    <SelectItem value="Lincoln">Lincoln</SelectItem>
                    <SelectItem value="Lotus">Lotus</SelectItem>
                    <SelectItem value="Lucid">Lucid</SelectItem>
                    <SelectItem value="Maserati">Maserati</SelectItem>
                    <SelectItem value="Mazda">Mazda</SelectItem>
                    <SelectItem value="McLaren">McLaren</SelectItem>
                    <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                    <SelectItem value="MINI">MINI</SelectItem>
                    <SelectItem value="Mitsubishi">Mitsubishi</SelectItem>
                    <SelectItem value="Nissan">Nissan</SelectItem>
                    <SelectItem value="Polestar">Polestar</SelectItem>
                    <SelectItem value="Porsche">Porsche</SelectItem>
                    <SelectItem value="Ram">Ram</SelectItem>
                    <SelectItem value="Rivian">Rivian</SelectItem>
                    <SelectItem value="Rolls-Royce">Rolls-Royce</SelectItem>
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
                <Select 
                  value={filters.model} 
                  onValueChange={(value) => setFilters({...filters, model: value})}
                  disabled={!filters.make || filters.make === 'all'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filters.make && filters.make !== 'all' ? "Select model" : "Select make first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    {filters.make && filters.make !== 'all' && makeModelData[filters.make] && 
                      makeModelData[filters.make].map((model) => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Year From</label>
                <Select value={filters.yearFrom} onValueChange={(value) => setFilters({...filters, yearFrom: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="From year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Year</SelectItem>
                    {Array.from({length: 25}, (_, i) => 2024 - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Year To</label>
                <Select value={filters.yearTo} onValueChange={(value) => setFilters({...filters, yearTo: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="To year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Year</SelectItem>
                    {Array.from({length: 25}, (_, i) => 2024 - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price and Mileage Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Min Price ($)</label>
                <Select value={filters.priceMin} onValueChange={(value) => setFilters({...filters, priceMin: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Min price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">No Min</SelectItem>
                    <SelectItem value="500">$500</SelectItem>
                    <SelectItem value="1000">$1,000</SelectItem>
                    <SelectItem value="2500">$2,500</SelectItem>
                    <SelectItem value="5000">$5,000</SelectItem>
                    <SelectItem value="7500">$7,500</SelectItem>
                    <SelectItem value="10000">$10,000</SelectItem>
                    <SelectItem value="15000">$15,000</SelectItem>
                    <SelectItem value="20000">$20,000</SelectItem>
                    <SelectItem value="25000">$25,000</SelectItem>
                    <SelectItem value="30000">$30,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Max Price ($)</label>
                <Select value={filters.priceMax} onValueChange={(value) => setFilters({...filters, priceMax: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Max price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">No Max</SelectItem>
                    <SelectItem value="5000">$5,000</SelectItem>
                    <SelectItem value="10000">$10,000</SelectItem>
                    <SelectItem value="15000">$15,000</SelectItem>
                    <SelectItem value="20000">$20,000</SelectItem>
                    <SelectItem value="25000">$25,000</SelectItem>
                    <SelectItem value="30000">$30,000</SelectItem>
                    <SelectItem value="40000">$40,000</SelectItem>
                    <SelectItem value="50000">$50,000</SelectItem>
                    <SelectItem value="75000">$75,000</SelectItem>
                    <SelectItem value="100000">$100,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Min Mileage</label>
                <Select value={filters.mileageMin} onValueChange={(value) => setFilters({...filters, mileageMin: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Min mileage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">No Min</SelectItem>
                    <SelectItem value="0">0 miles</SelectItem>
                    <SelectItem value="10000">10,000 miles</SelectItem>
                    <SelectItem value="25000">25,000 miles</SelectItem>
                    <SelectItem value="50000">50,000 miles</SelectItem>
                    <SelectItem value="75000">75,000 miles</SelectItem>
                    <SelectItem value="100000">100,000 miles</SelectItem>
                    <SelectItem value="150000">150,000 miles</SelectItem>
                    <SelectItem value="200000">200,000 miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Max Mileage</label>
                <Select value={filters.mileageMax} onValueChange={(value) => setFilters({...filters, mileageMax: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Max mileage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">No Max</SelectItem>
                    <SelectItem value="25000">25,000 miles</SelectItem>
                    <SelectItem value="50000">50,000 miles</SelectItem>
                    <SelectItem value="75000">75,000 miles</SelectItem>
                    <SelectItem value="100000">100,000 miles</SelectItem>
                    <SelectItem value="150000">150,000 miles</SelectItem>
                    <SelectItem value="200000">200,000 miles</SelectItem>
                    <SelectItem value="250000">250,000 miles</SelectItem>
                    <SelectItem value="300000">300,000+ miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Location</label>
                <Select value={filters.location} onValueChange={(value) => setFilters({...filters, location: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="PA">Pennsylvania</SelectItem>
                    <SelectItem value="IL">Illinois</SelectItem>
                    <SelectItem value="OH">Ohio</SelectItem>
                    <SelectItem value="GA">Georgia</SelectItem>
                    <SelectItem value="NC">North Carolina</SelectItem>
                    <SelectItem value="MI">Michigan</SelectItem>
                    <SelectItem value="NJ">New Jersey</SelectItem>
                    <SelectItem value="VA">Virginia</SelectItem>
                    <SelectItem value="WA">Washington</SelectItem>
                    <SelectItem value="AZ">Arizona</SelectItem>
                    <SelectItem value="MA">Massachusetts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Damage</label>
                <Select value={filters.damage} onValueChange={(value) => setFilters({...filters, damage: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select damage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Damage Types</SelectItem>
                    <SelectItem value="Front End">Front End</SelectItem>
                    <SelectItem value="Rear End">Rear End</SelectItem>
                    <SelectItem value="Side">Side</SelectItem>
                    <SelectItem value="Hail">Hail</SelectItem>
                    <SelectItem value="Water/Flood">Water/Flood</SelectItem>
                    <SelectItem value="Fire">Fire</SelectItem>
                    <SelectItem value="Vandalism">Vandalism</SelectItem>
                    <SelectItem value="Theft">Theft</SelectItem>
                    <SelectItem value="Minor Dent/Scratches">Minor Dent/Scratches</SelectItem>
                    <SelectItem value="Normal Wear">Normal Wear</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Transmission</label>
                <Select value={filters.transmission} onValueChange={(value) => setFilters({...filters, transmission: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transmission" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transmissions</SelectItem>
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
                    <SelectItem value="all">All Fuel Types</SelectItem>
                    <SelectItem value="Gasoline">Gasoline</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="Electric">Electric</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="Flex Fuel">Flex Fuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Color</label>
                <Select value={filters.color} onValueChange={(value) => setFilters({...filters, color: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Colors</SelectItem>
                    <SelectItem value="Black">Black</SelectItem>
                    <SelectItem value="White">White</SelectItem>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Gray">Gray</SelectItem>
                    <SelectItem value="Red">Red</SelectItem>
                    <SelectItem value="Blue">Blue</SelectItem>
                    <SelectItem value="Brown">Brown</SelectItem>
                    <SelectItem value="Green">Green</SelectItem>
                    <SelectItem value="Yellow">Yellow</SelectItem>
                    <SelectItem value="Orange">Orange</SelectItem>
                    <SelectItem value="Purple">Purple</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setFilters({
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
                })}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
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
              Found {totalCount.toLocaleString()} active lots on {selectedPlatform.toUpperCase()}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => {
                  setPage(page - 1);
                  searchActiveLots();
                }}
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
                      <Badge variant="outline" className={`border-${getPlatformColor()}-600 text-${getPlatformColor()}-600`}>
                        {selectedPlatform.toUpperCase()}
                      </Badge>
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
          <h3 className="text-lg font-semibold mb-2">No active lots found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or switch platforms
          </p>
        </div>
      )}
    </div>
  );
}