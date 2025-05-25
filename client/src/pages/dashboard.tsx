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
  Clock
} from 'lucide-react';
import { Link } from 'wouter';

export default function Dashboard() {
  const { user, hasPermission } = useAuth();

  const getDashboardStats = () => {
    // These will be real stats from the backend later
    return {
      recentSearches: 12,
      savedDatasets: hasPermission('FULL_ANALYTICS') ? 5 : 0,
      monthlyUsage: '127/500',
      teamMembers: 1
    };
  };

  const stats = getDashboardStats();

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

    if (hasPermission('FULL_ANALYTICS')) {
      actions.push({
        title: 'Datasets',
        description: 'Manage your vehicle datasets',
        icon: Database,
        href: '/datasets',
        permission: 'FULL_ANALYTICS',
        color: 'bg-orange-500'
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Searches</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentSearches}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyUsage}</div>
            <p className="text-xs text-muted-foreground">API calls this month</p>
          </CardContent>
        </Card>

        {hasPermission('FULL_ANALYTICS') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saved Datasets</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.savedDatasets}</div>
              <p className="text-xs text-muted-foreground">Ready for analysis</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamMembers}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>
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

      {/* Recent Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Your latest searches and saved data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Searched 2023 Honda Civic on Copart</span>
              </div>
              <span className="text-xs text-muted-foreground">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Searched Toyota Camry on IAAI</span>
              </div>
              <span className="text-xs text-muted-foreground">5 hours ago</span>
            </div>
            {hasPermission('FULL_ANALYTICS') && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">Created dataset "Q4 Luxury Vehicles"</span>
                </div>
                <span className="text-xs text-muted-foreground">1 day ago</span>
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