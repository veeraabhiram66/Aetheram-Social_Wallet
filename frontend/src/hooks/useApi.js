import { useState, useCallback } from 'react';
import { ApiService } from '../services/apiService';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Relay transaction
  const relayTransaction = useCallback(async (transactionData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await ApiService.relayTransaction(transactionData);
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        return { success: false, error: result.error, details: result.details };
      }
    } catch (error) {
      const errorMessage = error.message || 'Network error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);
  // Get wallet info
  const getWalletInfo = useCallback(async (address) => {
    setLoading(true);
    // Don't clear error here - let other API calls handle their own errors
    
    try {
      const result = await ApiService.getWalletInfo(address);
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        // Don't set global error for wallet info - this is often expected
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to get wallet info';
      // Don't set global error for wallet info - this is often expected
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get transaction history
  const getTransactionHistory = useCallback(async (address, limit = 20, offset = 0) => {
    setLoading(true);
    setError(null);

    try {
      const result = await ApiService.getTransactionHistory(address, limit, offset);
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to get transaction history';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get transaction status
  const getTransactionStatus = useCallback(async (txHash) => {
    setLoading(true);
    setError(null);

    try {
      const result = await ApiService.getTransactionStatus(txHash);
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to get transaction status';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Health check
  const healthCheck = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await ApiService.healthCheck();
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Backend unavailable';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get current nonce
  const getCurrentNonce = useCallback(async (address) => {
    try {
      const result = await ApiService.getCurrentNonce(address);
      
      if (result.success) { return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to get current nonce';
      return { success: false, error: errorMessage };
    }
  }, []);

  return {
    // State
    loading,
    error,
    
    // Actions
    relayTransaction,
    getWalletInfo,
    getTransactionHistory,
    getTransactionStatus,
    healthCheck,
    clearError,
    getCurrentNonce
  };
};

export default useApi;
