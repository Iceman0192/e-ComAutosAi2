import { useAuth, UserRole } from '../../contexts/AuthContext';
import { useUsage } from '../../contexts/UsageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Search, Database, CreditCard } from 'lucide-react';

export default function UsageDisplay() {
  const { user } = useAuth();
  const { usageStats, limits, remainingSearches, remainingAPICalls } = useUsage();

  if (!user) return null;

  const isUnlimited = (value: number) => value === -1;
  
  const searchProgress = isUnlimited(limits.monthlySearches) 
    ? 0 
    : (usageStats.searchesThisMonth / limits.monthlySearches) * 100;
    
  const apiProgress = isUnlimited(limits.monthlySearches * limits.apiCallsPerSearch)
    ? 0
    : (usageStats.apiCallsThisMonth / (limits.monthlySearches * limits.apiCallsPerSearch)) * 100;

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.FREE: return 'bg-gray-100 text-gray-800';
      case UserRole.GOLD: return 'bg-yellow-100 text-yellow-800';
      case UserRole.PLATINUM: return 'bg-purple-100 text-purple-800';
      case UserRole.ADMIN: return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Usage Overview</CardTitle>
          <Badge className={getRoleColor(user.role)}>
            {user.role.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vehicle Searches */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Vehicle Searches</span>
          </div>
          {isUnlimited(limits.monthlySearches) ? (
            <div className="text-sm text-green-600 font-medium">
              ✓ Unlimited searches
            </div>
          ) : (
            <>
              <Progress value={searchProgress} className="h-2" />
              <div className="flex justify-between text-xs text-gray-600">
                <span>{usageStats.searchesThisMonth} used</span>
                <span>{remainingSearches} remaining</span>
              </div>
            </>
          )}
        </div>

        {/* API Calls */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Fresh Data Calls</span>
          </div>
          {isUnlimited(limits.monthlySearches * limits.apiCallsPerSearch) ? (
            <div className="text-sm text-green-600 font-medium">
              ✓ Unlimited API calls
            </div>
          ) : (
            <>
              <Progress value={apiProgress} className="h-2" />
              <div className="flex justify-between text-xs text-gray-600">
                <span>{usageStats.apiCallsThisMonth} used</span>
                <span>{remainingAPICalls} remaining</span>
              </div>
            </>
          )}
        </div>

        {/* Cached Data Credit */}
        {limits.cachedPageCredit > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">Cached Data Credit</span>
            </div>
            <div className="text-xs text-gray-600">
              {usageStats.cachedPagesViewed} cached pages viewed
              <br />
              <span className="text-green-600">
                Next credit in {limits.cachedPageCredit - (usageStats.cachedPagesViewed % limits.cachedPageCredit)} pages
              </span>
            </div>
          </div>
        )}

        {/* Usage Tips */}
        {user.role === UserRole.FREE && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <div className="font-medium mb-1">💡 Pro Tips:</div>
              <ul className="space-y-1">
                <li>• Use all 10 pages per search for best comparables</li>
                <li>• View cached data: {limits.cachedPageCredit} pages = 1 API credit back</li>
                <li>• Focus on exact make/model matches</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}