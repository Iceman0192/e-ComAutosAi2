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
import { VehicleAIChat } from '@/components/VehicleAIChat';
import { ImportDutyCalculator } from '@/components/ImportDutyCalculator';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Clean Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">AuctionMind</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">AI Vehicle Intelligence</p>
              </div>
            </div>
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              Platinum
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* VIN Search - Clean and Centered */}
        <div className="text-center space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Vehicle Intelligence Analysis
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Get instant AI-powered insights for any vehicle with comprehensive damage assessment, 
              export market analysis, and bidding strategies.
            </p>
          </div>
          
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Enter 17-character VIN..."
                  value={vinInput}
                  onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                  className="h-14 text-lg border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  maxLength={17}
                />
              </div>
              <Button 
                onClick={handleAnalyze}
                disabled={!vinInput.trim() || vinInput.length !== 17 || isLoading}
                className="h-14 px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-3" />
                    Analyze Vehicle
                  </>
                )}
              </Button>
            </div>
            {vinInput.length > 0 && vinInput.length < 17 && (
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-3 text-center">
                VIN must be exactly 17 characters ({vinInput.length}/17)
              </p>
            )}
          </div>
        </div>

        {/* AI Analysis Results - Modern Layout */}
        {vinData && (
          <div className="space-y-8">
            {/* Vehicle Summary Card */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {vinData.vehicleInfo?.year} {vinData.vehicleInfo?.make} {vinData.vehicleInfo?.model} {vinData.vehicleInfo?.series}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span>VIN: {vinData.vin}</span>
                    <span>Engine: {vinData.vehicleInfo?.engine}</span>
                    <span>Mileage: {vinData.vehicleInfo?.mileage?.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {vinData.consensus?.recommendation === 'BUY' ? (
                    <Badge className="px-4 py-2 bg-emerald-500 text-white text-lg font-semibold rounded-xl">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      BUY RECOMMENDED
                    </Badge>
                  ) : (
                    <Badge className="px-4 py-2 bg-red-500 text-white text-lg font-semibold rounded-xl">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      PROCEED WITH CAUTION
                    </Badge>
                  )}
                  <div className="text-right">
                    <div className="text-sm text-slate-600 dark:text-slate-400">AI Confidence</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">
                      {vinData.consensus?.confidence || 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* OpenAI Analysis */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">OpenAI Vision</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Image Analysis</p>
                  </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {vinData.openai?.summary || 'Analyzing vehicle images and specifications...'}
                </p>
              </div>

              {/* Perplexity Market Research */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Market Research</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Real-time Insights</p>
                  </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {vinData.perplexity?.marketInsight || 'Researching current market trends...'}
                </p>
              </div>

              {/* AI Consensus */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">AI Consensus</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Final Recommendation</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {vinData.consensus?.reasoning || 'Generating comprehensive analysis...'}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${vinData.consensus?.confidence || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {vinData.consensus?.confidence || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Tools Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* AI Chat Assistant */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
                <VehicleAIChat vehicleData={vinData?.vehicleInfo} />
              </div>

              {/* Import Duty Calculator */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
                <ImportDutyCalculator />
              </div>
            </div>

            {/* Auction History & Pricing */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Vehicle History */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Auction History</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Cross-platform sales data</p>
                  </div>
                </div>
                {vinData.history?.length > 0 ? (
                  <div className="space-y-3">
                    {vinData.history.map((auction: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {auction.platform} - Lot #{auction.lotId}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {new Date(auction.date).toLocaleDateString()} • {auction.damage}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-slate-900 dark:text-white">
                            ${auction.price?.toLocaleString()}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">{auction.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Loading auction history...</p>
                  </div>
                )}
              </div>

              {/* Price Intelligence */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Price Intelligence</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">AI-powered valuation</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Current Market Value</span>
                      <span className="text-xl font-bold text-slate-900 dark:text-white">
                        ${vinData.pricing?.currentValue?.toLocaleString() || 'Calculating...'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Predicted Next Sale</span>
                      <span className="text-xl font-bold text-emerald-600">
                        ${vinData.pricing?.prediction?.toLocaleString() || 'Analyzing...'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                    <h5 className="font-medium text-slate-900 dark:text-white mb-3">AI Strategy</h5>
                    <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {vinData.openai?.recommendation ? (
                        <div className="space-y-2">
                          {typeof vinData.openai.recommendation === 'string' ? (
                            <p>{vinData.openai.recommendation}</p>
                          ) : (
                            <>
                              {vinData.openai.recommendation.investmentStrategy && (
                                <div>
                                  <span className="font-medium text-emerald-600">Strategy:</span> {vinData.openai.recommendation.investmentStrategy}
                                </div>
                              )}
                              {vinData.openai.recommendation.dueDiligence && (
                                <div>
                                  <span className="font-medium text-blue-600">Due Diligence:</span> {vinData.openai.recommendation.dueDiligence}
                                </div>
                              )}
                              {vinData.openai.recommendation.auctionLimitations && (
                                <div>
                                  <span className="font-medium text-orange-600">Considerations:</span> {vinData.openai.recommendation.auctionLimitations}
                                </div>
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
              </div>
            </div>
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