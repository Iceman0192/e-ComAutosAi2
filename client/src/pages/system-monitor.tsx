import { useState, useEffect } from "react";
import { Monitor, Cpu, MemoryStick, HardDrive, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
  };
  memory: {
    used: number;
    total: number;
    usage: number;
  };
  disk: {
    used: number;
    total: number;
    usage: number;
  };
  network: {
    inbound: number;
    outbound: number;
  };
  uptime: number;
  loadAverage: number[];
}

interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  port?: number;
  uptime: string;
  memoryUsage: number;
  cpuUsage: number;
  lastRestart?: string;
}

interface DatabaseStatus {
  connected: boolean;
  responseTime: number;
  activeConnections: number;
  totalQueries: number;
  slowQueries: number;
  errorRate: number;
}

export default function SystemMonitor() {
  const { user, hasPermission } = useAuth();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [database, setDatabase] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canMonitorSystem = hasPermission('SYSTEM_MONITORING');

  useEffect(() => {
    if (canMonitorSystem) {
      fetchSystemMetrics();
      fetchServiceStatus();
      fetchDatabaseStatus();
      
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchSystemMetrics();
        fetchServiceStatus();
        fetchDatabaseStatus();
      }, 30000);

      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [canMonitorSystem]);

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch('/api/admin/system/metrics', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch system metrics');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError("Failed to load system metrics");
      console.error('System metrics error:', err);
    }
  };

  const fetchServiceStatus = async () => {
    try {
      const response = await fetch('/api/admin/system/services', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch service status');
      }

      const data = await response.json();
      setServices(data.services || []);
    } catch (err) {
      setError("Failed to load service status");
      console.error('Service status error:', err);
    }
  };

  const fetchDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/admin/system/database', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch database status');
      }

      const data = await response.json();
      setDatabase(data);
    } catch (err) {
      setError("Failed to load database status");
      console.error('Database status error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-600';
      case 'stopped': return 'text-gray-500';
      case 'error': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'running': return 'default';
      case 'stopped': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage > 90) return 'text-red-600';
    if (usage > 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (!canMonitorSystem) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Monitor</h1>
          <p className="text-muted-foreground">
            Monitor system performance, services, and resource usage
          </p>
        </div>

        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            System Monitoring requires admin access. You're currently on the {user?.role || 'Freemium'} plan.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Monitor</h1>
        <p className="text-muted-foreground">
          Monitor system performance, services, and resource usage
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* System Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : `${metrics?.cpu.usage || 0}%`}
            </div>
            {metrics && (
              <div className="mt-2">
                <Progress value={metrics.cpu.usage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.cpu.cores} cores
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : `${metrics?.memory.usage || 0}%`}
            </div>
            {metrics && (
              <div className="mt-2">
                <Progress value={metrics.memory.usage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : `${metrics?.disk.usage || 0}%`}
            </div>
            {metrics && (
              <div className="mt-2">
                <Progress value={metrics.disk.usage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {formatBytes(metrics.disk.used)} / {formatBytes(metrics.disk.total)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : formatUptime(metrics?.uptime || 0)}
            </div>
            {metrics && (
              <p className="text-xs text-muted-foreground mt-2">
                Load: {metrics.loadAverage?.[0]?.toFixed(2) || 0}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Database Status */}
      <Card>
        <CardHeader>
          <CardTitle>Database Status</CardTitle>
          <CardDescription>
            PostgreSQL database performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                {database?.connected ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">
                  {database?.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="text-sm">
                <span className="text-muted-foreground">Response Time: </span>
                <span className={getUsageColor(database?.responseTime || 0)}>
                  {database?.responseTime || 0}ms
                </span>
              </div>
              
              <div className="text-sm">
                <span className="text-muted-foreground">Active Connections: </span>
                <span>{database?.activeConnections || 0}</span>
              </div>
              
              <div className="text-sm">
                <span className="text-muted-foreground">Total Queries: </span>
                <span>{(database?.totalQueries || 0).toLocaleString()}</span>
              </div>
              
              <div className="text-sm">
                <span className="text-muted-foreground">Slow Queries: </span>
                <span className={database?.slowQueries ? 'text-yellow-600' : ''}>
                  {database?.slowQueries || 0}
                </span>
              </div>
              
              <div className="text-sm">
                <span className="text-muted-foreground">Error Rate: </span>
                <span className={getUsageColor(database?.errorRate || 0)}>
                  {(database?.errorRate || 0).toFixed(2)}%
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle>Services Status</CardTitle>
          <CardDescription>
            Application services and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No services found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No application services are currently being monitored
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Port</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Memory</TableHead>
                    <TableHead>CPU</TableHead>
                    <TableHead>Last Restart</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(service.status)}>
                          {service.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{service.port || '-'}</TableCell>
                      <TableCell>{service.uptime}</TableCell>
                      <TableCell>
                        <span className={getUsageColor(service.memoryUsage)}>
                          {formatBytes(service.memoryUsage)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={getUsageColor(service.cpuUsage)}>
                          {service.cpuUsage}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {service.lastRestart 
                          ? new Date(service.lastRestart).toLocaleDateString()
                          : 'Never'
                        }
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