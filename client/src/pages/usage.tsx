import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Search, Brain, FileText, Download } from 'lucide-react';

interface UsageStats {
  currentTier: string;
  currentUsage: {
    searches: number;
    aiAnalyses: number;
    vinSearches: number;
    exports: number;
  };
  limits: {
    dailySearches: number;
    aiAnalysisLimit: number;
    vinSearchLimit: number;
    exportLimit: number;
  };
  remaining: {
    searches: number;
    aiAnalyses: number;
    vinSearches: number;
    exports: number;
  };
  lastReset: string;
}

export default function UsagePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const fetchUsageStats = async () => {
    try {
      const response = await apiRequest('GET', '/api/usage/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const testUsageLimit = async (action: string) => {
    setTesting(true);
    try {
      const response = await apiRequest('POST', '/api/usage/test-limit', { action });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Usage Tracked",
          description: `${action} completed. Remaining: ${data.remaining === -1 ? 'Unlimited' : data.remaining}`,
        });
        fetchUsageStats(); // Refresh stats
      } else if (data.usageLimit) {
        toast({
          title: "Limit Reached",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test usage limit",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsageStats();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to view usage statistics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Unable to load usage statistics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (current: number, limit: number) => {
    if (limit === -1) return 'bg-green-500'; // Unlimited
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Unlimited' : limit.toString();
  };

  const formatRemaining = (remaining: number) => {
    return remaining === -1 ? 'Unlimited' : remaining.toString();
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Usage Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your daily usage and subscription limits
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {stats.currentTier.charAt(0).toUpperCase() + stats.currentTier.slice(1)} Plan
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Searches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.currentUsage.searches} / {formatLimit(stats.limits.dailySearches)}
            </div>
            <Progress 
              value={getUsagePercentage(stats.currentUsage.searches, stats.limits.dailySearches)} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {formatRemaining(stats.remaining.searches)} remaining
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full"
              onClick={() => testUsageLimit('search')}
              disabled={testing || stats.remaining.searches === 0}
            >
              Test Search Limit
            </Button>
          </CardContent>
        </Card>

        {/* VIN Searches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIN Searches</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.currentUsage.vinSearches} / {formatLimit(stats.limits.vinSearchLimit)}
            </div>
            <Progress 
              value={getUsagePercentage(stats.currentUsage.vinSearches, stats.limits.vinSearchLimit)} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {formatRemaining(stats.remaining.vinSearches)} remaining
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full"
              onClick={() => testUsageLimit('vinSearch')}
              disabled={testing || stats.remaining.vinSearches === 0}
            >
              Test VIN Limit
            </Button>
          </CardContent>
        </Card>

        {/* AI Analysis */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Analysis</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.currentUsage.aiAnalyses} / {formatLimit(stats.limits.aiAnalysisLimit)}
            </div>
            <Progress 
              value={getUsagePercentage(stats.currentUsage.aiAnalyses, stats.limits.aiAnalysisLimit)} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {formatRemaining(stats.remaining.aiAnalyses)} remaining
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full"
              onClick={() => testUsageLimit('aiAnalysis')}
              disabled={testing || stats.remaining.aiAnalyses === 0}
            >
              Test AI Limit
            </Button>
          </CardContent>
        </Card>

        {/* Exports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Exports</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.currentUsage.exports} / {formatLimit(stats.limits.exportLimit)}
            </div>
            <Progress 
              value={getUsagePercentage(stats.currentUsage.exports, stats.limits.exportLimit)} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {formatRemaining(stats.remaining.exports)} remaining
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full"
              onClick={() => testUsageLimit('export')}
              disabled={testing || stats.remaining.exports === 0}
            >
              Test Export Limit
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Usage Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">How Usage Tracking Works</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Usage limits reset daily at midnight</li>
              <li>• Each search query counts toward your daily limit</li>
              <li>• VIN searches and AI analysis have separate limits</li>
              <li>• Upgrade your plan for higher limits or unlimited access</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Current Plan Limits (Daily)</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Searches:</span>
                  <span>{formatLimit(stats.limits.dailySearches)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VIN Searches:</span>
                  <span>{formatLimit(stats.limits.vinSearchLimit)}</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Analysis:</span>
                  <span>{formatLimit(stats.limits.aiAnalysisLimit)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Exports:</span>
                  <span>{formatLimit(stats.limits.exportLimit)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Last Reset</h4>
              <p className="text-sm text-muted-foreground">
                {new Date(stats.lastReset).toLocaleDateString()} at midnight
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Next reset: {new Date(new Date(stats.lastReset).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString()} at midnight
              </p>
            </div>
          </div>

          {(stats.remaining.searches === 0 || stats.remaining.vinSearches === 0 || 
            stats.remaining.aiAnalyses === 0 || stats.remaining.exports === 0) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Limit Reached</span>
              </div>
              <p className="text-red-700 text-sm mt-1">
                You've reached your daily limit for some features. Consider upgrading your plan for higher limits.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}