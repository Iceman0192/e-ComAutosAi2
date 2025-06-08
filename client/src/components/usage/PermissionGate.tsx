import { ReactNode } from 'react';
import { useUsage } from '@/contexts/UsageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Zap, AlertTriangle } from 'lucide-react';

interface PermissionGateProps {
  action?: 'search' | 'vin' | 'export' | 'ai';
  feature?: 'basicSearch' | 'advancedFilters' | 'priceAlerts' | 'bulkExport' | 'apiAccess' | 'prioritySupport' | 'customReports';
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
}

export function PermissionGate({ action, feature, children, fallback, showUpgrade = true }: PermissionGateProps) {
  const { canPerformAction, hasFeature, getRemainingUsage, limits } = useUsage();

  // Check action permissions
  if (action && !canPerformAction(action)) {
    const remaining = getRemainingUsage();
    const isUnlimited = limits.dailySearches === -1 && limits.monthlyVinLookups === -1;
    
    const actionNames = {
      search: 'Daily Searches',
      vin: 'VIN Lookups',
      export: 'Data Exports',
      ai: 'AI Analyses'
    };

    const limitReached = fallback || (
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
            <AlertTriangle className="h-5 w-5" />
            Usage Limit Reached
          </CardTitle>
          <CardDescription className="text-orange-700 dark:text-orange-300">
            You've reached your {actionNames[action]} limit for this period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-orange-700 dark:text-orange-300">
              {action === 'search' && `Daily limit: ${limits.dailySearches} searches`}
              {action === 'vin' && `Monthly limit: ${limits.monthlyVinLookups} VIN lookups`}
              {action === 'export' && `Monthly limit: ${limits.monthlyExports} exports`}
              {action === 'ai' && `Monthly limit: ${limits.monthlyAiAnalyses} AI analyses`}
            </div>
            {showUpgrade && !isUnlimited && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
                <Button variant="outline" className="border-orange-600 text-orange-600">
                  View Usage Details
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );

    return <>{limitReached}</>;
  }

  // Check feature permissions
  if (feature && !hasFeature(feature)) {
    const featureNames = {
      basicSearch: 'Basic Search',
      advancedFilters: 'Advanced Filters',
      priceAlerts: 'Price Alerts',
      bulkExport: 'Bulk Export',
      apiAccess: 'API Access',
      prioritySupport: 'Priority Support',
      customReports: 'Custom Reports'
    };

    const featureBlocked = fallback || (
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Lock className="h-5 w-5" />
            Premium Feature
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            {featureNames[feature]} is available in higher tier plans.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600 text-white">
                <Zap className="h-3 w-3 mr-1" />
                Upgrade Required
              </Badge>
            </div>
            {showUpgrade && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Gold
                </Button>
                <Button variant="outline" className="border-blue-600 text-blue-600">
                  Compare Plans
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );

    return <>{featureBlocked}</>;
  }

  // If all permissions pass, render children
  return <>{children}</>;
}

// Helper component for inline feature checks
export function FeatureBadge({ feature, children }: { feature: 'basicSearch' | 'advancedFilters' | 'priceAlerts' | 'bulkExport' | 'apiAccess' | 'prioritySupport' | 'customReports'; children: ReactNode }) {
  const { hasFeature } = useUsage();
  
  if (!hasFeature(feature)) {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Badge className="bg-orange-500 text-white">
            <Lock className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}