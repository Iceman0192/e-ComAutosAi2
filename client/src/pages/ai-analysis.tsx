import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Search, 
  Zap,
  TrendingUp,
  BarChart3,
  Eye,
  FileText,
  AlertCircle,
  DollarSign,
  Calendar,
  MapPin,
  Car,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Image,
  Key,
  Gauge,
  Wrench
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

interface AIAnalysisRequest {
  vehicleData?: {
    make?: string;
    model?: string;
    year?: number;
    mileage?: number;
    damage?: string;
    images?: string[];
  };
  marketData?: {
    platform?: 'copart' | 'iaai' | 'both';
    priceRange?: {
      min: number;
      max: number;
    };
    location?: string;
  };
  analysisType: 'market_valuation' | 'damage_assessment' | 'investment_potential' | 'comprehensive';
  prompt?: string;
}

interface AIAnalysisResponse {
  marketValuation?: {
    estimatedValue: number;
    confidence: number;
    priceRange: {
      low: number;
      high: number;
    };
    marketTrend: 'rising' | 'stable' | 'declining';
  };
  damageAssessment?: {
    severity: 'minor' | 'moderate' | 'severe' | 'total_loss';
    repairCost: number;
    impactOnValue: number;
    recommendations: string[];
  };
  investmentAnalysis?: {
    profitPotential: number;
    riskLevel: 'low' | 'medium' | 'high';
    timeToSell: number;
    marketDemand: number;
  };
  insights: string[];
  recommendations: string[];
  confidence: number;
}

