import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Activity, 
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';
import { Card, StatsGrid, LoadingSpinner } from './UI';

const TransactionAnalytics = ({ 
  transactions = [], 
  walletAddress,
  loading = false,
  walletStats = null // Add wallet stats prop to get real gas saved
}) => {// Calculate analytics from transactions
  const analytics = useMemo(() => {
    if (!transactions.length) {
      return {
        totalSent: 0,
        totalReceived: 0,
        totalTransactions: 0,
        totalGasSaved: 0,
        averageTransactionValue: 0,
        largestTransaction: 0,
        mostFrequentRecipient: null,
        transactionsByType: {},
        transactionsByMonth: {},
        successRate: 0
      };
    }

    // SAFETY CHECK: Only analyze transactions where user is sender OR receiver
    const walletAddr = walletAddress?.toLowerCase();
    const userTransactions = transactions.filter(tx => {
      if (!walletAddr) return false;
      const fromAddress = (tx.from || '').toLowerCase();
      const toAddress = (tx.to || '').toLowerCase();
      return fromAddress === walletAddr || toAddress === walletAddr;
    });

    let totalSent = 0;
    let totalReceived = 0;
    let totalGasSaved = 0;
    let largestTransaction = 0;
    let successfulTransactions = 0;
    const recipientCounts = {};
    const transactionsByType = {
      sent: 0,
      received: 0,
      contract: 0,
      self: 0
    };
    const transactionsByMonth = {};

    userTransactions.forEach(tx => {
      const value = parseFloat(tx.value || 0) / Math.pow(10, 18);
      const fromAddress = tx.from?.toLowerCase();
      const toAddress = tx.to?.toLowerCase();
      
      // Determine transaction type
      let txType = 'unknown';
      if (fromAddress === walletAddr && toAddress === walletAddr) {
        txType = 'self';
      } else if (fromAddress === walletAddr) {
        txType = 'sent';
        totalSent += value;
      } else if (toAddress === walletAddr) {
        txType = 'received';
        totalReceived += value;
      } else if (tx.data && tx.data !== '0x') {
        txType = 'contract';
      }

      transactionsByType[txType] = (transactionsByType[txType] || 0) + 1;

      // Track largest transaction
      if (value > largestTransaction) {
        largestTransaction = value;
      }

      // Track recipient frequency (for sent transactions)
      if (txType === 'sent' && toAddress) {
        recipientCounts[toAddress] = (recipientCounts[toAddress] || 0) + 1;
      }

      // Track transactions by month
      const date = new Date(tx.timestamp * 1000 || tx.timeStamp * 1000 || Date.now());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      transactionsByMonth[monthKey] = (transactionsByMonth[monthKey] || 0) + 1;

      // Track success rate
      if (tx.status === 1 || tx.status === 'success' || tx.blockNumber) {
        successfulTransactions++;
      }      // Track gas saved (use wallet stats for real data, or calculate from transactions)
      if (tx.gasSaved) {
        totalGasSaved += parseFloat(tx.gasSaved);
      }
    });

    // Use real wallet stats for gas saved if available (for real data mode)
    if (walletStats && walletStats.gasSaved !== undefined) {
      totalGasSaved = parseFloat(walletStats.gasSaved);
    }

    // Find most frequent recipient
    const mostFrequentRecipient = Object.keys(recipientCounts).length > 0 
      ? Object.keys(recipientCounts).reduce((a, b) => 
          recipientCounts[a] > recipientCounts[b] ? a : b
        )
      : null;    const averageTransactionValue = (totalSent + totalReceived) / userTransactions.length;
    const successRate = (successfulTransactions / userTransactions.length) * 100;

    return {
      totalSent,
      totalReceived,
      totalTransactions: userTransactions.length,
      totalGasSaved,
      averageTransactionValue,
      largestTransaction,
      mostFrequentRecipient,
      transactionsByType,
      transactionsByMonth,
      successRate,
      recipientCounts
    };
  }, [transactions, walletAddress, walletStats]);

  // Format number for display
  const formatNumber = (num, decimals = 2) => {
    if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
    return num.toFixed(decimals);
  };

  // Format BDAG value
  const formatBDAG = (value) => {
    return `${formatNumber(value, 4)} BDAG`;
  };

  // Get chart data for transaction types
  const typeChartData = Object.entries(analytics.transactionsByType)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      percentage: ((count / analytics.totalTransactions) * 100).toFixed(1)
    }));

  // Get chart data for monthly transactions
  const monthlyChartData = Object.entries(analytics.transactionsByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6) // Last 6 months
    .map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      count
    }));

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-center">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600 dark:text-gray-300">Calculating analytics...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (analytics.totalTransactions === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Analytics Available</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Start making transactions to see your wallet analytics and insights.
          </p>
        </Card>
      </div>
    );
  }

  // Stats for the grid
  const stats = {
    transactions: analytics.totalTransactions,
    sent: formatNumber(analytics.totalSent, 4),
    received: formatNumber(analytics.totalReceived, 4),
    gas_saved: formatNumber(analytics.totalGasSaved, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Transaction Analytics</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Insights and statistics for your wallet activity
        </p>
      </Card>

      {/* Key Metrics Grid */}
      <StatsGrid stats={stats} />

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Summary */}
        <Card className="p-6">          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Transaction Summary
          </h3>
          <div className="space-y-4">            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center">
                <ArrowDownLeft className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                <div>                  <p className="font-medium text-green-900 dark:text-green-100">Total Received</p>
                  <p className="text-sm text-green-700 dark:text-green-300">{analytics.transactionsByType.received || 0} transactions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-900 dark:text-green-100">{formatBDAG(analytics.totalReceived)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center">
                <ArrowUpRight className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
                <div>                  <p className="font-medium text-red-900 dark:text-red-100">Total Sent</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{analytics.transactionsByType.sent || 0} transactions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-900 dark:text-red-100">{formatBDAG(analytics.totalSent)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                <div>                  <p className="font-medium text-blue-900 dark:text-blue-100">Gas Saved</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Via meta-transactions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-900 dark:text-blue-100">{formatNumber(analytics.totalGasSaved, 0)}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Transaction Types */}
        <Card className="p-6">          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Transaction Types
          </h3>
          <div className="space-y-3">
            {typeChartData.map((item, index) => {
              const colors = [
                'bg-blue-500',
                'bg-green-500', 
                'bg-yellow-500',
                'bg-purple-500',
                'bg-pink-500'
              ];
              return (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]} mr-3`}></div>                    <span className="text-sm font-medium text-gray-900 dark:text-white">{item.type}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{item.count}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({item.percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Key Insights */}
        <Card className="p-6">          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Key Insights
          </h3>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Average Transaction</p>
              <p className="text-lg font-bold text-blue-600">
                {formatBDAG(analytics.averageTransactionValue)}
              </p>
            </div>            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Largest Transaction</p>
              <p className="text-lg font-bold text-green-600">
                {formatBDAG(analytics.largestTransaction)}
              </p>
            </div>            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Success Rate</p>
              <p className="text-lg font-bold text-green-600">
                {analytics.successRate.toFixed(1)}%
              </p>
            </div>

            {analytics.mostFrequentRecipient && (              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Most Frequent Recipient</p>
                <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                  {analytics.mostFrequentRecipient.slice(0, 10)}...{analytics.mostFrequentRecipient.slice(-8)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {analytics.recipientCounts[analytics.mostFrequentRecipient]} transactions
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Monthly Activity */}
        <Card className="p-6">          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Monthly Activity
          </h3>
          {monthlyChartData.length > 0 ? (
            <div className="space-y-3">
              {monthlyChartData.map((item, index) => {
                const maxCount = Math.max(...monthlyChartData.map(d => d.count));
                const percentage = (item.count / maxCount) * 100;
                return (
                  <div key={item.month} className="flex items-center justify-between">                    <span className="text-sm font-medium text-gray-900 dark:text-white w-20">
                      {item.month}
                    </span>
                    <div className="flex-1 mx-3">                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No monthly data available</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TransactionAnalytics;
