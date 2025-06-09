import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocation } from 'wouter';
import PlatformToggle from '../components/ui/platform-toggle';
import { 
  Car, 
  Search, 
  MapPin,
  DollarSign,
  AlertCircle,
  Wrench,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Loader2,
  Brain,
  History,
  Database,
  TrendingUp,
  Calendar,
  Zap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function LiveIAAI() {
  const { user, hasPermission } = useAuth();
  const [, setLocation] = useLocation();
  const [lotId, setLotId] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [vinHistoryTriggered, setVinHistoryTriggered] = useState(false);
  const [similarLotsTriggered, setSimilarLotsTriggered] = useState(false);
  const [analysisTriggered, setAnalysisTriggered] = useState(false);

  // Fetch live lot data
  const { data: lotData, isLoading: lotLoading, error: lotError } = useQuery({
    queryKey: ['/api/live-iaai', lotId],
    queryFn: async () => {
      const response = await fetch(`/api/live-iaai/${lotId}`);
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch lot data');
      }
      
      return result;
    },
    enabled: searchTriggered && !!lotId,
  });

  // Fetch VIN history data
  const { data: vinHistory, isLoading: vinLoading } = useQuery({
    queryKey: ['/api/auction-mind/vin-history', lotData?.lot?.vin],
    queryFn: async () => {
      const response = await fetch('/api/auction-mind/vin-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin: lotData.lot.vin })
      });
      if (!response.ok) throw new Error('Failed to fetch VIN history');
      return response.json();
    },
    enabled: vinHistoryTriggered && !!lotData?.lot?.vin,
  });

  // Fetch similar active lots
  const { data: similarLots, isLoading: similarLoading } = useQuery({
    queryKey: ['/api/cars', lotData?.lot?.make, lotData?.lot?.model, lotData?.lot?.year],
    queryFn: async () => {
      const response = await fetch(`/api/cars?make=${lotData.lot.make}&model=${lotData.lot.model}&yearFrom=${lotData.lot.year - 2}&yearTo=${lotData.lot.year + 2}&site=2&size=20`);
      if (!response.ok) throw new Error('Failed to fetch similar lots');
      return response.json();
    },
    enabled: similarLotsTriggered && !!lotData?.lot?.make,
  });

  // Fetch AI analysis
  const { data: aiAnalysis, isLoading: aiLoading } = useQuery({
    queryKey: ['/api/ai-lot-analysis', lotData?.lot?.vin],
    queryFn: async () => {
      const vehicleData = {
        year: lotData.lot.year,
        make: lotData.lot.make,
        model: lotData.lot.model,
        currentBid: lotData.lot.current_bid,
        damage: lotData.lot.damage_pr,
        images: lotData.lot.link_img_hd || [],
        site: 2,
        vin: lotData.lot.vin,
        color: lotData.lot.color,
        odometer: lotData.lot.odometer
      };
      
      const response = await fetch('/api/ai-lot-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleData })
      });
      if (!response.ok) throw new Error('AI Analysis failed');
      return response.json();
    },
    enabled: analysisTriggered && !!lotData?.lot?.vin,
  });

  const handleSearch = () => {
    if (lotId.trim()) {
      setSearchTriggered(true);
      setCurrentImageIndex(0);
    }
  };

  // Image viewer navigation
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - RED branding for IAAI */}
      <header className="bg-red-600 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">IAAI Live Lot Analysis</h1>
              <p className="text-red-100 mt-1 text-sm">Search current auction lots and view detailed information</p>
            </div>
            <div className="hidden sm:block">
              <PlatformToggle />
            </div>
          </div>
          <div className="sm:hidden mt-3">
            <PlatformToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Search Card */}
        <Card className="shadow-lg border-red-200">
          <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/50 dark:to-pink-950/50">
            <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
              <Search className="h-5 w-5" />
              Live Lot Lookup
            </CardTitle>
            <CardDescription className="text-red-700 dark:text-red-300">
              Enter an IAAI lot ID to view current auction details and photos
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="lotId" className="text-sm font-medium">Lot ID</Label>
                <div className="mt-1 relative">
                  <Input
                    id="lotId"
                    placeholder="Enter lot ID (e.g., 35442255)"
                    value={lotId}
                    onChange={(e) => setLotId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSearch}
                  disabled={lotLoading || !lotId.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white px-8"
                >
                  {lotLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    'Search Lot'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {lotError && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertCircle className="h-5 w-5" />
                <span>Error: {lotError.message}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Lot Display */}
        {lotData?.lot && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  {lotData.lot.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Lot #{lotData.lot.lot_id}</Badge>
                  {lotData.lot.salvage_id && (
                    <Badge variant="secondary">Stock #{lotData.lot.salvage_id}</Badge>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <a href={lotData.lot.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View on IAAI
                    </a>
                  </Button>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setVinHistoryTriggered(true);
                    setActiveTab('history');
                  }}
                  disabled={vinLoading}
                >
                  {vinLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <History className="h-4 w-4 mr-2" />}
                  VIN History
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSimilarLotsTriggered(true);
                    setActiveTab('similar');
                  }}
                  disabled={similarLoading}
                >
                  {similarLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
                  Similar Lots
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAnalysisTriggered(true);
                    setActiveTab('analysis');
                  }}
                  disabled={aiLoading}
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                  AI Analysis
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Vehicle Images */}
              {lotData.lot.link_img_hd?.length > 0 && (
                <div className="mb-6">
                  {/* Main Image */}
                  <div className="relative mb-4 group">
                    <img
                      src={lotData.lot.link_img_hd[currentImageIndex]}
                      alt={`Vehicle image ${currentImageIndex + 1}`}
                      className="w-full h-96 object-cover rounded-lg cursor-pointer"
                      onClick={() => setShowImageViewer(true)}
                    />
                    
                    {/* Navigation Arrows */}
                    {lotData.lot.link_img_hd.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-70 hover:opacity-100"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-70 hover:opacity-100"
                          onClick={nextImage}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    {/* Image Counter */}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                      {currentImageIndex + 1} / {lotData.lot.link_img_hd.length}
                    </div>
                    
                    {/* Fullscreen Button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2 opacity-70 hover:opacity-100"
                      onClick={() => setShowImageViewer(true)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Image Thumbnails */}
                  {lotData.lot.link_img_hd.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {lotData.lot.link_img_hd.map((img: string, index: number) => (
                        <img
                          key={index}
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          className={`w-16 h-16 object-cover rounded cursor-pointer flex-shrink-0 ${
                            index === currentImageIndex ? 'ring-2 ring-red-500' : ''
                          }`}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Vehicle Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Auction Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Auction Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Current Bid:</span>
                      <span className="font-semibold text-green-600">{formatCurrency(lotData.lot.current_bid)}</span>
                    </div>
                    {lotData.lot.reserve_price > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Reserve:</span>
                        <span className="font-semibold text-red-600">{formatCurrency(lotData.lot.reserve_price)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Auction Date:</span>
                      <span>{formatDateTime(lotData.lot.auction_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">VIN:</span>
                      <span className="font-mono text-xs">{lotData.lot.vin}</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Specifications */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Vehicle Specs
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Year:</span>
                      <span>{lotData.lot.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Make/Model:</span>
                      <span>{lotData.lot.make} {lotData.lot.model}</span>
                    </div>
                    {lotData.lot.series && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Series:</span>
                        <span>{lotData.lot.series}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Mileage:</span>
                      <span>{lotData.lot.odometer.toLocaleString()} mi</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Color:</span>
                      <span>{lotData.lot.color}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Engine:</span>
                      <span>{lotData.lot.engine}</span>
                    </div>
                  </div>
                </div>

                {/* Condition & Location */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Condition & Location
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Primary Damage:</span>
                      <span>{lotData.lot.damage_pr}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Secondary Damage:</span>
                      <span>{lotData.lot.damage_sec}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Title Status:</span>
                      <span>{lotData.lot.document}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Keys:</span>
                      <span>{lotData.lot.keys}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span>{lotData.lot.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Location:</span>
                      <span>{lotData.lot.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabbed Content */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="history">VIN History</TabsTrigger>
                  <TabsTrigger value="similar">Similar Lots</TabsTrigger>
                  <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <div className="text-center py-8 text-gray-500">
                    Basic vehicle information is displayed above. Use the tabs to explore VIN history, similar lots, and AI analysis.
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  {vinHistory?.data ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <History className="h-5 w-5" />
                        VIN History ({vinHistory.data.length} records)
                      </h3>
                      
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Sale Date</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Platform</TableHead>
                              <TableHead>Damage</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Mileage</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {vinHistory.data.map((record: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{new Date(record.saleDate).toLocaleDateString()}</TableCell>
                                <TableCell className="font-semibold">{formatCurrency(record.price || 0)}</TableCell>
                                <TableCell>
                                  <Badge variant={record.platform === 'iaai' ? 'default' : 'secondary'}>
                                    {record.platform?.toUpperCase()}
                                  </Badge>
                                </TableCell>
                                <TableCell>{record.damage}</TableCell>
                                <TableCell>{record.location}</TableCell>
                                <TableCell>{record.mileage?.toLocaleString() || 'N/A'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : vinLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p>Loading VIN history...</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Click "VIN History" button to load historical auction data for this vehicle.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="similar" className="mt-4">
                  {similarLots?.data ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Similar Active Lots ({similarLots.data.length} found)
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {similarLots.data.slice(0, 12).map((lot: any, index: number) => (
                          <Card key={index} className="border">
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-semibold">{lot.year} {lot.make} {lot.model}</p>
                                    <p className="text-sm text-gray-600">{lot.series || ''}</p>
                                  </div>
                                  <Badge variant="outline">#{lot.lot_id}</Badge>
                                </div>
                                
                                <div className="text-sm space-y-1">
                                  <div className="flex justify-between">
                                    <span>Current Bid:</span>
                                    <span className="font-semibold text-green-600">{formatCurrency(lot.current_bid || 0)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Mileage:</span>
                                    <span>{lot.odometer?.toLocaleString() || 'N/A'} mi</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Damage:</span>
                                    <span>{lot.damage_pr}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Location:</span>
                                    <span>{lot.location}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Auction:</span>
                                    <span>{new Date(lot.auction_date).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                
                                {lot.link && (
                                  <Button size="sm" variant="outline" className="w-full mt-2" asChild>
                                    <a href={lot.link} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      View Lot
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : similarLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p>Finding similar lots...</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Click "Similar Lots" button to find comparable vehicles currently at auction.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="analysis" className="mt-4">
                  {aiAnalysis ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        AI Analysis Results
                      </h3>
                      
                      {aiAnalysis.imageAnalysis && (
                        <Card className="border-blue-200">
                          <CardHeader>
                            <CardTitle className="text-base">Image Analysis</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div><strong>Condition Assessment:</strong> {aiAnalysis.imageAnalysis.condition}</div>
                              <div><strong>Damage Summary:</strong> {aiAnalysis.imageAnalysis.damageSummary}</div>
                              <div><strong>Estimated Repair Cost:</strong> {aiAnalysis.imageAnalysis.repairEstimate}</div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {aiAnalysis.recommendation && (
                        <Card className="border-green-200">
                          <CardHeader>
                            <CardTitle className="text-base">AI Recommendation</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <strong>Action:</strong>
                                <Badge variant={aiAnalysis.recommendation.action === 'BUY' ? 'default' : 'secondary'}>
                                  {aiAnalysis.recommendation.action}
                                </Badge>
                              </div>
                              <div><strong>Confidence:</strong> {aiAnalysis.recommendation.confidence}%</div>
                              <div><strong>Reasoning:</strong> {aiAnalysis.recommendation.reasoning}</div>
                              {aiAnalysis.recommendation.estimatedValue && (
                                <div><strong>Estimated Value:</strong> {formatCurrency(aiAnalysis.recommendation.estimatedValue)}</div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : aiLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p>Running AI analysis...</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Click "AI Analysis" button to get AI-powered insights on this vehicle.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Image Viewer Modal */}
        {showImageViewer && lotData?.lot?.link_img_hd && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-6xl max-h-full">
              <img
                src={lotData.lot.link_img_hd[currentImageIndex]}
                alt={`Vehicle image ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
              
              {/* Close Button */}
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4"
                onClick={() => setShowImageViewer(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              {/* Navigation */}
              {lotData.lot.link_img_hd.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded">
                {currentImageIndex + 1} / {lotData.lot.link_img_hd.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}