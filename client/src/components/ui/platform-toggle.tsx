import { useState } from 'react';
import { useLocation } from 'wouter';

interface PlatformToggleProps {
  onPlatformChange?: (platform: 'copart' | 'iaai') => void;
}

export default function PlatformToggle({ onPlatformChange }: PlatformToggleProps) {
  const [location, setLocation] = useLocation();
  const currentPlatform = location === '/iaai' ? 'iaai' : 'copart';

  const handleToggle = (platform: 'copart' | 'iaai') => {
    const newPath = platform === 'iaai' ? '/iaai' : '/';
    setLocation(newPath);
    onPlatformChange?.(platform);
  };

  return (
    <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 shadow-inner">
      {/* Copart Option */}
      <button
        onClick={() => handleToggle('copart')}
        className={`
          relative px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out
          ${currentPlatform === 'copart'
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
          }
        `}
      >
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${currentPlatform === 'copart' ? 'bg-blue-500' : 'bg-gray-400'}`} />
          <span>Copart</span>
        </div>
      </button>

      {/* IAAI Option */}
      <button
        onClick={() => handleToggle('iaai')}
        className={`
          relative px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out
          ${currentPlatform === 'iaai'
            ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
          }
        `}
      >
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${currentPlatform === 'iaai' ? 'bg-red-500' : 'bg-gray-400'}`} />
          <span>IAAI</span>
        </div>
      </button>
    </div>
  );
}