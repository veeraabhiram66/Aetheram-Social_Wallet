import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Sparkles,
  AlertTriangle,
  Loader,
  Copy,
  RefreshCw
} from 'lucide-react';
import { Card, Badge, Button, TxHashDisplay } from './UI';

const TxStatus = ({ 
  transaction, 
  onClose, 
  onViewDetails,
  onRetry = null,
  explorerUrl = 'https://explorer.bdagscan.com'
}) => {  const [showCelebration, setShowCelebration] = useState(false);
  
  // Trigger celebration when transaction becomes successful
  useEffect(() => {
    if (transaction?.status === 'success' && !showCelebration) {
      setShowCelebration(true);

      // Auto-hide celebration after 3 seconds
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [transaction?.status, showCelebration]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className={`w-16 h-16 ${showCelebration ? 'text-green-400' : 'text-green-600'}`} />;
      case 'error':
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-600" />;
      case 'pending':
      case 'signing':
        return <Loader className="w-16 h-16 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-16 h-16 text-yellow-600" />;
    }
  };

  const getStatusMessage = () => {
    if (!transaction) return 'Processing...';
    
    switch (transaction.status) {
      case 'signing':
        return 'Please sign the transaction in your wallet...';
      case 'pending':
        return 'Transaction is being processed on the blockchain...';
      case 'success':
        if (showCelebration) {
          const messages = [
            '🎉 Transaction completed successfully!',
            '✨ Amazing! Your meta-transaction went through!',
            '🚀 Success! Transaction is now on the blockchain!',
            '🎊 Fantastic! Your gasless transaction worked perfectly!'
          ];
          return messages[Math.floor(Math.random() * messages.length)];
        }
        return 'Transaction completed successfully!';
      case 'error':
      case 'failed':
        return transaction.error || 'Transaction failed';
      default:
        return 'Processing transaction...';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
      case 'failed':
        return 'error';
      case 'pending':
      case 'signing':
        return 'warning';
      default:
        return 'default';
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (!transaction) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
          initial={{ y: 50, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
            scale: transaction.status === 'success' && showCelebration ? [1, 1.02, 1] : 1
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Card className={`p-6 ${transaction.status === 'success' && showCelebration ? 'ring-2 ring-green-300 ring-opacity-50' : ''}`}>
            {/* Celebration Effect */}
            {showCelebration && (
              <div className="absolute inset-0 pointer-events-none">
                <Sparkles className="absolute top-4 right-4 w-6 h-6 text-yellow-400 animate-pulse" />
                <Sparkles className="absolute top-8 left-6 w-4 h-4 text-blue-400 animate-ping" />
                <Sparkles className="absolute bottom-8 right-8 w-5 h-5 text-green-400 animate-bounce" />
              </div>
            )}

            <div className="text-center">
              <div className="flex justify-center mb-4">
                {getStatusIcon(transaction.status)}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Meta-Transaction Status
              </h3>
              
              <Badge 
                variant={getStatusColor(transaction.status)} 
                className="mb-4"
              >
                {transaction.status?.toUpperCase() || 'PENDING'}
              </Badge>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {getStatusMessage()}
              </p>

              {/* Transaction Details */}
              {transaction.txHash && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Transaction Hash</div>
                  <div className="flex items-center space-x-2">
                    <TxHashDisplay 
                      txHash={transaction.txHash}
                      explorerUrl={explorerUrl}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(transaction.txHash)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Gas Saved Display */}
              {transaction.gasSaved && transaction.status === 'success' && (
                <motion.div 
                  className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                    🎉 Gas Saved: {transaction.gasSaved} BDAG
                  </div>
                  <div className="text-xs text-green-500 dark:text-green-300 mt-1">
                    Thanks to gasless meta-transactions!
                  </div>
                  {parseFloat(transaction.gasSaved) > 10 && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">
                      🚀 Wow! That's a significant saving!
                    </div>
                  )}
                </motion.div>
              )}

              {/* Error Details */}
              {transaction.error && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="text-left">
                      <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                        {transaction.error}
                      </div>
                      {transaction.details && (
                        <div className="text-xs text-red-500 dark:text-red-300 mt-1">
                          {transaction.details}
                        </div>
                      )}
                        {/* Smart contract deployment hint */}
                      {(transaction.error?.includes('smart wallet') || transaction.error?.includes('Smart wallet') || transaction.error?.includes('Invalid wallet address')) && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
                          <div className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                            💡 What you can do:
                          </div>
                          <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                            {transaction.error?.includes('Invalid wallet address') && (
                              <>
                                <li>• <strong>Check backend server:</strong> Make sure the backend is running on port 4000</li>
                                <li>• <strong>Restart backend:</strong> Double-click restart-backend.bat in the project folder</li>
                                <li>• <strong>Try Testing Override:</strong> Enable the testing override for the mock wallet</li>
                              </>
                            )}
                            <li>• Deploy a smart wallet using the factory contract</li>
                            <li>• Connect to an account that already has a smart wallet</li>
                            <li>• Check if you're on the correct network (BlockDAG)</li>
                            <li>• Verify the wallet address is correct</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Summary */}
              {transaction.to && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Transaction Summary</h4>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <div>To: <span className="font-mono">{transaction.to?.slice(0, 6)}...{transaction.to?.slice(-4)}</span></div>
                    <div>Amount: <span className="font-mono">{transaction.value || '0'} BDAG</span></div>
                    {transaction.data && transaction.data !== '0x' && (
                      <div>Data: <span className="font-mono text-xs">{transaction.data.slice(0, 20)}...</span></div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Close
                </Button>
                
                {transaction.status === 'success' && transaction.txHash && (
                  <Button
                    variant="outline"
                    onClick={() => onViewDetails && onViewDetails(transaction.txHash)}
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Explorer
                  </Button>
                )}

                {transaction.status === 'failed' && onRetry && (
                  <Button
                    variant="outline"
                    onClick={() => onRetry(transaction)}
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TxStatus;
