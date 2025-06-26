import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, ExternalLink, Sparkles } from 'lucide-react';
import { Card, Badge, Button, TxHashDisplay } from './UI';
import CelebrationEffect, { useCelebration } from './CelebrationEffect';

const TransactionStatus = ({ 
  transaction, 
  onClose, 
  onViewDetails 
}) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState('success');
  const { celebrate } = useCelebration();
  // Trigger celebration when transaction becomes successful
  useEffect(() => {
    if (transaction?.status === 'success' && !showCelebration) {
      // Determine celebration type based on transaction details
      let type = 'success';
      
      // Mega celebration for high-value transactions or gas savings
      if (transaction.value && parseFloat(transaction.value) > 1000) {
        type = 'mega';
      } else if (transaction.gasSaved && parseFloat(transaction.gasSaved) > 10) {
        type = 'fireworks';
      }
      
      setCelebrationType(type);
      setShowCelebration(true);
      
      // Use the hook for immediate effect
      celebrate(type);
    }
  }, [transaction?.status, transaction?.value, transaction?.gasSaved, showCelebration, celebrate]);

  if (!transaction) return null;
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return (
          <motion.div
            initial={{ scale: 1 }}
            animate={{ 
              scale: showCelebration ? [1, 1.2, 1] : 1,
              rotate: showCelebration ? [0, 10, -10, 0] : 0
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="relative"
          >
            <CheckCircle className="w-6 h-6 text-green-500" />
            {showCelebration && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </motion.div>
            )}
          </motion.div>
        );
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'pending':
      default:
        return 'warning';
    }
  };
  const getStatusMessage = () => {
    switch (transaction.status) {
      case 'success':
        if (showCelebration) {
          const messages = [
            '🎉 Transaction completed successfully!',
            '✨ Amazing! Your transaction went through!',
            '🚀 Success! Transaction is now on the blockchain!',
            '🎊 Fantastic! Your smart wallet is working perfectly!'
          ];
          return messages[Math.floor(Math.random() * messages.length)];
        }
        return 'Transaction completed successfully!';
      case 'error':
        return transaction.error || 'Transaction failed';
      case 'pending':
      default:
        return 'Transaction is being processed...';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >        <motion.div
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
            {/* Celebration Effect Component */}
            <CelebrationEffect 
              isActive={showCelebration}
              type={celebrationType}
              onComplete={() => setShowCelebration(false)}
            />
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {getStatusIcon(transaction.status)}
              </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Transaction Status
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
              
              {transaction.txHash && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Transaction Hash</div>
                  <TxHashDisplay 
                    txHash={transaction.txHash}
                    explorerUrl="https://explorer.bdagscan.com"
                  />
                </div>
              )}
                {transaction.gasSaved && (
                <motion.div 
                  className="bg-green-50 rounded-lg p-4 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="text-sm text-green-600 font-medium">
                    🎉 Gas Saved: {transaction.gasSaved} BDAG
                  </div>
                  <div className="text-xs text-green-500 mt-1">
                    Thanks to gasless transactions!
                  </div>
                  {parseFloat(transaction.gasSaved) > 10 && (
                    <div className="text-xs text-green-600 mt-1 font-semibold">
                      🚀 Wow! That's a significant saving!
                    </div>
                  )}
                </motion.div>
              )}
                {transaction.error && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6">
                  <div className="text-sm text-red-600">
                    <strong>Error:</strong> {transaction.error}
                  </div>
                  {transaction.details && (
                    <div className="text-xs text-red-500 mt-1">
                      {transaction.details}
                    </div>
                  )}                  {(transaction.error?.includes('smart wallet') || transaction.error?.includes('Smart wallet') || transaction.error?.includes('Invalid wallet address')) && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
                      <div className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                        💡 What you can do:
                      </div>
                      <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                        {transaction.error?.includes('Invalid wallet address') && (
                          <>
                            <li>• <strong>Check backend server:</strong> Make sure the backend is running on port 4000</li>
                            <li>• <strong>Restart backend:</strong> Run restart-backend.bat in the project folder</li>
                            <li>• <strong>Try the Testing Override:</strong> Use the "Enable Testing" button for the test wallet</li>
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
              )}
                <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Close
                </Button>
                
                {transaction.status === 'success' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCelebration(true);
                      celebrate('fireworks');
                    }}
                    className="px-3"
                    title="Celebrate again!"
                  >
                    🎉
                  </Button>
                )}
                
                {transaction.txHash && (
                  <Button
                    onClick={() => onViewDetails && onViewDetails(transaction.txHash)}
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Details
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

export default TransactionStatus;
