import { useState, useCallback, useEffect, useMemo } from 'react';
import walletService from '../services/WalletService';
import useApi from './useApi';

export const useTransactions = (walletAddress, provider, options = {}) => {
  const {
    limit = 50,
    autoRefresh = false,
    useMockData = false
  } = options;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const {
    getWalletInfo,
    getTransactionHistory: apiGetTransactionHistory,
    loading: apiLoading,
    error: apiError
  } = useApi();

  // Mock transaction data for testing
  const mockTransactions = useMemo(() => [
    {
      hash: '0x1234...5678',
      from: '0xabcd...1234',
      to: walletAddress,
      value: '1000000000000000000', // 1 ETH in wei
      status: 'success',
      timestamp: Date.now() - 86400000, // 1 day ago
      blockNumber: 123456,
      gasSaved: '0.05'
    },
    {
      hash: '0x5678...9abc',
      from: walletAddress,
      to: '0xdef0...5678',
      value: '500000000000000000', // 0.5 ETH in wei
      status: 'success',
      timestamp: Date.now() - 172800000, // 2 days ago
      blockNumber: 123455,
      gasSaved: '0.03'
    },
    {
      hash: '0x9abc...def0',
      from: walletAddress,
      to: '0x1234...abcd',
      value: '100000000000000000', // 0.1 ETH in wei
      status: 'pending',
      timestamp: Date.now() - 3600000, // 1 hour ago
      gasSaved: '0.02'
    }
  ], [walletAddress]);

  // Load transactions
  const loadTransactions = useCallback(async (reset = false) => {
    if (!walletAddress) return;

    setLoading(true);
    setError(null);

    try {
      if (useMockData) {
        // Use mock data for testing
        setTransactions(mockTransactions);
        setHasMore(false);
      } else {
        // Load real transaction data
        const currentOffset = reset ? 0 : offset;
        const result = await apiGetTransactionHistory(walletAddress, limit, currentOffset);
        
        if (result.success && result.data) {
          const newTransactions = result.data.transactions || [];
          
          if (reset) {
            setTransactions(newTransactions);
            setOffset(limit);
          } else {
            setTransactions(prev => [...prev, ...newTransactions]);
            setOffset(prev => prev + limit);
          }
          
          setHasMore(newTransactions.length >= limit);
        } else {
          setError(result.error || 'Failed to load transactions');
        }
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, useMockData, mockTransactions, limit, offset, apiGetTransactionHistory]);

  // Refresh transactions (reset and reload)
  const refresh = useCallback(() => {
    setOffset(0);
    loadTransactions(true);
  }, [loadTransactions]);

  // Load more transactions
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadTransactions(false);
    }
  }, [loading, hasMore, loadTransactions]);

  // Get wallet summary
  const getWalletSummary = useCallback(async () => {
    if (!walletAddress) return null;

    try {
      const result = await getWalletInfo(walletAddress);
      if (result.success && result.data) {
        return {
          balance: result.data.balance,
          transactionCount: transactions.length,
          gasSaved: transactions.reduce((total, tx) => {
            return total + (parseFloat(tx.gasSaved) || 0);
          }, 0)
        };
      }
    } catch (err) {
      console.error('Error getting wallet summary:', err);
    }
    
    return null;
  }, [walletAddress, getWalletInfo, transactions]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Send transaction (keeping existing functionality)
  const sendTransaction = useCallback(async (to, value) => {
    try {
      setLoading(true);
      setError(null);
      
      const tx = await walletService.sendTransaction(to, value);
      const receipt = await tx.wait();
      
      // Refresh transactions after successful send
      setTimeout(() => refresh(), 1000);
      
      return receipt;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refresh]);
  // Load transactions when component mounts or wallet address changes
  useEffect(() => {
    if (walletAddress) {
      setOffset(0);
      loadTransactions(true);
    }
  }, [walletAddress, useMockData, loadTransactions]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && walletAddress) {
      const interval = setInterval(() => {
        refresh();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, walletAddress, refresh]);

  // Combine API loading state with local loading state
  const combinedLoading = loading || apiLoading;
  
  // Use API error if no local error
  const combinedError = error || apiError;

  return {
    transactions,    loading: combinedLoading,
    error: combinedError,
    hasMore,
    refresh,
    loadMore,
    getWalletSummary,
    clearError,
    sendTransaction
  };
};

export default useTransactions;
