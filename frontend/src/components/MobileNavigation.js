import React, { useState } from 'react';
import { Menu, X, Shield, Activity, Users, BarChart3, Settings, Wallet } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const MobileNavigation = ({ 
  activeTab, 
  onTabChange, 
  isConnected, 
  account,
  onConnectWallet,
  onDisconnectWallet 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const tabs = [
    { id: 'wallet', label: 'Wallet', icon: Shield, color: 'text-purple-500' },
    { id: 'transactions', label: 'Transactions', icon: Activity, color: 'text-blue-500' },
    { id: 'guardians', label: 'Guardians', icon: Users, color: 'text-green-500' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-orange-500' },
  ];

  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-colors"
        >
          {isMenuOpen ? (
            <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-out Menu */}
      <div className={`
        md:hidden fixed left-0 top-0 h-full w-72 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-purple-500" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Smart Wallet
              </h1>
            </div>
            <ThemeToggle />
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span className={`font-medium ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop/Tablet Bottom Navigation */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center justify-center space-x-8 py-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span className={`text-sm font-medium ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>        </div>
      </div>

      {/* Mobile Content Spacers - Fix scrolling to bottom issue */}
      <div className="block md:hidden">
        {/* Top spacer for fixed header */}
        <div className="h-16 w-full"></div>
        {/* Bottom spacer for fixed bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 h-16 pointer-events-none"></div>
      </div>
    </>
  );
};

export default MobileNavigation;
