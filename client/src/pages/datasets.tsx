import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  RefreshCw,
  Database,
  Shield,
  ToggleLeft,
  ToggleRight,
  Settings,
  Filter,
  ChevronDown,
  ChevronUp,
  Play,
  Clock,
  Zap
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
    totalDatabaseRecords: number;
    coveragePercentage: number;
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

interface AnalysisFilters {
  datasetSize: number;
  makes: string[];
  models: string[];
  yearFrom: number;
  yearTo: number;
  priceFrom: number;
  priceTo: number;
  sites: string[];
  damageTypes: string[];
}

export default function MarketOpportunitiesPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isComprehensiveMode, setIsComprehensiveMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [useCache, setUseCache] = useState(true);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  const [filters, setFilters] = useState<AnalysisFilters>({
    datasetSize: 15000,
    makes: [],
    models: [],
    yearFrom: 2010,
    yearTo: 2024,
    priceFrom: 0,
    priceTo: 100000,
    sites: [],
    damageTypes: []
  });

  // Available filter options
  const dataSizeOptions = [
    { value: 15000, label: '15K Records', description: 'Fast analysis (3-5 min)' },
    { value: 25000, label: '25K Records', description: 'Detailed analysis (5-8 min)' },
    { value: 50000, label: '50K Records', description: 'Full analysis (8-12 min)' }
  ];

  const availableMakes = ['TOYOTA', 'HONDA', 'FORD', 'CHEVROLET', 'NISSAN', 'BMW', 'MERCEDES-BENZ', 'AUDI', 'LEXUS', 'HYUNDAI'];
  const availableSites = ['COPART', 'IAAI'];
  const availableDamageTypes = ['MINOR DENT/SCRATCHES', 'FRONT END', 'REAR END', 'SIDE', 'ROLLOVER', 'FLOOD', 'FIRE', 'VANDALISM'];

  const { data: analysis, isLoading, refetch } = useQuery({
    queryKey: [
      isComprehensiveMode ? '/api/opportunities/comprehensive' : '/api/opportunities/analyze',
      filters,
      useCache
    ],
    queryFn: async () => {
      const endpoint = isComprehensiveMode ? '/api/opportunities/comprehensive' : '/api/opportunities/analyze';
      const controller = new AbortController();
      
      // Dynamic timeout based on data size
      const timeoutMap = {
        15000: isComprehensiveMode ? 300000 : 180000, // 5min/3min
        25000: isComprehensiveMode ? 480000 : 300000, // 8min/5min
        50000: isComprehensiveMode ? 720000 : 480000  // 12min/8min
      };
      const timeout = timeoutMap[filters.datasetSize as keyof typeof timeoutMap] || 300000;
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        setAnalysisProgress(0);
        const progressInterval = setInterval(() => {
          setAnalysisProgress(prev => Math.min(prev + 2, 90));
        }, 1000);

        const response = await fetch(endpoint, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filters,
            useCache
          }),
        });
        
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        setAnalysisProgress(100);
        
        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        setAnalysisProgress(0);
        if (error.name === 'AbortError') {
          throw new Error('Analysis timed out - try reducing dataset size');
        }
        throw error;
      }
    },
    enabled: false, // Don't auto-run, require manual trigger
    retry: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
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

  if (!marketData || !marketData.overview) {
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
          <h1 className="text-3xl font-bold">
            {isComprehensiveMode ? 'Comprehensive Market Intelligence' : 'Market Opportunities'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isComprehensiveMode 
              ? 'Deep AI analysis extracting maximum insights from your complete automotive auction database'
              : 'AI-powered buying recommendations based on your sales history'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Button
              variant={!isComprehensiveMode ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsComprehensiveMode(false)}
              className="relative"
            >
              <Target className="h-4 w-4 mr-2" />
              Standard
            </Button>
            <Button
              variant={isComprehensiveMode ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsComprehensiveMode(true)}
              className="relative"
            >
              <Brain className="h-4 w-4 mr-2" />
              Comprehensive
            </Button>
          </div>
          <Button 
            onClick={() => setShowFilters(!showFilters)} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button 
            onClick={handleRefresh} 
            disabled={isLoading || isAnalyzing}
            className="flex items-center gap-2"
          >
            {isLoading || isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">{(marketData.overview?.totalRecords || 0).toLocaleString()}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Records Analyzed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">${(marketData.overview?.avgPrice || 0).toLocaleString()}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Average Price</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Car className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <div className="text-2xl font-bold">{(marketData.overview?.topPerformingMakes || []).length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Top Makes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <div className="text-2xl font-bold">{(marketData.opportunities || []).length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Opportunities Found</div>
          </CardContent>
        </Card>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
        <strong>Data Range:</strong> {marketData.overview?.dateRange || 'Full dataset'} | 
        <strong> Top Performing Makes:</strong> {(marketData.overview?.topPerformingMakes || []).join(', ')}
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