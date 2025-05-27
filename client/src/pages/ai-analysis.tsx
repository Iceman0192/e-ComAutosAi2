import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Car,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink
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
    comparables?: any;
    crossPlatformAnalysis?: boolean;
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

  // Extract lot data from API response
  const lotData = copartLotData?.lot || iaaiLotData?.lot;
  
  // Automatically fetch cross-platform comparables when lot data is loaded
  const { data: comparableData, isLoading: comparableLoading } = useQuery({
    queryKey: ['/api/find-comparables', lotData?.make, lotData?.model, lotData?.year],
    enabled: !!lotData,
    queryFn: () => {
      const searchParams = {
        make: lotData.make,
        model: lotData.model,
        yearFrom: lotData.year - 1,
        yearTo: lotData.year + 1,
        damageType: lotData.damage_pr || lotData.vehicle_damage || '',
        maxMileage: Math.round((lotData.odometer || lotData.vehicle_mileage) * 1.2),
        sites: ['copart', 'iaai'] // Always search both platforms for Platinum users
      };
      
      return fetch('/api/find-comparables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchParams)
      }).then(res => res.json());
    }
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
    if (!lotData) {
      return;
    }

    // Prepare comprehensive analysis request with lot data and cross-platform comparables
    const requestData = {
      ...analysisRequest,
      vehicleData: {
        make: lotData.make || '',
        model: lotData.model || '',
        year: lotData.year || 0,
        mileage: lotData.odometer || lotData.vehicle_mileage || 0,
        damage: lotData.damage_pr || lotData.vehicle_damage || '',
        images: lotData.link_img_hd || []
      },
      marketData: {
        platform: copartLotData?.lot ? 'copart' as const : iaaiLotData?.lot ? 'iaai' as const : 'both' as const,
        comparables: comparableData || null,
        crossPlatformAnalysis: true
      }
    };

    analysisMutation.mutate(requestData);
  };

  // Helper functions for live lot search
  const handleCopartSearch = () => {
    if (copartLotId.trim()) {
      setCopartSearchTriggered(true);
      setIaaiSearchTriggered(false); // Reset other search
    }
  };

  const handleIaaiSearch = () => {
    if (iaaiLotId.trim()) {
      setIaaiSearchTriggered(true);
      setCopartSearchTriggered(false); // Reset other search
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
            Advanced AI-powered insights with automatic cross-platform comparable search for both Copart & IAAI
          </p>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          Platinum Exclusive
        </Badge>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analysis Input Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Lot Analysis Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Live Lot Analysis with Cross-Platform Search
              </CardTitle>
              <CardDescription>
                Search for live lots from Copart or IAAI - automatically finds comparables from both platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Copart Search */}
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Copart Lot Search
                </h4>
                <div className="flex gap-3">
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
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* IAAI Search */}
              <div className="border border-red-200 rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
                <h4 className="font-medium text-red-900 dark:text-red-100 mb-3 flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  IAAI Lot Search
                </h4>
                <div className="flex gap-3">
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
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Display Loaded Vehicle Data with Cross-Platform Status */}
              {lotData && (
                <div className="border border-green-200 rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Vehicle Loaded for Analysis
                  </h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Vehicle:</strong> {lotData.year} {lotData.make} {lotData.model}</p>
                    <p><strong>Mileage:</strong> {(lotData.odometer || lotData.vehicle_mileage)?.toLocaleString()} miles</p>
                    <p><strong>Damage:</strong> {lotData.damage_pr || lotData.vehicle_damage}</p>
                    <p><strong>Location:</strong> {lotData.location || lotData.auction_location}</p>
                  </div>
                  
                  {/* Cross-Platform Comparable Search Status */}
                  {comparableLoading && (
                    <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-950/20 rounded border border-purple-200">
                      <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-xs">Automatically searching cross-platform comparables on both Copart & IAAI...</span>
                      </div>
                    </div>
                  )}
                  
                  {comparableData && !comparableLoading && (
                    <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-950/20 rounded border border-purple-200">
                      <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-xs">Found {comparableData.total || 0} comparable vehicles across both platforms ready for AI analysis</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analysis Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    id: 'market_valuation',
                    title: 'Market Valuation',
                    description: 'Get current market value using cross-platform data',
                    icon: DollarSign
                  },
                  {
                    id: 'damage_assessment',
                    title: 'Damage Assessment',
                    description: 'Analyze damage impact on vehicle value',
                    icon: AlertCircle
                  },
                  {
                    id: 'investment_potential',
                    title: 'Investment Analysis',
                    description: 'Evaluate profit potential using comparable sales',
                    icon: TrendingUp
                  },
                  {
                    id: 'comprehensive',
                    title: 'Comprehensive Analysis',
                    description: 'Complete cross-platform analysis with all insights',
                    icon: Brain
                  }
                ].map((type) => {
                  const Icon = type.icon;
                  return (
                    <Card 
                      key={type.id}
                      className={`cursor-pointer transition-all ${
                        analysisRequest.analysisType === type.id 
                          ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950/20' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => setAnalysisRequest(prev => ({ ...prev, analysisType: type.id as any }))}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 text-purple-600 mt-1" />
                          <div>
                            <h3 className="font-medium text-sm">{type.title}</h3>
                            <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Custom Prompt */}
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
                placeholder="Ask specific questions about this vehicle or request custom analysis with cross-platform comparison..."
                value={analysisRequest.prompt || ''}
                onChange={(e) => setAnalysisRequest(prev => ({ ...prev, prompt: e.target.value }))}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Analyze Button */}
          <Button 
            onClick={handleAnalyze}
            disabled={!lotData || analysisMutation.isPending || comparableLoading}
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            {analysisMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyzing Vehicle with Cross-Platform Data...
              </>
            ) : comparableLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Loading Cross-Platform Comparables...
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
                    <span className="text-sm text-yellow-600">Processing with cross-platform data...</span>
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
                      Cross-Platform Market Valuation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        ${analysisResult.marketValuation.estimatedValue.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">Estimated Value</p>
                    </div>
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

              {/* AI Insights */}
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

          {/* Error State */}
          {analysisMutation.isError && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    Analysis failed. Please check your vehicle details and try again.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Getting Started */}
          {!hasAnalyzed && !analysisMutation.isPending && !lotData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-2">
                  <span className="bg-purple-100 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">1</span>
                  <span>Search for a live lot from Copart or IAAI</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-purple-100 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">2</span>
                  <span>System automatically finds cross-platform comparables</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-purple-100 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">3</span>
                  <span>Choose analysis type and get AI-powered insights</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}