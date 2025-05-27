import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  BarChart3,
  Target,
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AIAnalysisProps {
  lotData: any;
  platform: 'copart' | 'iaai';
}

interface AIAnalysisResult {
  recommendation: 'BUY' | 'AVOID' | 'MONITOR';
  confidence: number;
  estimatedValue: number;
  marketComparison: {
    platform: string;
    averagePrice: number;
    priceRange: { min: number; max: number };
    soldCount: number;
  }[];
  riskFactors: string[];
  opportunities: string[];
  crossPlatformInsights: {
    copartAverage?: number;
    iaaiAverage?: number;
    priceDifference?: number;
    betterPlatform?: string;
  };
  similarListings: {
    platform: string;
    lotId: string;
    price: number;
    condition: string;
    link?: string;
  }[];
}

export default function AILotAnalysis({ lotData, platform }: AIAnalysisProps) {
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);

  const analysisMutation = useMutation({
    mutationFn: async (): Promise<AIAnalysisResult> => {
      const response = await fetch('/api/ai-lot-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lotData,
          platform,
          analysisType: 'cross-platform-intelligence'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze lot');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
    },
  });

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY': return 'bg-green-100 text-green-800 border-green-200';
      case 'AVOID': return 'bg-red-100 text-red-800 border-red-200';
      case 'MONITOR': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card className="border-purple-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-950/50">
        <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
          <Brain className="h-5 w-5" />
          AI Cross-Platform Intelligence
          <Badge className="bg-purple-600 text-white">Platinum</Badge>
        </CardTitle>
        <CardDescription className="text-purple-700 dark:text-purple-300">
          Advanced AI analysis comparing prices across Copart and IAAI platforms
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {!analysisResult ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered Market Intelligence</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get comprehensive analysis including cross-platform price comparison, 
                risk assessment, and investment recommendations.
              </p>
              <Button 
                onClick={() => analysisMutation.mutate()}
                disabled={analysisMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {analysisMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Start AI Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Main Recommendation */}
            <div className="text-center">
              <Badge className={`text-lg py-2 px-4 ${getRecommendationColor(analysisResult.recommendation)}`}>
                {analysisResult.recommendation}
              </Badge>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Confidence: {Math.round(analysisResult.confidence * 100)}%
              </p>
            </div>

            {/* Estimated Value */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">AI Estimated Value</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(analysisResult.estimatedValue)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Cross-Platform Insights */}
            {analysisResult.crossPlatformInsights && (
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    Cross-Platform Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    {analysisResult.crossPlatformInsights.copartAverage && (
                      <div className="text-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <p className="text-sm text-blue-600 dark:text-blue-400">Copart Average</p>
                        <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                          {formatCurrency(analysisResult.crossPlatformInsights.copartAverage)}
                        </p>
                      </div>
                    )}
                    {analysisResult.crossPlatformInsights.iaaiAverage && (
                      <div className="text-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">IAAI Average</p>
                        <p className="text-lg font-bold text-red-800 dark:text-red-200">
                          {formatCurrency(analysisResult.crossPlatformInsights.iaaiAverage)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {analysisResult.crossPlatformInsights.priceDifference && (
                    <div className="text-center p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">Price Difference</p>
                      <p className="text-lg font-bold text-yellow-800 dark:text-yellow-200">
                        {formatCurrency(Math.abs(analysisResult.crossPlatformInsights.priceDifference))}
                        {analysisResult.crossPlatformInsights.betterPlatform && (
                          <span className="text-sm ml-2">
                            ({analysisResult.crossPlatformInsights.betterPlatform} cheaper)
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Market Comparison */}
            {analysisResult.marketComparison && analysisResult.marketComparison.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Market Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisResult.marketComparison.map((market, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{market.platform}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {market.soldCount} sold vehicles
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(market.averagePrice)}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatCurrency(market.priceRange.min)} - {formatCurrency(market.priceRange.max)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Risk Factors & Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisResult.riskFactors && analysisResult.riskFactors.length > 0 && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-red-700 dark:text-red-300">
                      <AlertTriangle className="h-5 w-5" />
                      Risk Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysisResult.riskFactors.map((risk, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-red-700 dark:text-red-300">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {analysisResult.opportunities && analysisResult.opportunities.length > 0 && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-300">
                      <Lightbulb className="h-5 w-5" />
                      Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysisResult.opportunities.map((opportunity, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-green-700 dark:text-green-300">{opportunity}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Similar Active Listings */}
            {analysisResult.similarListings && analysisResult.similarListings.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Similar Active Listings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisResult.similarListings.map((listing, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {listing.platform}
                            </Badge>
                            <span className="font-medium">Lot #{listing.lotId}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Condition: {listing.condition}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg">{formatCurrency(listing.price)}</span>
                          {listing.link && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={listing.link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Re-analyze Button */}
            <div className="text-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setAnalysisResult(null);
                  analysisMutation.mutate();
                }}
                disabled={analysisMutation.isPending}
              >
                <Brain className="h-4 w-4 mr-2" />
                Re-analyze
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}