export default function AIAnalysis() {
  const { user, hasPermission } = useAuth();
  const [analysisRequest, setAnalysisRequest] = useState<AIAnalysisRequest>({
    analysisType: 'comprehensive'
  });
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  
  // Live lot lookup states
  const [activeTab, setActiveTab] = useState('ai-analysis');
  const [copartLotId, setCopartLotId] = useState('');
  const [iaaiLotId, setIaaiLotId] = useState('');
  const [copartSearchTriggered, setCopartSearchTriggered] = useState(false);
  const [iaaiSearchTriggered, setIaaiSearchTriggered] = useState(false);

  // Check if user has AI Analysis permissions (Platinum exclusive)
  if (!hasPermission('CROSS_PLATFORM_SEARCH')) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              AI-powered vehicle analysis with live lot lookup is exclusively available for Platinum members.
            </p>
            <Badge variant="outline">Upgrade to Platinum</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Live lot lookup queries
  const { data: copartLotData, isLoading: copartLoading } = useQuery({
    queryKey: ['/api/live-copart', copartLotId],
    enabled: !!copartLotId && copartSearchTriggered,
  });

  const { data: iaaiLotData, isLoading: iaaiLoading } = useQuery({
    queryKey: ['/api/live-iaai', iaaiLotId],
    enabled: !!iaaiLotId && iaaiSearchTriggered,
  });

  // AI Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async (request: AIAnalysisRequest) => {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      return response.json();
    },
    onSuccess: () => {
      setHasAnalyzed(true);
      queryClient.invalidateQueries({ queryKey: ['/api/ai-analysis'] });
    }
  });

  const handleAnalyze = () => {
    if (!analysisRequest.vehicleData?.make || !analysisRequest.vehicleData?.model) {
      return;
    }
    analysisMutation.mutate(analysisRequest);
  };

  const updateVehicleData = (field: string, value: any) => {
    setAnalysisRequest(prev => ({
      ...prev,
      vehicleData: {
        ...prev.vehicleData,
        [field]: value
      }
    }));
  };

  // Helper functions for live lot search
  const handleCopartSearch = () => {
    if (copartLotId.trim()) {
      setCopartSearchTriggered(true);
    }
  };

  const handleIaaiSearch = () => {
    if (iaaiLotId.trim()) {
      setIaaiSearchTriggered(true);
    }
  };

  const loadVehicleFromLot = (lotData: any, platform: 'copart' | 'iaai') => {
    if (lotData?.lot) {
      setAnalysisRequest(prev => ({
        ...prev,
        vehicleData: {
          make: lotData.lot.make || '',
          model: lotData.lot.model || '',
          year: lotData.lot.year || 0,
          mileage: lotData.lot.odometer || 0,
          damage: lotData.lot.damage_pr || lotData.lot.damage_primary || lotData.lot.vehicle_damage || '',
          images: lotData.lot.link_img_hd || []
        },
        marketData: {
          platform: platform
        }
      }));
      setActiveTab('ai-analysis');
    }
  };

  const analysisResult = analysisMutation.data as AIAnalysisResponse;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            AI Vehicle Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Advanced AI-powered insights with live lot analysis for both Copart & IAAI platforms
          </p>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          Platinum Exclusive
        </Badge>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ai-analysis" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Analysis
          </TabsTrigger>
          <TabsTrigger value="copart-live" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Live Copart
          </TabsTrigger>
          <TabsTrigger value="iaai-live" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Live IAAI
          </TabsTrigger>
        </TabsList>

        {/* AI Analysis Tab */}
        <TabsContent value="ai-analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Analysis Input Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Vehicle Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Vehicle Information
                  </CardTitle>
                  <CardDescription>
                    Enter vehicle details for analysis or load from live lot lookup
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="make">Make *</Label>
                      <Input
                        id="make"
                        placeholder="Toyota"
                        value={analysisRequest.vehicleData?.make || ''}
                        onChange={(e) => updateVehicleData('make', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="model">Model *</Label>
                      <Input
                        id="model"
                        placeholder="Camry"
                        value={analysisRequest.vehicleData?.model || ''}
                        onChange={(e) => updateVehicleData('model', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="year">Year *</Label>
                      <Input
                        id="year"
                        type="number"
                        placeholder="2020"
                        value={analysisRequest.vehicleData?.year || ''}
                        onChange={(e) => updateVehicleData('year', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="mileage">Mileage</Label>
                      <Input
                        id="mileage"
                        type="number"
                        placeholder="50000"
                        value={analysisRequest.vehicleData?.mileage || ''}
                        onChange={(e) => updateVehicleData('mileage', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="damage">Damage Type</Label>
                      <Select onValueChange={(value) => updateVehicleData('damage', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select damage type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="front_end">Front End</SelectItem>
                          <SelectItem value="rear_end">Rear End</SelectItem>
                          <SelectItem value="side">Side</SelectItem>
                          <SelectItem value="all_over">All Over</SelectItem>
                          <SelectItem value="water_flood">Water/Flood</SelectItem>
                          <SelectItem value="burn">Burn</SelectItem>
                          <SelectItem value="theft">Theft</SelectItem>
                          <SelectItem value="minor_dents">Minor Dent/Scratches</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Custom Prompt (Premium feature) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Custom Analysis Prompt
                    <Badge variant="secondary" className="ml-2">Premium</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Ask specific questions about this vehicle or request custom analysis..."
                    value={analysisRequest.prompt || ''}
                    onChange={(e) => setAnalysisRequest(prev => ({ ...prev, prompt: e.target.value }))}
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* Analyze Button */}
              <Button 
                onClick={handleAnalyze}
                disabled={!analysisRequest.vehicleData?.make || !analysisRequest.vehicleData?.model || analysisMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {analysisMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing Vehicle...
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5 mr-2" />
                    Generate AI Analysis
                  </>
                )}
              </Button>
            </div>

            {/* Analysis Results */}
            <div className="space-y-6">
              {/* Analysis Status */}
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-purple-600 dark:text-purple-400">
                    AI Analysis Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {analysisMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                        <span className="text-sm text-yellow-600">Processing...</span>
                      </>
                    ) : analysisMutation.isSuccess ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">Analysis Complete</span>
                      </>
                    ) : analysisMutation.isError ? (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600">Analysis Failed</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Ready to Analyze</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Results */}
              {analysisResult && (
                <div className="space-y-4">
                  {/* Market Valuation */}
                  {analysisResult.marketValuation && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600">
                          <DollarSign className="h-4 w-4" />
                          Market Valuation
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            ${analysisResult.marketValuation.estimatedValue.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">Estimated Value</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <p className="font-medium">${analysisResult.marketValuation.priceRange.low.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">Low Range</p>
                          </div>
                          <div>
                            <p className="font-medium">${analysisResult.marketValuation.priceRange.high.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">High Range</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Key Insights */}
                  {analysisResult.insights && analysisResult.insights.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          AI Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysisResult.insights.map((insight, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Zap className="h-3 w-3 mt-1 text-purple-500 flex-shrink-0" />
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Live Copart Tab */}
        <TabsContent value="copart-live" className="space-y-6">
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <Car className="h-5 w-5" />
                Live Copart Lot Analysis
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                Search for live Copart lots and analyze with AI
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter Copart Lot ID (e.g., 53678645)"
                  value={copartLotId}
                  onChange={(e) => setCopartLotId(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleCopartSearch}
                  disabled={!copartLotId.trim() || copartLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {copartLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Search Lot
                </Button>
              </div>

              {copartLotData?.lot && (
                <Card className="mt-4">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">
                          {copartLotData.lot.year} {copartLotData.lot.make} {copartLotData.lot.model}
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Gauge className="h-3 w-3" />
                            <span>{copartLotData.lot.odometer?.toLocaleString()} miles</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>{copartLotData.lot.damage_pr}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{copartLotData.lot.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Key className="h-3 w-3" />
                            <span>Keys: {copartLotData.lot.keys}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button 
                          onClick={() => loadVehicleFromLot(copartLotData, 'copart')}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          Analyze with AI
                        </Button>
                        {copartLotData.lot.link && (
                          <Button variant="outline" asChild>
                            <a href={copartLotData.lot.link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View on Copart
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live IAAI Tab */}
        <TabsContent value="iaai-live" className="space-y-6">
          <Card className="border-red-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50">
              <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
                <Search className="h-5 w-5" />
                Live IAAI Lot Analysis
              </CardTitle>
              <CardDescription className="text-red-700 dark:text-red-300">
                Search for live IAAI lots and analyze with AI
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter IAAI Stock Number (e.g., 12345678)"
                  value={iaaiLotId}
                  onChange={(e) => setIaaiLotId(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleIaaiSearch}
                  disabled={!iaaiLotId.trim() || iaaiLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {iaaiLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Search Lot
                </Button>
              </div>

              {iaaiLotData?.lot && (
                <Card className="mt-4">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">
                          {iaaiLotData.lot.year} {iaaiLotData.lot.make} {iaaiLotData.lot.model}
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Gauge className="h-3 w-3" />
                            <span>{iaaiLotData.lot.vehicle_mileage?.toLocaleString()} miles</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>{iaaiLotData.lot.vehicle_damage}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{iaaiLotData.lot.auction_location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Key className="h-3 w-3" />
                            <span>Keys: {iaaiLotData.lot.vehicle_has_keys ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button 
                          onClick={() => loadVehicleFromLot(iaaiLotData, 'iaai')}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          Analyze with AI
                        </Button>
                        {iaaiLotData.lot.link && (
                          <Button variant="outline" asChild>
                            <a href={iaaiLotData.lot.link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View on IAAI
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}