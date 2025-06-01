import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
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
  Target,
  ChevronDown,
  ChevronRight,
  Zap
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
  engine?: string;
  document?: string;
  odobrand?: string;
  auction_date?: string;
  location?: string;
  damage_pr?: string;
  title?: string;
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

// Make-Model mapping data from your complete dataset
const makeModelData: { [key: string]: string[] } = {
  "Acura": ["CSX", "ILX", "Integra", "MDX", "NSX", "RDX", "RL", "RLX", "TL", "TLX", "TSX", "ZDX"],
  "Alfa Romeo": ["159", "4C", "Giulia", "Giulietta", "Mito", "Stelvio", "Tonale"],
  "Aston Martin": ["DB11", "DB9", "DBS", "DBX", "DBX707", "One-77", "Rapide", "V12 Vantage", "V8 Vantage", "Vanquish", "Vantage", "Virage"],
  "Audi": ["A1", "A3", "A3 e-tron", "A3 Quattro", "A3 Sportback e-tron", "A4", "A4 allroad", "A4 Quattro", "A5", "A5 Quattro", "A5 Sportback", "A6", "A6 allroad", "A6 Quattro", "A7", "A7 Quattro", "A7 Sportback", "A8", "A8 Quattro", "allroad", "e-tron GT", "e-tron", "e-tron S", "e-tron S Sportback", "e-tron Sportback", "Q2", "Q2 Quattro", "Q3", "Q3 Quattro", "Q4 e-tron", "Q4 e-tron Sportback", "Q5", "Q5 PHEV", "Q5 Sportback", "Q7", "Q8", "R8", "RS e-tron GT", "RS Q3", "RS Q8", "RS3", "RS5", "RS5 Sportback", "RS6", "RS6 Avant", "RS7", "RS7 Sportback", "S3", "S4", "S5", "S5 Sportback", "S6", "S7", "S7 Sportback", "S8", "SQ5", "SQ5 Sportback", "SQ7", "SQ8", "TT", "TT Quattro", "TT RS", "TT RS Quattro", "TTS", "TTS Quattro"],
  "BMW": ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "8 Series", "ActiveHybrid 3", "ActiveHybrid 5", "ActiveHybrid 7", "Alpina B6 Gran Coupe", "Alpina B6 xDrive Gran Coupe", "Alpina B7", "Alpina B7 xDrive", "Alpina B7L", "Alpina B7L xDrive", "Alpina B8 Gran Coupe", "Alpina XB7", "i3", "i3s", "i4", "i7", "i8", "iX", "iX xDrive40", "iX xDrive50", "iX3", "M135i", "M140i", "M2", "M235i", "M235i xDrive", "M235i xDrive Gran Coupe", "M240i", "M240i xDrive", "M3", "M340i", "M340i xDrive", "M4", "M440i", "M440i Gran Coupe", "M440i xDrive", "M440i xDrive Gran Coupe", "M5", "M550i xDrive", "M6", "M6 Gran Coupe", "M760i xDrive", "M760Li xDrive", "M8", "M8 Gran Coupe", "M850i xDrive", "M850i xDrive Gran Coupe", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4"],
  "Bentley": ["Azure", "Bentayga", "Continental", "Flying Spur", "Mulsanne"],
  "Bugatti": ["Chiron", "Divo", "Veyron 16.4"],
  "Buick": ["Allure", "Cascada", "Enclave", "Enclave Avenir", "Encore", "Encore GX", "Envision", "LaCrosse", "Lucerne", "Regal", "Regal Sportback", "Regal TourX", "Verano"],
  "Cadillac": ["ATS", "CT4", "CT5", "CT6", "CTS", "DTS", "ELR", "Escalade", "Escalade ESV", "Escalade EXT", "LYRIQ", "SRX", "STS", "XT4", "XT5", "XT6", "XTS"],
  "Chevrolet": ["Avalanche", "Aveo", "Aveo5", "Beat", "Blazer", "Bolt EUV", "Bolt EV", "Camaro", "Caprice", "Captiva", "Captiva Sport", "Cavalier", "Chevy", "Cheyenne", "City Express", "Cobalt", "Colorado", "Corvette", "Cruze", "Cruze Limited", "Cruze NG", "Equinox", "Express 1500", "Express 2500", "Express 3500", "Express 4500", "Express Cargo", "Express Pasajeros", "Groove", "HHR", "Impala", "Impala Limited", "LCF 3500", "LCF 3500HD", "LCF 4500", "LCF 4500HD", "LCF 4500XD", "LCF 5500HD", "LCF 5500XD", "LCF 6500XD", "Malibu", "Malibu Limited", "Matiz", "Nuevo Aveo", "Onix", "Optra", "Orlando", "S10", "Silverado", "Sonic", "Spark", "Spark Classic", "Spark EV", "SS", "Suburban", "Suburban 1500", "Suburban 2500", "Suburban 3500 HD", "Tahoe", "Tornado", "Tornado Van", "Tracker", "Trailblazer", "Traverse", "Trax", "Volt", "W4500 Tiltmaster", "W5500 Tiltmaster"],
  "Chrysler": ["200", "300", "Cirrus", "Grand Caravan", "Pacifica", "PT Cruiser", "Sebring", "Town & Country", "Voyager"],
  "Dodge": ["Atos", "Attitude", "Avenger", "Caliber", "Challenger", "Charger", "Dakota", "Dart", "Durango", "H100", "H100 Van", "Hornet", "i10", "Journey", "Neon", "Nitro", "Ram 1500", "Ram 2500", "Ram 3500", "Ram 4000", "Ram 4500", "Ram 5500", "Viper", "Vision"],
  "Ferrari": ["296 GTB", "458 Italia", "458 Speciale", "458 Spider", "488 GTB", "488 Pista", "488 Pista Spider", "488 Spider", "599 GTB", "599 GTO", "612 Scaglietti", "812 GTS", "812 Superfast", "California", "California T", "F12 Berlinetta", "F12tdf", "F8 Spider", "F8 Tributo", "FF", "GTC4Lusso", "GTC4Lusso T", "LaFerrari", "Portofino", "Portofino M", "Roma", "SF90 Spider", "SF90 Stradale"],
  "Fiat": ["124 Spider", "500", "500C", "500E", "500L", "500X", "Albea", "Argo", "Ducato", "JOLLY", "Linea", "Mobi", "Palio", "Panda", "Punto", "Strada", "Uno"],
  "Fisker": ["Karma", "OCEAN"],
  "Ford": ["Bronco", "Bronco Sport", "C-Max", "Courier", "Crown Victoria", "E-150", "E-250", "E-350 Super Duty", "E-450 Super Duty", "E-Transit", "Econoline Van", "Econoline Wagon", "EcoSport", "Edge", "Escape", "Expedition", "Explorer", "Explorer Sport Trac", "F-150", "F-150 Lightning", "F-250", "F-250 Super Duty", "F-350", "F-350 Super Duty", "F-450", "F-450 Super Duty", "F-550 Super Duty", "F-600 Super Duty", "F53", "F59", "F650", "F750", "Fiesta", "Fiesta Ikon", "Figo", "Flex", "Focus", "Fusion", "GT", "LCF", "Lobo", "Maverick", "Mustang", "Mustang Mach-E", "Police Interceptor Sedan", "Police Interceptor Utility", "Police Responder Hybrid", "Ranger", "SHELBY", "Special Service Police Sedan", "SSV Plug-In Hybrid", "Taurus", "Transit", "Transit Connect", "Transit Courier", "Transit Custom", "Transit-150", "Transit-250", "Transit-350", "Transit-350 HD"],
  "GMC": ["Acadia", "Acadia Limited", "Canyon", "Hummer EV", "Savana", "Savana 1500", "Savana 2500", "Savana 3500", "Savana 4500", "Sierra", "Sierra 1500", "Sierra 1500 Limited", "Sierra 2500 HD", "Sierra 3500 HD", "Terrain", "W4500 Forward", "W5500 Forward", "Yukon", "Yukon XL", "Yukon XL 1500", "Yukon XL 2500"],
  "Genesis": ["G70", "G80", "G90", "GV60", "GV70", "GV80"],
  "Honda": ["Accord", "Accord Crosstour", "BR-V", "City", "Civic", "Clarity", "Clarity Plug-In Hybrid", "CR-V", "CR-Z", "Crosstour", "Element", "Fit", "HR-V", "Insight", "Odyssey", "Passport", "Pilot", "Ridgeline"],
  "Hummer": ["H3", "H3T"],
  "Hyundai": ["Accent", "Azera", "Creta", "Creta Grand", "Elantra", "Elantra Coupe", "Elantra GT", "Elantra N", "Entourage", "Equus", "EX6", "EX8", "Genesis", "Genesis Coupe", "Grand i10", "H200", "H300", "H400", "H500", "HD55", "HD65", "HD78", "Ioniq", "Ioniq 5", "ix35", "Kona", "Kona Electric", "Kona N", "Nexo", "Palisade", "Santa Cruz", "Santa Fe", "Santa Fe XL", "Sonata", "Starex", "Tucson", "Veloster", "Veloster N", "Venue", "Veracruz"],
  "Infiniti": ["EX35", "EX37", "FX35", "FX37", "FX50", "G25", "G35", "G37", "JX35", "M35", "M35h", "M37", "M45", "M56", "Q40", "Q50", "Q60", "Q70", "Q70L", "QX30", "QX50", "QX55", "QX56", "QX60", "QX70", "QX80"],
  "Isuzu": ["ELF 100", "ELF 200", "ELF 300", "ELF 400", "ELF 500", "ELF 600", "ELF 600-BUS", "Forward 1100", "Forward 1400", "Forward 800", "FTR", "FVR", "FXR", "NPR", "NPR-HD", "NPR-XD", "NQR", "NRR", "Reach"],
  "Jaguar": ["E-Pace", "F-Pace", "F-Type", "I-Pace", "XE", "XF", "XFR", "XFR-S", "XJ", "XJR", "XJR575", "XK", "XKR", "XKR-S"],
  "Jeep": ["Cherokee", "Commander", "Compass", "Gladiator", "Grand Cherokee", "Grand Cherokee L", "Grand Cherokee WK", "Grand Wagoneer", "Liberty", "Patriot", "Renegade", "Wagoneer", "Wrangler", "Wrangler JK"],
  "Kia": ["Borrego", "Cadenza", "Carnival", "EV6", "Forte", "Forte Koup", "Forte5", "K5", "K900", "Magentis", "Niro", "Niro EV", "Optima", "Rio", "Rio5", "Rondo", "Sedona", "Seltos", "Sorento", "Soul", "Soul EV", "Sportage", "Stinger", "Telluride"],
  "Lamborghini": ["Aventador", "Centenario", "Gallardo", "Huracan", "Murcielago", "Urus", "Veneno"],
  "Land Rover": ["Defender", "Defender 110", "Defender 130", "Defender 90", "Discovery", "Discovery Sport", "LR2", "LR4", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"],
  "Lexus": ["CT200", "CT200h", "ES250", "ES300h", "ES350", "GS F", "GS200t", "GS300", "GS350", "GS450h", "GS460", "GX460", "HS250h", "IS F", "IS200t", "IS250", "IS300", "IS350", "IS500", "LC500", "LC500h", "LFA", "LS460", "LS500", "LS500h", "LS600h", "LX570", "LX600", "NX200t", "NX250", "NX300", "NX300h", "NX350", "NX350h", "NX450h+", "RC F", "RC200t", "RC300", "RC350", "RX350", "RX350L", "RX450h", "RX450hL", "SC430", "UX200", "UX250h"],
  "Lincoln": ["Aviator", "Blackwood", "Continental", "Corsair", "LS", "Mark LT", "MKC", "MKS", "MKT", "MKX", "MKZ", "Navigator", "Navigator L", "Nautilus", "Town Car", "Zephyr"],
  "Lotus": ["Elise", "Emira", "Evora", "Exige"],
  "Lucid": ["Air"],
  "Maserati": ["GranTurismo", "Levante", "Quattroporte"],
  "Mazda": ["CX-3", "CX-30", "CX-5", "CX-7", "CX-9", "Mazda2", "Mazda3", "Mazda5", "Mazda6", "MX-5 Miata", "RX-8", "Tribute"],
  "McLaren": ["540C", "570GT", "570S", "600LT", "650S", "675LT", "720S", "765LT", "Artura", "GT", "MP4-12C", "P1"],
  "Mercedes-Benz": ["A-Class", "AMG GT", "B-Class", "C-Class", "CL-Class", "CLA", "CLK", "CLS", "E-Class", "G-Class", "GLA", "GLB", "GLC", "GLE", "GLK", "GLS", "ML", "R-Class", "S-Class", "SL", "SLC", "SLK", "SLS AMG", "Sprinter"],
  "MINI": ["Clubman", "Convertible", "Countryman", "Hardtop", "Paceman", "Roadster"],
  "Mitsubishi": ["3000GT", "Eclipse", "Eclipse Cross", "Endeavor", "Galant", "i-MiEV", "Lancer", "Mirage", "Montero", "Montero Sport", "Outlander", "Outlander Sport", "Raider"],
  "Nissan": ["240SX", "350Z", "370Z", "Altima", "Armada", "Cube", "Frontier", "GT-R", "Juke", "Kicks", "Leaf", "Maxima", "Murano", "NV200", "NV1500", "NV2500 HD", "NV3500 HD", "Pathfinder", "Quest", "Rogue", "Rogue Select", "Sentra", "Titan", "Titan XD", "Versa", "Xterra"],
  "Polestar": ["1", "2"],
  "Porsche": ["718 Boxster", "718 Cayman", "911", "Cayenne", "Cayman", "Macan", "Panamera", "Taycan"],
  "Ram": ["1500", "2500", "3500", "4500", "5500", "C/V", "ProMaster", "ProMaster City"],
  "Rivian": ["R1S", "R1T"],
  "Rolls-Royce": ["Cullinan", "Dawn", "Ghost", "Phantom", "Wraith"],
  "Subaru": ["Ascent", "B9 Tribeca", "Baja", "BRZ", "Crosstrek", "Forester", "Impreza", "Legacy", "Outback", "SVX", "Tribeca", "WRX", "WRX STI"],
  "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Roadster"],
  "Toyota": ["4Runner", "Avalon", "Avanza", "C-HR", "Camry", "Corolla", "FJ Cruiser", "Highlander", "Land Cruiser", "Matrix", "Prius", "Prius c", "Prius v", "RAV4", "Sequoia", "Sienna", "Tacoma", "Tundra", "Venza", "Yaris"],
  "Volkswagen": ["Arteon", "Atlas", "Atlas Cross Sport", "Beetle", "CC", "Eos", "Golf", "Golf R", "GTI", "Jetta", "Passat", "Routan", "Tiguan", "Touareg"],
  "Volvo": ["C30", "C70", "S40", "S60", "S80", "S90", "V40", "V50", "V60", "V70", "V90", "XC40", "XC60", "XC70", "XC90"]
};

