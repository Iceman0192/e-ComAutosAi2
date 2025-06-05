import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, MapPin, Calendar, Target, Lightbulb } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface AnalysisResult {
  summary: {
    totalVehicles: number;
    averagePrice: number;
    priceRange: [number, number];
    topMakes: string[];
    analysisDate: string;
  };
  opportunities: Array<{
    title: string;
    description: string;
    profitPotential: string;
    actionSteps: string[];
    dataSupport: string;
  }>;
  marketTrends: Array<{
    category: string;
    finding: string;
    impact: string;
  }>;
  recommendations: {
    immediate: string[];
    strategic: string[];
  };
}

export default function SimpleAnalysisPanel() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const analysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/analysis/market', {});
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Analysis response:', data);
      setAnalysis(data.data);
    },
    onError: (error) => {
      console.error('Analysis error:', error);
    }
  });

  const handleRunAnalysis = () => {
    analysisMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Analysis Trigger */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Toyota Market Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleRunAnalysis}
            disabled={analysisMutation.isPending}
            className="w-full"
          >
            {analysisMutation.isPending ? 'Analyzing Toyota Data...' : 'Run Market Analysis'}
          </Button>
        </CardContent>
      </Card>

      {/* Results Display */}
      {analysis && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Average Price</p>
                    <p className="text-xl font-bold">${analysis.summary.averagePrice.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Vehicles</p>
                    <p className="text-xl font-bold">{analysis.summary.totalVehicles.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Price Range</p>
                    <p className="text-lg font-bold">
                      ${analysis.summary.priceRange[0].toLocaleString()} - ${analysis.summary.priceRange[1].toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Top Makes</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {analysis.summary.topMakes.slice(0, 3).map(make => (
                        <Badge key={make} variant="secondary" className="text-xs">
                          {make}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Market Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analysis.opportunities.map((opportunity, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{opportunity.title}</h3>
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        {opportunity.profitPotential}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {opportunity.description}
                    </p>

                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Action Steps:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {opportunity.actionSteps.map((step, stepIndex) => (
                          <li key={stepIndex} className="text-gray-600 dark:text-gray-400">
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-xs text-gray-500 italic">
                      {opportunity.dataSupport}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Market Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Market Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.marketTrends.map((trend, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{trend.category}</Badge>
                    </div>
                    <p className="font-medium mb-2">{trend.finding}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Impact:</strong> {trend.impact}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  Immediate Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.recommendations.immediate.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Strategic Planning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.recommendations.strategic.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}