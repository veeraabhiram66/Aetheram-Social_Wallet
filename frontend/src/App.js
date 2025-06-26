import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Zap, Shield, Github, Activity } from 'lucide-react';
import { ethers } from 'ethers';
// Hooks
import useWallet from './hooks/useWallet';
import useApi from './hooks/useApi';
import useTransactions from './hooks/useTransactions';
import useGuardians from './hooks/useGuardians';
import useDebouncedValue from './hooks/useDebouncedValue';
// import useTheme from './hooks/useTheme'; // TODO: Implement theme switching functionality
import useOnboarding from './hooks/useOnboarding';
// Components
import WalletHeader from './components/WalletHeader';
import StableTransactionForm from './components/StableTransactionForm';
import TransactionStatus from './components/TransactionStatus';
import GuardianDashboard from './components/GuardianDashboard';
import TransactionDashboard from './components/TransactionDashboard';
import TestDataPanel from './components/TestDataPanel';
import TestDataButton from './components/TestDataButton';
import ThemeToggle from './components/ThemeToggle';
import OnboardingModal from './components/OnboardingModal';
import MobileNavigation from './components/MobileNavigation';
import DemoModeToggle from './components/DemoModeToggle';
import { useCelebration } from './components/CelebrationEffect';
import { Alert, StatsGrid, Button, StableButton } from './components/UI';
import SignatureVerificationModal from './components/SignatureVerificationModal';
import FixedWalletDeployer from './components/FixedWalletDeployer';

