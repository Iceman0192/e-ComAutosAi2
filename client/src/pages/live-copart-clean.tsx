import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { PlatformToggle } from "@/components/PlatformToggle";
import { Car, Search, ExternalLink, Brain, AlertCircle } from "lucide-react";

export default function LiveCopart() {
  const [lotId, setLotId] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const { hasPermission } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch live lot data
  const { data: lotData, isLoading: lotLoading, error: lotError } = useQuery({
    queryKey: ['/api/live-copart', lotId],
    queryFn: async () => {
      const response = await fetch(`/api/live-copart/${lotId}`);
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch lot data');
      }
      
      return result.data; // Return just the data part
    },
    enabled: searchTriggered && !!lotId,
  });

  const handleSearch = () => {
    if (lotId.trim()) {
      setSearchTriggered(true);
    }
  };

  const handleAIAnalysis = () => {
    if (lotData) {
      const vehicleData = {
        platform: 'copart',
        lotId: lotData.id,
        vin: lotData.vin,
        vehicleData: {
          year: lotData.year || 0,
          make: lotData.make || '',
          model: lotData.model || '',
          series: lotData.series || '',
          mileage: lotData.odometer || 0,
          damage_primary: lotData.damage_primary || '',
          damage_secondary: lotData.damage_secondary || '',
          color: lotData.color || '',
          location: lotData.location || '',
          title: lotData.title || '',
          current_bid: lotData.current_bid || 0,
          reserve_price: lotData.reserve_price || 0,
          auction_date: lotData.auction_date || '',
          status: lotData.status || '',
          images_hd: lotData.images_hd || [],
        }
      };
      
      const analysisUrl = `/ai-analysis?data=${encodeURIComponent(JSON.stringify(vehicleData))}`;
      setLocation(analysisUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-blue-600 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Copart Live Lot Analysis</h1>
              <p className="text-blue-100 mt-1 text-sm">Search current auction lots</p>
            </div>
            <div className="hidden sm:block">
              <PlatformToggle />
            </div>
          </div>
          <div className="sm:hidden mt-3">
            <PlatformToggle />
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Search className="h-5 w-5" />
              Live Lot Lookup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Enter Copart Lot ID (e.g., 55688495)"
                value={lotId}
                onChange={(e) => setLotId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={!lotId.trim() || lotLoading}>
                {lotLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {lotError && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span>Error: {lotError.message}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vehicle Display */}
        {lotData && (
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100 text-xl lg:text-2xl">
                    <Car className="h-6 w-6" />
                    {lotData.year} {lotData.make} {lotData.model} {lotData.series || ''}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Lot #{lotData.id}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      VIN: {lotData.vin}
                    </Badge>
                    {lotData.current_bid && (
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        Current Bid: ${lotData.current_bid?.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {lotData.link && (
                    <Button variant="outline" size="sm" asChild className="bg-white hover:bg-gray-50">
                      <a href={lotData.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Copart
                      </a>
                    </Button>
                  )}
                  {hasPermission('AI_ANALYSIS') && (
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      size="sm"
                      onClick={handleAIAnalysis}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      AI Analysis
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lotData.odometer && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Mileage</label>
                    <p className="text-lg font-semibold">{lotData.odometer.toLocaleString()} miles</p>
                  </div>
                )}
                {lotData.damage_primary && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Primary Damage</label>
                    <p className="text-lg font-semibold">{lotData.damage_primary}</p>
                  </div>
                )}
                {lotData.location && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Location</label>
                    <p className="text-lg font-semibold">{lotData.location}</p>
                  </div>
                )}
                {lotData.color && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Color</label>
                    <p className="text-lg font-semibold">{lotData.color}</p>
                  </div>
                )}
                {lotData.fuel && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Fuel Type</label>
                    <p className="text-lg font-semibold">{lotData.fuel}</p>
                  </div>
                )}
                {lotData.transmission && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Transmission</label>
                    <p className="text-lg font-semibold">{lotData.transmission}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}