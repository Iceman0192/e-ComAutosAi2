import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';
import { 
  Brain, 
  TrendingUp, 
  DollarSign, 
  Target, 
  AlertTriangle, 
  Car, 
  BarChart3,
  Lightbulb,
  RefreshCw
} from 'lucide-react';

interface OpportunityInsight {
  category: string;
  title: string;
  description: string;
  confidence: number;
  potentialProfit: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  actionableSteps: string[];
  dataPoints: {
    avgBuyPrice: number;
    avgSellPrice: number;
    volume: number;
    successRate: number;
  };
}

interface MarketAnalysis {
  overview: {
    totalRecords: number;
    dateRange: string;
    avgPrice: number;
    topPerformingMakes: string[];
  };
  opportunities: OpportunityInsight[];
  marketTrends: {
    trend: string;
    description: string;
    impact: string;
  }[];
  riskFactors: string[];
  recommendations: string[];
}

function OpportunityCard({ opportunity }: { opportunity: OpportunityInsight }) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 dark:text-green-400';
    if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{opportunity.title}</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{opportunity.category}</p>
          </div>
          <Badge className={getRiskColor(opportunity.riskLevel)}>
            {opportunity.riskLevel} Risk
          </Badge>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className={`text-sm font-medium ${getConfidenceColor(opportunity.confidence)}`}>
            {opportunity.confidence}% Confidence
          </div>
          <div className="text-green-600 dark:text-green-400 font-semibold">
            ${opportunity.potentialProfit.toLocaleString()} Potential Profit
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 dark:text-gray-300 mb-4">{opportunity.description}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Buy Price</div>
            <div className="font-semibold">${opportunity.dataPoints.avgBuyPrice.toLocaleString()}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Sell Price</div>
            <div className="font-semibold">${opportunity.dataPoints.avgSellPrice.toLocaleString()}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <div className="text-sm text-gray-600 dark:text-gray-400">Market Volume</div>
            <div className="font-semibold">{opportunity.dataPoints.volume}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
            <div className="font-semibold">{opportunity.dataPoints.successRate}%</div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Action Steps:</h4>
          <ul className="space-y-1">
            {opportunity.actionableSteps.map((step, index) => (
              <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MarketOpportunitiesPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: analysis, isLoading, refetch } = useQuery({
    queryKey: ['/api/opportunities/analyze'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/opportunities/analyze');
      return response.json();
    }
  });

  const handleRefresh = async () => {
    setIsAnalyzing(true);
    await refetch();
    setIsAnalyzing(false);
  };

  if (isLoading || isAnalyzing) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Brain className="h-12 w-12 mx-auto text-blue-500 mb-4 animate-pulse" />
            <h3 className="text-lg font-medium mb-2">Analyzing Market Opportunities</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">AI is analyzing your sales history data to identify profitable opportunities...</p>
            <div className="flex items-center gap-2 justify-center">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Processing thousands of records</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const marketData: MarketAnalysis = analysis?.data;

  if (!marketData) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Unable to analyze market opportunities. Please ensure you have sales history data available.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Market Opportunities</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">AI-powered buying recommendations based on your sales history</p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">{marketData.overview.totalRecords.toLocaleString()}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Records Analyzed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">${marketData.overview.avgPrice.toLocaleString()}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Average Price</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Car className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <div className="text-2xl font-bold">{marketData.overview.topPerformingMakes.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Top Makes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <div className="text-2xl font-bold">{marketData.opportunities.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Opportunities Found</div>
          </CardContent>
        </Card>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
        <strong>Data Range:</strong> {marketData.overview.dateRange} | 
        <strong> Top Performing Makes:</strong> {marketData.overview.topPerformingMakes.join(', ')}
      </div>

      <Tabs defaultValue="opportunities" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
          <TabsTrigger value="risks">Risk Factors</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {marketData.opportunities.map((opportunity, index) => (
              <OpportunityCard key={index} opportunity={opportunity} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4">
            {marketData.marketTrends.map((trend, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    {trend.trend}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">{trend.description}</p>
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    Impact: {trend.impact}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <div className="grid gap-3">
            {marketData.riskFactors.map((risk, index) => (
              <Alert key={index}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{risk}</AlertDescription>
              </Alert>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-3">
            {marketData.recommendations.map((recommendation, index) => (
              <Alert key={index}>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>{recommendation}</AlertDescription>
              </Alert>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}