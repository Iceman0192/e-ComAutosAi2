import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, Plus, BarChart3, Download } from 'lucide-react';

export default function Datasets() {
  const { user, hasPermission } = useAuth();

  if (!hasPermission('FULL_ANALYTICS')) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Datasets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This feature is available for Gold members and above.
            </p>
            <Badge variant="outline">Upgrade to Gold</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Datasets
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your vehicle data collections and analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-orange-600">
            GOLD+ FEATURE
          </Badge>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Dataset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Plus className="h-5 w-5" />
              Create New Dataset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              Start building a custom dataset from your search results
            </p>
            <Button variant="outline" className="w-full">
              Get Started
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Q4 Luxury Vehicles
              </span>
              <Badge variant="secondary">125 records</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Luxury vehicle sales data from Q4 2024
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <BarChart3 className="h-4 w-4 mr-1" />
                Analyze
              </Button>
              {hasPermission('EXPORT_DATA') && (
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Honda Civic Trends
              </span>
              <Badge variant="secondary">89 records</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Honda Civic market analysis dataset
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <BarChart3 className="h-4 w-4 mr-1" />
                Analyze
              </Button>
              {hasPermission('EXPORT_DATA') && (
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {user?.role === 'gold' && (
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
          <CardHeader>
            <CardTitle className="text-purple-800 dark:text-purple-200">
              Unlock AI-Powered Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-purple-700 dark:text-purple-300 mb-4">
              Upgrade to Platinum for AI-powered dataset analysis and automated insights
            </p>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Upgrade to Platinum
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}