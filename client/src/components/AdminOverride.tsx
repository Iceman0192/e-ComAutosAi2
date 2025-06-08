import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Settings, Users, Database, Activity } from 'lucide-react';

export function AdminOverride() {
  const { user } = useAuth();

  // Only show for admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <Card className="border-2 border-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <Crown className="h-5 w-5" />
          Admin God Level Access
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
            <Database className="h-6 w-6" />
            <span className="text-xs">All Data</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
            <Activity className="h-6 w-6" />
            <span className="text-xs">AI Analysis</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
            <Users className="h-6 w-6" />
            <span className="text-xs">User Mgmt</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
            <Settings className="h-6 w-6" />
            <span className="text-xs">System</span>
          </Button>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>God Level Features Active:</strong>
          </p>
          <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
            <li>• Unlimited fresh API calls</li>
            <li>• Unlimited AI reports</li>
            <li>• All tier features unlocked</li>
            <li>• Admin tools and controls</li>
            <li>• System monitoring access</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}