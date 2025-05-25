import { useAuth } from '../../contexts/AuthContext';
import SalesAnalytics from './SalesAnalytics';

interface TieredTimelineContentProps {
  searchResults: any;
}

export default function TieredTimelineContent({ searchResults }: TieredTimelineContentProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission('FULL_ANALYTICS')) {
    return (
      <div className="p-4">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 border border-purple-200 dark:border-gray-600 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-purple-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="text-xl font-bold text-purple-700 dark:text-purple-300">
              🚀 Unlock Advanced Insights
            </span>
          </div>
          <div className="mb-4">
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Gold Members Get Access To:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center">
                <span className="text-purple-500 mr-2">•</span>
                Complete vehicle breakdown table
              </div>
              <div className="flex items-center">
                <span className="text-purple-500 mr-2">•</span>
                Price-per-mile calculations
              </div>
              <div className="flex items-center">
                <span className="text-purple-500 mr-2">•</span>
                Damage type filtering
              </div>
              <div className="flex items-center">
                <span className="text-purple-500 mr-2">•</span>
                Location-based comparisons
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Currently viewing: {searchResults?.data?.salesHistory?.length || 0} vehicles
          </div>
          <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
            Upgrade to Gold
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <SalesAnalytics 
        salesHistory={searchResults?.data?.salesHistory || []}
      />
    </div>
  );
}