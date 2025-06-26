/**
 * Enhanced API Service for Meta-Transaction Relayer
 * Provides comprehensive backend communication for the ideal transaction system
 */

import { ethers } from 'ethers';

class RelayerApiService {
  constructor(baseUrl = 'http://localhost:4000') {
    this.baseUrl = baseUrl;
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Make API request with error handling
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        data,
        status: response.status,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      
      console.error(`API Error (${endpoint}):`, error);
      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    return this.makeRequest('/health');
  }

  /**
   * Get wallet information and current nonce
   */
  async getWalletInfo(walletAddress) {
    if (!ethers.isAddress(walletAddress)) {
      return {
        success: false,
        error: 'Invalid wallet address',
      };
    }

    return this.makeRequest(`/wallet/${walletAddress}`);
  }

  /**
   * Get current nonce for wallet
   */
  async getCurrentNonce(walletAddress) {
    if (!ethers.isAddress(walletAddress)) {
      return {
        success: false,
        error: 'Invalid wallet address',
      };
    }

    return this.makeRequest(`/wallet/${walletAddress}/nonce`);
  }

  /**
   * Relay meta-transaction
   */
  async relayMetaTransaction(metaTxData) {
    const { walletAddress, to, value, data, nonce, signature } = metaTxData;

    // Validate required fields
    if (!ethers.isAddress(walletAddress)) {
      return {
        success: false,
        error: 'Invalid wallet address',
      };
    }

    if (!ethers.isAddress(to)) {
      return {
        success: false,
        error: 'Invalid recipient address',
      };
    }

    if (!signature || signature.length !== 132) {
      return {
        success: false,
        error: 'Invalid signature format',
      };
    }

    console.log('🚀 Relaying meta-transaction:', metaTxData);

    return this.makeRequest('/relay', {
      method: 'POST',
      body: JSON.stringify({
        walletAddress,
        to,
        value: value.toString(),
        data: data || '0x',
        nonce: nonce.toString(),
        signature,
      }),
    });
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(walletAddress, to, value, data) {
    if (!ethers.isAddress(walletAddress) || !ethers.isAddress(to)) {
      return {
        success: false,
        error: 'Invalid address format',
      };
    }

    return this.makeRequest('/estimate-gas', {
      method: 'POST',
      body: JSON.stringify({
        walletAddress,
        to,
        value: value.toString(),
        data: data || '0x',
      }),
    });
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash) {
    if (!txHash || !txHash.startsWith('0x') || txHash.length !== 66) {
      return {
        success: false,
        error: 'Invalid transaction hash',
      };
    }

    return this.makeRequest(`/transaction/${txHash}/status`);
  }

  /**
   * Get transaction history for wallet
   */
  async getTransactionHistory(walletAddress, options = {}) {
    if (!ethers.isAddress(walletAddress)) {
      return {
        success: false,
        error: 'Invalid wallet address',
      };
    }

    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.status) params.append('status', options.status);

    const queryString = params.toString();
    const endpoint = `/wallet/${walletAddress}/transactions${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest(endpoint);
  }

  /**
   * Get wallet analytics
   */
  async getWalletAnalytics(walletAddress, timeframe = '30d') {
    if (!ethers.isAddress(walletAddress)) {
      return {
        success: false,
        error: 'Invalid wallet address',
      };
    }

    return this.makeRequest(`/wallet/${walletAddress}/analytics?timeframe=${timeframe}`);
  }

  /**
   * Batch relay multiple transactions
   */
  async batchRelayTransactions(transactions) {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return {
        success: false,
        error: 'Invalid transactions array',
      };
    }

    // Validate all transactions
    for (const [index, tx] of transactions.entries()) {
      if (!ethers.isAddress(tx.walletAddress) || !ethers.isAddress(tx.to)) {
        return {
          success: false,
          error: `Invalid address in transaction ${index + 1}`,
        };
      }
    }

    console.log('🔥 Batch relaying transactions:', transactions);

    return this.makeRequest('/batch-relay', {
      method: 'POST',
      body: JSON.stringify({ transactions }),
    });
  }

  /**
   * Cancel pending transaction (if supported)
   */
  async cancelTransaction(walletAddress, nonce) {
    if (!ethers.isAddress(walletAddress)) {
      return {
        success: false,
        error: 'Invalid wallet address',
      };
    }

    return this.makeRequest('/cancel-transaction', {
      method: 'POST',
      body: JSON.stringify({
        walletAddress,
        nonce: nonce.toString(),
      }),
    });
  }

  /**
   * Get relayer information
   */
  async getRelayerInfo() {
    return this.makeRequest('/relayer/info');
  }

  /**
   * Retry failed transaction with new parameters
   */
  async retryTransaction(originalTxData, newGasPrice) {
    console.log('🔄 Retrying transaction with new gas price:', newGasPrice);

    return this.relayMetaTransaction({
      ...originalTxData,
      gasPrice: newGasPrice,
    });
  }
}

// Create singleton instance
const relayerApi = new RelayerApiService();

export default relayerApi;

// Named exports for convenience
export {
  RelayerApiService,
};
