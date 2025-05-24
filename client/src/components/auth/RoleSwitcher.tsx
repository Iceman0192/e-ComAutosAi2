import { useAuth, UserRole } from '../../contexts/AuthContext';

export default function RoleSwitcher() {
  const { user, updateUserRole } = useAuth();

  if (!user) return null;

  const roleColors = {
    [UserRole.FREE]: 'bg-gray-100 text-gray-800 border-gray-300',
    [UserRole.GOLD]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    [UserRole.PLATINUM]: 'bg-purple-100 text-purple-800 border-purple-300',
    [UserRole.ADMIN]: 'bg-red-100 text-red-800 border-red-300'
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Demo Mode - Switch User Role:
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.values(UserRole).map((role) => (
          <button
            key={role}
            onClick={() => updateUserRole(role)}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
              user.role === role 
                ? roleColors[role] + ' ring-2 ring-offset-2 ring-blue-500'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {role.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Current: <span className="font-medium">{user.role.toUpperCase()}</span> ({user.name})
      </div>
    </div>
  );
}