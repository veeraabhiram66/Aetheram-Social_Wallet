import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TestTube, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Test Data Button Component
 * Provides working test data that auto-fills the transaction form
 */
const TestDataButton = ({ onUseTestData, disabled = false }) => {
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Load test data on component mount
  useEffect(() => {
    const loadTestData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/working-test-data.json');
        if (!response.ok) {
          throw new Error('Failed to load test data');
        }
        const data = await response.json();
        setTestData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load test data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTestData();
  }, []);

  // Handle using test transaction data
  const handleUseTestData = (transaction) => {
    if (!transaction || disabled) return;

    console.log('🧪 Using test data:', transaction);
    
    // Prepare clean data for the form
    const formData = {
      to: transaction.to,
      value: transaction.value, // Human readable format (e.g., "0.1")
      data: transaction.data || '0x'
    };

    console.log('📝 Form data prepared:', formData);
    
    // Set selected transaction for UI feedback
    setSelectedTransaction(transaction.id);
    
    // Call parent callback
    if (onUseTestData) {
      onUseTestData(formData);
    }

    // Clear selection after a moment
    setTimeout(() => {
      setSelectedTransaction(null);
    }, 2000);
  };

  // Handle refresh test data
  const handleRefresh = () => {
    window.location.reload(); // Simple refresh for now
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          <span className="text-gray-300">Loading test data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>Failed to load test data: {error}</span>
        </div>
        <button 
          onClick={handleRefresh}
          className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!testData || !testData.testTransactions) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-gray-400 text-center">
          No test data available
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-lg p-4 space-y-4"
    >
      <div className="flex items-center space-x-2 mb-3">
        <TestTube className="w-5 h-5 text-green-400" />
        <h3 className="text-lg font-semibold text-white">🧪 Test Data</h3>
        <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">
          {testData.testTransactions.length} transactions
        </span>
      </div>

      <div className="text-sm text-gray-400 mb-3">
        Click any transaction below to auto-fill the form with working test data:
      </div>

      <div className="grid gap-2">
        {testData.testTransactions.map((tx) => (
          <motion.button
            key={tx.id}
            onClick={() => handleUseTestData(tx)}
            disabled={disabled}
            whileHover={disabled ? {} : { scale: 1.02 }}
            whileTap={disabled ? {} : { scale: 0.98 }}
            className={`
              p-3 rounded-lg border text-left transition-all duration-200
              ${disabled 
                ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                : selectedTransaction === tx.id
                ? 'bg-green-900 border-green-500 text-green-100'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {tx.name}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  To: {tx.to.slice(0, 10)}...{tx.to.slice(-8)}
                </div>
                <div className="text-xs text-gray-400">
                  Value: {tx.value} BDAG
                  {tx.data !== '0x' && <span className="ml-2 text-yellow-400">(+data)</span>}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {selectedTransaction === tx.id && (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                )}
                <div className={`
                  text-xs px-2 py-1 rounded
                  ${tx.category === 'basic' ? 'bg-blue-900 text-blue-300' :
                    tx.category === 'medium' ? 'bg-purple-900 text-purple-300' :
                    tx.category === 'advanced' ? 'bg-orange-900 text-orange-300' :
                    'bg-gray-900 text-gray-300'}
                `}>
                  {tx.category}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Test wallet info */}
      <div className="mt-4 p-3 bg-gray-900 rounded border border-gray-700">
        <div className="text-xs text-gray-400 mb-1">Test Wallet Info:</div>
        <div className="text-xs font-mono text-gray-300">
          {testData.testWallet.smartWalletAddress}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Network: {testData.network.name} (Chain ID: {testData.network.chainId})
        </div>
      </div>

      {/* Nonce handling info */}
      <div className="mt-2 p-2 bg-blue-900/20 border border-blue-800 rounded">
        <div className="text-xs text-blue-300">
          ✅ <strong>Perfect Nonce Handling:</strong> Nonce is automatically fetched from backend before each transaction
        </div>
      </div>
    </motion.div>
  );
};

export default TestDataButton;
