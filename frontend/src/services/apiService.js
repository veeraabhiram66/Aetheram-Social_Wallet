import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';
console.log('🔍 Frontend API_BASE_URL:', API_BASE_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // 3 minutes timeout to handle network issues
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export class ApiService {
  // Relay meta-transaction
  static async relayTransaction(transactionData) {
    try {
      console.log('🚀🚀🚀 RELAY TRANSACTION - SENDING DATA:', JSON.stringify(transactionData, null, 2));
      console.log('🚀 NONCE IN TRANSACTION DATA:', transactionData.nonce, 'TYPE:', typeof transactionData.nonce);
      
      const response = await api.post('/relay', transactionData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ RELAY TRANSACTION FAILED:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || 'Transaction failed',
        details: error.response?.data?.details || error.message
      };
    }
  }  // Get wallet information
  static async getWalletInfo(address) {
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const response = await api.get(`/wallet/${address}?_t=${timestamp}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get wallet info',
        details: error.response?.data?.details || error.message
      };
    }
  }

  // Get transaction history
  static async getTransactionHistory(address, limit = 20, offset = 0) {
    try {
      const response = await api.get(`/transactions?address=${address}&limit=${limit}&offset=${offset}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get transaction history',
        details: error.response?.data?.details || error.message
      };
    }
  }

  // Get transaction status
  static async getTransactionStatus(txHash) {
    try {
      const response = await api.get(`/transaction/${txHash}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get transaction status',
        details: error.response?.data?.details || error.message
      };
    }
  }

  // Health check
  static async healthCheck() {
    try {
      const response = await api.get('/health');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Backend unavailable',
        details: error.response?.data?.details || error.message
      };
    }
  }

  // Get API info
  static async getApiInfo() {
    try {
      const response = await api.get('/');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get API info',
        details: error.response?.data?.details || error.message
      };
    }
  }  // Get current nonce for a wallet
  static async getCurrentNonce(address) {
    try {
      const timestamp = Date.now();
      const url = `/wallet/${address}/nonce?_t=${timestamp}`;
      console.log('🌐 API: Fetching nonce from URL:', url);
      
      const response = await api.get(url);
      console.log('🌐 API: Raw response:', response);
      console.log('🌐 API: Response data:', response.data);
      console.log('🌐 API: Response data type:', typeof response.data);
      
      const result = { success: true, data: response.data };
      console.log('🌐 API: Final result:', result);
      
      return result;
    } catch (error) {
      console.error('🌐 API: getCurrentNonce error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get nonce',
        details: error.response?.data?.details || error.message
      };
    }
  }
}

export default ApiService;
