import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Crown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Download,
  Settings,
  Search,
  Eye,
  UserCheck,
  UserX,
  Shield,
  Calendar,
  RefreshCw,
  Clock,
  Edit,
  Trash2
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for user management
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);

  // Fetch admin analytics
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/admin/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  // Fetch user management data with filters
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/admin/control/users', { search: searchTerm, role: roleFilter, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/admin/control/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // Fetch platform statistics
  const { data: platformStats } = useQuery({
    queryKey: ['/api/admin/control/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/control/stats');
      if (!response.ok) throw new Error('Failed to fetch platform stats');
      return response.json();
    }
  });

  // Fetch subscription data
  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['/api/admin/subscriptions'],
    queryFn: async () => {
      const response = await fetch('/api/admin/subscriptions');
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      return response.json();
    }
  });

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  const analytics = analyticsData?.data || {};
  const users = usersData?.data || [];
  const subscriptions = subscriptionsData?.data || [];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Platform management and analytics overview
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => window.location.href = '/admin/data-collection'}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Activity className="h-4 w-4 mr-2" />
            Data Collection
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers || 1,247}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.monthlyRevenue || 24,750}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeSubscriptions || 342}</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.dailySearches || 8,234}</div>
            <p className="text-xs text-muted-foreground">
              Searches today
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Platform Activity</CardTitle>
                <CardDescription>Latest user actions and system events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: 'New user registration', user: 'john@example.com', time: '2 minutes ago' },
                    { action: 'Subscription upgrade to Gold', user: 'sarah@example.com', time: '15 minutes ago' },
                    { action: 'VIN search performed', user: 'mike@example.com', time: '1 hour ago' },
                    { action: 'AI analysis completed', user: 'demo@example.com', time: '2 hours ago' },
                    { action: 'Data export generated', user: 'admin@example.com', time: '3 hours ago' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{activity.action}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{activity.user}</p>
                      </div>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Platform performance and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      API Status
                    </span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Database
                    </span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Stripe Integration
                    </span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Connected
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      Server Load
                    </span>
                    <Badge variant="outline">
                      23% CPU
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage platform users and their access levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* User filters */}
                <div className="flex gap-2 mb-4">
                  <Button variant="outline" size="sm">All Users</Button>
                  <Button variant="outline" size="sm">Free Tier</Button>
                  <Button variant="outline" size="sm">Gold</Button>
                  <Button variant="outline" size="sm">Platinum</Button>
                  <Button variant="outline" size="sm">Enterprise</Button>
                </div>

                {/* Users table */}
                <div className="border rounded-lg">
                  <div className="grid grid-cols-5 gap-4 p-4 font-medium text-sm bg-gray-50 dark:bg-gray-800">
                    <span>User</span>
                    <span>Plan</span>
                    <span>Usage</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>
                  {[
                    { email: 'demo@example.com', plan: 'Free', usage: '45/50', status: 'Active' },
                    { email: 'john@example.com', plan: 'Gold', usage: '234/500', status: 'Active' },
                    { email: 'sarah@example.com', plan: 'Platinum', usage: '∞', status: 'Active' },
                    { email: 'mike@example.com', plan: 'Free', usage: '12/50', status: 'Active' }
                  ].map((user, index) => (
                    <div key={index} className="grid grid-cols-5 gap-4 p-4 border-t text-sm">
                      <span>{user.email}</span>
                      <Badge variant="outline">{user.plan}</Badge>
                      <span>{user.usage}</span>
                      <Badge variant="secondary" className="w-fit">{user.status}</Badge>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Analytics</CardTitle>
              <CardDescription>Revenue and subscription management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="text-2xl font-bold text-blue-600">$24,750</h3>
                  <p className="text-sm text-blue-600">Monthly Recurring Revenue</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h3 className="text-2xl font-bold text-green-600">94%</h3>
                  <p className="text-sm text-green-600">Retention Rate</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h3 className="text-2xl font-bold text-purple-600">$72</h3>
                  <p className="text-sm text-purple-600">Average Revenue Per User</p>
                </div>
              </div>

              {/* Subscription breakdown */}
              <div className="space-y-4">
                <h4 className="font-medium">Plan Distribution</h4>
                {[
                  { plan: 'Free', count: 905, percentage: 72, revenue: 0 },
                  { plan: 'Gold', count: 234, percentage: 19, revenue: 11466 },
                  { plan: 'Platinum', count: 89, percentage: 7, revenue: 8811 },
                  { plan: 'Enterprise', count: 19, percentage: 2, revenue: 3781 }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{item.plan}</Badge>
                      <span className="text-sm">{item.count} users ({item.percentage}%)</span>
                    </div>
                    <span className="font-medium">${item.revenue.toLocaleString()}/mo</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Analytics</CardTitle>
              <CardDescription>Usage patterns and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Daily Search Volume</h4>
                  <div className="h-32 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-gray-400" />
                    <span className="ml-2 text-gray-500">Chart visualization</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Feature Usage</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>VIN Search</span>
                      <span>2,847 uses</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>AI Analysis</span>
                      <span>1,234 uses</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cost Calculator</span>
                      <span>987 uses</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Data Export</span>
                      <span>156 uses</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}