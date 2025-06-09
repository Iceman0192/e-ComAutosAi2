import { useState, useEffect } from "react";
import { Database, Play, Pause, RefreshCw, TrendingUp, AlertCircle, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CollectionJob {
  id: string;
  make: string;
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  lastCollected?: string;
  recordsCollected: number;
  estimatedTimeRemaining?: string;
}

interface SystemStatus {
  isRunning: boolean;
  queueSize: number;
  totalRecords: number;
  dailyCollected: number;
  errorRate: number;
  lastUpdate: string;
}

export default function DataCollection() {
  const { user, hasPermission } = useAuth();
  const [jobs, setJobs] = useState<CollectionJob[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Manual collection form state
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [yearFrom, setYearFrom] = useState<string>('2012');
  const [yearTo, setYearTo] = useState<string>('2025');
  const [daysBack, setDaysBack] = useState<string>('150');
  const [isStarting, setIsStarting] = useState(false);

  const vehicleMakes = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia', 
    'Jeep', 'Dodge', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla', 'Porsche',
    'Lexus', 'Mazda', 'Volkswagen', 'Subaru', 'Mitsubishi'
  ];

  const canManageDataCollection = hasPermission('DATA_COLLECTION_MANAGEMENT');

  useEffect(() => {
    if (canManageDataCollection) {
      fetchCollectionJobs().then(() => {
        fetchDataCollectionStatus();
      });
    } else {
      setLoading(false);
    }
  }, [canManageDataCollection]);

  // Update system status when jobs change
  useEffect(() => {
    if (jobs.length > 0 && systemStatus) {
      const totalRecords = jobs.reduce((sum, job) => sum + (job.recordsCollected || 0), 0);
      const failedJobs = jobs.filter(job => job.status === 'failed').length;
      const errorRate = jobs.length > 0 ? (failedJobs / jobs.length) * 100 : 0;
      
      setSystemStatus(prev => prev ? {
        ...prev,
        queueSize: jobs.length,
        totalRecords: totalRecords,
        dailyCollected: totalRecords,
        errorRate: errorRate
      } : prev);
    }
  }, [jobs]);

  const fetchDataCollectionStatus = async () => {
    try {
      const response = await fetch('/api/admin/data-collection/status', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data collection status');
      }

      const data = await response.json();
      if (data.success && data.data) {
        const status = data.data;
        setSystemStatus({
          isRunning: status.isRunning,
          queueSize: status.totalJobs || 0,
          totalRecords: 0,
          dailyCollected: 0,
          errorRate: 0,
          lastUpdate: new Date().toISOString()
        });
      }
    } catch (err) {
      setError("Failed to load data collection status");
      console.error('Data collection status error:', err);
    }
  };

  const fetchCollectionJobs = async () => {
    try {
      const response = await fetch('/api/admin/data-collection/jobs', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch collection jobs');
      }

      const data = await response.json();
      if (data.success && data.data) {
        // Map backend job data to frontend interface
        const mappedJobs = data.data.map((job: any) => ({
          id: job.id,
          make: job.make,
          priority: job.priority,
          status: job.status || 'pending',
          progress: job.progress || 0,
          lastCollected: job.lastCollected,
          recordsCollected: job.modelsDiscovered || 0,
          estimatedTimeRemaining: job.estimatedTimeRemaining
        }));
        setJobs(mappedJobs);
      } else {
        setJobs([]);
      }
    } catch (err) {
      setError("Failed to load collection jobs");
      console.error('Collection jobs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCollection = async () => {
    try {
      const response = await fetch('/api/admin/data-collection/start', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to start data collection');
      }

      await fetchDataCollectionStatus();
      await fetchCollectionJobs();
    } catch (err) {
      setError("Failed to start data collection");
      console.error('Start collection error:', err);
    }
  };

  const handleStopCollection = async () => {
    try {
      const response = await fetch('/api/admin/data-collection/stop', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to stop data collection');
      }

      await fetchDataCollectionStatus();
    } catch (err) {
      setError("Failed to stop data collection");
      console.error('Stop collection error:', err);
    }
  };

  const handleStartMakeCollection = async () => {
    if (!selectedMake) {
      setError("Please select a vehicle make");
      return;
    }

    setIsStarting(true);
    try {
      const response = await fetch('/api/admin/data-collection/start-make', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          make: selectedMake,
          yearFrom: parseInt(yearFrom),
          yearTo: parseInt(yearTo),
          daysBack: parseInt(daysBack)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start make collection');
      }

      await fetchDataCollectionStatus();
      await fetchCollectionJobs();
      setError(null);
    } catch (err) {
      setError("Failed to start make collection");
      console.error('Start make collection error:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const getPriorityBadgeVariant = (priority: number) => {
    switch (priority) {
      case 1: return 'destructive';
      case 2: return 'default';
      case 3: return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'running': return 'default';
      case 'completed': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  if (!canManageDataCollection) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Collection</h1>
          <p className="text-muted-foreground">
            Manage automated vehicle data collection from auction platforms
          </p>
        </div>

        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Data Collection Management requires admin access. You're currently on the {user?.role || 'Freemium'} plan.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Collection</h1>
          <p className="text-muted-foreground">
            Manage automated vehicle data collection from auction platforms
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchDataCollectionStatus}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          
          {systemStatus?.isRunning ? (
            <Button
              variant="destructive"
              onClick={handleStopCollection}
            >
              <Pause className="mr-2 h-4 w-4" />
              Stop Collection
            </Button>
          ) : (
            <Button
              onClick={handleStartCollection}
            >
              <Play className="mr-2 h-4 w-4" />
              Start Collection
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* System Status */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Database className={`h-4 w-4 ${systemStatus?.isRunning ? 'text-green-600' : 'text-gray-400'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : systemStatus?.isRunning ? "Running" : "Stopped"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Size</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : systemStatus?.queueSize || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : (systemStatus?.totalRecords || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : (systemStatus?.dailyCollected || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : `${(systemStatus?.errorRate || 0).toFixed(2)}%`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Collection Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manual Collection
          </CardTitle>
          <CardDescription>
            Start data collection for specific vehicle makes with custom parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make-select">Vehicle Make</Label>
              <Select value={selectedMake} onValueChange={setSelectedMake}>
                <SelectTrigger id="make-select">
                  <SelectValue placeholder="Select make" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleMakes.map((make) => (
                    <SelectItem key={make} value={make}>
                      {make}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year-from">Year From</Label>
              <Input
                id="year-from"
                type="number"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                min="2012"
                max="2025"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year-to">Year To</Label>
              <Input
                id="year-to"
                type="number"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                min="2012"
                max="2025"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="days-back">Days Back</Label>
              <Input
                id="days-back"
                type="number"
                value={daysBack}
                onChange={(e) => setDaysBack(e.target.value)}
                min="1"
                max="365"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleStartMakeCollection}
              disabled={!selectedMake || isStarting}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isStarting ? 'Starting...' : 'Start Collection'}
            </Button>
            
            <div className="text-sm text-muted-foreground self-center">
              Collection will cover {selectedMake || 'selected make'} vehicles from {yearFrom}-{yearTo} 
              over the last {daysBack} days from both Copart and IAAI platforms
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collection Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Jobs</CardTitle>
          <CardDescription>
            Current data collection status by vehicle make
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <Database className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No collection jobs</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Start data collection to see active jobs
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Make</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>ETA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.make}</TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(job.priority)}>
                          Priority {job.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(job.status)}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <Progress value={job.progress} className="h-2" />
                          <span className="text-xs text-muted-foreground">
                            {job.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{job.recordsCollected.toLocaleString()}</TableCell>
                      <TableCell>
                        {job.lastCollected 
                          ? new Date(job.lastCollected).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        {job.estimatedTimeRemaining || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}