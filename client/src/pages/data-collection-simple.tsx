import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader, 
  RefreshCw, 
  AlertCircle, 
  Database, 
  Play, 
  Square,
  BarChart3,
  Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SimpleStatus {
  isRunning: boolean;
  queueSize: number;
  totalRecords: number;
  dailyCollected: number;
}

interface SimpleJob {
  id: string;
  make: string;
  status: string;
  progress: number;
  recordsCollected: number;
}

export default function DataCollectionSimple() {
  const [status, setStatus] = useState<SimpleStatus>({
    isRunning: false,
    queueSize: 0,
    totalRecords: 0,
    dailyCollected: 0
  });
  const [jobs, setJobs] = useState<SimpleJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { hasPermission } = useAuth();
  const canManage = hasPermission('DATA_COLLECTION_MANAGEMENT');

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/data-collection/status', {
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        setStatus({
          isRunning: Boolean(data.isRunning),
          queueSize: Number(data.queueSize) || 0,
          totalRecords: Number(data.totalRecords) || 0,
          dailyCollected: Number(data.dailyCollected) || 0
        });
      }
    } catch (err) {
      console.error('Status fetch failed:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/admin/data-collection/jobs', {
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        const jobsData = result.data || result || [];
        setJobs(Array.isArray(jobsData) ? jobsData : []);
      }
    } catch (err) {
      console.error('Jobs fetch failed:', err);
    }
  };

  const startCollection = async (make: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/data-collection/start-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          searches: [{
            make,
            yearFrom: 2020,
            yearTo: 2024,
            daysBack: 30
          }]
        })
      });
      
      if (response.ok) {
        setTimeout(() => {
          fetchStatus();
          fetchJobs();
        }, 1000);
      } else {
        setError('Failed to start collection');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManage) {
      fetchStatus();
      fetchJobs();
      const interval = setInterval(() => {
        fetchStatus();
        fetchJobs();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [canManage]);

  if (!canManage) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access data collection management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Collection</h1>
          <p className="text-muted-foreground">Manage vehicle data collection</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            fetchStatus();
            fetchJobs();
          }}
          disabled={loading}
        >
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

      <Tabs defaultValue="status" className="space-y-6">
        <TabsList>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="collect">Collect</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          {/* System Overview */}
          <div className="grid gap-4 md:grid-cols-4">
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
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Daily Collected</p>
                    <p className="text-2xl font-bold">{status.dailyCollected}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                    <Clock className="h-6 w-6 text-orange-600" />
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
                    {status.isRunning ? (
                      <Loader className="h-6 w-6 text-green-600 animate-spin" />
                    ) : (
                      <Square className="h-6 w-6 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">System Status</p>
                    <p className="text-2xl font-bold">{status.isRunning ? 'Running' : 'Idle'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Jobs */}
          {jobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Collections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{job.make}</h4>
                        <Badge variant={job.status === 'running' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {job.recordsCollected} records
                      </span>
                    </div>
                    {job.progress > 0 && (
                      <Progress value={job.progress} className="h-2" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="collect" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Start Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}