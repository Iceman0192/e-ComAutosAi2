import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  Loader, 
  RefreshCw, 
  AlertCircle, 
  Car, 
  TrendingUp, 
  Calendar,
  BarChart3,
  Play,
  Settings,
  Target,
  Clock,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuctionSiteStats {
  site: number;
  siteName: string;
  vehicleCount: number;
  uniqueMakes: number;
  uniqueModels: number;
  percentage: number;
}

interface VehicleProgress {
  make: string;
  total_records: number;
  unique_models: number;
  earliest_sale: string;
  latest_sale: string;
  avg_price: number;
}

interface SiteStatsData {
  sites: AuctionSiteStats[];
  totalVehicles: number;
  siteBreakdown: AuctionSiteStats[];
}

interface CollectionStatus {
  isRunning: boolean;
  queueSize: number;
  totalRecords: number;
  recentActivity: any[];
  nextJobs: any[];
}

const POPULAR_MAKES = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 
  'Hyundai', 'Kia', 'Jeep', 'Dodge', 'BMW',
  'Mercedes-Benz', 'Audi', 'Tesla', 'Porsche', 'Lexus',
  'Infiniti', 'Acura', 'Cadillac', 'Subaru', 'Mazda'
];

export default function DataCollectionClean() {
  const [status, setStatus] = useState<CollectionStatus>({
    isRunning: false,
    queueSize: 0,
    totalRecords: 0,
    recentActivity: [],
    nextJobs: []
  });
  const [vehicleProgress, setVehicleProgress] = useState<VehicleProgress[]>([]);
  const [siteStats, setSiteStats] = useState<SiteStatsData>({
    sites: [],
    totalVehicles: 0,
    siteBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Manual collection controls
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [selectedSite, setSelectedSite] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isCollecting, setIsCollecting] = useState(false);
  
  const { toast } = useToast();

  // Fetch available models when make changes
  const fetchModels = async (make: string) => {
    try {
      const response = await fetch(`/api/admin/data-collection/models?make=${encodeURIComponent(make)}`);
      if (response.ok) {
        const result = await response.json();
        setAvailableModels(result.models || []);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setAvailableModels([]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [statusResponse, jobsResponse] = await Promise.all([
        fetch('/api/admin/data-collection/status'),
        fetch('/api/admin/data-collection/jobs')
      ]);

      if (!statusResponse.ok || !jobsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const statusData = await statusResponse.json();
      const jobsData = await jobsResponse.json();

      if (statusData.success && jobsData.success) {
        setStatus({
          isRunning: statusData.data.isRunning || false,
          queueSize: statusData.data.queueLength || 0,
          totalRecords: statusData.data.totalRecords || 0,
          recentActivity: statusData.data.recentActivity || [],
          nextJobs: statusData.data.nextJobs || []
        });
        
        setVehicleProgress(jobsData.data.vehicleProgress || []);
        setSiteStats(jobsData.data.siteStats || { sites: [], totalVehicles: 0, siteBreakdown: [] });
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const startManualCollection = async () => {
    if (!selectedMake || selectedSite === null) {
      toast({
        title: "Selection Required",
        description: "Please select both a make and auction site",
        variant: "destructive"
      });
      return;
    }

    setIsCollecting(true);
    try {
      const response = await fetch('/api/admin/data-collection/start-make-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make: selectedMake,
          site: selectedSite,
          yearFrom: 2012,
          yearTo: 2025,
          daysBack: 150,
          discoverModels: true
        })
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Collection Started",
          description: result.message,
        });
        
        // Reset selections and refresh data
        setSelectedMake('');
        setSelectedSite(null);
        setSelectedModel('');
        setAvailableModels([]);
        fetchData();
      } else {
        throw new Error(result.message || 'Failed to start collection');
      }
    } catch (error: any) {
      console.error('Error starting collection:', error);
      toast({
        title: "Collection Failed",
        description: error.message || "Failed to start data collection",
        variant: "destructive"
      });
    } finally {
      setIsCollecting(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Data Collection Analytics
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Advanced vehicle auction data collection with real-time insights
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchData} disabled={loading} variant="outline" size="lg">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Manual Collection Controls */}
      <Card className="border-2 border-dashed border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-500 text-white">
              <Target className="w-5 h-5" />
            </div>
            Manual Collection Control
            <Badge variant="secondary" className="ml-auto">2012-2025 • 150 Days</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select a vehicle make and auction site to start targeted data collection. 
            System will discover and collect all models for the selected make within the 150-day window.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vehicle Make</label>
              <Select value={selectedMake} onValueChange={(make) => {
                setSelectedMake(make);
                setSelectedModel('');
                setAvailableModels([]);
                if (make) {
                  fetchModels(make);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle make" />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_MAKES.map(make => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Auction Site</label>
              <Select value={selectedSite?.toString() || ''} onValueChange={(value) => setSelectedSite(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select auction site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Copart</SelectItem>
                  <SelectItem value="2">IAAI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Model (Optional)</label>
              <Select 
                value={selectedModel} 
                onValueChange={setSelectedModel}
                disabled={!selectedMake || availableModels.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedMake ? "All models" : "Select make first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Models</SelectItem>
                  {availableModels.map(model => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={startManualCollection} 
                disabled={isCollecting || !selectedMake || selectedSite === null}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isCollecting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Collecting...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Collection
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {selectedMake && selectedSite && (
            <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-sm">
                <Settings className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Collection Parameters:</span>
                <Badge variant="outline">{selectedMake}</Badge>
                <Badge variant="outline">{selectedSite === 1 ? 'Copart' : 'IAAI'}</Badge>
                <Badge variant="outline">Years: 2012-2025</Badge>
                <Badge variant="outline">Lookback: 150 days</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{siteStats.totalVehicles.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                <Loader className={`h-6 w-6 text-orange-600 ${status.isRunning ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Queue Size</p>
                <p className="text-2xl font-bold">{status.queueSize}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full ${status.isRunning ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <Activity className={`h-6 w-6 ${status.isRunning ? 'text-green-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Status</p>
                <p className="text-2xl font-bold">{status.isRunning ? 'Active' : 'Idle'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                <Car className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vehicle Makes</p>
                <p className="text-2xl font-bold">{vehicleProgress.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auction Site Analytics */}
      {siteStats.siteBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Auction Site Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {siteStats.siteBreakdown.map((site: AuctionSiteStats) => (
                <div key={site.site} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${site.siteName === 'Copart' ? 'bg-blue-500' : 'bg-green-500'}`} />
                      <span className="font-semibold text-lg">{site.siteName}</span>
                    </div>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {site.percentage}%
                    </Badge>
                  </div>
                  
                  <Progress value={site.percentage} className="h-3" />
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-blue-600">
                        {site.vehicleCount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Vehicles</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-green-600">
                        {site.uniqueMakes}
                      </p>
                      <p className="text-xs text-muted-foreground">Makes</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-purple-600">
                        {site.uniqueModels.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Models</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicle Make Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Vehicle Makes by Data Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vehicleProgress.slice(0, 12).map((vehicle: VehicleProgress, index) => (
              <div key={vehicle.make} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{vehicle.make}</h3>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.unique_models} models • {formatDate(vehicle.earliest_sale)} - {formatDate(vehicle.latest_sale)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {parseInt(vehicle.total_records.toString()).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Avg: {formatCurrency(vehicle.avg_price)}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-center bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <div>
                    <p className="text-lg font-semibold text-blue-600">
                      {parseInt(vehicle.total_records.toString()).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Records</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-green-600">
                      {vehicle.unique_models}
                    </p>
                    <p className="text-xs text-muted-foreground">Models</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-orange-600">
                      {formatCurrency(vehicle.avg_price)}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Price</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      {Math.round((new Date(vehicle.latest_sale).getTime() - new Date(vehicle.earliest_sale).getTime()) / (1000 * 60 * 60 * 24))} days
                    </Badge>
                  </div>
                </div>
                
                {index < vehicleProgress.slice(0, 12).length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {status.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Collection Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {status.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-medium">{activity.make}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{activity.modelsCount} models</span>
                    <span>{activity.lastCollected ? formatDate(activity.lastCollected) : 'Pending'}</span>
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