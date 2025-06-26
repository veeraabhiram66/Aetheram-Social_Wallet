import { ethers } from 'ethers';

// Smart Wallet ABI (key functions for guardian management)
const SMART_WALLET_ABI = [
  "function getGuardians() view returns (address[])",
  "function getGuardianCount() view returns (uint256)",
  "function requiredApprovals() view returns (uint256)",
  "function isGuardian(address) view returns (bool)",
  "function addGuardian(address guardian) external",
  "function removeGuardian(address guardian) external",
  "function setRecoveryThreshold(uint256 _newThreshold) external",
  "function initiateRecovery(address newOwner) external",
  "function approveRecovery() external",
  "function finalizeRecovery() external",
  "function getRecoveryInfo() view returns (bool exists, address newOwner, uint256 approvals, uint256 requiredApprovals_, uint256 initiatedAt, uint256 expiresAt, bool executed, bool canFinalize)",
  "function owner() view returns (address)",
  "event GuardianAdded(address indexed guardian)",
  "event GuardianRemoved(address indexed guardian)",
  "event RecoveryInitiated(address indexed newOwner)",
  "event RecoveryApproved(address indexed guardian, address indexed newOwner)",
  "event RecoveryExecuted(address indexed newOwner)"
];

// Smart Wallet Factory ABI
const FACTORY_ABI = [
  "function deployWallet(address owner, bytes32 salt) external payable returns (address)",
  "function predictWalletAddress(address owner, bytes32 salt) view returns (address)",
  "function implementation() view returns (address)"
];

