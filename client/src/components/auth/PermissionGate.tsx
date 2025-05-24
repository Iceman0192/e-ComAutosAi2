import { ReactNode } from 'react';
import { useAuth, Permission } from '../../contexts/AuthContext';

interface PermissionGateProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

interface UpgradePromptProps {
  requiredTier: string;
}

function UpgradePrompt({ requiredTier }: UpgradePromptProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border border-blue-200 dark:border-gray-600 rounded-lg p-4 text-center">
      <div className="flex items-center justify-center mb-2">
        <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <span className="font-semibold text-blue-700 dark:text-blue-300">
          {requiredTier} Feature
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        Upgrade to {requiredTier} to access this feature and unlock advanced vehicle analytics.
      </p>
      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
        Upgrade to {requiredTier}
      </button>
    </div>
  );
}

export default function PermissionGate({ 
  permission, 
  children, 
  fallback, 
  showUpgradePrompt = true 
}: PermissionGateProps) {
  const { hasPermission, user } = useAuth();

  // Allow access if user has permission
  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show upgrade prompt for logged-in users
  if (showUpgradePrompt && user) {
    const getRequiredTier = (): string => {
      switch (permission) {
        case 'ADVANCED_FILTERS':
        case 'FULL_ANALYTICS':
        case 'MULTIPLE_DAMAGE_TYPES':
          return 'Gold';
        case 'UNLIMITED_RESULTS':
        case 'EXPORT_DATA':
        case 'CROSS_PLATFORM_SEARCH':
          return 'Platinum';
        case 'ADMIN_TOOLS':
          return 'Admin';
        default:
          return 'Premium';
      }
    };

    return <UpgradePrompt requiredTier={getRequiredTier()} />;
  }

  // Default: show nothing for non-logged-in users
  return null;
}