import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Settings, 
  Activity, 
  Shield, 
  Clock, 
  CheckCircle,
  XCircle,
  Edit3,
  MoreHorizontal,
  Search,
  Brain,
  Eye,
  Download,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Plus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';


interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  isTrialActive: boolean;
  trialEndsAt: Date | null;
  usageStats: {
    totalSearches: number;
    searchesToday: number;
    aiAnalysesToday: number;
    vinSearchesToday: number;
    exportsToday: number;
    lastActivity: Date | null;
  };
  limits: {
    dailySearches: number;
    monthlySearches: number;
    aiAnalysesPerDay: number;
    vinSearchesPerDay: number;
    exportsPerDay: number;
    concurrentSessions: number;
  };
  subscriptionStatus: string | null;
}

export default function UserManagement() {
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [bulkSelection, setBulkSelection] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const queryClient = useQueryClient();

  // Fetch users with comprehensive data
  const { data: users, isLoading } = useQuery<UserData[]>({
    queryKey: ['/api/admin/users'],
    refetchInterval: 30000,
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (!response.ok) throw new Error('Failed to update role');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    }
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    }
  });

  // Reset trial mutation
  const resetTrialMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}/reset-trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to reset trial');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    }
  });

  // Extend trial mutation
  const extendTrialMutation = useMutation({
    mutationFn: async ({ userId, days }: { userId: number; days: number }) => {
      const response = await fetch(`/api/admin/users/${userId}/extend-trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
      });
      if (!response.ok) throw new Error('Failed to extend trial');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    }
  });

  // Filter users based on search and filters
  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive) ||
                         (statusFilter === 'trial' && user.isTrialActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

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

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const isLimitExceeded = (current: number, limit: number) => {
    return limit > 0 && current >= limit;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage user accounts, permissions, and usage limits</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="freemium">Freemium</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="trial">Trial Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                      <Badge className={getTierColor(user.role)}>{user.role}</Badge>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {user.isTrialActive && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          Trial
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">{user.email}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
                      {user.lastLoginAt && (
                        <span>Last seen {formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Manage User: {user.name}</DialogTitle>
                        <DialogDescription>
                          Configure permissions, usage limits, and account settings
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="overview">Overview</TabsTrigger>
                          <TabsTrigger value="permissions">Permissions</TabsTrigger>
                          <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
                          <TabsTrigger value="activity">Activity</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>User Role</Label>
                              <Select 
                                value={user.role} 
                                onValueChange={(role) => updateRoleMutation.mutate({ userId: user.id, role })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="freemium">Freemium</SelectItem>
                                  <SelectItem value="basic">Basic</SelectItem>
                                  <SelectItem value="gold">Gold</SelectItem>
                                  <SelectItem value="platinum">Platinum</SelectItem>
                                  <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch 
                                checked={user.isActive}
                                onCheckedChange={(isActive) => toggleStatusMutation.mutate({ userId: user.id, isActive })}
                              />
                              <Label>Account Active</Label>
                            </div>
                          </div>

                          {user.isTrialActive && user.trialEndsAt && (
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-orange-800 dark:text-orange-200">Trial Active</h4>
                                  <p className="text-orange-600 dark:text-orange-300">
                                    Ends {formatDistanceToNow(new Date(user.trialEndsAt), { addSuffix: true })}
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => extendTrialMutation.mutate({ userId: user.id, days: 7 })}
                                  >
                                    Extend 7 days
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => resetTrialMutation.mutate(user.id)}
                                  >
                                    Reset Trial
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="permissions" className="space-y-4">
                          <div className="grid grid-cols-1 gap-4">
                            <h4 className="font-medium">Role-Based Permissions</h4>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Current Role: <span className="font-medium">{user.role}</span>
                              </p>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Daily Searches</span>
                                  <span>{user.limits.dailySearches === -1 ? 'Unlimited' : user.limits.dailySearches}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>AI Analyses Per Day</span>
                                  <span>{user.limits.aiAnalysesPerDay === -1 ? 'Unlimited' : user.limits.aiAnalysesPerDay}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>VIN Searches Per Day</span>
                                  <span>{user.limits.vinSearchesPerDay === -1 ? 'Unlimited' : user.limits.vinSearchesPerDay}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Exports Per Day</span>
                                  <span>{user.limits.exportsPerDay === -1 ? 'Unlimited' : user.limits.exportsPerDay}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="usage" className="space-y-4">
                          <h4 className="font-medium">Today's Usage vs Limits</h4>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between mb-2">
                                <span className="flex items-center">
                                  <Search className="h-4 w-4 mr-2" />
                                  Searches
                                </span>
                                <span className={isLimitExceeded(user.usageStats.searchesToday, user.limits.dailySearches) ? 'text-red-600' : ''}>
                                  {user.usageStats.searchesToday} / {user.limits.dailySearches === -1 ? '∞' : user.limits.dailySearches}
                                </span>
                              </div>
                              <Progress 
                                value={getUsagePercentage(user.usageStats.searchesToday, user.limits.dailySearches)} 
                                className="h-2"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between mb-2">
                                <span className="flex items-center">
                                  <Brain className="h-4 w-4 mr-2" />
                                  AI Analyses
                                </span>
                                <span className={isLimitExceeded(user.usageStats.aiAnalysesToday, user.limits.aiAnalysesPerDay) ? 'text-red-600' : ''}>
                                  {user.usageStats.aiAnalysesToday} / {user.limits.aiAnalysesPerDay === -1 ? '∞' : user.limits.aiAnalysesPerDay}
                                </span>
                              </div>
                              <Progress 
                                value={getUsagePercentage(user.usageStats.aiAnalysesToday, user.limits.aiAnalysesPerDay)} 
                                className="h-2"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between mb-2">
                                <span className="flex items-center">
                                  <Eye className="h-4 w-4 mr-2" />
                                  VIN Searches
                                </span>
                                <span className={isLimitExceeded(user.usageStats.vinSearchesToday, user.limits.vinSearchesPerDay) ? 'text-red-600' : ''}>
                                  {user.usageStats.vinSearchesToday} / {user.limits.vinSearchesPerDay === -1 ? '∞' : user.limits.vinSearchesPerDay}
                                </span>
                              </div>
                              <Progress 
                                value={getUsagePercentage(user.usageStats.vinSearchesToday, user.limits.vinSearchesPerDay)} 
                                className="h-2"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between mb-2">
                                <span className="flex items-center">
                                  <Download className="h-4 w-4 mr-2" />
                                  Exports
                                </span>
                                <span className={isLimitExceeded(user.usageStats.exportsToday, user.limits.exportsPerDay) ? 'text-red-600' : ''}>
                                  {user.usageStats.exportsToday} / {user.limits.exportsPerDay === -1 ? '∞' : user.limits.exportsPerDay}
                                </span>
                              </div>
                              <Progress 
                                value={getUsagePercentage(user.usageStats.exportsToday, user.limits.exportsPerDay)} 
                                className="h-2"
                              />
                            </div>
                          </div>

                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Total Statistics</h5>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-blue-600 dark:text-blue-300">Total Searches:</span>
                                <span className="ml-2 font-medium">{user.usageStats.totalSearches}</span>
                              </div>
                              {user.usageStats.lastActivity && (
                                <div>
                                  <span className="text-blue-600 dark:text-blue-300">Last Activity:</span>
                                  <span className="ml-2 font-medium">
                                    {formatDistanceToNow(new Date(user.usageStats.lastActivity), { addSuffix: true })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="activity" className="space-y-4">
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <Activity className="h-8 w-8 mx-auto mb-2" />
                            <p>Activity history will be displayed here</p>
                            <p className="text-sm">Recent user actions and system events</p>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Quick Usage Stats */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Search className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">{user.usageStats.searchesToday}</span>
                    <span className="text-xs text-gray-500">/ {user.limits.dailySearches === -1 ? '∞' : user.limits.dailySearches}</span>
                  </div>
                  <p className="text-xs text-gray-500">Searches today</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Brain className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">{user.usageStats.aiAnalysesToday}</span>
                    <span className="text-xs text-gray-500">/ {user.limits.aiAnalysesPerDay === -1 ? '∞' : user.limits.aiAnalysesPerDay}</span>
                  </div>
                  <p className="text-xs text-gray-500">AI analyses</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Eye className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">{user.usageStats.vinSearchesToday}</span>
                    <span className="text-xs text-gray-500">/ {user.limits.vinSearchesPerDay === -1 ? '∞' : user.limits.vinSearchesPerDay}</span>
                  </div>
                  <p className="text-xs text-gray-500">VIN searches</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Download className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">{user.usageStats.exportsToday}</span>
                    <span className="text-xs text-gray-500">/ {user.limits.exportsPerDay === -1 ? '∞' : user.limits.exportsPerDay}</span>
                  </div>
                  <p className="text-xs text-gray-500">Exports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No users have been created yet'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}