class GuardianService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.walletContract = null;
    this.factoryContract = null;
  }

  async initialize(provider, signer) {
    this.provider = provider;
    this.signer = signer;

    // Contract addresses from environment
    const implementationAddress = process.env.REACT_APP_SMART_WALLET_IMPLEMENTATION_ADDRESS;
    const factoryAddress = process.env.REACT_APP_SMART_WALLET_FACTORY_ADDRESS;

    if (factoryAddress) {
      this.factoryContract = new ethers.Contract(factoryAddress, FACTORY_ABI, signer);
    }

    return { implementationAddress, factoryAddress };
  }

  async connectToWallet(walletAddress) {
    if (!this.signer) {
      throw new Error('Signer not initialized');
    }

    this.walletContract = new ethers.Contract(walletAddress, SMART_WALLET_ABI, this.signer);
    return this.walletContract;
  }
  async getGuardians(walletAddress) {
    try {
      const contract = walletAddress ? 
        new ethers.Contract(walletAddress, SMART_WALLET_ABI, this.provider) : 
        this.walletContract;

      if (!contract) {
        throw new Error('No wallet contract available');
      }

      // Use getGuardians() instead of iterating with guardiansCount()
      const guardianAddresses = await contract.getGuardians();
      
      const guardians = [];
      for (const guardianAddress of guardianAddresses) {
        guardians.push({
          address: guardianAddress,
          name: this.getGuardianName(guardianAddress), // You can enhance this with actual name resolution
          status: 'active'
        });
      }

      return guardians;
    } catch (error) {
      console.error('Error fetching guardians:', error);
      throw error;
    }
  }
  async getGuardianThreshold(walletAddress) {
    try {
      const contract = walletAddress ? 
        new ethers.Contract(walletAddress, SMART_WALLET_ABI, this.provider) : 
        this.walletContract;

      if (!contract) {
        throw new Error('No wallet contract available');
      }

      // Use requiredApprovals instead of guardianThreshold
      const threshold = await contract.requiredApprovals();
      return Number(threshold);
    } catch (error) {
      console.error('Error fetching guardian threshold:', error);
      throw error;
    }
  }

  async addGuardian(guardianAddress) {
    try {
      if (!this.walletContract) {
        throw new Error('Wallet contract not connected');
      }

      const tx = await this.walletContract.addGuardian(guardianAddress);
      return await tx.wait();
    } catch (error) {
      console.error('Error adding guardian:', error);
      throw error;
    }
  }

  async removeGuardian(guardianAddress) {
    try {
      if (!this.walletContract) {
        throw new Error('Wallet contract not connected');
      }

      const tx = await this.walletContract.removeGuardian(guardianAddress);
      return await tx.wait();
    } catch (error) {
      console.error('Error removing guardian:', error);
      throw error;
    }
  }
  async changeThreshold(newThreshold) {
    try {
      if (!this.walletContract) {
        throw new Error('Wallet contract not connected');
      }

      // Use setRecoveryThreshold instead of changeThreshold
      const tx = await this.walletContract.setRecoveryThreshold(newThreshold);
      return await tx.wait();
    } catch (error) {
      console.error('Error changing threshold:', error);
      throw error;
    }
  }
  async initiateRecovery(newOwnerAddress) {
    try {
      if (!this.walletContract) {
        throw new Error('Wallet contract not connected');
      }

      // Use initiateRecovery, not executeRecovery
      const tx = await this.walletContract.initiateRecovery(newOwnerAddress);
      return await tx.wait();
    } catch (error) {
      console.error('Error initiating recovery:', error);
      throw error;
    }
  }

  async approveRecovery() {
    try {
      if (!this.walletContract) {
        throw new Error('Wallet contract not connected');
      }

      // approveRecovery takes no parameters
      const tx = await this.walletContract.approveRecovery();
      return await tx.wait();
    } catch (error) {
      console.error('Error approving recovery:', error);
      throw error;
    }
  }

  async finalizeRecovery() {
    try {
      if (!this.walletContract) {
        throw new Error('Wallet contract not connected');
      }

      // finalizeRecovery takes no parameters
      const tx = await this.walletContract.finalizeRecovery();
      return await tx.wait();
    } catch (error) {
      console.error('Error finalizing recovery:', error);
      throw error;
    }
  }

  async getRecoveryRequest(walletAddress) {
    try {
      const contract = walletAddress ? 
        new ethers.Contract(walletAddress, SMART_WALLET_ABI, this.provider) : 
        this.walletContract;

      if (!contract) {
        throw new Error('No wallet contract available');
      }      const recoveryInfo = await contract.getRecoveryInfo();
      
      if (!recoveryInfo.exists) {
        return null; // No pending recovery
      }

      return {
        id: 1, // You might want to use a hash or block number as ID
        newOwner: recoveryInfo.newOwner,
        approvalCount: Number(recoveryInfo.approvals),
        requiredApprovals: Number(recoveryInfo.requiredApprovals_),
        status: recoveryInfo.canFinalize ? 'approved' : 'pending',
        createdAt: new Date(Number(recoveryInfo.initiatedAt) * 1000).toISOString(),
        expiresAt: new Date(Number(recoveryInfo.expiresAt) * 1000).toISOString(),
        executed: recoveryInfo.executed
      };
    } catch (error) {
      console.error('Error fetching recovery request:', error);
      throw error;
    }
  }

  async deployWallet(ownerAddress, guardianAddresses, threshold) {
    try {
      if (!this.factoryContract) {
        throw new Error('Factory contract not available');
      }

      const salt = ethers.randomBytes(32);
      const predictedAddress = await this.factoryContract.predictWalletAddress(ownerAddress, salt);
      
      console.log('Predicted wallet address:', predictedAddress);

      const tx = await this.factoryContract.deployWallet(ownerAddress, salt);
      const receipt = await tx.wait();

      // After deployment, we'd need to set up guardians
      // This would require additional contract calls

      return {
        walletAddress: predictedAddress,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error deploying wallet:', error);
      throw error;
    }
  }

  // Helper method to get guardian names (you can enhance this)
  getGuardianName(address) {
    // This is a simple mapping - in a real app, you might store names in local storage
    // or have a name resolution service
    const knownAddresses = {
      '0x1234567890123456789012345678901234567890': 'Alice (Sister)',
      '0x2345678901234567890123456789012345678901': 'Bob (Best Friend)',
      '0x3456789012345678901234567890123456789012': 'Carol (Backup)',
    };

    return knownAddresses[address] || `Guardian ${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Event listeners for real-time updates
  setupEventListeners(walletAddress, onGuardianAdded, onGuardianRemoved, onRecoveryEvent) {
    if (!this.provider) return;

    const contract = new ethers.Contract(walletAddress, SMART_WALLET_ABI, this.provider);

    contract.on('GuardianAdded', (guardian) => {
      onGuardianAdded && onGuardianAdded(guardian);
    });

    contract.on('GuardianRemoved', (guardian) => {
      onGuardianRemoved && onGuardianRemoved(guardian);
    });

    contract.on('RecoveryInitiated', (newOwner) => {
      onRecoveryEvent && onRecoveryEvent('initiated', newOwner);
    });

    contract.on('RecoveryApproved', (guardian, newOwner) => {
      onRecoveryEvent && onRecoveryEvent('approved', newOwner, guardian);
    });

    return () => {
      contract.removeAllListeners();
    };
  }
}

export default GuardianService;
