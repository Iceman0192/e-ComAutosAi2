import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { PlayCircle, StopCircle, Database, TrendingUp, Clock, Activity, Car, Target } from "lucide-react";

interface CollectionJob {
  id: string;
  make: string;
  model?: string;
  yearFrom: number;
  yearTo: number;
  priority: number;
  lastCollected?: string;
  copartCompleted?: boolean;
  iaaiCompleted?: boolean;
  lastCopartPage?: number;
  lastIaaiPage?: number;
}

interface CollectionStatus {
  isRunning: boolean;
  queueLength: number;
  nextJob?: CollectionJob;
  lastProcessed?: CollectionJob;
  availableJobs?: CollectionJob[];
}

interface VehicleMake {
  make: string;
  totalRecords: number;
  copartRecords: number;
  iaaiRecords: number;
  completed: boolean;
}

export default function DataCollectionPage() {
  const [status, setStatus] = useState<CollectionStatus | null>(null);
  const [vehicleProgress, setVehicleProgress] = useState<VehicleMake[]>([]);
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/data-collection/status', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch collection status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching status:', error);
      toast({
        title: "Error",
        description: "Network error while fetching status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startCollection = async () => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/data-collection/start', {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Data collection started successfully",
        });
        await fetchStatus();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to start collection",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error starting collection:', error);
      toast({
        title: "Error",
        description: "Network error while starting collection",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const stopCollection = async () => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/data-collection/stop', {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Data collection stopped successfully",
        });
        await fetchStatus();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to stop collection",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error stopping collection:', error);
      toast({
        title: "Error",
        description: "Network error while stopping collection",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Automated Data Collection</h1>
        <p className="text-gray-600">
          Manage the automated collection system to expand your vehicle database
        </p>
      </div>

      {/* Control Panel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Collection Control
          </CardTitle>
          <CardDescription>
            Start or stop the automated data collection service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${status?.isRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">
                {status?.isRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
            
            <div className="flex gap-2">
              {!status?.isRunning ? (
                <Button 
                  onClick={startCollection} 
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Start Collection
                </Button>
              ) : (
                <Button 
                  onClick={stopCollection} 
                  disabled={actionLoading}
                  variant="destructive"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Stop Collection
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Length</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.queueLength || 0}</div>
            <p className="text-xs text-muted-foreground">
              Collection jobs in queue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={status?.isRunning ? "default" : "secondary"}>
                {status?.isRunning ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Current system state
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30m</div>
            <p className="text-xs text-muted-foreground">
              Collection frequency
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Next Job Info */}
      {status?.nextJob && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Next Collection Job</CardTitle>
            <CardDescription>
              Details about the next vehicle data to be collected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Make</p>
                <p className="text-lg font-semibold">{status.nextJob.make}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Model</p>
                <p className="text-lg font-semibold">{status.nextJob.model || 'All Models'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Year Range</p>
                <p className="text-lg font-semibold">{status.nextJob.yearFrom}-{status.nextJob.yearTo}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Priority</p>
                <Badge variant={status.nextJob.priority <= 2 ? "default" : "secondary"}>
                  Level {status.nextJob.priority}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Processed Job */}
      {status?.lastProcessed && (
        <Card>
          <CardHeader>
            <CardTitle>Last Processed Job</CardTitle>
            <CardDescription>
              Most recently completed collection job
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Make</p>
                <p className="text-lg font-semibold">{status.lastProcessed.make}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Model</p>
                <p className="text-lg font-semibold">{status.lastProcessed.model || 'All Models'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Year Range</p>
                <p className="text-lg font-semibold">{status.lastProcessed.yearFrom}-{status.lastProcessed.yearTo}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Priority</p>
                <Badge variant={status.lastProcessed.priority <= 2 ? "default" : "secondary"}>
                  Level {status.lastProcessed.priority}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-sm">
                  {status.lastProcessed.lastCollected 
                    ? new Date(status.lastProcessed.lastCollected).toLocaleString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Collection Strategy</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <ul className="space-y-2 text-sm">
            <li>• <strong>Priority 1:</strong> Luxury vehicles (BMW, Mercedes-Benz, Audi, Lexus, Tesla)</li>
            <li>• <strong>Priority 2:</strong> Popular mainstream vehicles (Honda Civic/Accord, Toyota Camry/Corolla, etc.)</li>
            <li>• <strong>Priority 3:</strong> Complete make collections for major brands</li>
            <li>• <strong>Data Sources:</strong> Both Copart and IAAI auction platforms</li>
            <li>• <strong>Collection Window:</strong> Last 90 days of sales data</li>
            <li>• <strong>Target:</strong> 500,000+ records within 30 days</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}