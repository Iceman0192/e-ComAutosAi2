import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { LogOut, User } from 'lucide-react';

export default function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleColors = {
    [UserRole.FREE]: 'bg-gray-100 text-gray-800 border-gray-300',
    [UserRole.GOLD]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    [UserRole.PLATINUM]: 'bg-purple-100 text-purple-800 border-purple-300',
    [UserRole.ADMIN]: 'bg-red-100 text-red-800 border-red-300'
  };

  if (isMinimized) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className={`px-3 py-2 text-xs font-medium rounded-full border transition-all shadow-lg ${
            roleColors[user.role]
          } hover:shadow-xl`}
        >
          {user.role.toUpperCase()}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm">
      {/* Header with minimize button */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Demo Mode
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <Minimize2 className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Current role display - always visible */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">Current:</span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${roleColors[user.role]}`}>
            {user.role.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Expandable role selection */}
      {isExpanded && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Switch Role:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(UserRole).map((role) => (
              <button
                key={role}
                onClick={() => updateUserRole(role)}
                disabled={user.role === role}
                className={`px-2 py-1 text-xs font-medium rounded border transition-all ${
                  user.role === role 
                    ? roleColors[role] + ' opacity-50 cursor-not-allowed'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                }`}
              >
                {role.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}