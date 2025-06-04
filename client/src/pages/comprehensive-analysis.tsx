import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  AlertTriangle, 
  BarChart3, 
  Car,
  Lightbulb,
  Shield,
  RefreshCw,
  Brain,
  Database
} from 'lucide-react';

interface ComprehensiveAnalysis {
  marketIntelligence: {
    totalRecords: number;
    totalDatabaseRecords: number;
    coveragePercentage: number;
    dateRange: string;
    avgPrice: number;
    totalValue: number;
    uniqueMakes: number;
    uniqueModels: number;
    auctionSites: string[];
  };
  profitabilityMatrix: {
    byMake: Array<{make: string; avgBuyPrice: number; avgSellPrice: number; profitMargin: number; volume: number}>;
    byYear: Array<{year: string; avgBuyPrice: number; avgSellPrice: number; profitMargin: number; volume: number}>;
    bySite: Array<{site: string; avgBuyPrice: number; avgSellPrice: number; profitMargin: number; volume: number; soldRate: number}>;
    byDamage: Array<{damage: string; avgBuyPrice: number; avgSellPrice: number; profitMargin: number; volume: number}>;
  };
  opportunitySegments: Array<{
    segment: string;
    description: string;
    criteria: string;
    expectedProfit: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    volumeOpportunity: number;
    examples: Array<{make: string; model: string; year: string; estimatedProfit: number}>;
  }>;
  marketTrends: Array<{
    trend: string;
    timeframe: string;
    impact: string;
    confidence: number;
    dataSupport: string;
  }>;
  riskAssessment: {
    highRiskCategories: string[];
    lowRiskCategories: string[];
    marketVolatility: number;
    dataQualityScore: number;
  };
  actionableInsights: Array<{
    priority: 'High' | 'Medium' | 'Low';
    insight: string;
    action: string;
    expectedROI: number;
    implementation: string;
  }>;
}

function ProfitabilityTable({ data, title, type }: { data: any[], title: string, type: string }) {
  if (!data || data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.slice(0, 10).map((item, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex flex-col">
                <span className="font-semibold">{item[type]}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.volume} units {type === 'site' && item.soldRate ? `• ${item.soldRate}% sold` : ''}
                </span>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600 dark:text-green-400">
                  ${item.profitMargin.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Buy: ${item.avgBuyPrice.toLocaleString()} → Sell: ${item.avgSellPrice.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OpportunitySegmentCard({ segment }: { segment: any }) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{segment.segment}</CardTitle>
          <Badge className={getRiskColor(segment.riskLevel)}>
            {segment.riskLevel} Risk
          </Badge>
        </div>
        <CardDescription>{segment.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${segment.expectedProfit?.toLocaleString() || 'N/A'}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Expected Profit</div>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {segment.volumeOpportunity || 'N/A'}
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300">Volume Opportunity</div>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Criteria:</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{segment.criteria}</p>
        </div>
        {segment.examples && segment.examples.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Examples:</h4>
            <div className="space-y-1">
              {segment.examples.slice(0, 3).map((example: any, index: number) => (
                <div key={index} className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {example.year} {example.make} {example.model} - ${example.estimatedProfit?.toLocaleString() || 'N/A'} profit
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActionableInsightCard({ insight }: { insight: any }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'Medium': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'Low': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      default: return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800';
    }
  };

  return (
    <Card className={`${getPriorityColor(insight.priority)}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <Badge variant="outline">{insight.priority} Priority</Badge>
          <div className="text-right">
            <div className="font-bold text-green-600 dark:text-green-400">
              {insight.expectedROI}% ROI
            </div>
          </div>
        </div>
        <h4 className="font-semibold mb-2">{insight.insight}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{insight.action}</p>
        <div className="text-xs text-gray-500 dark:text-gray-500">
          <strong>Implementation:</strong> {insight.implementation}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ComprehensiveAnalysisPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: analysis, isLoading, refetch } = useQuery({
    queryKey: ['/api/opportunities/comprehensive'],
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
      
      try {
        const response = await fetch('/api/opportunities/comprehensive', {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Analysis timed out - processing large dataset');
        }
        throw error;
      }
    },
    retry: 1,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const handleRefresh = async () => {
    setIsAnalyzing(true);
    await refetch();
    setIsAnalyzing(false);
  };

  if (isLoading || isAnalyzing) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Brain className="h-16 w-16 mx-auto text-blue-500 animate-pulse" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Comprehensive AI Analysis in Progress</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Analyzing your complete automotive auction database...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Processing 14,650+ records • Extracting maximum insights • Generating opportunity segments
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis?.success || !analysis?.data) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Analysis Unavailable
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-4">
              Unable to perform comprehensive market analysis. Please ensure your sales history data is available.
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Analysis
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const marketData: ComprehensiveAnalysis = analysis.data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comprehensive Market Intelligence</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Deep AI analysis extracting maximum insights from your complete automotive auction database
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {/* Market Intelligence Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Database className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">{marketData.marketIntelligence.totalRecords.toLocaleString()}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Records Analyzed</div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              {marketData.marketIntelligence.coveragePercentage}% Database Coverage
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">${(marketData.marketIntelligence.totalValue / 1000000).toFixed(1)}M</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Market Value</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Avg: ${marketData.marketIntelligence.avgPrice.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Car className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <div className="text-2xl font-bold">{marketData.marketIntelligence.uniqueMakes}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Unique Makes</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {marketData.marketIntelligence.uniqueModels} Models
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <div className="text-2xl font-bold">{marketData.riskAssessment.dataQualityScore}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Data Quality Score</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {marketData.riskAssessment.marketVolatility}% Volatility
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profitability" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profitability">Profitability Matrix</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunity Segments</TabsTrigger>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
          <TabsTrigger value="insights">Actionable Insights</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="profitability" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProfitabilityTable 
              data={marketData.profitabilityMatrix.byMake} 
              title="Top Profitable Makes" 
              type="make" 
            />
            <ProfitabilityTable 
              data={marketData.profitabilityMatrix.bySite} 
              title="Auction Site Performance" 
              type="site" 
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProfitabilityTable 
              data={marketData.profitabilityMatrix.byYear} 
              title="Vehicle Year Profitability" 
              type="year" 
            />
            <ProfitabilityTable 
              data={marketData.profitabilityMatrix.byDamage} 
              title="Damage Type Analysis" 
              type="damage" 
            />
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {marketData.opportunitySegments?.map((segment, index) => (
              <OpportunitySegmentCard key={index} segment={segment} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {marketData.marketTrends?.map((trend, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {trend.trend}
                  </CardTitle>
                  <CardDescription>{trend.timeframe}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Impact:</h4>
                    <p className="text-gray-600 dark:text-gray-400">{trend.impact}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Confidence Level:</span>
                    <div className="flex items-center gap-2">
                      <Progress value={trend.confidence || 0} className="w-20" />
                      <span className="text-sm font-medium">{trend.confidence || 0}%</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Data Support:</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{trend.dataSupport}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {marketData.actionableInsights?.map((insight, index) => (
              <ActionableInsightCard key={index} insight={insight} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">High Risk Categories</CardTitle>
                <CardDescription>Vehicle categories with high price volatility</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {marketData.riskAssessment.highRiskCategories?.map((category, index) => (
                    <Badge key={index} variant="destructive" className="mr-2 mb-2">
                      {category}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600 dark:text-green-400">Low Risk Categories</CardTitle>
                <CardDescription>Stable vehicle categories with consistent pricing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {marketData.riskAssessment.lowRiskCategories?.map((category, index) => (
                    <Badge key={index} variant="secondary" className="mr-2 mb-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {category}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}