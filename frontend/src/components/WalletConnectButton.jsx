/**
 * WalletConnectButton - Dedicated button for wallet connection
 * Provides a clean interface for connecting MetaMask and other wallets
 */

import React from 'react';
import { Wallet, Loader2 } from 'lucide-react';
import { StableButton } from './UI';

const WalletConnectButton = ({ 
  onConnect, 
  loading = false, 
  disabled = false,
  variant = "primary",
  size = "default",
  className = ""
}) => {
  const handleClick = async () => {
    if (!loading && !disabled && onConnect) {
      try {
        await onConnect();
      } catch (error) {
        console.error('Wallet connection failed:', error);
      }
    }
  };

  return (
    <StableButton
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`flex items-center space-x-2 ${className}`}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Wallet className="w-5 h-5" />
      )}
      <span>
        {loading ? 'Connecting...' : 'Connect Wallet'}
      </span>
    </StableButton>
  );
};

export default WalletConnectButton;
