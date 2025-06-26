import React, { useEffect } from 'react';
import { Wallet, LogOut } from 'lucide-react';
import { Card, Badge, AddressDisplay, StableButton } from './UI';
import { useCelebration } from './CelebrationEffect';

const WalletHeader = ({ 
  account, 
  balance, 
  isConnected, 
  chainId,
  onConnect, 
  onDisconnect, 
  loading,
  isFirstConnection = false // New prop to trigger celebration on first connection
}) => {
  const { celebrate } = useCelebration();

  // Celebrate on first wallet connection
  useEffect(() => {
    if (isConnected && isFirstConnection) {
      setTimeout(() => {
        celebrate('success');
      }, 500);
    }
  }, [isConnected, isFirstConnection, celebrate]);
  if (!isConnected) {
    return (
      <Card className="p-6 text-center">
        <div>
          <Wallet className="w-16 h-16 mx-auto text-blue-500 mb-4" />          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Connect your wallet to start using gasless transactions
          </p>
          <StableButton
            onClick={onConnect}
            loading={loading}
            size="lg"
            className="px-8"
          >
            <Wallet className="w-5 h-5 mr-2" />
            Connect Wallet
          </StableButton>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Wallet className="w-6 h-6 text-blue-600" />
          </div>
          <div>            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Smart Wallet Connected
            </h2><div className="flex items-center space-x-3 mt-1">
              <AddressDisplay address={account} chars={6} />
              {chainId && (
                <Badge variant={chainId === 1043 ? 'success' : 'warning'}>
                  Chain {chainId}
                </Badge>
              )}
              {/* Session Persistence Indicator */}              <Badge variant="success" className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700">
                📌 Auto-reconnect
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="text-right">          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {balance.formatted}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Balance
          </div>
          <StableButton
            variant="outline"
            size="sm"
            onClick={onDisconnect}
            className="mt-2"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Disconnect
          </StableButton>
        </div>
      </div>
    </Card>
  );
};

export default WalletHeader;
