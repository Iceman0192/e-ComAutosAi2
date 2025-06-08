import { useUsage } from '@/contexts/UsageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Crown, Zap, Database, BarChart3 } from 'lucide-react';

interface UsageMonitorProps {
  compact?: boolean;
}

export function UsageMonitor({ compact = false }: UsageMonitorProps) {
  const { usageStats, limits, getRemainingUsage, features } = useUsage();
  const remaining = getRemainingUsage();

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium">Usage Overview</div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Daily Searches</span>
            <span>{limits.dailySearches === -1 ? 'Unlimited' : `${usageStats.dailySearches}/${limits.dailySearches}`}</span>
          </div>
          {limits.dailySearches !== -1 && (
            <Progress 
              value={getUsagePercentage(usageStats.dailySearches, limits.dailySearches)} 
              className="h-1"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Usage Dashboard
        </CardTitle>
        <CardDescription>
          Monitor your current usage and limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Searches */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Daily Searches</span>
            </div>
            <Badge variant={remaining.dailySearches === -1 ? "default" : remaining.dailySearches > 5 ? "default" : "destructive"}>
              {limits.dailySearches === -1 ? 'Unlimited' : `${remaining.dailySearches} left`}
            </Badge>
          </div>
          {limits.dailySearches !== -1 && (
            <div className="space-y-1">
              <Progress 
                value={getUsagePercentage(usageStats.dailySearches, limits.dailySearches)} 
                className="h-2"
              />
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {usageStats.dailySearches} of {limits.dailySearches} used today
              </div>
            </div>
          )}
        </div>

        {/* Monthly VIN Lookups */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="font-medium">VIN Lookups</span>
            </div>
            <Badge variant={remaining.monthlyVinLookups === -1 ? "default" : remaining.monthlyVinLookups > 2 ? "default" : "destructive"}>
              {limits.monthlyVinLookups === -1 ? 'Unlimited' : `${remaining.monthlyVinLookups} left`}
            </Badge>
          </div>
          {limits.monthlyVinLookups !== -1 && (
            <div className="space-y-1">
              <Progress 
                value={getUsagePercentage(usageStats.monthlyVinLookups, limits.monthlyVinLookups)} 
                className="h-2"
              />
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {usageStats.monthlyVinLookups} of {limits.monthlyVinLookups} used this month
              </div>
            </div>
          )}
        </div>

        {/* Monthly Exports */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-green-600" />
              <span className="font-medium">Data Exports</span>
            </div>
            <Badge variant={remaining.monthlyExports === -1 ? "default" : remaining.monthlyExports > 5 ? "default" : "destructive"}>
              {limits.monthlyExports === -1 ? 'Unlimited' : `${remaining.monthlyExports} left`}
            </Badge>
          </div>
          {limits.monthlyExports !== -1 && (
            <div className="space-y-1">
              <Progress 
                value={getUsagePercentage(usageStats.monthlyExports, limits.monthlyExports)} 
                className="h-2"
              />
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {usageStats.monthlyExports} of {limits.monthlyExports} used this month
              </div>
            </div>
          )}
        </div>

        {/* AI Analyses */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-600" />
              <span className="font-medium">AI Analyses</span>
            </div>
            <Badge variant={remaining.monthlyAiAnalyses === -1 ? "default" : remaining.monthlyAiAnalyses > 2 ? "default" : "destructive"}>
              {limits.monthlyAiAnalyses === -1 ? 'Unlimited' : `${remaining.monthlyAiAnalyses} left`}
            </Badge>
          </div>
          {limits.monthlyAiAnalyses !== -1 && (
            <div className="space-y-1">
              <Progress 
                value={getUsagePercentage(usageStats.monthlyAiAnalyses, limits.monthlyAiAnalyses)} 
                className="h-2"
              />
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {usageStats.monthlyAiAnalyses} of {limits.monthlyAiAnalyses} used this month
              </div>
            </div>
          )}
        </div>

        {/* Low Usage Warning */}
        {(
          (limits.dailySearches !== -1 && remaining.dailySearches <= 2) ||
          (limits.monthlyVinLookups !== -1 && remaining.monthlyVinLookups <= 1) ||
          (limits.monthlyExports !== -1 && remaining.monthlyExports <= 2) ||
          (limits.monthlyAiAnalyses !== -1 && remaining.monthlyAiAnalyses <= 1)
        ) && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Usage Limit Warning</span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              You're approaching your usage limits. Consider upgrading your plan for higher limits.
            </p>
            <Button size="sm" className="mt-2 bg-yellow-600 hover:bg-yellow-700">
              Upgrade Plan
            </Button>
          </div>
        )}

        {/* Feature Access */}
        <div className="pt-4 border-t">
          <div className="text-sm font-medium mb-3">Available Features</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={features.advancedFilters ? 'text-green-600' : 'text-gray-400'}>
              {features.advancedFilters ? '✓' : '✗'} Advanced Filters
            </div>
            <div className={features.priceAlerts ? 'text-green-600' : 'text-gray-400'}>
              {features.priceAlerts ? '✓' : '✗'} Price Alerts
            </div>
            <div className={features.bulkExport ? 'text-green-600' : 'text-gray-400'}>
              {features.bulkExport ? '✓' : '✗'} Bulk Export
            </div>
            <div className={features.apiAccess ? 'text-green-600' : 'text-gray-400'}>
              {features.apiAccess ? '✓' : '✗'} API Access
            </div>
            <div className={features.customReports ? 'text-green-600' : 'text-gray-400'}>
              {features.customReports ? '✓' : '✗'} Custom Reports
            </div>
            <div className={features.prioritySupport ? 'text-green-600' : 'text-gray-400'}>
              {features.prioritySupport ? '✓' : '✗'} Priority Support
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}