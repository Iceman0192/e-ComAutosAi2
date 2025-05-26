import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Car, 
  TrendingUp, 
  BarChart3, 
  Zap, 
  Crown, 
  Database,
  Search,
  Brain,
  ArrowRight,
  Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { EcomNavbar } from '../components/layout/EcomNavbar';

import { formatCurrency } from '../utils/formatters';
import PlatformToggle from '../components/ui/platform-toggle';

// Tab enum for better organization
enum TabType {
  TIMELINE = "timeline",
  TABLE = "table",
  PHOTOS = "photos"
}

// Get current year for the year picker default value
const currentYear = new Date().getFullYear();

// Hero Section Component
function HeroSection() {
  const { user } = useAuth();
  
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-blue-50/30 to-purple-50/20 dark:from-background dark:via-blue-950/20 dark:to-purple-950/10">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="container mx-auto px-4 py-16 sm:py-24 lg:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            <Star className="w-3 h-3 mr-1" />
            Professional Auction Intelligence Platform
          </Badge>
          
          <h1 className="text-display mb-6 bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
            EcomAutos.AI
          </h1>
          
          <p className="text-subheading text-muted-foreground mb-8 max-w-2xl mx-auto">
            Advanced auction intelligence for automotive professionals. Access real-time data from 
            Copart & IAAI with AI-powered insights and cross-platform analytics.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {!user ? (
              <>
                <Button size="lg" className="text-lg px-8 gradient-primary" asChild>
                  <Link href="/register">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </>
            ) : (
              <Button size="lg" className="text-lg px-8 gradient-primary" asChild>
                <Link href="/dashboard">
                  Go to Dashboard
                  <BarChart3 className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            )}
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">11,712+</div>
              <div className="text-sm text-muted-foreground">Authentic Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-copart mb-1">2 Platforms</div>
              <div className="text-sm text-muted-foreground">Copart & IAAI</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success mb-1">Real-time</div>
              <div className="text-sm text-muted-foreground">Live Intelligence</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Platform Features Component
function PlatformFeatures() {
  const features = [
    {
      icon: Car,
      title: "Copart Intelligence",
      description: "Access Copart's vast auction database with advanced filtering and real-time lot tracking.",
      color: "copart",
      href: "/",
      badge: "Live"
    },
    {
      icon: TrendingUp,
      title: "IAAI Intelligence", 
      description: "Comprehensive IAAI auction data with historical trends and pricing analytics.",
      color: "iaai",
      href: "/iaai",
      badge: "Live"
    },
    {
      icon: Brain,
      title: "Cross-Platform AI",
      description: "AI-powered insights comparing prices across both platforms for maximum intelligence.",
      color: "primary",
      href: "/cross-platform",
      badge: "Platinum",
      premium: true
    },
    {
      icon: Database,
      title: "Data Sets",
      description: "Bulk intelligence downloads for enterprise analysis and reporting needs.",
      color: "secondary",
      href: "/datasets",
      badge: "Professional"
    },
    {
      icon: Zap,
      title: "Live Tracking",
      description: "Real-time lot monitoring with instant notifications and price alerts.",
      color: "success",
      href: "/live-copart",
      badge: "Real-time"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Comprehensive analytics with trends, forecasting, and market insights.",
      color: "primary",
      href: "/dashboard",
      badge: "Pro"
    }
  ];

  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-heading mb-4">Auction Intelligence Platform</h2>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Professional tools for automotive auction analysis, pricing intelligence, and market insights.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.href} className="auction-card group cursor-pointer" asChild>
                <Link href={feature.href}>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-12 h-12 rounded-lg gradient-${feature.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <Badge 
                        variant={feature.premium ? "default" : "secondary"}
                        className={feature.premium ? "premium-glow" : ""}
                      >
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-body">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Quick Search Component
function QuickSearchSection() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-heading mb-4">Start Your Search</h2>
          <p className="text-body text-muted-foreground max-w-xl mx-auto">
            Enter vehicle details to access comprehensive auction intelligence from both platforms.
          </p>
        </div>
        
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Make</label>
                <input 
                  type="text"
                  placeholder="Toyota"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Model</label>
                <input 
                  type="text"
                  placeholder="Camry"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Year From</label>
                <input 
                  type="number"
                  placeholder="2020"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Year To</label>
                <input 
                  type="number"
                  placeholder="2025"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1 gradient-copart" asChild>
                <Link href="/">
                  <Car className="w-4 h-4 mr-2" />
                  Search Copart
                </Link>
              </Button>
              <Button className="flex-1 gradient-iaai" asChild>
                <Link href="/iaai">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Search IAAI
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// Main Export Function
export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <EcomNavbar />
      <HeroSection />
      <PlatformFeatures />
      <QuickSearchSection />
    </div>
  );
}
  
  // Combine filter state for API request
  const filterState: FilterState = {
    make,
    model,
    year_from: yearFrom,
    year_to: yearTo,
    sites,
    auction_date_from: auctionDateFrom,
    auction_date_to: auctionDateTo,
    page,
    size: resultsPerPage,
    damage_type: damageType !== 'all' ? damageType : undefined,
    odometer_from: minMileage,
    odometer_to: maxMileage
  };
  
  // State to track if a search has been performed
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Helper function to calculate average price from sales history
  const calculateAveragePrice = (salesHistory: any[] = []) => {
    if (!salesHistory || salesHistory.length === 0) return 0;
    
    const salesWithPrices = salesHistory.filter(sale => sale.purchase_price !== undefined);
    if (salesWithPrices.length === 0) return 0;
    
    const total = salesWithPrices.reduce((sum, sale) => sum + (sale.purchase_price || 0), 0);
    return total / salesWithPrices.length;
  };

  // State to hold the actual results data
  const [searchResults, setSearchResults] = useState<any>(null);
  
  // State for detailed vehicle modal
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Fresh Data Toggle for Gold+ (Gold and Platinum) users
  const { hasPermission } = useAuth();
  const [freshDataEnabled, setFreshDataEnabled] = useState(false);
  const [fetchingFreshData, setFetchingFreshData] = useState(false);
  
  // Function to open vehicle details modal
  const openVehicleDetails = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setCurrentImageIndex(0);
    setIsModalOpen(true);
  };
  
  // Function to close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
    setCurrentImageIndex(0);
  };
  
  // Image navigation functions
  const nextImage = () => {
    if (selectedVehicle) {
      let images = [];
      if (selectedVehicle.link_img_hd && Array.isArray(selectedVehicle.link_img_hd)) {
        images = selectedVehicle.link_img_hd;
      } else if (selectedVehicle.images) {
        images = typeof selectedVehicle.images === 'string' 
          ? JSON.parse(selectedVehicle.images) 
          : Array.isArray(selectedVehicle.images) 
            ? selectedVehicle.images 
            : [];
      }
      if (images.length > 0) {
        setCurrentImageIndex((prev) => 
          prev < images.length - 1 ? prev + 1 : 0
        );
      }
    }
  };
  
  const prevImage = () => {
    if (selectedVehicle) {
      let images = [];
      if (selectedVehicle.link_img_hd && Array.isArray(selectedVehicle.link_img_hd)) {
        images = selectedVehicle.link_img_hd;
      } else if (selectedVehicle.images) {
        images = typeof selectedVehicle.images === 'string' 
          ? JSON.parse(selectedVehicle.images) 
          : Array.isArray(selectedVehicle.images) 
            ? selectedVehicle.images 
            : [];
      }
      if (images.length > 0) {
        setCurrentImageIndex((prev) => 
          prev > 0 ? prev - 1 : images.length - 1
        );
      }
    }
  };
  
  // Fetch data - will only execute when triggered by button click
  const { data, isLoading, error, refetch } = useSalesHistory(filterState);
  
  const handleSearch = () => {
    setPage(1); // Reset to first page on new search
    setHasSearched(true); // Mark that a search has been performed
    setIsSearching(true); // Show loading state
    
    // Build parameters for initial search
    const params = new URLSearchParams();
    params.append('make', make);
    if (model) params.append('model', model);
    if (yearFrom) params.append('year_from', yearFrom.toString());
    if (yearTo) params.append('year_to', yearTo.toString());
    params.append('page', '1');
    params.append('size', resultsPerPage.toString());
    params.append('sale_date_from', auctionDateFrom);
    params.append('sale_date_to', auctionDateTo);
    
    // Add site filters
    sites.forEach(site => {
      if (site === 'copart') params.append('site', '1');
      if (site === 'iaai') params.append('site', '2');
    });
    
    // Add Fresh Data parameter for Gold+ users
    if (freshDataEnabled) {
      params.append('fresh_data', 'true');
    }
    
    console.log(`Initial search with params:`, params.toString());
    
    // Make direct fetch request to be consistent with pagination
    fetch(`/api/sales-history?${params.toString()}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(result => {
        console.log("Received initial search data:", result);
        
        // Only update if successful
        if (result.success && result.data) {
          // Store results in local state
          setSearchResults(result);
          
          // Update total results count for pagination
          if (result.data.pagination && result.data.pagination.totalCount) {
            setTotalResults(result.data.pagination.totalCount);
          } else if (result.data.salesHistory) {
            // If we got a full page, assume there are more results
            const displayedCount = result.data.salesHistory.length;
            if (displayedCount === resultsPerPage) {
              setTotalResults(resultsPerPage * 2); // Assume at least 2 pages
            } else {
              setTotalResults(displayedCount);
            }
          }
        }
        
        // Reset loading state whether success or failure
        setIsSearching(false);
      })
      .catch(error => {
        console.error("Error during search:", error);
        setIsSearching(false);
      });
  };
  
  // Handle page change - fetch new data with updated page number
  const handlePageChange = (newPage: number) => {
    // Update page in filter state
    filterState.page = newPage;
    
    // Update current page state
    setPage(newPage);
    
    // Build complete URL parameters for API request
    const params = new URLSearchParams();
    params.append('make', make);
    if (model) params.append('model', model);
    if (yearFrom) params.append('year_from', yearFrom.toString());
    if (yearTo) params.append('year_to', yearTo.toString());
    params.append('page', newPage.toString());
    params.append('size', resultsPerPage.toString());
    params.append('sale_date_from', auctionDateFrom);
    params.append('sale_date_to', auctionDateTo);
    
    // Add site filters
    sites.forEach(site => {
      if (site === 'copart') params.append('site', '1');
      if (site === 'iaai') params.append('site', '2');
    });
    
    // Add Fresh Data parameter for Gold+ users
    if (freshDataEnabled) {
      params.append('fresh_data', 'true');
    }
    
    console.log(`Requesting page ${newPage} with params:`, params.toString());
    
    // Make direct fetch request to avoid resetting search state
    fetch(`/api/sales-history?${params.toString()}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(result => {
        console.log("Received data for page", newPage, result);
        
        // Only update if successful
        if (result.success && result.data) {
          // Store results in local state
          setSearchResults(result);
          
          // Make sure we're showing search has been performed
          setHasSearched(true);
          
          // Update total results count for pagination
          if (result.data.pagination && result.data.pagination.totalCount) {
            setTotalResults(result.data.pagination.totalCount);
          } else if (result.data.salesHistory) {
            // If we have more results than just this page, estimate there are more
            const displayedCount = result.data.salesHistory.length;
            if (displayedCount === resultsPerPage) {
              // If we got a full page, assume there are at least more pages available
              setTotalResults(Math.max(newPage * resultsPerPage + resultsPerPage, totalResults));
            } else {
              // If we got a partial page, we can calculate the exact total
              setTotalResults((newPage - 1) * resultsPerPage + displayedCount);
            }
          }
        }
      })
      .catch(error => {
        console.error("Error fetching page", newPage, error);
      });
  };
  
  // Location options for dropdown
  const locationOptions = [
    "All Locations",
    "Abilene, TX",
    "Adelanto, CA",
    "Albuquerque, NM",
    "Altoona, PA",
    "Amarillo, TX",
    "Anchorage, AK",
    "Appleton, WI",
    "Atlanta East, GA",
    "Atlanta North, GA",
    "Atlanta South, GA",
    "Austin, TX",
    "Bakersfield, CA",
    "Baltimore, MD",
    "Baton Rouge, LA",
    "Billings, MT",
    "Birmingham, AL",
    "Bismarck, ND",
    "Boise, ID",
    "Boston-Shirley, MA"
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - BLUE branding for Copart */}
      <header className="bg-blue-600 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold">Copart Vehicle Sales History</h1>
            <div className="hidden sm:block">
              <PlatformToggle />
            </div>
          </div>
          {/* Mobile platform toggle */}
          <div className="sm:hidden mt-3">
            <PlatformToggle />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Search Filters Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Search Vehicle Sales History</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Make - Required */}
              <div>
                <label htmlFor="make" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Make <span className="text-red-500">*</span>
                </label>
                <select
                  id="make"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select Make</option>
                  <option value="Acura">Acura</option>
                  <option value="Audi">Audi</option>
                  <option value="BMW">BMW</option>
                  <option value="Buick">Buick</option>
                  <option value="Cadillac">Cadillac</option>
                  <option value="Chevrolet">Chevrolet</option>
                  <option value="Chrysler">Chrysler</option>
                  <option value="Dodge">Dodge</option>
                  <option value="Ford">Ford</option>
                  <option value="GMC">GMC</option>
                  <option value="Honda">Honda</option>
                  <option value="Hyundai">Hyundai</option>
                  <option value="Infiniti">Infiniti</option>
                  <option value="Jeep">Jeep</option>
                  <option value="Kia">Kia</option>
                  <option value="Lexus">Lexus</option>
                  <option value="Lincoln">Lincoln</option>
                  <option value="Mazda">Mazda</option>
                  <option value="Mercedes-Benz">Mercedes-Benz</option>
                  <option value="Mitsubishi">Mitsubishi</option>
                  <option value="Nissan">Nissan</option>
                  <option value="Ram">Ram</option>
                  <option value="Subaru">Subaru</option>
                  <option value="Tesla">Tesla</option>
                  <option value="Toyota">Toyota</option>
                  <option value="Volkswagen">Volkswagen</option>
                  <option value="Volvo">Volvo</option>
                </select>
              </div>
              
              {/* Model */}
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model
                </label>
                <select
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">All Models</option>
                  {make === 'Toyota' && (
                    <>
                      <option value="4Runner">4Runner</option>
                      <option value="Avalon">Avalon</option>
                      <option value="Camry">Camry</option>
                      <option value="Corolla">Corolla</option>
                      <option value="Highlander">Highlander</option>
                      <option value="Prius">Prius</option>
                      <option value="RAV4">RAV4</option>
                      <option value="Sequoia">Sequoia</option>
                      <option value="Sienna">Sienna</option>
                      <option value="Tacoma">Tacoma</option>
                      <option value="Tundra">Tundra</option>
                      <option value="Venza">Venza</option>
                    </>
                  )}
                  {make === 'Honda' && (
                    <>
                      <option value="Accord">Accord</option>
                      <option value="Civic">Civic</option>
                      <option value="CR-V">CR-V</option>
                      <option value="HR-V">HR-V</option>
                      <option value="Odyssey">Odyssey</option>
                      <option value="Passport">Passport</option>
                      <option value="Pilot">Pilot</option>
                      <option value="Ridgeline">Ridgeline</option>
                    </>
                  )}
                  {make === 'Ford' && (
                    <>
                      <option value="Bronco">Bronco</option>
                      <option value="Edge">Edge</option>
                      <option value="Escape">Escape</option>
                      <option value="Expedition">Expedition</option>
                      <option value="Explorer">Explorer</option>
                      <option value="F-150">F-150</option>
                      <option value="F-250">F-250</option>
                      <option value="F-350">F-350</option>
                      <option value="Focus">Focus</option>
                      <option value="Fusion">Fusion</option>
                      <option value="Mustang">Mustang</option>
                      <option value="Ranger">Ranger</option>
                    </>
                  )}
                  {make === 'Chevrolet' && (
                    <>
                      <option value="Blazer">Blazer</option>
                      <option value="Camaro">Camaro</option>
                      <option value="Colorado">Colorado</option>
                      <option value="Corvette">Corvette</option>
                      <option value="Cruze">Cruze</option>
                      <option value="Equinox">Equinox</option>
                      <option value="Impala">Impala</option>
                      <option value="Malibu">Malibu</option>
                      <option value="Silverado 1500">Silverado 1500</option>
                      <option value="Silverado 2500">Silverado 2500</option>
                      <option value="Suburban">Suburban</option>
                      <option value="Tahoe">Tahoe</option>
                      <option value="Traverse">Traverse</option>
                    </>
                  )}
                  {make === 'Nissan' && (
                    <>
                      <option value="Altima">Altima</option>
                      <option value="Armada">Armada</option>
                      <option value="Frontier">Frontier</option>
                      <option value="Maxima">Maxima</option>
                      <option value="Murano">Murano</option>
                      <option value="Pathfinder">Pathfinder</option>
                      <option value="Rogue">Rogue</option>
                      <option value="Sentra">Sentra</option>
                      <option value="Titan">Titan</option>
                      <option value="Versa">Versa</option>
                    </>
                  )}
                  {make === 'BMW' && (
                    <>
                      <option value="3 Series">3 Series</option>
                      <option value="5 Series">5 Series</option>
                      <option value="7 Series">7 Series</option>
                      <option value="X1">X1</option>
                      <option value="X3">X3</option>
                      <option value="X5">X5</option>
                      <option value="X7">X7</option>
                    </>
                  )}
                  {make === 'Mercedes-Benz' && (
                    <>
                      <option value="C-Class">C-Class</option>
                      <option value="E-Class">E-Class</option>
                      <option value="S-Class">S-Class</option>
                      <option value="GLC">GLC</option>
                      <option value="GLE">GLE</option>
                      <option value="GLS">GLS</option>
                    </>
                  )}
                  {make === 'Lexus' && (
                    <>
                      <option value="ES">ES</option>
                      <option value="GX">GX</option>
                      <option value="IS">IS</option>
                      <option value="LS">LS</option>
                      <option value="LX">LX</option>
                      <option value="NX">NX</option>
                      <option value="RX">RX</option>
                    </>
                  )}
                  {make === 'Audi' && (
                    <>
                      <option value="A3">A3</option>
                      <option value="A4">A4</option>
                      <option value="A6">A6</option>
                      <option value="A8">A8</option>
                      <option value="Q3">Q3</option>
                      <option value="Q5">Q5</option>
                      <option value="Q7">Q7</option>
                      <option value="Q8">Q8</option>
                    </>
                  )}
                  {make === 'Jeep' && (
                    <>
                      <option value="Cherokee">Cherokee</option>
                      <option value="Compass">Compass</option>
                      <option value="Grand Cherokee">Grand Cherokee</option>
                      <option value="Gladiator">Gladiator</option>
                      <option value="Renegade">Renegade</option>
                      <option value="Wrangler">Wrangler</option>
                    </>
                  )}
                  {make === 'Hyundai' && (
                    <>
                      <option value="Accent">Accent</option>
                      <option value="Elantra">Elantra</option>
                      <option value="Genesis">Genesis</option>
                      <option value="Palisade">Palisade</option>
                      <option value="Santa Fe">Santa Fe</option>
                      <option value="Sonata">Sonata</option>
                      <option value="Tucson">Tucson</option>
                    </>
                  )}
                  {make === 'Kia' && (
                    <>
                      <option value="Forte">Forte</option>
                      <option value="Optima">Optima</option>
                      <option value="Rio">Rio</option>
                      <option value="Sorento">Sorento</option>
                      <option value="Soul">Soul</option>
                      <option value="Sportage">Sportage</option>
                      <option value="Telluride">Telluride</option>
                    </>
                  )}
                  {make === 'Subaru' && (
                    <>
                      <option value="Ascent">Ascent</option>
                      <option value="Forester">Forester</option>
                      <option value="Impreza">Impreza</option>
                      <option value="Legacy">Legacy</option>
                      <option value="Outback">Outback</option>
                      <option value="WRX">WRX</option>
                    </>
                  )}
                  {make === 'Tesla' && (
                    <>
                      <option value="Model 3">Model 3</option>
                      <option value="Model S">Model S</option>
                      <option value="Model X">Model X</option>
                      <option value="Model Y">Model Y</option>
                    </>
                  )}
                  {make === 'Dodge' && (
                    <>
                      <option value="Challenger">Challenger</option>
                      <option value="Charger">Charger</option>
                      <option value="Durango">Durango</option>
                      <option value="Journey">Journey</option>
                    </>
                  )}
                  {make === 'Ram' && (
                    <>
                      <option value="1500">1500</option>
                      <option value="2500">2500</option>
                      <option value="3500">3500</option>
                    </>
                  )}
                  {make === 'GMC' && (
                    <>
                      <option value="Acadia">Acadia</option>
                      <option value="Canyon">Canyon</option>
                      <option value="Sierra 1500">Sierra 1500</option>
                      <option value="Sierra 2500">Sierra 2500</option>
                      <option value="Terrain">Terrain</option>
                      <option value="Yukon">Yukon</option>
                    </>
                  )}
                  {make === 'Mazda' && (
                    <>
                      <option value="CX-3">CX-3</option>
                      <option value="CX-5">CX-5</option>
                      <option value="CX-9">CX-9</option>
                      <option value="Mazda3">Mazda3</option>
                      <option value="Mazda6">Mazda6</option>
                      <option value="MX-5 Miata">MX-5 Miata</option>
                    </>
                  )}
                  {make === 'Volkswagen' && (
                    <>
                      <option value="Atlas">Atlas</option>
                      <option value="Golf">Golf</option>
                      <option value="Jetta">Jetta</option>
                      <option value="Passat">Passat</option>
                      <option value="Tiguan">Tiguan</option>
                    </>
                  )}
                  {make === 'Acura' && (
                    <>
                      <option value="ILX">ILX</option>
                      <option value="MDX">MDX</option>
                      <option value="RDX">RDX</option>
                      <option value="TLX">TLX</option>
                    </>
                  )}
                  {make === 'Infiniti' && (
                    <>
                      <option value="Q50">Q50</option>
                      <option value="Q60">Q60</option>
                      <option value="QX50">QX50</option>
                      <option value="QX60">QX60</option>
                      <option value="QX80">QX80</option>
                    </>
                  )}
                  {make === 'Cadillac' && (
                    <>
                      <option value="CT4">CT4</option>
                      <option value="CT5">CT5</option>
                      <option value="Escalade">Escalade</option>
                      <option value="XT4">XT4</option>
                      <option value="XT5">XT5</option>
                      <option value="XT6">XT6</option>
                    </>
                  )}
                  {make === 'Lincoln' && (
                    <>
                      <option value="Aviator">Aviator</option>
                      <option value="Continental">Continental</option>
                      <option value="Corsair">Corsair</option>
                      <option value="Navigator">Navigator</option>
                    </>
                  )}
                  {make === 'Buick' && (
                    <>
                      <option value="Enclave">Enclave</option>
                      <option value="Encore">Encore</option>
                      <option value="Envision">Envision</option>
                    </>
                  )}
                  {make === 'Chrysler' && (
                    <>
                      <option value="300">300</option>
                      <option value="Pacifica">Pacifica</option>
                    </>
                  )}
                  {make === 'Mitsubishi' && (
                    <>
                      <option value="Eclipse Cross">Eclipse Cross</option>
                      <option value="Mirage">Mirage</option>
                      <option value="Outlander">Outlander</option>
                    </>
                  )}
                  {make === 'Volvo' && (
                    <>
                      <option value="S60">S60</option>
                      <option value="S90">S90</option>
                      <option value="XC40">XC40</option>
                      <option value="XC60">XC60</option>
                      <option value="XC90">XC90</option>
                    </>
                  )}
                </select>
              </div>
              
              {/* Year Range - Mobile Optimized */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="yearFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Year From
                  </label>
                  <select
                    id="yearFrom"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base"
                  >
                    {Array.from({ length: 30 }, (_, i) => currentYear - 29 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="yearTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Year To
                  </label>
                  <select
                    id="yearTo"
                    value={yearTo}
                    onChange={(e) => setYearTo(parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {Array.from({ length: 30 }, (_, i) => currentYear - 29 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Auction Date Range */}
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label htmlFor="auctionDateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Auction Date From
                  </label>
                  <input
                    type="date"
                    id="auctionDateFrom"
                    value={auctionDateFrom}
                    onChange={(e) => setAuctionDateFrom(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="auctionDateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Auction Date To
                  </label>
                  <input
                    type="date"
                    id="auctionDateTo"
                    value={auctionDateTo}
                    onChange={(e) => setAuctionDateTo(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
            
            {/* Fresh Data Toggle for Gold+ (Gold and Platinum) Users */}
            {hasPermission('ADVANCED_FILTERS') && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="freshDataToggle"
                        checked={freshDataEnabled}
                        onChange={(e) => setFreshDataEnabled(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="freshDataToggle" className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Fresh data
                      </label>
                    </div>
                    <div className="px-2 py-1 bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-full">
                      GOLD+
                    </div>
                  </div>
                  {fetchingFreshData && (
                    <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-xs">Fetching fresh data...</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  {freshDataEnabled 
                    ? "✓ Fresh auction data will be included in your search results"
                    : "Enable to fetch the latest auction data from the last 3 days"
                  }
                </p>
              </div>
            )}
            
            <div className="mt-6">
              <button
                type="button"
                onClick={handleSearch}
                disabled={!make || isSearching}
                className="w-full inline-flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors min-h-[48px] touch-manipulation"
              >
                {isSearching ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching Copart Database...
                  </>
                ) : (
                  'Search Vehicle History'
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Results Area */}
        <ErrorBoundary>
          {!hasSearched ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-gray-700 dark:text-gray-300">
                Fill in your search criteria above and click "Search Vehicle History" to view results.
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-700 dark:text-gray-300">Loading sales history data...</p>
            </div>
          ) : error ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Unable to load data</h2>
                  <p className="text-red-600 dark:text-red-300 mt-2">
                    There was an error fetching the sales history. Please check your search parameters and try again.
                  </p>
                  <button
                    onClick={() => refetch()}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          ) : hasSearched && searchResults?.success && searchResults?.data?.salesHistory && searchResults.data.salesHistory.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {/* Results Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6 flex flex-wrap items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {searchResults?.data?.salesHistory.length || 0} Results for {make} {model} {yearFrom && yearTo ? `(${yearFrom}-${yearTo})` : ''}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Average sold price: {formatCurrency(searchResults?.data?.stats?.averagePrice)}
                  </p>
                </div>
                
                {/* Tab navigation */}
                <div className="flex mt-2 sm:mt-0">
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === TabType.TIMELINE
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab(TabType.TIMELINE)}
                  >
                    Timeline
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === TabType.TABLE
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab(TabType.TABLE)}
                  >
                    Table View
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === TabType.PHOTOS
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab(TabType.PHOTOS)}
                  >
                    Photo Grid
                  </button>
                </div>
              </div>
              
              {/* Result content based on active tab */}
              {activeTab === TabType.TIMELINE && (
                <div className="p-4 space-y-6">

                  {/* Sales analytics */}
                  <SalesAnalytics 
                    salesHistory={searchResults?.data?.salesHistory || []}
                  />
                </div>
              )}
              
              {activeTab === TabType.TABLE && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  {/* Clean, Simple Table - No filters sidebar */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            VEHICLE
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            ODOMETER
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            TITLE/DAMAGE
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            LOCATION
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            SALE PRICE
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            SALE DATE
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {searchResults?.data?.salesHistory?.map((sale: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors" onClick={() => openVehicleDetails(sale)}>
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-16 w-20 mr-4 relative">
                                  {(() => {
                                    // Enhanced image handling - try multiple sources for better coverage
                                    let imageUrl = '';
                                    if (sale.link_img_small && Array.isArray(sale.link_img_small) && sale.link_img_small.length > 0) {
                                      imageUrl = sale.link_img_small[0];
                                    } else if (sale.link_img_hd && Array.isArray(sale.link_img_hd) && sale.link_img_hd.length > 0) {
                                      imageUrl = sale.link_img_hd[0];
                                    } else if (sale.images) {
                                      const images = typeof sale.images === 'string' ? JSON.parse(sale.images) : sale.images;
                                      if (Array.isArray(images) && images.length > 0) {
                                        imageUrl = images[0];
                                      }
                                    }
                                    
                                    return imageUrl ? (
                                      <img 
                                        src={imageUrl} 
                                        alt={`${sale.year} ${sale.make} ${sale.model}`}
                                        className="h-16 w-20 object-cover rounded-lg border border-blue-200 dark:border-blue-700 shadow-sm"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const placeholder = target.nextElementSibling as HTMLElement;
                                          if (placeholder) placeholder.style.display = 'flex';
                                        }}
                                      />
                                    ) : null;
                                  })()}
                                  <div 
                                    className="h-16 w-20 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700 flex items-center justify-center"
                                    style={{ 
                                      display: (() => {
                                        const hasImage = (sale.link_img_small?.length > 0) || (sale.link_img_hd?.length > 0) || 
                                                         (sale.images && ((typeof sale.images === 'string' && JSON.parse(sale.images).length > 0) || 
                                                          (Array.isArray(sale.images) && sale.images.length > 0)));
                                        return hasImage ? 'none' : 'flex';
                                      })()
                                    }}
                                  >
                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                    {sale.year} {sale.make} {sale.model} {sale.series}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Lot# {sale.lot_id || "N/A"}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    VIN: {sale.vin ? sale.vin.substring(0, 8) + '...' : 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {sale.odometer ? `${sale.odometer.toLocaleString()} mi` : 
                                 sale.vehicle_mileage ? `${sale.vehicle_mileage.toLocaleString()} mi` : 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {sale.odometer || sale.vehicle_mileage ? '(ACTUAL)' : '(NOT ACTUAL)'}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900 dark:text-white font-medium">
                                {sale.vehicle_title || sale.title || 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {sale.damage_pr || sale.vehicle_damage || 'Normal Wear'}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                {sale.location || sale.auction_location || 'Unknown'}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {sale.purchase_price ? formatCurrency(sale.purchase_price) : 'N/A'}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {new Date(sale.sale_date).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {sale.sale_status}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {activeTab === TabType.PHOTOS && (
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {searchResults?.data?.salesHistory?.map((sale) => (
                      <div key={sale.id} className="bg-white dark:bg-gray-700 rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="h-48 w-full bg-gray-200 dark:bg-gray-600 relative">
                          {(() => {
                            // Handle different image formats (API direct vs database cached)
                            let imageUrl = null;
                            if (sale.link_img_hd && sale.link_img_hd.length > 0) {
                              imageUrl = sale.link_img_hd[0];
                            } else if (sale.link_img_small && sale.link_img_small.length > 0) {
                              imageUrl = sale.link_img_small[0];
                            } else if (sale.images) {
                              const images = typeof sale.images === 'string' ? JSON.parse(sale.images) : sale.images;
                              if (Array.isArray(images) && images.length > 0) {
                                imageUrl = images[0];
                              }
                            }
                            
                            return imageUrl ? (
                              <img 
                                src={imageUrl} 
                                alt={`${sale.year} ${sale.make} ${sale.model}`}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const placeholder = target.nextElementSibling as HTMLElement;
                                  if (placeholder) placeholder.style.display = 'flex';
                                }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <span className="text-sm text-gray-500 dark:text-gray-400">No image available</span>
                              </div>
                            );
                          })()}
                          
                          <div className="absolute top-2 right-2">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              sale.sale_status === 'SOLD' || sale.sale_status === 'Sold'
                                ? 'bg-green-100 text-green-800'
                                : sale.sale_status === 'ON APPROVAL'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {sale.sale_status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {sale.year} {sale.make} {sale.model} {sale.series}
                          </h3>
                          
                          <div className="mt-2 flex justify-between items-center">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {sale.odometer ? `${sale.odometer.toLocaleString()} mi` : 'N/A'} • {sale.damage_pr || 'Unknown Damage'}
                            </div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {sale.purchase_price ? `$${sale.purchase_price.toLocaleString()}` : 'N/A'}
                            </div>
                          </div>
                          
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Sold: {new Date(sale.sale_date).toLocaleDateString()} • {sale.location || sale.buyer_state || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Pagination */}
              <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="relative inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 min-h-[48px] touch-manipulation"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    className="ml-3 relative inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 min-h-[48px] touch-manipulation"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing <span className="font-medium">{(page - 1) * resultsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min((page * resultsPerPage), totalResults)}
                      </span> of{' '}
                      <span className="font-medium">
                        {/* Always show at least the number of visible results + more */}
                        {Math.max(searchResults?.data?.pagination?.totalCount || 0, searchResults?.data?.salesHistory?.length || 0, totalResults || 25)}
                      </span> results
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* Results per page selector */}
                    <div className="flex items-center">
                      <label htmlFor="resultsPerPage" className="text-sm text-gray-700 dark:text-gray-300 mr-2">
                        Per page:
                      </label>
                      <select
                        id="resultsPerPage"
                        value={resultsPerPage}
                        onChange={(e) => {
                          setResultsPerPage(Number(e.target.value));
                          // Reset to page 1 when changing results per page
                          setPage(1);
                          // Refetch with new page size
                          setTimeout(() => refetch(), 0);
                        }}
                        className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm py-1 px-2"
                      >
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="25">25</option>
                      </select>
                    </div>
                  
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(Math.max(1, page - 1))}
                        disabled={page <= 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Enhanced pagination display that highlights current page better */}
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-blue-100 dark:bg-blue-900 text-sm font-bold text-blue-600 dark:text-blue-200">
                        Page {page}
                      </span>
                      
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={searchResults?.data?.salesHistory?.length === 0}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No sales history found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Try adjusting your search criteria or select a different make and model.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Search Again
                  </button>
                </div>
              </div>
            </div>
          )}
        </ErrorBoundary>

        {/* Detailed Vehicle Modal for Copart */}
        {isModalOpen && selectedVehicle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model} {selectedVehicle.series}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Images and Basic Info */}
                  <div>
                    {/* Vehicle Images - Interactive Gallery */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Vehicle Photos</h3>
                      {(() => {
                        // Handle different image formats (API direct vs database cached)
                        let images = [];
                        if (selectedVehicle.link_img_hd && Array.isArray(selectedVehicle.link_img_hd)) {
                          images = selectedVehicle.link_img_hd;
                        } else if (selectedVehicle.images) {
                          images = typeof selectedVehicle.images === 'string' 
                            ? JSON.parse(selectedVehicle.images) 
                            : Array.isArray(selectedVehicle.images) 
                              ? selectedVehicle.images 
                              : [];
                        }
                        
                        return images.length > 0 ? (
                          <div>
                            {/* Main Image Display */}
                            <div className="relative mb-4">
                              <img
                                src={images[currentImageIndex]}
                                alt={`${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model} - Image ${currentImageIndex + 1}`}
                                className="w-full h-80 object-cover rounded-lg border"
                              />
                              
                              {/* Image Counter */}
                              <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                                {currentImageIndex + 1} of {images.length}
                              </div>
                              
                              {/* Navigation Arrows */}
                              {images.length > 1 && (
                                <>
                                  <button
                                    onClick={prevImage}
                                    className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 sm:p-2 rounded-full transition-all min-h-[44px] min-w-[44px] touch-manipulation"
                                  >
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={nextImage}
                                    className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 sm:p-2 rounded-full transition-all min-h-[44px] min-w-[44px] touch-manipulation"
                                  >
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                            
                            {/* Thumbnail Gallery */}
                            {images.length > 1 && (
                              <div className="flex space-x-2 overflow-x-auto pb-2">
                                {images.map((img: string, index: number) => (
                                  <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`flex-shrink-0 w-20 h-16 rounded border-2 overflow-hidden ${
                                      currentImageIndex === index 
                                        ? 'border-blue-500 ring-2 ring-blue-200' 
                                        : 'border-gray-300 hover:border-blue-300'
                                    }`}
                                  >
                                    <img
                                      src={img}
                                      alt={`Thumbnail ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-64 bg-gray-200 dark:bg-gray-600 rounded-lg border flex items-center justify-center">
                            <span className="text-gray-500 dark:text-gray-400">No images available</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Sale Information */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">Sale Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Sale Price:</span>
                          <span className="font-bold text-blue-900 dark:text-blue-100">
                            {selectedVehicle.purchase_price ? `$${selectedVehicle.purchase_price.toLocaleString()}` : 'Not sold'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Sale Date:</span>
                          <span className="text-blue-900 dark:text-blue-100">
                            {new Date(selectedVehicle.sale_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            selectedVehicle.sale_status === 'sold' || selectedVehicle.sale_status === 'Sold'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedVehicle.sale_status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Lot ID:</span>
                          <span className="text-blue-900 dark:text-blue-100">{selectedVehicle.lot_id}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Specifications */}
                  <div>
                    {/* Vehicle Specifications */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Vehicle Specifications</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">VIN:</span>
                            <p className="font-mono text-sm text-gray-900 dark:text-white">{selectedVehicle.vin}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Year:</span>
                            <p className="text-gray-900 dark:text-white">{selectedVehicle.year}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Make:</span>
                            <p className="text-gray-900 dark:text-white">{selectedVehicle.make}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Model:</span>
                            <p className="text-gray-900 dark:text-white">{selectedVehicle.model}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Series:</span>
                            <p className="text-gray-900 dark:text-white">{selectedVehicle.series || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Trim:</span>
                            <p className="text-gray-900 dark:text-white">{selectedVehicle.trim || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Odometer:</span>
                            <p className="text-gray-900 dark:text-white">
                              {selectedVehicle.vehicle_mileage || selectedVehicle.odometer ? 
                                `${(selectedVehicle.vehicle_mileage || selectedVehicle.odometer).toLocaleString()} mi` : 
                                'N/A'
                              }
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Color:</span>
                            <p className="text-gray-900 dark:text-white">{selectedVehicle.color || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Transmission:</span>
                            <p className="text-gray-900 dark:text-white">{selectedVehicle.transmission || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Drive Type:</span>
                            <p className="text-gray-900 dark:text-white">{selectedVehicle.drive || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Fuel Type:</span>
                            <p className="text-gray-900 dark:text-white">{selectedVehicle.fuel || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Keys:</span>
                            <p className="text-gray-900 dark:text-white">{selectedVehicle.keys || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Damage and Title Information */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Condition & Title</h3>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 space-y-3">
                        <div>
                          <span className="text-sm text-yellow-700 dark:text-yellow-300">Title Status:</span>
                          <p className="text-yellow-900 dark:text-yellow-100 font-medium">
                            {selectedVehicle.vehicle_title || selectedVehicle.title || 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-yellow-700 dark:text-yellow-300">Primary Damage:</span>
                          <p className="text-yellow-900 dark:text-yellow-100 font-medium">
                            {selectedVehicle.vehicle_damage || selectedVehicle.damage_pr || 'Unknown'}
                          </p>
                        </div>
                        {selectedVehicle.damage_sec && (
                          <div>
                            <span className="text-sm text-yellow-700 dark:text-yellow-300">Secondary Damage:</span>
                            <p className="text-yellow-900 dark:text-yellow-100 font-medium">{selectedVehicle.damage_sec}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-sm text-yellow-700 dark:text-yellow-300">Has Keys:</span>
                          <p className="text-yellow-900 dark:text-yellow-100 font-medium">
                            {selectedVehicle.vehicle_has_keys ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Location Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Location</h3>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <div>
                          <span className="text-sm text-blue-700 dark:text-blue-300">Auction Location:</span>
                          <p className="text-blue-900 dark:text-blue-100 font-medium">
                            Copart: {selectedVehicle.auction_location || selectedVehicle.location || 'N/A'}
                          </p>
                        </div>
                        {selectedVehicle.link && (
                          <div className="mt-3">
                            <a
                              href={selectedVehicle.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              View Original Copart Listing
                              <svg className="ml-2 -mr-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}