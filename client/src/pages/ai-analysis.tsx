import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Brain, 
  Search, 
  TrendingUp,
  BarChart3,
  Eye,
  AlertCircle,
  DollarSign,
  Car,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

interface LotData {
  lot_id?: number;
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  series?: string;
  trim?: string;
  odometer?: number;
  damage_pr?: string;
  damage_sec?: string;
  vehicle_damage?: string;
  color?: string;
  fuel?: string;
  transmission?: string;
  drive?: string;
  status?: string;
  keys?: string;
  title?: string;
  location?: string;
  link_img_hd?: string[];
  base_site?: string;
  current_bid?: number;
  reserve_price?: number;
  cost_priced?: number;
}

interface AIAnalysisRequest {
  lotData: LotData;
  comparableVehicles: any[];
  analysisType: 'market_valuation' | 'damage_assessment' | 'investment_potential' | 'comprehensive';
}

interface AIAnalysisResponse {
  marketValuation?: {
    estimatedValue: number;
    confidence: number;
    priceRange: { low: number; high: number };
    marketTrend: 'rising' | 'stable' | 'declining';
  };
  insights: string[];
  recommendations: string[];
  confidence: number;
}

export default function AIAnalysis() {
  const { user, hasPermission } = useAuth();
  const [location] = useLocation();
  const [lotData, setLotData] = useState<LotData | null>(null);
  const [analysisType, setAnalysisType] = useState<'market_valuation' | 'damage_assessment' | 'investment_potential' | 'comprehensive'>('comprehensive');
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isSearchingComparables, setIsSearchingComparables] = useState(false);
  const [comparableVehicles, setComparableVehicles] = useState<any[]>([]);

  // Get lot data from URL parameters or localStorage (passed from Live Lot pages)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const lotParam = urlParams.get('lot');
    
    if (lotParam) {
      try {
        const decodedLot = JSON.parse(decodeURIComponent(lotParam));
        setLotData(decodedLot);
      } catch (error) {
        console.error('Error parsing lot data:', error);
      }
    } else {
      // Try to get from localStorage (fallback)
      const storedLot = localStorage.getItem('selectedLotForAnalysis');
      if (storedLot) {
        try {
          const parsedLot = JSON.parse(storedLot);
          setLotData(parsedLot);
          localStorage.removeItem('selectedLotForAnalysis');
        } catch (error) {
          console.error('Error parsing stored lot data:', error);
        }
      }
    }
  }, [location]);

  // Check if user has AI Analysis permissions
  if (!hasPermission('FULL_ANALYTICS')) {
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
              AI-powered vehicle analysis is available for Gold members and above.
            </p>
            <Badge variant="outline">Upgrade to Gold</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Search for comparable vehicles in your dataset
  const searchComparables = async () => {
    if (!lotData?.make || !lotData?.model) return;
    
    setIsSearchingComparables(true);
    try {
      const searchParams = {
        make: lotData.make,
        model: lotData.model,
        series: lotData.series || lotData.trim,
        yearFrom: lotData.year ? lotData.year - 2 : 2020,
        yearTo: lotData.year ? lotData.year + 2 : 2025,
        damageType: lotData.damage_pr || lotData.vehicle_damage,
        maxMileage: lotData.odometer ? Math.round(lotData.odometer * 1.3) : undefined,
        sites: hasPermission('CROSS_PLATFORM_SEARCH') ? ['copart', 'iaai'] : [lotData.base_site || 'copart']
      };

      const response = await fetch('/api/find-comparables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchParams)
      });
      
      const data = await response.json();
      if (data.success && data.data?.comparables) {
        setComparableVehicles(data.data.comparables);
      }
    } catch (error) {
      console.error('Error searching comparables:', error);
    } finally {
      setIsSearchingComparables(false);
    }
  };

  // AI Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async () => {
      if (!lotData) throw new Error('No lot data available');
      
      const request: AIAnalysisRequest = {
        lotData,
        comparableVehicles,
        analysisType
      };

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

  const handleAnalyze = async () => {
    if (!lotData) return;
    
    // First search for comparables if we haven't already
    if (comparableVehicles.length === 0) {
      await searchComparables();
    }
    
    // Then run AI analysis
    analysisMutation.mutate();
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
            AI-powered analysis using live lot data and your dataset comparables
          </p>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          {hasPermission('CROSS_PLATFORM_SEARCH') ? 'Premium AI' : 'Standard AI'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analysis Input Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Information from Live Lot */}
          {lotData ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Live Lot Vehicle Details
                </CardTitle>
                <CardDescription>
                  Vehicle information from {lotData.base_site?.toUpperCase() || 'Live Lot'} - Lot #{lotData.lot_id}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Make</Label>
                    <p className="text-lg font-semibold">{lotData.make || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Model</Label>
                    <p className="text-lg font-semibold">{lotData.model || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Year</Label>
                    <p className="text-lg font-semibold">{lotData.year || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Mileage</Label>
                    <p className="text-lg font-semibold">{lotData.odometer?.toLocaleString() || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Primary Damage</Label>
                    <p className="text-lg font-semibold">{lotData.damage_pr || lotData.vehicle_damage || 'N/A'}</p>
                  </div>
                </div>

                {lotData.damage_sec && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                    <Label className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Secondary Damage</Label>
                    <p className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">{lotData.damage_sec}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <AlertCircle className="h-5 w-5" />
                  No Lot Data Available
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-700 dark:text-amber-300 mb-4">
                  AI Analysis works best with live lot data. Please visit a Live Lot page (Copart or IAAI) and click "AI Analysis" from there.
                </p>
                <Button variant="outline" onClick={() => window.location.href = '/live-copart'}>
                  Go to Live Copart
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Comparable Vehicles Section */}
          {lotData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Dataset Search & Comparables
                </CardTitle>
                <CardDescription>
                  Find similar vehicles in your database for AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={searchComparables}
                  disabled={isSearchingComparables}
                  className="w-full"
                  variant="outline"
                >
                  {isSearchingComparables ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching Database...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search for Comparable Vehicles
                    </>
                  )}
                </Button>
                
                {comparableVehicles.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-200">
                        Found {comparableVehicles.length} comparable vehicles
                      </span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Ready for AI analysis with market data comparison
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Analysis Type */}
          {lotData && (
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
                      description: 'Get current market value and pricing trends',
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
                      description: 'Evaluate profit potential and risks',
                      icon: TrendingUp
                    },
                    {
                      id: 'comprehensive',
                      title: 'Comprehensive Analysis',
                      description: 'Complete analysis with all insights',
                      icon: Brain
                    }
                  ].map((type) => {
                    const Icon = type.icon;
                    return (
                      <Card 
                        key={type.id}
                        className={`cursor-pointer transition-all ${
                          analysisType === type.id 
                            ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950/20' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => setAnalysisType(type.id as any)}
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
          )}

          {/* Analyze Button */}
          {lotData && (
            <Button 
              onClick={handleAnalyze}
              disabled={!lotData || analysisMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              {analysisMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Running AI Analysis...
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5 mr-2" />
                  Generate AI Analysis with Dataset Comparables
                </>
              )}
            </Button>
          )}
        </div>

        {/* Analysis Results */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-4">
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
          </div>

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
                          <CheckCircle className="h-3 w-3 mt-1 text-purple-500 flex-shrink-0" />
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
                  <span>Visit a Live Lot page (Copart/IAAI)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-purple-100 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">2</span>
                  <span>Click "AI Analysis" from the lot details</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-purple-100 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">3</span>
                  <span>Get comprehensive AI insights</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}