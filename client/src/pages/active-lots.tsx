import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
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
  const [lots, setLots] = useState<AuctionLot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSite, setSelectedSite] = useState('copart');
  const [searchMake, setSearchMake] = useState('all');
  const [searchModel, setSearchModel] = useState('all');
  const [budgetPreset, setBudgetPreset] = useState('any');
  const [yearPreset, setYearPreset] = useState('any');
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedLot, setSelectedLot] = useState<AuctionLot | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [similarVehicles, setSimilarVehicles] = useState<AuctionLot[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

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
    setIsLoading(true);
    setError('');
    
    if (resetPage) {
      setCurrentPage(1);
    }

    try {
      const searchParams = new URLSearchParams({
        site: selectedSite === 'copart' ? '1' : '2',
        page: resetPage ? '1' : currentPage.toString(),
        size: '25'
      });

      // Add search parameters if provided
      if (searchMake && searchMake !== 'all') searchParams.append('make', searchMake);
      if (searchModel && searchModel !== 'all') searchParams.append('model', searchModel);
      
      // Add active filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '' && value !== 'all') {
          searchParams.append(key, value);
        }
      });

      const response = await fetch(`/api/cars?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setLots(data.data || []);
        setTotalResults(data.count || 0);
        setTotalPages(data.pages || 0);
        if (resetPage) setCurrentPage(1);
      } else {
        throw new Error(data.message || 'Search failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setLots([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data on component mount
  useEffect(() => {
    searchActiveLots(true);
  }, [selectedSite]);

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

  const analyzeLot = async (lot: AuctionLot) => {
    // Debug: Check user permissions and role
    console.log('User role:', user?.role);
    console.log('Has AI_ANALYSIS permission:', hasPermission('AI_ANALYSIS'));
    console.log('User object:', user);
    
    // Check if user has premium membership (Gold/Platinum)
    if (hasPermission('AI_ANALYSIS') && (user?.role === 'gold' || user?.role === 'platinum')) {
      // Redirect premium members to AuctionMind v2 with auto-analysis
      console.log('Redirecting premium user to AuctionMind v2');
      const auctionMindUrl = `/auction-mind-v2?lot_id=${lot.lot_id}&site=${lot.site}&auto_analyze=true`;
      window.location.href = auctionMindUrl;
      return;
    }
    
    console.log('Using basic AI analysis for non-premium user');

    // For non-premium users, use basic AI analysis
    setIsAnalyzing(true);
    setAnalysisResults(null);
    
    try {
      const response = await fetch('/api/analyze-lot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lot_id: lot.lot_id,
          vin: lot.vin,
          year: lot.year,
          make: lot.make,
          model: lot.model,
          series: lot.series,
          odometer: lot.odometer,
          current_bid: lot.current_bid,
          damage_pr: lot.damage_pr,
          damage_sec: lot.damage_sec,
          document: lot.document,
          location: lot.location,
          auction_date: lot.auction_date,
          status: lot.status,
          transmission: lot.transmission,
          fuel: lot.fuel,
          drive: lot.drive,
          color: lot.color,
          engine: lot.engine,
          images: lot.link_img_hd
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResults(data);
      } else {
        console.error('Analysis failed:', response.status);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const findSimilarVehicles = async (lot: AuctionLot) => {
    // Close any open dialogs
    setSelectedLot(null);
    
    // Update search parameters to find similar vehicles
    setSearchMake(lot.make);
    setSearchModel(lot.model);
    
    // Set year range (±2 years)
    const newFilters = {
      ...filters,
      year_from: (lot.year - 2).toString(),
      year_to: (lot.year + 2).toString()
    };
    setFilters(newFilters);
    
    // Trigger new search with similar vehicle parameters
    await searchActiveLots(true);
  };

  const LotDetailDialog = ({ lot }: { lot: AuctionLot }) => (
    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">
          {lot.year} {lot.make} {lot.model} {lot.series}
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
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

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={() => analyzeLot(lot)} 
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => findSimilarVehicles(lot)}
            disabled={isLoadingSimilar}
            className="flex items-center gap-2"
          >
            {isLoadingSimilar ? 'Finding...' : 'Find Similar'}
          </Button>
          {lot.link && (
            <Button variant="outline" asChild>
              <a href={lot.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on {selectedSite === 'copart' ? 'Copart' : 'IAAI'}
              </a>
            </Button>
          )}
        </div>

        {/* AI Analysis Results */}
        {analysisResults && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">AI Analysis Results</h3>
            <div className="space-y-2 text-sm">
              {analysisResults.marketValue && (
                <p><span className="font-medium">Market Value:</span> {analysisResults.marketValue}</p>
              )}
              {analysisResults.repairEstimate && (
                <p><span className="font-medium">Repair Estimate:</span> {analysisResults.repairEstimate}</p>
              )}
              {analysisResults.recommendation && (
                <p><span className="font-medium">Recommendation:</span> {analysisResults.recommendation}</p>
              )}
              {analysisResults.analysis && (
                <p className="mt-2">{analysisResults.analysis}</p>
              )}
            </div>
          </div>
        )}

        {/* Similar Vehicles */}
        {similarVehicles.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Similar Vehicles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {similarVehicles.map((similar) => (
                <Card key={similar.id} className="overflow-hidden">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                    {similar.link_img_hd && similar.link_img_hd.length > 0 ? (
                      <img
                        src={similar.link_img_hd[0]}
                        alt={`${similar.year} ${similar.make} ${similar.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h4 className="font-medium text-sm">{similar.year} {similar.make} {similar.model}</h4>
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mt-1">
                      <span>${similar.current_bid?.toLocaleString()}</span>
                      <span>{similar.odometer?.toLocaleString()} mi</span>
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">{similar.damage_pr}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );

  const getBrandColors = () => {
    if (selectedSite === 'copart') {
      return {
        primary: 'bg-blue-600',
        primaryHover: 'hover:bg-blue-700',
        accent: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-700',
        text: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-800',
        gradient: 'from-blue-500 to-blue-600'
      };
    } else {
      return {
        primary: 'bg-red-600',
        primaryHover: 'hover:bg-red-700',
        accent: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-700',
        text: 'text-red-600',
        badge: 'bg-red-100 text-red-800',
        gradient: 'from-red-500 to-red-600'
      };
    }
  };

  const brandColors = getBrandColors();

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card className={`${brandColors.border} border-2`}>
        <CardHeader className={`${brandColors.accent} border-b ${brandColors.border}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className={`text-3xl font-bold ${brandColors.text}`}>
                {selectedSite === 'copart' ? 'Copart' : 'IAAI'} Vehicle Search
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Find vehicles from {selectedSite === 'copart' ? 'Copart' : 'IAAI'} auctions
              </p>
            </div>
            
            {/* Platform Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setSelectedSite('copart')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedSite === 'copart'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
                }`}
              >
                Copart
              </button>
              <button
                onClick={() => setSelectedSite('iaai')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedSite === 'iaai'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-red-600'
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
                <label className="text-sm font-medium">Make</label>
                <Select value={searchMake} onValueChange={setSearchMake}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select make" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Make</SelectItem>
                    <SelectItem value="Acura">Acura</SelectItem>
                    <SelectItem value="Alfa Romeo">Alfa Romeo</SelectItem>
                    <SelectItem value="AM General">AM General</SelectItem>
                    <SelectItem value="Aston Martin">Aston Martin</SelectItem>
                    <SelectItem value="Audi">Audi</SelectItem>
                    <SelectItem value="Bentley">Bentley</SelectItem>
                    <SelectItem value="BMW">BMW</SelectItem>
                    <SelectItem value="Buick">Buick</SelectItem>
                    <SelectItem value="Cadillac">Cadillac</SelectItem>
                    <SelectItem value="Chevrolet">Chevrolet</SelectItem>
                    <SelectItem value="Chrysler">Chrysler</SelectItem>
                    <SelectItem value="Daewoo">Daewoo</SelectItem>
                    <SelectItem value="Daihatsu">Daihatsu</SelectItem>
                    <SelectItem value="Dodge">Dodge</SelectItem>
                    <SelectItem value="Eagle">Eagle</SelectItem>
                    <SelectItem value="Ferrari">Ferrari</SelectItem>
                    <SelectItem value="Fiat">Fiat</SelectItem>
                    <SelectItem value="Ford">Ford</SelectItem>
                    <SelectItem value="Freightliner">Freightliner</SelectItem>
                    <SelectItem value="Genesis">Genesis</SelectItem>
                    <SelectItem value="Geo">Geo</SelectItem>
                    <SelectItem value="GMC">GMC</SelectItem>
                    <SelectItem value="Honda">Honda</SelectItem>
                    <SelectItem value="Hummer">Hummer</SelectItem>
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
                    <SelectItem value="Maserati">Maserati</SelectItem>
                    <SelectItem value="Maybach">Maybach</SelectItem>
                    <SelectItem value="Mazda">Mazda</SelectItem>
                    <SelectItem value="McLaren">McLaren</SelectItem>
                    <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                    <SelectItem value="Mercury">Mercury</SelectItem>
                    <SelectItem value="MINI">MINI</SelectItem>
                    <SelectItem value="Mitsubishi">Mitsubishi</SelectItem>
                    <SelectItem value="Nissan">Nissan</SelectItem>
                    <SelectItem value="Oldsmobile">Oldsmobile</SelectItem>
                    <SelectItem value="Plymouth">Plymouth</SelectItem>
                    <SelectItem value="Pontiac">Pontiac</SelectItem>
                    <SelectItem value="Porsche">Porsche</SelectItem>
                    <SelectItem value="Ram">Ram</SelectItem>
                    <SelectItem value="Rolls-Royce">Rolls-Royce</SelectItem>
                    <SelectItem value="Saab">Saab</SelectItem>
                    <SelectItem value="Saturn">Saturn</SelectItem>
                    <SelectItem value="Scion">Scion</SelectItem>
                    <SelectItem value="Smart">Smart</SelectItem>
                    <SelectItem value="Subaru">Subaru</SelectItem>
                    <SelectItem value="Suzuki">Suzuki</SelectItem>
                    <SelectItem value="Tesla">Tesla</SelectItem>
                    <SelectItem value="Toyota">Toyota</SelectItem>
                    <SelectItem value="Volkswagen">Volkswagen</SelectItem>
                    <SelectItem value="Volvo">Volvo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Model (Optional)</label>
                <Select value={searchModel} onValueChange={setSearchModel}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="all">Any Model</SelectItem>
                    {searchMake === 'all' && (
                      <>
                        <SelectItem value="Camry">Camry</SelectItem>
                        <SelectItem value="Civic">Civic</SelectItem>
                        <SelectItem value="Accord">Accord</SelectItem>
                        <SelectItem value="F-150">F-150</SelectItem>
                        <SelectItem value="Silverado">Silverado</SelectItem>
                        <SelectItem value="Corolla">Corolla</SelectItem>
                        <SelectItem value="CR-V">CR-V</SelectItem>
                        <SelectItem value="Altima">Altima</SelectItem>
                        <SelectItem value="Escape">Escape</SelectItem>
                        <SelectItem value="Explorer">Explorer</SelectItem>
                      </>
                    )}
                    {searchMake === 'Toyota' && (
                      <>
                        <SelectItem value="4Runner">4Runner</SelectItem>
                        <SelectItem value="86">86</SelectItem>
                        <SelectItem value="Avalon">Avalon</SelectItem>
                        <SelectItem value="Camry">Camry</SelectItem>
                        <SelectItem value="C-HR">C-HR</SelectItem>
                        <SelectItem value="Corolla">Corolla</SelectItem>
                        <SelectItem value="Highlander">Highlander</SelectItem>
                        <SelectItem value="Land Cruiser">Land Cruiser</SelectItem>
                        <SelectItem value="Prius">Prius</SelectItem>
                        <SelectItem value="RAV4">RAV4</SelectItem>
                        <SelectItem value="Sequoia">Sequoia</SelectItem>
                        <SelectItem value="Sienna">Sienna</SelectItem>
                        <SelectItem value="Tacoma">Tacoma</SelectItem>
                        <SelectItem value="Tundra">Tundra</SelectItem>
                        <SelectItem value="Venza">Venza</SelectItem>
                        <SelectItem value="Yaris">Yaris</SelectItem>
                      </>
                    )}
                    {searchMake === 'Honda' && (
                      <>
                        <SelectItem value="Accord">Accord</SelectItem>
                        <SelectItem value="Civic">Civic</SelectItem>
                        <SelectItem value="CR-V">CR-V</SelectItem>
                        <SelectItem value="Fit">Fit</SelectItem>
                        <SelectItem value="HR-V">HR-V</SelectItem>
                        <SelectItem value="Insight">Insight</SelectItem>
                        <SelectItem value="Odyssey">Odyssey</SelectItem>
                        <SelectItem value="Passport">Passport</SelectItem>
                        <SelectItem value="Pilot">Pilot</SelectItem>
                        <SelectItem value="Ridgeline">Ridgeline</SelectItem>
                      </>
                    )}
                    {searchMake === 'Ford' && (
                      <>
                        <SelectItem value="Bronco">Bronco</SelectItem>
                        <SelectItem value="EcoSport">EcoSport</SelectItem>
                        <SelectItem value="Edge">Edge</SelectItem>
                        <SelectItem value="Escape">Escape</SelectItem>
                        <SelectItem value="Expedition">Expedition</SelectItem>
                        <SelectItem value="Explorer">Explorer</SelectItem>
                        <SelectItem value="F-150">F-150</SelectItem>
                        <SelectItem value="F-250">F-250</SelectItem>
                        <SelectItem value="F-350">F-350</SelectItem>
                        <SelectItem value="Fiesta">Fiesta</SelectItem>
                        <SelectItem value="Focus">Focus</SelectItem>
                        <SelectItem value="Fusion">Fusion</SelectItem>
                        <SelectItem value="Mustang">Mustang</SelectItem>
                        <SelectItem value="Ranger">Ranger</SelectItem>
                        <SelectItem value="Taurus">Taurus</SelectItem>
                        <SelectItem value="Transit">Transit</SelectItem>
                      </>
                    )}
                    {searchMake === 'Chevrolet' && (
                      <>
                        <SelectItem value="Blazer">Blazer</SelectItem>
                        <SelectItem value="Camaro">Camaro</SelectItem>
                        <SelectItem value="Colorado">Colorado</SelectItem>
                        <SelectItem value="Corvette">Corvette</SelectItem>
                        <SelectItem value="Cruze">Cruze</SelectItem>
                        <SelectItem value="Equinox">Equinox</SelectItem>
                        <SelectItem value="Impala">Impala</SelectItem>
                        <SelectItem value="Malibu">Malibu</SelectItem>
                        <SelectItem value="Silverado">Silverado</SelectItem>
                        <SelectItem value="Sonic">Sonic</SelectItem>
                        <SelectItem value="Spark">Spark</SelectItem>
                        <SelectItem value="Suburban">Suburban</SelectItem>
                        <SelectItem value="Tahoe">Tahoe</SelectItem>
                        <SelectItem value="Traverse">Traverse</SelectItem>
                        <SelectItem value="Trax">Trax</SelectItem>
                      </>
                    )}
                    {searchMake === 'BMW' && (
                      <>
                        <SelectItem value="1 Series">1 Series</SelectItem>
                        <SelectItem value="2 Series">2 Series</SelectItem>
                        <SelectItem value="3 Series">3 Series</SelectItem>
                        <SelectItem value="4 Series">4 Series</SelectItem>
                        <SelectItem value="5 Series">5 Series</SelectItem>
                        <SelectItem value="6 Series">6 Series</SelectItem>
                        <SelectItem value="7 Series">7 Series</SelectItem>
                        <SelectItem value="8 Series">8 Series</SelectItem>
                        <SelectItem value="X1">X1</SelectItem>
                        <SelectItem value="X2">X2</SelectItem>
                        <SelectItem value="X3">X3</SelectItem>
                        <SelectItem value="X4">X4</SelectItem>
                        <SelectItem value="X5">X5</SelectItem>
                        <SelectItem value="X6">X6</SelectItem>
                        <SelectItem value="X7">X7</SelectItem>
                        <SelectItem value="Z4">Z4</SelectItem>
                      </>
                    )}
                    {searchMake === 'Mercedes-Benz' && (
                      <>
                        <SelectItem value="A-Class">A-Class</SelectItem>
                        <SelectItem value="C-Class">C-Class</SelectItem>
                        <SelectItem value="CLA">CLA</SelectItem>
                        <SelectItem value="CLS">CLS</SelectItem>
                        <SelectItem value="E-Class">E-Class</SelectItem>
                        <SelectItem value="G-Class">G-Class</SelectItem>
                        <SelectItem value="GLA">GLA</SelectItem>
                        <SelectItem value="GLB">GLB</SelectItem>
                        <SelectItem value="GLC">GLC</SelectItem>
                        <SelectItem value="GLE">GLE</SelectItem>
                        <SelectItem value="GLS">GLS</SelectItem>
                        <SelectItem value="S-Class">S-Class</SelectItem>
                        <SelectItem value="SL">SL</SelectItem>
                        <SelectItem value="SLC">SLC</SelectItem>
                      </>
                    )}
                    {searchMake === 'Nissan' && (
                      <>
                        <SelectItem value="370Z">370Z</SelectItem>
                        <SelectItem value="Altima">Altima</SelectItem>
                        <SelectItem value="Armada">Armada</SelectItem>
                        <SelectItem value="Frontier">Frontier</SelectItem>
                        <SelectItem value="GT-R">GT-R</SelectItem>
                        <SelectItem value="Kicks">Kicks</SelectItem>
                        <SelectItem value="Leaf">Leaf</SelectItem>
                        <SelectItem value="Maxima">Maxima</SelectItem>
                        <SelectItem value="Murano">Murano</SelectItem>
                        <SelectItem value="NV200">NV200</SelectItem>
                        <SelectItem value="Pathfinder">Pathfinder</SelectItem>
                        <SelectItem value="Rogue">Rogue</SelectItem>
                        <SelectItem value="Sentra">Sentra</SelectItem>
                        <SelectItem value="Titan">Titan</SelectItem>
                        <SelectItem value="Versa">Versa</SelectItem>
                      </>
                    )}
                    {searchMake === 'Hyundai' && (
                      <>
                        <SelectItem value="Accent">Accent</SelectItem>
                        <SelectItem value="Elantra">Elantra</SelectItem>
                        <SelectItem value="Genesis">Genesis</SelectItem>
                        <SelectItem value="Ioniq">Ioniq</SelectItem>
                        <SelectItem value="Kona">Kona</SelectItem>
                        <SelectItem value="Nexo">Nexo</SelectItem>
                        <SelectItem value="Palisade">Palisade</SelectItem>
                        <SelectItem value="Santa Fe">Santa Fe</SelectItem>
                        <SelectItem value="Sonata">Sonata</SelectItem>
                        <SelectItem value="Tucson">Tucson</SelectItem>
                        <SelectItem value="Veloster">Veloster</SelectItem>
                        <SelectItem value="Venue">Venue</SelectItem>
                      </>
                    )}
                    {searchMake === 'Audi' && (
                      <>
                        <SelectItem value="A3">A3</SelectItem>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="A5">A5</SelectItem>
                        <SelectItem value="A6">A6</SelectItem>
                        <SelectItem value="A7">A7</SelectItem>
                        <SelectItem value="A8">A8</SelectItem>
                        <SelectItem value="Q3">Q3</SelectItem>
                        <SelectItem value="Q5">Q5</SelectItem>
                        <SelectItem value="Q7">Q7</SelectItem>
                        <SelectItem value="Q8">Q8</SelectItem>
                        <SelectItem value="R8">R8</SelectItem>
                        <SelectItem value="TT">TT</SelectItem>
                      </>
                    )}
                    {searchMake === 'Jeep' && (
                      <>
                        <SelectItem value="Cherokee">Cherokee</SelectItem>
                        <SelectItem value="Compass">Compass</SelectItem>
                        <SelectItem value="Gladiator">Gladiator</SelectItem>
                        <SelectItem value="Grand Cherokee">Grand Cherokee</SelectItem>
                        <SelectItem value="Patriot">Patriot</SelectItem>
                        <SelectItem value="Renegade">Renegade</SelectItem>
                        <SelectItem value="Wrangler">Wrangler</SelectItem>
                      </>
                    )}
                    {searchMake === 'Dodge' && (
                      <>
                        <SelectItem value="Challenger">Challenger</SelectItem>
                        <SelectItem value="Charger">Charger</SelectItem>
                        <SelectItem value="Dart">Dart</SelectItem>
                        <SelectItem value="Durango">Durango</SelectItem>
                        <SelectItem value="Grand Caravan">Grand Caravan</SelectItem>
                        <SelectItem value="Journey">Journey</SelectItem>
                        <SelectItem value="Ram 1500">Ram 1500</SelectItem>
                        <SelectItem value="Viper">Viper</SelectItem>
                      </>
                    )}
                    {searchMake === 'Subaru' && (
                      <>
                        <SelectItem value="Ascent">Ascent</SelectItem>
                        <SelectItem value="BRZ">BRZ</SelectItem>
                        <SelectItem value="Crosstrek">Crosstrek</SelectItem>
                        <SelectItem value="Forester">Forester</SelectItem>
                        <SelectItem value="Impreza">Impreza</SelectItem>
                        <SelectItem value="Legacy">Legacy</SelectItem>
                        <SelectItem value="Outback">Outback</SelectItem>
                        <SelectItem value="WRX">WRX</SelectItem>
                      </>
                    )}
                    {searchMake === 'Lexus' && (
                      <>
                        <SelectItem value="ES">ES</SelectItem>
                        <SelectItem value="GS">GS</SelectItem>
                        <SelectItem value="GX">GX</SelectItem>
                        <SelectItem value="IS">IS</SelectItem>
                        <SelectItem value="LC">LC</SelectItem>
                        <SelectItem value="LS">LS</SelectItem>
                        <SelectItem value="LX">LX</SelectItem>
                        <SelectItem value="NX">NX</SelectItem>
                        <SelectItem value="RC">RC</SelectItem>
                        <SelectItem value="RX">RX</SelectItem>
                        <SelectItem value="UX">UX</SelectItem>
                      </>
                    )}
                    {searchMake === 'Acura' && (
                      <>
                        <SelectItem value="ILX">ILX</SelectItem>
                        <SelectItem value="MDX">MDX</SelectItem>
                        <SelectItem value="NSX">NSX</SelectItem>
                        <SelectItem value="RDX">RDX</SelectItem>
                        <SelectItem value="TLX">TLX</SelectItem>
                        <SelectItem value="TSX">TSX</SelectItem>
                      </>
                    )}
                    {searchMake === 'Infiniti' && (
                      <>
                        <SelectItem value="Q50">Q50</SelectItem>
                        <SelectItem value="Q60">Q60</SelectItem>
                        <SelectItem value="Q70">Q70</SelectItem>
                        <SelectItem value="QX50">QX50</SelectItem>
                        <SelectItem value="QX60">QX60</SelectItem>
                        <SelectItem value="QX80">QX80</SelectItem>
                      </>
                    )}
                    {searchMake === 'Tesla' && (
                      <>
                        <SelectItem value="Model 3">Model 3</SelectItem>
                        <SelectItem value="Model S">Model S</SelectItem>
                        <SelectItem value="Model X">Model X</SelectItem>
                        <SelectItem value="Model Y">Model Y</SelectItem>
                        <SelectItem value="Cybertruck">Cybertruck</SelectItem>
                        <SelectItem value="Roadster">Roadster</SelectItem>
                      </>
                    )}
                    {searchMake === 'Volkswagen' && (
                      <>
                        <SelectItem value="Atlas">Atlas</SelectItem>
                        <SelectItem value="Beetle">Beetle</SelectItem>
                        <SelectItem value="Golf">Golf</SelectItem>
                        <SelectItem value="Jetta">Jetta</SelectItem>
                        <SelectItem value="Passat">Passat</SelectItem>
                        <SelectItem value="Tiguan">Tiguan</SelectItem>
                        <SelectItem value="Touareg">Touareg</SelectItem>
                      </>
                    )}
                    {searchMake === 'Mazda' && (
                      <>
                        <SelectItem value="CX-3">CX-3</SelectItem>
                        <SelectItem value="CX-30">CX-30</SelectItem>
                        <SelectItem value="CX-5">CX-5</SelectItem>
                        <SelectItem value="CX-9">CX-9</SelectItem>
                        <SelectItem value="Mazda3">Mazda3</SelectItem>
                        <SelectItem value="Mazda6">Mazda6</SelectItem>
                        <SelectItem value="MX-5 Miata">MX-5 Miata</SelectItem>
                      </>
                    )}
                    {searchMake === 'Kia' && (
                      <>
                        <SelectItem value="Forte">Forte</SelectItem>
                        <SelectItem value="K5">K5</SelectItem>
                        <SelectItem value="Niro">Niro</SelectItem>
                        <SelectItem value="Optima">Optima</SelectItem>
                        <SelectItem value="Rio">Rio</SelectItem>
                        <SelectItem value="Sedona">Sedona</SelectItem>
                        <SelectItem value="Sorento">Sorento</SelectItem>
                        <SelectItem value="Soul">Soul</SelectItem>
                        <SelectItem value="Sportage">Sportage</SelectItem>
                        <SelectItem value="Stinger">Stinger</SelectItem>
                        <SelectItem value="Telluride">Telluride</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
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
                    <SelectItem value="Starts">Starts</SelectItem>
                    <SelectItem value="Stationary">Stationary</SelectItem>
                    <SelectItem value="Can't test">Can't test</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter - Temporarily Disabled */}
              <div className="space-y-2 opacity-50">
                <label className="text-sm font-medium text-muted-foreground">Location (Coming Soon)</label>
                <Select disabled value="all">
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Location filtering coming soon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Location filtering coming soon</SelectItem>
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
                    <SelectItem value="All Over">All Over</SelectItem>
                    <SelectItem value="Hail">Hail</SelectItem>
                    <SelectItem value="Minor Dent/Scratches">Minor Dent/Scratches</SelectItem>
                    <SelectItem value="Water/Flood">Water/Flood</SelectItem>
                    <SelectItem value="Burn">Fire/Burn</SelectItem>
                    <SelectItem value="Vandalism">Vandalism</SelectItem>
                    <SelectItem value="Theft">Theft</SelectItem>
                    <SelectItem value="Top/Roof">Top/Roof</SelectItem>
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
                    <SelectItem value="Salvage">Salvage</SelectItem>
                    <SelectItem value="Clean">Clean</SelectItem>
                    <SelectItem value="Non repairable">Non repairable</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Search Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={clearAllFilters} 
              variant="outline" 
              className={`flex items-center gap-2 border-2 ${brandColors.border} ${brandColors.text} ${brandColors.primaryHover}`}
            >
              <RefreshCw className="h-4 w-4" />
              Clear All
            </Button>
            <Button 
              onClick={() => searchActiveLots(true)} 
              disabled={isLoading} 
              className={`flex items-center gap-2 ${brandColors.primary} ${brandColors.primaryHover} text-white`}
            >
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
                    <Badge className={`${brandColors.badge} font-medium`}>
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

                    <div className="flex flex-col gap-2 mt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full text-xs"
                              onClick={() => setSelectedLot(lot)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Details
                            </Button>
                          </DialogTrigger>
                          {selectedLot && <LotDetailDialog lot={selectedLot} />}
                        </Dialog>
                        
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLot(lot);
                            analyzeLot(lot);
                          }}
                          disabled={isAnalyzing}
                          className={`w-full text-xs ${brandColors.primary} ${brandColors.primaryHover} text-white`}
                        >
                          {isAnalyzing && selectedLot?.id === lot.id ? 'Analyzing...' : 'AI Analysis'}
                        </Button>
                      </div>
                      
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          findSimilarVehicles(lot);
                        }}
                        disabled={isLoadingSimilar}
                        className={`w-full text-xs border-2 ${brandColors.border} ${brandColors.text} ${brandColors.primaryHover}`}
                      >
                        {isLoadingSimilar ? 'Finding...' : 'Similar Vehicles'}
                      </Button>
                      
                      {lot.link && (
                        <Button size="sm" asChild className="w-full text-xs">
                          <a href={lot.link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
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