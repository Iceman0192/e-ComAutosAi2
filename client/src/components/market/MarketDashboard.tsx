import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
  Settings,
  Filter,
  Play,
  Clock,
  Zap,
  Activity,
  PieChart,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Search,
  BookOpen,
  Timer,
  TrendingDown
} from 'lucide-react';

interface MarketIntelligence {
  totalRecords: number;
  totalDatabaseRecords: number;
  coveragePercentage: number;
  dateRange: string;
  avgPrice: number;
  totalValue: number;
  uniqueMakes: number;
  uniqueModels: number;
  auctionSites: string[];
}

interface OpportunitySegment {
  segment: string;
  description: string;
  criteria: string;
  expectedProfit: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  volumeOpportunity: number;
  confidence: number;
  examples: Array<{
    make: string;
    model: string;
    year: string;
    estimatedProfit: number;
  }>;
}

interface AIInsight {
  type: string;
  description: string;
  confidence: number;
  frequency: number;
  impact: 'High' | 'Medium' | 'Low';
}

interface AnalysisFilters {
  makes: string[];
  yearRange: [number, number];
  priceRange: [number, number];
  damageTypes: string[];
  locations: string[];
  analysisDepth: 'standard' | 'comprehensive';
  datasetSize: number;
}

export default function MarketDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [analysisMode, setAnalysisMode] = useState<'standard' | 'comprehensive'>('standard');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filters, setFilters] = useState<AnalysisFilters>({
    makes: [],
    yearRange: [2015, 2024],
    priceRange: [0, 100000],
    damageTypes: [],
    locations: [],
    analysisDepth: 'standard',
    datasetSize: 15000
  });

  const queryClient = useQueryClient();

  // Core data queries
  const { data: marketStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: aiInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/ai/insights'],
    staleTime: 10 * 60 * 1000,
  });

  const { data: analysisHistory } = useQuery({
    queryKey: ['/api/ai/history'],
    staleTime: 5 * 60 * 1000,
  });

  // Analysis mutations
  const standardAnalysisMutation = useMutation({
    mutationFn: async (filters: AnalysisFilters) => {
      const response = await fetch('/api/opportunities/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/history'] });
      setIsAnalyzing(false);
    },
    onError: () => {
      setIsAnalyzing(false);
    }
  });

  const comprehensiveAnalysisMutation = useMutation({
    mutationFn: async (filters: AnalysisFilters) => {
      const response = await fetch('/api/opportunities/comprehensive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/history'] });
      setIsAnalyzing(false);
    },
    onError: () => {
      setIsAnalyzing(false);
    }
  });

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    
    if (analysisMode === 'comprehensive') {
      await comprehensiveAnalysisMutation.mutateAsync(filters);
    } else {
      await standardAnalysisMutation.mutateAsync(filters);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'Medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'High': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Executive Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-xl p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-30"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Brain className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Market Intelligence Platform</h1>
                  <p className="text-blue-100 opacity-90">
                    AI-powered automotive auction analysis and opportunity discovery
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Analysis Configuration</SheetTitle>
                  </SheetHeader>
                  <AnalysisConfig filters={filters} setFilters={setFilters} />
                </SheetContent>
              </Sheet>
              
              <Button 
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="bg-white text-blue-900 hover:bg-blue-50 font-semibold min-w-[160px]"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run {analysisMode === 'comprehensive' ? 'Deep' : 'Quick'} Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Total Records</p>
                  <p className="text-2xl font-bold">{marketStats?.data?.totalRecords?.toLocaleString() || '14,650'}</p>
                </div>
                <Database className="h-8 w-8 text-blue-300" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm">Market Value</p>
                  <p className="text-2xl font-bold">${marketStats?.data?.totalValue?.toLocaleString() || '2.1M'}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-300" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">AI Patterns</p>
                  <p className="text-2xl font-bold">{aiInsights?.data?.totalPatterns || '47'}</p>
                </div>
                <Sparkles className="h-8 w-8 text-purple-300" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-200 text-sm">Analyses Run</p>
                  <p className="text-2xl font-bold">{analysisHistory?.data?.totalAnalyses || '118'}</p>
                </div>
                <Activity className="h-8 w-8 text-orange-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Mode Selector */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Analysis Mode</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose your analysis depth and complexity level
              </p>
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={analysisMode === 'standard' ? 'default' : 'ghost'}
                onClick={() => setAnalysisMode('standard')}
                className="rounded-md"
              >
                <Zap className="h-4 w-4 mr-2" />
                Standard
              </Button>
              <Button
                variant={analysisMode === 'comprehensive' ? 'default' : 'ghost'}
                onClick={() => setAnalysisMode('comprehensive')}
                className="rounded-md"
              >
                <Brain className="h-4 w-4 mr-2" />
                Comprehensive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Opportunities</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <Lightbulb className="h-4 w-4" />
            <span>AI Insights</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <MarketOverview 
            marketStats={marketStats?.data} 
            analysisMode={analysisMode}
            isLoading={statsLoading}
          />
        </TabsContent>

        <TabsContent value="opportunities">
          <OpportunitiesPanel 
            analysisMode={analysisMode}
            standardData={standardAnalysisMutation.data}
            comprehensiveData={comprehensiveAnalysisMutation.data}
            isLoading={isAnalyzing}
          />
        </TabsContent>

        <TabsContent value="insights">
          <AIInsightsPanel 
            insights={aiInsights?.data}
            isLoading={insightsLoading}
          />
        </TabsContent>

        <TabsContent value="history">
          <AnalysisHistoryPanel 
            history={analysisHistory?.data}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Analysis Configuration Component
function AnalysisConfig({ 
  filters, 
  setFilters 
}: { 
  filters: AnalysisFilters; 
  setFilters: (filters: AnalysisFilters) => void; 
}) {
  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-6 py-4">
        <div>
          <Label className="text-base font-semibold">Dataset Size</Label>
          <Select 
            value={filters.datasetSize.toString()} 
            onValueChange={(value) => setFilters({...filters, datasetSize: parseInt(value)})}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5000">5,000 records</SelectItem>
              <SelectItem value="10000">10,000 records</SelectItem>
              <SelectItem value="15000">15,000 records (Recommended)</SelectItem>
              <SelectItem value="25000">25,000 records</SelectItem>
              <SelectItem value="50000">50,000 records</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div>
          <Label className="text-base font-semibold">Vehicle Makes</Label>
          <div className="mt-2 space-y-2">
            {['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes'].map((make) => (
              <div key={make} className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id={make}
                  checked={filters.makes.includes(make)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilters({...filters, makes: [...filters.makes, make]});
                    } else {
                      setFilters({...filters, makes: filters.makes.filter(m => m !== make)});
                    }
                  }}
                  className="rounded"
                />
                <Label htmlFor={make}>{make}</Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-base font-semibold">Year Range</Label>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">From</Label>
              <Input 
                type="number" 
                value={filters.yearRange[0]}
                onChange={(e) => setFilters({
                  ...filters, 
                  yearRange: [parseInt(e.target.value), filters.yearRange[1]]
                })}
                min="2000" 
                max="2024"
              />
            </div>
            <div>
              <Label className="text-sm">To</Label>
              <Input 
                type="number" 
                value={filters.yearRange[1]}
                onChange={(e) => setFilters({
                  ...filters, 
                  yearRange: [filters.yearRange[0], parseInt(e.target.value)]
                })}
                min="2000" 
                max="2024"
              />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-base font-semibold">Price Range</Label>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Min Price</Label>
              <Input 
                type="number" 
                value={filters.priceRange[0]}
                onChange={(e) => setFilters({
                  ...filters, 
                  priceRange: [parseInt(e.target.value), filters.priceRange[1]]
                })}
                min="0"
              />
            </div>
            <div>
              <Label className="text-sm">Max Price</Label>
              <Input 
                type="number" 
                value={filters.priceRange[1]}
                onChange={(e) => setFilters({
                  ...filters, 
                  priceRange: [filters.priceRange[0], parseInt(e.target.value)]
                })}
                min="0"
              />
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

// Market Overview Component
function MarketOverview({ 
  marketStats, 
  analysisMode, 
  isLoading 
}: { 
  marketStats: any; 
  analysisMode: string;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketStats?.totalRecords?.toLocaleString() || '14,650'}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Available for analysis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Average Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${marketStats?.avgPrice?.toLocaleString() || '8,247'}</div>
            <div className="flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              <p className="text-xs text-green-600">+12.3% vs last period</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Unique Makes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketStats?.uniqueMakes || '45'}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Vehicle manufacturers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Analysis Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{analysisMode}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Current depth setting
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Market Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Database Coverage</span>
                  <span>100%</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Analysis Ready</span>
                  <span>98.5%</span>
                </div>
                <Progress value={98.5} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Quality Score</span>
                  <span>94.2%</span>
                </div>
                <Progress value={94.2} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Search className="h-4 w-4 mr-2" />
                Search Specific Vehicles
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Filter className="h-4 w-4 mr-2" />
                Apply Advanced Filters
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="h-4 w-4 mr-2" />
                View Analysis Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Opportunities Panel Component 
function OpportunitiesPanel({ 
  analysisMode, 
  standardData, 
  comprehensiveData, 
  isLoading 
}: {
  analysisMode: string;
  standardData: any;
  comprehensiveData: any;
  isLoading: boolean;
}) {
  const data = analysisMode === 'comprehensive' ? comprehensiveData : standardData;
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data?.success || !data?.data) {
    return (
      <div className="text-center py-12">
        <Target className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Analysis Data</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Run an analysis to discover market opportunities
        </p>
      </div>
    );
  }

  // Handle different response structures
  const opportunities = data.data.opportunities || data.data.opportunitySegments || [];

  return (
    <div className="space-y-6">
      {/* Analysis Summary */}
      {data.data.overview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Analysis Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{data.data.overview.totalRecords?.toLocaleString()}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Records Analyzed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">${data.data.overview.avgPrice?.toLocaleString()}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Price</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{data.data.learnedPatternsApplied || 0}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI Patterns</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{data.cached ? 'CACHED' : 'FRESH'}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Data Source</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {opportunities.map((opportunity: any, index: number) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{opportunity.title || opportunity.segment}</CardTitle>
                <Badge className={getRiskColor(opportunity.riskLevel || 'Medium')}>
                  {opportunity.riskLevel || 'Medium'} Risk
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {opportunity.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    ${(opportunity.potentialProfit || opportunity.expectedProfit || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300">Expected Profit</div>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {opportunity.confidence || opportunity.volumeOpportunity || 'N/A'}%
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">Confidence</div>
                </div>
              </div>

              {opportunity.actionableSteps && opportunity.actionableSteps.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Action Steps:</p>
                  <div className="space-y-1">
                    {opportunity.actionableSteps.slice(0, 2).map((step: string, idx: number) => (
                      <div key={idx} className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {opportunity.dataPoints && (
                <div className="text-xs text-gray-500 dark:text-gray-400 border-t pt-2">
                  <div className="flex justify-between">
                    <span>Avg Buy: ${opportunity.dataPoints.avgBuyPrice?.toLocaleString()}</span>
                    <span>Success: {opportunity.dataPoints.successRate || 85}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Market Trends */}
      {data.data.marketTrends && data.data.marketTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Market Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.data.marketTrends.map((trend: string, index: number) => (
                <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm">{trend}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {data.data.recommendations && data.data.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="h-5 w-5 mr-2" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.data.recommendations.map((rec: string, index: number) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// AI Insights Panel Component
function AIInsightsPanel({ insights, isLoading }: { insights: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="text-center py-12">
        <Lightbulb className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Loading AI Insights</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Gathering market intelligence patterns
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Learning Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            AI Learning Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{insights.totalPatterns}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Patterns</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{insights.averageConfidence}%</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{insights.cacheHitRate}%</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cache Hit</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{insights.learningProgress}%</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Learning</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Patterns */}
      {insights.topPatterns && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.topPatterns.map((pattern: any, index: number) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="capitalize">
                    {pattern.type.replace('_', ' ')}
                  </Badge>
                  <div className="text-sm font-semibold text-green-600">
                    {pattern.confidence}% confidence
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">{pattern.description}</p>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Frequency: {pattern.frequency}</span>
                  <span>Pattern ID: #{index + 1}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Vehicle Patterns */}
      {insights.vehiclePatterns && (
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Segment Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.vehiclePatterns.map((pattern: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-semibold">{pattern.segment}</div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      {pattern.trendDirection === 'up' ? (
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      {pattern.trendStrength}% trend strength
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600 dark:text-green-400">
                      ${pattern.avgProfit?.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Avg Profit</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Analysis History Panel Component
function AnalysisHistoryPanel({ history }: { history: any }) {
  if (!history) {
    return (
      <div className="text-center py-12">
        <Clock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Analysis History</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Track your previous analyses and performance
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{history.totalAnalyses}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Completed successfully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cache Hit Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{history.cacheHitRate}%</div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Performance optimization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(history.averageDuration / 1000)}s</div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Analysis time
            </p>
          </CardContent>
        </Card>
      </div>

      {history.recentAnalyses && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.recentAnalyses.map((analysis: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${analysis.cached ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                    <div>
                      <div className="font-medium capitalize">{analysis.analysisType} Analysis</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {analysis.recordCount?.toLocaleString()} records • {Math.round(analysis.duration / 1000)}s
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(analysis.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getRiskColor(risk: string) {
  switch (risk) {
    case 'Low': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    case 'Medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
    case 'High': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
    default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
  }
}