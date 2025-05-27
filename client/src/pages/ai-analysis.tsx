import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { 
  Brain, 
  ArrowLeft, 
  Car, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Target,
  BarChart3,
  Eye,
  Zap
} from 'lucide-react';

interface AIAnalysisData {
  vehicleAssessment: {
    damageAnalysis: string;
    repairEstimate: string;
    exportSuitability: string;
    riskFactors: string[];
  };
  crossPlatformIntelligence: {
    copartData: any[];
    iaaiData: any[];
    priceComparison: {
      copartAverage: number;
      iaaiAverage: number;
      difference: number;
      percentage: number;
    };
    volumeAnalysis: {
      copartCount: number;
      iaaiCount: number;
    };
  };
  recommendation: {
    decision: 'BUY' | 'PASS' | 'CAUTION';
    confidence: number;
    reasoning: string;
    estimatedProfit: number;
    profitMargin: number;
  };
  marketIntelligence: {
    trends: string;
    seasonality: string;
    exportInsights: string;
  };
}

export default function AIAnalysis() {
  const { user, hasPermission } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/ai-analysis');
  
  // Extract URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const platform = urlParams.get('platform');
  const lotId = urlParams.get('lotId');
  const vin = urlParams.get('vin');
  const year = urlParams.get('year');
  const make = urlParams.get('make');
  const model = urlParams.get('model');
  const mileage = urlParams.get('mileage');
  const damage = urlParams.get('damage');
  const images = urlParams.get('images')?.split(',') || [];

  const [analysisStage, setAnalysisStage] = useState<'initializing' | 'analyzing' | 'complete' | 'error'>('initializing');

  // Check if user has Platinum access
  if (!hasPermission('AI_ANALYSIS')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6 text-center">
            <Brain className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">AI Analysis - Platinum Feature</h2>
            <p className="text-gray-600 mb-4">
              Advanced AI-powered vehicle analysis is available for Platinum members only.
            </p>
            <Button onClick={() => setLocation('/pricing')}>
              Upgrade to Platinum
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Validate required parameters
  if (!platform || !lotId || !vin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-16 w-16 mx-auto text-red-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Invalid Analysis Request</h2>
            <p className="text-gray-600 mb-4">
              Missing required vehicle data for analysis. Please start from a live lot page.
            </p>
            <Button onClick={() => setLocation(`/live-${platform}`)}>
              Go to Live Lot Search
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch AI analysis data
  const { data: analysisResponse, isLoading, error } = useQuery({
    queryKey: ['/api/ai-analysis', { platform, lotId, vin, year, make, model, mileage, damage }],
    queryFn: async () => {
      setAnalysisStage('analyzing');
      const response = await apiRequest('POST', '/api/ai-analysis', {
        platform,
        lotId,
        vin,
        vehicleData: {
          year: parseInt(year || '0'),
          make,
          model,
          mileage: parseInt(mileage || '0'),
          damage,
          images
        }
      });
      setAnalysisStage('complete');
      return response;
    },
    enabled: !!platform && !!lotId && !!vin,
  });

  const analysisData = analysisResponse?.data;

  useEffect(() => {
    if (error) {
      setAnalysisStage('error');
    }
  }, [error]);

  const getRecommendationColor = (decision: string) => {
    switch (decision) {
      case 'BUY': return 'bg-green-100 text-green-800 border-green-200';
      case 'PASS': return 'bg-red-100 text-red-800 border-red-200';
      case 'CAUTION': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRecommendationIcon = (decision: string) => {
    switch (decision) {
      case 'BUY': return <CheckCircle className="h-5 w-5" />;
      case 'PASS': return <XCircle className="h-5 w-5" />;
      case 'CAUTION': return <AlertTriangle className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation(`/live-${platform}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Live Search
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-purple-600" />
              AI Vehicle Analysis
            </h1>
            <p className="text-gray-600">
              Advanced cross-platform intelligence for {year} {make} {model}
            </p>
          </div>
        </div>
        <Badge className={`px-3 py-1 ${platform === 'copart' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
          {platform?.toUpperCase()} LOT #{lotId}
        </Badge>
      </div>

      {/* Vehicle Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">VIN</p>
              <p className="font-mono text-sm">{vin}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Year/Make/Model</p>
              <p className="font-semibold">{year} {make} {model}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Mileage</p>
              <p className="font-semibold">{parseInt(mileage || '0').toLocaleString()} mi</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Primary Damage</p>
              <p className="font-semibold">{damage}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Progress */}
      {analysisStage !== 'complete' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-4">
              {analysisStage === 'initializing' && (
                <>
                  <Zap className="h-6 w-6 text-purple-600 animate-pulse" />
                  <span className="text-lg font-semibold">Initializing AI Analysis...</span>
                </>
              )}
              {analysisStage === 'analyzing' && (
                <>
                  <Eye className="h-6 w-6 text-blue-600 animate-pulse" />
                  <span className="text-lg font-semibold">AI Analyzing Vehicle Data & Images...</span>
                </>
              )}
              {analysisStage === 'error' && (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  <span className="text-lg font-semibold text-red-600">Analysis Failed</span>
                </>
              )}
            </div>
            {analysisStage === 'analyzing' && (
              <div className="mt-4 space-y-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Analyzing images, searching cross-platform database, generating insights...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysisData && analysisStage === 'complete' && (
        <>
          {/* Recommendation Card */}
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                AI Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getRecommendationColor(analysisData.recommendation?.decision || 'CAUTION')}`}>
                  {getRecommendationIcon(analysisData.recommendation?.decision || 'CAUTION')}
                  <span className="font-bold text-lg">{analysisData.recommendation?.decision || 'ANALYZING'}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Confidence</p>
                  <p className="text-2xl font-bold">{analysisData.recommendation?.confidence || 0}%</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">{analysisData.recommendation?.reasoning || 'Analysis in progress...'}</p>
              {analysisData.recommendation?.estimatedProfit && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600">Estimated Profit</p>
                    <p className="text-xl font-bold text-green-600">
                      ${analysisData.recommendation.estimatedProfit.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Profit Margin</p>
                    <p className="text-xl font-bold text-green-600">
                      {analysisData.recommendation.profitMargin}%
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cross-Platform Intelligence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Cross-Platform Price Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisData.crossPlatformIntelligence && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600 font-semibold">COPART AVERAGE</p>
                        <p className="text-2xl font-bold text-blue-800">
                          ${analysisData.crossPlatformIntelligence.priceComparison?.copartAverage?.toLocaleString() || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {analysisData.crossPlatformIntelligence.volumeAnalysis?.copartCount || 0} vehicles
                        </p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-600 font-semibold">IAAI AVERAGE</p>
                        <p className="text-2xl font-bold text-red-800">
                          ${analysisData.crossPlatformIntelligence.priceComparison?.iaaiAverage?.toLocaleString() || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {analysisData.crossPlatformIntelligence.volumeAnalysis?.iaaiCount || 0} vehicles
                        </p>
                      </div>
                    </div>
                    {analysisData.crossPlatformIntelligence.priceComparison?.difference && (
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-600 font-semibold">PRICE DIFFERENCE</p>
                        <p className="text-xl font-bold text-purple-800">
                          ${Math.abs(analysisData.crossPlatformIntelligence.priceComparison.difference).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {analysisData.crossPlatformIntelligence.priceComparison.percentage > 0 ? 'IAAI Higher' : 'Copart Higher'} by {Math.abs(analysisData.crossPlatformIntelligence.priceComparison.percentage)}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Damage Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">AI Damage Analysis</h4>
                    <p className="text-gray-700">{analysisData.vehicleAssessment?.damageAnalysis || 'Analyzing vehicle condition...'}</p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Repair Estimate</h4>
                    <p className="text-gray-700">{analysisData.vehicleAssessment?.repairEstimate || 'Calculating repair costs...'}</p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Export Suitability</h4>
                    <p className="text-gray-700">{analysisData.vehicleAssessment?.exportSuitability || 'Evaluating export potential...'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Intelligence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Market Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Market Trends</h4>
                  <p className="text-gray-700">{analysisData.marketIntelligence?.trends || 'Analyzing market trends...'}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Seasonality</h4>
                  <p className="text-gray-700">{analysisData.marketIntelligence?.seasonality || 'Evaluating seasonal patterns...'}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Export Insights</h4>
                  <p className="text-gray-700">{analysisData.marketIntelligence?.exportInsights || 'Generating export market insights...'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
            <h3 className="text-xl font-bold text-red-600 mb-2">Analysis Failed</h3>
            <p className="text-gray-600 mb-4">
              Unable to complete AI analysis. Please try again or contact support.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry Analysis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}