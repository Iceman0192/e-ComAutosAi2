import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { 
  Car, 
  BarChart3, 
  Brain, 
  LogOut,
  User,
  Settings
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                ecomautos.ai
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {user?.profileImageUrl && (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-full object-cover"
                />
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.firstName || user?.email || 'User'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role || 'freemium'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to ecomautos.ai
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Your AI-powered vehicle auction intelligence platform
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Lots Search
              </CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">136,997+</div>
              <p className="text-xs text-muted-foreground">
                Live auction records available
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                AI Analysis
              </CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">AuctionMind</div>
              <p className="text-xs text-muted-foreground">
                Powered by advanced AI models
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Market Analytics
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Real-time</div>
              <p className="text-xs text-muted-foreground">
                Live market insights and trends
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                className="h-auto p-4 justify-start"
                variant="outline"
                onClick={() => window.location.href = '/active-lots'}
              >
                <div className="text-left">
                  <div className="font-medium">Search Active Lots</div>
                  <div className="text-sm text-muted-foreground">
                    Browse live auction inventory
                  </div>
                </div>
              </Button>
              
              <Button 
                className="h-auto p-4 justify-start"
                variant="outline"
                onClick={() => window.location.href = '/vin-history'}
              >
                <div className="text-left">
                  <div className="font-medium">VIN History Search</div>
                  <div className="text-sm text-muted-foreground">
                    Track vehicle auction history
                  </div>
                </div>
              </Button>
              
              <Button 
                className="h-auto p-4 justify-start"
                variant="outline"
                onClick={() => window.location.href = '/auction-mind-v2'}
              >
                <div className="text-left">
                  <div className="font-medium">AI Analysis</div>
                  <div className="text-sm text-muted-foreground">
                    Advanced market intelligence
                  </div>
                </div>
              </Button>
              
              <Button 
                className="h-auto p-4 justify-start"
                variant="outline"
                onClick={() => window.location.href = '/account'}
              >
                <div className="text-left">
                  <div className="font-medium">Account Settings</div>
                  <div className="text-sm text-muted-foreground">
                    Manage your subscription
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}