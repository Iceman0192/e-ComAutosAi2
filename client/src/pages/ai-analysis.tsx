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
  XCircle
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
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

  const updateMarketData = (field: string, value: any) => {
    setAnalysisRequest(prev => ({
      ...prev,
      marketData: {
        ...prev.marketData,
        [field]: value
      }
    }));
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
            Advanced AI-powered insights for vehicle valuation, damage assessment, and investment analysis
          </p>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          {hasPermission('CROSS_PLATFORM_SEARCH') ? 'Premium AI' : 'Standard AI'}
        </Badge>
      </div>

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
                Enter vehicle details for analysis
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

          {/* Analysis Type */}
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

          {/* Custom Prompt (Premium feature) */}
          {hasPermission('CROSS_PLATFORM_SEARCH') && (
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
          )}

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
                    <div className="flex items-center justify-center gap-2">
                      <TrendingUp className={`h-4 w-4 ${
                        analysisResult.marketValuation.marketTrend === 'rising' ? 'text-green-500' :
                        analysisResult.marketValuation.marketTrend === 'declining' ? 'text-red-500' : 'text-gray-500'
                      }`} />
                      <span className="text-sm capitalize">{analysisResult.marketValuation.marketTrend} Market</span>
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

              {/* Recommendations */}
              {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysisResult.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 mt-1 text-green-500 flex-shrink-0" />
                          <span>{rec}</span>
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
          {!hasAnalyzed && !analysisMutation.isPending && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-2">
                  <span className="bg-purple-100 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">1</span>
                  <span>Enter vehicle details</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-purple-100 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">2</span>
                  <span>Choose analysis type</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-purple-100 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">3</span>
                  <span>Get AI-powered insights</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}