import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Car, 
  BarChart3, 
  Database, 
  Search, 
  Users, 
  Settings,
  TrendingUp,
  Activity,
  Clock,
  Loader2
} from 'lucide-react';
import { Link } from 'wouter';

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const result = await response.json();
          setDashboardStats(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
    
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchDashboardStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getQuickActions = () => {
    const actions = [
      {
        title: 'Copart Search',
        description: 'Search Copart auction database',
        icon: Car,
        href: '/',
        permission: 'BASIC_SEARCH',
        color: 'bg-blue-500'
      },
      {
        title: 'IAAI Search', 
        description: 'Search IAAI auction database',
        icon: Search,
        href: '/iaai',
        permission: 'BASIC_SEARCH',
        color: 'bg-green-500'
      }
    ];

    if (hasPermission('CROSS_PLATFORM_SEARCH')) {
      actions.push({
        title: 'Cross-Platform Analysis',
        description: 'Combined auction data analysis',
        icon: BarChart3,
        href: '/cross-platform',
        permission: 'CROSS_PLATFORM_SEARCH',
        color: 'bg-purple-500'
      });
    }

    // Admin-only features
    if (user?.role === 'admin') {
      actions.push({
        title: 'Datasets',
        description: 'Manage vehicle datasets',
        icon: Database,
        href: '/datasets',
        permission: 'ADMIN',
        color: 'bg-orange-500'
      });

      actions.push({
        title: 'Team Management',
        description: 'Manage team members and permissions',
        icon: Users,
        href: '/team',
        permission: 'ADMIN',
        color: 'bg-gray-500'
      });
    }

    return actions;
  };

  const quickActions = getQuickActions();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Your vehicle auction intelligence dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {user?.role.toUpperCase()} TIER
          </Badge>
          <Badge 
            variant={user?.subscriptionStatus === 'active' ? 'default' : 'secondary'}
            className="text-sm"
          >
            {user?.subscriptionStatus.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database Records</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardStats ? formatNumber(dashboardStats.totalRecords) : '0'}
                </div>
                <p className="text-xs text-muted-foreground">Total auction records</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Additions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardStats ? formatNumber(dashboardStats.recentAdditions) : '0'}
                </div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vehicle Makes</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardStats ? formatNumber(dashboardStats.totalMakes) : '0'}
                </div>
                <p className="text-xs text-muted-foreground">Unique manufacturers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vehicle Models</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardStats ? formatNumber(dashboardStats.totalModels) : '0'}
                </div>
                <p className="text-xs text-muted-foreground">Unique models</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                    </div>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Platform Statistics */}
      {dashboardStats && dashboardStats.platformStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Platform Statistics
            </CardTitle>
            <CardDescription>
              Average sale prices and transaction volume by auction platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(dashboardStats.platformStats).map(([platform, stats]: [string, any]) => (
                <div key={platform} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${platform === 'copart' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                      <span className="font-medium text-sm uppercase">{platform}</span>
                    </div>
                    <Badge variant="outline">{formatNumber(stats.count)} sales</Badge>
                  </div>
                  <div className="text-lg font-semibold">{formatNumber(stats.count)} records</div>
                  <p className="text-xs text-muted-foreground">Total auction records</p>
                </div>
              ))}
            </div>
            {dashboardStats.lastUpdated && (
              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                Last updated: {new Date(dashboardStats.lastUpdated).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* System Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Activity
          </CardTitle>
          <CardDescription>
            Real-time database and system insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Database records: {dashboardStats ? formatNumber(dashboardStats.totalRecords) : 'Loading...'}</span>
              </div>
              <span className="text-xs text-muted-foreground">Live count</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">New records added: {dashboardStats ? formatNumber(dashboardStats.recentAdditions) : 'Loading...'}</span>
              </div>
              <span className="text-xs text-muted-foreground">Last 30 days</span>
            </div>
            {hasPermission('FULL_ANALYTICS') && dashboardStats && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">Vehicle manufacturers: {formatNumber(dashboardStats.totalMakes)}</span>
                </div>
                <span className="text-xs text-muted-foreground">Available</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Prompt for Free Users */}
      {user?.role === 'free' && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-amber-800 dark:text-amber-200">
              Unlock Premium Features
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              Upgrade to Gold or Platinum for advanced analytics and unlimited searches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="bg-amber-600 hover:bg-amber-700">
              View Pricing Plans
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}