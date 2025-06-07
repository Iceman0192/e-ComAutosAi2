import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Eye, Download, TrendingUp } from 'lucide-react';
import { useLocation } from 'wouter';

export function UsageTracker() {
  const { user, getPlanLimits, getRemainingUsage } = useAuth();
  const [, setLocation] = useLocation();
  
  if (!user) return null;
  
  const limits = getPlanLimits();
  const remaining = getRemainingUsage();
  
  if (!limits || !remaining) return null;

  const usage = user.usage || { 
    dailySearches: 0, 
    monthlyVinLookups: 0, 
    monthlyExports: 0, 
    lastResetDate: new Date().toISOString() 
  };

  const getProgressValue = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getProgressColor = (used: number, limit: number) => {
    if (limit === -1) return 'bg-green-500'; // Unlimited
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Unlimited' : limit.toLocaleString();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage Overview
            </CardTitle>
            <CardDescription>
              Track your current usage against your {user.role.charAt(0).toUpperCase() + user.role.slice(1)} plan limits
            </CardDescription>
          </div>
          <Badge variant={user.role === 'admin' ? 'default' : user.role === 'platinum' ? 'secondary' : 'outline'}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Plan
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Searches */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Daily Searches</span>
            </div>
            <span className="text-sm text-gray-600">
              {usage.dailySearches} / {formatLimit(limits.dailySearches)}
            </span>
          </div>
          {limits.dailySearches !== -1 && (
            <Progress 
              value={getProgressValue(usage.dailySearches, limits.dailySearches)}
              className="h-2"
            />
          )}
          {limits.dailySearches === -1 && (
            <div className="text-sm text-green-600 font-medium">✨ Unlimited searches available</div>
          )}
        </div>

        {/* Monthly VIN Lookups */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Monthly VIN Lookups</span>
            </div>
            <span className="text-sm text-gray-600">
              {usage.monthlyVinLookups} / {formatLimit(limits.monthlyVinLookups)}
            </span>
          </div>
          {limits.monthlyVinLookups !== -1 && (
            <Progress 
              value={getProgressValue(usage.monthlyVinLookups, limits.monthlyVinLookups)}
              className="h-2"
            />
          )}
          {limits.monthlyVinLookups === -1 && (
            <div className="text-sm text-green-600 font-medium">✨ Unlimited VIN lookups available</div>
          )}
        </div>

        {/* Monthly Exports */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-green-600" />
              <span className="font-medium">Monthly Exports</span>
            </div>
            <span className="text-sm text-gray-600">
              {usage.monthlyExports} / {formatLimit(limits.monthlyExports)}
            </span>
          </div>
          {limits.monthlyExports !== -1 && (
            <Progress 
              value={getProgressValue(usage.monthlyExports, limits.monthlyExports)}
              className="h-2"
            />
          )}
          {limits.monthlyExports === -1 && (
            <div className="text-sm text-green-600 font-medium">✨ Unlimited exports available</div>
          )}
        </div>

        {/* Upgrade prompt for users approaching limits */}
        {(
          (limits.dailySearches !== -1 && usage.dailySearches / limits.dailySearches > 0.8) ||
          (limits.monthlyVinLookups !== -1 && usage.monthlyVinLookups / limits.monthlyVinLookups > 0.8) ||
          (limits.monthlyExports !== -1 && usage.monthlyExports / limits.monthlyExports > 0.8)
        ) && user.role !== 'platinum' && user.role !== 'admin' && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Approaching Usage Limits</p>
                <p className="text-xs text-amber-600">Consider upgrading for unlimited access</p>
              </div>
              <Button size="sm" onClick={() => setLocation('/billing')}>
                Upgrade Plan
              </Button>
            </div>
          </div>
        )}

        {/* Plan Features */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Your Plan Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {limits.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reset Information */}
        <div className="pt-2 border-t text-xs text-gray-500">
          Daily limits reset at midnight UTC. Monthly limits reset on the 1st of each month.
        </div>
      </CardContent>
    </Card>
  );
}