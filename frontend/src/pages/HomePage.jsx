/**
 * HomePage - Main landing page for the Smart Wallet DApp
 * Contains wallet connection, transaction form, and status display
 */

import React, { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { Zap, Shield, Activity, Info } from 'lucide-react';

// Components
import WalletConnectButton from '../components/WalletConnectButton';
import TxForm from '../components/TxForm';
import TxStatus from '../components/TxStatus';
import TestDataButton from '../components/TestDataButton';
import { Alert, StatsGrid, Button, StableButton } from '../components/UI';

// Hooks
import useWallet from '../hooks/useWallet';
import useApi from '../hooks/useApi';
import useTransactions from '../hooks/useTransactions';

const HomePage = ({ 
  onNavigateToTransactions, 
  onNavigateToGuardians,
  testDataPanel,
  mockStats 
}) => {
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [useNewInterface, setUseNewInterface] = useState(true);
  const [testTransactionData, setTestTransactionData] = useState(null);
  const [autoFillData, setAutoFillData] = useState(null);

  // Hooks
  const {
    account,
    isConnected,
    balance,
    loading: walletLoading,
    error: walletError,
    chainId,
    connect: connectWallet,
    disconnect: disconnectWallet,
    signMetaTransaction,
    parseEther
  } = useWallet();

  const {
    loading: apiLoading,
    error: apiError,
    relayTransaction,
    getWalletInfo,
    getCurrentNonce,
    clearError
  } = useApi();

  const {
    transactions,
    addTransaction,
    updateTransaction,
  } = useTransactions(account);

  // Handle auto-fill from test data
  const handleAutoFillTestData = useCallback((testData) => {
    console.log('🧪 Auto-filling with test data:', testData);
    setAutoFillData(testData);
    
    // Clear auto-fill data after a moment
    setTimeout(() => {
      setAutoFillData(null);
    }, 1000);
  }, []);

  // Handle meta-transaction submission
  const handleMetaTransactionSubmit = useCallback(async (txData) => {
    console.log('🆕 Meta-transaction submitted:', txData);
    
    if (!isConnected || !account) {
      throw new Error('Please connect your wallet first');
    }

    // Add to transaction tracking
    const transactionId = `tx_${Date.now()}`;
    const newTransaction = {
      id: transactionId,
      status: 'preparing',
      to: txData.to,
      value: txData.value,
      data: txData.data,
      timestamp: Date.now()
    };

    addTransaction(newTransaction);
    setCurrentTransaction(newTransaction);

    try {
      // Get wallet info
      updateTransaction(transactionId, { status: 'checking_wallet' });
      const walletInfo = await getWalletInfo(account);
      
      if (!walletInfo.success) {
        throw new Error(walletInfo.error || 'Smart wallet not found');
      }

      // Get fresh nonce
      updateTransaction(transactionId, { status: 'fetching_nonce' });
      const nonceResult = await getCurrentNonce(account);
      
      if (!nonceResult.success) {
        throw new Error('Failed to get transaction nonce');
      }

      const nonce = nonceResult.data.data.nonce;

      // Sign transaction
      updateTransaction(transactionId, { status: 'signing' });
      const valueInWei = parseEther(txData.value || '0').toString();
      
      const signResult = await signMetaTransaction(
        account,
        txData.to,
        valueInWei,
        txData.data || '0x',
        nonce
      );

      if (!signResult.success) {
        throw new Error(signResult.error);
      }

      // Relay transaction
      updateTransaction(transactionId, { status: 'relaying' });
      const relayData = {
        walletAddress: account,
        to: txData.to,
        value: valueInWei,
        data: txData.data || '0x',
        nonce: nonce,
        signature: signResult.signature
      };

      const relayResult = await relayTransaction(relayData);
      
      if (!relayResult.success) {
        throw new Error(relayResult.error);
      }

      // Success
      const successTransaction = {
        ...newTransaction,
        status: 'success',
        txHash: relayResult.data.txHash,
        completedAt: Date.now(),
        gasSaved: relayResult.data.gasSaved
      };

      updateTransaction(transactionId, successTransaction);
      setCurrentTransaction(successTransaction);

      return {
        success: true,
        txHash: relayResult.data.txHash,
        transaction: successTransaction
      };

    } catch (error) {
      console.error('❌ Meta-transaction failed:', error);
      
      const failedTransaction = {
        ...newTransaction,
        status: 'failed',
        error: error.message,
        failedAt: Date.now()
      };

      updateTransaction(transactionId, failedTransaction);
      setCurrentTransaction(failedTransaction);

      throw error;
    }
  }, [isConnected, account, addTransaction, updateTransaction, getWalletInfo, getCurrentNonce, signMetaTransaction, parseEther, relayTransaction]);

  // Handle transaction status changes
  const handleTransactionStatusChange = useCallback((status, txHash, error) => {
    console.log('🔔 Transaction status changed:', { status, txHash, error });
    
    if (currentTransaction) {
      const updatedTransaction = {
        ...currentTransaction,
        status,
        txHash: txHash || currentTransaction.txHash,
        error: error || currentTransaction.error,
        updatedAt: Date.now()
      };

      setCurrentTransaction(updatedTransaction);
      updateTransaction(currentTransaction.id, updatedTransaction);
    }
  }, [currentTransaction, updateTransaction]);

  // Close transaction modal
  const handleCloseTransaction = useCallback(() => {
    setCurrentTransaction(null);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
            <Zap className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Smart Wallet Meta-Transactions
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Send gasless transactions with EIP-712 signatures and relayer infrastructure. 
          Secure, efficient, and user-friendly.
        </p>
      </div>

      {/* Alerts */}
      {walletError && (
        <Alert type="error" onClose={clearError}>
          {walletError}
        </Alert>
      )}
      
      {apiError && (
        <Alert type="error" onClose={clearError}>
          {apiError}
        </Alert>
      )}

      {/* Wallet Connection */}
      {!isConnected && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Connect Your Wallet
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Connect your wallet to start sending meta-transactions
          </p>
          <WalletConnectButton 
            onConnect={connectWallet}
            loading={walletLoading}
          />
        </div>
      )}

      {/* Main Interface */}
      {isConnected && (
        <div className="space-y-6">
          {/* Wallet Stats */}
          {mockStats && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Wallet Overview
              </h3>
              <StatsGrid stats={mockStats} />
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              onClick={onNavigateToTransactions}
              className="flex items-center space-x-2"
            >
              <Activity className="w-4 h-4" />
              <span>View Transactions</span>
            </Button>
            <Button
              variant="outline"
              onClick={onNavigateToGuardians}
              className="flex items-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span>Social Recovery</span>
            </Button>
          </div>

          {/* Interface Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Transaction Interface:
              </span>
              <Button
                variant={useNewInterface ? "primary" : "secondary"}
                size="sm"
                onClick={() => setUseNewInterface(true)}
              >
                Meta-TX System
              </Button>
              <Button
                variant={!useNewInterface ? "primary" : "secondary"}
                size="sm"
                onClick={() => setUseNewInterface(false)}
              >
                Classic Form
              </Button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {useNewInterface ? 'EIP-712 signatures with relayer' : 'Traditional transaction form'}
            </div>
          </div>

          {/* Test Data Panel */}
          {testDataPanel}

          {/* Transaction Interface */}
          {useNewInterface && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Meta-Transaction Form
                </h3>
                <TxForm
                  onSubmit={handleMetaTransactionSubmit}
                  isSubmitting={apiLoading || walletLoading}
                  disabled={!isConnected}
                  initialValues={testTransactionData || {}}
                  autoFillData={autoFillData}
                  walletAddress={account}
                  account={account}
                />
              </div>

              {/* Transaction Status */}
              {currentTransaction && (
                <TxStatus
                  transaction={currentTransaction}
                  onStatusChange={handleTransactionStatusChange}
                  onClose={handleCloseTransaction}
                  explorerUrl="https://explorer.bdagscan.com"
                />
              )}
            </div>
          )}

          {/* Classic Interface */}
          {!useNewInterface && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Classic Transaction Form
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This would show the original StableTransactionForm component.
              </p>
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded text-center">
                <span className="text-gray-500 dark:text-gray-400">
                  Classic form would be integrated here
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
