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
  model?: string;
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
  currentModel?: string;
  totalModels?: number;
  modelsCompleted?: number;
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
  const [selectedModels, setSelectedModels] = useState<Record<string, string[]>>({});
  const [yearFrom, setYearFrom] = useState<string>('2020');
  const [yearTo, setYearTo] = useState<string>('2025');
  const [daysBack, setDaysBack] = useState<string>('30');
  const [isStartingMultiple, setIsStartingMultiple] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
        const result = await response.json();
        const status = result.data || result;
        // Ensure all required properties exist with defaults
        setSystemStatus({
          isRunning: status.isRunning || false,
          queueSize: status.queueSize || 0,
          totalRecords: status.totalRecords || 0,
          dailyCollected: status.dailyCollected || 0,
          errorRate: status.errorRate || 0
        });
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
        const result = await response.json();
        const stats = result.data || result;
        // Ensure all numeric properties exist with defaults
        setDatabaseStats({
          totalVehicles: stats.totalVehicles || 0,
          totalMakes: stats.totalMakes || 0,
          copartRecords: stats.copartRecords || 0,
          iaaiRecords: stats.iaaiRecords || 0,
          recentRecords: stats.recentRecords || 0,
          oldestRecord: stats.oldestRecord || 'N/A',
          newestRecord: stats.newestRecord || 'N/A',
          topMakes: stats.topMakes || [],
          modelsByMake: stats.modelsByMake || {},
          recordsByMonth: stats.recordsByMonth || [],
          avgPriceByMake: stats.avgPriceByMake || []
        });
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
      const searches: any[] = [];
      
      selectedMakes.forEach(make => {
        const modelsForMake = selectedModels[make] || [];
        
        if (modelsForMake.length === 0) {
          // No specific models selected, collect all models for this make
          searches.push({
            make,
            yearFrom: parseInt(yearFrom),
            yearTo: parseInt(yearTo),
            daysBack: parseInt(daysBack)
          });
        } else {
          // Specific models selected, create separate searches for each
          modelsForMake.forEach(model => {
            searches.push({
              make,
              model,
              yearFrom: parseInt(yearFrom),
              yearTo: parseInt(yearTo),
              daysBack: parseInt(daysBack)
            });
          });
        }
      });

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
      
      // Clear selections immediately
      setSelectedMakes([]);
      setSelectedModels({});
      
      // Refresh status and jobs after a short delay
      setTimeout(() => {
        fetchSystemStatus();
        fetchJobs();
      }, 1000);
      
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
    setSelectedModels({});
  };

  const toggleModelSelection = (make: string, model: string) => {
    setSelectedModels(prev => {
      const current = prev[make] || [];
      const updated = current.includes(model)
        ? current.filter(m => m !== model)
        : [...current, model];
      
      return {
        ...prev,
        [make]: updated
      };
    });
  };

  const getTotalSelections = () => {
    let total = 0;
    selectedMakes.forEach(make => {
      const models = selectedModels[make] || [];
      total += models.length === 0 ? 1 : models.length;
    });
    return total;
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

        <TabsContent value="collect" className="space-y-4 lg:space-y-6">
          {/* Real-time Collection Status - Mobile First */}
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-950 dark:to-indigo-950">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm lg:text-base">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Loader className="h-4 w-4 lg:h-5 lg:w-5 animate-spin text-blue-600" />
                    <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  {systemStatus?.isRunning ? 'Collection System Active' : 'Collection System Ready'}
                </div>
                <div className="text-xs lg:text-sm text-blue-600 font-normal">
                  Live Updates
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* System Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
                <div className="text-center p-2 lg:p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <div className="text-xs text-muted-foreground">Queue</div>
                  <div className="font-bold text-base lg:text-lg text-blue-600">{systemStatus?.queueSize || 0}</div>
                </div>
                <div className="text-center p-2 lg:p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <div className="text-xs text-muted-foreground">Today</div>
                  <div className="font-bold text-base lg:text-lg text-green-600">{systemStatus?.dailyCollected || 0}</div>
                </div>
                <div className="text-center p-2 lg:p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="font-bold text-base lg:text-lg">{(systemStatus?.totalRecords || 0).toLocaleString()}</div>
                </div>
                <div className="text-center p-2 lg:p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <div className="text-xs text-muted-foreground">Errors</div>
                  <div className="font-bold text-base lg:text-lg text-red-600">{((systemStatus?.errorRate || 0) * 100).toFixed(1)}%</div>
                </div>
              </div>

              {/* Active Jobs */}
              {systemStatus?.isRunning && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <span>Active Collections</span>
                    <Badge variant="secondary" className="text-xs">{jobs.filter(job => job.status === 'running').length}</Badge>
                  </h4>
                  {jobs.filter(job => job.status === 'running').map((job) => (
                    <div key={job.id} className="bg-white dark:bg-gray-900 rounded-lg p-3 lg:p-4 border">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                            <Loader className="h-3 w-3 lg:h-4 lg:w-4 animate-spin text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm lg:text-base truncate">{job.make}</h4>
                            <p className="text-xs lg:text-sm text-muted-foreground">
                              {job.currentModel && (
                                <span className="block lg:inline">
                                  Collecting: {job.currentModel}
                                  {job.totalModels && job.modelsCompleted && (
                                    <span className="ml-1">({job.modelsCompleted}/{job.totalModels})</span>
                                  )}
                                </span>
                              )}
                              <span className="block lg:inline lg:ml-2">
                                {job.recordsCollected} records • {job.yearFrom}-{job.yearTo}
                              </span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 lg:gap-3">
                          <Badge variant="default" className="text-xs">
                            Running
                          </Badge>
                          <span className="text-xs lg:text-sm font-medium min-w-[3rem] text-right">
                            {job.progress}%
                          </span>
                        </div>
                      </div>
                      
                      {job.progress > 0 && (
                        <div className="mt-3">
                          <Progress value={job.progress} className="h-1.5 lg:h-2" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Multi-Vehicle Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm lg:text-base">
                <Search className="h-4 w-4 lg:h-5 lg:w-5" />
                Multi-Vehicle Collection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 lg:space-y-6">
              {/* Vehicle Selection */}
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
                  <Label className="text-sm lg:text-base font-medium">
                    Select Vehicle Makes ({selectedMakes.length} makes, {getTotalSelections()} total searches)
                  </Label>
                  <div className="flex flex-wrap gap-2 lg:space-x-2">
                    <Button variant="outline" size="sm" onClick={selectAllMakes} className="text-xs lg:text-sm">
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearAllMakes} className="text-xs lg:text-sm">
                      Clear All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-xs lg:text-sm"
                    >
                      {showAdvanced ? 'Simple' : 'Advanced'} Mode
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {vehicleMakes.map((make) => (
                    <Button
                      key={make}
                      variant={selectedMakes.includes(make) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleMakeSelection(make)}
                      className="justify-start"
                    >
                      {make}
                      {selectedMakes.includes(make) && selectedModels[make]?.length > 0 && (
                        <span className="ml-1 text-xs">({selectedModels[make].length})</span>
                      )}
                    </Button>
                  ))}
                </div>

                {/* Model Selection */}
                {showAdvanced && selectedMakes.length > 0 && (
                  <div className="space-y-4 mt-6 p-4 border rounded-lg bg-muted/50">
                    <Label className="text-base font-medium">Advanced Model Selection</Label>
                    <div className="space-y-3">
                      {selectedMakes.map((make) => {
                        const availableModels = databaseStats?.modelsByMake?.[make] || [];
                        const selectedForMake = selectedModels[make] || [];
                        
                        return (
                          <div key={make} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{make}</span>
                              <span className="text-sm text-muted-foreground">
                                {availableModels.length} models available
                              </span>
                            </div>
                            
                            {availableModels.length > 0 ? (
                              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-1">
                                {availableModels.slice(0, 14).map((modelData) => (
                                  <Button
                                    key={`${make}-${modelData.model}`}
                                    variant={selectedForMake.includes(modelData.model) ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleModelSelection(make, modelData.model)}
                                    className="text-xs h-8"
                                    title={`${modelData.model} (${modelData.count} records)`}
                                  >
                                    {modelData.model}
                                  </Button>
                                ))}
                                {availableModels.length > 14 && (
                                  <span className="text-xs text-muted-foreground self-center">
                                    +{availableModels.length - 14} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No model data available for {make}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                    Estimated {getTotalSelections()} total searches will be initiated with 5-second intervals between each collection.
                    {showAdvanced && Object.keys(selectedModels).some(make => selectedModels[make]?.length > 0) && (
                      <span className="block mt-1">
                        Advanced mode: Specific models selected for targeted data collection.
                      </span>
                    )}
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