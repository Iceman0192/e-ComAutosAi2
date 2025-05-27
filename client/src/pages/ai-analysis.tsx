import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
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
  Zap,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

interface VehicleData {
  platform: string;
  lotId: string;
  vin: string;
  year: string;
  make: string;
  model: string;
  series?: string;
  mileage: string;
  damage: string;
  color?: string;
  location?: string;
  currentBid?: string;
  auctionDate?: string;
  images: string[];
}

interface AIAnalysisResult {
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
  
  // Extract vehicle data from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const vehicleData: VehicleData = {
    platform: urlParams.get('platform') || '',
    lotId: urlParams.get('lotId') || '',
    vin: urlParams.get('vin') || '',
    year: urlParams.get('year') || '',
    make: urlParams.get('make') || '',
    model: urlParams.get('model') || '',
    series: urlParams.get('series') || '',
    mileage: urlParams.get('mileage') || '',
    damage: urlParams.get('damage') || '',
    color: urlParams.get('color') || '',
    location: urlParams.get('location') || '',
    currentBid: urlParams.get('currentBid') || '',
    auctionDate: urlParams.get('auctionDate') || '',
    images: urlParams.get('images')?.split(',').filter(img => img.length > 0) || []
  };

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<'ready' | 'analyzing' | 'complete' | 'error'>('ready');

  // Check if user has Platinum access
  if (!hasPermission('AI_ANALYSIS')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto border-purple-200">
          <CardContent className="pt-6 text-center">
            <Brain className="h-16 w-16 mx-auto text-purple-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">AI Analysis - Platinum Feature</h2>
            <p className="text-gray-600 mb-4">
              Advanced AI-powered vehicle analysis is available for Platinum members only.
            </p>
            <Button onClick={() => setLocation('/billing')} className="bg-purple-600 hover:bg-purple-700">
              Upgrade to Platinum
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Validate required vehicle data
  if (!vehicleData.platform || !vehicleData.lotId || !vehicleData.vin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto border-red-200">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-16 w-16 mx-auto text-red-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Missing Vehicle Data</h2>
            <p className="text-gray-600 mb-4">
              Vehicle information is required for AI analysis. Please start from a live lot page.
            </p>
            <Button onClick={() => setLocation(`/live-${vehicleData.platform || 'copart'}`)}>
              Go to Live Lot Search
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch AI analysis data
  const { data: analysisData, isLoading, error } = useQuery({
    queryKey: ['ai-analysis', vehicleData],
    queryFn: async () => {
      setAnalysisStage('analyzing');
      const response = await apiRequest('POST', '/api/ai-analysis', {
        platform: vehicleData.platform,
        lotId: vehicleData.lotId,
        vin: vehicleData.vin,
        vehicleData: {
          year: parseInt(vehicleData.year),
          make: vehicleData.make,
          model: vehicleData.model,
          series: vehicleData.series,
          mileage: parseInt(vehicleData.mileage || '0'),
          damage: vehicleData.damage,
          images: vehicleData.images
        }
      });
      setAnalysisStage('complete');
      return response.data;
    },
    enabled: !!vehicleData.platform && !!vehicleData.lotId && !!vehicleData.vin,
  });

  useEffect(() => {
    if (error) {
      setAnalysisStage('error');
    }
  }, [error]);

  // Image viewer functions
  const openImageViewer = (index: number) => {
    setCurrentImageIndex(index);
    setShowImageViewer(true);
  };

  const nextImage = () => {
    if (vehicleData.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === vehicleData.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (vehicleData.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? vehicleData.images.length - 1 : prev - 1
      );
    }
  };

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

  const platformColor = vehicleData.platform === 'copart' ? 'blue' : 'red';
  const platformColors = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    red: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation(`/live-${vehicleData.platform}`)}
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
              Advanced intelligence for {vehicleData.year} {vehicleData.make} {vehicleData.model}
            </p>
          </div>
        </div>
        <Badge className={`px-3 py-1 border ${platformColors[platformColor]}`}>
          {vehicleData.platform.toUpperCase()} LOT #{vehicleData.lotId}
        </Badge>
      </div>

      {/* Vehicle Summary Card */}
      <Card className="border-purple-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-950/50">
          <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
            <Car className="h-6 w-6" />
            Vehicle Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Vehicle Details */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">VIN</p>
                  <p className="font-mono text-sm">{vehicleData.vin}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Year/Make/Model</p>
                  <p className="font-semibold">{vehicleData.year} {vehicleData.make} {vehicleData.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mileage</p>
                  <p className="font-semibold">{parseInt(vehicleData.mileage || '0').toLocaleString()} mi</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Primary Damage</p>
                  <p className="font-semibold">{vehicleData.damage}</p>
                </div>
                {vehicleData.color && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Color</p>
                    <p className="font-semibold">{vehicleData.color}</p>
                  </div>
                )}
                {vehicleData.location && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                    <p className="font-semibold">{vehicleData.location}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Images */}
            <div className="space-y-4">
              {vehicleData.images.length > 0 ? (
                <>
                  <div className="relative">
                    <img
                      src={vehicleData.images[currentImageIndex]}
                      alt={`Vehicle image ${currentImageIndex + 1}`}
                      className="w-full h-48 object-cover rounded-lg border cursor-pointer"
                      onClick={() => openImageViewer(currentImageIndex)}
                    />
                    {vehicleData.images.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                          onClick={nextImage}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 overflow-x-auto">
                    {vehicleData.images.slice(0, 4).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className={`w-16 h-16 object-cover rounded border-2 cursor-pointer ${
                          index === currentImageIndex ? 'border-purple-500' : 'border-gray-200'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                    {vehicleData.images.length > 4 && (
                      <div className="w-16 h-16 bg-gray-100 rounded border-2 border-gray-200 flex items-center justify-center text-xs text-gray-600">
                        +{vehicleData.images.length - 4}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-lg border flex items-center justify-center">
                  <p className="text-gray-500">No images available</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Progress */}
      {analysisStage === 'analyzing' && (
        <Card className="border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-4">
              <Eye className="h-6 w-6 text-blue-600 animate-pulse" />
              <span className="text-lg font-semibold">AI Analyzing Vehicle Data & Images...</span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse w-3/4"></div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Analyzing images, searching cross-platform database, generating insights...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysisData && analysisStage === 'complete' && (
        <>
          {/* AI Recommendation */}
          <Card className="border-2 border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-950/50">
              <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
                <Target className="h-5 w-5" />
                AI Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getRecommendationColor(analysisData.recommendation?.decision || 'CAUTION')}`}>
                  {getRecommendationIcon(analysisData.recommendation?.decision || 'CAUTION')}
                  <span className="font-bold text-lg">{analysisData.recommendation?.decision || 'ANALYZING'}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Confidence</p>
                  <p className="text-2xl font-bold text-purple-600">{analysisData.recommendation?.confidence || 0}%</p>
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

          {/* Cross-Platform Analysis & Damage Assessment */}
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
                  AI Damage Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Damage Analysis</h4>
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

      {/* Full Screen Image Viewer */}
      {showImageViewer && vehicleData.images.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative max-w-4xl max-h-full">
            <Button
              variant="outline"
              size="sm"
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white border-white/20"
              onClick={() => setShowImageViewer(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <img
              src={vehicleData.images[currentImageIndex]}
              alt={`Vehicle image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            {vehicleData.images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white border-white/20"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white border-white/20"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded">
              {currentImageIndex + 1} / {vehicleData.images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}