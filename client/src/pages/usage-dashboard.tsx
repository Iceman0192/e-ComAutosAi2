import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Clock, AlertCircle, Download, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface UsageStats {
  current: {
    freshApiCalls: number;
    aiReports: number;
    exports: number;
    searches: number;
  };
  limits: {
    freshApiCalls: number;
    aiReports: number;
    exports: number;
    searches: number;
  };
  resetDate: string;
  billingPeriod: string;
}

interface UsageHistory {
  date: string;
  freshApiCalls: number;
  aiReports: number;
  exports: number;
  searches: number;
  cost: number;
}

interface FeatureUsage {
  feature: string;
  usage: number;
  limit: number;
  percentage: number;
  lastUsed?: string;
  cost: number;
}

export default function UsageDashboard() {
  const { user, hasPermission, getPlanLimits } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [history, setHistory] = useState<UsageHistory[]>([]);
  const [features, setFeatures] = useState<FeatureUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("30d");

  const planLimits = getPlanLimits();

  useEffect(() => {
    fetchUsageStats();
    fetchUsageHistory();
    fetchFeatureUsage();
  }, [timeRange]);

  const fetchUsageStats = async () => {
    try {
      const response = await fetch('/api/usage/stats', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError("Failed to load usage statistics");
      console.error('Usage stats error:', err);
    }
  };

  const fetchUsageHistory = async () => {
    try {
      const response = await fetch(`/api/usage/history?range=${timeRange}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage history');
      }

      const data = await response.json();
      setHistory(data.history || []);
    } catch (err) {
      setError("Failed to load usage history");
      console.error('Usage history error:', err);
    }
  };

  const fetchFeatureUsage = async () => {
    try {
      const response = await fetch('/api/usage/features', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feature usage');
      }

      const data = await response.json();
      setFeatures(data.features || []);
    } catch (err) {
      setError("Failed to load feature usage");
      console.error('Feature usage error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportUsage = async () => {
    try {
      const response = await fetch(`/api/usage/export?range=${timeRange}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to export usage data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usage-report-${timeRange}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to export usage data");
      console.error('Export error:', err);
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUsageBadgeVariant = (percentage: number) => {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 75) return 'default';
    return 'secondary';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculatePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usage Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your plan usage, limits, and billing information
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={fetchUsageStats}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          
          <Button variant="outline" onClick={handleExportUsage}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current Plan: {user?.role?.toUpperCase() || 'FREEMIUM'}
            <Badge variant="outline">{stats?.billingPeriod || 'Monthly'}</Badge>
          </CardTitle>
          <CardDescription>
            Usage resets on {stats?.resetDate ? new Date(stats.resetDate).toLocaleDateString() : 'Unknown'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Usage Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fresh API Calls</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.current.freshApiCalls || 0}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{stats?.limits.freshApiCalls === -1 ? '∞' : stats?.limits.freshApiCalls}
                  </span>
                </div>
                <div className="mt-2">
                  <Progress 
                    value={calculatePercentage(stats?.current.freshApiCalls || 0, stats?.limits.freshApiCalls || 0)} 
                    className="h-2" 
                  />
                  <span className={`text-xs ${getUsageColor(calculatePercentage(stats?.current.freshApiCalls || 0, stats?.limits.freshApiCalls || 0))}`}>
                    {calculatePercentage(stats?.current.freshApiCalls || 0, stats?.limits.freshApiCalls || 0).toFixed(1)}% used
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Reports</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.current.aiReports || 0}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{stats?.limits.aiReports === -1 ? '∞' : stats?.limits.aiReports}
                  </span>
                </div>
                <div className="mt-2">
                  <Progress 
                    value={calculatePercentage(stats?.current.aiReports || 0, stats?.limits.aiReports || 0)} 
                    className="h-2" 
                  />
                  <span className={`text-xs ${getUsageColor(calculatePercentage(stats?.current.aiReports || 0, stats?.limits.aiReports || 0))}`}>
                    {calculatePercentage(stats?.current.aiReports || 0, stats?.limits.aiReports || 0).toFixed(1)}% used
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Exports</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.current.exports || 0}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{stats?.limits.exports === -1 ? '∞' : stats?.limits.exports}
                  </span>
                </div>
                <div className="mt-2">
                  <Progress 
                    value={calculatePercentage(stats?.current.exports || 0, stats?.limits.exports || 0)} 
                    className="h-2" 
                  />
                  <span className={`text-xs ${getUsageColor(calculatePercentage(stats?.current.exports || 0, stats?.limits.exports || 0))}`}>
                    {calculatePercentage(stats?.current.exports || 0, stats?.limits.exports || 0).toFixed(1)}% used
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Searches</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.current.searches || 0}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{stats?.limits.searches === -1 ? '∞' : stats?.limits.searches}
                  </span>
                </div>
                <div className="mt-2">
                  <Progress 
                    value={calculatePercentage(stats?.current.searches || 0, stats?.limits.searches || 0)} 
                    className="h-2" 
                  />
                  <span className={`text-xs ${getUsageColor(calculatePercentage(stats?.current.searches || 0, stats?.limits.searches || 0))}`}>
                    {calculatePercentage(stats?.current.searches || 0, stats?.limits.searches || 0).toFixed(1)}% used
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Usage</CardTitle>
          <CardDescription>
            Detailed breakdown of feature usage and associated costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : features.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No usage data</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Start using features to see usage statistics
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Limit</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {features.map((feature, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{feature.feature}</TableCell>
                      <TableCell>{feature.usage.toLocaleString()}</TableCell>
                      <TableCell>
                        {feature.limit === -1 ? 'Unlimited' : feature.limit.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={feature.percentage} className="w-16 h-2" />
                          <Badge variant={getUsageBadgeVariant(feature.percentage)}>
                            {feature.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {feature.lastUsed 
                          ? new Date(feature.lastUsed).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>{formatCurrency(feature.cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage History */}
      <Card>
        <CardHeader>
          <CardTitle>Usage History</CardTitle>
          <CardDescription>
            Historical usage data for the selected time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No history available</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Usage history will appear here as you use the platform
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>API Calls</TableHead>
                    <TableHead>AI Reports</TableHead>
                    <TableHead>Exports</TableHead>
                    <TableHead>Searches</TableHead>
                    <TableHead>Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                      <TableCell>{entry.freshApiCalls.toLocaleString()}</TableCell>
                      <TableCell>{entry.aiReports.toLocaleString()}</TableCell>
                      <TableCell>{entry.exports.toLocaleString()}</TableCell>
                      <TableCell>{entry.searches.toLocaleString()}</TableCell>
                      <TableCell>{formatCurrency(entry.cost)}</TableCell>
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