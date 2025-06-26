import { useState, useEffect, useCallback, useMemo } from 'react';
import GuardianService from '../services/guardianService';

const useGuardians = (walletAddress, provider) => {
  const [guardians, setGuardians] = useState([]);
  const [guardianThreshold, setGuardianThreshold] = useState(0);
  const [recoveryRequests, setRecoveryRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use useMemo to create a stable guardianService instance
  const guardianService = useMemo(() => new GuardianService(), []);

  // Initialize service
  useEffect(() => {
    const initializeService = async () => {
      if (provider) {
        let signer = null;
        try {
          if (provider.getSigner) {
            signer = await provider.getSigner();
          }
        } catch (error) {
          console.log('Could not get signer:', error.message);
        }
        
        await guardianService.initialize(provider, signer);
      }
    };

    initializeService();
  }, [provider, guardianService]);

  const loadGuardianData = useCallback(async () => {
    if (!walletAddress || !provider) return;

    setLoading(true);
    setError(null);

    try {
      // Load guardians
      const guardiansList = await guardianService.getGuardians(walletAddress);
      setGuardians(guardiansList);

      // Load threshold
      const threshold = await guardianService.getGuardianThreshold(walletAddress);
      setGuardianThreshold(threshold);

      // Load recovery requests
      const recoveryRequest = await guardianService.getRecoveryRequest(walletAddress);
      setRecoveryRequests(recoveryRequest ? [recoveryRequest] : []);

    } catch (err) {
      console.error('Error loading guardian data:', err);
      setError(err.message);
      
      // Fallback to mock data if contract calls fail
      setGuardians([
        { 
          address: '0x1234567890123456789012345678901234567890', 
          name: 'Alice (Sister) - Mock',
          status: 'active'
        },
        { 
          address: '0x2345678901234567890123456789012345678901', 
          name: 'Bob (Best Friend) - Mock',
          status: 'active'
        }
      ]);
      setGuardianThreshold(2);
      setRecoveryRequests([]);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, provider, guardianService]);

  const setupEventListeners = useCallback(() => {
    if (!walletAddress || !provider) return;

    const cleanup = guardianService.setupEventListeners(
      walletAddress,
      (guardian) => {
        // Guardian added - reload data
        loadGuardianData();
      },
      (guardian) => {
        // Guardian removed - reload data
        loadGuardianData();
      },
      (eventType, newOwner, guardian) => {
        // Recovery event - reload data
        loadGuardianData();
      }
    );

    return cleanup;
  }, [walletAddress, provider, guardianService, loadGuardianData]);

  // Guardian management functions
  const addGuardian = useCallback(async (guardianAddress, guardianName) => {
    if (!walletAddress || !provider) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const signer = await provider.getSigner();
      await guardianService.initialize(provider, signer);
      await guardianService.connectToWallet(walletAddress);
      await guardianService.addGuardian(guardianAddress, guardianName);
      
      // Reload data after successful addition
      await loadGuardianData();
      
      return { success: true };
    } catch (err) {
      console.error('Error adding guardian:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [walletAddress, provider, guardianService, loadGuardianData]);

  const removeGuardian = useCallback(async (guardianAddress) => {
    if (!walletAddress || !provider) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const signer = await provider.getSigner();
      await guardianService.initialize(provider, signer);
      await guardianService.connectToWallet(walletAddress);
      await guardianService.removeGuardian(guardianAddress);
      
      // Reload data after successful removal
      await loadGuardianData();
      
      return { success: true };
    } catch (err) {
      console.error('Error removing guardian:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [walletAddress, provider, guardianService, loadGuardianData]);

  const deployWallet = useCallback(async (threshold) => {
    if (!provider) {
      throw new Error('Provider not available');
    }

    setLoading(true);
    setError(null);

    try {
      const signer = await provider.getSigner();
      await guardianService.initialize(provider, signer);
      
      const walletAddress = await guardianService.deployWallet(threshold);
      
      return { success: true, walletAddress };
    } catch (err) {
      console.error('Error deploying wallet:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [provider, guardianService]);

  const changeThreshold = useCallback(async (newThreshold) => {
    if (!walletAddress || !provider) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const signer = await provider.getSigner();
      await guardianService.initialize(provider, signer);
      await guardianService.connectToWallet(walletAddress);
      await guardianService.changeThreshold(newThreshold);
      
      // Reload data after successful change
      await loadGuardianData();
      
      return { success: true };
    } catch (err) {
      console.error('Error changing threshold:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [walletAddress, provider, guardianService, loadGuardianData]);

  const initiateRecovery = useCallback(async (newOwnerAddress) => {
    if (!walletAddress || !provider) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const signer = await provider.getSigner();
      await guardianService.initialize(provider, signer);
      await guardianService.connectToWallet(walletAddress);
      await guardianService.initiateRecovery(newOwnerAddress);
      
      // Reload data after successful initiation
      await loadGuardianData();
      
      return { success: true };
    } catch (err) {
      console.error('Error initiating recovery:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [walletAddress, provider, guardianService, loadGuardianData]);

  const approveRecovery = useCallback(async (walletAddress, newOwnerAddress) => {
    if (!provider) {
      throw new Error('Provider not available');
    }

    setLoading(true);
    setError(null);

    try {
      const signer = await provider.getSigner();
      await guardianService.initialize(provider, signer);
      await guardianService.approveRecovery(walletAddress, newOwnerAddress);
      
      // Reload data after successful approval
      await loadGuardianData();
      
      return { success: true };
    } catch (err) {
      console.error('Error approving recovery:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [provider, guardianService, loadGuardianData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refresh = useCallback(() => {
    loadGuardianData();
  }, [loadGuardianData]);

  // Load guardian data when wallet address changes
  useEffect(() => {
    if (walletAddress && provider && guardianService) {
      loadGuardianData();
      const cleanup = setupEventListeners();
      
      // Cleanup function
      return () => {
        if (cleanup) {
          cleanup();
        }
        if (guardianService && guardianService.cleanup) {
          guardianService.cleanup();
        }
      };
    }
  }, [walletAddress, provider, guardianService, loadGuardianData, setupEventListeners]);

  return {
    // State
    guardians,
    guardianThreshold,
    recoveryRequests,
    loading,
    error,
    
    // Actions
    addGuardian,
    removeGuardian,
    changeThreshold,
    initiateRecovery,
    approveRecovery,
    deployWallet,
    clearError,
    refresh,
    
    // Service instance for advanced usage
    guardianService
  };
};

export default useGuardians;
