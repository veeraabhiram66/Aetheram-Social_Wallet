import React, { useState } from 'react';
import { Eye, EyeOff, HelpCircle } from 'lucide-react';
import useOnboarding from '../hooks/useOnboarding';

const DemoModeToggle = ({ className = '' }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const { restartOnboarding } = useOnboarding();

  const toggleDemoMode = () => {
    setIsDemoMode(!isDemoMode);
    // You can add demo mode logic here, like switching to mock data
    console.log(`Demo mode ${!isDemoMode ? 'enabled' : 'disabled'}`);
  };

  const handleShowTutorial = () => {
    restartOnboarding();
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Demo Mode Toggle */}
      <button
        onClick={toggleDemoMode}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
          ${isDemoMode 
            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
          }
        `}
        title={`${isDemoMode ? 'Disable' : 'Enable'} demo mode with sample data`}
      >
        {isDemoMode ? (
          <Eye className="w-4 h-4" />
        ) : (
          <EyeOff className="w-4 h-4" />
        )}
        <span>{isDemoMode ? 'Demo Mode' : 'Demo Mode'}</span>
      </button>

      {/* Show Tutorial Button */}
      <button
        onClick={handleShowTutorial}
        className="
          flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
          bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 
          border border-purple-200 dark:border-purple-800 
          hover:bg-purple-200 dark:hover:bg-purple-900/30
        "
        title="Show the onboarding tutorial"
      >
        <HelpCircle className="w-4 h-4" />
        <span>Tutorial</span>
      </button>
    </div>
  );
};

export default DemoModeToggle;
