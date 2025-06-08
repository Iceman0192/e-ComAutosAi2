import { useUsage } from '@/contexts/UsageContext';
import { useToast } from '@/hooks/use-toast';

// Hook for tracking usage actions
export function useUsageTracker() {
  const { trackUsage, canPerformAction, getRemainingUsage } = useUsage();
  const { toast } = useToast();

  const trackAction = async (action: 'search' | 'vin' | 'export' | 'ai', showToast = false) => {
    if (!canPerformAction(action)) {
      const remaining = getRemainingUsage();
      const actionNames = {
        search: 'daily searches',
        vin: 'VIN lookups',
        export: 'data exports',
        ai: 'AI analyses'
      };

      toast({
        title: "Usage Limit Reached",
        description: `You've reached your ${actionNames[action]} limit. Upgrade your plan for higher limits.`,
        variant: "destructive"
      });
      return false;
    }

    try {
      await trackUsage(action);
      
      if (showToast) {
        const actionNames = {
          search: 'Search',
          vin: 'VIN lookup',
          export: 'Export',
          ai: 'AI analysis'
        };
        
        toast({
          title: "Usage Tracked",
          description: `${actionNames[action]} recorded successfully.`
        });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to track usage:', error);
      return false;
    }
  };

  return {
    trackAction,
    canPerformAction,
    getRemainingUsage
  };
}

// Component wrapper that automatically tracks usage
interface UsageTrackerProps {
  action: 'search' | 'vin' | 'export' | 'ai';
  children: (trackAction: () => Promise<boolean>) => React.ReactNode;
}

export function UsageTracker({ action, children }: UsageTrackerProps) {
  const { trackAction } = useUsageTracker();

  const handleTrackAction = () => trackAction(action, false);

  return <>{children(handleTrackAction)}</>;
}