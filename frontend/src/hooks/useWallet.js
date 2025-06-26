import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState({ raw: '0', formatted: '0.00' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum;
  };

  // Connect wallet
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed');
    }

    setLoading(true);
    setError(null);

    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const address = await web3Signer.getAddress();
      const network = await web3Provider.getNetwork();
        // Get balance with error handling for network issues
      let rawBalance = '0';
      let formattedBalance = '0.00';
      
      try {
        rawBalance = await web3Provider.getBalance(address);
        formattedBalance = ethers.formatEther(rawBalance);
        console.log('✅ Balance fetched:', formattedBalance);
      } catch (balanceError) {
        console.warn('⚠️ Could not fetch balance (network issue):', balanceError.message);
        // Continue with 0 balance rather than failing the entire connection
        rawBalance = '0';
        formattedBalance = '0.00';
      }

      // Update state
      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(address);
      setIsConnected(true);      setBalance({
        raw: rawBalance.toString(),
        formatted: parseFloat(formattedBalance).toFixed(4),
        eth: formattedBalance
      });
      setChainId(Number(network.chainId));

      // Save session to localStorage
      localStorage.setItem('wallet_connected', 'true');
      localStorage.setItem('wallet_account', address);

      console.log('✅ Wallet connected:', address);
      return { success: true, account: address };
    } catch (err) {
      console.error('❌ Failed to connect wallet:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAccount(null);
    setIsConnected(false);
    setBalance({ raw: '0', formatted: '0.00' });
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setError(null);

    // Clear session from localStorage
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_account');

    console.log('🔄 Wallet disconnected');
  }, []);

  // Sign meta transaction
  const signMetaTransaction = useCallback(async (walletAddress, to, value, data, nonce) => {
    if (!signer || !provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      // EIP-712 domain
      const domain = {
        name: 'SmartWallet',
        version: '1',
        chainId: chainId,
        verifyingContract: walletAddress
      };

      // EIP-712 types
      const types = {
        MetaTransaction: [
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'data', type: 'bytes32' },
          { name: 'nonce', type: 'uint256' }
        ]
      };

      // Hash the data for signature (as expected by the smart contract)
      const hashedData = ethers.keccak256(data);

      // Message to sign
      const message = {
        to: to,
        value: value,
        data: hashedData, // Use hashed data in signature
        nonce: nonce
      };

      console.log('🔏 Signing meta transaction:', {
        domain,
        types,
        message,
        originalData: data,
        hashedData
      });

      // Sign the typed data
      const signature = await signer.signTypedData(domain, types, message);

      return {
        success: true,
        signature,
        domain,
        types,
        message
      };
    } catch (err) {
      console.error('❌ Failed to sign meta transaction:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }, [signer, provider]);

  // Parse ether utility
  const parseEther = useCallback((value) => {
    return ethers.parseEther(value.toString());
  }, []);

  // Handle account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== account) {
        // Account changed, reconnect
        connect();
      }
    };

    const handleChainChanged = (chainId) => {
      setChainId(parseInt(chainId, 16));
      // Optionally refresh the connection when chain changes
      if (isConnected) {
        connect();
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account, isConnected, connect, disconnect]);

  // Auto-connect on page load if session exists
  useEffect(() => {
    const wasConnected = localStorage.getItem('wallet_connected') === 'true';
    const lastAccount = localStorage.getItem('wallet_account');

    if (wasConnected && lastAccount && isMetaMaskInstalled()) {
      console.log('🔄 Attempting to restore wallet session...');
      
      // Check if MetaMask still has the same account
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0 && accounts[0].toLowerCase() === lastAccount.toLowerCase()) {
            console.log('✅ Restoring wallet session for:', accounts[0]);
            connect();
          } else {
            console.log('🔄 Session account mismatch, clearing session');
            localStorage.removeItem('wallet_connected');
            localStorage.removeItem('wallet_account');
          }
        })
        .catch(err => {
          console.error('❌ Failed to restore session:', err);
          localStorage.removeItem('wallet_connected');
          localStorage.removeItem('wallet_account');
        });
    }
  }, [connect]);

  return {
    account,
    isConnected,
    balance,
    loading,
    error,
    chainId,
    provider,
    signer,
    connect,
    disconnect,
    signMetaTransaction,
    parseEther
  };
};

export default useWallet;
