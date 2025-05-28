import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Search, 
  TrendingUp, 
  Eye, 
  Target,
  Zap,
  ChevronRight,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Camera,
  Globe
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function AuctionMind() {
  const { hasPermission } = useAuth();
  const [vinInput, setVinInput] = useState('');
  const [analysisVin, setAnalysisVin] = useState('');

  // VIN Analysis Query using the powerful /cars/vin/all API
  const { data: vinData, isLoading, error, refetch } = useQuery({
    queryKey: ['vin-analysis', analysisVin],
    queryFn: async () => {
      const response = await fetch(`/api/auction-mind/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin: analysisVin })
      });
      if (!response.ok) throw new Error('VIN analysis failed');
      const result = await response.json();
      return result.data;
    },
    enabled: !!analysisVin
  });

  const handleAnalyze = () => {
    if (vinInput.trim()) {
      setAnalysisVin(vinInput.trim());
    }
  };

  if (!hasPermission('FULL_ANALYTICS')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-6 w-6 text-purple-600" />
                  AuctionMind Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  AuctionMind requires Platinum membership for advanced AI-powered vehicle analysis.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <Brain className="h-8 w-8" />
                AuctionMind
              </h1>
              <p className="text-purple-100 mt-2">
                Advanced AI-powered vehicle auction intelligence using multiple AI models
              </p>
            </div>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
              Platinum Feature
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* VIN Search Interface */}
        <Card className="border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-950/50">
            <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
              <Search className="h-6 w-6" />
              Vehicle Intelligence Search
            </CardTitle>
            <CardDescription className="text-purple-700 dark:text-purple-300">
              Enter a VIN to unlock comprehensive AI analysis using OpenAI, Perplexity, and advanced market intelligence
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="vin" className="text-sm font-medium">Vehicle VIN</Label>
                <Input
                  id="vin"
                  type="text"
                  placeholder="Enter 17-character VIN (e.g., 1N6AD0ER4DN751317)"
                  value={vinInput}
                  onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                  className="mt-1"
                  maxLength={17}
                />
              </div>
              <Button 
                onClick={handleAnalyze}
                disabled={!vinInput.trim() || vinInput.length !== 17 || isLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white self-end"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Analyze Vehicle
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis Results */}
        {vinData && (
          <div className="space-y-6">
            {/* Multi-AI Analysis Summary */}
            <Card className="border-green-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
                <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                  <Brain className="h-6 w-6" />
                  Multi-AI Intelligence Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* OpenAI Analysis */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">OpenAI Vision</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {vinData.openai?.summary || 'Analyzing vehicle images and specifications...'}
                    </p>
                  </div>

                  {/* Perplexity Market Research */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-purple-600" />
                      <span className="font-semibold text-purple-800">Perplexity Research</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {vinData.perplexity?.marketInsight || 'Researching current market trends...'}
                    </p>
                  </div>

                  {/* AI Consensus */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">AI Consensus</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {vinData.consensus?.recommendation === 'BUY' ? (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />BUY
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500 text-white">
                          <AlertTriangle className="h-3 w-3 mr-1" />PASS
                        </Badge>
                      )}
                      <span className="text-sm font-medium">
                        {vinData.consensus?.confidence || 0}% Confidence
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle History Timeline */}
            <Card className="border-blue-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50">
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <Clock className="h-6 w-6" />
                  Cross-Platform Auction History
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {vinData.history?.length > 0 ? (
                  <div className="space-y-4">
                    {vinData.history.map((auction: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <div className="font-semibold">{auction.platform} - Lot #{auction.lotId}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(auction.date).toLocaleDateString()} • {auction.damage}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">${auction.price?.toLocaleString()}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{auction.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">Loading auction history...</p>
                )}
              </CardContent>
            </Card>

            {/* Price Intelligence */}
            <Card className="border-orange-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/50 dark:to-yellow-950/50">
                <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
                  <TrendingUp className="h-6 w-6" />
                  AI Price Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Value Trends</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Current Market Value:</span>
                        <span className="font-bold">${vinData.pricing?.currentValue?.toLocaleString() || 'Calculating...'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Predicted Next Sale:</span>
                        <span className="font-bold text-green-600">${vinData.pricing?.prediction?.toLocaleString() || 'Analyzing...'}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">AI Recommendations</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {vinData.openai?.recommendation ? (
                        <div className="space-y-1">
                          {typeof vinData.openai.recommendation === 'string' ? (
                            <p>{vinData.openai.recommendation}</p>
                          ) : (
                            <>
                              {vinData.openai.recommendation.investmentStrategy && (
                                <p><strong>Strategy:</strong> {vinData.openai.recommendation.investmentStrategy}</p>
                              )}
                              {vinData.openai.recommendation.dueDiligence && (
                                <p><strong>Due Diligence:</strong> {vinData.openai.recommendation.dueDiligence}</p>
                              )}
                              {vinData.openai.recommendation.auctionLimitations && (
                                <p><strong>Limitations:</strong> {vinData.openai.recommendation.auctionLimitations}</p>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        'Generating strategic recommendations...'
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertTriangle className="h-5 w-5" />
                <span>Analysis failed. Please check the VIN and try again.</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}