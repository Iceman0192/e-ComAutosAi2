import { useState, useEffect } from "react";
import { Database, Play, RefreshCw, TrendingUp, Settings, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SystemStatus {
  isRunning: boolean;
  queueSize: number;
  totalRecords: number;
  dailyCollected: number;
  errorRate: number;
}

interface CollectionJob {
  id: string;
  make: string;
  priority: number;
  status: string;
  progress: number;
  recordsCollected: number;
  lastUpdated: string;
}

export default function DataCollection() {
  const { user, hasPermission } = useAuth();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [jobs, setJobs] = useState<CollectionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Manual collection form
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [yearFrom, setYearFrom] = useState<string>('2012');
  const [yearTo, setYearTo] = useState<string>('2025');
  const [daysBack, setDaysBack] = useState<string>('150');
  const [isStarting, setIsStarting] = useState(false);

  const vehicleMakes = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia', 
    'Jeep', 'Dodge', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla', 'Porsche',
    'Lexus', 'Acura', 'Infiniti', 'Cadillac', 'Lincoln'
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

  const startMakeCollection = async () => {
    if (!selectedMake) {
      setError("Please select a vehicle make");
      return;
    }

    setIsStarting(true);
    setError(null);

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
        throw new Error('Failed to start collection');
      }

      await fetchSystemStatus();
      await fetchJobs();
      setSelectedMake('');
    } catch (err) {
      setError("Failed to start collection");
      console.error('Collection error:', err);
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    if (canManageDataCollection) {
      fetchSystemStatus();
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
          <h1 className="text-3xl font-bold">Data Collection</h1>
          <p className="text-muted-foreground mt-2">
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
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Collection</h1>
          <p className="text-muted-foreground mt-2">
            Manage automated vehicle data collection from auction platforms
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => {
            fetchSystemStatus();
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

      {/* Status Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Database className={`h-8 w-8 ${systemStatus?.isRunning ? 'text-green-600' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
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
              <Settings className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Queue</p>
                <p className="text-2xl font-bold">{systemStatus?.queueSize || 19}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-emerald-600" />
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
              <Database className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold">{(systemStatus?.errorRate || 0).toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Collection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Start Collection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <Label>Vehicle Make</Label>
              <Select value={selectedMake} onValueChange={setSelectedMake}>
                <SelectTrigger>
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

            <Button
              onClick={startMakeCollection}
              disabled={!selectedMake || isStarting}
              className="w-full"
            >
              {isStarting ? 'Starting...' : 'Start Collection'}
            </Button>
          </div>

          {selectedMake && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Collection will cover <strong>{selectedMake}</strong> vehicles from <strong>{yearFrom}-{yearTo}</strong> over the last <strong>{daysBack} days</strong> from both Copart and IAAI platforms.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collection Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {jobs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No active collection jobs</p>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{job.make}</p>
                      <p className="text-sm text-muted-foreground">
                        Priority {job.priority} • {job.recordsCollected} records
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge variant={job.status === 'pending' ? 'secondary' : 'default'}>
                      {job.status}
                    </Badge>
                    {job.lastUpdated && (
                      <span className="text-sm text-muted-foreground">
                        {job.lastUpdated}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}