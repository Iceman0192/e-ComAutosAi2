import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  UserCheck, 
  CreditCard,
  Search,
  Brain,
  Eye,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Settings,
  X,
  Save,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import UserManagement from '@/components/admin/UserManagement';

interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  userGrowthRate: number;
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowthRate: number;
  activeSubscriptions: number;
  subscriptionsByTier: Record<string, number>;
  subscriptionGrowthRate: number;
  platformUsage: {
    totalSearches: number;
    searchesToday: number;
    aiAnalysesToday: number;
    vinSearchesToday: number;
    exportsToday: number;
  };
  recentActivity: Array<{
    id: number;
    type: string;
    description: string;
    timestamp: Date;
    userEmail: string;
  }>;
  usersByTier: Record<string, number>;
  topActiveUsers: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    totalSearches: number;
    lastActive: Date;
  }>;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  subscriptionStatus: string | null;
  isTrialActive: boolean;
  trialEndsAt: Date | null;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showSettings, setShowSettings] = useState(false);

  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/admin/analytics'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch user data
  const { data: users, isLoading: usersLoading } = useQuery<UserData[]>({
    queryKey: ['/api/admin/users'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch subscription data
  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['/api/admin/subscriptions'],
    refetchInterval: 60000,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getTierColor = (tier: string) => {
    const colors = {
      freemium: 'bg-gray-500',
      basic: 'bg-blue-500',
      gold: 'bg-yellow-500',
      platinum: 'bg-purple-500',
      enterprise: 'bg-green-500',
      admin: 'bg-red-500'
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-500';
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      search: Search,
      ai_analysis: Brain,
      vin_search: Eye,
      export: Download,
      view_lot: Eye,
      market_analysis: BarChart3
    };
    const IconComponent = icons[type as keyof typeof icons] || Activity;
    return <IconComponent className="h-4 w-4" />;
  };

  // Export Report functionality
  const handleExportReport = async () => {
    try {
      const response = await fetch('/api/admin/export-report', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      const reportData = await response.json();
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  if (metricsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Platform management and analytics overview
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                ADMIN
              </Badge>
              <Button variant="outline" size="sm" onClick={handleExportReport}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              User Management
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Users</p>
                      <p className="text-3xl font-bold">{formatNumber(metrics?.totalUsers || 0)}</p>
                      <p className="text-blue-100 text-sm">
                        +{metrics?.userGrowthRate || 0}% from last month
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Monthly Revenue</p>
                      <p className="text-3xl font-bold">{formatCurrency(metrics?.monthlyRevenue || 0)}</p>
                      <p className="text-green-100 text-sm">
                        +{metrics?.revenueGrowthRate || 0}% from last month
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Active Subscriptions</p>
                      <p className="text-3xl font-bold">{formatNumber(metrics?.activeSubscriptions || 0)}</p>
                      <p className="text-purple-100 text-sm">
                        +{metrics?.subscriptionGrowthRate || 0}% from last month
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Platform Usage</p>
                      <p className="text-3xl font-bold">{formatNumber(metrics?.platformUsage.searchesToday || 0)}</p>
                      <p className="text-orange-100 text-sm">Searches today</p>
                    </div>
                    <Activity className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Platform Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Recent Platform Activity
                  </CardTitle>
                  <CardDescription>Latest user actions and system events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics?.recentActivity?.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.description}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {activity.userEmail}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* User Distribution by Tier */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    User Distribution by Tier
                  </CardTitle>
                  <CardDescription>Breakdown of users by subscription level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(metrics?.usersByTier || {}).map(([tier, count]) => (
                      <div key={tier} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getTierColor(tier)}`}></div>
                          <span className="text-sm font-medium capitalize">{tier}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {count} users
                          </span>
                          <div className="w-20">
                            <Progress 
                              value={(count / (metrics?.totalUsers || 1)) * 100} 
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Today's Platform Usage
                </CardTitle>
                <CardDescription>Real-time usage metrics for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full w-fit mx-auto mb-2">
                      <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(metrics?.platformUsage.searchesToday || 0)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Searches</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full w-fit mx-auto mb-2">
                      <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(metrics?.platformUsage.aiAnalysesToday || 0)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">AI Analyses</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full w-fit mx-auto mb-2">
                      <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(metrics?.platformUsage.vinSearchesToday || 0)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">VIN Searches</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full w-fit mx-auto mb-2">
                      <Download className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(metrics?.platformUsage.exportsToday || 0)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Exports</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Analytics</CardTitle>
                <CardDescription>Monitor subscription performance and revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading subscription data...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(metrics?.subscriptionsByTier || {}).map(([tier, count]) => (
                      <Card key={tier}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                                {tier} Plan
                              </p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {count}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Active subscribers
                              </p>
                            </div>
                            <div className={`w-12 h-12 rounded-full ${getTierColor(tier)} flex items-center justify-center`}>
                              <CreditCard className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analytics</CardTitle>
                <CardDescription>In-depth platform performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Top Active Users</h3>
                    <div className="space-y-3">
                      {metrics?.topActiveUsers?.map((user, index) => (
                        <div key={user.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.totalSearches} searches
                            </p>
                            <Badge className={getTierColor(user.role)}>{user.role}</Badge>
                          </div>
                        </div>
                      )) || <p className="text-gray-500 dark:text-gray-400">No user data available</p>}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Platform Statistics</h3>
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Total Searches</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {formatNumber(metrics?.platformUsage.totalSearches || 0)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">New Users This Month</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {formatNumber(metrics?.newUsersThisMonth || 0)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Active Users</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {formatNumber(metrics?.activeUsers || 0)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Annual Revenue</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {formatCurrency(metrics?.totalRevenue || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Admin Settings</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Platform Configuration */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Platform Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Platform Name
                    </label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      defaultValue="EcomAutos"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contact Email
                    </label>
                    <input 
                      type="email" 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      defaultValue="admin@ecomautos.com"
                    />
                  </div>
                </div>
              </div>

              {/* User Management Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">User Management</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Allow new user registrations</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Require email verification</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable trial accounts</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                </div>
              </div>

              {/* System Maintenance */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Maintenance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                  <Button variant="outline" className="flex items-center justify-center">
                    <Download className="h-4 w-4 mr-2" />
                    Database Backup
                  </Button>
                </div>
              </div>

              {/* API Configuration */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">API Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      APICAR Rate Limit (requests/minute)
                    </label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      defaultValue="60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      OpenAI API Rate Limit (requests/hour)
                    </label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      defaultValue="100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                alert('Settings saved successfully!');
                setShowSettings(false);
              }}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}