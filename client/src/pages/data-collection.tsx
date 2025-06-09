import { useState, useEffect } from "react";
import { Database, Play, RefreshCw, TrendingUp, Settings, AlertCircle, Search, Calendar, BarChart3, Users, Clock, CheckCircle, XCircle, Loader } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SystemStatus {
  isRunning: boolean;
  queueSize: number;
  totalRecords: number;
  dailyCollected: number;
  errorRate: number;
}

interface DatabaseStats {
  totalVehicles: number;
  totalMakes: number;
  copartRecords: number;
  iaaiRecords: number;
  recentRecords: number;
  oldestRecord: string;
  newestRecord: string;
  topMakes: Array<{ make: string; count: number; percentage: number }>;
  modelsByMake: Record<string, Array<{ model: string; count: number }>>;
  recordsByMonth: Array<{ month: string; count: number }>;
  avgPriceByMake: Array<{ make: string; avgPrice: number; count: number }>;
}

interface CollectionJob {
  id: string;
  make: string;
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  recordsCollected: number;
  startTime?: string;
  endTime?: string;
  estimatedCompletion?: string;
  errorMessage?: string;
  yearFrom: number;
  yearTo: number;
  daysBack: number;
}

interface ActiveSearch {
  id: string;
  make: string;
  yearFrom: number;
  yearTo: number;
  daysBack: number;
  status: 'queued' | 'active' | 'completed' | 'failed';
  progress: number;
  recordsFound: number;
}

