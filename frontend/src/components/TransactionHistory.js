import React, { useState, useMemo, useCallback } from 'react';
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock,
  CheckCircle,
  AlertCircle,
  Layers,
  RefreshCw
} from 'lucide-react';
import { Card, StableButton, Input, Badge, TxHashDisplay, LoadingSpinner } from './UI';

const TransactionHistory = ({ 
  walletAddress, 
  transactions = [], 
  loading = false, 
  onRefresh,
  explorerUrl = 'https://explorer.bdagscan.com'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  // Helper function to determine transaction type
  const getTransactionType = useCallback((tx) => {
    if (!tx.from || !tx.to) return 'unknown';
    
    const fromAddress = tx.from.toLowerCase();
    const toAddress = tx.to.toLowerCase();
    const walletAddr = walletAddress?.toLowerCase();
    
    if (fromAddress === walletAddr && toAddress === walletAddr) return 'self';
    if (fromAddress === walletAddr) return 'sent';
    if (toAddress === walletAddr) return 'received';
    if (tx.data && tx.data !== '0x') return 'contract';
    return 'unknown';
  }, [walletAddress]);

  // Helper function to get transaction status
  const getTransactionStatus = useCallback((tx) => {
    if (tx.status === 1 || tx.status === 'success') return 'success';
    if (tx.status === 0 || tx.status === 'failed') return 'failed';
    if (tx.blockNumber) return 'success';
    return 'pending';
  }, []);
  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    // SAFETY CHECK: Only include transactions where user is sender OR receiver
    const userAddress = walletAddress?.toLowerCase();
    const userTransactions = transactions.filter(tx => {
      if (!userAddress) return false;
      const fromAddress = (tx.from || '').toLowerCase();
      const toAddress = (tx.to || '').toLowerCase();
      return fromAddress === userAddress || toAddress === userAddress;
    });

    let filtered = userTransactions.filter(tx => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        tx.hash?.toLowerCase().includes(searchLower) ||
        tx.from?.toLowerCase().includes(searchLower) ||
        tx.to?.toLowerCase().includes(searchLower) ||
        tx.value?.toString().includes(searchLower);

      // Type filter
      const txType = getTransactionType(tx);
      const matchesType = typeFilter === 'all' || txType === typeFilter;

      // Status filter
      const txStatus = getTransactionStatus(tx);
      const matchesStatus = statusFilter === 'all' || txStatus === statusFilter;

      // Date filter
      const txDate = new Date(tx.timestamp * 1000 || tx.timeStamp * 1000 || Date.now());
      const now = new Date();
      const matchesDate = dateFilter === 'all' || 
        (dateFilter === 'today' && txDate.toDateString() === now.toDateString()) ||
        (dateFilter === 'week' && (now - txDate) <= 7 * 24 * 60 * 60 * 1000) ||
        (dateFilter === 'month' && (now - txDate) <= 30 * 24 * 60 * 60 * 1000);

      return matchesSearch && matchesType && matchesStatus && matchesDate;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.timestamp * 1000 || a.timeStamp * 1000 || 0);
          bValue = new Date(b.timestamp * 1000 || b.timeStamp * 1000 || 0);
          break;
        case 'amount':
          aValue = parseFloat(a.value || 0);
          bValue = parseFloat(b.value || 0);
          break;
        case 'type':
          aValue = getTransactionType(a);
          bValue = getTransactionType(b);
          break;
        case 'status':
          aValue = getTransactionStatus(a);
          bValue = getTransactionStatus(b);
          break;
        default:
          aValue = a[sortBy] || '';
          bValue = b[sortBy] || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });    return filtered;
  }, [transactions, searchTerm, typeFilter, statusFilter, dateFilter, sortBy, sortOrder, getTransactionType, getTransactionStatus, walletAddress]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredAndSortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Format value for display
  const formatValue = (value) => {
    if (!value) return '0';
    const ethValue = parseFloat(value) / Math.pow(10, 18);
    return ethValue.toFixed(6);
  };

  // Format date for display
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000 || timestamp || Date.now());
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Get type icon and color
  const getTypeDisplay = (type) => {
    switch (type) {      case 'sent':
        return { icon: ArrowUpRight, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/20', label: 'Sent' };
      case 'received':
        return { icon: ArrowDownLeft, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/20', label: 'Received' };
      case 'contract':
        return { icon: Layers, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/20', label: 'Contract' };
      case 'self':
        return { icon: RefreshCw, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/20', label: 'Self' };
      default:
        return { icon: Clock, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700', label: 'Unknown' };
    }
  };

  // Get status display
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'success':
        return { icon: CheckCircle, variant: 'success', label: 'Success' };
      case 'failed':
        return { icon: AlertCircle, variant: 'error', label: 'Failed' };
      case 'pending':
        return { icon: Clock, variant: 'warning', label: 'Pending' };
      default:
        return { icon: Clock, variant: 'default', label: 'Unknown' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction History</h2>
          <div className="flex items-center space-x-2">
            <StableButton
              onClick={onRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </StableButton>
          </div>
        </div>        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <Input
              placeholder="Search by hash, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="sent">Sent</option>
            <option value="received">Received</option>
            <option value="contract">Contract</option>
            <option value="self">Self</option>
          </select>          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        {/* Sort Options */}
        <div className="flex items-center space-x-4 mb-4">
          <span className="text-sm text-gray-600 dark:text-gray-300">Sort by:</span>          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="date">Date</option>
            <option value="amount">Amount</option>
            <option value="type">Type</option>
            <option value="status">Status</option>
          </select>
          <StableButton
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            variant="ghost"
            size="sm"
            className="text-sm"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </StableButton>
        </div>

        {/* Results Summary */}        <div className="text-sm text-gray-600 dark:text-gray-300">
          Showing {paginatedTransactions.length} of {filteredAndSortedTransactions.length} transactions
        </div>
      </Card>

      {/* Transaction List */}
      <Card className="overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading transactions...</span>
          </div>
        )}

        {!loading && paginatedTransactions.length === 0 && (
          <div className="text-center p-8">            <Clock className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Transactions Found</h3>
            <p className="text-gray-600 dark:text-gray-300">
              {filteredAndSortedTransactions.length === 0 && transactions.length === 0
                ? "No transactions yet. Start by sending your first transaction!"
                : "No transactions match your current filters."}
            </p>
          </div>
        )}

        {!loading && paginatedTransactions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Hash
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedTransactions.map((tx, index) => {
                  const type = getTransactionType(tx);
                  const status = getTransactionStatus(tx);
                  const typeDisplay = getTypeDisplay(type);
                  const statusDisplay = getStatusDisplay(status);

                  return (
                    <tr key={tx.hash || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-full ${typeDisplay.bg}`}>
                            <typeDisplay.icon className={`w-4 h-4 ${typeDisplay.color}`} />
                          </div>                          <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                            {typeDisplay.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatValue(tx.value)} BDAG
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-mono">
                          {type === 'sent' ? (
                            `${tx.to?.slice(0, 6)}...${tx.to?.slice(-4)}`
                          ) : type === 'received' ? (
                            `${tx.from?.slice(0, 6)}...${tx.from?.slice(-4)}`
                          ) : (
                            `${tx.to?.slice(0, 6)}...${tx.to?.slice(-4)}`
                          )}
                        </div>
                      </td>                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(tx.timestamp || tx.timeStamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={statusDisplay.variant}>
                          <statusDisplay.icon className="w-3 h-3 mr-1" />
                          {statusDisplay.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TxHashDisplay 
                          txHash={tx.hash} 
                          explorerUrl={explorerUrl}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
            <div className="flex items-center justify-between">              <div className="text-sm text-gray-600 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <StableButton
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </StableButton>
                <StableButton
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </StableButton>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TransactionHistory;
