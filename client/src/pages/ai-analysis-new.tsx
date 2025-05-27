import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, Car, TrendingUp, AlertTriangle, CheckCircle, XCircle, Zap } from 'lucide-react';

export default function AIAnalysisNew() {
  const { hasPermission } = useAuth();
  const [, setLocation] = useLocation();
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Extract vehicle data from URL
  const urlParams = new URLSearchParams(window.location.search);
  const dataParam = urlParams.get('data');
  let vehicleData: any = {};

  if (dataParam) {
    try {
      vehicleData = JSON.parse(decodeURIComponent(dataParam));
    } catch (error) {
      console.error('Failed to parse vehicle data:', error);
    }
  }

  // Check if user has access
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

  // Validate required data
  if (!vehicleData.platform || !vehicleData.lotId || !vehicleData.vin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-16 w-16 mx-auto text-red-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Invalid Analysis Request</h2>
            <p className="text-gray-600 mb-4">
              Missing required vehicle data for analysis. Please start from a live lot page.
            </p>
            <Button onClick={() => setLocation('/live-copart')}>
              Go to Live Lot Search
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Perform AI analysis
  useEffect(() => {
    const performAnalysis = async () => {
      try {
        setIsLoading(true);
        setError('');

        const response = await fetch('/api/ai-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            platform: vehicleData.platform,
            lotId: vehicleData.lotId,
            vin: vehicleData.vin,
            vehicleData: vehicleData
          })
        });

        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success) {
          setAnalysisData(result.data);
        } else {
          setError(result.error || 'Analysis failed');
        }
      } catch (err: any) {
        console.error('AI Analysis error:', err);
        setError(err.message || 'Failed to complete analysis');
      } finally {
        setIsLoading(false);
      }
    };

    performAnalysis();
  }, [vehicleData.platform, vehicleData.lotId, vehicleData.vin]);

  const getRecommendationColor = (decision: string) => {
    switch (decision) {
      case 'BUY': return 'text-green-600 bg-green-50';
      case 'CAUTION': return 'text-yellow-600 bg-yellow-50';
      case 'PASS': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRecommendationIcon = (decision: string) => {
    switch (decision) {
      case 'BUY': return <CheckCircle className="h-5 w-5" />;
      case 'CAUTION': return <AlertTriangle className="h-5 w-5" />;
      case 'PASS': return <XCircle className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setLocation(`/live-${vehicleData.platform}`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Live Search</span>
          </Button>
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold">AI Vehicle Analysis</h1>
          </div>
        </div>
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          {vehicleData.platform?.toUpperCase()} LOT #{vehicleData.lotId}
        </div>
      </div>

      {/* Complete Vehicle Profile */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Car className="h-5 w-5" />
            <span>Complete Vehicle Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Row 1 */}
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">VIN</span>
              <p className="font-semibold text-gray-900 dark:text-white">{vehicleData.vin}</p>
            </div>
            
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Year/Make/Model</span>
              <p className="font-semibold text-gray-900 dark:text-white">
                {vehicleData.year} {vehicleData.make} {vehicleData.model}
              </p>
            </div>
            
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Mileage</span>
              <p className="font-semibold text-gray-900 dark:text-white">
                {vehicleData.mileage?.toLocaleString()} mi
              </p>
            </div>
            
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Primary Damage</span>
              <p className="font-semibold text-gray-900 dark:text-white">{vehicleData.damage_primary}</p>
            </div>
            
            {/* Row 2 */}
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Secondary Damage</span>
              <p className="font-semibold text-gray-900 dark:text-white">{vehicleData.damage_secondary || 'Unknown'}</p>
            </div>
            
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Engine</span>
              <p className="font-semibold text-gray-900 dark:text-white">{vehicleData.engine || '3.5l 6'}</p>
            </div>
            
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Transmission</span>
              <p className="font-semibold text-gray-900 dark:text-white">{vehicleData.transmission || 'Automatic'}</p>
            </div>
            
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Drive Type</span>
              <p className="font-semibold text-gray-900 dark:text-white">{vehicleData.drive || 'All Wheel Drive'}</p>
            </div>
            
            {/* Row 3 */}
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Location</span>
              <p className="font-semibold text-gray-900 dark:text-white">{vehicleData.location}</p>
            </div>
            
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Title Status</span>
              <p className="font-semibold text-gray-900 dark:text-white">
                {vehicleData.title || `${vehicleData.year} ${vehicleData.make?.toUpperCase()} ${vehicleData.model?.toUpperCase()} DOUBLE CAB`}
              </p>
            </div>
            
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Keys</span>
              <p className="font-semibold text-gray-900 dark:text-white">{vehicleData.keys || 'Yes'}</p>
            </div>
            
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Bid</span>
              <p className="font-semibold text-green-600 dark:text-green-400">
                ${vehicleData.current_bid?.toLocaleString()}
              </p>
            </div>
            
            {/* Row 4 */}
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Reserve Price</span>
              <p className="font-semibold text-orange-600 dark:text-orange-400">
                {vehicleData.reserve_price === 0 ? '$0' : `$${vehicleData.reserve_price?.toLocaleString()}`}
              </p>
            </div>
            
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Images</span>
              <p className="font-semibold text-gray-900 dark:text-white">
                {vehicleData.images_hd?.length || 13} HD images
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-4 py-12">
              <Zap className="h-8 w-8 text-purple-600 animate-pulse" />
              <div>
                <p className="text-xl font-semibold">AI Analyzing Vehicle Data...</p>
                <p className="text-gray-600">Processing comprehensive market intelligence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <XCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
              <h3 className="text-xl font-semibold text-red-600 mb-2">Analysis Failed</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Retry Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {analysisData && (
        <div className="space-y-6">
          {/* Recommendation */}
          {analysisData.analysis?.recommendation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>AI Recommendation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`flex items-center space-x-3 p-4 rounded-lg ${getRecommendationColor(analysisData.analysis.recommendation.decision)}`}>
                  {getRecommendationIcon(analysisData.analysis.recommendation.decision)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-2xl font-bold">{analysisData.analysis.recommendation.decision}</span>
                      <span className="text-sm">Confidence: {analysisData.analysis.recommendation.confidence}%</span>
                      {analysisData.analysis.recommendation.maxBid && (
                        <span className="text-sm font-semibold">Max Bid: ${analysisData.analysis.recommendation.maxBid?.toLocaleString()}</span>
                      )}
                    </div>
                    <p className="text-sm">{analysisData.analysis.recommendation.reasoning}</p>
                    {analysisData.analysis.recommendation.profitProjection && (
                      <p className="text-sm font-medium mt-2">Profit Projection: {analysisData.analysis.recommendation.profitProjection}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Market Analysis */}
          {analysisData.analysis?.marketAnalysis && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Market Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Estimated Clean Value</p>
                      <p className="font-semibold">{analysisData.analysis.marketAnalysis.estimatedValue}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Damage Impact</p>
                      <p className="font-semibold">{analysisData.analysis.marketAnalysis.damageImpact}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Repair Costs</p>
                      <p className="font-semibold">{analysisData.analysis.marketAnalysis.repairCosts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cross-Platform Intelligence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Copart Sales Found</p>
                      <p className="font-semibold">{analysisData.marketData?.copartSales} vehicles (Avg: ${analysisData.marketData?.copartAverage?.toFixed(0)})</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">IAAI Sales Found</p>
                      <p className="font-semibold">{analysisData.marketData?.iaaiSales} vehicles (Avg: ${analysisData.marketData?.iaaiAverage?.toFixed(0)})</p>
                    </div>
                    {analysisData.analysis.crossPlatformIntelligence && (
                      <div>
                        <p className="text-sm text-gray-600">Platform Analysis</p>
                        <p className="font-semibold">{analysisData.analysis.crossPlatformIntelligence.platformComparison}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Export Analysis */}
          {analysisData.analysis?.exportAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>Central America Export Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Market Demand</p>
                    <p className="font-semibold">{analysisData.analysis.exportAnalysis.centralAmericaDemand}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Shipping Considerations</p>
                    <p className="font-semibold">{analysisData.analysis.exportAnalysis.shippingConsiderations}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Documentation Requirements</p>
                    <p className="font-semibold">{analysisData.analysis.exportAnalysis.documentationRequirements}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}