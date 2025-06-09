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

export default function DataCollectionClean() {
  const [status, setStatus] = useState({ isRunning: false, queueSize: 0, totalRecords: 0 });
  const [jobs, setJobs] = useState([]);
  const [vehicleProgress, setVehicleProgress] = useState([]);
  const [siteStats, setSiteStats] = useState({ sites: [], totalVehicles: 0, siteBreakdown: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const startCollection = async (make: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/data-collection/start-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          searches: [{ make, yearFrom: 2012, yearTo: 2025, daysBack: 150 }]
        })
      });
      
      if (response.ok) {
        setTimeout(fetchData, 1000);
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
              {siteStats.siteBreakdown.map((site) => (
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
              {vehicleProgress.slice(0, 10).map((vehicle, index) => (
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

      {/* Collection Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Start New Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW'].map((make) => (
              <Button
                key={make}
                onClick={() => startCollection(make)}
                disabled={loading}
                className="h-12"
              >
                <Play className="mr-2 h-4 w-4" />
                Collect {make}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}