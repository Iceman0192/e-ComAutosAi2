import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, XCircle, BarChart3, Eye, Zap } from 'lucide-react';

interface AIAnalysisProps {
  vehicleData: {
    year: number;
    make: string;
    model: string;
    currentBid: number;
    damage: string;
    images: string[];
    site: number;
    vin: string;
    color: string;
    odometer: number;
  };
}

export function AIAnalysis({ vehicleData }: AIAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: aiAnalysis, error, refetch } = useQuery({
    queryKey: ['ai-analysis', vehicleData],
    queryFn: async () => {
      setIsAnalyzing(true);
      try {
        const response = await apiRequest('POST', '/api/ai-lot-analysis', { vehicleData });
        return response;
      } finally {
        setIsAnalyzing(false);
      }
    },
    enabled: false, // Manual trigger
  });

  const handleAnalyze = () => {
    refetch();
  };

  const getActionBadge = (action: string) => {
    if (action === 'BUY') {
      return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />BUY</Badge>;
    }
    if (action === 'PASS') {
      return <Badge className="bg-red-500 text-white"><XCircle className="h-3 w-3 mr-1" />PASS</Badge>;
    }
    return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />ANALYZE</Badge>;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="border-purple-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-950/50">
          <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
            <Brain className="h-6 w-6" />
            AI Cross-Platform Analysis
            <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Platinum Feature
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{vehicleData.year} {vehicleData.make} {vehicleData.model}</h3>
              <p className="text-muted-foreground">Current Bid: ${vehicleData.currentBid.toLocaleString()}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{vehicleData.damage}</Badge>
                <Badge variant="outline">{vehicleData.site === 1 ? 'Copart' : 'IAAI'}</Badge>
                <Badge variant="outline">{vehicleData.odometer.toLocaleString()} miles</Badge>
              </div>
            </div>
            <Button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Run AI Analysis
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="h-5 w-5" />
              <span>AI Analysis failed. Please try again.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {aiAnalysis && (
        <>
          {/* AI Recommendation */}
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  AI Recommendation
                </div>
                <div className="flex items-center gap-2">
                  {getActionBadge(aiAnalysis.data.recommendation.action)}
                  <span className={`font-semibold ${getConfidenceColor(aiAnalysis.data.recommendation.confidence)}`}>
                    {aiAnalysis.data.recommendation.confidence}% Confidence
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Analysis</h4>
                <p className="text-sm text-muted-foreground">{aiAnalysis.data.recommendation.reasoning}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Strategy</h4>
                <p className="text-sm text-muted-foreground">{aiAnalysis.data.recommendation.strategy}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Risk Factors</h4>
                <p className="text-sm text-muted-foreground">{aiAnalysis.data.recommendation.risks}</p>
              </div>
            </CardContent>
          </Card>

          {/* Cross-Platform Comparison */}
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Cross-Platform Price Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Copart Data */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-600">Copart Market</h4>
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                      ${aiAnalysis.data.crossPlatformData.copart.averagePrice.toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-600">
                      Average from {aiAnalysis.data.crossPlatformData.copart.count} vehicles
                    </div>
                  </div>
                </div>

                {/* IAAI Data */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-600">IAAI Market</h4>
                  <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-700">
                      ${aiAnalysis.data.crossPlatformData.iaai.averagePrice.toLocaleString()}
                    </div>
                    <div className="text-sm text-red-600">
                      Average from {aiAnalysis.data.crossPlatformData.iaai.count} vehicles
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-purple-800 dark:text-purple-200">Market Insight</span>
                </div>
                <p className="text-purple-700 dark:text-purple-300">
                  {aiAnalysis.data.crossPlatformData.priceAdvantage}
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                  Based on {aiAnalysis.data.crossPlatformData.totalComparables} comparable vehicles
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Image Analysis */}
          {aiAnalysis.data.imageAnalysis.hasImages && (
            <Card className="border-orange-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/50 dark:to-yellow-950/50">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-orange-600" />
                  AI Visual Damage Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">Confidence Score:</span>
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">
                        {Math.round(aiAnalysis.data.imageAnalysis.confidenceScore * 100)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {aiAnalysis.data.imageAnalysis.analysis}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}