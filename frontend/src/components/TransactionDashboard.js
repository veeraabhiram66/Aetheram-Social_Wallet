import React, { useState, useEffect } from 'react';
import { Activity, BarChart3, Database, Zap, Users } from 'lucide-react';
import { StableButton } from './UI';
import TransactionHistory from './TransactionHistory';
import TransactionAnalytics from './TransactionAnalytics';
import { useTransactions } from '../hooks/useTransactions';

const TransactionDashboard = ({ 
  walletAddress, 
  provider,
  explorerUrl = 'https://explorer.bdagscan.com',
  useMockData: initialUseMockData = false 
}) => {
  const [activeTab, setActiveTab] = useState('history');
  const [useMockData, setUseMockData] = useState(initialUseMockData);
  const [walletStats, setWalletStats] = useState(null);

  // Use the transactions hook
  const {
    transactions,
    loading,
    error,
    hasMore,
    refresh,
    loadMore,
    getWalletSummary,
    clearError  } = useTransactions(walletAddress, provider, {
    limit: 50,
    autoRefresh: false,
    useMockData
  });

  // Fetch wallet stats for real data mode
  useEffect(() => {
    if (walletAddress && !useMockData) {
      getWalletSummary().then(stats => {
        if (stats) {
          setWalletStats({
            balance: stats.balance,
            transactionCount: stats.transactionCount,
            gasSaved: 0.001 // Use the real gas saved value from your wallet stats
          });
        }
      }).catch(err => {
        console.warn('Failed to get wallet stats:', err);
      });
    } else if (useMockData) {
      // For mock data, use random stats
      setWalletStats({
        balance: '199.8599',
        transactionCount: Math.floor(Math.random() * 50) + 10,
        gasSaved: Math.floor(Math.random() * 5000) + 1000
      });
    }
  }, [walletAddress, useMockData, getWalletSummary]);

  // Tab configuration
  const tabs = [
    {
      id: 'history',
      label: 'Transaction History',
      icon: Activity,
      component: (
        <TransactionHistory
          walletAddress={walletAddress}
          transactions={transactions}
          loading={loading}
          onRefresh={refresh}
          explorerUrl={explorerUrl}
        />
      )
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,      component: (
        <TransactionAnalytics
          transactions={transactions}
          walletAddress={walletAddress}
          loading={loading}
          walletStats={walletStats}
        />
      )
    }
  ];

  if (!walletAddress) {
    return (
      <div className="text-center p-8">        <Users className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Wallet Connected</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Connect your wallet to view transaction history and analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="text-red-800 dark:text-red-200 font-medium">Error loading transactions</h3>
              <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
            </div>
            <StableButton
              onClick={clearError}
              variant="ghost"
              size="sm"
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              ×
            </StableButton>
          </div>
        </div>)}

      {/* Data Source Toggle */}      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div><h3 className="text-sm font-medium text-gray-900 dark:text-white">Data Source</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {useMockData ? 'Showing sample data for testing' : 'Showing your real wallet transactions'}
          </p>
        </div>
        <div className="flex space-x-2">
          <StableButton
            onClick={() => setUseMockData(true)}
            variant={useMockData ? 'primary' : 'secondary'}
            size="sm"
            className="flex items-center space-x-2"
          >
            <Database className="w-4 h-4" />
            <span>Mock Data</span>
          </StableButton>
          <StableButton
            onClick={() => setUseMockData(false)}
            variant={!useMockData ? 'primary' : 'secondary'}
            size="sm"
            className="flex items-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Real Data</span>
          </StableButton>
        </div>
      </div>      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
        {tabs.map(tab => (
          <StableButton
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            variant={activeTab === tab.id ? 'primary' : 'secondary'}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-6"
            aria-pressed={activeTab === tab.id}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </StableButton>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {tabs.find(tab => tab.id === activeTab)?.component}
      </div>

      {/* Load More Button for History Tab */}
      {activeTab === 'history' && hasMore && !loading && transactions.length > 0 && (
        <div className="text-center">
          <StableButton
            onClick={loadMore}
            variant="outline"
            className="px-6 py-2"
          >
            Load More Transactions
          </StableButton>
        </div>
      )}
    </div>
  );
};

export default TransactionDashboard;
