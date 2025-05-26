import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';
import PlatformToggle from '../components/ui/platform-toggle';
import ComparableSearchForm from '../components/ComparableSearchForm';

import { 
  Car, 
  Search, 
  Clock,
  MapPin,
  DollarSign,
  AlertCircle,
  Calendar,
  Brain,
  Gauge,
  Wrench,
  Key,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  Filter,
  Eye,
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface LiveLot {
  id: string;
  lot_id: number;
  site: number;
  base_site: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  series?: string;
  odometer: number;
  current_bid: number;
  reserve_price: number;
  auction_date: string;
  damage_pr: string;
  damage_sec: string;
  color: string;
  location: string;
  title: string;
  document: string;
  keys: string;
  status: string;
  fuel: string;
  transmission: string;
  drive: string;
  engine: string;
  seller?: string;
  link: string;
  link_img_hd: string[];
  link_img_small: string[];
}

interface SalesHistoryResponse {
  lot?: LiveLot;
  error?: string;
}

export default function LiveCopart() {
  const { userRole } = useAuth();
  const [, setLocation] = useLocation();
  const [lotId, setLotId] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);

  const hasPermission = (requiredRole: string) => {
    const roleHierarchy = ['FREE', 'GOLD', 'PLATINUM', 'ADMIN'];
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    return userRoleIndex >= requiredRoleIndex;
  };

  const { data: lotData, isLoading: lotLoading, error: lotError } = useQuery({
    queryKey: ['live-copart', lotId],
    queryFn: async (): Promise<SalesHistoryResponse> => {
      const response = await fetch(`/api/live-copart/${lotId}`);
      return response.json();
    },
    enabled: !!lotId && searchTriggered,
  });

  const handleSearch = () => {
    if (lotId.trim()) {
      setSearchTriggered(true);
      setCurrentImageIndex(0);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const nextImage = () => {
    if (lotData?.lot?.link_img_hd) {
      setCurrentImageIndex((prev) => 
        prev === lotData.lot.link_img_hd.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (lotData?.lot?.link_img_hd) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? lotData.lot.link_img_hd.length - 1 : prev - 1
      );
    }
  };

  const openImageViewer = (index: number) => {
    setCurrentImageIndex(index);
    setShowImageViewer(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6 space-y-6">
        
        <PlatformToggle />

        {/* Enhanced Search Section */}
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Search className="h-5 w-5" />
              Live Lot Lookup
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Enter a Copart lot ID to view current auction details and photos
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="lotId" className="text-sm font-medium">Lot ID</Label>
                <div className="mt-1 relative">
                  <Input
                    id="lotId"
                    placeholder="Enter lot ID (e.g., 57442255)"
                    value={lotId}
                    onChange={(e) => setLotId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pr-12 text-lg h-12"
                  />
                  <Car className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSearch}
                  disabled={!lotId.trim() || lotLoading}
                  className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  size="lg"
                >
                  {lotLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search Lot
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {lotError && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircle className="h-5 w-5" />
                <span>Error fetching lot data. Please check the lot ID and try again.</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Live Lot Display */}
        {lotData?.lot && (
          <>
            <Card className="border-green-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100 text-xl lg:text-2xl">
                      <Car className="h-6 w-6" />
                      {lotData.lot.title}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Lot #{lotData.lot.lot_id}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        VIN: {lotData.lot.vin}
                      </Badge>
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        {lotData.lot.year} {lotData.lot.make} {lotData.lot.model}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" asChild className="bg-white hover:bg-gray-50">
                      <a href={lotData.lot.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Copart
                      </a>
                    </Button>
                    {lotData.lot.current_bid > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Current Bid</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(lotData.lot.current_bid)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Vehicle Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Current Bid</p>
                      <p className="font-semibold">{formatCurrency(lotData.lot.current_bid)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Auction Date</p>
                      <p className="font-semibold">{formatDate(lotData.lot.auction_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Gauge className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Odometer</p>
                      <p className="font-semibold">{lotData.lot.odometer?.toLocaleString()} miles</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                      <p className="font-semibold">{lotData.lot.location}</p>
                    </div>
                  </div>
                </div>

                {/* Find Comparables Section - Gold Tier Manual Filtering */}
                {hasPermission('FULL_ANALYTICS') && (
                  <Card className="border-blue-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
                      <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                        <Filter className="h-5 w-5" />
                        Find Comparable Vehicles
                      </CardTitle>
                      <CardDescription className="text-blue-700 dark:text-blue-300">
                        Search for similar vehicles in your database to compare prices across platforms
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <ComparableSearchForm 
                        lotData={lotData.lot}
                        platform="copart"
                      />
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}