function App() {
  // Initialize theme and onboarding hooks
  // const { theme } = useTheme(); // TODO: Implement theme switching functionality
  const {
    showOnboarding,
    currentStep,
    nextStep,
    previousStep,
    completeOnboarding,
    skipOnboarding,
    setShowOnboarding
  } = useOnboarding();

  // Celebration hook for success animations
  const { celebrate } = useCelebration();

  // Reduced logging to prevent excessive re-renders
  console.log('🔥 App component rendered at:', Date.now());
  
  // State
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [walletInfo, setWalletInfo] = useState(null);
  const [backendStatus, setBackendStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('wallet');
  const [testTransactionData, setTestTransactionData] = useState(null); // For storing selected test transaction
  const [autoFillData, setAutoFillData] = useState(null); // For auto-fill functionality
  const [signatureToVerify, setSignatureToVerify] = useState(null); // For signature verification modal
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);

  // Debug logging for modal state
  console.log('🔍 Modal state debug:', { 
    isVerificationModalOpen, 
    signatureToVerify: !!signatureToVerify,
    pendingTransaction: !!pendingTransaction,
    currentTransactionStatus: currentTransaction?.status 
  });


  // Wallet hook
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

  // API hook
  const {
    loading: apiLoading,
    error: apiError,
    relayTransaction,
    getWalletInfo,
    healthCheck,
    clearError,
    getCurrentNonce
  } = useApi();

  // Enhanced connect function with debugging
  const handleConnectWallet = useCallback(async () => {
    console.log('🔗 Connect wallet clicked - calling connectWallet()');
    try {
      const result = await connectWallet();
      console.log('🔗 Connect wallet result:', result);
    } catch (error) {
      console.error('🔗 Connect wallet error:', error);
    }
  }, [connectWallet]);

  // Auto-connect wallet on initial load with delay to ensure page is ready
  useEffect(() => {
    const autoConnect = async () => {
      // Wait a bit for the page to fully load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!isConnected) {
        console.log('🔗 Auto-connecting wallet on page load...');
        await handleConnectWallet();
      }
    };
    
    autoConnect();
  }, [isConnected, handleConnectWallet]); // Added dependencies

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      const result = await healthCheck();
      setBackendStatus(result);
    };
    checkHealth();
  }, [healthCheck]);

  const loadWalletInfo = useCallback(async () => {
    if (!account) return;
    console.log('🟢 Loading wallet info for account:', account);
    const result = await getWalletInfo(account);
    console.log('🟢 getWalletInfo result:', result);
    if (result.success) {
      console.log('🟢 Setting wallet info:', result.data);
      setWalletInfo(result.data);
      
      // Additional debug info
      console.log('🟢 Wallet info structure:', {
        data: result.data,
        wallet: result.data?.wallet,
        directAccess: result.data
      });
    } else {
      console.log('🟢 getWalletInfo failed:', result.error);
      setWalletInfo(null);
    }
  }, [account, getWalletInfo]);

  // Load wallet info when connected
  useEffect(() => {
    if (isConnected && account) {
      console.log('🟢 useEffect triggered - loading wallet info');
      loadWalletInfo();
    } else {
      console.log('🟢 useEffect - not connected or no account');
      setWalletInfo(null);
    }
  }, [isConnected, account, loadWalletInfo]);

  // Handle using test transaction data
  const handleUseTestTransaction = (testTxData) => {
    setTestTransactionData({
      to: testTxData.to,
      value: testTxData.valueFormatted.replace(' BDAG', ''),
      data: testTxData.data || '0x'
    });
    setActiveTab('wallet');
  };

  // Clear test transaction data
  const handleClearTestTransaction = () => {
    setTestTransactionData(null);
  };

  // Handle auto-fill from test data button
  const handleAutoFillTestData = useCallback((testData) => {
    console.log('🧪 Auto-filling with test data:', testData);
    setAutoFillData(testData);
    
    // Clear auto-fill data after a moment to allow for re-triggering
    setTimeout(() => {
      setAutoFillData(null);
    }, 1000);
  }, []);

  // Only allow transaction if a smart wallet is loaded
  // FIX: Handle nested wallet structure - walletInfo.wallet.address
  // Use useMemo to prevent excessive re-renders
  const actualWallet = useMemo(() => {
    console.log('🔧 actualWallet calculation:', { walletInfo });
    
    // Try different access patterns
    const wallet = walletInfo?.wallet || walletInfo;
    
    // For any connected account, try to get wallet info from backend
    if (!wallet && account) {
      console.log('🔧 No wallet info available, waiting for backend response for account:', account);
      return null; // Return null instead of mock data
    }
    
    console.log('🔧 Final actualWallet:', wallet);
    return wallet;
  }, [walletInfo, account]);
  
  const isSmartWallet = useMemo(() => {
    console.log('🔍 Smart wallet detection:', { actualWallet, account });
    
    // For real wallets: if actualWallet exists and has an address, consider it a smart wallet
    if (actualWallet?.address && account) {
      // In mock mode, owner might be the same as address, or account
      const owner = actualWallet.owner || actualWallet.address;
      const isOwnerMatch = owner.toLowerCase() === account.toLowerCase();
      
      console.log('🔍 Owner check:', { 
        owner, 
        account, 
        isOwnerMatch,
        actualWalletAddress: actualWallet.address 
      });
      
      return isOwnerMatch;
    }
    
    console.log('🔍 Smart wallet detection failed:', { actualWallet, account });
    return false;
  }, [actualWallet, account]);

  // Enhanced transaction management
  useTransactions(actualWallet?.address, 
    isConnected && window.ethereum ? new ethers.BrowserProvider(window.ethereum) : null,
    { limit: 50, autoRefresh: false, useMockData: false }
  );
  
  // Reduced debug logging to prevent excessive console spam
  if (actualWallet && actualWallet.address) {
    console.log('🟢 Smart wallet detected:', actualWallet.address, 'owned by:', actualWallet.owner);
  }

  const handleCancelSignature = () => {
    console.log('❌ User cancelled signature verification');
    setIsVerificationModalOpen(false);
    setPendingTransaction(null);
    setSignatureToVerify(null);
    setCurrentTransaction(null);
  };

  // Emergency reset function for stuck transactions
  const handleResetTransaction = () => {
    console.log('🔄 Resetting all transaction state');
    setIsVerificationModalOpen(false);
    setPendingTransaction(null);
    setSignatureToVerify(null);
    setCurrentTransaction(null);
    
    // Clear any stale state
    setTimeout(() => {
      console.log('🔄 Transaction state reset complete');
    }, 100);
  };

  // Force refresh nonce for debugging
  const handleForceRefreshNonce = async () => {
    if (!actualWallet?.address) {
      alert('No wallet address available');
      return;
    }
    
    console.log('🔄 Force refreshing nonce for wallet:', actualWallet.address);
    
    try {
      const nonceResult = await getCurrentNonce(actualWallet.address);
      console.log('🔢 Force refresh nonce result:', nonceResult);
      
      if (nonceResult.success) {
        alert(`Current nonce: ${nonceResult.data || 'Unknown'}`);
      } else {
        alert(`Failed to get nonce: ${nonceResult.error}`);
      }
      
      // Also refresh wallet info
      await loadWalletInfo();
    } catch (error) {
      console.error('❌ Error refreshing nonce:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Test transaction function for debugging
  const handleTestTransaction = async () => {
    if (!actualWallet?.address || !account) {
      alert('Wallet not ready for testing');
      return;
    }

    console.log('🧪 Starting test transaction...');
    
    const testTxData = {
      to: account, // Send to self
      value: '0.001', // Small amount
      data: '0x',
      description: 'Test Transaction'
    };

    await handleTransactionSubmit(testTxData);
  };

  // Transaction submit handler: only stage tx data for review
  const handleTransactionSubmit = useCallback(async (txData) => {
    console.log('📝 Transaction submit initiated:', txData);
    
    // Validation checks
    if (!isConnected || !account) {
      alert('Please connect your wallet first');
      return;
    }
    
    if (!isSmartWallet) {
      alert('Please connect a smart wallet to sign and send transactions.');
      return;
    }

    if (!actualWallet) {
      alert('Smart wallet information is loading. Please wait a moment and try again.');
      return;
    }

    if (!actualWallet.address || actualWallet.address === '0x0000000000000000000000000000000000000000') {
      alert('Smart wallet address not available. The smart wallet contract may not be deployed yet. Please check the console for deployment instructions.');
      return;
    }

    // Validate transaction data
    if (!txData.to || !ethers.isAddress(txData.to)) {
      alert('Please enter a valid recipient address');
      return;
    }

    const value = txData.value || '0';
    if (value && isNaN(parseFloat(value))) {
      alert('Please enter a valid amount');
      return;
    }

    console.log('✅ Transaction validation passed');
    
    // Stage transaction for user review
    setSignatureToVerify({
      ...txData,
      signature: null,
      signer: account,
      wallet: actualWallet.address,
      verifyingContract: actualWallet.address,
      timestamp: Date.now()
    });
    
    setIsVerificationModalOpen(true);
    setCurrentTransaction({ status: 'review', ...txData });
    
    console.log('📋 Transaction staged for review');
  }, [isConnected, account, isSmartWallet, actualWallet]);

  // Confirm signature: fetch latest nonce, sign, and relay
  const handleConfirmSignature = async () => {
    console.log('🚀 Starting transaction confirmation...');
    
    if (!signatureToVerify) {
      console.error('❌ No signature data to verify');
      setIsVerificationModalOpen(false);
      return;
    }

    if (!actualWallet?.address) {
      console.error('❌ No wallet address available');
      setCurrentTransaction({ status: 'error', error: 'No wallet address available', ...signatureToVerify });
      setIsVerificationModalOpen(false);
      return;
    }

    try {
      setCurrentTransaction({ status: 'pending', ...signatureToVerify });
      setIsVerificationModalOpen(false);

      console.log('🔢 Fetching latest nonce for wallet:', actualWallet.address);
      
      // Fetch latest nonce with better error handling
      const nonceResult = await getCurrentNonce(actualWallet.address);
      console.log('🔢 Nonce result:', nonceResult);
      
      if (!nonceResult.success) {
        throw new Error(`Failed to get nonce: ${nonceResult.error}`);
      }

      let nonce;
      const data = nonceResult.data;
      
      // Handle different nonce response formats
      if (typeof data === 'number') {
        nonce = data;
      } else if (data?.nonce !== undefined) {
        nonce = data.nonce;
      } else if (data?.data?.nonce !== undefined) {
        nonce = data.data.nonce;
      } else if (data?.data?.data?.nonce !== undefined) {
        nonce = data.data.data.nonce;
      } else {
        throw new Error('Invalid nonce format received from backend');
      }

      console.log('🔢 Using nonce:', nonce);

      // Prepare value with better validation
      let valueInWei;
      const rawValue = signatureToVerify.value || '0';
      
      try {
        if (rawValue === '0' || rawValue === '') {
          valueInWei = '0';
        } else if (rawValue.length > 10 || !rawValue.includes('.')) {
          // Already in wei
          valueInWei = rawValue.toString();
        } else {
          // Convert from ether to wei
          valueInWei = parseEther(rawValue).toString();
        }
        console.log('💰 Value in wei:', valueInWei);
      } catch (valueError) {
        throw new Error(`Invalid value format: ${rawValue}`);
      }

      console.log('✍️ Signing transaction...');
      
      // Sign transaction
      const signResult = await signMetaTransaction(
        actualWallet.address,
        signatureToVerify.to,
        valueInWei,
        signatureToVerify.data || '0x',
        nonce
      );

      if (!signResult.success) {
        throw new Error(signResult.error || 'Failed to sign transaction');
      }

      console.log('✅ Transaction signed successfully');
      console.log('📨 Relaying transaction to backend...');

      // Relay transaction
      const relayData = {
        walletAddress: actualWallet.address,
        to: signatureToVerify.to,
        value: valueInWei,
        data: signatureToVerify.data || '0x',
        nonce,
        signature: signResult.signature
      };

      const relayResult = await relayTransaction(relayData);
      console.log('📨 Relay result:', relayResult);

      if (relayResult.success) {
        console.log('🎉 Transaction succeeded!');
        setCurrentTransaction({ 
          status: 'success', 
          txHash: relayResult.data.txHash, 
          gasSaved: relayResult.data.gasSaved,
          nonce,
          ...signatureToVerify 
        });
        celebrate('success');
        
        // Refresh wallet info after successful transaction
        setTimeout(() => {
          loadWalletInfo();
        }, 2000);
      } else {
        throw new Error(relayResult.error || 'Transaction relay failed');
      }
    } catch (error) {
      console.error('❌ Transaction failed:', error);
      setCurrentTransaction({ 
        status: 'error', 
        error: error.message || 'Unknown error occurred',
        details: error.details || error.stack,
        ...signatureToVerify 
      });
    }
  };

  const handleCloseTransaction = () => { setCurrentTransaction(null); };
  const handleViewTransactionDetails = (txHash) => { window.open(`https://explorer.bdagscan.com/tx/${txHash}`, '_blank'); };

  // Guardians hook - using real blockchain data (moved after state initialization)
  // Use memoized wallet address to prevent re-render loops
  const walletAddress = useMemo(() => actualWallet?.address, [actualWallet?.address]);
  
  const {
    guardians,
    guardianThreshold,
    recoveryRequests,
    addGuardian,
    removeGuardian,
    changeThreshold,
    initiateRecovery,
    approveRecovery,
    loading: guardiansLoading,
    error: guardiansError,
    refresh: refreshGuardians,
    clearError: clearGuardiansError
  } = useGuardians(
    walletAddress,
    isConnected && window.ethereum ? new ethers.BrowserProvider(window.ethereum) : null
  );

  // Debounce loading states to prevent UI blinking
  const debouncedApiLoading = useDebouncedValue(apiLoading, 300);
  const debouncedGuardiansLoading = useDebouncedValue(guardiansLoading, 300);
  const debouncedWalletLoading = useDebouncedValue(walletLoading, 300);

  // Guardian management functions - now connected to real hook functions
  const handleAddGuardian = async (guardianAddress, guardianName) => {
    console.log('🛡️ Adding guardian:', guardianAddress, guardianName);
    try {
      const result = await addGuardian(guardianAddress, guardianName);
      if (result.success) {
        console.log('✅ Guardian added successfully');
        // Refresh guardian data
        await refreshGuardians();
        return result;
      } else {
        console.error('❌ Failed to add guardian:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error adding guardian:', error);
      throw error;
    }
  };

  const handleRemoveGuardian = async (guardianAddress) => {
    console.log('🛡️ Removing guardian:', guardianAddress);
    try {
      const result = await removeGuardian(guardianAddress);
      if (result.success) {
        console.log('✅ Guardian removed successfully');
        // Refresh guardian data
        await refreshGuardians();
        return result;
      } else {
        console.error('❌ Failed to remove guardian:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error removing guardian:', error);
      throw error;
    }
  };

  const handleSetThreshold = async (newThreshold) => {
    console.log('🛡️ Setting threshold:', newThreshold);
    try {
      const result = await changeThreshold(newThreshold);
      if (result.success) {
        console.log('✅ Threshold updated successfully');
        // Refresh guardian data
        await refreshGuardians();
        return result;
      } else {
        console.error('❌ Failed to update threshold:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error updating threshold:', error);
      throw error;
    }
  };

  const handleInitiateRecovery = async (newOwnerAddress) => {
    console.log('🛡️ Initiating recovery for new owner:', newOwnerAddress);
    try {
      const result = await initiateRecovery(newOwnerAddress);
      if (result.success) {
        console.log('✅ Recovery initiated successfully');
        // Refresh guardian data
        await refreshGuardians();
        return result;
      } else {
        console.error('❌ Failed to initiate recovery:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error initiating recovery:', error);
      throw error;
    }
  };

  const handleApproveRecovery = async (walletAddress, newOwnerAddress) => {
    console.log('🛡️ Approving recovery:', walletAddress, newOwnerAddress);
    try {
      const result = await approveRecovery(walletAddress, newOwnerAddress);
      if (result.success) {
        console.log('✅ Recovery approved successfully');
        // Refresh guardian data
        await refreshGuardians();
        return result;
      } else {
        console.error('❌ Failed to approve recovery:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error approving recovery:', error);
      throw error;
    }
  };

  const mockStats = useMemo(() => ({
    transactions: actualWallet?.stats?.total_transactions || 0,
    gas_saved: actualWallet?.stats?.total_gas_saved || 0,
    guardians: guardians.length,
    balance: parseFloat(balance.eth || 0).toFixed(4)
  }), [actualWallet?.stats?.total_transactions, actualWallet?.stats?.total_gas_saved, guardians.length, balance.eth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300 app-container">
      {/* Mobile Navigation */}
      <MobileNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isConnected={isConnected}
        account={account}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={disconnectWallet}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        currentStep={currentStep}
        onNext={nextStep}
        onPrevious={previousStep}
        onSkip={skipOnboarding}
        onComplete={completeOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 dark:bg-purple-600 rounded-lg flex items-center justify-center transition-colors duration-300">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">BlockDAG Smart Wallet</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Gasless Transactions • Social Recovery</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {backendStatus && (
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${backendStatus.success ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">{backendStatus.success ? 'Backend Online' : 'Backend Offline'}</span>
                </div>
              )}
              
              {/* Demo Mode and Tutorial Toggle */}
              <div className="hidden lg:block">
                <DemoModeToggle />
              </div>
              
              {/* Theme Toggle - Desktop */}
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
              
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-300">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 content-wrapper">
        <div className="space-y-8 pb-32 md:pb-8">{/* Increased bottom padding for mobile from pb-20 to pb-32 */}
          {/* Backend Status Alert */}
          {backendStatus && !backendStatus.success && (
            <Alert type="error">Backend is offline. Please start the backend server to use gasless transactions.</Alert>
          )}
          {/* Wallet Error Alert */}
          {walletError && (<Alert type="error" onClose={clearError}>{walletError}</Alert>)}
          {/* API Error Alert */}
          {apiError && (<Alert type="error" onClose={clearError}>{apiError}</Alert>)}
          
          {/* Wallet Header */}
          <WalletHeader account={account} balance={balance} isConnected={isConnected} chainId={chainId} onConnect={handleConnectWallet} onDisconnect={disconnectWallet} loading={debouncedWalletLoading} />
          
          {/* Test Data Panel - shown when connected */}
          {isConnected && (<TestDataPanel onUseTestTransaction={handleUseTestTransaction} onClearTestTransaction={handleClearTestTransaction} selectedTransaction={testTransactionData} onAutoFill={handleAutoFillTestData} />)}
          
          {/* Stats Grid */}
          {isConnected && actualWallet && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-300">Wallet Statistics</h3>
              <StatsGrid stats={mockStats} />
            </div>
          )}
          
          {/* Desktop Tab Navigation */}
          {isConnected && (
            <div className="hidden md:flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg transition-colors duration-300">
              {[
                { id: 'wallet', label: 'Wallet', icon: Zap, className: 'wallet-connect-button' }, 
                { id: 'transactions', label: 'Transactions', icon: Activity, className: 'transaction-tab' },
                { id: 'guardians', label: 'Social Recovery', icon: Shield, className: 'guardians-tab' }
              ].map(tab => (
                <StableButton
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  variant={activeTab === tab.id ? 'primary' : 'secondary'}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 ${tab.className || ''}`}
                  aria-pressed={activeTab === tab.id}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </StableButton>
              ))}
            </div>
          )}
          {/* Tab Content */}
          {isConnected && activeTab === 'wallet' && (
            <div className="space-y-6">
              {/* Test Data Button */}
              <TestDataButton 
                onUseTestData={handleAutoFillTestData}
                disabled={!isConnected || !isSmartWallet || !actualWallet}
              />
              
              {/* Debug: Reset stuck transaction */}
              {currentTransaction?.status === 'verifying' && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Transaction Stuck in Verification
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Modal: {isVerificationModalOpen ? 'Open' : 'Closed'} | Signature: {signatureToVerify ? 'Present' : 'Missing'}
                      </p>
                    </div>
                    <Button
                      onClick={handleResetTransaction}
                      variant="secondary"
                      size="sm"
                    >
                      Reset Transaction
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Debug: Force refresh nonce */}
              {actualWallet?.address && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Debug: Nonce Management
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Wallet: {actualWallet.address} | Current Nonce: {actualWallet.nonce || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleForceRefreshNonce}
                        variant="secondary"
                        size="sm"
                      >
                        Refresh Nonce
                      </Button>
                      <Button
                        onClick={handleTestTransaction}
                        variant="secondary"
                        size="sm"
                      >
                        Test Transaction
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Transaction Interface */}
              {isConnected && isSmartWallet && actualWallet && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Send Transaction</h3>
                  <StableTransactionForm
                    onSubmit={handleTransactionSubmit}
                    isSubmitting={debouncedApiLoading || debouncedWalletLoading}
                    disabled={!isConnected || !isSmartWallet || !actualWallet}
                    initialValues={testTransactionData || {}}
                    autoFillData={autoFillData}
                  />
                </div>
              )}

              {/* Warning for non-smart wallet users */}
              {isConnected && (!isSmartWallet || !actualWallet) && (
                <div className="space-y-4">
                  <Alert type="warning">
                    {!actualWallet ? (
                      <>
                        <strong>Smart Wallet Not Found</strong><br/>
                        No smart wallet found for address: {account}<br/>
                        You need to deploy a smart wallet contract first.
                      </>
                    ) : (
                      <>
                        Please connect a smart wallet to sign and send transactions.<br/>
                        (Current address: {account})
                      </>
                    )}
                  </Alert>

                  {/* Deploy Wallet Interface */}
                  {!actualWallet && account && (
                    <FixedWalletDeployer 
                      account={account} 
                      onDeployment={(walletInfo) => {
                        console.log('🚀 Wallet deployed:', walletInfo);
                        // Set the wallet info immediately
                        setWalletInfo({ wallet: walletInfo });
                        // Also refresh from backend
                        setTimeout(() => {
                          loadWalletInfo();
                        }, 2000);
                      }} 
                    />
                  )}
                </div>
              )}
            </div>
          )}
          {/* Transaction Dashboard Tab */}
          {isConnected && activeTab === 'transactions' && (
            <TransactionDashboard
              walletAddress={walletAddress || account}
              provider={isConnected && window.ethereum ? new ethers.BrowserProvider(window.ethereum) : null}
              explorerUrl="https://explorer.bdagscan.com"
              useMockData={false} // You can now toggle this in the UI
            />
          )}
          {/* Guardian Dashboard Tab */}
          {isConnected && activeTab === 'guardians' && (
            <div>
              {/* Guardian Error Alert */}
              {guardiansError && (
                <Alert type="error" className="mb-4">
                  <span>Guardian Error: {guardiansError}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearGuardiansError}
                    className="ml-2"
                  >
                    Dismiss
                  </Button>
                </Alert>
              )}
              
              <GuardianDashboard 
                walletAddress={walletAddress || account} 
                currentGuardians={guardians} 
                threshold={guardianThreshold} 
                onAddGuardian={handleAddGuardian} 
                onRemoveGuardian={handleRemoveGuardian} 
                onSetThreshold={handleSetThreshold} 
                onInitiateRecovery={handleInitiateRecovery} 
                onApproveRecovery={handleApproveRecovery} 
                recoveryRequests={recoveryRequests} 
                isOwner={isSmartWallet} 
                isGuardian={guardians.some(guardian => 
                  (guardian.address || guardian).toLowerCase() === account?.toLowerCase()
                )}
                loading={debouncedGuardiansLoading || debouncedApiLoading}
              />
            </div>
          )}
        </div>
        
        {/* Mobile scroll buffer to ensure content is fully scrollable */}
        <div className="mobile-scroll-buffer md:hidden"></div>
      </main>
      
      {/* Transaction Status Modal */}
      <TransactionStatus transaction={currentTransaction} onClose={handleCloseTransaction} onViewDetails={handleViewTransactionDetails} />
      
      {/* Signature Verification Modal */}
      <SignatureVerificationModal
        isOpen={isVerificationModalOpen}
        onConfirm={handleConfirmSignature}
        onCancel={handleCancelSignature}
        signatureData={signatureToVerify}
      />
    </div>
  );
}

export default App;