export default function ActiveLotsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
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
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRowExpansion = (lotId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(lotId)) {
      newExpanded.delete(lotId);
    } else {
      newExpanded.add(lotId);
    }
    setExpandedRows(newExpanded);
  };

  const analyzeLot = (lot: AuctionLot) => {
    // Placeholder for AI analysis functionality
    console.log('Analyzing lot:', lot);
    // This would trigger an AI analysis of the vehicle
  };

  const handleAnalyzeClick = (lot: AuctionLot) => {
    // This would normally check user tier from authentication context
    // For demonstration, let's test both tiers - change this value to test
    const userTier = 'Gold'; // This should come from user context
    
    if (userTier === 'Platinum') {
      // Navigate to AuctionMind V2 with lot ID pre-populated
      setLocation(`/auction-mind-v2?lotId=${lot.lot_id}`);
    } else if (userTier === 'Gold') {
      // Navigate to Live Lot Analysis with lot ID pre-populated
      setLocation(`/live-lot-analysis?lotId=${lot.lot_id}`);
    } else {
      // Basic tier users might see a upgrade prompt
      console.log('Upgrade required for lot analysis');
    }
  };

  const getTimeUntilAuction = (auctionDate: string | undefined) => {
    if (!auctionDate) return 'Unknown';
    
    const auction = new Date(auctionDate);
    const now = new Date();
    const diffTime = auction.getTime() - now.getTime();
    
    if (diffTime < 0) return 'Ended';
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffDays > 1) return `${diffDays}D`;
    if (diffHours > 1) return `${diffHours}H`;
    return `${Math.ceil(diffTime / (1000 * 60))}min`;
  };

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

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-800 text-white">
                      <th className="text-left p-3 font-medium text-sm">Image</th>
                      <th className="text-left p-3 font-medium text-sm">Lot Info</th>
                      <th className="text-left p-3 font-medium text-sm">Vehicle Info</th>
                      <th className="text-left p-3 font-medium text-sm">Condition</th>
                      <th className="text-left p-3 font-medium text-sm">Sale Info</th>
                      <th className="text-left p-3 font-medium text-sm">Bids</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lots.map((lot, index) => (
                      <tr 
                        key={`${lot.lot_id}-${index}`}
                        className="border-b hover:bg-slate-50 transition-colors"
                      >
                        {/* Image */}
                        <td className="p-3">
                          <div className="w-20 h-16 bg-slate-100 rounded overflow-hidden">
                            {lot.link_img_hd && lot.link_img_hd.length > 0 ? (
                              <img
                                src={lot.link_img_hd[0]}
                                alt={`${lot.year} ${lot.make} ${lot.model}`}
                                className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                                onClick={() => window.open(lot.link_img_hd[0], '_blank')}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Car className="h-6 w-6 text-slate-400" />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Lot Info */}
                        <td className="p-3">
                          <div>
                            <div className="font-semibold text-blue-600 text-lg mb-1">
                              {lot.year} {lot.make} {lot.model}
                            </div>
                            <div className="text-sm text-slate-600 mb-1">
                              Lot # {lot.lot_id}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="text-xs h-6 px-2">
                                Watch
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs h-6 px-2"
                                onClick={() => analyzeLot(lot)}
                              >
                                <Zap className="h-3 w-3 mr-1" />
                                Analyze
                              </Button>
                            </div>
                          </div>
                        </td>

                        {/* Vehicle Info */}
                        <td className="p-3">
                          <div className="text-sm space-y-1">
                            <div>
                              <span className="font-medium">Odometer</span>
                              <br />
                              <span>{lot.odometer?.toLocaleString() || 'Unknown'}</span>
                              <br />
                              <span className="text-slate-500">(ACTUAL)</span>
                            </div>
                            {lot.engine && (
                              <div className="mt-2">
                                <span className="font-medium">Engine</span>
                                <br />
                                <span className="text-slate-600">{lot.engine}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Condition */}
                        <td className="p-3">
                          <div className="text-sm space-y-1">
                            <div>
                              <span className="font-medium">{lot.vehicle_title || 'Clean Title'} (DV - CA)</span>
                            </div>
                            <div>
                              <span className="font-medium">Damage</span>
                              <br />
                              <span className="text-slate-600">{lot.vehicle_damage}</span>
                            </div>
                            <div>
                              <span className="font-medium">Keys available</span>
                            </div>
                          </div>
                        </td>

                        {/* Sale Info */}
                        <td className="p-3">
                          <div className="text-sm">
                            <div className="font-semibold text-blue-600 mb-1">
                              {(lot as any).location || lot.auction_location || 'Unknown Location'}
                            </div>
                            <div className="text-slate-600 mb-1">
                              Item# {lot.lot_id}
                            </div>
                            <div className="text-red-600 font-medium">
                              Auction on {formatDate((lot as any).auction_date || lot.sale_date)}
                            </div>
                          </div>
                        </td>

                        {/* Bids */}
                        <td className="p-3">
                          <div className="text-right">
                            <div className="text-sm text-slate-600 mb-1">
                              Current bid:
                            </div>
                            <div className="text-xl font-bold text-green-600 mb-2">
                              {formatPrice(lot.current_bid || 0)} USD
                            </div>
                            <div className="space-y-1">
                              <Button 
                                size="sm" 
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-7"
                                onClick={() => handleAnalyzeClick(lot)}
                              >
                                Analyze
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full text-xs h-7"
                                onClick={() => setSelectedLot(lot)}
                              >
                                Details
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
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

      {/* Vehicle Details Dialog */}
      {selectedLot && (
        <Dialog open={true} onOpenChange={() => setSelectedLot(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedLot.year} {selectedLot.make} {selectedLot.model} - Lot {selectedLot.lot_id}</span>
                {selectedLot.link && (
                  <Button variant="outline" size="sm" onClick={() => window.open(selectedLot.link, '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View on {selectedPlatform.toUpperCase()}
                  </Button>
                )}
              </DialogTitle>
              <DialogDescription>
                Detailed vehicle information, auction details, and high-resolution photos
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vehicle Images */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Vehicle Photos</h3>
                {selectedLot.link_img_hd && selectedLot.link_img_hd.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedLot.link_img_hd.slice(0, 4).map((imageUrl: string, index: number) => (
                      <div key={index} className="aspect-square bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={`Vehicle photo ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => window.open(imageUrl, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-8 text-center">
                    <Camera className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-500">No photos available</p>
                  </div>
                )}
              </div>

              {/* Vehicle Details */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Vehicle Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">VIN:</span>
                      <span className="font-mono">{selectedLot.vin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Year:</span>
                      <span>{selectedLot.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Make:</span>
                      <span>{selectedLot.make}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Model:</span>
                      <span>{selectedLot.model}</span>
                    </div>
                    {selectedLot.series && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Series:</span>
                        <span>{selectedLot.series}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-600">Color:</span>
                      <span>{selectedLot.color}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Transmission:</span>
                      <span>{selectedLot.transmission}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Drive:</span>
                      <span>{selectedLot.drive}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Fuel:</span>
                      <span>{selectedLot.fuel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Odometer:</span>
                      <span>{selectedLot.odometer?.toLocaleString() || 'Unknown'} miles</span>
                    </div>
                  </div>
                </div>

                {/* Auction Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Auction Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Lot Number:</span>
                      <span className="font-mono">{selectedLot.lot_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Location:</span>
                      <span>{selectedLot.auction_location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Sale Date:</span>
                      <span>{formatDate(selectedLot.sale_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Sale Status:</span>
                      <span>{selectedLot.sale_status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Current Bid:</span>
                      <span className="font-semibold text-blue-600">{formatPrice(selectedLot.current_bid || 0)}</span>
                    </div>
                    {selectedLot.purchase_price > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Final Price:</span>
                        <span className="font-bold text-lg text-green-600">{formatPrice(selectedLot.purchase_price)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Condition Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Condition</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Title:</span>
                      <span>{selectedLot.vehicle_title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Primary Damage:</span>
                      <span>{selectedLot.vehicle_damage}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t">
                  <Button 
                    className="w-full mb-2"
                    onClick={() => handleAnalyzeClick(selectedLot)}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Analyze Vehicle
                  </Button>
                  {selectedLot.link && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open(selectedLot.link, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on {selectedPlatform.toUpperCase()}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}