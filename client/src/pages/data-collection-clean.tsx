import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Play, 
  RefreshCw,
  AlertCircle,
  Loader
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

export default function DataCollectionClean() {
  const [status, setStatus] = useState({ isRunning: false, queueSize: 0, totalRecords: 0 });
  const [jobs, setJobs] = useState<any[]>([]);
  const [vehicleProgress, setVehicleProgress] = useState<VehicleProgress[]>([]);
  const [siteStats, setSiteStats] = useState<SiteStatsData>({ sites: [], totalVehicles: 0, siteBreakdown: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedSite, setSelectedSite] = useState('1');
  const [customMake, setCustomMake] = useState('');

  const fetchData = async () => {
    try {
      const [statusRes, jobsRes] = await Promise.all([
        fetch('/api/admin/data-collection/status', { credentials: 'include' }),
        fetch('/api/admin/data-collection/jobs', { credentials: 'include' })
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus({
          isRunning: Boolean(statusData?.data?.isRunning || statusData?.isRunning),
          queueSize: Number(statusData?.data?.queueSize || statusData?.queueSize) || 0,
          totalRecords: Number(statusData?.data?.totalRecords || statusData?.totalRecords) || 0
        });
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(Array.isArray(jobsData?.data?.jobs) ? jobsData.data.jobs : Array.isArray(jobsData?.data) ? jobsData.data : []);
        setVehicleProgress(Array.isArray(jobsData?.data?.vehicleProgress) ? jobsData.data.vehicleProgress : []);
        setSiteStats(jobsData?.data?.siteStats || { sites: [], totalVehicles: 0, siteBreakdown: [] });
      }
    } catch (err) {
      console.error('Fetch failed:', err);
    }
  };

  const startManualCollection = async () => {
    if (!selectedMake && !customMake) {
      setError('Please select or enter a vehicle make');
      return;
    }
    
    const make = customMake || selectedMake;
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/data-collection/start-make-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          make: make,
          site: parseInt(selectedSite),
          yearFrom: 2012,
          yearTo: 2025,
          daysBack: 150,
          discoverModels: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedMake('');
          setCustomMake('');
          setTimeout(fetchData, 1000);
        } else {
          setError(data.message || 'Failed to start collection');
        }
      } else {
        setError('Failed to start collection');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Collection Management</h1>
          <p className="text-muted-foreground mt-2">Monitor and control vehicle data collection</p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* System Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{status.totalRecords.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
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
              <div className={`p-2 rounded-full ${status.isRunning ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <div className={`h-6 w-6 rounded-full ${status.isRunning ? 'bg-green-600' : 'bg-gray-600'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Status</p>
                <p className="text-2xl font-bold">{status.isRunning ? 'Active' : 'Idle'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auction Site Statistics */}
      {siteStats.siteBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Collection Progress by Auction Site
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {siteStats.siteBreakdown.map((site: AuctionSiteStats) => (
                <div key={site.site} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${site.siteName === 'Copart' ? 'bg-blue-500' : 'bg-green-500'}`} />
                      <span className="font-medium">{site.siteName}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{site.percentage}%</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Vehicles</span>
                      <span className="font-medium">{site.vehicleCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Makes</span>
                      <span className="font-medium">{site.uniqueMakes}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Models</span>
                      <span className="font-medium">{site.uniqueModels}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${site.siteName === 'Copart' ? 'bg-blue-500' : 'bg-green-500'}`}
                      style={{ width: `${site.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {siteStats.totalVehicles > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-center text-sm text-muted-foreground">
                  Total: {siteStats.totalVehicles.toLocaleString()} vehicles across all auction platforms
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vehicle Progress by Make */}
      {vehicleProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Collection Progress by Make</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vehicleProgress.slice(0, 10).map((vehicle: VehicleProgress, index) => (
                <div key={vehicle.make} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium w-4">{index + 1}</span>
                    <span className="font-medium">{vehicle.make}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{vehicle.total_records.toLocaleString()} vehicles</span>
                    <span>{vehicle.unique_models} models</span>
                    <span>${vehicle.avg_price?.toLocaleString() || '0'} avg</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Jobs */}
      {jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Active Collections
              <Badge variant="secondary">{jobs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {jobs.map((job: any) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Loader className="h-4 w-4 animate-spin text-blue-600" />
                    <div>
                      <p className="font-medium">{job.make}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.recordsCollected || 0} records collected
                      </p>
                    </div>
                  </div>
                  <Badge variant={job.status === 'running' ? 'default' : 'secondary'}>
                    {job.status || 'active'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Collection Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Data Collection</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select a vehicle make and auction site to collect all available models within the 150-day window
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make-select">Vehicle Make</Label>
              <Select value={selectedMake} onValueChange={setSelectedMake}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a make" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Acura">Acura</SelectItem>
                  <SelectItem value="Audi">Audi</SelectItem>
                  <SelectItem value="BMW">BMW</SelectItem>
                  <SelectItem value="Buick">Buick</SelectItem>
                  <SelectItem value="Cadillac">Cadillac</SelectItem>
                  <SelectItem value="Chevrolet">Chevrolet</SelectItem>
                  <SelectItem value="Chrysler">Chrysler</SelectItem>
                  <SelectItem value="Dodge">Dodge</SelectItem>
                  <SelectItem value="Ford">Ford</SelectItem>
                  <SelectItem value="GMC">GMC</SelectItem>
                  <SelectItem value="Honda">Honda</SelectItem>
                  <SelectItem value="Hyundai">Hyundai</SelectItem>
                  <SelectItem value="Infiniti">Infiniti</SelectItem>
                  <SelectItem value="Jaguar">Jaguar</SelectItem>
                  <SelectItem value="Jeep">Jeep</SelectItem>
                  <SelectItem value="Kia">Kia</SelectItem>
                  <SelectItem value="Land Rover">Land Rover</SelectItem>
                  <SelectItem value="Lexus">Lexus</SelectItem>
                  <SelectItem value="Lincoln">Lincoln</SelectItem>
                  <SelectItem value="Mazda">Mazda</SelectItem>
                  <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                  <SelectItem value="Mini">Mini</SelectItem>
                  <SelectItem value="Mitsubishi">Mitsubishi</SelectItem>
                  <SelectItem value="Nissan">Nissan</SelectItem>
                  <SelectItem value="Porsche">Porsche</SelectItem>
                  <SelectItem value="Ram">Ram</SelectItem>
                  <SelectItem value="Subaru">Subaru</SelectItem>
                  <SelectItem value="Tesla">Tesla</SelectItem>
                  <SelectItem value="Toyota">Toyota</SelectItem>
                  <SelectItem value="Volkswagen">Volkswagen</SelectItem>
                  <SelectItem value="Volvo">Volvo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="custom-make">Or Enter Custom Make</Label>
              <Input
                id="custom-make"
                placeholder="e.g., Ferrari, Lamborghini"
                value={customMake}
                onChange={(e) => setCustomMake(e.target.value)}
                disabled={!!selectedMake}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="site-select">Auction Site</Label>
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Copart (Site 1)</SelectItem>
                  <SelectItem value="2">IAAI (Site 2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Collection will discover all models for the selected make and site automatically
            </div>
            <Button 
              onClick={startManualCollection} 
              disabled={loading || (!selectedMake && !customMake)}
              className="min-w-[120px]"
            >
              {loading ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Start Collection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}