export default function DataCollection() {
  const { user, hasPermission } = useAuth();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(null);
  const [jobs, setJobs] = useState<CollectionJob[]>([]);
  const [activeSearches, setActiveSearches] = useState<ActiveSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Multi-search form state
  const [selectedMakes, setSelectedMakes] = useState<string[]>([]);
  const [yearFrom, setYearFrom] = useState<string>('2020');
  const [yearTo, setYearTo] = useState<string>('2025');
  const [daysBack, setDaysBack] = useState<string>('30');
  const [isStartingMultiple, setIsStartingMultiple] = useState(false);

  const vehicleMakes = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia', 
    'Jeep', 'Dodge', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla', 'Porsche',
    'Lexus', 'Acura', 'Infiniti', 'Cadillac', 'Lincoln', 'Subaru', 'Mazda',
    'Volkswagen', 'Volvo', 'Mitsubishi', 'Land Rover', 'Jaguar', 'Mini'
  ];

  const canManageDataCollection = hasPermission('DATA_COLLECTION_MANAGEMENT');

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/admin/data-collection/status', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch system status:', err);
    }
  };

  const fetchDatabaseStats = async () => {
    try {
      const response = await fetch('/api/admin/database/stats', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setDatabaseStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch database stats:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/admin/data-collection/jobs', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const startMultipleCollections = async () => {
    if (selectedMakes.length === 0) {
      setError("Please select at least one vehicle make");
      return;
    }

    setIsStartingMultiple(true);
    setError(null);

    try {
      const searches = selectedMakes.map(make => ({
        make,
        yearFrom: parseInt(yearFrom),
        yearTo: parseInt(yearTo),
        daysBack: parseInt(daysBack)
      }));

      const response = await fetch('/api/admin/data-collection/start-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ searches })
      });

      if (!response.ok) {
        throw new Error('Failed to start collections');
      }

      const result = await response.json();
      setActiveSearches(result.searches || []);
      
      await fetchSystemStatus();
      await fetchJobs();
      setSelectedMakes([]);
    } catch (err) {
      setError("Failed to start collections");
      console.error('Collection error:', err);
    } finally {
      setIsStartingMultiple(false);
    }
  };

  const toggleMakeSelection = (make: string) => {
    setSelectedMakes(prev => 
      prev.includes(make) 
        ? prev.filter(m => m !== make)
        : [...prev, make]
    );
  };

  const selectAllMakes = () => {
    setSelectedMakes(vehicleMakes);
  };

  const clearAllMakes = () => {
    setSelectedMakes([]);
  };

  useEffect(() => {
    if (canManageDataCollection) {
      fetchSystemStatus();
      fetchDatabaseStats();
      fetchJobs();
      
      const interval = setInterval(() => {
        fetchSystemStatus();
        fetchJobs();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [canManageDataCollection]);

  if (!canManageDataCollection) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Data Collection Hub</h1>
          <p className="text-muted-foreground mt-2">
            Advanced data collection management and database insights
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
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Collection Hub</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive vehicle data management from Copart and IAAI platforms
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => {
            fetchSystemStatus();
            fetchDatabaseStats();
            fetchJobs();
          }}
          disabled={loading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh All
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="collect">Collect</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Status Overview */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${systemStatus?.isRunning ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <Database className={`h-6 w-6 ${systemStatus?.isRunning ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Collection Status</p>
                    <p className="text-2xl font-bold">
                      {systemStatus?.isRunning ? 'Active' : 'Idle'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
                    <p className="text-2xl font-bold">{systemStatus?.queueSize || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900">
                    <BarChart3 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                    <p className="text-2xl font-bold">{(systemStatus?.totalRecords || 0).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                    <p className="text-2xl font-bold">{(systemStatus?.errorRate || 0).toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          {/* Database Insights */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Vehicles:</span>
                  <span className="font-semibold">{(databaseStats?.totalVehicles || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unique Makes:</span>
                  <span className="font-semibold">{databaseStats?.totalMakes || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Copart Records:</span>
                  <span className="font-semibold">{(databaseStats?.copartRecords || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IAAI Records:</span>
                  <span className="font-semibold">{(databaseStats?.iaaiRecords || 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Data Freshness
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recent (30 days):</span>
                  <span className="font-semibold">{(databaseStats?.recentRecords || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Oldest Record:</span>
                  <span className="font-semibold text-sm">{databaseStats?.oldestRecord || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Newest Record:</span>
                  <span className="font-semibold text-sm">{databaseStats?.newestRecord || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Makes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {databaseStats?.topMakes?.slice(0, 5).map((item, index) => (
                    <div key={item.make} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="font-medium">{item.make}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{item.count.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  )) || <p className="text-muted-foreground">Loading...</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="collect" className="space-y-6">
          {/* Multi-Vehicle Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Multi-Vehicle Collection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Vehicle Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Select Vehicle Makes ({selectedMakes.length} selected)</Label>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={selectAllMakes}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearAllMakes}>
                      Clear All
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {vehicleMakes.map((make) => (
                    <Button
                      key={make}
                      variant={selectedMakes.includes(make) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleMakeSelection(make)}
                      className="justify-start"
                    >
                      {make}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Year From</Label>
                  <Input
                    type="number"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    min="2000"
                    max="2025"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Year To</Label>
                  <Input
                    type="number"
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    min="2000"
                    max="2025"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Days Back</Label>
                  <Input
                    type="number"
                    value={daysBack}
                    onChange={(e) => setDaysBack(e.target.value)}
                    min="1"
                    max="365"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={startMultipleCollections}
                    disabled={selectedMakes.length === 0 || isStartingMultiple}
                    className="w-full"
                  >
                    {isStartingMultiple ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start Collections ({selectedMakes.length})
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {selectedMakes.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Collection Preview:</strong>
                  </p>
                  <p className="text-sm">
                    Will collect data for <strong>{selectedMakes.join(', ')}</strong> vehicles 
                    from <strong>{yearFrom}-{yearTo}</strong> over the last <strong>{daysBack} days</strong> 
                    from both Copart and IAAI platforms.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Estimated {selectedMakes.length * 2} concurrent API searches will be initiated with 2-3 second intervals.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          {/* Active Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Collection Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No active collection jobs</p>
                    <p className="text-sm text-muted-foreground">Start a collection to see jobs here</p>
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            job.status === 'running' ? 'bg-blue-100 dark:bg-blue-900' :
                            job.status === 'completed' ? 'bg-green-100 dark:bg-green-900' :
                            job.status === 'failed' ? 'bg-red-100 dark:bg-red-900' :
                            'bg-gray-100 dark:bg-gray-800'
                          }`}>
                            {job.status === 'running' ? <Loader className="h-4 w-4 animate-spin text-blue-600" /> :
                             job.status === 'completed' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                             job.status === 'failed' ? <XCircle className="h-4 w-4 text-red-600" /> :
                             <Clock className="h-4 w-4 text-gray-400" />}
                          </div>
                          <div>
                            <h3 className="font-semibold">{job.make}</h3>
                            <p className="text-sm text-muted-foreground">
                              {job.yearFrom}-{job.yearTo} • {job.daysBack} days • Priority {job.priority}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Badge variant={
                            job.status === 'running' ? 'default' :
                            job.status === 'completed' ? 'secondary' :
                            job.status === 'failed' ? 'destructive' : 'outline'
                          }>
                            {job.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {job.recordsCollected} records
                          </p>
                        </div>
                      </div>

                      {job.status === 'running' && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} />
                        </div>
                      )}

                      {job.errorMessage && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">{job.errorMessage}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}