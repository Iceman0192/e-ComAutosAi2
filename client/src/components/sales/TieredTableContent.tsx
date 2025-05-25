import { useAuth } from '../../contexts/AuthContext';

interface TieredTableContentProps {
  searchResults: any;
  // Add other props that the table needs
}

export default function TieredTableContent({ searchResults }: TieredTableContentProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission('FULL_ANALYTICS')) {
    return (
      <div className="p-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border border-blue-200 dark:border-gray-600 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
              📊 Detailed Table View
            </span>
          </div>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Gold Feature - Complete Vehicle Data Table
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Access detailed sortable tables with all vehicle information, damage analysis, and pricing data.
          </p>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
            Upgrade to Gold
          </button>
        </div>
      </div>
    );
  }

  // Return the actual table content here for Gold+ users
  return (
    <div className="p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Complete Vehicle Data Table</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Detailed table view would be implemented here for Gold+ members.
          </p>
        </div>
      </div>
    </div>
  );
}